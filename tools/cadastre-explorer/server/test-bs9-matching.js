import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';

const raw = JSON.parse(fs.readFileSync('server/bs9_osm_addresses.json', 'utf8'));
const db = new DatabaseSync('server/cadastre.sqlite');

// Build an in-memory lookup map from the OSM address points
// Key 1: clean_postcode + '__' + normalized_housenumber
// Key 2: clean_street + '__' + normalized_housenumber
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

console.log(`Indexed ${postcodeHouseMap.size} postcode+housenumber points and ${streetHouseMap.size} street+housenumber points.`);

// Function to extract house number and street from Land Registry address
function parseLRAddress(address, postcode) {
  if (!address) return { houseNum: null, street: null };
  const clean = address.replace(/\s+/g, ' ').trim();
  const noPostcode = clean.replace(/\([A-Z0-9\s]+\)$/i, '').trim();

  // Pattern 1: Number + Street Name
  const match = noPostcode.match(/(?:(?:flat|unit|suite|room|apartment|floor|part\s+of)\s+[^,]+,\s*)*(?:[^,]+,\s*)*?(\b\d+[a-z]?(?:\s*[-/&and,]+\s*\d+[a-z]?)?)\s+([A-Za-z\s]+(?:Road|Street|Avenue|Lane|Way|Drive|Close|Gardens|Crescent|Place|Walk|Square|Hill|Terrace|Yard|Court|Grove|Mews|Row|Rise|Parade|Park|Wharf|Boulevard|Gate|Broadway|Quay|Circus|Reach|Meadow|Bank|Corner|End|View|Green|Alley|Highway|Passage|Approach|Rise|Side))\b/i);

  if (match) {
    // If range like 141-145, take first or normalized
    const rawNum = match[1].split(/[-/&]/)[0].trim();
    return {
      houseNum: cleanHouseNum(rawNum),
      street: cleanStreet(match[2])
    };
  }

  // Fallback pattern: standalone number at start of a comma segment
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

// Fetch all BS9 properties from cadastre.sqlite
const bs9Props = db.prepare('SELECT id, title_number, property_address, postcode, latitude, longitude FROM properties WHERE postcode LIKE ?').all('BS9 %');
console.log(`Total Land Registry commercial properties in BS9: ${bs9Props.length}`);

let matchedPostcodeHouse = 0;
let matchedStreetHouse = 0;
let unnumberedOrUnmatched = 0;

const matchedSamples = [];
const unmatchedSamples = [];

for (const prop of bs9Props) {
  const { houseNum, street } = parseLRAddress(prop.property_address, prop.postcode);
  const pc = cleanPostcode(prop.postcode);

  let matchCoord = null;
  let matchMethod = null;

  if (houseNum && pc && postcodeHouseMap.has(pc + '__' + houseNum)) {
    matchCoord = postcodeHouseMap.get(pc + '__' + houseNum);
    matchMethod = 'postcode_house';
    matchedPostcodeHouse++;
  } else if (houseNum && street && streetHouseMap.has(street + '__' + houseNum)) {
    matchCoord = streetHouseMap.get(street + '__' + houseNum);
    matchMethod = 'street_house';
    matchedStreetHouse++;
  }

  if (matchCoord) {
    const distMetres = Math.round(
      Math.sqrt(
        Math.pow((matchCoord.lat - prop.latitude) * 111000, 2) +
        Math.pow((matchCoord.lon - prop.longitude) * 111000 * Math.cos(prop.latitude * Math.PI / 180), 2)
      )
    );
    if (matchedSamples.length < 15) {
      matchedSamples.push({
        title: prop.title_number,
        address: prop.property_address,
        houseNum,
        origCoord: [prop.latitude, prop.longitude],
        newCoord: [matchCoord.lat, matchCoord.lon],
        distMoved: `${distMetres}m`,
        method: matchMethod
      });
    }
  } else {
    unnumberedOrUnmatched++;
    if (unmatchedSamples.length < 10) {
      unmatchedSamples.push({
        title: prop.title_number,
        address: prop.property_address,
        postcode: prop.postcode,
        parsedHouse: houseNum
      });
    }
  }
}

const totalMatched = matchedPostcodeHouse + matchedStreetHouse;
const matchRate = ((totalMatched / bs9Props.length) * 100).toFixed(1);

console.log('--------------------------------------------------');
console.log(`PILOT RESULTS FOR BS9 (Bristol):`);
console.log(`Total properties tested: ${bs9Props.length}`);
console.log(`Exact Door/Building Point Matches: ${totalMatched} (${matchRate}%)`);
console.log(` - Matched by Postcode + House No: ${matchedPostcodeHouse}`);
console.log(` - Matched by Street + House No: ${matchedStreetHouse}`);
console.log(`Fallback to Postcode Centroid: ${unnumberedOrUnmatched} (${((unnumberedOrUnmatched / bs9Props.length) * 100).toFixed(1)}%)`);
console.log('--------------------------------------------------');
console.log('\nSample Matched Properties (Jumped from generic centroid to exact doorstep):');
console.log(JSON.stringify(matchedSamples, null, 2));
console.log('\nSample Unmatched Properties (Retain postcode centroid):');
console.log(JSON.stringify(unmatchedSamples, null, 2));
