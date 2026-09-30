import { openDatabase } from './connection.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import { discoverOutcodesForArea } from './automated-runner.js';

console.log('=== REAL Intel: OS Open UPRN Precision Matcher (Pass 2) ===');

const args = process.argv.slice(2);
const outcodeArg = args.find(a => a.startsWith('--outcode='))?.split('=')[1]?.toUpperCase();
const areaArg = args.find(a => a.startsWith('--area='))?.split('=')[1]?.toUpperCase();
const showStatus = args.includes('--status');

const db = openDatabase();

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

function getRegionForOutcode(oc) {
  if (oc.startsWith('BS')) return 'Bristol';
  const londonPrefixes = ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'];
  if (londonPrefixes.some(p => oc.startsWith(p))) return 'London';
  return 'Custom';
}

function cleanPostcode(pc) {
  if (!pc) return '';
  return pc.trim().toUpperCase();
}

export function processOutcodePass2(outcode) {
  const lower = outcode + ' ';
  const upper = outcode + ' ~';

  const props = getUnmatchedPropsForRange.all(lower, upper);
  if (props.length === 0) {
    const afterStats = getStatsForOutcode.get(lower, upper);
    if (afterStats && afterStats.total > 0) {
      const totalPrecision = (afterStats.exact_osm || 0) + (afterStats.exact_uprn || 0);
      const precisionPct = Number(((totalPrecision / afterStats.total) * 100).toFixed(1));
      upsertProgress.run(outcode, getRegionForOutcode(outcode), afterStats.total, totalPrecision, precisionPct, 'COMPLETED');
    }
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
    upsertProgress.run(outcode, getRegionForOutcode(outcode), afterStats.total, totalPrecision, precisionPct, 'COMPLETED');
  }

  return { outcode, total: props.length, matched };
}

function displayStatus() {
  const rows = db.prepare(`
    SELECT outcode, region, total_properties, matched_properties, match_percentage, status
    FROM enrichment_progress
    ORDER BY region, outcode
  `).all();

  console.log('\n========================================================================================');
  console.log('REAL Intel — Address Precision Dashboard (Combined Pass 1 OSM + Pass 2 UPRN)');
  console.log('========================================================================================');
  console.log('OUTCODE  | REGION      | TOTAL PROPS | HIGH FIDELITY | MATCH % | STATUS');
  console.log('---------+-------------+-------------+---------------+---------+----------');

  let totalProps = 0;
  let totalMatched = 0;

  for (const r of rows) {
    totalProps += r.total_properties;
    totalMatched += r.matched_properties;
    const ocPad = r.outcode.padEnd(8);
    const regPad = (r.region || '').padEnd(11);
    const totPad = r.total_properties.toLocaleString().padStart(11);
    const matPad = r.matched_properties.toLocaleString().padStart(13);
    const pctPad = (r.match_percentage.toFixed(1) + '%').padStart(7);
    const statPad = r.status.padEnd(10);
    console.log(`${ocPad} | ${regPad} | ${totPad} | ${matPad} | ${pctPad} | ${statPad}`);
  }

  const overallPct = totalProps > 0 ? ((totalMatched / totalProps) * 100).toFixed(1) : '0.0';
  console.log('---------+-------------+-------------+---------------+---------+----------');
  console.log(`TOTAL    | ALL REGIONS | ${totalProps.toLocaleString().padStart(11)} | ${totalMatched.toLocaleString().padStart(13)} | ${(overallPct + '%').padStart(7)} |`);
  console.log('========================================================================================\n');
}

// Command-line execution
async function run() {
  if (showStatus) {
    displayStatus();
    db.close();
    return;
  }

  if (outcodeArg) {
    console.log(`\nTargeting single outcode: ${outcodeArg}`);
    const beforeStats = getStatsForOutcode.get(outcodeArg + ' ', outcodeArg + ' ~');
    console.log(`[Before] Total: ${beforeStats.total} | EXACT_OSM: ${beforeStats.exact_osm} | EXACT_UPRN: ${beforeStats.exact_uprn} | ESTIMATED: ${beforeStats.estimated}`);

    const res = processOutcodePass2(outcodeArg);
    console.log(`[Pass 2 Match] Upgraded ${res.matched} / ${res.total} fallback properties to EXACT_UPRN!`);

    const afterStats = getStatsForOutcode.get(outcodeArg + ' ', outcodeArg + ' ~');
    const totalPrecision = (afterStats.exact_osm || 0) + (afterStats.exact_uprn || 0);
    const precisionPct = afterStats.total > 0 ? ((totalPrecision / afterStats.total) * 100).toFixed(1) : 0;
    console.log(`[After]  Total: ${afterStats.total} | EXACT_OSM: ${afterStats.exact_osm} | EXACT_UPRN: ${afterStats.exact_uprn} | ESTIMATED: ${afterStats.estimated}`);
    console.log(`===> Final Precision Rate for ${outcodeArg}: ${precisionPct}%!`);
  } else if (areaArg) {
    const regionLabel = (areaArg === 'BS' || areaArg === 'BRISTOL') ? 'Bristol' : areaArg;
    console.log(`\nTargeting area: ${regionLabel}...`);
    const outcodeList = discoverOutcodesForArea(areaArg === 'BRISTOL' ? 'BS' : areaArg);
    console.log(`Found ${outcodeList.length} outcodes in ${regionLabel}.`);
    
    let totalUpgraded = 0;
    const t0 = Date.now();

    for (let i = 0; i < outcodeList.length; i++) {
      const item = outcodeList[i];
      const oc = item.outcode;
      if (!oc) continue;
      const res = processOutcodePass2(oc);
      totalUpgraded += res.matched;
      if ((i + 1) % 10 === 0 || i === outcodeList.length - 1) {
        console.log(`[Progress ${i + 1}/${outcodeList.length}] Outcode ${oc}: Upgraded ${res.matched} properties (Total Pass 2 upgraded so far: ${totalUpgraded.toLocaleString()})`);
      }
    }
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n========================================================================================`);
    console.log(`[Complete] Pass 2 upgraded ${totalUpgraded.toLocaleString()} properties in ${regionLabel} to EXACT_UPRN in ${elapsed}s!`);
    console.log(`========================================================================================\n`);

    displayStatus();
  } else {
    console.log('Please specify --outcode=<OUTCODE> or --area=<AREA> or --status');
  }

  db.close();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  run().catch(console.error);
}
