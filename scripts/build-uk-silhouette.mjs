#!/usr/bin/env node
// Builds src/data/uk-silhouette.json: a simplified UK outline as one SVG path, plus the y
// positions that split the shape into land-use bands of the right *area*. This used to run
// in every visitor's browser (a 1.9 MB download plus a canvas pixel scan); it only needs to
// run when the outline or the percentages change.
//
//   npm run data:uk-silhouette                 # downloads the source GeoJSON
//   npm run data:uk-silhouette -- local.geojson  # or use a copy on disk
//
// Needs network access for `npx mapshaper` (dissolve + simplify). Output is committed.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const SOURCE_URL =
  'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/united-kingdom.geojson';
const OUT = new URL('../src/data/uk-silhouette.json', import.meta.url);

// Cumulative share of UK land from the top of the map down. Order and values must match
// LAND_USE_BANDS in src/data/land-use.ts (UKCEH Land Cover Map).
const THRESHOLDS = [0.49, 0.777, 0.897, 0.953, 0.969, 1.0];

const HEIGHT = 450; // SVG units; width follows from the aspect ratio
const PAD = 8;
const WEST_LIMIT = -10; // drops Rockall, which would otherwise stretch the frame far west
const SIMPLIFY = '6%';

async function loadSource() {
  const local = process.argv[2];
  if (local) return JSON.parse(readFileSync(local, 'utf8'));
  const res = await fetch(SOURCE_URL);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  return res.json();
}

const ringsOf = geometry =>
  geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.type === 'MultiPolygon' ? geometry.coordinates : [];

function dropFarWest(geojson) {
  for (const f of geojson.features) {
    const polys = ringsOf(f.geometry).filter(poly => poly[0].some(([lon]) => lon > WEST_LIMIT));
    f.geometry = { type: 'MultiPolygon', coordinates: polys };
  }
  geojson.features = geojson.features.filter(f => f.geometry.coordinates.length > 0);
  return geojson;
}

function dissolveAndSimplify(geojson) {
  const dir = mkdtempSync(join(tmpdir(), 'uk-silhouette-'));
  const input = join(dir, 'in.json');
  const output = join(dir, 'out.json');
  writeFileSync(input, JSON.stringify(geojson));
  execFileSync(
    'npx',
    ['--yes', 'mapshaper@0.7', input, '-dissolve', '-simplify', SIMPLIFY, 'keep-shapes', '-filter-slivers', '-o', 'format=geojson', output],
    { stdio: 'inherit' },
  );
  return JSON.parse(readFileSync(output, 'utf8'));
}

function project(rings) {
  const all = rings.flat();
  const lons = all.map(c => c[0]);
  const lats = all.map(c => c[1]);
  const [minLon, maxLon, minLat, maxLat] = [Math.min(...lons), Math.max(...lons), Math.min(...lats), Math.max(...lats)];
  const cosLat = Math.cos((((minLat + maxLat) / 2) * Math.PI) / 180);
  const scale = (HEIGHT - 2 * PAD) / (maxLat - minLat);
  const width = Math.round((maxLon - minLon) * cosLat * scale + 2 * PAD);
  const toXY = ([lon, lat]) => [PAD + (lon - minLon) * cosLat * scale, PAD + (maxLat - lat) * scale];
  return { width, projected: rings.map(r => r.map(toXY)) };
}

const round = n => Math.round(n * 10) / 10;

function toPath(rings) {
  return rings
    .map(r => {
      const pts = r.map(([x, y]) => [round(x), round(y)]);
      let d = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const dx = round(pts[i][0] - pts[i - 1][0]);
        const dy = round(pts[i][1] - pts[i - 1][1]);
        if (dx || dy) d += `l${dx} ${dy}`;
      }
      return `${d}z`;
    })
    .join('');
}

// Area of the shape in each thin horizontal strip (even-odd scanline), accumulated top down,
// then the y where the running total crosses each threshold.
function bandPositions(rings) {
  const STEP = 0.25;
  const rows = [];
  let total = 0;
  for (let y = STEP / 2; y < HEIGHT; y += STEP) {
    const xs = [];
    for (const r of rings) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        const [x1, y1] = r[j];
        const [x2, y2] = r[i];
        if (y1 > y !== y2 > y) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      }
    }
    xs.sort((a, b) => a - b);
    let len = 0;
    for (let k = 0; k + 1 < xs.length; k += 2) len += xs[k + 1] - xs[k];
    total += len * STEP;
    rows.push({ y: y + STEP / 2, cumulative: total });
  }
  return THRESHOLDS.map(t => round(rows.find(r => r.cumulative >= t * total - 1e-9)?.y ?? HEIGHT));
}

const source = dropFarWest(await loadSource());
const outline = dissolveAndSimplify(source);
// mapshaper writes a GeometryCollection when the dissolved layer has no attributes.
const geometries = outline.type === 'FeatureCollection' ? outline.features.map(f => f.geometry) : outline.geometries;
const rings = geometries.flatMap(g => ringsOf(g).flat());
const { width, projected } = project(rings);
const result = { width, height: HEIGHT, bands: bandPositions(projected), path: toPath(projected) };

writeFileSync(OUT, `${JSON.stringify(result)}\n`);
console.log(`Wrote ${OUT.pathname}: ${width}x${HEIGHT}, ${rings.length} rings, ${result.path.length} path chars`);
console.log('Band y positions:', result.bands.join(', '));
