import { openDatabase } from './connection.js';
import { cleanStreet, extractStreet } from './address.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');

console.log('=== REAL Intel: Pass 3 Street-Cluster Matcher (Retired/Corporate Postcodes) ===');

const args = process.argv.slice(2);
const areaArg = args.find(a => a.startsWith('--area='))?.split('=')[1]?.toUpperCase();
const outcodeArg = args.find(a => a.startsWith('--outcode='))?.split('=')[1]?.toUpperCase();

const db = openDatabase();

// Outcode selection
let outcodes = [];
if (outcodeArg) {
  outcodes = [outcodeArg];
} else if (areaArg === 'BS' || areaArg === 'BRISTOL') {
  for (let i = 1; i <= 49; i++) outcodes.push(`BS${i}`);
  outcodes.push('BS98', 'BS99');
} else if (areaArg === 'LONDON') {
  const rows = db.prepare(`
    SELECT DISTINCT SUBSTR(postcode, 1, INSTR(postcode, ' ') - 1) as oc 
    FROM properties 
    WHERE (
      postcode GLOB 'E[0-9]*' OR postcode GLOB 'EC[0-9]*' OR 
      postcode GLOB 'N[0-9]*' OR postcode GLOB 'NW[0-9]*' OR 
      postcode GLOB 'SE[0-9]*' OR postcode GLOB 'SW[0-9]*' OR 
      postcode GLOB 'W[0-9]*' OR postcode GLOB 'WC[0-9]*'
    ) AND INSTR(postcode, ' ') > 0
  `).all();
  outcodes = rows.map(r => r.oc).sort();
} else {
  console.log('Usage: node server/street-matcher.js --area=BS | --area=London | --outcode=<OC>');
  process.exit(0);
}

const getUnmatchedProps = db.prepare(`
  SELECT id, property_address, postcode
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
    AND (precision_level IS NULL OR precision_level = 'ESTIMATED')
`);

const getMatchedPropsForStreet = db.prepare(`
  SELECT property_address, latitude, longitude
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
    AND precision_level IN ('EXACT_OSM', 'EXACT_UPRN')
`);

const updateStreetPrecisionStmt = db.prepare(`
  UPDATE properties
  SET latitude = ?, longitude = ?, precision_level = 'STREET_UPRN'
  WHERE id = ?
`);

const getStatsForOutcode = db.prepare(`
  SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN precision_level = 'EXACT_OSM' THEN 1 ELSE 0 END) as exact_osm,
    SUM(CASE WHEN precision_level = 'EXACT_UPRN' THEN 1 ELSE 0 END) as exact_uprn,
    SUM(CASE WHEN precision_level = 'STREET_UPRN' THEN 1 ELSE 0 END) as street_uprn,
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

let totalMatched = 0;
let totalChecked = 0;
const t0 = Date.now();

for (let i = 0; i < outcodes.length; i++) {
  const oc = outcodes[i];
  const lower = oc + ' ';
  const upper = oc + ' ~';

  const unmatched = getUnmatchedProps.all(lower, upper);
  if (unmatched.length === 0) continue;

  totalChecked += unmatched.length;

  // 1. Build street map from OSM cache if available
  const streetCoordMap = new Map();
  const cachePath = path.join(CACHE_DIR, `addresses_${oc}.json`);
  if (fs.existsSync(cachePath)) {
    try {
      const raw = fs.readFileSync(cachePath, 'utf8');
      const data = JSON.parse(raw);
      const elements = Array.isArray(data) ? data : (data.elements || []);
      for (const el of elements) {
        const st = cleanStreet(el.tags?.['addr:street']);
        const lat = el.lat !== undefined ? el.lat : el.center?.lat;
        const lon = el.lon !== undefined ? el.lon : el.center?.lon;
        if (st && lat && lon) {
          if (!streetCoordMap.has(st)) streetCoordMap.set(st, []);
          streetCoordMap.get(st).push({ lat, lon });
        }
      }
    } catch {
      // cache read err
    }
  }

  // 2. Supplement street map from existing high-precision matched properties in this outcode
  const matchedProps = getMatchedPropsForStreet.all(lower, upper);
  for (const mp of matchedProps) {
    const st = extractStreet(mp.property_address);
    if (st && mp.latitude && mp.longitude) {
      if (!streetCoordMap.has(st)) streetCoordMap.set(st, []);
      streetCoordMap.get(st).push({ lat: mp.latitude, lon: mp.longitude });
    }
  }

  if (streetCoordMap.size === 0) continue;

  let matchedThisOutcode = 0;
  db.exec('BEGIN TRANSACTION;');

  for (const prop of unmatched) {
    const st = extractStreet(prop.property_address);
    if (!st) continue;

    const coordsList = streetCoordMap.get(st);
    if (coordsList && coordsList.length > 0) {
      // Pick deterministic coordinate from cluster
      const idx = prop.id % coordsList.length;
      const coord = coordsList[idx];
      updateStreetPrecisionStmt.run(coord.lat, coord.lon, prop.id);
      matchedThisOutcode++;
      totalMatched++;
    }
  }

  db.exec('COMMIT;');

  if (matchedThisOutcode > 0) {
    const region = oc.startsWith('BS') ? 'Bristol' : 'London';
    const s = getStatsForOutcode.get(lower, upper);
    if (s && s.total > 0) {
      const precisionCount = (s.exact_osm || 0) + (s.exact_uprn || 0) + (s.street_uprn || 0);
      const pct = Number(((precisionCount / s.total) * 100).toFixed(1));
      upsertProgress.run(oc, region, s.total, precisionCount, pct, 'COMPLETED');
    }
  }

  if ((i + 1) % 25 === 0 || i === outcodes.length - 1) {
    console.log(`[Pass 3 ${i + 1}/${outcodes.length}] Outcode ${oc}: newly street-matched ${matchedThisOutcode} (Total matched so far: ${totalMatched.toLocaleString()})`);
  }
}

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log('\n=======================================================');
console.log(`[Pass 3 Complete] Matched ${totalMatched.toLocaleString()} / ${totalChecked.toLocaleString()} remaining estimated properties to street clusters in ${elapsed}s!`);
console.log('=======================================================\n');

db.close();
