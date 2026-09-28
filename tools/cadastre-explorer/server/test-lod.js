import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'cadastre.sqlite');
const db = new DatabaseSync(dbPath);

console.log('--- Benchmark Tier 1 (Macro: Outcode Summary) ---');
const t0 = Date.now();
const macro = db.prepare(`
  SELECT outcode AS code, total_count, ccod_count, ocod_count, avg_price, latitude, longitude
  FROM outcode_summary
  WHERE latitude BETWEEN 50.0 AND 55.0 AND longitude BETWEEN -5.0 AND 2.0
  ORDER BY total_count DESC
  LIMIT 500
`).all();
console.log(`Macro query: ${macro.length} outcodes in ${Date.now() - t0}ms`);
console.log('Sample:', macro[0]);

console.log('\n--- Benchmark Tier 2 (Meso: Sector Summary) ---');
const t1 = Date.now();
const meso = db.prepare(`
  SELECT sector AS code, outcode, total_count, ccod_count, ocod_count, avg_price, latitude, longitude
  FROM sector_summary
  WHERE latitude BETWEEN 51.4 AND 51.6 AND longitude BETWEEN -0.3 AND 0.1
  ORDER BY total_count DESC
  LIMIT 800
`).all();
console.log(`Meso query: ${meso.length} sectors in ${Date.now() - t1}ms`);
console.log('Sample:', meso[0]);

console.log('\n--- Benchmark Tier 3 (Micro: Raw Properties) ---');
const t2 = Date.now();
const micro = db.prepare(`
  SELECT id, title_number, tenure, property_address, district, postcode,
         price_paid, proprietor_name, company_reg_no, country_incorporated,
         date_added, dataset_type, latitude, longitude
  FROM properties
  WHERE latitude IS NOT NULL
    AND latitude BETWEEN 51.50 AND 51.52
    AND longitude BETWEEN -0.15 AND -0.12
  LIMIT 1500
`).all();
console.log(`Micro query: ${micro.length} raw properties in ${Date.now() - t2}ms`);
console.log('Sample:', micro[0]?.property_address, '|', micro[0]?.proprietor_name);

db.close();
