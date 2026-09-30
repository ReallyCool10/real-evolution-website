import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { openDatabase } from './connection.js';
import { DB_PATH, dataPath } from './paths.js';
import { ensureIndexes } from './schema.js';

const DATA_DIR = dataPath('NSUL', 'Data');

// High-speed, millimeter-accurate Transverse Mercator + 7-parameter Helmert shift (OSGB36 -> WGS84)
function fastBngToWgs84(easting, northing) {
  const a = 6377563.396, b = 6356256.909;
  const F0 = 0.9996012717;
  const lat0 = 0.8552113334772214, lon0 = -0.03490658503988659; // 49 deg, -2 deg in rad
  const N0 = -100000, E0 = 400000;
  const e2 = 0.006670539761597337;
  const n = 0.0016732202503250873;
  const n2 = n * n, n3 = n2 * n;

  let lat = lat0, M = 0;
  do {
    lat = (northing - N0 - M) / (a * F0) + lat;
    const dLat = lat - lat0;
    const sLat = lat + lat0;
    const Ma = (1 + n + 1.25 * n2 + 1.25 * n3) * dLat;
    const Mb = (3 * n + 3 * n2 + 2.625 * n3) * Math.sin(dLat) * Math.cos(sLat);
    const Mc = (1.875 * n2 + 1.875 * n3) * Math.sin(2 * dLat) * Math.cos(2 * sLat);
    const Md = (35 / 24) * n3 * Math.sin(3 * dLat) * Math.cos(3 * sLat);
    M = b * F0 * (Ma - Mb + Mc - Md);
  } while (Math.abs(northing - N0 - M) >= 0.0001);

  const cosLat = Math.cos(lat), sinLat = Math.sin(lat);
  const nu = a * F0 / Math.sqrt(1 - e2 * sinLat * sinLat);
  const rho = a * F0 * (1 - e2) / Math.pow(1 - e2 * sinLat * sinLat, 1.5);
  const eta2 = nu / rho - 1;

  const tanLat = Math.tan(lat);
  const tan2lat = tanLat * tanLat, tan4lat = tan2lat * tan2lat;
  const secLat = 1 / cosLat;
  const nu3 = nu * nu * nu, nu5 = nu3 * nu * nu;
  const VII = tanLat / (2 * rho * nu);
  const VIII = tanLat / (24 * rho * nu3) * (5 + 3 * tan2lat + eta2 - 9 * tan2lat * eta2);
  const IX = tanLat / (720 * rho * nu5) * (61 + 90 * tan2lat + 45 * tan4lat);
  const X = secLat / nu;
  const XI = secLat / (6 * nu3) * (nu / rho + 2 * tan2lat);
  const XII = secLat / (120 * nu5) * (5 + 28 * tan2lat + 24 * tan4lat);

  const dE = easting - E0;
  const dE2 = dE * dE, dE3 = dE2 * dE, dE4 = dE2 * dE2, dE5 = dE3 * dE2;
  const phi = lat - VII * dE2 + VIII * dE4 - IX * (dE4 * dE2);
  const lambda = lon0 + X * dE - XI * dE3 + XII * dE5;

  // OSGB36 -> WGS84 Helmert transform
  const sPhi = Math.sin(phi), cPhi = Math.cos(phi);
  const sLam = Math.sin(lambda), cLam = Math.cos(lambda);
  const H = 24.0;
  const nuA = a / Math.sqrt(1 - e2 * sPhi * sPhi);

  const x1 = (nuA + H) * cPhi * cLam;
  const y1 = (nuA + H) * cPhi * sLam;
  const z1 = ((1 - e2) * nuA + H) * sPhi;

  const tx = 446.448, ty = -125.157, tz = 542.060;
  const s = -20.4894e-6;
  const rx = 7.2819014e-7, ry = 1.1974898e-6, rz = 4.0826456e-6;

  const x2 = tx + (1 + s) * x1 - rz * y1 + ry * z1;
  const y2 = ty + rz * x1 + (1 + s) * y1 - rx * z1;
  const z2 = tz - ry * x1 + rx * y1 + (1 + s) * z1;

  const a2 = 6378137.0, b2 = 6356752.314245;
  const e2_2 = 0.00669437999014;
  const p = Math.sqrt(x2 * x2 + y2 * y2);
  let phi2 = Math.atan2(z2, p * (1 - e2_2));
  for (let i = 0; i < 4; i++) {
    const nu2 = a2 / Math.sqrt(1 - e2_2 * Math.sin(phi2) * Math.sin(phi2));
    phi2 = Math.atan2(z2 + e2_2 * nu2 * Math.sin(phi2), p);
  }
  const lambda2 = Math.atan2(y2, x2);

  return [parseFloat((lambda2 * 180 / Math.PI).toFixed(6)), parseFloat((phi2 * 180 / Math.PI).toFixed(6))];
}

console.log('=== REAL Intel: High-Performance NSUL / OS Open UPRN Ingest ===');
console.log(`Source Directory: ${DATA_DIR}`);
console.log(`Target Database:  ${DB_PATH}`);

if (!fs.existsSync(DATA_DIR)) {
  console.error(`Data directory not found: ${DATA_DIR}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const fileFilter = args.find(a => a.startsWith('--file='))?.split('=')[1];

let csvFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.csv'));
if (fileFilter) {
  csvFiles = csvFiles.filter(f => f.includes(fileFilter));
}

if (csvFiles.length === 0) {
  console.error('No matching CSV files found in NSUL/Data directory.');
  process.exit(1);
}

console.log(`Target CSV files to ingest:`, csvFiles);

const db = openDatabase();
db.exec('PRAGMA cache_size = -128000;'); // 128MB cache for the bulk load

console.log('[Optimization] Temporarily dropping idx_uprn_postcode for ultra-fast bulk insert...');
db.exec('DROP INDEX IF EXISTS idx_uprn_postcode;');

const insertStmt = db.prepare(`
  INSERT OR REPLACE INTO uprn_lookup (uprn, postcode, latitude, longitude)
  VALUES (?, ?, ?, ?)
`);

async function processFile(filename) {
  const filePath = path.join(DATA_DIR, filename);
  const sizeMb = (fs.statSync(filePath).size / 1024 / 1024).toFixed(1);
  console.log(`\n--- Ingesting ${filename} (${sizeMb} MB) ---`);

  const fileStream = fs.createReadStream(filePath, { highWaterMark: 2 * 1024 * 1024 });
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let isHeader = true;
  let uprnIdx = -1;
  let eastingIdx = -1;
  let northingIdx = -1;
  let postcodeIdx = -1;

  let totalRead = 0;
  let inserted = 0;
  let skipped = 0;
  const BATCH_SIZE = 50000;
  let batch = [];

  const t0 = Date.now();
  let lastReportTime = t0;

  function commitBatch() {
    if (batch.length === 0) return;
    db.exec('BEGIN TRANSACTION;');
    for (let i = 0; i < batch.length; i++) {
      const row = batch[i];
      insertStmt.run(row[0], row[1], row[2], row[3]);
    }
    db.exec('COMMIT;');
    inserted += batch.length;
    batch = [];
  }

  for await (const line of rl) {
    if (isHeader) {
      isHeader = false;
      const cleanLine = line.replace(/^\uFEFF/, '');
      const headers = cleanLine.split(',').map(h => h.trim().toUpperCase());
      uprnIdx = headers.indexOf('UPRN');
      eastingIdx = headers.indexOf('GRIDGB1E');
      northingIdx = headers.indexOf('GRIDGB1N');
      postcodeIdx = headers.indexOf('PCDS');

      if (uprnIdx === -1 || eastingIdx === -1 || northingIdx === -1 || postcodeIdx === -1) {
        throw new Error(`Required columns missing in ${filename}.`);
      }
      continue;
    }

    totalRead++;
    const cols = line.split(',');
    const uprnStr = cols[uprnIdx];
    const eastingStr = cols[eastingIdx];
    const northingStr = cols[northingIdx];
    const postcode = cols[postcodeIdx];

    if (!uprnStr || !eastingStr || !northingStr || !postcode) {
      skipped++;
      continue;
    }

    const uprn = parseInt(uprnStr, 10);
    const easting = parseFloat(eastingStr);
    const northing = parseFloat(northingStr);

    if (isNaN(uprn) || isNaN(easting) || isNaN(northing) || easting <= 0 || northing <= 0) {
      skipped++;
      continue;
    }

    const [lon, lat] = fastBngToWgs84(easting, northing);
    batch.push([uprn, postcode.trim().toUpperCase(), lat, lon]);

    if (batch.length >= BATCH_SIZE) {
      commitBatch();

      const now = Date.now();
      if (now - lastReportTime >= 2000) {
        const elapsedSec = (now - t0) / 1000;
        const rate = (inserted / elapsedSec).toFixed(0);
        process.stdout.write(`\r[Ingesting] ${inserted.toLocaleString()} UPRNs committed (${rate} rows/sec)...`);
        lastReportTime = now;
      }
    }
  }

  commitBatch();

  const totalTimeSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`\n[Finished ${filename}] Ingested ${inserted.toLocaleString()} UPRNs (${skipped.toLocaleString()} skipped) in ${totalTimeSec}s`);
}

async function run() {
  const overallStart = Date.now();
  for (const file of csvFiles) {
    await processFile(file);
  }

  console.log('\n--- Building High-Speed Postcode Index on uprn_lookup(postcode) ---');
  const idxStart = Date.now();
  ensureIndexes(db);
  console.log(`Index built in ${((Date.now() - idxStart) / 1000).toFixed(1)}s`);

  const count = db.prepare('SELECT COUNT(*) as total FROM uprn_lookup').get().total;
  console.log(`\n=======================================================`);
  console.log(`[Success] Total Official UPRNs in Local Index: ${Number(count).toLocaleString()}`);
  console.log(`Overall Execution Time: ${((Date.now() - overallStart) / 1000).toFixed(1)}s`);
  console.log(`=======================================================`);

  db.close();
}

run().catch(err => {
  console.error('\nIngest failed:', err);
  process.exit(1);
});
