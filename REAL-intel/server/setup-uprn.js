import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cadastre.sqlite');

const db = new DatabaseSync(DB_PATH);

console.log('--- Setting up Precision Tracking & UPRN Architecture ---');

// 1. Ensure properties table has precision_level
const cols = db.prepare('PRAGMA table_info(properties)').all().map(c => c.name);
if (!cols.includes('precision_level')) {
  console.log('[Schema] Adding precision_level column to properties...');
  db.exec("ALTER TABLE properties ADD COLUMN precision_level TEXT DEFAULT 'ESTIMATED'");
  console.log('[Schema] Added precision_level column.');
} else {
  console.log('[Schema] precision_level column already exists.');
}

// 2. Create the high-speed UPRN directory table in cadastre.sqlite
// Stores official national address points from ONS / Ordnance Survey
console.log('[Schema] Ensuring uprn_lookup table exists...');
db.exec(`
  CREATE TABLE IF NOT EXISTS uprn_lookup (
    uprn INTEGER PRIMARY KEY,
    postcode TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_uprn_postcode ON uprn_lookup(postcode);
`);
console.log('[Schema] uprn_lookup table and index ready.');

// 3. Check current precision distribution
const dist = db.prepare(`
  SELECT COALESCE(precision_level, 'ESTIMATED') as level, COUNT(*) as count 
  FROM properties 
  GROUP BY level
`).all();

console.log('\nCurrent Properties Precision Distribution:');
dist.forEach(d => console.log(` - ${d.level}: ${Number(d.count).toLocaleString()} properties`));

db.close();
console.log('\nSetup completed successfully.');
