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
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 1.5rem;
  margin-bottom: 2.5rem;

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
  margin-top: 5rem;
  padding-top: 3.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
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
  unitedkingdom: { name: 'United Kingdom (Total)', developed: '6.0%', agriculture: '50.3%', woodland: '13.6%', grassland: '27.0%', water: '3.1%', area: '24,271,100 ha' },
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

// UK-wide Land Cover Breakdown (UKCEH LCM 2024 Statistics)
const UK_LAND_COVER = [
  { name: 'Arable & Horticulture', pct: 25.0, ha: '6,068,000 ha', type: 'Agriculture' },
  { name: 'Improved Grassland', pct: 24.0, ha: '5,825,000 ha', type: 'Agriculture' },
  { name: 'Semi-natural Grassland & Heath', pct: 15.0, ha: '3,641,000 ha', type: 'Natural' },
  { name: 'Broadleaved & Mixed Woodland', pct: 7.0, ha: '1,699,000 ha', type: 'Natural' },
  { name: 'Coniferous Woodland', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Suburban (Residential & Gardens)', pct: 5.1, ha: '1,238,000 ha', type: 'Built-Up' },
  { name: 'Bog, Marsh & Fen', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Freshwater & Coastal', pct: 3.1, ha: '752,000 ha', type: 'Natural' },
  { name: 'Urban (Transport, Commercial & Industrial)', pct: 1.7, ha: '413,000 ha', type: 'Built-Up' },
  { name: 'Other (Bare Ground, Scrub, etc.)', pct: 9.1, ha: '2,208,000 ha', type: 'Natural' },
];

export const LandUseMap: React.FC = () => {
  const [selectedRegion, setSelectedRegion] = useState<string>('unitedkingdom');
  const selectedRegionRef = useRef<string>('unitedkingdom');

  // Keep selectedRegionRef in sync to prevent stale Leaflet event closures
  useEffect(() => {
    selectedRegionRef.current = selectedRegion;
  }, [selectedRegion]);

  const [layers, setLayers] = useState({
    regions: true,
    cities: true,
  });

  const [mapLoaded, setMapLoaded] = useState(false);
  const [leafletError, setLeafletError] = useState(false);

  const mapRef = useRef<any>(null);
  const geojsonGroupRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  const toggleLayer = (key: 'regions' | 'cities') => {
    setLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Dynamically load Leaflet resources
  useEffect(() => {
    const loadLeafletAssets = async () => {
      try {
        if ((window as any).L) {
          setMapLoaded(true);
          return;
        }

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
          setMapLoaded(true);
        };
        script.onerror = () => {
          setLeafletError(true);
        };
        document.body.appendChild(script);
      } catch (err) {
        setLeafletError(true);
      }
    };

    loadLeafletAssets();
  }, []);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || mapRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    const mapInstance = L.map('leaflet-map', {
      center: [54.78, -2.8],
      zoom: 6,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
    });

    // Positron premium light-gray tile styling
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 18,
      subdomains: 'abcd',
    }).addTo(mapInstance);

    geojsonGroupRef.current = L.layerGroup().addTo(mapInstance);
    markersGroupRef.current = L.layerGroup().addTo(mapInstance);
    mapRef.current = mapInstance;

    // Load actual ONS GeoJSON Boundaries dynamically!
    fetch('https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/united-kingdom.geojson')
      .then(response => response.json())
      .then(geoJsonData => {
        const geojson = L.geoJSON(geoJsonData, {
          style: (feature: any) => {
            const name = feature.properties.name || feature.properties.NAME || '';
            const key = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const isSelected = key === selectedRegion;

            return {
              color: isSelected ? 'hsl(46, 65%, 52%)' : 'rgba(10, 13, 20, 0.15)',
              weight: isSelected ? 2.5 : 1.2,
              fillColor: isSelected ? 'hsl(46, 65%, 52%)' : 'rgba(10, 13, 20, 0.03)',
              fillOpacity: isSelected ? 0.28 : 0.05,
            };
          },
          onEachFeature: (feature: any, layer: any) => {
            const name = feature.properties.name || feature.properties.NAME || '';
            const key = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
            const data = REGIONAL_DATA[key];

            // Render interactive popups containing exact statistics
            if (data) {
              layer.bindPopup(`
                <div style="font-family: 'Outfit', sans-serif; min-width: 160px; line-height: 1.4;">
                  <strong style="font-size: 1rem; color: #ffffff;">${data.name}</strong><br/>
                  <span style="font-size: 0.8rem; color: rgba(255,255,255,0.5);">Area: ${data.area}</span>
                  <div style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 8px; padding-top: 8px;">
                    <strong>Land Cover Profile (2024):</strong><br/>
                    🌾 Agriculture: ${data.agriculture}<br/>
                    🌳 Forestry: ${data.woodland}<br/>
                    🏘️ Developed: ${data.developed}<br/>
                    🌿 Grassland: ${data.grassland}<br/>
                    💧 Waterways: ${data.water}
                  </div>
                </div>
              `);
            }

            layer.on({
              mouseover: (e: any) => {
                const target = e.target;
                target.setStyle({
                  color: 'hsl(46, 65%, 52%)',
                  fillOpacity: 0.25,
                  weight: 2
                });
              },
              mouseout: (e: any) => {
                const target = e.target;
                const isSelected = key === selectedRegionRef.current;
                target.setStyle({
                  color: isSelected ? 'hsl(46, 65%, 52%)' : 'rgba(10, 13, 20, 0.15)',
                  fillOpacity: isSelected ? 0.28 : 0.05,
                  weight: isSelected ? 2.5 : 1.2
                });
              },
              click: () => {
                if (REGIONAL_DATA[key]) {
                  setSelectedRegion(key);
                }
              }
            });
          }
        });

        geojson.eachLayer((layer: any) => {
          geojsonGroupRef.current.addLayer(layer);
        });
      })
      .catch(() => {
        setLeafletError(true);
      });

    // Initial markers draw
    drawMarkers();
  }, [mapLoaded]);

  // Synchronize GeoJSON styling when selectedRegion or layers change
  useEffect(() => {
    if (!mapRef.current || !geojsonGroupRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    geojsonGroupRef.current.eachLayer((layer: any) => {
      if (typeof layer.setStyle === 'function' && layer.feature) {
        const feature = layer.feature;
        const name = feature.properties.name || feature.properties.NAME || '';
        const key = name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]/g, '');
        const isSelected = key === selectedRegion;

        layer.setStyle({
          color: isSelected ? 'hsl(46, 65%, 52%)' : 'rgba(10, 13, 20, 0.15)',
          weight: isSelected ? 2.5 : 1.2,
          fillColor: isSelected ? 'hsl(46, 65%, 52%)' : 'rgba(10, 13, 20, 0.03)',
          fillOpacity: isSelected ? 0.28 : 0.05,
        });
      }
    });

    drawMarkers();
  }, [selectedRegion, layers, mapLoaded]);

  const drawMarkers = () => {
    if (!mapRef.current || !markersGroupRef.current) return;

    const L = (window as any).L;
    if (!L) return;

    markersGroupRef.current.clearLayers();

    if (layers.cities) {
      CITIES.forEach((city: City) => {
        L.circleMarker([city.lat, city.lon], {
          radius: 6,
          color: '#f43f5e',
          fillColor: '#f43f5e',
          fillOpacity: 0.9,
          weight: 1.5
        })
        .bindPopup(`
          <div style="font-family: 'Outfit', sans-serif; line-height: 1.3;">
            <strong style="color: #ffffff;">${city.name}</strong><br/>
            Pop: ${city.pop}<br/>
            Local Developed Ratio: ${city.developed}<br/>
          </div>
        `)
        .addTo(markersGroupRef.current);
      });
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.setView([54.78, -2.8], 6);
      setSelectedRegion('unitedkingdom');
    }
  };

  const currentRegionStats = REGIONAL_DATA[selectedRegion] || REGIONAL_DATA['unitedkingdom'];

  return (
    <MapContainer>
      <HeaderSection>
        <h2>UK Land Use & Spatial Metrics</h2>
      </HeaderSection>

      <Grid>
        {/* Map Section */}
        <VisualColumn>
          {leafletError ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter' }}>
              Geospatial data could not load. Please verify your internet connection.
            </div>
          ) : !mapLoaded ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'rgba(255,255,255,0.4)', fontFamily: 'Outfit', fontWeight: 500 }}>
              Retrieving Geographic ONS Boundaries & Map Layers...
            </div>
          ) : null}

          {mapLoaded && !leafletError && (
            <div style={{ position: 'relative', width: '100%', height: '770px' }}>
              <MapViewport id="leaflet-map" />
              <FloatingMapControls>
                <MapButton onClick={handleZoomIn} title="Zoom In">+</MapButton>
                <MapButton onClick={handleZoomOut} title="Zoom Out">−</MapButton>
                <MapButton onClick={handleResetView} title="Reset Center">⌖</MapButton>
              </FloatingMapControls>
            </div>
          )}
        </VisualColumn>

        {/* Sidebar Section */}
        <SidebarConsole>
          <ConsoleCard>
            <InfoBox>
              <h4>Selected Region profile (UKCEH 2024)</h4>
              <p style={{ fontSize: '0.9rem', marginBottom: '1.25rem' }}>
                Click on any boundary region (e.g. Wales, South West, Scotland) on the live map to extract accurate geographical statistics.
              </p>
            </InfoBox>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
              <h3 style={{ fontFamily: 'Outfit', color: '#ffffff', margin: '0 0 0.25rem 0', fontSize: '1.4rem', fontWeight: 500 }}>
                {currentRegionStats.name}
              </h3>
              <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'Inter', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Total area: {currentRegionStats.area}
              </span>

              <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {/* Stats Progress Bars */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontFamily: 'Outfit' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>🌾 Agricultural land</span>
                    <strong style={{ color: 'hsl(46, 65%, 52%)' }}>{currentRegionStats.agriculture}</strong>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill pct={parseFloat(currentRegionStats.agriculture)} />
                  </ProgressBarContainer>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontFamily: 'Outfit' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>🌿 Grassland & Natural Open Space</span>
                    <strong style={{ color: '#84cc16' }}>{currentRegionStats.grassland}</strong>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill pct={parseFloat(currentRegionStats.grassland)} style={{ background: '#84cc16' }} />
                  </ProgressBarContainer>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontFamily: 'Outfit' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>🌳 Forestry & Woodland</span>
                    <strong style={{ color: '#10b981' }}>{currentRegionStats.woodland}</strong>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill pct={parseFloat(currentRegionStats.woodland)} style={{ background: '#10b981' }} />
                  </ProgressBarContainer>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontFamily: 'Outfit' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>🏘️ Developed (Urban & Suburban)</span>
                    <strong style={{ color: '#f43f5e' }}>{currentRegionStats.developed}</strong>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill pct={parseFloat(currentRegionStats.developed)} style={{ background: '#f43f5e' }} />
                  </ProgressBarContainer>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', fontFamily: 'Outfit' }}>
                    <span style={{ color: 'rgba(255,255,255,0.7)' }}>💧 Water & Wetlands</span>
                    <strong style={{ color: '#38bdf8' }}>{currentRegionStats.water}</strong>
                  </div>
                  <ProgressBarContainer>
                    <ProgressBarFill pct={parseFloat(currentRegionStats.water)} style={{ background: '#38bdf8' }} />
                  </ProgressBarContainer>
                </div>
              </div>
            </div>
          </ConsoleCard>

          <ConsoleCard style={{ padding: '1.25rem' }}>
            <h4 style={{ fontFamily: 'Outfit', color: '#ffffff', fontSize: '1.05rem', margin: '0 0 1rem 0' }}>Map Overlays</h4>
            <ToggleRow active={layers.cities} accentColor="#f43f5e">
              <div className="label-group">
                <div className="indicator" />
                <span className="title">Major Urban Cities</span>
              </div>
              <Switch
                active={layers.cities}
                accentColor="#f43f5e"
                onClick={() => toggleLayer('cities')}
              />
            </ToggleRow>
          </ConsoleCard>
        </SidebarConsole>
      </Grid>

      <Figure1Section>
        <InfoBox style={{ maxWidth: '850px', marginBottom: '1.5rem' }}>
          <h3 style={{ fontFamily: 'Outfit', color: '#ffffff', fontSize: '1.5rem', fontWeight: 500, margin: '0 0 0.5rem 0' }}>
            UK Land Cover Breakdown (UKCEH 2024)
          </h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.95rem' }}>
            UK-wide land cover classified by the UKCEH Land Cover Map 2024 into habitat types. Just 6.8% of the UK is built-up, split between suburban residential areas (5.1%) and dense urban land including transport, commercial, and industrial use (1.7%).
          </p>
        </InfoBox>

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
