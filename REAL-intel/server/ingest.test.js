// Re-running the sample ingest must top up, never duplicate. Run with: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-ingest-'));
const csvRow = (title, postcode) => {
  const cols = Array(40).fill('');
  Object.assign(cols, { 0: title, 1: 'Freehold', 2: `1 Test Street`, 6: postcode, 8: '100000', 9: 'ACME LTD' });
  return cols.map(c => `"${c}"`).join(',');
};
const writeCsv = (name, rows) => {
  fs.mkdirSync(path.join(dir, name), { recursive: true });
  fs.writeFileSync(path.join(dir, name, `${name}.csv`), ['header', ...rows].join('\n') + '\n');
};
// T3 appears twice in the file itself.
writeCsv('CCOD_FULL_2026_09', ['T1', 'T2', 'T3', 'T3', 'T4', 'T5'].map(t => csvRow(t, 'BS9 3AA')));
writeCsv('OCOD_FULL_2026_09', [csvRow('O1', 'BS9 3AA'), csvRow('O2', 'BS9 3AB')]);

// ingest.js resolves its paths and opens the database on import.
process.env.REAL_INTEL_DATA_DIR = dir;
process.env.REAL_INTEL_DB = path.join(dir, 'i.sqlite');
const { ingestCcod, ingestOcod } = await import('./ingest.js');
const { db } = await import('./db.js');

const titles = type => db.prepare('SELECT title_number FROM properties WHERE dataset_type = ? ORDER BY title_number').all(type).map(r => r.title_number);

test('a larger CCOD run tops up an earlier smaller one without duplicating it', async () => {
  await ingestCcod(2);
  assert.deepEqual(titles('CCOD'), ['T1', 'T2']);

  await ingestCcod(100);
  assert.deepEqual(titles('CCOD'), ['T1', 'T2', 'T3', 'T4', 'T5'], 'no repeats, including the duplicate row in the file');

  await ingestCcod(100);
  assert.deepEqual(titles('CCOD'), ['T1', 'T2', 'T3', 'T4', 'T5'], 'running again changes nothing');
});

test('OCOD is loaded once', async () => {
  await ingestOcod();
  await ingestOcod();
  assert.deepEqual(titles('OCOD'), ['O1', 'O2']);
});
