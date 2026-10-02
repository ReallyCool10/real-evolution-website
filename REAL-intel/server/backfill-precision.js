import { openDatabase } from './connection.js';
import { recordOutcodeProgress } from './progress.js';
import { cleanHouseNum, cleanStreet, parseLRAddress, postcodeKey } from './address.js';
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
    const pc = postcodeKey(tags['addr:postcode']);

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

    const propPc = postcodeKey(p.postcode);
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
  recordOutcodeProgress(db, outcode, outcode.startsWith('BS') ? 'Bristol' : 'London');

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
