import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const raw = JSON.parse(fs.readFileSync('server/bs9_osm_addresses.json', 'utf8'));
const db = new DatabaseSync('server/cadastre.sqlite');

const postcodeHouseMap = new Map();
const streetHouseMap = new Map();

function cleanPostcode(pc) {
  if (!pc) return '';
  return pc.replace(/\s+/g, '').toUpperCase();
}

function cleanStreet(st) {
  if (!st) return '';
  return st.toLowerCase().replace(/[^a-z0-9]/g, ' ').replace(/\s+/g, ' ').trim();
}

function cleanHouseNum(num) {
  if (!num) return '';
  return num.toLowerCase().replace(/[^a-z0-9]/g, '').trim();
}

for (const el of raw) {
  const lat = el.lat || (el.center && el.center.lat);
  const lon = el.lon || (el.center && el.center.lon);
  if (!lat || !lon || !el.tags) continue;

  const hNum = cleanHouseNum(el.tags['addr:housenumber']);
  if (!hNum) continue;

  const pc = cleanPostcode(el.tags['addr:postcode']);
  const st = cleanStreet(el.tags['addr:street']);

  if (pc) {
    postcodeHouseMap.set(pc + '__' + hNum, { lat, lon });
  }
  if (st) {
    streetHouseMap.set(st + '__' + hNum, { lat, lon });
  }
}

function parseLRAddress(address, postcode) {
  if (!address) return { houseNum: null, street: null };
  const clean = address.replace(/\s+/g, ' ').trim();
  const noPostcode = clean.replace(/\([A-Z0-9\s]+\)$/i, '').trim();

  const match = noPostcode.match(/(?:(?:flat|unit|suite|room|apartment|floor|part\s+of)\s+[^,]+,\s*)*(?:[^,]+,\s*)*?(\b\d+[a-z]?(?:\s*[-/&and,]+\s*\d+[a-z]?)?)\s+([A-Za-z\s]+(?:Road|Street|Avenue|Lane|Way|Drive|Close|Gardens|Crescent|Place|Walk|Square|Hill|Terrace|Yard|Court|Grove|Mews|Row|Rise|Parade|Park|Wharf|Boulevard|Gate|Broadway|Quay|Circus|Reach|Meadow|Bank|Corner|End|View|Green|Alley|Highway|Passage|Approach|Rise|Side))\b/i);

  if (match) {
    const rawNum = match[1].split(/[-/&]/)[0].trim();
    return {
      houseNum: cleanHouseNum(rawNum),
      street: cleanStreet(match[2])
    };
  }

  const parts = noPostcode.split(',').map(s => s.trim());
  for (const part of parts) {
    const numMatch = part.match(/^(\d+[a-z]?)\s+(.+)$/i);
    if (numMatch) {
      return {
        houseNum: cleanHouseNum(numMatch[1]),
        street: cleanStreet(numMatch[2])
      };
    }
  }

  return { houseNum: null, street: null };
}

const bs9Props = db.prepare('SELECT id, property_address, postcode, latitude, longitude FROM properties WHERE postcode LIKE ?').all('BS9 %');

const updateStmt = db.prepare('UPDATE properties SET latitude = ?, longitude = ? WHERE id = ?');

db.exec('BEGIN TRANSACTION');
let updatedCount = 0;

for (const prop of bs9Props) {
  const { houseNum, street } = parseLRAddress(prop.property_address, prop.postcode);
  const pc = cleanPostcode(prop.postcode);

  let matchCoord = null;
  if (houseNum && pc && postcodeHouseMap.has(pc + '__' + houseNum)) {
    matchCoord = postcodeHouseMap.get(pc + '__' + houseNum);
  } else if (houseNum && street && streetHouseMap.has(street + '__' + houseNum)) {
    matchCoord = streetHouseMap.get(street + '__' + houseNum);
  }

  if (matchCoord) {
    updateStmt.run(matchCoord.lat, matchCoord.lon, prop.id);
    updatedCount++;
  }
}

db.exec('COMMIT');

console.log(`Successfully updated ${updatedCount} properties in BS9 to exact building coordinates!`);
