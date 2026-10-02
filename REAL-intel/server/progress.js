// How well each outcode is geocoded, computed one way for every enrichment script.
//
// "Matched" means placed at the property's own address: an OpenStreetMap address point
// (EXACT_OSM) or the only UPRN in its postcode (EXACT_UPRN). Street-level (STREET_UPRN) and
// postcode-level (POSTCODE_UPRN) placements are reported separately but are not counted as
// matched, so match_percentage is the share of properties whose location is exact.

// Every postcode in an outcode sorts between "BS9 " and "BS9 ~" (inward codes are A-Z0-9).
const rangeOf = outcode => [`${outcode} `, `${outcode} ~`];

const STATS_SQL = `
  SELECT COUNT(*) AS total,
    SUM(precision_level = 'EXACT_OSM') AS exact_osm,
    SUM(precision_level = 'EXACT_UPRN') AS exact_uprn,
    SUM(precision_level = 'STREET_UPRN') AS street_uprn,
    SUM(precision_level = 'POSTCODE_UPRN') AS postcode_uprn,
    SUM(precision_level IS NULL OR precision_level = 'ESTIMATED') AS estimated
  FROM properties
  WHERE postcode >= ? AND postcode <= ?`;

const UPSERT_SQL = `
  INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status, last_updated)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  ON CONFLICT(outcode) DO UPDATE SET
    region = excluded.region,
    total_properties = excluded.total_properties,
    matched_properties = excluded.matched_properties,
    match_percentage = excluded.match_percentage,
    status = excluded.status,
    last_updated = excluded.last_updated`;

/** Precision breakdown for one outcode, plus the exact-match count and percentage. */
export function outcodeStats(db, outcode) {
  const s = db.prepare(STATS_SQL).get(...rangeOf(outcode));
  const counts = Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v ?? 0]));
  const matched = counts.exact_osm + counts.exact_uprn;
  const percentage = counts.total ? Number(((matched / counts.total) * 100).toFixed(1)) : 0;
  return { ...counts, matched, percentage };
}

/** Recomputes the outcode's figures from the data and records them with `status`. */
export function recordOutcodeProgress(db, outcode, region, status = 'COMPLETED') {
  const stats = outcodeStats(db, outcode);
  db.prepare(UPSERT_SQL).run(outcode, region, stats.total, stats.matched, stats.percentage, status);
  return stats;
}
