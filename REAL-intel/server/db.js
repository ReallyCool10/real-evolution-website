import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cadastre.sqlite');
const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency & speed
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 10000;
  PRAGMA cache_size = -64000;

  CREATE TABLE IF NOT EXISTS postcodes (
    postcode TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  );

  CREATE TABLE IF NOT EXISTS properties (
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

  CREATE INDEX IF NOT EXISTS idx_properties_coords ON properties(latitude, longitude);
  CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode);
  CREATE INDEX IF NOT EXISTS idx_properties_title ON properties(title_number);
  CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(dataset_type);
  CREATE INDEX IF NOT EXISTS idx_properties_tenure ON properties(tenure);
`);

const stmtInsertPostcode = db.prepare(`
  INSERT OR REPLACE INTO postcodes (postcode, latitude, longitude)
  VALUES (?, ?, ?)
`);

const stmtInsertProperty = db.prepare(`
  INSERT INTO properties (
    title_number, tenure, property_address, district, county, region, postcode,
    price_paid, proprietor_name, company_reg_no, proprietorship_category,
    country_incorporated, proprietor_address, date_added, dataset_type,
    latitude, longitude
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const stmtFindPostcode = db.prepare(`
  SELECT latitude, longitude FROM postcodes WHERE postcode = ?
`);

export function findPostcodeCoords(postcode) {
  if (!postcode) return null;
  const clean = postcode.trim().toUpperCase();
  const row = stmtFindPostcode.get(clean);
  if (row) return row;

  // Try standard split (e.g. "M1 3GA" -> "M1")
  const parts = clean.split(/\s+/);
  if (parts.length > 1) {
    const outRow = stmtFindPostcode.get(parts[0]);
    if (outRow) return outRow;
  }

  // If unspaced (e.g. "BN212EW" -> slice off 3-character inward code to get "BN21")
  const noSpace = clean.replace(/[^A-Z0-9]/g, '');
  if (noSpace.length >= 5) {
    const outcode = noSpace.slice(0, -3);
    const outRow = stmtFindPostcode.get(outcode);
    if (outRow) return outRow;
  }

  return null;
}

export function insertPostcodesBatch(records) {
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const [pc, lat, lon] of records) {
      stmtInsertPostcode.run(pc, lat, lon);
    }
    db.exec('COMMIT;');
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function insertPropertiesBatch(records) {
  db.exec('BEGIN TRANSACTION;');
  try {
    for (const r of records) {
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
  } catch (err) {
    db.exec('ROLLBACK;');
    throw err;
  }
}

export function queryMacroOutcodes({ minLat, minLon, maxLat, maxLon, type = 'ALL', limit = 800 }) {
  let countExpr = 'total_count';
  let filterClause = '';
  if (type === 'OCOD') {
    countExpr = 'ocod_count';
    filterClause = 'AND ocod_count > 0';
  } else if (type === 'CCOD') {
    countExpr = 'ccod_count';
    filterClause = 'AND ccod_count > 0';
  }

  const sql = `
    SELECT outcode AS code,
           ${countExpr} AS count,
           total_count,
           ccod_count,
           ocod_count,
           avg_price,
           latitude,
           longitude
    FROM outcode_summary
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      ${filterClause}
    ORDER BY ${countExpr} DESC
    LIMIT ?
  `;

  const stmt = db.prepare(sql);
  return stmt.all(minLat, maxLat, minLon, maxLon, Number(limit));
}

export function queryMesoSectors({ minLat, minLon, maxLat, maxLon, type = 'ALL', limit = 1200 }) {
  let countExpr = 'total_count';
  let filterClause = '';
  if (type === 'OCOD') {
    countExpr = 'ocod_count';
    filterClause = 'AND ocod_count > 0';
  } else if (type === 'CCOD') {
    countExpr = 'ccod_count';
    filterClause = 'AND ccod_count > 0';
  }

  const sql = `
    SELECT sector AS code,
           outcode,
           ${countExpr} AS count,
           total_count,
           ccod_count,
           ocod_count,
           avg_price,
           latitude,
           longitude
    FROM sector_summary
    WHERE latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
      ${filterClause}
    ORDER BY ${countExpr} DESC
    LIMIT ?
  `;

  const stmt = db.prepare(sql);
  return stmt.all(minLat, maxLat, minLon, maxLon, Number(limit));
}

export function queryProperties({ minLat, minLon, maxLat, maxLon, zoom = 15, type = 'ALL', tenure = 'ALL', limit = 1500 }) {
  const z = Number(zoom);

  // Tier 1: Macro Outcode LOD (Whole UK / Regional)
  if (z < 10) {
    const data = queryMacroOutcodes({ minLat, minLon, maxLat, maxLon, type, limit });
    return { tier: 'macro', zoom: z, data };
  }

  // Tier 2: Meso Sector LOD (City / Borough / District - accumulated in bubbles)
  if (z < 15) {
    const data = queryMesoSectors({ minLat, minLon, maxLat, maxLon, type, limit });
    return { tier: 'meso', zoom: z, data };
  }

  // Tier 3: Micro Building & Parcel LOD (Street / Block Level - exact address points)
  let sql = `
    SELECT id, title_number, tenure, property_address, district, county, region,
           postcode, price_paid, proprietor_name, company_reg_no, country_incorporated,
           date_added, dataset_type, latitude, longitude,
           COALESCE(precision_level, 'ESTIMATED') as precision_level
    FROM properties
    WHERE latitude IS NOT NULL
      AND latitude BETWEEN ? AND ?
      AND longitude BETWEEN ? AND ?
  `;
  const params = [minLat, maxLat, minLon, maxLon];

  if (type && type !== 'ALL') {
    sql += ` AND dataset_type = ?`;
    params.push(type);
  }
  if (tenure && tenure !== 'ALL') {
    sql += ` AND tenure = ?`;
    params.push(tenure);
  }

  // Direct fast indexed query at street level
  sql += ` LIMIT ?`;
  params.push(Number(limit));

  const stmt = db.prepare(sql);
  const data = stmt.all(...params);
  return { tier: 'micro', zoom: z, data };
}

export function searchUnified(query, limit = 15) {
  if (!query || query.trim().length === 0) return { proprietors: [], properties: [] };
  const rawQ = query.trim();
  const qWild = `%${rawQ}%`;
  const qPrefix = `${rawQ}%`;

  // 1. Search Corporate & Overseas Proprietors via indexed summary
  let proprietors = [];
  try {
    const propStmt = db.prepare(`
      SELECT proprietor_name, dataset_type, country_incorporated, company_reg_no, property_count, total_price_paid
      FROM proprietor_summary
      WHERE proprietor_name LIKE ? OR proprietor_name LIKE ?
      ORDER BY 
        CASE WHEN proprietor_name LIKE ? THEN 0 ELSE 1 END,
        property_count DESC
      LIMIT 6
    `);
    proprietors = propStmt.all(qPrefix, qWild, qPrefix);
  } catch (err) {
    console.error('Proprietor search error:', err);
  }

  // 2. Search specific addresses, titles, and postcodes
  let properties = [];
  try {
    const addrStmt = db.prepare(`
      SELECT id, title_number, tenure, property_address, district, postcode,
             price_paid, proprietor_name, company_reg_no, country_incorporated,
             dataset_type, latitude, longitude,
             COALESCE(precision_level, 'ESTIMATED') as precision_level
      FROM properties
      WHERE property_address LIKE ?
         OR title_number LIKE ?
         OR postcode LIKE ?
      LIMIT 8
    `);
    properties = addrStmt.all(qWild, qPrefix, qPrefix);
  } catch (err) {
    console.error('Address/Property search error:', err);
  }

  return { proprietors, properties };
}

export function getProprietorPortfolio(name, limit = 500) {
  if (!name || name.trim().length === 0) return null;
  const cleanName = name.trim();

  let proprietor = db.prepare(`
    SELECT proprietor_name, dataset_type, country_incorporated, company_reg_no, property_count, total_price_paid
    FROM proprietor_summary
    WHERE proprietor_name = ?
  `).get(cleanName);

  if (!proprietor) {
    // Fallback if not yet in summary
    const agg = db.prepare(`
      SELECT proprietor_name, MAX(dataset_type) as dataset_type, MAX(country_incorporated) as country_incorporated,
             MAX(company_reg_no) as company_reg_no, COUNT(*) as property_count,
             SUM(CASE WHEN price_paid IS NOT NULL THEN price_paid ELSE 0 END) as total_price_paid
      FROM properties
      WHERE proprietor_name = ?
      GROUP BY proprietor_name
    `).get(cleanName);
    if (agg) {
      proprietor = agg;
    } else {
      return null;
    }
  }

  const assets = db.prepare(`
    SELECT id, title_number, tenure, property_address, district, county, region, postcode,
           price_paid, proprietor_name, company_reg_no, proprietorship_category,
           country_incorporated, proprietor_address, date_added, dataset_type,
           latitude, longitude, COALESCE(precision_level, 'ESTIMATED') as precision_level
    FROM properties
    WHERE proprietor_name = ?
    ORDER BY price_paid DESC NULLS LAST, title_number ASC
    LIMIT ?
  `).all(cleanName, Number(limit));

  return { proprietor, assets };
}

export function searchProperties(query, limit = 25) {
  if (!query || query.trim().length === 0) return [];
  const q = `%${query.trim()}%`;
  const sql = `
    SELECT id, title_number, tenure, property_address, district, postcode,
           price_paid, proprietor_name, company_reg_no, country_incorporated,
           dataset_type, latitude, longitude,
           COALESCE(precision_level, 'ESTIMATED') as precision_level
    FROM properties
    WHERE title_number LIKE ?
       OR postcode LIKE ?
       OR proprietor_name LIKE ?
       OR property_address LIKE ?
    LIMIT ?
  `;
  const stmt = db.prepare(sql);
  return stmt.all(q, q, q, q, Number(limit));
}

export function getPropertyById(id) {
  const stmt = db.prepare(`SELECT * FROM properties WHERE id = ?`);
  return stmt.get(Number(id));
}

export function getStats() {
  const total = db.prepare(`SELECT COUNT(*) as count FROM properties`).get();
  const ocod = db.prepare(`SELECT COUNT(*) as count FROM properties WHERE dataset_type = 'OCOD'`).get();
  const ccod = db.prepare(`SELECT COUNT(*) as count FROM properties WHERE dataset_type = 'CCOD'`).get();
  const withCoords = db.prepare(`SELECT COUNT(*) as count FROM properties WHERE latitude IS NOT NULL`).get();
  const topCountries = db.prepare(`
    SELECT country_incorporated, COUNT(*) as count
    FROM properties
    WHERE country_incorporated IS NOT NULL AND country_incorporated != ''
    GROUP BY country_incorporated
    ORDER BY count DESC
    LIMIT 5
  `).all();

  return {
    totalProperties: total.count,
    ocodCount: ocod.count,
    ccodCount: ccod.count,
    geocodedCount: withCoords.count,
    topOverseasCountries: topCountries
  };
}

export function getEnrichmentSummary() {
  try {
    const rows = db.prepare(`
      SELECT outcode, region, total_properties, matched_properties, match_percentage, status, last_updated
      FROM enrichment_progress
      ORDER BY last_updated DESC
    `).all();
    const totals = db.prepare(`
      SELECT SUM(total_properties) as total, SUM(matched_properties) as matched
      FROM enrichment_progress
    `).get();
    return {
      totalProcessed: totals?.total || 0,
      totalMatched: totals?.matched || 0,
      overallPercentage: totals?.total ? Number(((totals.matched / totals.total) * 100).toFixed(1)) : 0,
      outcodes: rows
    };
  } catch {
    return { totalProcessed: 0, totalMatched: 0, overallPercentage: 0, outcodes: [] };
  }
}

// User Workspace Persistence
db.exec(`
  CREATE TABLE IF NOT EXISTS user_workspace (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`);

export function getWorkspaceState() {
  try {
    const row = db.prepare('SELECT value FROM user_workspace WHERE key = ?').get('default_workspace');
    if (!row) return { savedItems: [], customLists: ['Watchlist', 'Acquisitions Pipeline', 'Under Review'] };
    return JSON.parse(row.value);
  } catch (err) {
    console.error('Error reading workspace state:', err);
    return { savedItems: [], customLists: ['Watchlist', 'Acquisitions Pipeline', 'Under Review'] };
  }
}

export function saveWorkspaceState(data) {
  try {
    const jsonStr = JSON.stringify(data);
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_workspace (key, value, updated_at)
      VALUES ('default_workspace', ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(jsonStr, now);
    return true;
  } catch (err) {
    console.error('Error saving workspace state:', err);
    return false;
  }
}

export { db };
