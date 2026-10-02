// UPRN matching labels and the shared match-rate definition. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The matcher opens the database on import, so point it at a scratch file first.
process.env.REAL_INTEL_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-match-')), 'm.sqlite');
const { openDatabase } = await import('./connection.js');
const { outcodeStats } = await import('./progress.js');

const db = openDatabase({ quiet: true });
const addProperty = (title, postcode, precision = 'ESTIMATED') =>
  db.prepare("INSERT INTO properties (title_number, postcode, latitude, longitude, precision_level) VALUES (?, ?, 51.0, -2.0, ?)")
    .run(title, postcode, precision);
const addUprn = (uprn, postcode, lat, lon) =>
  db.prepare('INSERT INTO uprn_lookup VALUES (?, ?, ?, ?)').run(uprn, postcode, lat, lon);
const row = title => ({ ...db.prepare('SELECT precision_level, latitude, longitude FROM properties WHERE title_number = ?').get(title) });

// BS9 1AA has a single address point; BS9 2BB has three; BS9 3CC has none.
addUprn(1, 'BS9 1AA', 51.4801, -2.6101);
addUprn(2, 'BS9 2BB', 51.4802, -2.6102);
addUprn(3, 'BS9 2BB', 51.4803, -2.6103);
addUprn(4, 'BS9 2BB', 51.4804, -2.6104);
addProperty('SINGLE', 'BS9 1AA');
addProperty('MULTI', 'BS9 2BB');
addProperty('NONE', 'BS9 3CC');
addProperty('OSM', 'BS9 2BB', 'EXACT_OSM');

const { processOutcodePass2 } = await import('./uprn-matcher.js');

test('a single-UPRN postcode is an exact match; a multi-UPRN postcode is postcode-level only', () => {
  const result = processOutcodePass2('BS9');
  assert.deepEqual(result, { outcode: 'BS9', total: 3, matched: 2, exact: 1 });
  assert.deepEqual(row('SINGLE'), { precision_level: 'EXACT_UPRN', latitude: 51.4801, longitude: -2.6101 });
  const multi = row('MULTI');
  assert.equal(multi.precision_level, 'POSTCODE_UPRN');
  assert.ok([51.4802, 51.4803, 51.4804].includes(multi.latitude), 'placed on one of the postcode\'s real buildings');
  assert.equal(row('NONE').precision_level, 'ESTIMATED', 'no UPRNs: left as estimated');
  assert.equal(row('OSM').precision_level, 'EXACT_OSM', 'already-exact rows are not touched');
});

test('the stored match rate counts exact addresses only', () => {
  const stats = outcodeStats(db, 'BS9');
  assert.equal(stats.total, 4);
  assert.equal(stats.matched, 2, 'EXACT_OSM + EXACT_UPRN; POSTCODE_UPRN is not a match');
  assert.equal(stats.postcode_uprn, 1);
  assert.equal(stats.percentage, 50);
  const stored = db.prepare("SELECT matched_properties, match_percentage FROM enrichment_progress WHERE outcode = 'BS9'").get();
  assert.deepEqual({ ...stored }, { matched_properties: 2, match_percentage: 50 });
});

test('migration 4 relabels existing non-exact UPRN rows and recounts stored rates', () => {
  const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-mig4-')), 'old.sqlite');
  const old = openDatabase({ path: file, quiet: true });
  const put = (title, pc, level) => old.prepare("INSERT INTO properties (title_number, postcode, latitude, longitude, precision_level) VALUES (?, ?, 51, -2, ?)").run(title, pc, level);
  old.prepare('INSERT INTO uprn_lookup VALUES (1, ?, 51, -2)').run('BS9 1AA');
  old.prepare('INSERT INTO uprn_lookup VALUES (2, ?, 51, -2), (3, ?, 51, -2)').run('BS9 2BB', 'BS9 2BB');
  put('WAS_EXACT_SINGLE', 'BS9 1AA', 'EXACT_UPRN');
  put('WAS_EXACT_MULTI', 'BS9 2BB', 'EXACT_UPRN');
  put('UNVERIFIABLE', 'BS9 9ZZ', 'EXACT_UPRN');
  put('OSM', 'BS9 2BB', 'EXACT_OSM');
  // As the old scripts left it: 3 of 4 "matched" (75%).
  old.exec("INSERT INTO enrichment_progress (outcode, region, total_properties, matched_properties, match_percentage, status) VALUES ('BS9', 'Bristol', 4, 3, 75.0, 'COMPLETED')");
  old.exec('PRAGMA user_version = 3');
  old.close();

  const upgraded = openDatabase({ path: file, quiet: true });
  const level = title => upgraded.prepare('SELECT precision_level FROM properties WHERE title_number = ?').get(title).precision_level;
  assert.equal(level('WAS_EXACT_SINGLE'), 'EXACT_UPRN');
  assert.equal(level('WAS_EXACT_MULTI'), 'POSTCODE_UPRN');
  assert.equal(level('UNVERIFIABLE'), 'POSTCODE_UPRN', 'cannot be verified, so it gets the weaker claim');
  assert.equal(level('OSM'), 'EXACT_OSM');
  const progress = upgraded.prepare("SELECT total_properties, matched_properties, match_percentage FROM enrichment_progress WHERE outcode = 'BS9'").get();
  assert.deepEqual({ ...progress }, { total_properties: 4, matched_properties: 2, match_percentage: 50 });
  upgraded.close();
});

