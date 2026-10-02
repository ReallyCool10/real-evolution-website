// The API: one entry per endpoint. Handlers receive { req, res, query, param } and either
// send a response themselves or throw (the dispatcher in server.js turns that into a 500).
import {
  getEnrichmentSummary,
  getPropertyById,
  getProprietorPortfolio,
  getStats,
  getWorkspaceState,
  queryProperties,
  saveWorkspaceState,
  searchUnified,
} from './db.js';
import { getActiveRunnerInfo, startEnrichment, stopEnrichment } from './enrichment.js';
import { parseJsonBody, sendJson } from './http.js';
import { serveCadastreTile } from './tiles.js';

const int = (value, fallback, max = Infinity) => Math.min(parseInt(value, 10) || fallback, max);

/** GET /api/properties?minLat&maxLat&minLon&maxLon&zoom[&type&tenure&limit] */
function properties({ res, query }) {
  const [minLat, maxLat, minLon, maxLon, zoom] = ['minLat', 'maxLat', 'minLon', 'maxLon', 'zoom'].map(k => query.get(k));
  if (!minLat || !maxLat || !minLon || !maxLon || zoom === null) {
    return sendJson(res, 400, { error: 'Missing required bounding box or zoom parameters' });
  }
  const result = queryProperties({
    minLat: parseFloat(minLat),
    minLon: parseFloat(minLon),
    maxLat: parseFloat(maxLat),
    maxLon: parseFloat(maxLon),
    zoom: parseFloat(zoom),
    type: String(query.get('type') || 'ALL'),
    tenure: String(query.get('tenure') || 'ALL'),
    limit: int(query.get('limit'), 1500, 2500),
  });
  sendJson(res, 200, { tier: result.tier, zoom: result.zoom, count: result.data.length, data: result.data });
}

/** GET /api/search?q= : proprietors plus properties by title, postcode or address. */
function search({ res, query }) {
  const q = (query.get('q') || '').trim();
  const { proprietors, properties: matches } = searchUnified(q, int(query.get('limit'), 15));
  sendJson(res, 200, { query: q, proprietors, properties: matches });
}

/** GET /api/proprietor/:name : portfolio of everything a proprietor owns. */
function proprietor({ res, query, param }) {
  const portfolio = getProprietorPortfolio(decodeURIComponent(param), int(query.get('limit'), 500, 2000));
  if (!portfolio) return sendJson(res, 404, { error: 'Proprietor not found' });
  sendJson(res, 200, portfolio);
}

/** GET /api/property/:id */
function property({ res, param }) {
  const found = getPropertyById(param);
  if (!found) return sendJson(res, 404, { error: 'Property not found' });
  sendJson(res, 200, found);
}

/** POST /api/workspace : saved items and custom lists are posted separately, so each save is
 *  merged into the stored state rather than replacing it; only known fields are accepted. */
async function saveWorkspace({ req, res }) {
  const body = await parseJsonBody(req);
  const update = {};
  if (Array.isArray(body.savedItems)) update.savedItems = body.savedItems;
  if (Array.isArray(body.customLists)) update.customLists = body.customLists;
  if (Object.keys(update).length === 0) {
    return sendJson(res, 400, { error: 'Expected savedItems and/or customLists arrays' });
  }
  sendJson(res, 200, { success: saveWorkspaceState({ ...getWorkspaceState(), ...update }) });
}

async function startRun({ req, res }) {
  const { status, body } = startEnrichment(await parseJsonBody(req));
  sendJson(res, status, body);
}

// `prefix` routes take the rest of the path as `param` (e.g. /api/property/42 -> "42").
export const ROUTES = [
  { method: 'GET', path: '/api/health', handler: ({ res }) => sendJson(res, 200, { ok: true }) },
  { method: 'GET', path: '/api/properties', handler: properties },
  { method: 'GET', path: '/api/search', handler: search },
  { method: 'GET', prefix: '/api/proprietor/', handler: proprietor },
  { method: 'GET', prefix: '/api/property/', handler: property },
  { method: 'GET', path: '/api/hmlr-wms', handler: ({ res, query }) => serveCadastreTile(res, query) },
  { method: 'GET', path: '/api/stats', handler: ({ res }) => sendJson(res, 200, getStats()) },
  { method: 'GET', path: '/api/enrichment/status', handler: ({ res }) => sendJson(res, 200, getEnrichmentSummary()) },
  { method: 'GET', path: '/api/enrichment/active', handler: ({ res }) => sendJson(res, 200, getActiveRunnerInfo()) },
  { method: 'GET', path: '/api/workspace', handler: ({ res }) => sendJson(res, 200, getWorkspaceState()) },
  { method: 'POST', path: '/api/workspace', handler: saveWorkspace },
  { method: 'POST', path: '/api/enrichment/start', handler: startRun },
  { method: 'POST', path: '/api/enrichment/stop', handler: ({ res }) => sendJson(res, 200, stopEnrichment()) },
];

/** The route for a request, and the path remainder for prefix routes. */
export function matchRoute(method, pathname) {
  for (const route of ROUTES) {
    if (route.method !== method) continue;
    if (route.path === pathname) return { route, param: undefined };
    if (route.prefix && pathname.startsWith(route.prefix)) return { route, param: pathname.slice(route.prefix.length) };
  }
  return null;
}
