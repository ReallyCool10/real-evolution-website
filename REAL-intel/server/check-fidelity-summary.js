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
    SUM(CASE WHEN precision_level = 'EXACT_OSM' THEN 1 ELSE 0 END) as exact_osm,
    SUM(CASE WHEN precision_level = 'EXACT_UPRN' THEN 1 ELSE 0 END) as exact_uprn,
    SUM(CASE WHEN precision_level = 'STREET_UPRN' THEN 1 ELSE 0 END) as street_uprn,
    SUM(CASE WHEN precision_level IS NULL OR precision_level = 'ESTIMATED' THEN 1 ELSE 0 END) as estimated
  FROM properties
  WHERE (
    postcode GLOB 'BS*' OR postcode GLOB 'E[0-9]*' OR postcode GLOB 'EC[0-9]*' OR 
    postcode GLOB 'N[0-9]*' OR postcode GLOB 'NW[0-9]*' OR postcode GLOB 'SE[0-9]*' OR 
    postcode GLOB 'SW[0-9]*' OR postcode GLOB 'W[0-9]*' OR postcode GLOB 'WC[0-9]*'
  )
`).get();

const highFidelity = (total.exact_osm + total.exact_uprn + total.street_uprn);
const pct = ((highFidelity / total.total) * 100).toFixed(2);
console.log(`\nOverall High-Fidelity Building Precision: ${highFidelity.toLocaleString()} / ${total.total.toLocaleString()} (${pct}%)`);
console.log(`Remaining Centroids: ${total.estimated.toLocaleString()} (${((total.estimated / total.total) * 100).toFixed(2)}%)`);

db.close();
