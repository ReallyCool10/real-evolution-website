// Every API endpoint, exercised against a real server process. Run with: npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'real-intel-server-'));
const DB = path.join(dir, 's.sqlite');
const PORT = 3200 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}`;
const UPSTREAM_LOG = path.join(dir, 'upstream.log');

// Stand-in for the HM Land Registry WMS: a valid 256x256 RGBA PNG with no banner (so it
// passes through uncropped), and a log line per call so caching can be checked.
const MOCK = path.join(dir, 'mock-upstream.mjs');
fs.writeFileSync(MOCK, `
import fs from 'node:fs';
import zlib from 'node:zlib';
const chunk = (type, data) => { const b = Buffer.alloc(12 + data.length); b.writeUInt32BE(data.length, 0); b.write(type, 4, 'ascii'); data.copy(b, 8); b.writeUInt32BE(zlib.crc32(b.subarray(4, 8 + data.length)), 8 + data.length); return b; };
const ihdr = Buffer.from([0,0,1,0, 0,0,1,0, 8, 6, 0, 0, 0]);
const rows = Buffer.alloc(256 * (1 + 256 * 4));
const png = Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(rows)), chunk('IEND', Buffer.alloc(0))]);
globalThis.fetch = async () => { fs.appendFileSync(${JSON.stringify(UPSTREAM_LOG)}, 'call\\n'); return new Response(png, { headers: { 'content-type': 'image/png' } }); };
`);

let server;
let propertyId;

before(async () => {
  process.env.REAL_INTEL_DB = DB;
  const { openDatabase } = await import('./connection.js');
  const { rebuildLodSummaries, rebuildProprietorSummary } = await import('./summaries.js');
  const db = openDatabase({ quiet: true });
  propertyId = db.prepare(
    "INSERT INTO properties (title_number, postcode, property_address, proprietor_name, dataset_type, price_paid, latitude, longitude) VALUES ('NGL1', 'SW1A 2AA', '10 DOWNING STREET', 'ACME LTD', 'CCOD', 1000000, 51.5034, -0.1276)",
  ).run().lastInsertRowid;
  rebuildLodSummaries(db);
  rebuildProprietorSummary(db);
  db.close();

  server = spawn(process.execPath, ['--import', MOCK, path.join(SERVER_DIR, 'server.js')], {
    env: { ...process.env, PORT: String(PORT), REAL_INTEL_DB: DB },
    stdio: 'ignore',
  });
  for (let i = 0; i < 100; i++) {
    try { if ((await fetch(`${BASE}/api/health`)).ok) return; } catch { /* not up yet */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('server did not start');
});

after(() => server?.kill());

const get = p => fetch(BASE + p);
const post = (p, body, type = 'application/json') =>
  fetch(BASE + p, { method: 'POST', headers: { 'Content-Type': type }, body: JSON.stringify(body) });
const json = async res => ({ status: res.status, body: await res.json() });

test('health, unknown routes, and no CORS headers', async () => {
  assert.deepEqual(await json(await get('/api/health')), { status: 200, body: { ok: true } });
  assert.equal((await get('/api/nope')).status, 404);
  assert.equal((await get('/api/health')).headers.get('access-control-allow-origin'), null);
});

test('requests from other hosts and non-JSON POSTs are refused', async () => {
  // fetch() won't let us set Host, so use node:http for the DNS-rebinding case.
  const res = await new Promise(resolve =>
    http.get({ host: '127.0.0.1', port: PORT, path: '/api/health', headers: { Host: 'evil.example' } }, resolve));
  assert.equal(res.statusCode, 403);
  assert.equal((await post('/api/workspace', { savedItems: [] }, 'text/plain')).status, 415);
});

test('map viewport at each zoom tier', async () => {
  const q = z => `/api/properties?minLat=51&maxLat=52&minLon=-1&maxLon=1&zoom=${z}`;
  assert.equal((await get('/api/properties')).status, 400);
  for (const [zoom, tier] of [[6, 'macro'], [12, 'meso'], [16, 'micro']]) {
    const { status, body } = await json(await get(q(zoom)));
    assert.equal(status, 200);
    assert.equal(body.tier, tier);
    assert.equal(body.count, 1);
  }
});

test('search, proprietor portfolio and property lookup', async () => {
  const search = await json(await get('/api/search?q=downing'));
  assert.equal(search.body.properties[0].title_number, 'NGL1');
  assert.equal((await json(await get('/api/search?q=acme'))).body.proprietors[0].proprietor_name, 'ACME LTD');

  const portfolio = await json(await get('/api/proprietor/ACME%20LTD'));
  assert.equal(portfolio.body.assets.length, 1);
  assert.equal((await get('/api/proprietor/NOBODY')).status, 404);

  assert.equal((await json(await get(`/api/property/${propertyId}`))).body.title_number, 'NGL1');
  assert.equal((await get('/api/property/999999')).status, 404);
});

test('stats and enrichment status', async () => {
  assert.equal((await json(await get('/api/stats'))).body.totalProperties, 1);
  assert.equal((await get('/api/enrichment/status')).status, 200);
  assert.deepEqual((await json(await get('/api/enrichment/active'))).body, { isRunning: false });
});

test('workspace saves merge and reject unknown shapes', async () => {
  await post('/api/workspace', { savedItems: [{ id: 1 }] });
  await post('/api/workspace', { customLists: ['Mine'] });
  assert.deepEqual((await json(await get('/api/workspace'))).body, { savedItems: [{ id: 1 }], customLists: ['Mine'] });
  assert.equal((await post('/api/workspace', { other: 1 })).status, 400);
});

test('enrichment start validates the area; stop with nothing running is a no-op', async () => {
  assert.equal((await post('/api/enrichment/start', { area: '../../etc; rm' })).status, 400);
  assert.deepEqual((await json(await post('/api/enrichment/stop', {}))).body, { success: true, message: 'No active enrichment running' });
});

test('Land Registry tiles: BBOX validated, PNG served, repeat requests cached', async () => {
  assert.equal((await get('/api/hmlr-wms?BBOX=1,2,x,4')).status, 400);
  const tile = await get('/api/hmlr-wms?BBOX=10,10,20,20');
  assert.equal(tile.status, 200);
  assert.equal(tile.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await tile.arrayBuffer()).subarray(1, 4).toString(), 'PNG');
  await (await get('/api/hmlr-wms?BBOX=10,10,20,20')).arrayBuffer();
  assert.equal(fs.readFileSync(UPSTREAM_LOG, 'utf8').trim().split('\n').length, 1, 'second request served from cache');
});
