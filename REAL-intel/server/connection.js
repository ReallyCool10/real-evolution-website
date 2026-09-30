// The one way to open the REAL intel database. Applies connection settings and brings the
// schema up to date, so no script ever runs against a partially built database.
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from './paths.js';
import { migrate } from './schema.js';

// Normal use: WAL lets the server keep reading while an enrichment script writes, and the
// busy timeout makes a writer wait for the other rather than fail immediately.
const APP_PRAGMAS = `
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA busy_timeout = 15000;
  PRAGMA cache_size = -64000;
`;

// Bulk loading into a private staging file: no journal and no fsyncs. Safe only because
// nothing else uses the file and a failed load is simply thrown away and restarted.
const BULK_PRAGMAS = `
  PRAGMA synchronous = OFF;
  PRAGMA journal_mode = OFF;
  PRAGMA cache_size = -128000;
  PRAGMA temp_store = MEMORY;
  PRAGMA locking_mode = EXCLUSIVE;
`;

/**
 * @param {object} [options]
 * @param {string} [options.path] database file (defaults to the app database)
 * @param {boolean} [options.bulk] bulk-load settings; the caller creates tables and calls
 *   migrate() itself once loading is done (see ingest-full.js)
 * @param {boolean} [options.quiet] don't log applied migrations
 */
export function openDatabase({ path = DB_PATH, bulk = false, quiet = false } = {}) {
  const db = new DatabaseSync(path);
  db.exec(bulk ? BULK_PRAGMAS : APP_PRAGMAS);
  if (!bulk) {
    for (const m of migrate(db)) {
      if (!quiet) console.log(`[Schema] Applied migration ${m.version}: ${m.description}`);
    }
  }
  return db;
}
