import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'cadastre.sqlite');

const db = new DatabaseSync(dbPath);

console.log('[Proprietor Summary] Initializing proprietor_summary table...');
const t0 = Date.now();

db.exec('DROP TABLE IF EXISTS proprietor_summary');
db.exec(`
  CREATE TABLE proprietor_summary (
    proprietor_name TEXT PRIMARY KEY,
    dataset_type TEXT,
    country_incorporated TEXT,
    company_reg_no TEXT,
    property_count INTEGER,
    total_price_paid REAL
  )
`);

console.log('[Proprietor Summary] Aggregating from 4.55M properties...');
db.exec(`
  INSERT INTO proprietor_summary (proprietor_name, dataset_type, country_incorporated, company_reg_no, property_count, total_price_paid)
  SELECT 
    proprietor_name,
    MAX(dataset_type) as dataset_type,
    MAX(country_incorporated) as country_incorporated,
    MAX(company_reg_no) as company_reg_no,
    COUNT(*) as property_count,
    SUM(CASE WHEN price_paid IS NOT NULL THEN price_paid ELSE 0 END) as total_price_paid
  FROM properties
  WHERE proprietor_name IS NOT NULL AND TRIM(proprietor_name) != ''
  GROUP BY proprietor_name
`);

console.log(`[Proprietor Summary] Created in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

// Create index for search
console.log('[Proprietor Summary] Creating search indexes...');
db.exec(`CREATE INDEX IF NOT EXISTS idx_proprietor_summary_name ON proprietor_summary(proprietor_name)`);
db.exec(`CREATE INDEX IF NOT EXISTS idx_proprietor_summary_count ON proprietor_summary(property_count DESC)`);

const total = db.prepare('SELECT COUNT(*) as c FROM proprietor_summary').get();
console.log(`[Proprietor Summary] Total distinct entities: ${total.c.toLocaleString()}`);

// Test search speed
const t1 = Date.now();
const res = db.prepare(`
  SELECT proprietor_name, dataset_type, country_incorporated, company_reg_no, property_count, total_price_paid
  FROM proprietor_summary
  WHERE proprietor_name LIKE ?
  ORDER BY property_count DESC
  LIMIT 10
`).all('%TESCO%');

console.log(`[Proprietor Summary] Search '%TESCO%' took ${Date.now() - t1}ms, found ${res.length} matches:`);
console.log(res.slice(0, 3));
