import React, { useState, useEffect, useRef } from 'react';
import styled from 'styled-components';

const MapContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 2rem;
  animation: fadeIn 0.5s ease-out;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(15px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const HeaderSection = styled.div`
  text-align: left;
  padding-bottom: 1.5rem;
  margin-bottom: 2.5rem;
  margin-top: -40px;

  span {
    font-family: 'Outfit', sans-serif;
    font-size: 0.85rem;
    text-transform: uppercase;
    color: hsl(46, 65%, 52%);
    letter-spacing: 2px;
    font-weight: 600;
  }

  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 2.5rem;
    color: #ffffff;
    font-weight: 500;
    margin: 0.5rem 0 0 0;
  }
`;

const Figure1Section = styled.div`
  margin-top: 3rem;
  padding-top: 1rem;
  text-align: left;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 100%;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 3rem;
  text-align: left;

  @media (max-width: 1000px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

const VisualColumn = styled.div`
  display: flex;
  flex-direction: column;
  position: relative;
  min-height: 770px;
`;

const MapViewport = styled.div`
  width: 100%;
  height: 770px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: #eceef2;
  box-shadow: inset 0 0 25px rgba(0, 0, 0, 0.12);
  position: relative;
  z-index: 1;

  .leaflet-popup-content-wrapper {
    background: rgba(10, 13, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(8px);
    color: #ffffff;
    border-radius: 8px;
    font-family: 'Outfit', sans-serif;
  }

  .leaflet-popup-tip {
    background: rgba(10, 13, 20, 0.95);
    border: 1px solid rgba(255, 255, 255, 0.15);
  }
`;

const FloatingMapControls = styled.div`
  position: absolute;
  bottom: 25px;
  right: 25px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  z-index: 1000;
`;

const MapButton = styled.button`
  width: 38px;
  height: 38px;
  border-radius: 8px;
  background: rgba(10, 13, 20, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  font-size: 1.2rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);

  &:hover {
    background: rgba(212, 175, 55, 0.2);
    border-color: hsl(46, 65%, 52%);
    color: hsl(46, 65%, 52%);
    transform: scale(1.05);
  }
`;

const SidebarConsole = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const ConsoleCard = styled.div`
  padding: 0;
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ToggleRow = styled.div<{ active: boolean; accentColor: string }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  background: ${props => (props.active ? 'rgba(255, 255, 255, 0.02)' : 'transparent')};
  border: 1px solid ${props => (props.active ? 'rgba(255, 255, 255, 0.06)' : 'rgba(255, 255, 255, 0.02)')};
  transition: all 0.2s ease;
  margin-bottom: 0.5rem;

  &:last-child {
    margin-bottom: 0;
  }

  .label-group {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .indicator {
    width: 10px;
    height: 10px;
    border-radius: 3px;
    background: ${props => props.accentColor};
    box-shadow: ${props => (props.active ? `0 0 8px ${props.accentColor}` : 'none')};
  }

  .title {
    font-family: 'Outfit', sans-serif;
    font-size: 0.9rem;
    color: ${props => (props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.45)')};
  }

  .stat {
    font-family: 'Outfit', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: ${props => (props.active ? props.accentColor : 'rgba(255, 255, 255, 0.25)')};
    margin-right: 1rem;
  }
`;

const Switch = styled.button<{ active: boolean; accentColor: string }>`
  background: ${props => (props.active ? props.accentColor : 'rgba(255, 255, 255, 0.08)')};
  border: none;
  width: 44px;
  height: 22px;
  border-radius: 11px;
  cursor: pointer;
  position: relative;
  transition: background 0.2s ease;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${props => (props.active ? '25px' : '3px')};
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: #0a0d14;
    transition: left 0.2s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
`;

const LicenseNotice = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.4);
  line-height: 1.5;
  text-align: left;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255, 255, 255, 0.05);

  a {
    color: hsl(46, 65%, 52%);
    text-decoration: none;
    border-bottom: 1px dashed rgba(212, 175, 55, 0.4);

    &:hover {
      color: #ffffff;
      border-bottom-style: solid;
      border-bottom-color: #ffffff;
    }
  }
`;

const InfoBox = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);

  h4 {
    font-family: 'Outfit', sans-serif;
    color: #ffffff;
    font-size: 1.1rem;
    font-weight: 500;
    margin: 0 0 0.5rem 0;
  }
`;

const TableGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1.5rem;
`;

const TableRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-family: 'Inter', sans-serif;

  .label {
    font-family: 'Outfit', sans-serif;
    font-size: 0.95rem;
    color: #ffffff;
    font-weight: 500;
  }

  .value-group {
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }

  .ha-val {
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.45);
  }

  .pct-val {
    font-family: 'Outfit', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: hsl(46, 65%, 52%);
    min-width: 50px;
    text-align: right;
  }
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.06);
  border-radius: 3px;
  overflow: hidden;
  margin-top: 0.4rem;
`;

const ProgressBarFill = styled.div<{ pct: number }>`
  height: 100%;
  width: ${props => props.pct}%;
  background: hsl(46, 65%, 52%);
  border-radius: 3px;
`;

interface City {
  name: string;
  lat: number;
  lon: number;
  pop: string;
  developed: string;
}

const CITIES: City[] = [
  { name: 'LONDON', lat: 51.5074, lon: -0.1278, pop: '9.5M', developed: '40.6%' },
  { name: 'BIRMINGHAM', lat: 52.4862, lon: -1.8904, pop: '1.2M', developed: '18.4%' },
  { name: 'MANCHESTER', lat: 53.4808, lon: -2.2426, pop: '2.8M', developed: '16.5%' },
  { name: 'LEEDS', lat: 53.8008, lon: -1.5491, pop: '800K', developed: '14.2%' },
  { name: 'NEWCASTLE', lat: 54.9783, lon: -1.6178, pop: '300K', developed: '11.8%' },
  { name: 'EDINBURGH', lat: 55.9533, lon: -3.1883, pop: '540K', developed: '10.5%' },
  { name: 'GLASGOW', lat: 55.8642, lon: -4.2518, pop: '630K', developed: '12.2%' },
  { name: 'BELFAST', lat: 54.5973, lon: -5.9301, pop: '340K', developed: '9.8%' },
  { name: 'CARDIFF', lat: 51.4816, lon: -3.1791, pop: '360K', developed: '10.1%' },
  { name: 'BRISTOL', lat: 51.4545, lon: -2.5879, pop: '470K', developed: '12.8%' }
];

// Regional ONS/UKCEH 2024 Land Cover Statistics Dictionary
const REGIONAL_DATA: { [key: string]: any } = {
  unitedkingdom: { name: 'United Kingdom (Total)', developed: '7.2%', agriculture: '49.0%', woodland: '12.0%', grassland: '28.7%', water: '3.1%', area: '24,271,100 ha' },
  london: { name: 'London', developed: '40.6%', agriculture: '35.0%', woodland: '10.2%', grassland: '12.2%', water: '2.0%', area: '157,200 ha' },
  southeast: { name: 'South East', developed: '9.9%', agriculture: '58.1%', woodland: '18.2%', grassland: '11.8%', water: '2.0%', area: '1,909,600 ha' },
  southwest: { name: 'South West', developed: '7.0%', agriculture: '71.1%', woodland: '11.0%', grassland: '9.4%', water: '1.5%', area: '2,382,900 ha' },
  eastofengland: { name: 'East of England', developed: '8.2%', agriculture: '76.5%', woodland: '8.2%', grassland: '5.6%', water: '1.5%', area: '1,912,000 ha' },
  eastmidlands: { name: 'East Midlands', developed: '7.8%', agriculture: '74.2%', woodland: '9.0%', grassland: '7.8%', water: '1.2%', area: '1,562,700 ha' },
  westmidlands: { name: 'West Midlands', developed: '9.2%', agriculture: '68.4%', woodland: '10.5%', grassland: '10.9%', water: '1.0%', area: '1,300,000 ha' },
  yorkshireandthehumber: { name: 'Yorkshire and the Humber', developed: '7.6%', agriculture: '60.5%', woodland: '9.8%', grassland: '20.3%', water: '1.8%', area: '1,540,800 ha' },
  northwest: { name: 'North West', developed: '9.8%', agriculture: '52.2%', woodland: '10.2%', grassland: '25.5%', water: '2.3%', area: '1,416,500 ha' },
  northeast: { name: 'North East', developed: '7.2%', agriculture: '45.1%', woodland: '12.0%', grassland: '33.5%', water: '2.2%', area: '859,200 ha' },
  scotland: { name: 'Scotland', developed: '2.5%', agriculture: '22.0%', woodland: '18.5%', grassland: '52.0%', water: '5.0%', area: '7,791,000 ha' },
  wales: { name: 'Wales', developed: '4.2%', agriculture: '55.0%', woodland: '15.0%', grassland: '23.8%', water: '2.0%', area: '2,077,900 ha' },
  northernireland: { name: 'Northern Ireland', developed: '3.5%', agriculture: '68.0%', woodland: '6.5%', grassland: '16.0%', water: '6.0%', area: '1,356,200 ha' }
};

// UK-wide Land Cover Breakdown (UKCEH Land Cover Map UK averages)
const UK_LAND_COVER = [
  { name: 'Arable & Horticulture', pct: 25.0, ha: '6,068,000 ha', type: 'Agriculture' },
  { name: 'Improved Grassland', pct: 24.0, ha: '5,825,000 ha', type: 'Agriculture' },
  { name: 'Semi-natural Grassland & Heath', pct: 15.0, ha: '3,641,000 ha', type: 'Natural' },
  { name: 'Broadleaved & Mixed Woodland', pct: 7.0, ha: '1,699,000 ha', type: 'Natural' },
  { name: 'Coniferous Woodland', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Residential (Homes & Gardens)', pct: 5.6, ha: '1,359,000 ha', type: 'Built-Up' },
  { name: 'Bog, Marsh & Fen', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Freshwater & Coastal', pct: 3.1, ha: '752,000 ha', type: 'Natural' },
  { name: 'Urban (Transport, Commercial & Industrial)', pct: 1.6, ha: '388,000 ha', type: 'Built-Up' },
  { name: 'Other (Bare Ground, Scrub, etc.)', pct: 8.7, ha: '2,111,000 ha', type: 'Natural' },
];

export const LandUseMap: React.FC = () => {
  const [ukSvgPaths, setUkSvgPaths] = useState<string[]>([]);
  const [ukSvgSize, setUkSvgSize] = useState({ w: 300, h: 450 });
  const [bandYPositions, setBandYPositions] = useState<number[]>([]);

  // Fetch GeoJSON and project to SVG paths for the proportional fill visualization
  useEffect(() => {
    const GEOJSON_URL = 'https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/united-kingdom.geojson';
    fetch(GEOJSON_URL)
      .then(r => r.json())
      .then(data => {
        let minLon = Infinity, maxLon = -Infinity, minLat = Infinity, maxLat = -Infinity;
        const extractCoords = (geometry: any, callback: (lon: number, lat: number) => void) => {
          const rings = geometry.type === 'Polygon' ? geometry.coordinates : geometry.type === 'MultiPolygon' ? geometry.coordinates.flat() : [];
          rings.forEach((ring: number[][]) => ring.forEach((c: number[]) => callback(c[0], c[1])));
        };
        data.features.forEach((f: any) => extractCoords(f.geometry, (lon, lat) => {
          if (lon < minLon) minLon = lon;
          if (lon > maxLon) maxLon = lon;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
        }));

        const midLat = (minLat + maxLat) / 2;
        const cosLat = Math.cos(midLat * Math.PI / 180);
        const geoW = (maxLon - minLon) * cosLat;
        const geoH = maxLat - minLat;

        const pad = 15;
        const svgH = 450;
        const usableH = svgH - 2 * pad;
        const scale = usableH / geoH;
        const usableW = geoW * scale;
        const svgW = usableW + 2 * pad;

        setUkSvgSize({ w: Math.round(svgW), h: svgH });

        const project = (lon: number, lat: number): string => {
          const x = pad + (lon - minLon) * cosLat * scale;
          const y = pad + (maxLat - lat) * scale;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        };

        const paths: string[] = [];
        data.features.forEach((f: any) => {
          const rings = f.geometry.type === 'Polygon' ? f.geometry.coordinates : f.geometry.type === 'MultiPolygon' ? f.geometry.coordinates.flat() : [];
          rings.forEach((ring: number[][]) => {
            const d = ring.map((c: number[], i: number) => `${i === 0 ? 'M' : 'L'}${project(c[0], c[1])}`).join(' ') + ' Z';
            paths.push(d);
          });
        });
        setUkSvgPaths(paths);

        // Compute area-proportional band y-positions via offscreen canvas
        try {
          const canvasScale = 2;
          const cW = Math.round(svgW) * canvasScale;
          const cH = svgH * canvasScale;
          const canvas = document.createElement('canvas');
          canvas.width = cW;
          canvas.height = cH;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.scale(canvasScale, canvasScale);
            ctx.fillStyle = '#000';
            paths.forEach(pathStr => {
              const path2d = new Path2D(pathStr);
              ctx.fill(path2d);
            });
            const imageData = ctx.getImageData(0, 0, cW, cH);
            const rowCounts = new Array(cH).fill(0);
            for (let row = 0; row < cH; row++) {
              for (let col = 0; col < cW; col++) {
                if (imageData.data[(row * cW + col) * 4 + 3] > 128) rowCounts[row]++;
              }
            }
            const totalPixels = rowCounts.reduce((a, b) => a + b, 0);
            const cumulative = new Array(cH);
            cumulative[0] = rowCounts[0];
            for (let row = 1; row < cH; row++) {
              cumulative[row] = cumulative[row - 1] + rowCounts[row];
            }
            // 6 bands: Agriculture 49%, Grassland 28.7%, Forestry 12%, Residential 5.6%, Urban 1.6%, Water 3.1%
            // Source: UKCEH Land Cover Map UK averages (DAERA/UKCEH LCM2015)
            const thresholds = [0.490, 0.777, 0.897, 0.953, 0.969, 1.0];
            const yPositions = thresholds.map(t => {
              const target = t * totalPixels;
              for (let row = 0; row < cH; row++) {
                if (cumulative[row] >= target) return row / canvasScale;
              }
              return svgH;
            });
            setBandYPositions(yPositions);
          }
        } catch (e) {
          setBandYPositions([svgH * 0.490, svgH * 0.777, svgH * 0.897, svgH * 0.953, svgH * 0.969, svgH]);
        }
      })
      .catch(() => {});
  }, []);
  const currentRegionStats = REGIONAL_DATA['unitedkingdom'];


  return (
    <MapContainer>
      <HeaderSection>
        <h2>UK Land Use & Spatial Metrics</h2>
      </HeaderSection>

      <Figure1Section>
        {/* Proportional Fill UK Silhouette — area-proportional bands from real GeoJSON */}
        {ukSvgPaths.length > 0 && bandYPositions.length > 0 && (
          <div style={{ display: 'flex', gap: '5rem', alignItems: 'center', marginBottom: '3rem', marginTop: '-60px', flexWrap: 'wrap', justifyContent: 'flex-start', marginLeft: '-100px' }}>
            <svg viewBox={`0 0 ${ukSvgSize.w} ${ukSvgSize.h}`} width="588" style={{ filter: 'drop-shadow(0 4px 20px rgba(0,0,0,0.4))' }}>
              <defs>
                <clipPath id="uk-silhouette">
                  {ukSvgPaths.map((d, i) => <path key={i} d={d} />)}
                </clipPath>
              </defs>

              {/* Filled bands clipped to real UK shape — area-proportional positions */}
              <g clipPath="url(#uk-silhouette)">
                <rect x="0" y="0" width={ukSvgSize.w} height={bandYPositions[0]} fill="hsl(46, 65%, 52%)" />
                <rect x="0" y={bandYPositions[0]} width={ukSvgSize.w} height={bandYPositions[1] - bandYPositions[0]} fill="#84cc16" />
                <rect x="0" y={bandYPositions[1]} width={ukSvgSize.w} height={bandYPositions[2] - bandYPositions[1]} fill="#10b981" />
                <rect x="0" y={bandYPositions[2]} width={ukSvgSize.w} height={bandYPositions[3] - bandYPositions[2]} fill="#f59e0b" />
                <rect x="0" y={bandYPositions[3]} width={ukSvgSize.w} height={bandYPositions[4] - bandYPositions[3]} fill="#f43f5e" />
                <rect x="0" y={bandYPositions[4]} width={ukSvgSize.w} height={bandYPositions[5] - bandYPositions[4]} fill="#38bdf8" />
              </g>

              {/* Outline stroke */}
              {ukSvgPaths.map((d, i) => <path key={i} d={d} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />)}
            </svg>

            {/* Legend */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { emoji: '🌾', name: 'Agricultural Land', pct: '49.0%', color: 'hsl(46, 65%, 52%)' },
                { emoji: '🌿', name: 'Grassland & Natural Open Space', pct: '28.7%', color: '#84cc16' },
                { emoji: '🌳', name: 'Forestry & Woodland', pct: '12.0%', color: '#10b981' },
                { emoji: '🏠', name: 'Residential (Homes & Gardens)', pct: '5.6%', color: '#f59e0b' },
                { emoji: '🌉', name: 'Urban (Transport & Commercial)', pct: '1.6%', color: '#f43f5e' },
                { emoji: '💧', name: 'Water & Wetlands', pct: '3.1%', color: '#38bdf8' },
              ].map((cat, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: cat.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontFamily: 'Outfit', fontSize: '0.95rem', color: '#ffffff', fontWeight: 500 }}>
                      {cat.emoji} {cat.name}
                    </div>
                    <div style={{ fontFamily: 'Outfit', fontSize: '1.1rem', fontWeight: 600, color: cat.color }}>
                      {cat.pct}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <TableGrid style={{ width: '100%', maxWidth: '850px' }}>
          {UK_LAND_COVER.map((group, idx) => (
            <TableRow key={idx}>
              <div style={{ display: 'flex', flexDirection: 'column', width: '100%', marginRight: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="label">{group.name}</span>
                  <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: group.type === 'Built-Up' ? 'rgba(244,63,94,0.1)' : group.type === 'Agriculture' ? 'rgba(212,175,55,0.1)' : 'rgba(16,185,129,0.1)', color: group.type === 'Built-Up' ? '#f43f5e' : group.type === 'Agriculture' ? 'hsl(46, 65%, 52%)' : '#10b981', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.5px' }}>
                    {group.type}
                  </span>
                </div>
                <ProgressBarContainer style={{ height: '4px', marginTop: '0.5rem' }}>
                  <ProgressBarFill pct={group.pct} style={{ background: group.type === 'Built-Up' ? '#f43f5e' : group.type === 'Agriculture' ? 'hsl(46, 65%, 52%)' : '#10b981' }} />
                </ProgressBarContainer>
              </div>
              <div className="value-group">
                <span className="ha-val">{group.ha}</span>
                <span className="pct-val" style={{ color: group.type === 'Built-Up' ? '#f43f5e' : group.type === 'Agriculture' ? 'hsl(46, 65%, 52%)' : '#10b981' }}>{group.pct}%</span>
              </div>
            </TableRow>
          ))}
        </TableGrid>
      </Figure1Section>

      <LicenseNotice>
        Contains public sector information licensed under the <a href="https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/" target="_blank" rel="noreferrer">Open Government Licence v3.0</a>. Reference sources: <a href="https://www.ceh.ac.uk/data/ukceh-land-cover-maps" target="_blank" rel="noreferrer">UKCEH Land Cover Map 2024 (UK Land Cover Statistics)</a> & ONS Standard Area Measurements.
      </LicenseNotice>
    </MapContainer>
  );
};
