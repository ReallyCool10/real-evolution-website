// Address parsing shared by every enrichment pass. Land Registry addresses ("Flat 2, 10-14
// High St, London (SW1A 1AA)") and OpenStreetMap tags ("addr:street=High Street") are
// normalised into comparable keys: a cleaned street name and a list of house numbers.
//
// Tests in address.test.js pin its behaviour.

/** Postcode as a lookup key: upper case, no spaces ("bs9 3aa" -> "BS93AA"). */
export function postcodeKey(pc) {
  if (!pc) return '';
  return pc.replace(/\s+/g, '').toUpperCase();
}

/** Postcode in stored form: upper case, single inner space kept ("bs9 3aa " -> "BS9 3AA"). */
export function normalisePostcode(pc) {
  if (!pc) return '';
  return pc.trim().toUpperCase();
}

// "St" before one of these names means Saint, not Street ("St Pauls Road").
const SAINT_NAMES = ['stephen', 'stephens', 'paul', 'pauls', 'peter', 'peters', 'nicholas', 'john', 'johns', 'mary', 'marys', 'george', 'georges', 'andrew', 'andrews', 'james', 'albans', 'giles', 'jude', 'judes', 'clements', 'thomas'];
const ABBREVIATIONS = { rd: 'road', st: 'street', ave: 'avenue', ln: 'lane', dr: 'drive', cres: 'crescent', pl: 'place', sq: 'square', ter: 'terrace', ct: 'court', bvd: 'boulevard', blvd: 'boulevard' };

/** Street name as a lookup key: lower case, abbreviations expanded, punctuation removed. */
export function cleanStreet(st) {
  if (!st) return '';
  return st.toLowerCase()
    .replace(/\bst\.\s+/g, 'saint ')
    .replace(/\bst\s+([a-z]+)/g, (m, name) => (SAINT_NAMES.includes(name) ? 'saint ' + name : m))
    .replace(/\b(rd|st|ave|ln|dr|cres|pl|sq|ter|ct|bvd|blvd)\b/g, m => ABBREVIATIONS[m] || m)
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** House number as a lookup key: "12A" -> "12a", "1-3" -> "13" (callers expand ranges first). */
export function cleanHouseNum(num) {
  if (!num) return '';
  return num.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

/**
 * Every house number a number string refers to. Ranges of up to 20 expand, stepping by 2
 * when both ends share parity (one side of a street): "10-14" -> 10, 12, 14. Lists are
 * split: "16, 18 and 20" -> 16, 18, 20.
 */
export function expandHouseNumbers(rawStr) {
  if (!rawStr) return [];
  const str = rawStr.trim();

  if (/^\d+[a-z]?$/i.test(str)) return [cleanHouseNum(str)];

  const rangeMatch = str.match(/^(\d+)\s*(?:to|-|\/)\s*(\d+)$/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && end > start && end - start <= 20) {
      const step = (end - start) % 2 === 0 ? 2 : 1;
      const list = [];
      for (let n = start; n <= end; n += step) list.push(String(n));
      return list;
    }
    return [String(start), String(end)];
  }

  const allNums = str.match(/\b\d+[a-z]?\b/gi);
  if (allNums && allNums.length > 0) return allNums.map(n => cleanHouseNum(n));

  return [cleanHouseNum(str)];
}

export const STREET_SUFFIXES = 'road|rd|street|st|avenue|ave|lane|ln|drive|dr|close|gardens|crescent|cres|place|pl|square|sq|terrace|ter|court|ct|grove|mews|row|rise|parade|park|wharf|boulevard|bvd|blvd|gate|broadway|quay|circus|reach|meadow|mead|bank|corner|end|view|green|alley|highway|passage|approach|side|mall|buildings|mansions|chambers';

// A street name runs up to the *last* street-type word in its segment: "Green Lane" (not
// "Green"), "Westbourne Grove Mews" (not "Westbourne Grove"). Segments are comma-free, so
// the match can never run on into the town.
// Full stops are allowed so "St. Mary Road" survives (cleanStreet turns "st." into "saint").
const STREET = `([A-Za-z.\\s]+\\b(?:${STREET_SUFFIXES}))\\b`;
const HOUSE_NUMBERS = '\\d+[a-z]?(?:\\s*(?:to|-|\\/|&|and|,)\\s*\\d+[a-z]?)*';
// "<numbers> <street>", e.g. "10-14 High Street".
const ADDRESS_REGEX = new RegExp(`(\\b${HOUSE_NUMBERS})\\s+${STREET}`, 'i');
// A segment that *starts* with a street name, once any house numbers are removed.
const LEADING_STREET_REGEX = new RegExp(`^${STREET}`, 'i');
const LEADING_NUMBERS_REGEX = new RegExp(`^${HOUSE_NUMBERS}\\s+`, 'i');

// Collapses whitespace and drops a trailing bracketed postcode: "... London (SW1A 1AA)".
function tidy(address) {
  return address.replace(/\s+/g, ' ').replace(/\([A-Z0-9\s]+\)$/i, '').trim();
}

// Drops descriptions that come before the actual address: "Land at the rear of",
// "Part of", "Ground floor flat,", "Flat 3, Unit 2,". "Part of" is followed by the address
// itself ("Part of 12 High St"), so unlike "Flat 3," it is removed on its own.
function stripPrefixes(clean) {
  return clean
    .replace(/^part\s+of\s+/i, '')
    .replace(/^(?:land\s+(?:and\s+buildings\s+)?(?:at\s+the\s+rear\s+of|on\s+the\s+(?:north|south|east|west)\s+side\s+of|lying\s+to\s+the\s+(?:north|south|east|west)\s+of|adjoining)\s+)/i, '')
    .replace(/^(?:(?:ground|first|second|third|fourth|fifth|top)\s+floor(?:\s+flat|\s+suite)?\s*,\s*)/i, '')
    .replace(/^(?:(?:flat|unit|suite|room|apartment|floor)\s+[^,]+,\s*)+/i, '');
}

/**
 * House numbers and street from a Land Registry property address. Strips "land at the rear
 * of", floor and flat/unit prefixes first, so "Flat 3, 12 High St" gives 12 / "high street".
 * Returns { houseNums: [], street: null } when nothing usable is found.
 */
export function parseLRAddress(address) {
  if (!address) return { houseNums: [], street: null };

  const clean = stripPrefixes(tidy(address));

  const match = clean.match(ADDRESS_REGEX);
  if (match) return { houseNums: expandHouseNumbers(match[1]), street: cleanStreet(match[2]) };

  for (const part of clean.split(',').map(s => s.trim())) {
    const partMatch = part.match(ADDRESS_REGEX);
    if (partMatch) return { houseNums: expandHouseNumbers(partMatch[1]), street: cleanStreet(partMatch[2]) };
    const numMatch = part.match(/^(\d+[a-z]?(?:\s*(?:to|-|\/|&|and|,)\s*\d+[a-z]?)*)\s+(.+)$/i);
    if (numMatch) return { houseNums: expandHouseNumbers(numMatch[1]), street: cleanStreet(numMatch[2]) };
  }

  return { houseNums: [], street: null };
}

const NOT_A_STREET = ['bristol', 'london', 'the', 'unit', 'floor', 'ground floor', 'first floor'];

/**
 * Street name alone (no house number needed), for street-level matching: the first
 * comma-separated segment that begins with a street name once house numbers are removed.
 * "The Old Rectory, Church Road" -> "church road"; "1 St Pauls Road" -> "saint pauls road".
 */
export function extractStreet(address) {
  if (!address) return null;
  for (const segment of stripPrefixes(tidy(address)).split(',')) {
    const m = segment.trim().replace(LEADING_NUMBERS_REGEX, '').match(LEADING_STREET_REGEX);
    if (m) {
      const st = cleanStreet(m[1]);
      if (st.length >= 3 && !NOT_A_STREET.includes(st)) return st;
    }
  }
  return null;
}
