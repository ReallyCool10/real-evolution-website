// Runs one enrichment pass at a time as a child process (OSM or UPRN matching), started and
// stopped from the app's Settings panel.
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));
const AREA_PATTERN = /^[A-Za-z0-9 ,'-]{1,60}$/;
const SINGLE_OUTCODE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

let activeRunner = null;

export function getActiveRunnerInfo() {
  if (!activeRunner) return { isRunning: false };
  return {
    isRunning: true,
    stopping: Boolean(activeRunner.stopping),
    area: activeRunner.area,
    startTime: activeRunner.startTime,
    pid: activeRunner.process ? activeRunner.process.pid : null,
  };
}

function runnerCommand(area, mode) {
  const single = SINGLE_OUTCODE.test(area);
  if (mode === 'uprn') {
    return { script: path.join(SERVER_DIR, 'uprn-matcher.js'), args: [single ? `--outcode=${area}` : `--area=${area}`] };
  }
  return { script: path.join(SERVER_DIR, 'automated-runner.js'), args: [single ? '--outcode' : '--area', area] };
}

/** Starts a run. Returns { status, body } for the HTTP response. */
export function startEnrichment(body) {
  const area = String(body.area || body.outcode || 'London').trim();
  const mode = body.mode === 'uprn' ? 'uprn' : 'osm';

  if (!AREA_PATTERN.test(area)) {
    return { status: 400, body: { success: false, error: 'Area must be a postcode area or place name' } };
  }
  if (activeRunner) {
    return {
      status: 409,
      body: { success: false, error: `Enrichment is already active for ${activeRunner.area}`, runner: getActiveRunnerInfo() },
    };
  }

  const { script, args } = runnerCommand(area, mode);
  console.log(`[Server] Spawning enrichment runner (${mode}): ${script} ${args.join(' ')}`);
  const runnerProc = spawn(process.execPath, [script, ...args], {
    cwd: path.join(SERVER_DIR, '..'),
    stdio: 'inherit',
    detached: false,
  });
  activeRunner = { process: runnerProc, area, mode, startTime: Date.now() };

  // Only clear the slot if it still belongs to this process, so a late exit event from an
  // old runner can never wipe the record of a newer one.
  const release = () => {
    if (activeRunner && activeRunner.process === runnerProc) activeRunner = null;
  };
  runnerProc.on('close', code => {
    console.log(`[Server] Enrichment runner (${mode}) for ${area} exited with code ${code}`);
    release();
  });
  runnerProc.on('error', err => {
    console.error(`[Server] Enrichment runner error for ${area}:`, err);
    release();
  });

  return {
    status: 200,
    body: { success: true, message: `Enrichment (${mode.toUpperCase()}) started for ${area}`, area, mode, pid: runnerProc.pid },
  };
}

/** Asks the active run to stop. Returns the response body. */
export function stopEnrichment() {
  if (!activeRunner || !activeRunner.process) return { success: true, message: 'No active enrichment running' };
  // The slot stays occupied until the process has actually exited (see release()), so a new
  // run can't start while the old one is still writing to the database.
  activeRunner.stopping = true;
  activeRunner.process.kill();
  return { success: true, message: `Stopping enrichment for ${activeRunner.area}` };
}
