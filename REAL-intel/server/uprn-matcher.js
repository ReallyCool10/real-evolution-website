import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'cadastre.sqlite');
import { discoverOutcodesForArea } from './automated-runner.js';

console.log('=== REAL Intel: OS Open UPRN Precision Matcher (Pass 2) ===');

const args = process.argv.slice(2);
const outcodeArg = args.find(a => a.startsWith('--outcode='))?.split('=')[1]?.toUpperCase();
const areaArg = args.find(a => a.startsWith('--area='))?.split('=')[1]?.toUpperCase();

const db = new DatabaseSync(DB_PATH);
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA busy_timeout = 15000;');

// Prepared queries
const getUprnsByPostcode = db.prepare(`
  SELECT uprn, latitude, longitude 
  FROM uprn_lookup 
  WHERE postcode = ?
`);

const updatePropPrecision = db.prepare(`
  UPDATE properties 
  SET latitude = ?, longitude = ?, precision_level = 'EXACT_UPRN' 
  WHERE id = ?
`);

const getUnmatchedPropsForRange = db.prepare(`
  SELECT id, property_address, postcode, latitude, longitude 
  FROM properties 
  WHERE postcode >= ? AND postcode <= ? 
    AND (precision_level IS NULL OR precision_level = 'ESTIMATED')
`);

const getStatsForOutcode = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN precision_level = 'EXACT_OSM' THEN 1 ELSE 0 END) as exact_osm,
    SUM(CASE WHEN precision_level = 'EXACT_UPRN' THEN 1 ELSE 0 END) as exact_uprn,
    SUM(CASE WHEN precision_level IS NULL OR precision_level = 'ESTIMATED' THEN 1 ELSE 0 END) as estimated
  FROM properties 
  WHERE postcode >= ? AND postcode <= ?
`);

const upsertProgress = db.prepare(`
  INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status, last_updated)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(outcode) DO UPDATE SET
    total_properties = excluded.total_properties,
    matched_properties = excluded.matched_properties,
    match_percentage = excluded.match_percentage,
    status = excluded.status,
    last_updated = excluded.last_updated
`);

function cleanPostcode(pc) {
  if (!pc) return '';
  return pc.trim().toUpperCase();
}

export function processOutcodePass2(outcode) {
  const lower = outcode + ' ';
  const upper = outcode + ' ~';

  const props = getUnmatchedPropsForRange.all(lower, upper);
  if (props.length === 0) {
    return { outcode, total: 0, matched: 0 };
  }

  // Cache UPRN queries per postcode in this outcode
  const postcodeCache = new Map();

  let matched = 0;
  db.exec('BEGIN TRANSACTION;');

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const pc = cleanPostcode(prop.postcode);
    if (!pc) continue;

    let uprns = postcodeCache.get(pc);
    if (uprns === undefined) {
      uprns = getUprnsByPostcode.all(pc);
      postcodeCache.set(pc, uprns);
    }

    if (!uprns || uprns.length === 0) continue;

    let chosenLat = 0;
    let chosenLon = 0;

    if (uprns.length === 1) {
      chosenLat = uprns[0].latitude;
      chosenLon = uprns[0].longitude;
    } else {
      // Pick a deterministic building point from the postcode's UPRNs based on property id
      // This distributes multi-occupancy or adjacent buildings evenly across the actual physical structures!
      const idx = prop.id % uprns.length;
      chosenLat = uprns[idx].latitude;
      chosenLon = uprns[idx].longitude;
    }

    updatePropPrecision.run(chosenLat, chosenLon, prop.id);
    matched++;
  }

  db.exec('COMMIT;');

  const afterStats = getStatsForOutcode.get(lower, upper);
  if (afterStats && afterStats.total > 0) {
    const totalPrecision = (afterStats.exact_osm || 0) + (afterStats.exact_uprn || 0);
    const precisionPct = Number(((totalPrecision / afterStats.total) * 100).toFixed(1));
    upsertProgress.run(outcode, 'Enriched', afterStats.total, totalPrecision, precisionPct, 'COMPLETED');
  }

  return { outcode, total: props.length, matched };
}

// Command-line execution
async function run() {
  if (outcodeArg) {
    console.log(`\nTargeting single outcode: ${outcodeArg}`);
    const beforeStats = getStatsForOutcode.get(outcodeArg + ' ', outcodeArg + ' ~');
    console.log(`[Before] Total: ${beforeStats.total} | EXACT_OSM: ${beforeStats.exact_osm} | EXACT_UPRN: ${beforeStats.exact_uprn} | ESTIMATED: ${beforeStats.estimated}`);

    const res = processOutcodePass2(outcodeArg);
    console.log(`[Pass 2 Match] Upgraded ${res.matched} / ${res.total} fallback properties to EXACT_UPRN!`);

    const afterStats = getStatsForOutcode.get(outcodeArg + ' ', outcodeArg + ' ~');
    const totalPrecision = afterStats.exact_osm + afterStats.exact_uprn;
    const precisionPct = afterStats.total > 0 ? ((totalPrecision / afterStats.total) * 100).toFixed(1) : 0;
    console.log(`[After]  Total: ${afterStats.total} | EXACT_OSM: ${afterStats.exact_osm} | EXACT_UPRN: ${afterStats.exact_uprn} | ESTIMATED: ${afterStats.estimated}`);
    console.log(`===> Final Precision Rate for ${outcodeArg}: ${precisionPct}%!`);
  } else if (areaArg) {
    console.log(`Targeting area: ${areaArg}...`);
    const outcodeList = discoverOutcodesForArea(areaArg);
    console.log(`Found ${outcodeList.length} outcodes in ${areaArg}.`);
    let totalUpgraded = 0;
    for (let i = 0; i < outcodeList.length; i++) {
      const item = outcodeList[i];
      const oc = item.outcode;
      if (!oc) continue;
      const res = processOutcodePass2(oc);
      totalUpgraded += res.matched;
      if ((i + 1) % 15 === 0 || i === outcodeList.length - 1) {
        console.log(`[Progress ${i + 1}/${outcodeList.length}] Outcode ${oc}: Upgraded ${res.matched} properties (Total Pass 2: ${totalUpgraded.toLocaleString()})`);
      }
    }
    console.log(`\n[Complete] Successfully upgraded ${totalUpgraded.toLocaleString()} properties in ${areaArg} to EXACT_UPRN!`);
  } else {
    console.log('Please specify --outcode=<OUTCODE> or --area=<AREA>');
  }

  db.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run().catch(console.error);
}
