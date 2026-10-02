// REAL intel API server: local-only HTTP front end for the SQLite database.
// Endpoints are listed in routes.js; the local-only guard is in http.js.
import http from 'node:http';
import { HOST, PORT, rejectUntrustedRequest, sendJson } from './http.js';
import { matchRoute } from './routes.js';

const server = http.createServer(async (req, res) => {
  if (rejectUntrustedRequest(req, res)) return;

  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = matchRoute(req.method, url.pathname);
  if (!match) return sendJson(res, 404, { error: 'Not found' });

  try {
    await match.route.handler({ req, res, query: url.searchParams, param: match.param });
  } catch (err) {
    console.error(`${req.method} ${url.pathname} failed:`, err);
    if (!res.headersSent) sendJson(res, 500, { error: err.message });
    else res.end();
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[Cadastre Server] Running on http://${HOST}:${PORT} (local only)`);
});

export default server;
