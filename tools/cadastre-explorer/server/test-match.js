import fs from 'node:fs';
import readline from 'node:readline';
import { DatabaseSync } from 'node:sqlite';

console.log('Testing loading ukpostcodes.csv and matching against properties...');
const t0 = Date.now();

const postcodeMap = new Map();
const fileStream = fs.createReadStream('C:/Dev/real-evolution-website/DATA/ukpostcodes.csv');
const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

let lineIdx = 0;
for await (const line of rl) {
  if (lineIdx++ === 0) continue; // header
  const comma1 = line.indexOf(',');
  const comma2 = line.indexOf(',', comma1 + 1);
  const comma3 = line.indexOf(',', comma2 + 1);
  if (comma1 === -1 || comma2 === -1 || comma3 === -1) continue;

  const pc = line.slice(comma1 + 1, comma2).trim();
  const lat = parseFloat(line.slice(comma2 + 1, comma3));
  const lon = parseFloat(line.slice(comma3 + 1));
  if (!isNaN(lat) && !isNaN(lon)) {
    // Normalise postcode key: remove spaces for robust matching, e.g. "EC2M4TD"
    postcodeMap.set(pc.replace(/\s+/g, ''), { lat, lon });
  }
}

console.log(`Loaded ${postcodeMap.size.toLocaleString()} unique unit postcodes in ${Date.now() - t0}ms`);

// Test against a sample of 100,000 properties
const db = new DatabaseSync('server/cadastre.sqlite');
const sampleProps = db.prepare(`
  SELECT id, postcode, property_address
  FROM properties
  WHERE postcode IS NOT NULL AND postcode != ''
  LIMIT 100000
`).all();

let matched = 0;
for (const p of sampleProps) {
  const clean = p.postcode.replace(/[^A-Z0-9]/gi, '').toUpperCase();
  if (postcodeMap.has(clean)) {
    matched++;
  }
}

console.log(`Sample match rate: ${matched.toLocaleString()} / ${sampleProps.length.toLocaleString()} (${((matched / sampleProps.length) * 100).toFixed(2)}%)`);
