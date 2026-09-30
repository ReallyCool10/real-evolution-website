// Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './connection.js';
import { SCHEMA_VERSION } from './schema.js';
import { rebuildLodSummaries, rebuildProprietorSummary } from './summaries.js';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

function tempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-test-'));
}

const tables = db => db.prepare("SELECT name FROM sqlite_master WHERE type = 'table'").all().map(r => r.name);
const indexes = db => db.prepare("SELECT name FROM sqlite_master WHERE type = 'index' AND name NOT LIKE 'sqlite_%'").all().map(r => r.name);
const columns = (db, table) => db.prepare(`PRAGMA table_info(${table})`).all().map(c => c.name);
const version = db => db.prepare('PRAGMA user_version').get().user_version;

function insertProperty(db, p) {
  db.prepare(
    `INSERT INTO properties (title_number, postcode, proprietor_name, dataset_type, price_paid, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(p.title, p.postcode, p.owner ?? 'ACME LTD', p.type ?? 'CCOD', p.price ?? null, p.lat ?? null, p.lon ?? null);
}

// A database as the pre-migration scripts left it: ingest-full's tables (no precision_level),
// apply-exact-postcodes' primary-key-less summaries, the old redundant proprietor index,
// a saved workspace, and no enrichment tables at all.
function buildLegacyDatabase(file) {
  const db = new DatabaseSync(file);
  db.exec(`
    CREATE TABLE postcodes (postcode TEXT PRIMARY KEY, latitude REAL NOT NULL, longitude REAL NOT NULL);
    CREATE TABLE properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT, title_number TEXT, tenure TEXT, property_address TEXT,
      district TEXT, county TEXT, region TEXT, postcode TEXT, price_paid REAL, proprietor_name TEXT,
      company_reg_no TEXT, proprietorship_category TEXT, country_incorporated TEXT,
      proprietor_address TEXT, date_added TEXT, dataset_type TEXT, latitude REAL, longitude REAL
    );
    CREATE INDEX idx_properties_coords ON properties(latitude, longitude);
    CREATE TABLE user_workspace (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL);
    INSERT INTO user_workspace VALUES ('default_workspace', '{"savedItems":[{"id":1}],"customLists":["Mine"]}', '2026-09-01');
  `);
  insertProperty(db, { title: 'T1', postcode: 'BS9 3AA', lat: 51.49, lon: -2.62 });
  db.exec(`
    CREATE TABLE outcode_summary AS SELECT 'BS9' AS outcode, 1 AS total_count, 1 AS ccod_count, 0 AS ocod_count,
      NULL AS avg_price, 51.49 AS latitude, -2.62 AS longitude;
    CREATE TABLE proprietor_summary (proprietor_name TEXT PRIMARY KEY, dataset_type TEXT, country_incorporated TEXT,
      company_reg_no TEXT, property_count INTEGER, total_price_paid REAL);
    CREATE INDEX idx_proprietor_summary_name ON proprietor_summary(proprietor_name);
  `);
  db.close();
}

test('a fresh database gets every table, column and index at the current version', () => {
  const db = openDatabase({ path: path.join(tempDir(), 'fresh.sqlite'), quiet: true });
  assert.equal(version(db), SCHEMA_VERSION);
  for (const t of ['postcodes', 'properties', 'uprn_lookup', 'address_points', 'enrichment_progress', 'user_workspace',
    'outcode_summary', 'sector_summary', 'proprietor_summary']) {
    assert.ok(tables(db).includes(t), `missing table ${t}`);
  }
  assert.ok(columns(db, 'properties').includes('precision_level'));
  for (const i of ['idx_properties_coords', 'idx_properties_proprietor', 'idx_uprn_postcode', 'idx_addr_postcode_num']) {
    assert.ok(indexes(db).includes(i), `missing index ${i}`);
  }
  db.close();
});

test('an existing database is upgraded in place without losing data', () => {
  const file = path.join(tempDir(), 'legacy.sqlite');
  buildLegacyDatabase(file);

  const db = openDatabase({ path: file, quiet: true });
  assert.equal(version(db), SCHEMA_VERSION);
  assert.ok(tables(db).includes('enrichment_progress'), 'enrichment_progress should now exist for every script');
  const row = db.prepare('SELECT title_number, precision_level, latitude FROM properties').get();
  assert.deepEqual({ ...row }, { title_number: 'T1', precision_level: 'ESTIMATED', latitude: 51.49 });
  assert.match(db.prepare('SELECT value FROM user_workspace').get().value, /"Mine"/);
  assert.ok(!indexes(db).includes('idx_proprietor_summary_name'), 'redundant index should be dropped');
  db.close();
});

test('reopening an up-to-date database applies nothing', () => {
  const file = path.join(tempDir(), 'twice.sqlite');
  openDatabase({ path: file, quiet: true }).close();
  const logs = [];
  const original = console.log;
  console.log = msg => logs.push(msg);
  try {
    openDatabase({ path: file }).close();
  } finally {
    console.log = original;
  }
  assert.deepEqual(logs, []);
});

test('a database from newer code is refused rather than silently used', () => {
  const file = path.join(tempDir(), 'future.sqlite');
  const raw = new DatabaseSync(file);
  raw.exec(`PRAGMA user_version = ${SCHEMA_VERSION + 1}`);
  raw.close();
  assert.throws(() => openDatabase({ path: file, quiet: true }), /newer than this code/);
});

test('summaries group by outcode and sector, ignore unrecorded prices, and replace old-shaped tables', () => {
  const file = path.join(tempDir(), 'summary.sqlite');
  buildLegacyDatabase(file);
  const db = openDatabase({ path: file, quiet: true });
  insertProperty(db, { title: 'T2', postcode: 'BS9 3AB', price: 400000, lat: 51.5, lon: -2.6 });
  insertProperty(db, { title: 'T3', postcode: 'BS9 4ZZ', price: 0, type: 'OCOD', lat: 51.51, lon: -2.61 });
  insertProperty(db, { title: 'T4', postcode: 'M1 1AA', price: 100000, lat: 53.48, lon: -2.24, owner: 'OTHER PLC' });
  insertProperty(db, { title: 'T5', postcode: 'M1 1AB' }); // no coordinates: excluded from the map

  assert.deepEqual(rebuildLodSummaries(db), { outcodes: 2, sectors: 3 });
  const bs9 = db.prepare("SELECT * FROM outcode_summary WHERE outcode = 'BS9'").get();
  assert.equal(bs9.total_count, 3);
  assert.equal(bs9.ocod_count, 1);
  assert.equal(bs9.avg_price, 400000, 'zero and missing prices must not lower the average');
  assert.equal(db.prepare("SELECT total_count FROM sector_summary WHERE sector = 'BS9 3'").get().total_count, 2);
  const pk = db.prepare('PRAGMA table_info(outcode_summary)').all().find(c => c.name === 'outcode').pk;
  assert.equal(pk, 1, 'rebuilt outcode_summary should have its primary key');

  assert.equal(rebuildProprietorSummary(db), 2);
  assert.equal(db.prepare("SELECT property_count FROM proprietor_summary WHERE proprietor_name = 'ACME LTD'").get().property_count, 4, 'ownership counts include properties without coordinates');
  db.close();
});

test('apply-exact-postcodes geocodes estimated rows and leaves enriched ones alone', () => {
  const dir = tempDir();
  const file = path.join(dir, 'geo.sqlite');
  fs.writeFileSync(path.join(dir, 'ukpostcodes.csv'), 'id,postcode,latitude,longitude\n1,BS9 3AA,51.4900,-2.6200\n2,BS9 3AB,51.4910,-2.6210\n');

  const db = openDatabase({ path: file, quiet: true });
  insertProperty(db, { title: 'ESTIMATED', postcode: 'BS9 3AA', lat: 51.0, lon: -2.0 });
  insertProperty(db, { title: 'FALLBACK', postcode: 'BS9 9ZZ' }); // unknown unit postcode: outcode centroid
  insertProperty(db, { title: 'ENRICHED', postcode: 'BS9 3AB', lat: 51.49123, lon: -2.62123 });
  db.exec("UPDATE properties SET precision_level = 'EXACT_UPRN' WHERE title_number = 'ENRICHED'");
  db.close();

  execFileSync(process.execPath, [path.join(SERVER_DIR, 'apply-exact-postcodes.js')], {
    env: { ...process.env, REAL_INTEL_DB: file, REAL_INTEL_DATA_DIR: dir },
    stdio: 'pipe',
  });

  const check = new DatabaseSync(file, { readOnly: true });
  const get = title => ({ ...check.prepare('SELECT latitude, longitude, precision_level FROM properties WHERE title_number = ?').get(title) });
  assert.deepEqual(get('ESTIMATED'), { latitude: 51.49, longitude: -2.62, precision_level: 'ESTIMATED' });
  assert.deepEqual(get('FALLBACK'), { latitude: 51.4905, longitude: -2.6205, precision_level: 'ESTIMATED' });
  assert.deepEqual(get('ENRICHED'), { latitude: 51.49123, longitude: -2.62123, precision_level: 'EXACT_UPRN' });
  assert.equal(check.prepare('SELECT COUNT(*) AS c FROM outcode_summary').get().c, 1);
  check.close();
});
