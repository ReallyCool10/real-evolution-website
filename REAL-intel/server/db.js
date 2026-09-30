// Query and write helpers used by the API server and the small ingest script.
// Schema lives in schema.js; connection settings and migrations in connection.js.
import { openDatabase } from './connection.js';

const db = openDatabase();

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

  // Tier 3: individual properties (street level). Ordering by price then id makes the
  // returned subset stable, so the same points stay on screen as you pan instead of an
  // arbitrary sample each time. (An R*Tree index was measured and rejected: at most a few
  // ms faster here, but it made every coordinate update in geocoding ~10x slower.)
  let sql = `
    SELECT p.id, p.title_number, p.tenure, p.property_address, p.district, p.county, p.region,
           p.postcode, p.price_paid, p.proprietor_name, p.company_reg_no, p.country_incorporated,
           p.date_added, p.dataset_type, p.latitude, p.longitude,
           COALESCE(p.precision_level, 'ESTIMATED') as precision_level
    FROM properties p
    WHERE p.latitude BETWEEN ? AND ?
      AND p.longitude BETWEEN ? AND ?
  `;
  const params = [minLat, maxLat, minLon, maxLon];

  if (type && type !== 'ALL') {
    sql += ` AND p.dataset_type = ?`;
    params.push(type);
  }
  if (tenure && tenure !== 'ALL') {
    sql += ` AND p.tenure = ?`;
    params.push(tenure);
  }

  sql += ` ORDER BY p.price_paid IS NULL, p.price_paid DESC, p.id LIMIT ?`;
  params.push(Number(limit));

  const stmt = db.prepare(sql);
  const data = stmt.all(...params);
  return { tier: 'micro', zoom: z, data };
}

// Turns free text into an FTS5 query: every word must match as a prefix, so "10 down"
// finds "10 DOWNING STREET". Words are quoted so punctuation and FTS operators in the input
// ("AND", "-", '"') are treated as text, never as query syntax.
export function toFtsQuery(text) {
  const words = String(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  return words.slice(0, 8).map(w => `"${w}"*`).join(' ');
}

const PROPERTY_SEARCH_COLUMNS = `
  p.id, p.title_number, p.tenure, p.property_address, p.district, p.postcode,
  p.price_paid, p.proprietor_name, p.company_reg_no, p.country_incorporated,
  p.dataset_type, p.latitude, p.longitude,
  COALESCE(p.precision_level, 'ESTIMATED') as precision_level`;

// Title numbers and postcodes are stored upper case, so a prefix match is an index range
// scan: [q, q + U+FFFF) under SQLite's default binary collation.
const searchByTitlePrefix = db.prepare(`
  SELECT ${PROPERTY_SEARCH_COLUMNS} FROM properties p
  WHERE p.title_number >= ? AND p.title_number < ? LIMIT ?`);
const searchByPostcodePrefix = db.prepare(`
  SELECT ${PROPERTY_SEARCH_COLUMNS} FROM properties p
  WHERE p.postcode >= ? AND p.postcode < ? LIMIT ?`);
const searchByAddress = db.prepare(`
  SELECT ${PROPERTY_SEARCH_COLUMNS} FROM properties_fts f
  JOIN properties p ON p.id = f.rowid
  WHERE properties_fts MATCH ? LIMIT ?`);
// Names that start with the query rank first, then the biggest portfolios.
const searchProprietors = db.prepare(`
  SELECT s.proprietor_name, s.dataset_type, s.country_incorporated, s.company_reg_no,
         s.property_count, s.total_price_paid
  FROM proprietor_fts f
  JOIN proprietor_summary s ON s.rowid = f.rowid
  WHERE proprietor_fts MATCH ?
  ORDER BY CASE WHEN s.proprietor_name LIKE ? THEN 0 ELSE 1 END, s.property_count DESC
  LIMIT 6`);

export function searchUnified(query, limit = 15) {
  const raw = String(query ?? '').trim();
  const fts = toFtsQuery(raw);
  if (!fts) return { proprietors: [], properties: [] };

  let proprietors = [];
  try {
    proprietors = searchProprietors.all(fts, `${raw}%`);
  } catch (err) {
    console.error('Proprietor search error:', err);
  }

  // Exact identifiers first (title number, postcode), then address matches; de-duplicated.
  const properties = [];
  const seen = new Set();
  const add = rows => {
    for (const row of rows) {
      if (properties.length >= 8) return;
      if (!seen.has(row.id)) {
        seen.add(row.id);
        properties.push(row);
      }
    }
  };
  try {
    const upper = raw.toUpperCase();
    add(searchByTitlePrefix.all(upper, `${upper}\uffff`, 8));
    add(searchByPostcodePrefix.all(upper, `${upper}\uffff`, 8));
    add(searchByAddress.all(fts, 8));
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

export function getPropertyById(id) {
  const stmt = db.prepare(`SELECT * FROM properties WHERE id = ?`);
  return stmt.get(Number(id));
}

// Five full-table counts over millions of rows; the data only changes when an ingest or
// enrichment script runs, so a minute-old answer is fine.
const STATS_TTL_MS = 60_000;
let statsCache = null;

export function getStats() {
  if (statsCache && Date.now() - statsCache.at < STATS_TTL_MS) return statsCache.value;
  statsCache = { at: Date.now(), value: computeStats() };
  return statsCache.value;
}

function computeStats() {
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
