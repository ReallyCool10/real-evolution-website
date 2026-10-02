import { openDatabase } from './connection.js';
import { recordOutcodeProgress } from './progress.js';
import { cleanHouseNum, cleanStreet, parseLRAddress, postcodeKey } from './address.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

const db = openDatabase();

const OVERPASS_MIRRORS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://lz4.overpass-api.de/api/interpreter',
  'https://z.overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

const getBoundsStmt = db.prepare(`
  SELECT min(latitude) as minLat, max(latitude) as maxLat, min(longitude) as minLon, max(longitude) as maxLon
  FROM properties
  WHERE postcode >= ? AND postcode <= ? AND latitude IS NOT NULL
`);

const getPropsStmt = db.prepare(`
  SELECT id, property_address, postcode
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
    AND (precision_level IS NULL OR precision_level != 'EXACT_OSM')
`);

const updatePrecisionStmt = db.prepare(`
  UPDATE properties 
  SET latitude = ?, longitude = ?, precision_level = 'EXACT_OSM' 
  WHERE id = ?
`);



async function fetchOutcodeNodes(outcode) {
  const cacheFile = path.join(CACHE_DIR, `addresses_${outcode}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      const els = Array.isArray(cached) ? cached : (cached.elements || []);
      if (els.length > 0) return els;
    } catch {}
  }

  const lower = `${outcode} `;
  const upper = `${outcode} ~`;
  const b = getBoundsStmt.get(lower, upper);
  if (!b || !b.minLat) return null;

  const minLat = (b.minLat - 0.003).toFixed(4);
  const maxLat = (b.maxLat + 0.003).toFixed(4);
  const minLon = (b.minLon - 0.003).toFixed(4);
  const maxLon = (b.maxLon + 0.003).toFixed(4);

  const query = `[out:json][timeout:40];(node["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon});way["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon}););out center;`;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 40000);
      const res = await fetch(mirror, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RealIntel-PrecisionRunner/2.0'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      clearTimeout(timer);

      if (!res.ok) continue;
      const text = await res.text();
      if (!text.startsWith('{')) continue;

      const json = JSON.parse(text);
      if (Array.isArray(json.elements) && json.elements.length > 0) {
        fs.writeFileSync(cacheFile, JSON.stringify(json.elements));
        return json.elements;
      }
    } catch {
      // try next mirror
    }
  }
  return null;
}

export async function processOutcode(outcode) {
  const lower = `${outcode} `;
  const upper = `${outcode} ~`;

  const elements = await fetchOutcodeNodes(outcode);
  if (!elements || elements.length === 0) {
    console.log(`[Overpass] ${outcode}: No nodes returned or mirrors throttled.`);
    return 0;
  }

  // Build maps
  const exactMap = new Map();
  const streetNumMap = new Map();

  for (const el of elements) {
    const tags = el.tags || {};
    const lat = el.lat !== undefined ? el.lat : el.center?.lat;
    const lon = el.lon !== undefined ? el.lon : el.center?.lon;
    if (lat === undefined || lon === undefined) continue;

    const num = cleanHouseNum(tags['addr:housenumber']);
    const street = cleanStreet(tags['addr:street']);
    const pc = postcodeKey(tags['addr:postcode']);

    if (num && street && pc) exactMap.set(`${pc}|${street}|${num}`, { lat, lon });
    if (num && street && !streetNumMap.has(`${street}|${num}`)) streetNumMap.set(`${street}|${num}`, { lat, lon });
  }

  const props = getPropsStmt.all(lower, upper);
  let newlyUpgraded = 0;

  db.exec('BEGIN TRANSACTION;');
  for (const p of props) {
    const { houseNums, street } = parseLRAddress(p.property_address);
    if (!street || houseNums.length === 0) continue;

    const propPc = postcodeKey(p.postcode);
    let coords = null;
    for (const num of houseNums) {
      if (propPc) {
        coords = exactMap.get(`${propPc}|${street}|${num}`);
        if (coords) break;
      }
      coords = streetNumMap.get(`${street}|${num}`);
      if (coords) break;
    }

    if (coords) {
      updatePrecisionStmt.run(coords.lat, coords.lon, p.id);
      newlyUpgraded++;
    }
  }
  db.exec('COMMIT;');

  recordOutcodeProgress(db, outcode, 'London');

  console.log(`[Overpass Completed] Outcode ${outcode}: ${elements.length.toLocaleString()} OSM nodes fetched -> ${newlyUpgraded.toLocaleString()} newly upgraded to EXACT_OSM (Doorway)`);
  return newlyUpgraded;
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

const TARGET_OUTCODES = [
  'NW10', 'E17',  'SW16', 'NW9',  'W5',   'E11',  'N9',   'SE9',
  'E12',  'N19',  'SE19', 'SE17', 'SE20', 'E9',   'SE26', 'N3',
  'N12',  'N18',  'SE4',  'SE3',  'SE14', 'W1T',  'W1U',  'NW5',
  'N13',  'SE27', 'W1J',  'W13',  'N11',  'NW7',  'SE8',  'W7',
  'N10',  'SE7',  'EC1A', 'EC2A', 'WC1X', 'WC1E', 'EC4N', 'WC2E',
  'EC1B', 'EC2',  'EC3',  'EC4',  'WC1',  'WC2',  'SW1'
];

async function runBatch() {
  console.log(`\nStarting polite batch fetch across ${TARGET_OUTCODES.length} London outcodes...`);
  let grandTotal = 0;
  for (let i = 0; i < TARGET_OUTCODES.length; i++) {
    const oc = TARGET_OUTCODES[i];
    console.log(`\n[${i + 1}/${TARGET_OUTCODES.length}] Fetching Overpass for ${oc}...`);
    try {
      const count = await processOutcode(oc);
      grandTotal += count;
    } catch (e) {
      console.error(`Error processing ${oc}:`, e.message);
    }
    await sleep(2500);
  }
  console.log(`\n=======================================================`);
  console.log(`[All Complete] Upgraded ${grandTotal.toLocaleString()} properties to EXACT_OSM!`);
  console.log(`=======================================================\n`);
  db.close();
}

const arg = process.argv[2]?.toUpperCase();
if (arg === '--ALL') {
  runBatch();
} else if (arg) {
  processOutcode(arg).then(() => db.close());
} else {
  console.log('Usage: node server/fetch-missing-london.js <OUTCODE> | --all');
  process.exit(0);
}
