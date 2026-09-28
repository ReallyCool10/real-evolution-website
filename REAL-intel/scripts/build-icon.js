import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

// Scaled up REAL Evolution brand blue house:
// - Max space utilization: Near-zero padding (~6px margin on 256px canvas = 95.3% canvas fill)
// - 1.3x bolder stroke width: 54px (up from proportional 41.5px / original 26px)
// - Butt bottom caps for a clean flat foundation, round joins for smooth eaves and apex
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="256" height="256">
  <defs>
    <!-- Vivid electric to royal blue gradient matching REAL Evolution brand identity -->
    <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#4aa3ff"/>
      <stop offset="40%" stop-color="#1e90ff"/>
      <stop offset="100%" stop-color="#0055d4"/>
    </linearGradient>

    <!-- Crisp ambient drop shadow to give depth on light and dark backgrounds -->
    <filter id="crispShadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-color="#000000" flood-opacity="0.35"/>
    </filter>
  </defs>

  <g filter="url(#crispShadow)">
    <path d="M 33,248 
             L 33,141 
             L 128,35 
             L 223,141 
             L 223,248" 
          stroke="url(#blueGrad)" 
          stroke-width="54"
          stroke-linecap="butt"
          stroke-linejoin="round"
          fill="none"/>
  </g>
</svg>`;

// Save master SVG and favicon.svg
fs.writeFileSync(path.join(publicDir, 'cadastre-logo.svg'), svgContent, 'utf8');
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf8');
console.log('Saved transparent master SVG and favicon.svg');

// HTML container for rendering 256x256 master PNG
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 256px; height: 256px; overflow: hidden; background: transparent !important; position: relative; }
    svg { width: 100%; height: 100%; display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;

const htmlPath = path.join(publicDir, 'render-icon.html');
fs.writeFileSync(htmlPath, htmlContent, 'utf8');

// Render master 256x256 transparent PNG via Edge headless
const master256Path = path.join(publicDir, 'cadastre-256.png');
console.log('Rendering master 256x256 transparent PNG via Chromium engine...');
execSync(`"${edgePath}" --headless=new --disable-gpu --force-device-scale-factor=1 --default-background-color=00000000 --screenshot="${master256Path}" --window-size=256,256 "${htmlPath}"`, {
  stdio: 'ignore'
});

// Downscale to all standard icon sizes (128, 64, 48, 32, 16) with high-quality bicubic resampling
const sizes = [256, 128, 64, 48, 32, 16];
const downscalePsScript = `
Add-Type -AssemblyName System.Drawing
$master = [System.Drawing.Image]::FromFile('${master256Path.replace(/\\/g, '\\\\')}')
$targetSizes = @(128, 64, 48, 32, 16)
foreach ($s in $targetSizes) {
    $bmp = New-Object System.Drawing.Bitmap($s, $s, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.Clear([System.Drawing.Color]::Transparent)
    $g.DrawImage($master, 0, 0, $s, $s)
    $g.Dispose()
    $out = Join-Path '${publicDir.replace(/\\/g, '\\\\')}' "icon-$s.png"
    $bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}
$master.Dispose()
`;

const psScriptPath = path.join(publicDir, 'downscale.ps1');
fs.writeFileSync(psScriptPath, downscalePsScript, 'utf8');
execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${psScriptPath}"`, { stdio: 'inherit' });
fs.unlinkSync(psScriptPath);

// Gather all PNG buffers for ICO packaging
const pngBuffers = sizes.map(size => {
  const filePath = size === 256 ? master256Path : path.join(publicDir, `icon-${size}.png`);
  return { size, buffer: fs.readFileSync(filePath) };
});

// Assemble multi-resolution ICO file
console.log('Packaging multi-resolution transparent ICO file...');
const numImages = pngBuffers.length;
const headerSize = 6;
const dirEntrySize = 16;
let dataOffset = headerSize + (numImages * dirEntrySize);

const header = Buffer.alloc(headerSize);
header.writeUInt16LE(0, 0); // Reserved
header.writeUInt16LE(1, 2); // 1 = ICO
header.writeUInt16LE(numImages, 4);

const entries = [];
const imageParts = [];

for (const img of pngBuffers) {
  const entry = Buffer.alloc(dirEntrySize);
  const w = img.size === 256 ? 0 : img.size;
  const h = img.size === 256 ? 0 : img.size;

  entry.writeUInt8(w, 0);
  entry.writeUInt8(h, 1);
  entry.writeUInt8(0, 2); // Color palette
  entry.writeUInt8(0, 3); // Reserved
  entry.writeUInt16LE(1, 4); // Color planes
  entry.writeUInt16LE(32, 6); // Bits per pixel (32-bit RGBA)
  entry.writeUInt32LE(img.buffer.length, 8); // Size
  entry.writeUInt32LE(dataOffset, 12); // Offset

  entries.push(entry);
  imageParts.push(img.buffer);
  dataOffset += img.buffer.length;
}

const icoBuffer = Buffer.concat([header, ...entries, ...imageParts]);

// Write cadastre.ico and favicon.ico to public
const cadastreIco = path.join(publicDir, 'cadastre.ico');
const faviconIco = path.join(publicDir, 'favicon.ico');
fs.writeFileSync(cadastreIco, icoBuffer);
fs.writeFileSync(faviconIco, icoBuffer);
console.log(`Wrote transparent cadastre.ico & favicon.ico (${icoBuffer.length} bytes)`);

// Apple touch icon
fs.copyFileSync(master256Path, path.join(publicDir, 'apple-touch-icon.png'));

// Cleanup intermediate individual pngs
for (const img of pngBuffers) {
  if (img.size !== 256) {
    fs.unlinkSync(path.join(publicDir, `icon-${img.size}.png`));
  }
}

// Copy to dist/ if present
if (fs.existsSync(distDir)) {
  fs.copyFileSync(path.join(publicDir, 'cadastre-logo.svg'), path.join(distDir, 'cadastre-logo.svg'));
  fs.copyFileSync(path.join(publicDir, 'favicon.svg'), path.join(distDir, 'favicon.svg'));
  fs.copyFileSync(path.join(publicDir, 'cadastre.ico'), path.join(distDir, 'cadastre.ico'));
  fs.copyFileSync(path.join(publicDir, 'favicon.ico'), path.join(distDir, 'favicon.ico'));
  fs.copyFileSync(path.join(publicDir, 'cadastre-256.png'), path.join(distDir, 'cadastre-256.png'));
  fs.copyFileSync(path.join(publicDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon.png'));
  console.log('Synced all transparent assets to dist/');
}

fs.unlinkSync(htmlPath);
console.log('Transparent icon & favicon generation complete!');
