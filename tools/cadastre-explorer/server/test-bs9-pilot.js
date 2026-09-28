import fs from 'fs';

async function testOverpass() {
  const query = `
    [out:json][timeout:45];
    (
      node["addr:housenumber"](51.468, -2.669, 51.517, -2.591);
      way["addr:housenumber"](51.468, -2.669, 51.517, -2.591);
    );
    out center;
  `;
  const url = 'https://overpass-api.de/api/interpreter?data=' + encodeURIComponent(query);
  console.log('Querying Overpass API for BS9 area address points with house numbers...');
  
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'RealIntel-Pilot/1.0' } });
    if (!res.ok) {
      console.log('Overpass error status:', res.status, res.statusText);
      return;
    }
    const data = await res.json();
    console.log('Total OSM building/address elements with house numbers in BS9:', data.elements.length);
    
    fs.writeFileSync('server/bs9_osm_addresses.json', JSON.stringify(data.elements, null, 2));
    console.log('Saved to server/bs9_osm_addresses.json');

    let withPostcode = 0;
    let withStreet = 0;
    for (const e of data.elements) {
      if (e.tags && e.tags['addr:postcode']) withPostcode++;
      if (e.tags && e.tags['addr:street']) withStreet++;
    }
    console.log(`With postcode: ${withPostcode}, with street: ${withStreet}`);
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}

testOverpass();
