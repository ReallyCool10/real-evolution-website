// Proxy for HM Land Registry's INSPIRE cadastral parcel map (WMS). Requests a slightly
// taller tile with our own style, crops off the bottom banner, and caches the result.
import zlib from 'node:zlib';

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

/** GET /api/hmlr-wms?BBOX=minX,minY,maxX,maxY (EPSG:3857). */
export async function serveCadastreTile(res, searchParams) {
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
}
