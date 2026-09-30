// File locations shared by the server and every data script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = process.env.REAL_INTEL_DB || path.join(SERVER_DIR, 'cadastre.sqlite');
export const STAGING_DB_PATH = path.join(path.dirname(DB_PATH), 'cadastre_staging.sqlite');

// Raw datasets (CCOD/OCOD, NSUL, ukpostcodes.csv) are too large for git. Scripts historically
// looked in two places: the folder *beside* the website repo (C:/Dev/DATA) and the repo's own
// gitignored DATA/ folder. Set REAL_INTEL_DATA_DIR to pin one; otherwise both are searched.
const DATA_DIRS = [
  process.env.REAL_INTEL_DATA_DIR,
  path.resolve(SERVER_DIR, '../../../DATA'),
  path.resolve(SERVER_DIR, '../../DATA'),
].filter(Boolean);

/**
 * Absolute path to a file or folder inside the data directory: the first location where it
 * exists, or the first candidate (so "not found" messages show a sensible path).
 */
export function dataPath(...segments) {
  const candidates = DATA_DIRS.map(dir => path.join(dir, ...segments));
  return candidates.find(p => fs.existsSync(p)) ?? candidates[0];
}
