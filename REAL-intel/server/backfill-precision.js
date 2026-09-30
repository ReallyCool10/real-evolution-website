import { openDatabase } from './connection.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');

console.log('=== REAL Intel: Fast Precision Level Backfill (Enhanced Address Parser) ===');

if (!fs.existsSync(CACHE_DIR)) {
  console.error('No cache directory found at:', CACHE_DIR);
  process.exit(1);
}

const args = process.argv.slice(2);
const areaArg = args.find(a => a.startsWith('--area='))?.split('=')[1]?.toUpperCase();
const outcodeArg = args.find(a => a.startsWith('--outcode='))?.split('=')[1]?.toUpperCase();

const db = openDatabase();

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

  // Single number (e.g. 12, 12a)
  if (/^\d+[a-z]?$/i.test(str)) {
    return [cleanHouseNum(str)];
  }

  // Range: 10-14, 10 to 14, 10/14
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

  // Multiple comma or "and" separated numbers: "16, 18, 20 and 22", "25 and 27"
  const allNums = str.match(/\b\d+[a-z]?\b/gi);
  if (allNums && allNums.length > 0) {
    return allNums.map(n => cleanHouseNum(n));
  }

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
    const rawNum = match[1];
    const street = cleanStreet(match[2]);
    const nums = expandNumbers(rawNum);
    return { houseNums: nums, street };
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

// Queries properties that are NOT currently EXACT_OSM (so ESTIMATED or EXACT_UPRN can be upgraded!)
const getPropsStmt = db.prepare(`
  SELECT id, property_address, postcode, latitude, longitude
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
    SUM(CASE WHEN precision_level IS NULL OR precision_level = 'ESTIMATED' THEN 1 ELSE 0 END) as estimated
  FROM properties 
  WHERE postcode >= ? AND postcode <= ?
`);

const upsertProgress = db.prepare(`
  INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status, last_updated)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(outcode) DO UPDATE SET
    total_properties = excluded.total_properties,
    matched_properties = excluded.matched_properties,
    match_percentage = excluded.match_percentage,
    status = excluded.status,
    last_updated = excluded.last_updated
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

  // Build high-speed lookup maps
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

    if (num && street && pc) {
      exactMap.set(`${pc}|${street}|${num}`, { lat, lon });
    }
    if (num && street) {
      if (!streetNumMap.has(`${street}|${num}`)) {
        streetNumMap.set(`${street}|${num}`, { lat, lon });
      }
    }
  }

  const lower = outcode + ' ';
  const upper = outcode + ' ~';
  const props = getPropsStmt.all(lower, upper);
  if (props.length === 0) continue;

  let markedThisOutcode = 0;
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
      markedThisOutcode++;
      totalMarked++;
    }
  }

  db.exec('COMMIT;');

  // Update progress record
  const afterStats = getStatsForOutcode.get(lower, upper);
  if (afterStats && afterStats.total > 0) {
    const totalPrecision = (afterStats.exact_osm || 0) + (afterStats.exact_uprn || 0);
    const precisionPct = Number(((totalPrecision / afterStats.total) * 100).toFixed(1));
    const region = outcode.startsWith('BS') ? 'Bristol' : 'London';
    upsertProgress.run(outcode, region, afterStats.total, totalPrecision, precisionPct, 'COMPLETED');
  }

  if ((i + 1) % 15 === 0 || i === cacheFiles.length - 1) {
    console.log(`[Backfill ${i + 1}/${cacheFiles.length}] Outcode ${outcode}: newly marked ${markedThisOutcode} EXACT_OSM (Total newly upgraded so far: ${totalMarked.toLocaleString()})`);
  }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`\n=======================================================`);
console.log(`[Complete] Upgraded ${totalMarked.toLocaleString()} properties to EXACT_OSM in ${elapsed}s!`);
console.log(`=======================================================\n`);

const summary = db.prepare(`
  SELECT COALESCE(precision_level, 'ESTIMATED') as level, count(*) as count 
  FROM properties 
  GROUP BY level
`).all();

console.log('Updated Database Precision Distribution:');
for (const s of summary) {
  console.log(` - ${s.level}: ${s.count.toLocaleString()}`);
}

db.close();
