// Rebuilds the derived summary tables from `properties`. These are the only definitions of
// how the map's outcode/sector bubbles and the proprietor search index are computed; run
// them after anything that changes property coordinates or ownership.
import { SUMMARY_INDEXES, SUMMARY_TABLES } from './schema.js';

// Outcode = the part of the postcode before the space ("BS9 3AA" -> "BS9");
// sector = outcode plus the first inward character ("BS9 3AA" -> "BS9 3").
const OUTCODE_SQL = "TRIM(SUBSTR(postcode, 1, INSTR(postcode || ' ', ' ') - 1))";
const SECTOR_SQL = "TRIM(SUBSTR(postcode, 1, INSTR(postcode, ' ') + 1))";

// Shared aggregate columns. Zero or missing prices mean "not recorded", so they are
// excluded from the average rather than dragging it down.
const COUNTS_AND_CENTRE = `
  COUNT(*) AS total_count,
  SUM(CASE WHEN dataset_type = 'CCOD' THEN 1 ELSE 0 END) AS ccod_count,
  SUM(CASE WHEN dataset_type = 'OCOD' THEN 1 ELSE 0 END) AS ocod_count,
  ROUND(AVG(CASE WHEN price_paid > 0 THEN price_paid END)) AS avg_price,
  ROUND(AVG(latitude), 5) AS latitude,
  ROUND(AVG(longitude), 5) AS longitude`;

const POPULATE = {
  outcode_summary: `
    INSERT INTO outcode_summary (outcode, total_count, ccod_count, ocod_count, avg_price, latitude, longitude)
    SELECT ${OUTCODE_SQL} AS outcode, ${COUNTS_AND_CENTRE}
    FROM properties
    WHERE latitude IS NOT NULL AND postcode IS NOT NULL AND LENGTH(TRIM(postcode)) > 0
    GROUP BY 1
    HAVING outcode != ''`,
  sector_summary: `
    INSERT INTO sector_summary (sector, outcode, total_count, ccod_count, ocod_count, avg_price, latitude, longitude)
    SELECT ${SECTOR_SQL} AS sector, ${OUTCODE_SQL} AS outcode, ${COUNTS_AND_CENTRE}
    FROM properties
    WHERE latitude IS NOT NULL AND postcode IS NOT NULL AND INSTR(postcode, ' ') > 0
    GROUP BY 1
    HAVING sector != ''`,
  proprietor_summary: `
    INSERT INTO proprietor_summary (proprietor_name, dataset_type, country_incorporated, company_reg_no, property_count, total_price_paid)
    SELECT proprietor_name, MAX(dataset_type), MAX(country_incorporated), MAX(company_reg_no),
           COUNT(*), SUM(COALESCE(price_paid, 0))
    FROM properties
    WHERE proprietor_name IS NOT NULL AND TRIM(proprietor_name) != ''
    GROUP BY proprietor_name`,
};

// Drop and recreate rather than DELETE: it also replaces any old-shaped copy of the table
// (earlier scripts created some of these without primary keys), and it is faster.
function rebuild(db, table) {
  db.exec('BEGIN');
  try {
    db.exec(`DROP TABLE IF EXISTS ${table}`);
    db.exec(SUMMARY_TABLES[table]);
    db.exec(POPULATE[table]);
    for (const sql of SUMMARY_INDEXES[table]) db.exec(sql);
    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
  return db.prepare(`SELECT COUNT(*) AS c FROM ${table}`).get().c;
}

/** Map level-of-detail tables. Returns row counts. */
export function rebuildLodSummaries(db) {
  return { outcodes: rebuild(db, 'outcode_summary'), sectors: rebuild(db, 'sector_summary') };
}

/** Proprietor search/portfolio table. Returns its row count. */
export function rebuildProprietorSummary(db) {
  return rebuild(db, 'proprietor_summary');
}
