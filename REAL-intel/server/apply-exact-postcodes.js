// Geocodes every not-yet-enriched property to its unit postcode centroid, falling back to the
// outcode centroid, then rebuilds the map summaries. Needs DATA/ukpostcodes.csv.
import fs from 'node:fs';
import readline from 'node:readline';
import { openDatabase } from './connection.js';
import { DB_PATH, dataPath } from './paths.js';
import { rebuildLodSummaries } from './summaries.js';

const POSTCODES_CSV = dataPath('ukpostcodes.csv');

if (!fs.existsSync(POSTCODES_CSV)) {
  console.error(`Error: ${POSTCODES_CSV} not found!`);
  process.exit(1);
}

console.log('=== REAL Cadastre Exact Address Geocoding Pipeline ===');
console.log(`Loading unit postcodes from: ${POSTCODES_CSV}`);
console.log(`Updating database: ${DB_PATH}`);

const t0 = Date.now();

// 1. Load all 1.74M UK Unit Postcodes into high-speed memory maps
const unitPostcodeMap = new Map();
const outcodeSums = new Map(); // for fallback: outcode -> { sumLat, sumLon, count }

const fileStream = fs.createReadStream(POSTCODES_CSV);
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let lineIdx = 0;
for await (const line of rl) {
  if (lineIdx++ === 0) continue; // skip header: id,postcode,latitude,longitude
  const c1 = line.indexOf(',');
  const c2 = line.indexOf(',', c1 + 1);
  const c3 = line.indexOf(',', c2 + 1);
  if (c1 === -1 || c2 === -1 || c3 === -1) continue;

  const rawPc = line.slice(c1 + 1, c2).trim();
  const lat = parseFloat(line.slice(c2 + 1, c3));
  const lon = parseFloat(line.slice(c3 + 1));
  if (isNaN(lat) || isNaN(lon)) continue;

  const cleanPc = rawPc.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  unitPostcodeMap.set(cleanPc, { lat, lon });

  // Outcode accumulator
  const parts = rawPc.split(/\s+/);
  const outcode = parts[0].toUpperCase();
  let outEntry = outcodeSums.get(outcode);
  if (!outEntry) {
    outEntry = { sumLat: 0, sumLon: 0, count: 0 };
    outcodeSums.set(outcode, outEntry);
  }
  outEntry.sumLat += lat;
  outEntry.sumLon += lon;
  outEntry.count++;
}

console.log(`Loaded ${unitPostcodeMap.size.toLocaleString()} unit postcodes in ${((Date.now() - t0) / 1000).toFixed(2)}s`);

// Compute outcode averages for fallback
const outcodeMap = new Map();
for (const [code, val] of outcodeSums.entries()) {
  outcodeMap.set(code, {
    lat: Math.round((val.sumLat / val.count) * 1000000) / 1000000,
    lon: Math.round((val.sumLon / val.count) * 1000000) / 1000000
  });
}
console.log(`Generated ${outcodeMap.size.toLocaleString()} outcode fallback centroids.`);

// 2. Open the database. Keeps the shared WAL/NORMAL durability settings: this runs against
// the live database, so disabling syncs could corrupt it on a crash or power cut.
const db = openDatabase();
db.exec('PRAGMA cache_size = -128000; PRAGMA temp_store = MEMORY;');

// 3. Populate postcodes table with exact unit postcodes
console.log('Seeding SQLite postcodes table with full UK unit postcodes...');
db.exec('DELETE FROM postcodes;');

const stmtInsertPc = db.prepare('INSERT INTO postcodes (postcode, latitude, longitude) VALUES (?, ?, ?)');
db.exec('BEGIN TRANSACTION;');
let pcCount = 0;
for (const [pc, coords] of unitPostcodeMap.entries()) {
  stmtInsertPc.run(pc, coords.lat, coords.lon);
  pcCount++;
  if (pcCount % 100000 === 0) {
    db.exec('COMMIT;');
    db.exec('BEGIN TRANSACTION;');
  }
}
db.exec('COMMIT;');
console.log(`Seeded ${pcCount.toLocaleString()} postcodes in SQLite.`);

// 4. Update properties table with exact address points
console.log('Updating all properties with exact address coordinates...');
const tUpdate = Date.now();

// Only properties still on estimated coordinates. Rows an enrichment pass has matched to an
// exact address (EXACT_OSM, EXACT_UPRN) or street (STREET_UPRN) keep their better position;
// overwriting them here would leave precision_level claiming an accuracy the row no longer has.
const selectStmt = db.prepare(`
  SELECT id, postcode, title_number
  FROM properties
  WHERE postcode IS NOT NULL AND postcode != ''
    AND (precision_level IS NULL OR precision_level = 'ESTIMATED')
`);
const enrichedCount = db
  .prepare("SELECT COUNT(*) AS c FROM properties WHERE precision_level IS NOT NULL AND precision_level != 'ESTIMATED'")
  .get().c;
console.log(`Keeping ${enrichedCount.toLocaleString()} enriched properties at their matched coordinates.`);

const updateStmt = db.prepare('UPDATE properties SET latitude = ?, longitude = ? WHERE id = ?');

db.exec('BEGIN TRANSACTION;');
let updatedCount = 0;
let exactMatches = 0;
let outcodeFallbacks = 0;
let unmatched = 0;

for (const prop of selectStmt.all()) {
  const rawPc = prop.postcode;
  const clean = rawPc.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  
  let coords = unitPostcodeMap.get(clean);
  if (coords) {
    exactMatches++;
  } else {
    // Try outcode fallback without artificial dispersal
    const parts = rawPc.trim().toUpperCase().split(/\s+/);
    coords = outcodeMap.get(parts[0]);
    if (coords) {
      outcodeFallbacks++;
    } else {
      unmatched++;
      coords = null;
    }
  }

  if (coords) {
    updateStmt.run(coords.lat, coords.lon, prop.id);
  } else {
    updateStmt.run(null, null, prop.id);
  }

  updatedCount++;
  if (updatedCount % 50000 === 0) {
    db.exec('COMMIT;');
    const rate = Math.round(updatedCount / ((Date.now() - tUpdate) / 1000));
    console.log(`Updated ${updatedCount.toLocaleString()} properties... (${rate.toLocaleString()} rows/s)`);
    db.exec('BEGIN TRANSACTION;');
  }
}
db.exec('COMMIT;');

console.log(`\nProperties Geocoding Finished in ${((Date.now() - tUpdate) / 1000).toFixed(2)}s:`);
console.log(`  - Total Processed: ${updatedCount.toLocaleString()}`);
console.log(`  - Exact Unit Postcode Matches: ${exactMatches.toLocaleString()} (${((exactMatches / updatedCount) * 100).toFixed(2)}%)`);
console.log(`  - Outcode Centroid Fallbacks: ${outcodeFallbacks.toLocaleString()} (${((outcodeFallbacks / updatedCount) * 100).toFixed(2)}%)`);
console.log(`  - Unmatched / Rural Land: ${unmatched.toLocaleString()}`);

// 5. Rebuild LOD summary tables (outcode_summary and sector_summary) from real coordinates
console.log('\nRebuilding LOD summary tables (outcode_summary & sector_summary)...');
const tLod = Date.now();

const { outcodes, sectors } = rebuildLodSummaries(db);

console.log(`LOD summaries rebuilt in ${((Date.now() - tLod) / 1000).toFixed(2)}s.`);

// Verify stats
console.log(`  - Outcodes: ${outcodes.toLocaleString()}`);
console.log(`  - Sectors: ${sectors.toLocaleString()}`);

console.log('\nOptimizing database indexes...');
db.exec('PRAGMA optimize;');
db.close();

console.log(`=== Pipeline Complete in ${((Date.now() - t0) / 1000).toFixed(2)}s ===`);
