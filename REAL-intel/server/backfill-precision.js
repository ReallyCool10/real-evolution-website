import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');
const DB_PATH = path.join(__dirname, 'cadastre.sqlite');

console.log('=== REAL Intel: Fast Precision Level Backfill ===');
console.log(`Cache Directory: ${CACHE_DIR}`);

if (!fs.existsSync(CACHE_DIR)) {
  console.error('Cache directory not found!');
  process.exit(1);
}

const args = process.argv.slice(2);
const areaArg = args.find(a => a.startsWith('--area='))?.split('=')[1]?.toUpperCase();
const outcodeArg = args.find(a => a.startsWith('--outcode='))?.split('=')[1]?.toUpperCase();

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA synchronous = NORMAL;');
db.exec('PRAGMA busy_timeout = 15000;');

let cacheFiles = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('addresses_') && f.endsWith('.json'));

if (outcodeArg) {
  cacheFiles = cacheFiles.filter(f => f.toUpperCase() === `ADDRESSES_${outcodeArg}.JSON`);
} else if (areaArg) {
  if (areaArg === 'BS' || areaArg === 'BRISTOL') {
    cacheFiles = cacheFiles.filter(f => f.toUpperCase().startsWith('ADDRESSES_BS'));
  } else if (areaArg === 'LONDON') {
    const londonPrefixes = ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'];
    cacheFiles = cacheFiles.filter(f => {
      const oc = f.replace('addresses_', '').replace('.json', '').toUpperCase();
      return londonPrefixes.some(p => oc.startsWith(p));
    });
  }
}

console.log(`Found ${cacheFiles.length} cached outcode files to evaluate.`);

const cleanPostcode = (pc) => (pc ? pc.replace(/\s+/g, '').toUpperCase() : '');

function cleanStreet(st) {
  if (!st) return '';
  return st.toLowerCase()
    .replace(/\b(rd|st|ave|ln|dr|cres|pl|sq|ter|ct|bvd|blvd)\b/g, (m) => {
      const map = { rd: 'road', st: 'street', ave: 'avenue', ln: 'lane', dr: 'drive', cres: 'crescent', pl: 'place', sq: 'square', ter: 'terrace', ct: 'court', bvd: 'boulevard', blvd: 'boulevard' };
      return map[m] || m;
    })
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHouseNum(num) {
  if (!num) return '';
  return num.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function expandNumberRange(rangeStr) {
  if (!rangeStr) return [];
  const str = rangeStr.trim();
  const rangeMatch = str.match(/^(\d+)\s*(?:to|-|\/)\s*(\d+)$/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && end > start && end - start <= 20) {
      const step = ((end - start) % 2 === 0) ? 2 : 1;
      const list = [];
      for (let n = start; n <= end; n += step) list.push(String(n));
      return list;
    }
    return [String(start), String(end)];
  }
  return [cleanHouseNum(str)];
}

function parseLRAddress(address) {
  if (!address) return { houseNums: [], street: null };
  let clean = address.replace(/\s+/g, ' ').replace(/\([A-Z0-9\s]+\)$/i, '').trim();
  clean = clean.replace(/^(?:land\s+(?:and\s+buildings\s+)?(?:at\s+the\s+rear\s+of|on\s+the\s+(?:north|south|east|west)\s+side\s+of|lying\s+to\s+the\s+(?:north|south|east|west)\s+of|adjoining)\s+)/i, '');
  clean = clean.replace(/^(?:(?:ground|first|second|third|fourth|fifth|top)\s+floor(?:\s+flat|\s+suite)?\s*,\s*)/i, '');
  clean = clean.replace(/^(?:(?:flat|unit|suite|room|apartment|part\s+of|floor)\s+[^,]+,\s*)+/i, '');

  const streetSuffixes = 'Road|Street|Avenue|Lane|Way|Drive|Close|Gardens|Crescent|Place|Walk|Square|Hill|Terrace|Yard|Court|Grove|Mews|Row|Rise|Parade|Park|Wharf|Boulevard|Gate|Broadway|Quay|Circus|Reach|Meadow|Bank|Corner|End|View|Green|Alley|Highway|Passage|Approach|Rise|Side|Circus|Row|Mall|Buildings|Mansions|Chambers';
  const match = clean.match(new RegExp(`(\\b\\d+[a-z]?(?:\\s*(?:to|-|\\/|&|and)\\s*\\d+[a-z]?)?)\\s+([A-Za-z\\s]+(?:${streetSuffixes}))\\b`, 'i'));

  if (match) {
    const rawNum = match[1].toLowerCase();
    const street = cleanStreet(match[2]);
    const nums = expandNumberRange(rawNum);
    return { houseNums: nums, street };
  }

  const parts = clean.split(',').map(s => s.trim());
  for (const part of parts) {
    const numMatch = part.match(/^(\d+[a-z]?(?:\s*(?:to|-|\/)\s*\d+[a-z]?)?)\s+(.+)$/i);
    if (numMatch) {
      return { houseNums: expandNumberRange(numMatch[1]), street: cleanStreet(numMatch[2]) };
    }
  }
  return { houseNums: [], street: null };
}

const getPropsStmt = db.prepare(`
  SELECT id, property_address, postcode, latitude, longitude
  FROM properties 
  WHERE postcode >= ? AND postcode <= ?
    AND (precision_level IS NULL OR precision_level = 'ESTIMATED')
`);

const updatePrecisionStmt = db.prepare(`
  UPDATE properties 
  SET latitude = ?, longitude = ?, precision_level = 'EXACT_OSM' 
  WHERE id = ?
`);

let totalMarked = 0;
const t0 = Date.now();

for (let i = 0; i < cacheFiles.length; i++) {
  const file = cacheFiles[i];
  const outcode = file.replace('addresses_', '').replace('.json', '');
  const filePath = path.join(CACHE_DIR, file);

  let elements = [];
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(raw);
    elements = Array.isArray(data) ? data : (data.elements || []);
  } catch (err) {
    continue;
  }

  if (elements.length === 0) continue;

  const postcodeHouseMap = new Map();
  const streetHouseMap = new Map();

  for (const el of elements) {
    const lat = el.lat || (el.center && el.center.lat);
    const lon = el.lon || (el.center && el.center.lon);
    if (!lat || !lon || !el.tags) continue;

    const rawHNum = el.tags['addr:housenumber'];
    if (!rawHNum) continue;

    const pc = cleanPostcode(el.tags['addr:postcode']);
    const st = cleanStreet(el.tags['addr:street']);
    const numCandidates = expandNumberRange(rawHNum);

    for (const num of numCandidates) {
      if (pc) postcodeHouseMap.set(`${pc}__${num}`, { lat, lon });
      if (st) streetHouseMap.set(`${st}__${num}`, { lat, lon });
    }
  }

  const lower = outcode + ' ';
  const upper = outcode + ' ~';
  const props = getPropsStmt.all(lower, upper);

  let markedInOutcode = 0;
  db.exec('BEGIN TRANSACTION;');

  for (const prop of props) {
    const { houseNums, street } = parseLRAddress(prop.property_address);
    const pc = cleanPostcode(prop.postcode);

    let matchCoord = null;
    for (const num of houseNums) {
      if (pc && postcodeHouseMap.has(`${pc}__${num}`)) {
        matchCoord = postcodeHouseMap.get(`${pc}__${num}`);
        break;
      }
    }

    if (!matchCoord && street) {
      for (const num of houseNums) {
        if (streetHouseMap.has(`${street}__${num}`)) {
          matchCoord = streetHouseMap.get(`${street}__${num}`);
          break;
        }
      }
    }

    if (matchCoord) {
      updatePrecisionStmt.run(matchCoord.lat, matchCoord.lon, prop.id);
      markedInOutcode++;
    }
  }

  db.exec('COMMIT;');
  totalMarked += markedInOutcode;

  if ((i + 1) % 15 === 0 || i === cacheFiles.length - 1) {
    console.log(`[Backfill ${i + 1}/${cacheFiles.length}] Outcode ${outcode}: marked ${markedInOutcode} (Total exact marked so far: ${totalMarked.toLocaleString()})`);
  }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n=======================================================`);
console.log(`[Complete] Backfilled precision_level = 'EXACT_OSM' on ${totalMarked.toLocaleString()} properties in ${elapsed}s!`);
console.log(`=======================================================`);

// Verify summary in DB
const summary = db.prepare(`
  SELECT COALESCE(precision_level, 'ESTIMATED') as level, COUNT(*) as count 
  FROM properties 
  GROUP BY level
`).all();

console.log('\nUpdated Database Precision Distribution:');
summary.forEach(s => console.log(` - ${s.level}: ${Number(s.count).toLocaleString()}`));

db.close();
