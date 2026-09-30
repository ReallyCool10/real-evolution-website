import { spawn, exec } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const nodeCmd = process.execPath;
const viteJs = path.join(__dirname, 'node_modules', 'vite', 'bin', 'vite.js');
const serverJs = path.join(__dirname, 'server', 'server.js');

let serverProc = null;
let viteProc = null;

async function checkService(url) {
  try {
    const res = await fetch(url);
    return res.ok;
  } catch {
    return false;
  }
}

async function start() {
  const backendRunning = await checkService('http://127.0.0.1:3001/api/health');
  if (backendRunning) {
    console.log('[Backend] Already active on http://127.0.0.1:3001');
  } else {
    console.log('Starting REAL intel Backend Server (port 3001)...');
    serverProc = spawn(nodeCmd, [serverJs], {
      cwd: __dirname,
      stdio: 'inherit'
    });
  }

  const frontendRunning = await checkService('http://localhost:5173');
  if (frontendRunning) {
    console.log('[Frontend] Already active on http://localhost:5173');
    openBrowser();
  } else {
    console.log('Starting REAL intel Vite Dev Server (port 5173)...');
    viteProc = spawn(nodeCmd, [viteJs, '--port', '5173'], {
      cwd: __dirname,
      stdio: 'inherit'
    });
    openBrowser();
  }
}

async function openBrowser() {
  const url = 'http://localhost:5173';
  let retries = 40;
  while (retries > 0) {
    const ok = await checkService(url);
    if (ok) {
      console.log(`\nServices online. Launching application: ${url}`);
      // On Windows: launch standalone app window via Edge, fallback to default browser
      const cmd = process.platform === 'win32'
        ? `start msedge --app=${url} || start ${url}`
        : `open ${url}`;
      exec(cmd);
      break;
    }
    await new Promise((r) => setTimeout(r, 250));
    retries--;
  }
}

function cleanup() {
  console.log('\nStopping servers...');
  if (serverProc) serverProc.kill('SIGINT');
  if (viteProc) viteProc.kill('SIGINT');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

start();
