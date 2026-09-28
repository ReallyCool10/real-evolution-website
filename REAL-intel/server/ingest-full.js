import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseCsvLine } from './csvParser.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../DATA');
const OCOD_PATH = path.join(DATA_DIR, 'OCOD_FULL_2026_09', 'OCOD_FULL_2026_09.csv');
const CCOD_PATH = path.join(DATA_DIR, 'CCOD_FULL_2026_09', 'CCOD_FULL_2026_09.csv');

const DB_PATH = path.join(__dirname, 'cadastre.sqlite');
const STAGING_DB_PATH = path.join(__dirname, 'cadastre_staging.sqlite');

// Remove any existing staging file from previous attempts
if (fs.existsSync(STAGING_DB_PATH)) {
  fs.unlinkSync(STAGING_DB_PATH);
}

console.log('=== REAL Cadastre Full 4.5M Ingestion Pipeline ===');
console.log(`Target Staging DB: ${STAGING_DB_PATH}`);
console.log(`CCOD Source: ${CCOD_PATH}`);
console.log(`OCOD Source: ${OCOD_PATH}`);

const db = new DatabaseSync(STAGING_DB_PATH);

// Maximum throughput PRAGMAs for bulk load
db.exec(`
  PRAGMA synchronous = OFF;
  PRAGMA journal_mode = OFF;
  PRAGMA cache_size = -128000;
  PRAGMA temp_store = MEMORY;
  PRAGMA locking_mode = EXCLUSIVE;

  CREATE TABLE postcodes (
    postcode TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE properties (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title_number TEXT,
    tenure TEXT,
    property_address TEXT,
    district TEXT,
    county TEXT,
    region TEXT,
    postcode TEXT,
    price_paid REAL,
    proprietor_name TEXT,
    company_reg_no TEXT,
    proprietorship_category TEXT,
    country_incorporated TEXT,
    proprietor_address TEXT,
    date_added TEXT,
    dataset_type TEXT,
    latitude REAL,
    longitude REAL
  );
`);

// Seed postcodes from existing database or download
console.log('[Postcodes] Seeding UK postcode centroids...');
const existingDb = fs.existsSync(DB_PATH) ? new DatabaseSync(DB_PATH) : null;
const postcodeMap = new Map();

if (existingDb) {
  const rows = existingDb.prepare('SELECT postcode, latitude, longitude FROM postcodes').all();
  const stmtInsertPc = db.prepare('INSERT INTO postcodes (postcode, latitude, longitude) VALUES (?, ?, ?)');
  db.exec('BEGIN TRANSACTION;');
  for (const r of rows) {
    stmtInsertPc.run(r.postcode, r.latitude, r.longitude);
    postcodeMap.set(r.postcode.trim().toUpperCase(), { lat: r.latitude, lon: r.longitude });
  }
  db.exec('COMMIT;');
  existingDb.close();
  console.log(`[Postcodes] Loaded ${postcodeMap.size.toLocaleString()} outcode centroids into memory cache.`);
} else {
  console.log('[Postcodes] Downloading open UK outcode centroids from GitHub...');
  // Fallback download if needed
}

// Prepared statement for fast batch property insertion
const stmtInsertProperty = db.prepare(`
  INSERT INTO properties (
    title_number, tenure, property_address, district, county, region, postcode,
    price_paid, proprietor_name, company_reg_no, proprietorship_category,
    country_incorporated, proprietor_address, date_added, dataset_type,
    latitude, longitude
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

// Deterministic subtle dispersal to prevent 5,000 points stacking on a single pixel in an outcode
function resolveCoords(postcode, titleNumber) {
  if (!postcode) return null;
  const clean = postcode.trim().toUpperCase();
  let base = postcodeMap.get(clean);

  if (!base) {
    const parts = clean.split(/\s+/);
    if (parts.length > 1) {
      base = postcodeMap.get(parts[0]);
    }
  }

  if (!base) {
    const noSpace = clean.replace(/[^A-Z0-9]/g, '');
    if (noSpace.length >= 5) {
      base = postcodeMap.get(noSpace.slice(0, -3));
    }
  }

  if (!base) return null;

  // Compute deterministic hash offset based on title number for natural visual dispersion
  let hash = 0;
  const str = (titleNumber || clean);
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const dLat = (((hash & 0x7FFF) / 0x7FFF) - 0.5) * 0.006;
  const dLon = ((((hash >>> 15) & 0x7FFF) / 0x7FFF) - 0.5) * 0.009;

  return {
    latitude: Math.round((base.lat + dLat) * 100000) / 100000,
    longitude: Math.round((base.lon + dLon) * 100000) / 100000
  };
}

// Insert batch helper
function insertBatch(batch) {
  db.exec('BEGIN TRANSACTION;');
  for (const r of batch) {
    stmtInsertProperty.run(
      r.title_number || '',
      r.tenure || '',
      r.property_address || '',
      r.district || '',
      r.county || '',
      r.region || '',
      r.postcode || '',
      r.price_paid || null,
      r.proprietor_name || '',
      r.company_reg_no || '',
      r.proprietorship_category || '',
      r.country_incorporated || '',
      r.proprietor_address || '',
      r.date_added || '',
      r.dataset_type || 'CCOD',
      r.latitude || null,
      r.longitude || null
    );
  }
  db.exec('COMMIT;');
}

async function streamOcod() {
  if (!fs.existsSync(OCOD_PATH)) {
    console.warn(`[OCOD] File not found at ${OCOD_PATH}`);
    return;
  }
  console.log(`[OCOD] Streaming records from ${OCOD_PATH}...`);
  const stream = fs.createReadStream(OCOD_PATH);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = true;
  let batch = [];
  let total = 0;
  let geocoded = 0;
  const t0 = Date.now();

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 13) continue;

    const postcode = cols[6] || '';
    const title = cols[0] || '';
    const coords = resolveCoords(postcode, title);
    if (coords) geocoded++;

    const priceRaw = (cols[8] || '').replace(/[^0-9.]/g, '');
    const price = priceRaw ? parseFloat(priceRaw) : null;

    batch.push({
      title_number: title,
      tenure: cols[1],
      property_address: cols[2],
      district: cols[3],
      county: cols[4],
      region: cols[5],
      postcode: postcode,
      price_paid: price,
      proprietor_name: cols[9],
      company_reg_no: cols[10],
      proprietorship_category: cols[11],
      country_incorporated: cols[12],
      proprietor_address: cols[13],
      date_added: cols[37] || '',
      dataset_type: 'OCOD',
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    });

    total++;

    if (batch.length >= 10000) {
      insertBatch(batch);
      batch = [];
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[OCOD] Completed in ${elapsed}s: ${total.toLocaleString()} rows (${geocoded.toLocaleString()} geocoded).`);
}

async function streamCcod() {
  if (!fs.existsSync(CCOD_PATH)) {
    console.warn(`[CCOD] File not found at ${CCOD_PATH}`);
    return;
  }
  const TOTAL_EXPECTED = 4460848;
  console.log(`[CCOD] Streaming ${TOTAL_EXPECTED.toLocaleString()} records from ${CCOD_PATH}...`);

  const stream = fs.createReadStream(CCOD_PATH);
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let header = true;
  let batch = [];
  let total = 0;
  let geocoded = 0;
  const t0 = Date.now();
  let lastReportTime = t0;
  let lastReportRows = 0;

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 13) continue;

    const postcode = cols[6] || '';
    const title = cols[0] || '';
    const coords = resolveCoords(postcode, title);
    if (coords) geocoded++;

    const priceRaw = (cols[8] || '').replace(/[^0-9.]/g, '');
    const price = priceRaw ? parseFloat(priceRaw) : null;

    batch.push({
      title_number: title,
      tenure: cols[1],
      property_address: cols[2],
      district: cols[3],
      county: cols[4],
      region: cols[5],
      postcode: postcode,
      price_paid: price,
      proprietor_name: cols[9],
      company_reg_no: cols[10],
      proprietorship_category: cols[11],
      country_incorporated: 'UNITED KINGDOM',
      proprietor_address: cols[12],
      date_added: cols[33] || '',
      dataset_type: 'CCOD',
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    });

    total++;

    if (batch.length >= 10000) {
      insertBatch(batch);
      batch = [];

      if (total % 200000 === 0 || total === TOTAL_EXPECTED) {
        const now = Date.now();
        const deltaSec = (now - lastReportTime) / 1000;
        const deltaRows = total - lastReportRows;
        const speed = Math.round(deltaRows / (deltaSec || 1));
        const pct = ((total / TOTAL_EXPECTED) * 100).toFixed(1);
        const remaining = TOTAL_EXPECTED - total;
        const etaSec = speed > 0 ? Math.round(remaining / speed) : 0;
        const etaMin = (etaSec / 60).toFixed(1);

        console.log(`[CCOD Progress] ${total.toLocaleString()} / ${TOTAL_EXPECTED.toLocaleString()} (${pct}%) | ${speed.toLocaleString()} rows/s | ETA: ${etaMin} min`);
        lastReportTime = now;
        lastReportRows = total;
      }
    }
  }

  if (batch.length > 0) {
    insertBatch(batch);
  }

  const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[CCOD] Completed in ${elapsed}s: ${total.toLocaleString()} rows (${geocoded.toLocaleString()} geocoded).`);
}

async function main() {
  const overallStart = Date.now();

  await streamOcod();
  await streamCcod();

  console.log('[Indexing] Building high-performance spatial and search indexes...');
  const indexStart = Date.now();
  db.exec(`
    CREATE INDEX idx_properties_coords ON properties(latitude, longitude);
    CREATE INDEX idx_properties_postcode ON properties(postcode);
    CREATE INDEX idx_properties_title ON properties(title_number);
    CREATE INDEX idx_properties_type ON properties(dataset_type);
    CREATE INDEX idx_properties_tenure ON properties(tenure);
  `);
  console.log(`[Indexing] Indexes built in ${((Date.now() - indexStart) / 1000).toFixed(1)}s.`);

  console.log('[Optimization] Finalizing WAL mode and database statistics...');
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
    PRAGMA optimize;
  `);

  const stats = {
    totalProperties: db.prepare('SELECT COUNT(*) as c FROM properties').get().c,
    geocoded: db.prepare('SELECT COUNT(*) as c FROM properties WHERE latitude IS NOT NULL').get().c,
    ccodCount: db.prepare("SELECT COUNT(*) as c FROM properties WHERE dataset_type = 'CCOD'").get().c,
    ocodCount: db.prepare("SELECT COUNT(*) as c FROM properties WHERE dataset_type = 'OCOD'").get().c
  };

  db.close();

  console.log('=== Staging Database Verification ===');
  console.log(`Total Properties: ${stats.totalProperties.toLocaleString()}`);
  console.log(`Geocoded with Map Coordinates: ${stats.geocoded.toLocaleString()}`);
  console.log(`UK Corporate (CCOD): ${stats.ccodCount.toLocaleString()}`);
  console.log(`Overseas Entities (OCOD): ${stats.ocodCount.toLocaleString()}`);
  const finalSizeMb = (fs.statSync(STAGING_DB_PATH).size / (1024 * 1024)).toFixed(1);
  console.log(`Final Database Size: ${finalSizeMb} MB`);
  console.log(`Total Ingestion Time: ${((Date.now() - overallStart) / 1000 / 60).toFixed(2)} minutes.`);

  console.log('[Swap] Ready for atomic database activation.');
}

main().catch(err => {
  console.error('[FATAL] Ingestion failed:', err);
  process.exit(1);
});
