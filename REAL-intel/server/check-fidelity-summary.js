import { db } from './db.js';

const sql = `
  SELECT 
    CASE 
      WHEN postcode GLOB 'BS*' THEN 'Bristol'
      ELSE 'London'
    END as region,
    COALESCE(precision_level, 'ESTIMATED') as level,
    COUNT(*) as count
  FROM properties
  WHERE (
    postcode GLOB 'BS*' OR postcode GLOB 'E[0-9]*' OR postcode GLOB 'EC[0-9]*' OR 
    postcode GLOB 'N[0-9]*' OR postcode GLOB 'NW[0-9]*' OR postcode GLOB 'SE[0-9]*' OR 
    postcode GLOB 'SW[0-9]*' OR postcode GLOB 'W[0-9]*' OR postcode GLOB 'WC[0-9]*'
  )
  GROUP BY region, level
`;

const rows = db.prepare(sql).all();
console.table(rows);

const total = db.prepare(`
  SELECT
    COUNT(*) as total,
    SUM(precision_level = 'EXACT_OSM') as exact_osm,
    SUM(precision_level = 'EXACT_UPRN') as exact_uprn,
    SUM(precision_level = 'STREET_UPRN') as street_uprn,
    SUM(precision_level = 'POSTCODE_UPRN') as postcode_uprn,
    SUM(precision_level IS NULL OR precision_level = 'ESTIMATED') as estimated
  FROM properties
  WHERE (
    postcode GLOB 'BS*' OR postcode GLOB 'E[0-9]*' OR postcode GLOB 'EC[0-9]*' OR
    postcode GLOB 'N[0-9]*' OR postcode GLOB 'NW[0-9]*' OR postcode GLOB 'SE[0-9]*' OR
    postcode GLOB 'SW[0-9]*' OR postcode GLOB 'W[0-9]*' OR postcode GLOB 'WC[0-9]*'
  )
`).get();

// Exact = placed at the property's own address. Approximate = a real building on the right
// street or in the right postcode, but not necessarily this one. (See server/progress.js.)
const pct = n => `${((n / total.total) * 100).toFixed(2)}%`;
const exact = total.exact_osm + total.exact_uprn;
const approximate = total.street_uprn + total.postcode_uprn;
console.log(`\nExact address:        ${exact.toLocaleString()} / ${total.total.toLocaleString()} (${pct(exact)})`);
console.log(`  OSM ${total.exact_osm.toLocaleString()}, single-address UPRN ${total.exact_uprn.toLocaleString()}`);
console.log(`Approximate building: ${approximate.toLocaleString()} (${pct(approximate)})`);
console.log(`  same street ${total.street_uprn.toLocaleString()}, same postcode ${total.postcode_uprn.toLocaleString()}`);
console.log(`Postcode centroid:    ${total.estimated.toLocaleString()} (${pct(total.estimated)})`);

db.close();
