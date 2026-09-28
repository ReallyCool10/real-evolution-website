import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../../DATA/NSUL');
const ZIP_PATH = path.join(DATA_DIR, 'NSUL_E127_JUN_2026.zip');
const NSUL_URL = 'https://www.arcgis.com/sharing/rest/content/items/e5c9409787b344dea64488d70fb0990a/data';

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

async function downloadNSUL() {
  console.log('=== REAL Intel: National Statistics UPRN Lookup (NSUL) Downloader ===');
  console.log(`Source URL: ${NSUL_URL}`);
  console.log(`Target File: ${ZIP_PATH}`);

  let startBytes = 0;
  if (fs.existsSync(ZIP_PATH)) {
    const stats = fs.statSync(ZIP_PATH);
    startBytes = stats.size;
    console.log(`Found existing partial file (${(startBytes / 1024 / 1024).toFixed(1)} MB). Resuming...`);
  }

  const headers = {};
  if (startBytes > 0) {
    headers['Range'] = `bytes=${startBytes}-`;
  }

  const response = await fetch(NSUL_URL, { headers });

  if (!response.ok && response.status !== 206) {
    if (response.status === 416) {
      console.log('Download already complete!');
      return;
    }
    throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalBytes = (contentLength ? parseInt(contentLength, 10) : 0) + startBytes;
  const totalMb = (totalBytes / 1024 / 1024).toFixed(1);

  console.log(`Total Download Size: ${totalMb} MB`);

  const fileStream = fs.createWriteStream(ZIP_PATH, { flags: startBytes > 0 ? 'a' : 'w' });
  let downloadedBytes = startBytes;
  let lastLogged = Date.now();

  const reader = response.body.getReader();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    fileStream.write(value);
    downloadedBytes += value.length;

    const now = Date.now();
    if (now - lastLogged > 2000 || downloadedBytes === totalBytes) {
      lastLogged = now;
      const currentMb = (downloadedBytes / 1024 / 1024).toFixed(1);
      const pct = totalBytes > 0 ? ((downloadedBytes / totalBytes) * 100).toFixed(1) : 0;
      process.stdout.write(`\r[Downloading] ${currentMb} MB / ${totalMb} MB (${pct}%)`);
    }
  }

  fileStream.end();
  console.log(`\n\n[Success] Download completed successfully: ${ZIP_PATH}`);
}

downloadNSUL().catch(err => {
  console.error('\nDownload failed:', err.message);
  process.exit(1);
});
