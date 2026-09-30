// Rebuilds the map's outcode (macro) and sector (meso) summary tables from `properties`.
// Run after anything that changes property coordinates: ingest, geocoding, enrichment.
import { openDatabase } from './connection.js';
import { rebuildLodSummaries } from './summaries.js';

const db = openDatabase();
console.log('=== Rebuilding map level-of-detail summaries (outcodes + sectors) ===');
const t0 = Date.now();
const { outcodes, sectors } = rebuildLodSummaries(db);
console.log(`Built ${outcodes.toLocaleString()} outcodes and ${sectors.toLocaleString()} sectors in ${((Date.now() - t0) / 1000).toFixed(1)}s.`);
db.close();
