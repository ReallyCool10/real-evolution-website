import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cadastre.sqlite');
const POSTCODES_CSV = 'C:/Dev/real-evolution-website/DATA/ukpostcodes.csv';

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

// 2. Open SQLite Database with high-performance PRAGMAs
const db = new DatabaseSync(DB_PATH);
db.exec(`
  PRAGMA synchronous = OFF;
  PRAGMA journal_mode = WAL;
  PRAGMA cache_size = -128000;
  PRAGMA temp_store = MEMORY;
`);

// 3. Populate postcodes table with exact unit postcodes
console.log('Seeding SQLite postcodes table with full UK unit postcodes...');
db.exec('DROP TABLE IF EXISTS postcodes;');
db.exec(`
  CREATE TABLE postcodes (
    postcode TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );
`);

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

// Query only properties with postcodes
const selectStmt = db.prepare(`
  SELECT id, postcode, title_number
  FROM properties
  WHERE postcode IS NOT NULL AND postcode != ''
`);

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

db.exec(`
  DROP TABLE IF EXISTS outcode_summary;
  CREATE TABLE outcode_summary AS
  SELECT 
    TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1)) AS outcode,
    COUNT(*) AS total_count,
    SUM(CASE WHEN dataset_type = 'CCOD' THEN 1 ELSE 0 END) AS ccod_count,
    SUM(CASE WHEN dataset_type = 'OCOD' THEN 1 ELSE 0 END) AS ocod_count,
    ROUND(AVG(price_paid)) AS avg_price,
    ROUND(AVG(latitude), 5) AS latitude,
    ROUND(AVG(longitude), 5) AS longitude
  FROM properties
  WHERE latitude IS NOT NULL
    AND postcode IS NOT NULL
    AND postcode != ''
  GROUP BY outcode
  HAVING outcode != '' AND COUNT(*) >= 5;

  CREATE INDEX idx_outcode_summary_coords ON outcode_summary(latitude, longitude);
  CREATE INDEX idx_outcode_summary_code ON outcode_summary(outcode);
`);

console.log('Building sector_summary...');
db.exec(`
  DROP TABLE IF EXISTS sector_summary;
  CREATE TABLE sector_summary AS
  SELECT 
    TRIM(SUBSTR(postcode, 1, INSTR(postcode, ' ') + 1)) AS sector,
    TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1)) AS outcode,
    COUNT(*) AS total_count,
    SUM(CASE WHEN dataset_type = 'CCOD' THEN 1 ELSE 0 END) AS ccod_count,
    SUM(CASE WHEN dataset_type = 'OCOD' THEN 1 ELSE 0 END) AS ocod_count,
    ROUND(AVG(price_paid)) AS avg_price,
    ROUND(AVG(latitude), 5) AS latitude,
    ROUND(AVG(longitude), 5) AS longitude
  FROM properties
  WHERE latitude IS NOT NULL
    AND postcode IS NOT NULL
    AND INSTR(postcode, ' ') > 0
  GROUP BY sector
  HAVING sector != '' AND COUNT(*) >= 3;

  CREATE INDEX idx_sector_summary_coords ON sector_summary(latitude, longitude);
  CREATE INDEX idx_sector_summary_code ON sector_summary(sector);
`);

console.log(`LOD summaries rebuilt in ${((Date.now() - tLod) / 1000).toFixed(2)}s.`);

// Verify stats
const outCount = db.prepare('SELECT COUNT(*) as c FROM outcode_summary').get();
const secCount = db.prepare('SELECT COUNT(*) as c FROM sector_summary').get();
console.log(`  - Outcodes: ${outCount.c.toLocaleString()}`);
console.log(`  - Sectors: ${secCount.c.toLocaleString()}`);

console.log('\nOptimizing database indexes...');
db.exec('PRAGMA optimize;');
db.close();

console.log(`=== Pipeline Complete in ${((Date.now() - t0) / 1000).toFixed(2)}s ===`);
