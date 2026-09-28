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

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 15000;');

const cacheFiles = fs.readdirSync(CACHE_DIR).filter(f => f.startsWith('addresses_') && f.endsWith('.json'));
console.log(`Found ${cacheFiles.length} cached outcode files to evaluate.`);

const cleanPostcode = (pc) => (pc ? pc.replace(/\s+/g, '').toUpperCase() : '');

const STREET_SUFFIXES = [
  'ROAD', 'STREET', 'AVENUE', 'LANE', 'DRIVE', 'WAY', 'CLOSE', 'COURT',
  'CRESCENT', 'GARDENS', 'GROVE', 'HILL', 'PARK', 'PLACE', 'SQUARE',
  'TERRACE', 'MEWS', 'WALK', 'RISE', 'ROW', 'YARD', 'PARADE', 'CIRCUS',
  'BROADWAY', 'WHARF', 'QUAY', 'APPROACH', 'PASSAGE', 'ALLEY'
];
const SUFFIX_REGEX = new RegExp(`\\b(${STREET_SUFFIXES.join('|')})\\b`, 'i');

function parseLRAddress(address) {
  if (!address) return { houseNums: [], street: null };
  const cleaned = address.toUpperCase().replace(/[\r\n]+/g, ', ');
  const parts = cleaned.split(',').map(p => p.trim()).filter(Boolean);

  let houseNums = [];
  let street = null;

  for (const part of parts) {
    if (part.startsWith('FLAT') || part.startsWith('UNIT') || part.startsWith('SUITE') ||
        part.startsWith('APARTMENT') || part.startsWith('ROOM') || part.startsWith('FLOOR')) {
      continue;
    }

    const rangeMatch = part.match(/\b(\d+)\s*(?:-|TO|\/)\s*(\d+)\b/i);
    if (rangeMatch && !houseNums.length) {
      const start = parseInt(rangeMatch[1], 10);
      const end = parseInt(rangeMatch[2], 10);
      if (end >= start && end - start <= 20) {
        for (let n = start; n <= end; n++) houseNums.push(String(n));
      } else {
        houseNums.push(rangeMatch[1], rangeMatch[2]);
      }
    }

    const numMatch = part.match(/\b(\d+[A-Z]?)\b/);
    if (numMatch && !houseNums.length) {
      houseNums.push(numMatch[1]);
    }

    if (!street && SUFFIX_REGEX.test(part)) {
      const idx = part.search(SUFFIX_REGEX);
      const m = part.match(SUFFIX_REGEX);
      const endIdx = idx + m[0].length;
      let candidate = part.slice(0, endIdx).replace(/^\d+[A-Z]?\s*,?\s*/, '').trim();
      candidate = candidate.replace(/^(NORTH|SOUTH|EAST|WEST|UPPER|LOWER|OLD|NEW|GREAT|LITTLE)\s+/i, '');
      if (candidate.length > 2) street = candidate;
    }
  }

  return { houseNums, street };
}

const getPropsStmt = db.prepare(`
  SELECT id, property_address, postcode 
  FROM properties 
  WHERE postcode >= ? AND postcode <= ?
`);

const updatePrecisionStmt = db.prepare(`
  UPDATE properties 
  SET precision_level = 'EXACT_OSM' 
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
    elements = data.elements || [];
  } catch (err) {
    continue;
  }

  if (elements.length === 0) continue;

  const postcodeHouseMap = new Map();
  const streetHouseMap = new Map();

  for (const el of elements) {
    const lat = el.lat || (el.center && el.center.lat);
    const lon = el.lon || (el.center && el.center.lon);
    if (!lat || !lon) continue;

    const tags = el.tags || {};
    const houseNum = tags['addr:housenumber'] ? tags['addr:housenumber'].toUpperCase().trim() : null;
    const rawPc = tags['addr:postcode'];
    const streetName = tags['addr:street'] ? tags['addr:street'].toUpperCase().trim() : null;

    if (houseNum && rawPc) {
      const pc = cleanPostcode(rawPc);
      postcodeHouseMap.set(`${pc}__${houseNum}`, { lat, lon });
    }
    if (houseNum && streetName) {
      streetHouseMap.set(`${streetName}__${houseNum}`, { lat, lon });
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

    let matched = false;
    for (const num of houseNums) {
      if (pc && postcodeHouseMap.has(`${pc}__${num}`)) {
        matched = true;
        break;
      }
    }

    if (!matched && street) {
      for (const num of houseNums) {
        if (streetHouseMap.has(`${street}__${num}`)) {
          matched = true;
          break;
        }
      }
    }

    if (matched) {
      updatePrecisionStmt.run(prop.id);
      markedInOutcode++;
    }
  }

  db.exec('COMMIT;');
  totalMarked += markedInOutcode;

  if ((i + 1) % 25 === 0 || i === cacheFiles.length - 1) {
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

console.log('Updated Database Precision Distribution:');
summary.forEach(s => console.log(` - ${s.level}: ${Number(s.count).toLocaleString()}`));

db.close();
