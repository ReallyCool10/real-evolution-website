import http from 'node:http';
import { spawn } from 'node:child_process';
import {
  queryProperties,
  searchProperties,
  searchUnified,
  getProprietorPortfolio,
  getPropertyById,
  getStats,
  getEnrichmentSummary,
  getWorkspaceState,
  saveWorkspaceState
} from './db.js';

const PORT = process.env.PORT || 3001;

let activeRunner = null;

function getActiveRunnerInfo() {
  if (!activeRunner) return { isRunning: false };
  return {
    isRunning: true,
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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

const server = http.createServer(async (req, res) => {
  setCors(res);
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

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
    const limit = parseInt(searchParams.get('limit'), 10) || 500;

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

  // GET /api/hmlr-wms (Transparent CORS & cache proxy for HMLR Inspire Cadastral Parcels WMS)
  if (pathname === '/api/hmlr-wms' && req.method === 'GET') {
    const bbox = searchParams.get('BBOX') || searchParams.get('bbox');
    if (!bbox) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing BBOX parameter' }));
      return;
    }

    const targetUrl = `https://inspire.landregistry.gov.uk/inspire/ows?SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=TRUE&LAYERS=inspire:CP.CadastralParcel&CRS=EPSG:3857&STYLES=&WIDTH=256&HEIGHT=256&BBOX=${encodeURIComponent(bbox)}`;

    try {
      const upstream = await fetch(targetUrl);
      if (!upstream.ok) {
        res.writeHead(upstream.status, {
          'Content-Type': 'text/plain',
          'Access-Control-Allow-Origin': '*'
        });
        res.end('Upstream WMS returned status ' + upstream.status);
        return;
      }
      const buffer = await upstream.arrayBuffer();
      res.writeHead(200, {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(Buffer.from(buffer));
    } catch (err) {
      res.writeHead(502, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({ error: 'Failed to fetch HMLR WMS tile', details: err.message }));
    }
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
      const success = saveWorkspaceState(body);
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
      const targetArea = (body.area || body.outcode || 'London').trim();
      const mode = body.mode === 'uprn' ? 'uprn' : 'osm';

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
      let runnerScript = 'server/automated-runner.js';
      let runnerArgs = [];

      if (mode === 'uprn') {
        runnerScript = 'server/uprn-matcher.js';
        runnerArgs = [isSingleOutcode ? `--outcode=${targetArea}` : `--area=${targetArea}`];
      } else {
        runnerArgs = [isSingleOutcode ? '--outcode' : '--area', targetArea];
      }

      console.log(`[Server] Spawning enrichment runner (${mode}): ${runnerScript} ${runnerArgs.join(' ')}`);
      const runnerProc = spawn('node', [runnerScript, ...runnerArgs], {
        cwd: process.cwd(),
        stdio: 'inherit',
        detached: false
      });

      activeRunner = {
        process: runnerProc,
        area: targetArea,
        mode: mode,
        startTime: Date.now()
      };

      runnerProc.on('close', (code) => {
        console.log(`[Server] Enrichment runner (${mode}) for ${targetArea} exited with code ${code}`);
        activeRunner = null;
      });

      runnerProc.on('error', (err) => {
        console.error(`[Server] Enrichment runner error for ${targetArea}:`, err);
        activeRunner = null;
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
        const area = activeRunner.area;
        activeRunner.process.kill();
        activeRunner = null;
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: `Stopped enrichment for ${area}` }));
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

server.listen(PORT, () => {
  console.log(`[Cadastre Server] Running on http://localhost:${PORT}`);
});

export default server;
