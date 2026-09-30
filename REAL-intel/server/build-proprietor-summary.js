// Rebuilds proprietor_summary (proprietor search and portfolio headers) from `properties`.
// Run after ingesting new CCOD/OCOD data.
import { openDatabase } from './connection.js';
import { rebuildProprietorSummary } from './summaries.js';

const db = openDatabase();
console.log('=== Rebuilding proprietor summary ===');
const t0 = Date.now();
const count = rebuildProprietorSummary(db);
console.log(`Built ${count.toLocaleString()} proprietors in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);

// Quick sanity check that search is fast.
const t1 = Date.now();
const sample = db
  .prepare('SELECT proprietor_name, property_count FROM proprietor_summary WHERE proprietor_name LIKE ? ORDER BY property_count DESC LIMIT 3')
  .all('%TESCO%');
console.log(`Search '%TESCO%' took ${Date.now() - t1}ms:`, sample);
db.close();
