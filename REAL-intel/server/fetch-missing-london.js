import { openDatabase } from './connection.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const db = openDatabase();

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

function cleanPostcode(pc) {
  if (!pc) return '';
  return pc.replace(/\s+/g, '').toUpperCase();
}

function cleanStreet(st) {
  if (!st) return '';
  return st.toLowerCase()
    .replace(/\bst\.\s+/g, 'saint ')
    .replace(/\bst\s+([a-z]+)/g, (m, name) => {
      const saintNames = ['stephen', 'stephens', 'paul', 'pauls', 'peter', 'peters', 'nicholas', 'john', 'johns', 'mary', 'marys', 'george', 'georges', 'andrew', 'andrews', 'james', 'albans', 'giles', 'jude', 'judes', 'clements', 'thomas'];
      if (saintNames.includes(name)) return 'saint ' + name;
      return m;
    })
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

function expandNumbers(rawStr) {
  if (!rawStr) return [];
  const str = rawStr.trim();
  if (/^\d+[a-z]?$/i.test(str)) return [cleanHouseNum(str)];

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

  const allNums = str.match(/\b\d+[a-z]?\b/gi);
  if (allNums && allNums.length > 0) return allNums.map(n => cleanHouseNum(n));
  return [cleanHouseNum(str)];
}

const SUFFIXES = 'road|rd|street|st|avenue|ave|lane|ln|drive|dr|close|gardens|crescent|cres|place|pl|square|sq|terrace|ter|court|ct|grove|mews|row|rise|parade|park|wharf|boulevard|bvd|blvd|gate|broadway|quay|circus|reach|meadow|mead|bank|corner|end|view|green|alley|highway|passage|approach|side|mall|buildings|mansions|chambers';
const ADDRESS_REGEX = new RegExp(`(\\b\\d+[a-z]?(?:\\s*(?:to|-|\\/|&|and|,)\\s*\\d+[a-z]?)*)\\s+([A-Za-z\\s]+?\\b(?:${SUFFIXES}))\\b`, 'i');

function parseLRAddress(address) {
  if (!address) return { houseNums: [], street: null };
  let clean = address.replace(/\s+/g, ' ').replace(/\([A-Z0-9\s]+\)$/i, '').trim();
  clean = clean.replace(/^(?:land\s+(?:and\s+buildings\s+)?(?:at\s+the\s+rear\s+of|on\s+the\s+(?:north|south|east|west)\s+side\s+of|lying\s+to\s+the\s+(?:north|south|east|west)\s+of|adjoining)\s+)/i, '');
  clean = clean.replace(/^(?:(?:ground|first|second|third|fourth|fifth|top)\s+floor(?:\s+flat|\s+suite)?\s*,\s*)/i, '');
  clean = clean.replace(/^(?:(?:flat|unit|suite|room|apartment|part\s+of|floor)\s+[^,]+,\s*)+/i, '');

  const match = clean.match(ADDRESS_REGEX);
  if (match) {
    return { houseNums: expandNumbers(match[1]), street: cleanStreet(match[2]) };
  }

  const parts = clean.split(',').map(s => s.trim());
  for (const part of parts) {
    const partMatch = part.match(ADDRESS_REGEX);
    if (partMatch) {
      return { houseNums: expandNumbers(partMatch[1]), street: cleanStreet(partMatch[2]) };
    }
    const numMatch = part.match(/^(\d+[a-z]?(?:\s*(?:to|-|\/|&|and|,)\s*\d+[a-z]?)*)\s+(.+)$/i);
    if (numMatch) {
      return { houseNums: expandNumbers(numMatch[1]), street: cleanStreet(numMatch[2]) };
    }
  }

  return { houseNums: [], street: null };
}

const getBoundsStmt = db.prepare(`
  SELECT min(latitude) as minLat, max(latitude) as maxLat, min(longitude) as minLon, max(longitude) as maxLon
  FROM properties
  WHERE postcode >= ? AND postcode <= ? AND latitude IS NOT NULL
`);

const getPropsStmt = db.prepare(`
  SELECT id, property_address, postcode
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
    AND (precision_level IS NULL OR precision_level != 'EXACT_OSM')
`);

const updatePrecisionStmt = db.prepare(`
  UPDATE properties 
  SET latitude = ?, longitude = ?, precision_level = 'EXACT_OSM' 
  WHERE id = ?
`);

const getStatsForOutcode = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN precision_level = 'EXACT_OSM' THEN 1 ELSE 0 END) as exact_osm,
    SUM(CASE WHEN precision_level = 'EXACT_UPRN' THEN 1 ELSE 0 END) as exact_uprn,
    SUM(CASE WHEN precision_level = 'STREET_UPRN' THEN 1 ELSE 0 END) as street_uprn,
    SUM(CASE WHEN precision_level IS NULL OR precision_level = 'ESTIMATED' THEN 1 ELSE 0 END) as estimated
  FROM properties 
  WHERE postcode >= ? AND postcode <= ?
`);

const upsertProgress = db.prepare(`
  INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status, last_updated)
  VALUES (?, 'London', ?, ?, ?, 'COMPLETED', datetime('now'))
  ON CONFLICT(outcode) DO UPDATE SET
    total_properties = excluded.total_properties,
    matched_properties = excluded.matched_properties,
    match_percentage = excluded.match_percentage,
    status = excluded.status,
    last_updated = excluded.last_updated
`);

async function fetchOutcodeNodes(outcode) {
  const cacheFile = path.join(CACHE_DIR, `addresses_${outcode}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const els = Array.isArray(cached) ? cached : (cached.elements || []);
      if (els.length > 0) return els;
    } catch {}
  }

  const lower = `${outcode} `;
  const upper = `${outcode} ~`;
  const b = getBoundsStmt.get(lower, upper);
  if (!b || !b.minLat) return null;

  const minLat = (b.minLat - 0.003).toFixed(4);
  const maxLat = (b.maxLat + 0.003).toFixed(4);
  const minLon = (b.minLon - 0.003).toFixed(4);
  const maxLon = (b.maxLon + 0.003).toFixed(4);

  const query = `[out:json][timeout:40];(node["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon});way["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon}););out center;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const res = await fetch(mirror, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RealIntel-PrecisionRunner/2.0'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const text = await res.text();
      if (!text.startsWith('{')) continue;

      const json = JSON.parse(text);
      if (Array.isArray(json.elements) && json.elements.length > 0) {
        fs.writeFileSync(cacheFile, JSON.stringify(json.elements));
        return json.elements;
      }
    } catch {
      // try next mirror
    }
  }
  return null;
}

export async function processOutcode(outcode) {
  const lower = `${outcode} `;
  const upper = `${outcode} ~`;

  const elements = await fetchOutcodeNodes(outcode);
  if (!elements || elements.length === 0) {
    console.log(`[Overpass] ${outcode}: No nodes returned or mirrors throttled.`);
    return 0;
  }

  // Build maps
  const exactMap = new Map();
  const streetNumMap = new Map();

  for (const el of elements) {
    const tags = el.tags || {};
    const lat = el.lat !== undefined ? el.lat : el.center?.lat;
    const lon = el.lon !== undefined ? el.lon : el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const num = cleanHouseNum(tags['addr:housenumber']);
    const street = cleanStreet(tags['addr:street']);
    const pc = cleanPostcode(tags['addr:postcode']);

    if (num && street && pc) exactMap.set(`${pc}|${street}|${num}`, { lat, lon });
    if (num && street && !streetNumMap.has(`${street}|${num}`)) streetNumMap.set(`${street}|${num}`, { lat, lon });
  }

  const props = getPropsStmt.all(lower, upper);
  let newlyUpgraded = 0;

  db.exec('BEGIN TRANSACTION;');
  for (const p of props) {
    const { houseNums, street } = parseLRAddress(p.property_address);
    if (!street || houseNums.length === 0) continue;

    const propPc = cleanPostcode(p.postcode);
    let coords = null;
    for (const num of houseNums) {
      if (propPc) {
        coords = exactMap.get(`${propPc}|${street}|${num}`);
        if (coords) break;
      }
      coords = streetNumMap.get(`${street}|${num}`);
      if (coords) break;
    }

    if (coords) {
      updatePrecisionStmt.run(coords.lat, coords.lon, p.id);
      newlyUpgraded++;
    }
  }
  db.exec('COMMIT;');

  const s = getStatsForOutcode.get(lower, upper);
  if (s && s.total > 0) {
    const precisionCount = (s.exact_osm || 0) + (s.exact_uprn || 0) + (s.street_uprn || 0);
    const pct = Number(((precisionCount / s.total) * 100).toFixed(1));
    upsertProgress.run(outcode, s.total, precisionCount, pct);
  }

  console.log(`[Overpass Completed] Outcode ${outcode}: ${elements.length.toLocaleString()} OSM nodes fetched -> ${newlyUpgraded.toLocaleString()} newly upgraded to EXACT_OSM (Doorway)`);
  return newlyUpgraded;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const TARGET_OUTCODES = [
  'NW10', 'E17',  'SW16', 'NW9',  'W5',   'E11',  'N9',   'SE9',
  'E12',  'N19',  'SE19', 'SE17', 'SE20', 'E9',   'SE26', 'N3',
  'N12',  'N18',  'SE4',  'SE3',  'SE14', 'W1T',  'W1U',  'NW5',
  'N13',  'SE27', 'W1J',  'W13',  'N11',  'NW7',  'SE8',  'W7',
  'N10',  'SE7',  'EC1A', 'EC2A', 'WC1X', 'WC1E', 'EC4N', 'WC2E',
  'EC1B', 'EC2',  'EC3',  'EC4',  'WC1',  'WC2',  'SW1'
];

async function runBatch() {
  console.log(`\nStarting polite batch fetch across ${TARGET_OUTCODES.length} London outcodes...`);
  let grandTotal = 0;
  for (let i = 0; i < TARGET_OUTCODES.length; i++) {
    const oc = TARGET_OUTCODES[i];
    console.log(`\n[${i + 1}/${TARGET_OUTCODES.length}] Fetching Overpass for ${oc}...`);
    try {
      const count = await processOutcode(oc);
      grandTotal += count;
    } catch (e) {
      console.error(`Error processing ${oc}:`, e.message);
    }
    await sleep(2500);
  }
  console.log(`\n=======================================================`);
  console.log(`[All Complete] Upgraded ${grandTotal.toLocaleString()} properties to EXACT_OSM!`);
  console.log(`=======================================================\n`);
  db.close();
}

const arg = process.argv[2]?.toUpperCase();
if (arg === '--ALL') {
  runBatch();
} else if (arg) {
  processOutcode(arg).then(() => db.close());
} else {
  console.log('Usage: node server/fetch-missing-london.js <OUTCODE> | --all');
  process.exit(0);
}
