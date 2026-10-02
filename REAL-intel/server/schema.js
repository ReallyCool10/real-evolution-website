// The single definition of the REAL intel database. Every table and index lives here, and
// changes are made by appending a migration, never by editing DDL in a script.
//
// SQLite's `PRAGMA user_version` records how many migrations a database has had. On open,
// `migrate()` applies any that are missing, each in its own transaction, so an existing
// database is upgraded in place and a fresh one is built from scratch by the same code.

// Base tables: loaded from source data or written by enrichment. Column sets match what the
// original ingest scripts created, so existing databases need no rebuild.
const TABLES = [
  `CREATE TABLE IF NOT EXISTS postcodes (
    postcode TEXT PRIMARY KEY,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS properties (
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
    longitude REAL,
    -- How the coordinates were derived. See PRECISION below.
    precision_level TEXT DEFAULT 'ESTIMATED'
  )`,
  // OS Open UPRN / NSUL: every addressable location with its postcode.
  `CREATE TABLE IF NOT EXISTS uprn_lookup (
    uprn INTEGER PRIMARY KEY,
    postcode TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  )`,
  // OpenStreetMap address points fetched by the OSM enrichment runner.
  `CREATE TABLE IF NOT EXISTS address_points (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    postcode TEXT,
    house_number TEXT,
    street TEXT,
    latitude REAL,
    longitude REAL
  )`,
  // One row per outcode that an enrichment pass has worked on.
  `CREATE TABLE IF NOT EXISTS enrichment_progress (
    outcode TEXT PRIMARY KEY,
    region TEXT,
    total_properties INTEGER,
    matched_properties INTEGER,
    match_percentage REAL,
    status TEXT, -- 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'
    last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
  )`,
  // The app's saved properties and custom lists (single user, key/value JSON).
  `CREATE TABLE IF NOT EXISTS user_workspace (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
];

// Derived tables, rebuilt wholesale from `properties` by server/summaries.js. Their DDL is
// exported so the rebuild uses exactly the same definition as a fresh database.
export const SUMMARY_TABLES = {
  // Macro level of detail (whole-UK zooms): one point per postcode outcode, e.g. "BS9".
  outcode_summary: `CREATE TABLE IF NOT EXISTS outcode_summary (
    outcode TEXT PRIMARY KEY,
    total_count INTEGER NOT NULL,
    ccod_count INTEGER NOT NULL,
    ocod_count INTEGER NOT NULL,
    avg_price INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  )`,
  // Meso level of detail (city zooms): one point per postcode sector, e.g. "BS9 3".
  sector_summary: `CREATE TABLE IF NOT EXISTS sector_summary (
    sector TEXT PRIMARY KEY,
    outcode TEXT NOT NULL,
    total_count INTEGER NOT NULL,
    ccod_count INTEGER NOT NULL,
    ocod_count INTEGER NOT NULL,
    avg_price INTEGER,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL
  )`,
  // One row per proprietor, for search and portfolio headers.
  proprietor_summary: `CREATE TABLE IF NOT EXISTS proprietor_summary (
    proprietor_name TEXT PRIMARY KEY,
    dataset_type TEXT,
    country_incorporated TEXT,
    company_reg_no TEXT,
    property_count INTEGER,
    total_price_paid REAL
  )`,
};

export const SUMMARY_INDEXES = {
  outcode_summary: ['CREATE INDEX IF NOT EXISTS idx_outcode_summary_coords ON outcode_summary(latitude, longitude)'],
  sector_summary: ['CREATE INDEX IF NOT EXISTS idx_sector_summary_coords ON sector_summary(latitude, longitude)'],
  proprietor_summary: ['CREATE INDEX IF NOT EXISTS idx_proprietor_summary_count ON proprietor_summary(property_count DESC)'],
};

const BASE_INDEXES = [
  'CREATE INDEX IF NOT EXISTS idx_properties_coords ON properties(latitude, longitude)',
  'CREATE INDEX IF NOT EXISTS idx_properties_postcode ON properties(postcode)',
  'CREATE INDEX IF NOT EXISTS idx_properties_title ON properties(title_number)',
  'CREATE INDEX IF NOT EXISTS idx_properties_type ON properties(dataset_type)',
  'CREATE INDEX IF NOT EXISTS idx_properties_tenure ON properties(tenure)',
  'CREATE INDEX IF NOT EXISTS idx_uprn_postcode ON uprn_lookup(postcode)',
  'CREATE INDEX IF NOT EXISTS idx_addr_postcode_num ON address_points(postcode, house_number)',
  'CREATE INDEX IF NOT EXISTS idx_addr_street_num ON address_points(street, house_number)',
];

const PROPRIETOR_INDEX = 'CREATE INDEX IF NOT EXISTS idx_properties_proprietor ON properties(proprietor_name)';

// Word-prefix search ("10 down" finds "10 DOWNING STREET") without reading every row, which
// LIKE '%...%' had to. Both are external-content FTS5 tables: they index text stored in
// the main table rather than keeping a second copy. properties_fts follows `properties` via
// triggers; proprietor_fts is rebuilt with proprietor_summary (see summaries.js).
const SEARCH_INDEXES = [
  `CREATE VIRTUAL TABLE IF NOT EXISTS properties_fts
   USING fts5(property_address, content='properties', content_rowid='id')`,
  `CREATE TRIGGER IF NOT EXISTS properties_fts_insert AFTER INSERT ON properties BEGIN
     INSERT INTO properties_fts (rowid, property_address) VALUES (NEW.id, NEW.property_address);
   END`,
  `CREATE TRIGGER IF NOT EXISTS properties_fts_update AFTER UPDATE OF property_address ON properties BEGIN
     INSERT INTO properties_fts (properties_fts, rowid, property_address) VALUES ('delete', OLD.id, OLD.property_address);
     INSERT INTO properties_fts (rowid, property_address) VALUES (NEW.id, NEW.property_address);
   END`,
  `CREATE TRIGGER IF NOT EXISTS properties_fts_delete AFTER DELETE ON properties BEGIN
     INSERT INTO properties_fts (properties_fts, rowid, property_address) VALUES ('delete', OLD.id, OLD.property_address);
   END`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS proprietor_fts
   USING fts5(proprietor_name, content='proprietor_summary', content_rowid='rowid')`,
];

/** Values of properties.precision_level, from least to most exact. */
export const PRECISION = {
  ESTIMATED: 'ESTIMATED', // postcode or outcode centroid
  POSTCODE_UPRN: 'POSTCODE_UPRN', // a real building (UPRN) in the right postcode, not necessarily this address
  STREET_UPRN: 'STREET_UPRN', // a known address point on the right street, not necessarily this address
  EXACT_UPRN: 'EXACT_UPRN', // the only UPRN in its postcode, so this address
  EXACT_OSM: 'EXACT_OSM', // matched OpenStreetMap address point (postcode or street + house number)
};

function execAll(db, statements) {
  for (const sql of statements) db.exec(sql);
}

function hasColumn(db, table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column);
}

/**
 * Recreates any base-table index that is missing. For bulk loaders that drop an index
 * before inserting millions of rows (much faster) and need it back afterwards.
 */
export function ensureIndexes(db) {
  execAll(db, [...BASE_INDEXES, PROPRIETOR_INDEX]);
}

/**
 * Creates the base tables with no indexes. Only for bulk loads (ingest-full), which build
 * indexes after inserting millions of rows; everything else should call migrate().
 */
export function createBaseTables(db) {
  execAll(db, TABLES);
}

// Append-only. Never edit a migration that has shipped; add a new one instead.
const MIGRATIONS = [
  {
    description: 'Baseline: every table and index the scripts previously created ad hoc',
    up(db) {
      execAll(db, TABLES);
      // Databases built before precision tracking have no precision_level column.
      if (!hasColumn(db, 'properties', 'precision_level')) {
        db.exec("ALTER TABLE properties ADD COLUMN precision_level TEXT DEFAULT 'ESTIMATED'");
      }
      execAll(db, Object.values(SUMMARY_TABLES));
      execAll(db, BASE_INDEXES);
      execAll(db, Object.values(SUMMARY_INDEXES).flat());
      // Redundant with the table's primary key (an older script created it).
      db.exec('DROP INDEX IF EXISTS idx_proprietor_summary_name');
    },
  },
  {
    description: 'Index properties by proprietor so opening a portfolio does not scan every row',
    up(db) {
      db.exec(PROPRIETOR_INDEX);
    },
  },
  {
    description: 'Full-text search over property addresses and proprietor names',
    up(db) {
      execAll(db, SEARCH_INDEXES);
      db.exec("INSERT INTO properties_fts (properties_fts) VALUES ('rebuild')");
      db.exec("INSERT INTO proprietor_fts (proprietor_fts) VALUES ('rebuild')");
    },
  },
  {
    description: 'Relabel non-exact UPRN matches as POSTCODE_UPRN and recount match rates as exact-only',
    up(db) {
      // uprn-matcher gave every property in a multi-address postcode an arbitrary one of that
      // postcode's UPRNs and called it EXACT_UPRN. Only a postcode with a single UPRN pins
      // the address, so everything else becomes POSTCODE_UPRN (coordinates are unchanged).
      // Rows that can't be verified (no lookup data for the postcode) get the weaker label.
      db.exec(`
        UPDATE properties SET precision_level = 'POSTCODE_UPRN'
        WHERE precision_level = 'EXACT_UPRN'
          AND UPPER(TRIM(postcode)) NOT IN (
            SELECT postcode FROM uprn_lookup GROUP BY postcode HAVING COUNT(*) = 1)`);
      // Stored match rates used each script's own definition; recount them as exact-address
      // matches only (see server/progress.js, which every script now uses).
      db.exec(`
        UPDATE enrichment_progress SET
          total_properties = (SELECT COUNT(*) FROM properties p
            WHERE p.postcode >= enrichment_progress.outcode || ' ' AND p.postcode <= enrichment_progress.outcode || ' ~'),
          matched_properties = (SELECT COUNT(*) FROM properties p
            WHERE p.postcode >= enrichment_progress.outcode || ' ' AND p.postcode <= enrichment_progress.outcode || ' ~'
              AND p.precision_level IN ('EXACT_OSM', 'EXACT_UPRN'))`);
      db.exec(`
        UPDATE enrichment_progress SET match_percentage =
          CASE WHEN total_properties > 0 THEN ROUND(100.0 * matched_properties / total_properties, 1) ELSE 0 END`);
    },
  },
];

export const SCHEMA_VERSION = MIGRATIONS.length;

/** Brings the database up to SCHEMA_VERSION. Returns the migrations that were applied. */
export function migrate(db) {
  const current = db.prepare('PRAGMA user_version').get().user_version;
  if (current > SCHEMA_VERSION) {
    throw new Error(
      `Database schema is version ${current}, newer than this code (${SCHEMA_VERSION}). Update REAL intel.`,
    );
  }
  const applied = [];
  for (let version = current + 1; version <= SCHEMA_VERSION; version++) {
    const migration = MIGRATIONS[version - 1];
    db.exec('BEGIN');
    try {
      migration.up(db);
      db.exec(`PRAGMA user_version = ${version}`);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw new Error(`Migration ${version} (${migration.description}) failed: ${err.message}`, { cause: err });
    }
    applied.push({ version, description: migration.description });
  }
  return applied;
}
