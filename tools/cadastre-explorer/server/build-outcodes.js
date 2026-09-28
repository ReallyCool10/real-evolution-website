import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'cadastre.sqlite');
const db = new DatabaseSync(dbPath);

console.log('=== Building High-Speed LOD Aggregates (Outcodes + Sectors) ===');
const t0 = Date.now();

// 1. Build Outcode Summary (Macro Tier: Zoom 4 - 10)
console.log('[1/2] Generating outcode_summary (Macro LOD)...');
db.exec(`
  DROP TABLE IF EXISTS outcode_summary;
  CREATE TABLE outcode_summary (
    outcode TEXT PRIMARY KEY,
    total_count INTEGER NOT NULL,
    ccod_count INTEGER NOT NULL,
    ocod_count INTEGER NOT NULL,
    avg_price INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  INSERT INTO outcode_summary (outcode, total_count, ccod_count, ocod_count, avg_price, latitude, longitude)
  SELECT 
    TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1)) AS outcode,
    COUNT(*) AS total_count,
    SUM(CASE WHEN dataset_type = 'CCOD' THEN 1 ELSE 0 END) AS ccod_count,
    SUM(CASE WHEN dataset_type = 'OCOD' THEN 1 ELSE 0 END) AS ocod_count,
    ROUND(AVG(CASE WHEN price_paid > 0 THEN price_paid ELSE NULL END)) AS avg_price,
    ROUND(AVG(latitude), 5) AS latitude,
    ROUND(AVG(longitude), 5) AS longitude
  FROM properties
  WHERE latitude IS NOT NULL 
    AND postcode IS NOT NULL 
    AND LENGTH(TRIM(postcode)) > 0
  GROUP BY TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1))
  HAVING outcode != '' AND latitude IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_outcode_summary_coords 
  ON outcode_summary(latitude, longitude);
`);

const outcodeCount = db.prepare('SELECT COUNT(*) as c FROM outcode_summary').get().c;
console.log(`[1/2] Outcode summary built: ${outcodeCount} outcodes.`);

// 2. Build Sector Summary (Meso Tier: Zoom 11 - 13)
console.log('[2/2] Generating sector_summary (Meso LOD)...');
db.exec(`
  DROP TABLE IF EXISTS sector_summary;
  CREATE TABLE sector_summary (
    sector TEXT PRIMARY KEY,
    outcode TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    ccod_count INTEGER NOT NULL,
    ocod_count INTEGER NOT NULL,
    avg_price INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  INSERT INTO sector_summary (sector, outcode, total_count, ccod_count, ocod_count, avg_price, latitude, longitude)
  SELECT 
    TRIM(SUBSTR(postcode, 1, INSTR(postcode, ' ') + 1)) AS sector,
    TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1)) AS outcode,
    COUNT(*) AS total_count,
    SUM(CASE WHEN dataset_type = 'CCOD' THEN 1 ELSE 0 END) AS ccod_count,
    SUM(CASE WHEN dataset_type = 'OCOD' THEN 1 ELSE 0 END) AS ocod_count,
    ROUND(AVG(CASE WHEN price_paid > 0 THEN price_paid ELSE NULL END)) AS avg_price,
    ROUND(AVG(latitude), 5) AS latitude,
    ROUND(AVG(longitude), 5) AS longitude
  FROM properties
  WHERE latitude IS NOT NULL 
    AND postcode IS NOT NULL 
    AND INSTR(postcode, ' ') > 0
  GROUP BY TRIM(SUBSTR(postcode, 1, INSTR(postcode, ' ') + 1))
  HAVING sector != '' AND latitude IS NOT NULL;

  CREATE INDEX IF NOT EXISTS idx_sector_summary_coords 
  ON sector_summary(latitude, longitude);
`);

const sectorCount = db.prepare('SELECT COUNT(*) as c FROM sector_summary').get().c;
console.log(`[2/2] Sector summary built: ${sectorCount} sectors.`);

const totalTime = ((Date.now() - t0) / 1000).toFixed(2);
console.log(`=== LOD Aggregates Completed in ${totalTime}s ===`);

db.close();
