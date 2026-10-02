import { openDatabase } from './connection.js';
import { normalisePostcode } from './address.js';
import { outcodeStats, recordOutcodeProgress } from './progress.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
  UPDATE properties SET latitude = ?, longitude = ?, precision_level = ? WHERE id = ?
`);

const getUnmatchedPropsForRange = db.prepare(`
  SELECT id, property_address, postcode, latitude, longitude 
  FROM properties 
  WHERE postcode >= ? AND postcode <= ? 
    AND (precision_level IS NULL OR precision_level = 'ESTIMATED')
`);



function getRegionForOutcode(oc) {
  if (oc.startsWith('BS')) return 'Bristol';
  const londonPrefixes = ['E', 'EC', 'N', 'NW', 'SE', 'SW', 'W', 'WC'];
  if (londonPrefixes.some(p => oc.startsWith(p))) return 'London';
  return 'Custom';
}

export function processOutcodePass2(outcode) {
  const lower = outcode + ' ';
  const upper = outcode + ' ~';

  const props = getUnmatchedPropsForRange.all(lower, upper);
  if (props.length === 0) {
    if (outcodeStats(db, outcode).total > 0) recordOutcodeProgress(db, outcode, getRegionForOutcode(outcode));
    return { outcode, total: 0, matched: 0, exact: 0 };
  }

  // Cache UPRN queries per postcode in this outcode
  const postcodeCache = new Map();

  let matched = 0;
  let exactCount = 0;
  db.exec('BEGIN TRANSACTION;');

  for (let i = 0; i < props.length; i++) {
    const prop = props[i];
    const pc = normalisePostcode(prop.postcode);
    if (!pc) continue;

    let uprns = postcodeCache.get(pc);
    if (uprns === undefined) {
      uprns = getUprnsByPostcode.all(pc);
      postcodeCache.set(pc, uprns);
    }

    if (!uprns || uprns.length === 0) continue;

    // A postcode with one UPRN pins the address exactly. With several, the property is placed
    // on one of the postcode's real buildings (spread deterministically by id) but we don't
    // know which one is its own, so it is only postcode-level.
    const exact = uprns.length === 1;
    const chosen = exact ? uprns[0] : uprns[prop.id % uprns.length];
    updatePropPrecision.run(chosen.latitude, chosen.longitude, exact ? 'EXACT_UPRN' : 'POSTCODE_UPRN', prop.id);
    matched++;
    if (exact) exactCount++;
  }

  db.exec('COMMIT;');

  if (outcodeStats(db, outcode).total > 0) recordOutcodeProgress(db, outcode, getRegionForOutcode(outcode));

  return { outcode, total: props.length, matched, exact: exactCount };
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
    const beforeStats = outcodeStats(db, outcodeArg);
    console.log(`[Before] Total: ${beforeStats.total} | EXACT_OSM: ${beforeStats.exact_osm} | EXACT_UPRN: ${beforeStats.exact_uprn} | POSTCODE_UPRN: ${beforeStats.postcode_uprn} | ESTIMATED: ${beforeStats.estimated}`);

    const res = processOutcodePass2(outcodeArg);
    console.log(`[Pass 2] Placed ${res.matched} / ${res.total} estimated properties on a UPRN (${res.exact} exact, ${res.matched - res.exact} postcode-level).`);

    const afterStats = outcodeStats(db, outcodeArg);
    console.log(`[After]  Total: ${afterStats.total} | EXACT_OSM: ${afterStats.exact_osm} | EXACT_UPRN: ${afterStats.exact_uprn} | POSTCODE_UPRN: ${afterStats.postcode_uprn} | ESTIMATED: ${afterStats.estimated}`);
    console.log(`===> Exact-address rate for ${outcodeArg}: ${afterStats.percentage}%`);
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
    console.log(`[Complete] Pass 2 placed ${totalUpgraded.toLocaleString()} properties in ${regionLabel} on a UPRN (exact or postcode-level) in ${elapsed}s.`);
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
