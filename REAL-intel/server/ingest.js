import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import https from 'node:https';
import { fileURLToPath } from 'node:url';
import { parseCsvLine } from './csvParser.js';
import {
  findPostcodeCoords,
  insertPostcodesBatch,
  insertPropertiesBatch,
  getStats,
  db
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../DATA');
const OCOD_PATH = path.join(DATA_DIR, 'OCOD_FULL_2026_09', 'OCOD_FULL_2026_09.csv');
const CCOD_PATH = path.join(DATA_DIR, 'CCOD_FULL_2026_09', 'CCOD_FULL_2026_09.csv');

// Download and seed UK Outcodes (e.g. SW1, M1, BN21, LS1...) for 100% UK geographical coverage
export async function seedOutcodes() {
  const existing = db.prepare('SELECT COUNT(*) as c FROM postcodes').get();
  if (existing && existing.c > 2000) {
    console.log(`[Postcodes] Table already seeded with ${existing.c} postcodes.`);
    return;
  }

  console.log('[Postcodes] Downloading open UK outcode centroids from GitHub...');
  const url = 'https://raw.githubusercontent.com/Gibbs/uk-postcodes/master/postcodes.csv';

  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download postcodes: HTTP ${res.statusCode}`));
      }
      const rl = readline.createInterface({ input: res });
      const batch = [];
      let header = true;

      rl.on('line', (line) => {
        if (header) {
          header = false;
          return;
        }
        const parts = line.split(',');
        if (parts.length >= 5) {
          const pc = parts[0].trim().toUpperCase();
          const lat = parseFloat(parts[3]);
          const lon = parseFloat(parts[4]);
          if (!isNaN(lat) && !isNaN(lon)) {
            batch.push([pc, lat, lon]);
          }
        }
        if (batch.length >= 1000) {
          insertPostcodesBatch(batch.splice(0, batch.length));
        }
      });

      rl.on('close', () => {
        if (batch.length > 0) {
          insertPostcodesBatch(batch.splice(0, batch.length));
        }
        const count = db.prepare('SELECT COUNT(*) as c FROM postcodes').get();
        console.log(`[Postcodes] Successfully seeded ${count.c} postcodes into database.`);
        resolve();
      });
    }).on('error', reject);
  });
}

// Ingest OCOD (Overseas Corporate Ownership Data)
export async function ingestOcod() {
  if (!fs.existsSync(OCOD_PATH)) {
    console.warn(`[OCOD] File not found at ${OCOD_PATH}`);
    return;
  }

  const existing = db.prepare("SELECT COUNT(*) as c FROM properties WHERE dataset_type = 'OCOD'").get();
  if (existing && existing.c > 0) {
    console.log(`[OCOD] Already contains ${existing.c} records. Skipping ingestion.`);
    return;
  }

  console.log(`[OCOD] Starting ingestion from ${OCOD_PATH}...`);
  const fileStream = fs.createReadStream(OCOD_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = true;
  let batch = [];
  let rowCount = 0;
  let geocodedCount = 0;

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 13) continue;

    const postcode = (cols[6] || '').trim().toUpperCase();
    const coords = findPostcodeCoords(postcode);
    if (coords) geocodedCount++;

    const priceRaw = (cols[8] || '').replace(/[^0-9.]/g, '');
    const price = priceRaw ? parseFloat(priceRaw) : null;

    batch.push({
      title_number: cols[0],
      tenure: cols[1],
      property_address: cols[2],
      district: cols[3],
      county: cols[4],
      region: cols[5],
      postcode: postcode,
      price_paid: price,
      proprietor_name: cols[9],
      company_reg_no: cols[10],
      proprietorship_category: cols[11],
      country_incorporated: cols[12],
      proprietor_address: cols[13],
      date_added: cols[37] || '',
      dataset_type: 'OCOD',
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    });

    rowCount++;

    if (batch.length >= 2500) {
      insertPropertiesBatch(batch);
      batch = [];
      if (rowCount % 10000 === 0) {
        console.log(`[OCOD] Ingested ${rowCount.toLocaleString()} rows (${geocodedCount.toLocaleString()} geocoded)...`);
      }
    }
  }

  if (batch.length > 0) {
    insertPropertiesBatch(batch);
  }

  console.log(`[OCOD] Completed! Ingested ${rowCount.toLocaleString()} total rows (${geocodedCount.toLocaleString()} geocoded).`);
}

// Ingest CCOD (Commercial and Corporate Ownership Data)
export async function ingestCcod(maxRows = 100000) {
  if (!fs.existsSync(CCOD_PATH)) {
    console.warn(`[CCOD] File not found at ${CCOD_PATH}`);
    return;
  }

  const existing = db.prepare("SELECT COUNT(*) as c FROM properties WHERE dataset_type = 'CCOD'").get();
  if (existing && existing.c >= maxRows) {
    console.log(`[CCOD] Already contains ${existing.c} records (target was ${maxRows}). Skipping.`);
    return;
  }

  console.log(`[CCOD] Ingesting up to ${maxRows.toLocaleString()} rows from ${CCOD_PATH}...`);
  const fileStream = fs.createReadStream(CCOD_PATH);
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  let header = true;
  let batch = [];
  let rowCount = 0;
  let geocodedCount = 0;

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    const cols = parseCsvLine(line);
    if (cols.length < 13) continue;

    const postcode = (cols[6] || '').trim().toUpperCase();
    const coords = findPostcodeCoords(postcode);
    if (coords) geocodedCount++;

    const priceRaw = (cols[8] || '').replace(/[^0-9.]/g, '');
    const price = priceRaw ? parseFloat(priceRaw) : null;

    batch.push({
      title_number: cols[0],
      tenure: cols[1],
      property_address: cols[2],
      district: cols[3],
      county: cols[4],
      region: cols[5],
      postcode: postcode,
      price_paid: price,
      proprietor_name: cols[9],
      company_reg_no: cols[10],
      proprietorship_category: cols[11],
      country_incorporated: 'UNITED KINGDOM',
      proprietor_address: cols[12],
      date_added: cols[33] || '',
      dataset_type: 'CCOD',
      latitude: coords ? coords.latitude : null,
      longitude: coords ? coords.longitude : null
    });

    rowCount++;

    if (batch.length >= 2500) {
      insertPropertiesBatch(batch);
      batch = [];
      if (rowCount % 25000 === 0) {
        console.log(`[CCOD] Ingested ${rowCount.toLocaleString()} rows (${geocodedCount.toLocaleString()} geocoded)...`);
      }
    }

    if (rowCount >= maxRows) {
      break;
    }
  }

  if (batch.length > 0) {
    insertPropertiesBatch(batch);
  }

  console.log(`[CCOD] Completed! Ingested ${rowCount.toLocaleString()} rows (${geocodedCount.toLocaleString()} geocoded).`);
}

async function run() {
  const args = process.argv.slice(2);
  const ccodLimitArg = args.find(a => a.startsWith('--ccod-limit='));
  const ccodLimit = ccodLimitArg ? parseInt(ccodLimitArg.split('=')[1], 10) : 100000;

  console.log('=== REAL Cadastre Data Ingestion ===');
  await seedOutcodes();
  await ingestOcod();
  await ingestCcod(ccodLimit);

  console.log('=== Database Summary ===');
  console.log(getStats());
  console.log('Done.');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  run().catch(console.error);
}
