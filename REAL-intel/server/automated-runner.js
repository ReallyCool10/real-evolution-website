/**
 * automated-runner.js
 * 
 * High-performance Automated Enrichment Runner for REAL Intel.
 * Progressively enriches commercial property records with exact sub-metre
 * building and doorway coordinates across the entire UK.
 * 
 * Priority:
 *   1. Bristol (BS1 - BS49) [58,190 properties]
 *   2. London (EC, WC, W, SW, SE, E, N, NW) [815,985 properties]
 *   3. Major UK Metros (B, M, LS, G, EH, etc.)
 *   4. Remaining UK postal areas
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { openDatabase } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CACHE_DIR = path.join(__dirname, 'cache');

if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

const db = openDatabase();

// enrichment_progress and address_points are defined in schema.js.

const getOutcodeProgress = db.prepare('SELECT * FROM enrichment_progress WHERE outcode = ?');
const upsertProgress = db.prepare(`
  INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status, last_updated)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(outcode) DO UPDATE SET
    total_properties = excluded.total_properties,
    matched_properties = excluded.matched_properties,
    match_percentage = excluded.match_percentage,
    status = excluded.status,
    last_updated = datetime('now')
`);

// Prepared statement for fast indexed outcode property range queries
const getPropsByOutcodeRange = db.prepare(`
  SELECT id, property_address, postcode, latitude, longitude
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
`);

const countPropsByOutcodeRange = db.prepare(`
  SELECT count(*) as cnt
  FROM properties
  WHERE postcode >= ? AND postcode <= ?
`);

const getBoundsByOutcodeRange = db.prepare(`
  SELECT min(latitude) as minLat, max(latitude) as maxLat, min(longitude) as minLon, max(longitude) as maxLon
  FROM properties
  WHERE postcode >= ? AND postcode <= ? AND latitude IS NOT NULL
`);

// 2. Normalization & Address Extraction Logic
function cleanPostcode(pc) {
  if (!pc) return '';
  return pc.replace(/\s+/g, '').toUpperCase();
}

function cleanStreet(st) {
  if (!st) return '';
  return st.toLowerCase()
    .replace(/\bst\.\s+/g, 'saint ')
    .replace(/\bst\s+([a-z]+)/g, (m, name) => {
      const saintNames = ['stephen', 'stephens', 'paul', 'pauls', 'peter', 'peters', 'nicholas', 'john', 'johns', 'mary', 'marys', 'george', 'georges', 'andrew', 'andrews', 'james', 'albans', 'giles', 'jude', 'judes', 'clements', 'thomas'];
      if (saintNames.includes(name)) return 'saint ' + name;
      return m;
    })
    .replace(/\b(rd|st|ave|ln|dr|cres|pl|sq|ter|ct|bvd|blvd)\b/g, (m) => {
      const map = { rd: 'road', st: 'street', ave: 'avenue', ln: 'lane', dr: 'drive', cres: 'crescent', pl: 'place', sq: 'square', ter: 'terrace', ct: 'court', bvd: 'boulevard', blvd: 'boulevard' };
      return map[m] || m;
    })
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanHouseNum(num) {
  if (!num) return '';
  return num.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

function expandNumberRange(rawStr) {
  if (!rawStr) return [];
  const str = rawStr.trim();

  // Single number
  if (/^\d+[a-z]?$/i.test(str)) {
    return [cleanHouseNum(str)];
  }

  // Range: 10-14, 10 to 14, 10/14
  const rangeMatch = str.match(/^(\d+)\s*(?:to|-|\/)\s*(\d+)$/i);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1], 10);
    const end = parseInt(rangeMatch[2], 10);
    if (!isNaN(start) && !isNaN(end) && end > start && end - start <= 20) {
      const step = ((end - start) % 2 === 0) ? 2 : 1;
      const list = [];
      for (let n = start; n <= end; n += step) list.push(String(n));
      return list;
    }
    return [String(start), String(end)];
  }

  // Multiple comma or "and" separated numbers: "16, 18, 20 and 22", "25 and 27"
  const allNums = str.match(/\b\d+[a-z]?\b/gi);
  if (allNums && allNums.length > 0) {
    return allNums.map(n => cleanHouseNum(n));
  }

  return [cleanHouseNum(str)];
}

const SUFFIXES = 'road|rd|street|st|avenue|ave|lane|ln|drive|dr|close|gardens|crescent|cres|place|pl|square|sq|terrace|ter|court|ct|grove|mews|row|rise|parade|park|wharf|boulevard|bvd|blvd|gate|broadway|quay|circus|reach|meadow|mead|bank|corner|end|view|green|alley|highway|passage|approach|side|mall|buildings|mansions|chambers';
const ADDRESS_REGEX = new RegExp(`(\\b\\d+[a-z]?(?:\\s*(?:to|-|\\/|&|and|,)\\s*\\d+[a-z]?)*)\\s+([A-Za-z\\s]+?\\b(?:${SUFFIXES}))\\b`, 'i');

function parseLRAddress(address) {
  if (!address) return { houseNums: [], street: null };

  let clean = address.replace(/\s+/g, ' ').replace(/\([A-Z0-9\s]+\)$/i, '').trim();

  // Strip common noisy prefix descriptions
  clean = clean.replace(/^(?:land\s+(?:and\s+buildings\s+)?(?:at\s+the\s+rear\s+of|on\s+the\s+(?:north|south|east|west)\s+side\s+of|lying\s+to\s+the\s+(?:north|south|east|west)\s+of|adjoining)\s+)/i, '');
  clean = clean.replace(/^(?:(?:ground|first|second|third|fourth|fifth|top)\s+floor(?:\s+flat|\s+suite)?\s*,\s*)/i, '');
  clean = clean.replace(/^(?:(?:flat|unit|suite|room|apartment|part\s+of|floor)\s+[^,]+,\s*)+/i, '');

  const match = clean.match(ADDRESS_REGEX);
  if (match) {
    const rawNum = match[1];
    const street = cleanStreet(match[2]);
    const nums = expandNumberRange(rawNum);
    return { houseNums: nums, street };
  }

  const parts = clean.split(',').map(s => s.trim());
  for (const part of parts) {
    const partMatch = part.match(ADDRESS_REGEX);
    if (partMatch) {
      return { houseNums: expandNumberRange(partMatch[1]), street: cleanStreet(partMatch[2]) };
    }
    const numMatch = part.match(/^(\d+[a-z]?(?:\s*(?:to|-|\/|&|and|,)\s*\d+[a-z]?)*)\s+(.+)$/i);
    if (numMatch) {
      return {
        houseNums: expandNumberRange(numMatch[1]),
        street: cleanStreet(numMatch[2])
      };
    }
  }

  return { houseNums: [], street: null };
}

// 3. Multi-Mirror Address Point Fetching with Timeout & Cache
const OVERPASS_MIRRORS = [
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter'
];

async function fetchAddressPointsForOutcode(outcode) {
  const cacheFile = path.join(CACHE_DIR, `addresses_${outcode}.json`);
  if (fs.existsSync(cacheFile)) {
    try {
      const cached = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      if (Array.isArray(cached) && cached.length > 0) return cached;
    } catch {
      // re-fetch if corrupted
    }
  }

  // Use fast indexed query for tight outcode bounds
  const lower = `${outcode} `;
  const upper = `${outcode} 9ZZ`;
  const b = getBoundsByOutcodeRange.get(lower, upper);

  if (!b || !b.minLat) return [];
  const minLat = (b.minLat - 0.003).toFixed(4);
  const maxLat = (b.maxLat + 0.003).toFixed(4);
  const minLon = (b.minLon - 0.003).toFixed(4);
  const maxLon = (b.maxLon + 0.003).toFixed(4);

  const query = `[out:json][timeout:35];(node["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon});way["addr:housenumber"](${minLat},${minLon},${maxLat},${maxLon}););out center;`;

  let lastError = null;

  for (const mirror of OVERPASS_MIRRORS) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 35000);

      const res = await fetch(mirror, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'RealIntel-AutomatedRunner/1.0'
        },
        body: 'data=' + encodeURIComponent(query)
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Mirror ${mirror} HTTP ${res.status}`);
      }

      const text = await res.text();
      if (!text.startsWith('{')) {
        throw new Error(`Mirror ${mirror} returned non-JSON`);
      }

      const data = JSON.parse(text);
      const elements = data.elements || [];

      fs.writeFileSync(cacheFile, JSON.stringify(elements));
      return elements;
    } catch (err) {
      lastError = err;
      // Try next mirror
    }
  }

  throw lastError || new Error(`All Overpass mirrors failed for ${outcode}`);
}

// 4. Ingest and Process Outcode
export async function processOutcode(outcode, region = 'UK') {
  console.log(`\n==================================================`);
  console.log(`[Automated Runner] Processing Outcode: ${outcode} (${region})`);

  const lower = `${outcode} `;
  const upper = `${outcode} 9ZZ`;

  const propCount = countPropsByOutcodeRange.get(lower, upper);
  const totalProps = propCount ? propCount.cnt : 0;

  if (totalProps === 0) {
    console.log(`No properties found for outcode ${outcode}. Skipping.`);
    upsertProgress.run(outcode, region, 0, 0, 0, 'COMPLETED');
    return { outcode, total: 0, matched: 0, pct: 0 };
  }

  console.log(`Found ${totalProps.toLocaleString()} commercial properties in ${outcode}.`);
  upsertProgress.run(outcode, region, totalProps, 0, 0, 'IN_PROGRESS');

  console.log(`Fetching physical building door points for ${outcode}...`);
  let elements = [];
  try {
    elements = await fetchAddressPointsForOutcode(outcode);
    console.log(`Obtained ${elements.length.toLocaleString()} building address nodes.`);
  } catch (err) {
    console.error(`Error fetching address points for ${outcode}:`, err.message);
    upsertProgress.run(outcode, region, totalProps, 0, 0, 'FAILED');
    return { outcode, total: totalProps, matched: 0, pct: 0, error: err.message };
  }

  // Build indexing maps
  const postcodeHouseMap = new Map();
  const streetHouseMap = new Map();

  for (const el of elements) {
    const lat = el.lat || (el.center && el.center.lat);
    const lon = el.lon || (el.center && el.center.lon);
    if (!lat || !lon || !el.tags) continue;

    const rawHNum = el.tags['addr:housenumber'];
    if (!rawHNum) continue;

    const pc = cleanPostcode(el.tags['addr:postcode']);
    const st = cleanStreet(el.tags['addr:street']);
    const numCandidates = expandNumberRange(rawHNum);

    for (const num of numCandidates) {
      if (pc) postcodeHouseMap.set(pc + '__' + num, { lat, lon });
      if (st) streetHouseMap.set(st + '__' + num, { lat, lon });
    }
  }

  const props = getPropsByOutcodeRange.all(lower, upper);
  const updateStmt = db.prepare("UPDATE properties SET latitude = ?, longitude = ?, precision_level = 'EXACT_OSM' WHERE id = ?");

  db.exec('BEGIN TRANSACTION');
  let matchedCount = 0;

  for (const prop of props) {
    const { houseNums, street } = parseLRAddress(prop.property_address);
    const pc = cleanPostcode(prop.postcode);

    let matchCoord = null;

    // 1st Priority: Postcode + House Number
    for (const num of houseNums) {
      if (pc && postcodeHouseMap.has(pc + '__' + num)) {
        matchCoord = postcodeHouseMap.get(pc + '__' + num);
        break;
      }
    }

    // 2nd Priority: Street + House Number
    if (!matchCoord && street) {
      for (const num of houseNums) {
        if (streetHouseMap.has(street + '__' + num)) {
          matchCoord = streetHouseMap.get(street + '__' + num);
          break;
        }
      }
    }

    if (matchCoord) {
      updateStmt.run(matchCoord.lat, matchCoord.lon, prop.id);
      matchedCount++;
    }
  }

  db.exec('COMMIT');

  const matchPct = totalProps > 0 ? parseFloat(((matchedCount / totalProps) * 100).toFixed(1)) : 0;
  upsertProgress.run(outcode, region, totalProps, matchedCount, matchPct, 'COMPLETED');

  console.log(`[Result] Outcode ${outcode} Complete:`);
  console.log(` - Total Properties: ${totalProps.toLocaleString()}`);
  console.log(` - Exact Building Matches: ${matchedCount.toLocaleString()} (${matchPct}%)`);
  console.log(` - Postcode Centroid Fallbacks: ${(totalProps - matchedCount).toLocaleString()} (${(100 - matchPct).toFixed(1)}%)`);

  return { outcode, total: totalProps, matched: matchedCount, pct: matchPct };
}

// 5. Dynamic Outcode Discovery from Database
export function discoverOutcodesForArea(area) {
  const a = area.toUpperCase();
  if (a === 'BS' || a === 'BRISTOL') {
    const rows = db.prepare(`
      SELECT substr(postcode, 1, instr(postcode, char(32)) - 1) as outcode, count(*) as cnt
      FROM properties
      WHERE postcode >= 'BS' AND postcode <= 'BS99'
      GROUP BY outcode
      HAVING outcode != ''
      ORDER BY cnt DESC
    `).all();
    return rows.map(r => ({ outcode: r.outcode, count: r.cnt, region: 'Bristol' }));
  }

  if (a === 'LONDON') {
    const prefixes = ['EC', 'WC', 'W', 'SW', 'SE', 'E', 'N', 'NW'];
    const outcodes = [];
    for (const p of prefixes) {
      const rows = db.prepare(`
        SELECT substr(postcode, 1, instr(postcode, char(32)) - 1) as outcode, count(*) as cnt
        FROM properties
        WHERE postcode >= ? AND postcode <= ?
        GROUP BY outcode
        HAVING outcode != ''
        ORDER BY cnt DESC
      `).all(`${p}`, `${p}99`);
      for (const r of rows) {
        outcodes.push({ outcode: r.outcode, count: r.cnt, region: 'London' });
      }
    }
    outcodes.sort((a, b) => b.count - a.count);
    return outcodes;
  }

  // Generic prefix
  const rows = db.prepare(`
    SELECT substr(postcode, 1, instr(postcode, char(32)) - 1) as outcode, count(*) as cnt
    FROM properties
    WHERE postcode >= ? AND postcode <= ?
    GROUP BY outcode
    HAVING outcode != ''
    ORDER BY cnt DESC
  `).all(`${a}`, `${a}99`);
  return rows.map(r => ({ outcode: r.outcode, count: r.cnt, region: a }));
}

// 6. Display Dashboard Status
export function displayStatus() {
  const rows = db.prepare(`
    SELECT outcode, region, total_properties, matched_properties, match_percentage, status, last_updated
    FROM enrichment_progress
    ORDER BY region, outcode
  `).all();

  console.log('\n========================================================================================');
  console.log('REAL Intel — Automated Address Enrichment Progress Dashboard');
  console.log('========================================================================================');

  if (rows.length === 0) {
    console.log('No outcodes have been processed yet. Run with --area BS to start Bristol!');
    return;
  }

  let grandTotal = 0;
  let grandMatched = 0;

  console.log('OUTCODE  | REGION      | TOTAL PROPS | MATCHED (BUILDING) | MATCH % | STATUS');
  console.log('---------+-------------+-------------+--------------------+---------+----------');
  for (const r of rows) {
    grandTotal += r.total_properties;
    grandMatched += r.matched_properties;
    const oc = r.outcode.padEnd(8);
    const reg = (r.region || 'UK').padEnd(11);
    const tot = String(r.total_properties.toLocaleString()).padStart(11);
    const mat = String(r.matched_properties.toLocaleString()).padStart(18);
    const pct = `${r.match_percentage.toFixed(1)}%`.padStart(7);
    const stat = (r.status || 'PENDING').padEnd(10);
    console.log(`${oc} | ${reg} | ${tot} | ${mat} | ${pct} | ${stat}`);
  }

  const overallPct = grandTotal > 0 ? ((grandMatched / grandTotal) * 100).toFixed(1) : 0;
  console.log('---------+-------------+-------------+--------------------+---------+----------');
  console.log(`TOTAL    | ALL REGIONS | ${grandTotal.toLocaleString().padStart(11)} | ${grandMatched.toLocaleString().padStart(18)} | ${overallPct}% |`);
  console.log('========================================================================================\n');
}

// 7. Orchestration CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status')) {
    displayStatus();
    return;
  }

  let queue = [];
  let regionName = 'Custom';

  const areaIdx = args.indexOf('--area');
  if (areaIdx !== -1 && args[areaIdx + 1]) {
    const area = args[areaIdx + 1].toUpperCase();
    const discovered = discoverOutcodesForArea(area);
    queue = discovered;
    regionName = area === 'BS' ? 'Bristol' : area;
  }

  const outcodeIdx = args.indexOf('--outcode');
  if (outcodeIdx !== -1 && args[outcodeIdx + 1]) {
    const oc = args[outcodeIdx + 1].toUpperCase();
    queue = [{ outcode: oc, count: 0, region: 'Single Outcode' }];
    regionName = oc;
  }

  if (queue.length === 0) {
    console.log(`
REAL Intel — Automated Address Enrichment Runner
------------------------------------------------
Usage:
  node server/automated-runner.js --area BS          Process all 50 Bristol outcodes (BS1 - BS49)
  node server/automated-runner.js --area London      Process all London outcodes (EC, WC, W, SW, etc.)
  node server/automated-runner.js --outcode BS1      Process a single outcode (e.g. BS1)
  node server/automated-runner.js --status           Show progress dashboard
`);
    return;
  }

  console.log(`\n========================================================================================`);
  console.log(`[REAL Intel] Starting Automated Enrichment Queue for: ${regionName}`);
  console.log(`Total outcodes in queue: ${queue.length}`);
  console.log(`========================================================================================`);

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i];
    const outcode = item.outcode;
    const region = item.region || regionName;

    const existing = getOutcodeProgress.get(outcode);
    // Only skip if successfully completed with > 0 matches
    if (existing && existing.status === 'COMPLETED' && existing.matched_properties > 0) {
      console.log(`[Skip ${i + 1}/${queue.length}] Outcode ${outcode} already completed (${existing.matched_properties}/${existing.total_properties} matched).`);
      continue;
    }

    try {
      console.log(`\n[Progress: ${i + 1}/${queue.length}] Processing ${outcode}...`);
      await processOutcode(outcode, region);
    } catch (e) {
      console.error(`Error processing ${outcode}:`, e.message);
    }

    if (i < queue.length - 1) {
      console.log(`Waiting 2.5s before next outcode...`);
      await new Promise(r => setTimeout(r, 2500));
    }
  }

  console.log(`\n========================================================================================`);
  console.log(`Queue completed for ${regionName}!`);
  console.log(`========================================================================================`);
  displayStatus();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  main().catch(err => console.error('Fatal runner error:', err));
}
