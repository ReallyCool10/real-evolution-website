// Map viewport and search queries, against a temporary database. Run with: npm test
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// db.js opens the database when imported, so point it at a scratch file first.
process.env.REAL_INTEL_DB = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-queries-')), 'q.sqlite');
const { db, queryProperties, searchUnified, toFtsQuery } = await import('./db.js');
const { rebuildProprietorSummary } = await import('./summaries.js');

const LONDON = { minLat: 51.50, maxLat: 51.52, minLon: -0.14, maxLon: -0.10, zoom: 16 };

function add(p) {
  return db.prepare(
    `INSERT INTO properties (title_number, postcode, property_address, proprietor_name, dataset_type, price_paid, latitude, longitude)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(p.title, p.postcode, p.address, p.owner, p.type ?? 'CCOD', p.price ?? null, p.lat ?? null, p.lon ?? null).lastInsertRowid;
}

before(() => {
  add({ title: 'NGL100', postcode: 'SW1A 2AA', address: '10 DOWNING STREET, LONDON', owner: 'CROWN ESTATE', price: 9000000, lat: 51.5034, lon: -0.1276 });
  add({ title: 'NGL200', postcode: 'EC2V 7HH', address: 'GUILDHALL, GRESHAM STREET, LONDON', owner: 'CITY OF LONDON CORPORATION', price: 5000000, lat: 51.5157, lon: -0.0919 + -0.02 });
  add({ title: 'NGL300', postcode: 'WC2N 5DN', address: 'TRAFALGAR SQUARE, LONDON', owner: 'ACME HOLDINGS LTD', lat: 51.508, lon: -0.128 });
  add({ title: 'BL400', postcode: 'BS9 3AA', address: '1 DOWN ROAD, BRISTOL', owner: 'ACME HOLDINGS LTD', price: 250000, lat: 51.49, lon: -2.62 });
  add({ title: 'MX500', postcode: 'M1 1AA', address: 'NO COORDINATES YET', owner: 'NORTHERN LAND LTD' });
  rebuildProprietorSummary(db);
});

test('street-level viewport returns only properties inside the box, most valuable first', () => {
  const { tier, data } = queryProperties(LONDON);
  assert.equal(tier, 'micro');
  assert.deepEqual(data.map(p => p.title_number), ['NGL100', 'NGL200', 'NGL300'], 'priced first (desc), unpriced last');
});

test('street-level results follow properties as they are geocoded, moved and deleted', () => {
  const titles = () => queryProperties(LONDON).data.map(p => p.title_number);

  db.prepare("UPDATE properties SET latitude = 51.51, longitude = -0.12 WHERE title_number = 'MX500'").run();
  assert.ok(titles().includes('MX500'), 'newly geocoded property appears');

  db.prepare("UPDATE properties SET latitude = 53.48, longitude = -2.24 WHERE title_number = 'MX500'").run();
  assert.ok(!titles().includes('MX500'), 'moved-away property disappears');

  const id = add({ title: 'TMP', postcode: 'SW1A 1AA', address: 'TEMP', owner: 'X', lat: 51.505, lon: -0.13 });
  assert.ok(titles().includes('TMP'));
  db.prepare('DELETE FROM properties WHERE id = ?').run(id);
  assert.ok(!titles().includes('TMP'), 'deleted property disappears');
});

test('type and tenure filters still apply at street level', () => {
  db.prepare("UPDATE properties SET dataset_type = 'OCOD' WHERE title_number = 'NGL300'").run();
  const { data } = queryProperties({ ...LONDON, type: 'OCOD' });
  assert.deepEqual(data.map(p => p.title_number), ['NGL300']);
  db.prepare("UPDATE properties SET dataset_type = 'CCOD' WHERE title_number = 'NGL300'").run();
});

test('address search matches word prefixes across the whole address', () => {
  const titles = q => searchUnified(q).properties.map(p => p.title_number);
  assert.deepEqual(titles('10 downing'), ['NGL100']);
  assert.deepEqual(titles('down').sort(), ['BL400', 'NGL100'], '"down" prefixes DOWNING and DOWN');
  assert.deepEqual(titles('gresham st'), ['NGL200']);
  assert.deepEqual(titles('owning'), [], 'mid-word fragments no longer match (was LIKE %...%)');
});

test('title numbers and postcodes match by prefix, case-insensitively, ahead of addresses', () => {
  assert.equal(searchUnified('ngl1').properties[0].title_number, 'NGL100');
  assert.equal(searchUnified('sw1a').properties[0].title_number, 'NGL100');
  assert.equal(searchUnified('BS9 3').properties[0].title_number, 'BL400');
});

test('address search follows edits to the address', () => {
  db.prepare("UPDATE properties SET property_address = 'ADMIRALTY ARCH, LONDON' WHERE title_number = 'NGL300'").run();
  const titles = q => searchUnified(q).properties.map(p => p.title_number);
  assert.deepEqual(titles('admiralty'), ['NGL300']);
  assert.deepEqual(titles('trafalgar'), []);
});

test('proprietor search ranks names starting with the query first, then by portfolio size', () => {
  const names = q => searchUnified(q).proprietors.map(p => p.proprietor_name);
  assert.deepEqual(names('acme'), ['ACME HOLDINGS LTD']);
  assert.equal(searchUnified('acme').proprietors[0].property_count, 2);
  assert.deepEqual(names('london'), ['CITY OF LONDON CORPORATION']);
  assert.deepEqual(names('ltd'), ['ACME HOLDINGS LTD', 'NORTHERN LAND LTD']);
});

test('search input cannot inject FTS syntax and empty input returns nothing', () => {
  assert.equal(toFtsQuery('10 "Downing" OR -st*'), '"10"* "Downing"* "OR"* "st"*');
  assert.deepEqual(searchUnified('   '), { proprietors: [], properties: [] });
  assert.deepEqual(searchUnified('"*-'), { proprietors: [], properties: [] });
  assert.doesNotThrow(() => searchUnified('NEAR( AND OR NOT ^'));
});
