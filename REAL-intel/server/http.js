// Small HTTP helpers shared by the API routes, plus the local-only request guard.

export const PORT = Number(process.env.PORT) || 3001;

// This is a local, single-user tool with no authentication, so it must only be reachable from
// this machine. It listens on loopback only, and it sends no CORS headers: the Vite dev
// server proxies /api, so the app is same-origin and other websites cannot read responses.
// The Host check blocks DNS-rebinding (a hostile page whose domain resolves to 127.0.0.1),
// and requiring a JSON content type on POST stops cross-site "simple" form/fetch requests,
// which cannot set that header without a CORS preflight we never approve.
export const HOST = '127.0.0.1';
const ALLOWED_HOSTS = new Set([`localhost:${PORT}`, `127.0.0.1:${PORT}`]);

export function sendJson(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

/** Sends a 403/415 and returns true if the request must not be served. */
export function rejectUntrustedRequest(req, res) {
  if (!ALLOWED_HOSTS.has(req.headers.host)) {
    sendJson(res, 403, { error: 'Forbidden host' });
    return true;
  }
  const isJson = (req.headers['content-type'] || '').split(';')[0].trim() === 'application/json';
  if (req.method === 'POST' && !isJson) {
    sendJson(res, 415, { error: 'Content-Type must be application/json' });
    return true;
  }
  return false;
}

/** Parses a JSON request body (empty body -> {}), refusing anything over 1 MB. */
export function parseJsonBody(req) {
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
