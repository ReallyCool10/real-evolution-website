import http from 'node:http';
import zlib from 'node:zlib';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  queryProperties,
  searchUnified,
  getProprietorPortfolio,
  getPropertyById,
  getStats,
  getEnrichmentSummary,
  getWorkspaceState,
  saveWorkspaceState
} from './db.js';

const PORT = process.env.PORT || 3001;
const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const AREA_PATTERN = /^[A-Za-z0-9 ,'-]{1,60}$/;

let activeRunner = null;

function getActiveRunnerInfo() {
  if (!activeRunner) return { isRunning: false };
  return {
    isRunning: true,
    stopping: Boolean(activeRunner.stopping),
    area: activeRunner.area,
    startTime: activeRunner.startTime,
    pid: activeRunner.process ? activeRunner.process.pid : null
  };
}

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => {
      data += chunk;
      if (data.length > 1e6) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

// This is a local, single-user tool with no authentication, so it must only be reachable from
// this machine. It listens on loopback only, and it sends no CORS headers: the Vite dev
// server proxies /api, so the app is same-origin and other websites cannot read responses.
// The Host check blocks DNS-rebinding (a hostile page whose domain resolves to 127.0.0.1),
// and requiring a JSON content type on POST stops cross-site "simple" form/fetch requests,
// which cannot set that header without a CORS preflight we never approve.
const HOST = '127.0.0.1';
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

function rejectUntrustedRequest(req, res) {
  if (!ALLOWED_HOSTS.has(req.headers.host)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Forbidden host' }));
    return true;
  }
  const isJson = (req.headers['content-type'] || '').split(';')[0].trim() === 'application/json';
  if (req.method === 'POST' && !isJson) {
    res.writeHead(415, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Content-Type must be application/json' }));
    return true;
  }
  return false;
}

// High-performance In-Memory Tile Cache for HMLR WMS (up to 5,000 tiles)
const tileCache = new Map();
const MAX_TILE_CACHE = 5000;

const HMLR_CUSTOM_SLD = `<?xml version="1.0" encoding="UTF-8"?>
<sld:StyledLayerDescriptor xmlns:sld="http://www.opengis.net/sld" xmlns="http://www.opengis.net/sld" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" version="1.0.0">
  <sld:NamedLayer>
    <sld:Name>inspire:CP.CadastralParcel</sld:Name>
    <sld:UserStyle>
      <sld:Name>CleanSingleLabel</sld:Name>
      <sld:FeatureTypeStyle>
        <sld:Rule>
          <sld:MinScaleDenominator>1.0</sld:MinScaleDenominator>
          <sld:MaxScaleDenominator>20000.0</sld:MaxScaleDenominator>
          <sld:PolygonSymbolizer>
            <sld:Stroke>
              <sld:CssParameter name="stroke">#e11d48</sld:CssParameter>
              <sld:CssParameter name="stroke-width">1.4</sld:CssParameter>
              <sld:CssParameter name="stroke-opacity">0.85</sld:CssParameter>
            </sld:Stroke>
          </sld:PolygonSymbolizer>
        </sld:Rule>
        <sld:Rule>
          <sld:MinScaleDenominator>1.0</sld:MinScaleDenominator>
          <sld:MaxScaleDenominator>5000.0</sld:MaxScaleDenominator>
          <sld:TextSymbolizer>
            <sld:Label>
              <ogc:PropertyName>GEOM_ID</ogc:PropertyName>
            </sld:Label>
            <sld:Font>
              <sld:CssParameter name="font-family">Arial</sld:CssParameter>
              <sld:CssParameter name="font-size">9.0</sld:CssParameter>
              <sld:CssParameter name="font-weight">bold</sld:CssParameter>
            </sld:Font>
            <sld:LabelPlacement>
              <sld:PointPlacement>
                <sld:AnchorPoint>
                  <sld:AnchorPointX>0.5</sld:AnchorPointX>
                  <sld:AnchorPointY>0.5</sld:AnchorPointY>
                </sld:AnchorPoint>
              </sld:PointPlacement>
            </sld:LabelPlacement>
            <sld:Halo>
              <sld:Radius>1.5</sld:Radius>
              <sld:Fill>
                <sld:CssParameter name="fill">#ffffff</sld:CssParameter>
                <sld:CssParameter name="fill-opacity">0.9</sld:CssParameter>
              </sld:Fill>
            </sld:Halo>
            <sld:Fill>
              <sld:CssParameter name="fill">#1e293b</sld:CssParameter>
            </sld:Fill>
            <sld:VendorOption name="conflictResolution">true</sld:VendorOption>
            <sld:VendorOption name="spaceAround">15</sld:VendorOption>
            <sld:VendorOption name="polygonAlign">mbr</sld:VendorOption>
          </sld:TextSymbolizer>
        </sld:Rule>
      </sld:FeatureTypeStyle>
    </sld:UserStyle>
  </sld:NamedLayer>
</sld:StyledLayerDescriptor>`;

/**
 * Strips the HMLR/OS usage rights footer banner by unfiltering and cropping
 * the top 256x256 pixels from the expanded upstream tile.
 */
function cropPngTop256(rawPngBuffer) {
  try {
    let pos = 8;
    const idats = [];
    let width = 0;
    let height = 0;
    let bitDepth = 0;
    let colorType = 0;
    let interlace = 0;

    while (pos < rawPngBuffer.length) {
      const len = rawPngBuffer.readUInt32BE(pos);
      const type = rawPngBuffer.toString('ascii', pos + 4, pos + 8);
      if (type === 'IHDR') {
        width = rawPngBuffer.readUInt32BE(pos + 8);
        height = rawPngBuffer.readUInt32BE(pos + 12);
        bitDepth = rawPngBuffer[pos + 16];
        colorType = rawPngBuffer[pos + 17];
        interlace = rawPngBuffer[pos + 20];
      } else if (type === 'IDAT') {
        idats.push(rawPngBuffer.subarray(pos + 8, pos + 8 + len));
      }
      pos += 12 + len;
    }

    // The unfilter/crop below assumes 8-bit RGBA, non-interlaced rows. Anything else (e.g. a
    // palette PNG) would decode to garbage, so pass it through uncropped instead.
    const isRgba8 = bitDepth === 8 && colorType === 6 && interlace === 0;
    if (!isRgba8 || width !== 256 || height <= 256 || idats.length === 0) {
      return rawPngBuffer;
    }

    const decompressed = zlib.inflateSync(Buffer.concat(idats));
    const srcStride = 1 + width * 4;
    const targetHeight = 256;
    const uncompressedRgba = Buffer.alloc(width * targetHeight * 4);

    for (let y = 0; y < targetHeight; y++) {
      const filter = decompressed[y * srcStride];
      const prevRow = y > 0 ? (y - 1) * width * 4 : null;
      const currRow = y * width * 4;

      for (let x = 0; x < width * 4; x++) {
        const rawByte = decompressed[y * srcStride + 1 + x];
        let left = x >= 4 ? uncompressedRgba[currRow + x - 4] : 0;
        let above = prevRow !== null ? uncompressedRgba[prevRow + x] : 0;
        let aboveLeft = (prevRow !== null && x >= 4) ? uncompressedRgba[prevRow + x - 4] : 0;
        let val = 0;

        if (filter === 0) val = rawByte;
        else if (filter === 1) val = (rawByte + left) & 0xff;
        else if (filter === 2) val = (rawByte + above) & 0xff;
        else if (filter === 3) val = (rawByte + Math.floor((left + above) / 2)) & 0xff;
        else if (filter === 4) {
          const p = left + above - aboveLeft;
          const pa = Math.abs(p - left);
          const pb = Math.abs(p - above);
          const pc = Math.abs(p - aboveLeft);
          let pr = aboveLeft;
          if (pa <= pb && pa <= pc) pr = left;
          else if (pb <= pc) pr = above;
          val = (rawByte + pr) & 0xff;
        }
        uncompressedRgba[currRow + x] = val;
      }
    }

    const outStride = 1 + width * 4;
    const filtered = Buffer.alloc(targetHeight * outStride);
    for (let y = 0; y < targetHeight; y++) {
      filtered[y * outStride] = 0; // Filter 0 (None)
      uncompressedRgba.copy(filtered, y * outStride + 1, y * width * 4, (y + 1) * width * 4);
    }

    const compressed = zlib.deflateSync(filtered);

    function makeChunk(type, data) {
      const len = data.length;
      const buf = Buffer.alloc(12 + len);
      buf.writeUInt32BE(len, 0);
      buf.write(type, 4, 4, 'ascii');
      data.copy(buf, 8);
      const crcVal = zlib.crc32(buf.subarray(4, 8 + len));
      buf.writeUInt32BE(crcVal, 8 + len);
      return buf;
    }

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(targetHeight, 4);
    ihdr[8] = 8;
    ihdr[9] = 6; // RGBA
    ihdr[10] = 0;
    ihdr[11] = 0;
    ihdr[12] = 0;

    const header = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    return Buffer.concat([
      header,
      makeChunk('IHDR', ihdr),
      makeChunk('IDAT', compressed),
      makeChunk('IEND', Buffer.alloc(0))
    ]);
  } catch (err) {
    console.warn('Failed to crop PNG tile, returning uncropped buffer:', err.message);
    return rawPngBuffer;
  }
}

const server = http.createServer(async (req, res) => {
  if (rejectUntrustedRequest(req, res)) return;

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const searchParams = reqUrl.searchParams;

  // GET /api/properties?minLat=..&minLon=..&maxLat=..&maxLon=..&type=..&tenure=..&limit=..
  if (pathname === '/api/properties' && req.method === 'GET') {
    try {
      const minLat = searchParams.get('minLat');
      const maxLat = searchParams.get('maxLat');
      const minLon = searchParams.get('minLon');
      const maxLon = searchParams.get('maxLon');
      const zoom = searchParams.get('zoom');
      const type = searchParams.get('type') || 'ALL';
      const tenure = searchParams.get('tenure') || 'ALL';
      const limit = searchParams.get('limit') || '1500';

      if (!minLat || !maxLat || !minLon || !maxLon || zoom === null) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Missing required bounding box or zoom parameters' }));
        return;
      }

      const result = queryProperties({
        minLat: parseFloat(minLat),
        minLon: parseFloat(minLon),
        maxLat: parseFloat(maxLat),
        maxLon: parseFloat(maxLon),
        zoom: parseFloat(zoom),
        type: String(type),
        tenure: String(tenure),
        limit: Math.min(parseInt(limit, 10) || 1500, 2500)
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        tier: result.tier,
        zoom: result.zoom,
        count: result.data.length,
        data: result.data
      }));
    } catch (err) {
      console.error('Query error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/search?q=... (Unified: Proprietors + Addresses/Titles/Postcodes)
  if (pathname === '/api/search' && req.method === 'GET') {
    const q = (searchParams.get('q') || '').trim();
    const limit = parseInt(searchParams.get('limit'), 10) || 15;

    try {
      const results = searchUnified(q, limit);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        query: q,
        proprietors: results.proprietors,
        properties: results.properties
      }));
    } catch (err) {
      console.error('Search error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/proprietor/:name (Portfolio & all assets owned)
  if (pathname.startsWith('/api/proprietor/') && req.method === 'GET') {
    const rawName = pathname.replace('/api/proprietor/', '');
    const name = decodeURIComponent(rawName);
    const limit = Math.min(parseInt(searchParams.get('limit'), 10) || 500, 2000);

    try {
      const portfolio = getProprietorPortfolio(name, limit);
      if (!portfolio) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Proprietor not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(portfolio));
    } catch (err) {
      console.error('Proprietor lookup error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/property/:id
  if (pathname.startsWith('/api/property/') && req.method === 'GET') {
    const id = pathname.replace('/api/property/', '');
    try {
      const property = getPropertyById(id);
      if (!property) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Property not found' }));
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(property));
    } catch (err) {
      console.error('Property lookup error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/hmlr-wms (Transparent CORS, custom single-label SLD & watermark-free proxy for HMLR Inspire Cadastral Parcels)
  if (pathname === '/api/hmlr-wms' && req.method === 'GET') {
    const coords = (searchParams.get('BBOX') || searchParams.get('bbox') || '').split(',').map(Number);
    if (coords.length !== 4 || !coords.every(Number.isFinite) || coords[2] <= coords[0] || coords[3] <= coords[1]) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'BBOX must be four numbers: minX,minY,maxX,maxY' }));
      return;
    }
    const bbox = coords.join(',');

    if (tileCache.has(bbox)) {
      // Re-insert on hit so eviction (oldest Map entry first) is least-recently-used.
      const cached = tileCache.get(bbox);
      tileCache.delete(bbox);
      tileCache.set(bbox, cached);
      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000'
      });
      res.end(cached);
      return;
    }

    try {
      const [minX, minY, maxX, maxY] = coords;
      const resY = (maxY - minY) / 256;
      const bannerHeight = 60;
      const newMinY = minY - (bannerHeight * resY);
      const newHeight = 256 + bannerHeight;

      const body = new URLSearchParams({
        SERVICE: 'WMS',
        VERSION: '1.3.0',
        REQUEST: 'GetMap',
        FORMAT: 'image/png',
        TRANSPARENT: 'TRUE',
        LAYERS: 'inspire:CP.CadastralParcel',
        CRS: 'EPSG:3857',
        WIDTH: '256',
        HEIGHT: newHeight.toString(),
        BBOX: `${minX},${newMinY},${maxX},${maxY}`,
        SLD_BODY: HMLR_CUSTOM_SLD
      });

      const upstream = await fetch('https://inspire.landregistry.gov.uk/inspire/ows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString()
      });

      if (!upstream.ok) {
        res.writeHead(upstream.status, {
          'Content-Type': 'text/plain'
        });
        res.end('Upstream WMS returned status ' + upstream.status);
        return;
      }

      // WMS servers report errors as XML with a 200 status; never serve or cache that as a tile.
      if (!(upstream.headers.get('content-type') || '').startsWith('image/png')) {
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Upstream WMS did not return a PNG tile' }));
        return;
      }

      const rawBuffer = Buffer.from(await upstream.arrayBuffer());
      const cleanTile = cropPngTop256(rawBuffer);

      if (tileCache.size >= MAX_TILE_CACHE) {
        const firstKey = tileCache.keys().next().value;
        tileCache.delete(firstKey);
      }
      tileCache.set(bbox, cleanTile);

      res.writeHead(200, {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=604800, stale-while-revalidate=2592000'
      });
      res.end(cleanTile);
    } catch (err) {
      console.error('HMLR WMS proxy error:', err);
      res.writeHead(502, {
        'Content-Type': 'application/json'
      });
      res.end(JSON.stringify({ error: 'Failed to fetch HMLR WMS tile', details: err.message }));
    }
    return;
  }

  // GET /api/health: cheap readiness check (dev.js polls it while starting up)
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  // GET /api/stats
  if (pathname === '/api/stats' && req.method === 'GET') {
    try {
      const stats = getStats();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(stats));
    } catch (err) {
      console.error('Stats error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/enrichment/status
  if (pathname === '/api/enrichment/status' && req.method === 'GET') {
    try {
      const summary = getEnrichmentSummary();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(summary));
    } catch (err) {
      console.error('Enrichment summary error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // GET /api/enrichment/active
  if (pathname === '/api/enrichment/active' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(getActiveRunnerInfo()));
    return;
  }

  // GET /api/workspace
  if (pathname === '/api/workspace' && req.method === 'GET') {
    try {
      const state = getWorkspaceState();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(state));
    } catch (err) {
      console.error('Workspace fetch error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/workspace
  if (pathname === '/api/workspace' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      // The app saves saved items and custom lists separately, each posting only its own
      // field. Merge into the stored state rather than replacing it, so saving one never
      // erases the other; only the known fields are accepted.
      const update = {};
      if (Array.isArray(body.savedItems)) update.savedItems = body.savedItems;
      if (Array.isArray(body.customLists)) update.customLists = body.customLists;
      if (Object.keys(update).length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Expected savedItems and/or customLists arrays' }));
        return;
      }
      const success = saveWorkspaceState({ ...getWorkspaceState(), ...update });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success }));
    } catch (err) {
      console.error('Workspace save error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/enrichment/start
  if (pathname === '/api/enrichment/start' && req.method === 'POST') {
    try {
      const body = await parseJsonBody(req);
      const targetArea = String(body.area || body.outcode || 'London').trim();
      const mode = body.mode === 'uprn' ? 'uprn' : 'osm';

      if (!AREA_PATTERN.test(targetArea)) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Area must be a postcode area or place name' }));
        return;
      }

      if (activeRunner) {
        res.writeHead(409, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: false,
          error: `Enrichment is already active for ${activeRunner.area}`,
          runner: getActiveRunnerInfo()
        }));
        return;
      }

      const isSingleOutcode = /^[A-Z]{1,2}\d[A-Z\d]?$/i.test(targetArea);
      let runnerScript = path.join(SERVER_DIR, 'automated-runner.js');
      let runnerArgs = [];

      if (mode === 'uprn') {
        runnerScript = path.join(SERVER_DIR, 'uprn-matcher.js');
        runnerArgs = [isSingleOutcode ? `--outcode=${targetArea}` : `--area=${targetArea}`];
      } else {
        runnerArgs = [isSingleOutcode ? '--outcode' : '--area', targetArea];
      }

      console.log(`[Server] Spawning enrichment runner (${mode}): ${runnerScript} ${runnerArgs.join(' ')}`);
      const runnerProc = spawn(process.execPath, [runnerScript, ...runnerArgs], {
        cwd: path.join(SERVER_DIR, '..'),
        stdio: 'inherit',
        detached: false
      });

      activeRunner = {
        process: runnerProc,
        area: targetArea,
        mode: mode,
        startTime: Date.now()
      };

      // Only clear the slot if it still belongs to this process, so a late exit event from an
      // old runner can never wipe the record of a newer one.
      const release = () => {
        if (activeRunner && activeRunner.process === runnerProc) activeRunner = null;
      };
      runnerProc.on('close', (code) => {
        console.log(`[Server] Enrichment runner (${mode}) for ${targetArea} exited with code ${code}`);
        release();
      });
      runnerProc.on('error', (err) => {
        console.error(`[Server] Enrichment runner error for ${targetArea}:`, err);
        release();
      });

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        message: `Enrichment (${mode.toUpperCase()}) started for ${targetArea}`,
        area: targetArea,
        mode: mode,
        pid: runnerProc.pid
      }));
    } catch (err) {
      console.error('Enrichment start error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // POST /api/enrichment/stop
  if (pathname === '/api/enrichment/stop' && req.method === 'POST') {
    try {
      if (activeRunner && activeRunner.process) {
        // The slot stays occupied until the process has actually exited (see release()), so
        // a new run can't start while the old one is still writing to the database.
        const area = activeRunner.area;
        activeRunner.stopping = true;
        activeRunner.process.kill();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Stopping enrichment for ${area}` }));
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'No active enrichment running' }));
      }
    } catch (err) {
      console.error('Enrichment stop error:', err);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(PORT, HOST, () => {
  console.log(`[Cadastre Server] Running on http://${HOST}:${PORT} (local only)`);
});

export default server;
