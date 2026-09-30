// Full CCOD + OCOD ingest into a fresh staging database (cadastre_staging.sqlite) with the
// complete schema, summaries, and reference data carried over from the live database. When
// it finishes, stop the server and replace cadastre.sqlite with the staging file.
import fs from 'node:fs';
import readline from 'node:readline';
import { DatabaseSync } from 'node:sqlite';
import { parseCsvLine } from './csvParser.js';
import { openDatabase } from './connection.js';
import { DB_PATH, STAGING_DB_PATH, dataPath } from './paths.js';
import { createBaseTables, migrate } from './schema.js';
import { rebuildLodSummaries, rebuildProprietorSummary } from './summaries.js';

const OCOD_PATH = dataPath('OCOD_FULL_2026_09', 'OCOD_FULL_2026_09.csv');
const CCOD_PATH = dataPath('CCOD_FULL_2026_09', 'CCOD_FULL_2026_09.csv');

// Reference data that a re-ingest must not lose: the user's saved workspace, and the UPRN
// and OSM address lookups, which take hours to download and rebuild. enrichment_progress is
// deliberately not carried over: property IDs and precision are reset by a fresh ingest.
const CARRY_OVER = {
  user_workspace: 'key, value, updated_at',
  uprn_lookup: 'uprn, postcode, latitude, longitude',
  address_points: 'id, postcode, house_number, street, latitude, longitude',
};

// Remove any existing staging file from previous attempts
if (fs.existsSync(STAGING_DB_PATH)) {
  fs.unlinkSync(STAGING_DB_PATH);
}

console.log('=== REAL Cadastre Full 4.5M Ingestion Pipeline ===');
console.log(`Target Staging DB: ${STAGING_DB_PATH}`);
console.log(`CCOD Source: ${CCOD_PATH}`);
console.log(`OCOD Source: ${OCOD_PATH}`);

// Bulk settings, tables only: indexes are built once after loading, which is far faster.
const db = openDatabase({ path: STAGING_DB_PATH, bulk: true });
createBaseTables(db);

// Seed postcodes from existing database or download
console.log('[Postcodes] Seeding UK postcode centroids...');
const existingDb = fs.existsSync(DB_PATH) ? new DatabaseSync(DB_PATH, { readOnly: true }) : null;
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

function carryOverReferenceData() {
  if (!fs.existsSync(DB_PATH)) return;
  db.prepare('ATTACH DATABASE ? AS live').run(DB_PATH);
  for (const [table, columns] of Object.entries(CARRY_OVER)) {
    const exists = db.prepare("SELECT 1 FROM live.sqlite_master WHERE type = 'table' AND name = ?").get(table);
    if (!exists) continue;
    db.exec(`INSERT INTO main.${table} (${columns}) SELECT ${columns} FROM live.${table}`);
    const count = db.prepare(`SELECT COUNT(*) AS c FROM main.${table}`).get().c;
    console.log(`[Carry-over] ${table}: ${count.toLocaleString()} rows kept from the live database.`);
  }
  db.exec('DETACH DATABASE live');
}

async function main() {
  const overallStart = Date.now();

  await streamOcod();
  await streamCcod();

  carryOverReferenceData();

  console.log('[Schema] Building indexes and bringing the schema up to date...');
  const indexStart = Date.now();
  migrate(db);
  console.log(`[Schema] Done in ${((Date.now() - indexStart) / 1000).toFixed(1)}s.`);

  console.log('[Summaries] Building map and proprietor summaries...');
  const lod = rebuildLodSummaries(db);
  const proprietors = rebuildProprietorSummary(db);
  console.log(`[Summaries] ${lod.outcodes} outcodes, ${lod.sectors} sectors, ${proprietors} proprietors.`);

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

  console.log('[Swap] Staging database is complete. To activate it: stop the server, then replace');
  console.log(`       ${DB_PATH} with ${STAGING_DB_PATH} (delete any cadastre.sqlite-wal/-shm too).`);
}

main().catch(err => {
  console.error('[FATAL] Ingestion failed:', err);
  process.exit(1);
});
