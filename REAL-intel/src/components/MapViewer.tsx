import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl, { Map, Popup } from 'maplibre-gl';
import { Property, BasemapStyle, FilterState, LodTier, ClusterPoint } from '../types';

interface MapViewerProps {
  basemap: BasemapStyle;
  mapboxToken?: string;
  showBoundaries: boolean;
  filter: FilterState;
  selectedProperty: Property | null;
  onSelectProperty: (property: Property | null) => void;
  onZoomChange: (zoom: number) => void;
  flyToTarget: { lat: number; lon: number } | null;
}

const HMLR_WMS_URL = '/api/hmlr-wms?BBOX={bbox-epsg-3857}';

export function getBasemapStyle(style: BasemapStyle, mapboxToken?: string): any {
  if (mapboxToken && mapboxToken.trim()) {
    const token = mapboxToken.trim();
    switch (style) {
      case 'dark':
        return `https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=${token}`;
      case 'streets':
        return `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${token}`;
      case 'light':
        return `https://api.mapbox.com/styles/v1/mapbox/light-v11?access_token=${token}`;
      case 'satellite':
        return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12?access_token=${token}`;
    }
  }

  // Open-source vector and raster basemaps (Zero API keys, zero watermarks)
  switch (style) {
    case 'dark':
      return 'https://tiles.openfreemap.org/styles/dark';
    case 'streets':
      return 'https://tiles.openfreemap.org/styles/liberty';
    case 'light':
      return 'https://tiles.openfreemap.org/styles/positron';
    case 'satellite':
      return {
        version: 8,
        glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
        sources: {
          'esri-satellite': {
            type: 'raster',
            tiles: [
              'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
            ],
            tileSize: 256,
            attribution: 'Esri, Maxar, Earthstar Geographics'
          }
        },
        layers: [
          {
            id: 'esri-satellite-layer',
            type: 'raster',
            source: 'esri-satellite',
            minzoom: 0,
            maxzoom: 20
          }
        ]
      };
  }
}

export function extractBuildingKey(address?: string, postcode?: string): string {
  if (!address) return (postcode || 'unknown').trim().toLowerCase();
  const clean = address.replace(/\s+/g, ' ').trim();
  const noPostcode = clean.replace(/\([A-Z0-9\s]+\)$/i, '').trim();

  // 1. House/building number before a street suffix
  const streetMatch = noPostcode.match(/(?:(?:flat|unit|suite|room|apartment|floor|part\s+of)\s+[^,]+,\s*)*(?:[^,]+,\s*)*?(\b\d+[a-z]?(?:\s*[-/&and,]+\s*\d+[a-z]?)?)\s+([A-Za-z\s]+(?:Road|Street|Avenue|Lane|Way|Drive|Close|Gardens|Crescent|Place|Walk|Square|Hill|Terrace|Yard|Court|Grove|Mews|Row|Rise|Parade|Park|Wharf|Boulevard|Gate|Broadway|Quay|Circus|Reach|Meadow|Bank|Corner|End|View|Green|Alley|Highway|Passage|Approach|Rise|Side))\b/i);

  if (streetMatch) {
    const num = streetMatch[1].toLowerCase().replace(/\s+/g, '');
    const st = streetMatch[2].toLowerCase().trim();
    return `${(postcode || '').trim().toLowerCase()}__${num}__${st}`;
  }

  // 2. Named building / house / court before street
  const nameMatch = noPostcode.match(/([A-Za-z0-9\s]+(?:House|Court|Building|Tower|Mansion|Manor|Hall|Lodge|Mill|Wharf|Barn|Grange|Chambers|Centre|Center|Suites|Works|Studio|Villa|Cottage))\b/i);
  if (nameMatch) {
    return `${(postcode || '').trim().toLowerCase()}__${nameMatch[1].toLowerCase().trim()}`;
  }

  // 3. Fallback: last 2 comma segments or prefix
  const parts = noPostcode.split(',').map(s => s.trim()).filter(Boolean);
  if (parts.length >= 2) {
    return `${(postcode || '').trim().toLowerCase()}__${parts[parts.length - 2].toLowerCase()}__${parts[parts.length - 1].toLowerCase()}`;
  }

  return `${(postcode || '').trim().toLowerCase()}__${noPostcode.toLowerCase().slice(0, 35)}`;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  basemap,
  mapboxToken,
  showBoundaries,
  filter,
  selectedProperty: _selectedProperty,
  onSelectProperty,
  onZoomChange,
  flyToTarget
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const activeBasemapRef = useRef<BasemapStyle>(basemap);
  const activeTokenRef = useRef<string | undefined>(mapboxToken);
  const propertiesDataRef = useRef<Property[]>([]);
  const clustersDataRef = useRef<ClusterPoint[]>([]);
  const currentTierRef = useRef<LodTier>('micro');
  const fetchTimeoutRef = useRef<any>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const showBoundariesRef = useRef(showBoundaries);
  showBoundariesRef.current = showBoundaries;

  // Setup data layers and boundaries on the current map style
  const setupLayers = useCallback((map: Map) => {
    if (!map.isStyleLoaded()) return;

    // HMLR WMS Cadastral Parcels Layer
    if (!map.getSource('hmlr-cadastre')) {
      map.addSource('hmlr-cadastre', {
        type: 'raster',
        tiles: [HMLR_WMS_URL],
        tileSize: 256,
        attribution: 'Contains HM Land Registry data &copy; Crown copyright'
      });
    }

    if (!map.getLayer('hmlr-layer')) {
      map.addLayer({
        id: 'hmlr-layer',
        type: 'raster',
        source: 'hmlr-cadastre',
        minzoom: 14,
        maxzoom: 22,
        paint: {
          'raster-opacity': 0.88
        },
        layout: {
          visibility: showBoundariesRef.current ? 'visible' : 'none'
        }
      });
    }

    // Properties GeoJSON source (unclustered - clustering is managed by tiered backend LOD)
    if (!map.getSource('properties-source')) {
      map.addSource('properties-source', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
    }

    // Tier 1 & Tier 2: Density Bubbles (Macro Outcodes & Meso Sectors)
    if (!map.getLayer('density-clusters')) {
      map.addLayer({
        id: 'density-clusters',
        type: 'circle',
        source: 'properties-source',
        filter: ['==', ['get', 'is_cluster'], true],
        paint: {
          'circle-color': [
            'case',
            ['>', ['get', 'ocod_count'], 250],
            '#f59e0b', // Radiant Gold if high overseas concentration
            '#0284c7'  // Sky Blue for corporate
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['get', 'count'],
            10, 15,
            500, 22,
            2000, 30,
            8000, 42
          ],
          'circle-stroke-width': 2.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.88
        }
      });
    }

    // Density Bubble Count & Code Labels
    if (!map.getLayer('density-labels')) {
      map.addLayer({
        id: 'density-labels',
        type: 'symbol',
        source: 'properties-source',
        filter: ['==', ['get', 'is_cluster'], true],
        layout: {
          'text-field': ['concat', ['get', 'code'], '\n', ['to-string', ['get', 'count']]],
          'text-font': mapboxToken ? ['DIN Pro Medium', 'Arial Unicode MS Regular'] : ['Noto Sans Regular'],
          'text-size': 11,
          'text-allow-overlap': false
        },
        paint: {
          'text-color': '#ffffff',
          'text-halo-color': 'rgba(15, 23, 42, 0.95)',
          'text-halo-width': 1.8
        }
      });
    }

    // Tier 3: Unclustered Individual Property Markers (Micro Street / Parcel LOD)
    if (!map.getLayer('unclustered-point')) {
      map.addLayer({
        id: 'unclustered-point',
        type: 'circle',
        source: 'properties-source',
        filter: ['!=', ['get', 'is_cluster'], true],
        paint: {
          'circle-color': [
            'case',
            ['==', ['get', 'dataset_type'], 'OCOD'],
            '#f59e0b', // Radiant Gold for Overseas
            '#06b6d4'  // Vivid Cyan for Corporate
          ],
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15, ['case', ['>', ['get', 'count'], 1], 8, 5],
            17, ['case', ['>', ['get', 'count'], 1], 11, 7.5],
            19, ['case', ['>', ['get', 'count'], 1], 15, 11]
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });
    }

    // Counter label for buildings with multiple commercial titles
    if (!map.getLayer('unclustered-point-label')) {
      map.addLayer({
        id: 'unclustered-point-label',
        type: 'symbol',
        source: 'properties-source',
        filter: ['all', ['!=', ['get', 'is_cluster'], true], ['>', ['get', 'count'], 1]],
        layout: {
          'text-field': ['to-string', ['get', 'count']],
          'text-font': mapboxToken ? ['DIN Pro Medium', 'Arial Unicode MS Regular'] : ['Noto Sans Regular'],
          'text-size': 10,
          'text-allow-overlap': true
        },
        paint: {
          'text-color': '#ffffff'
        }
      });
    }

    // OpenStreetMap physical building / house numbers layer (vector tiles)
    if (!map.getLayer('osm-housenumber-labels') && map.getSource('openmaptiles')) {
      try {
        map.addLayer({
          id: 'osm-housenumber-labels',
          type: 'symbol',
          source: 'openmaptiles',
          'source-layer': 'housenumber',
          minzoom: 16,
          layout: {
            'text-field': '{housenumber}',
            'text-font': mapboxToken ? ['DIN Pro Regular', 'Arial Unicode MS Regular'] : ['Noto Sans Regular'],
            'text-size': 9,
            'text-allow-overlap': false
          },
          paint: {
            'text-color': basemap === 'dark' ? 'rgba(148, 163, 184, 0.65)' : 'rgba(71, 85, 105, 0.75)',
            'text-halo-color': basemap === 'dark' ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.9)',
            'text-halo-width': 1
          }
        }, 'unclustered-point'); // Place below our property pins
      } catch (err) {
        console.warn('Could not add osm-housenumber-labels layer:', err);
      }
    }
  }, [mapboxToken, basemap]);

  // Viewport property fetcher with Tiered Level of Detail (LOD)
  const fetchViewportProperties = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;

    if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);

    fetchTimeoutRef.current = setTimeout(async () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const bounds = map.getBounds();
      const zoom = map.getZoom();
      const minLon = Math.max(-180, Math.min(180, bounds.getWest()));
      const maxLon = Math.max(-180, Math.min(180, bounds.getEast()));
      const minLat = Math.max(-85, Math.min(85, bounds.getSouth()));
      const maxLat = Math.max(-85, Math.min(85, bounds.getNorth()));

      const params = new URLSearchParams({
        minLat: minLat.toString(),
        minLon: minLon.toString(),
        maxLat: maxLat.toString(),
        maxLon: maxLon.toString(),
        zoom: Math.round(zoom).toString(),
        type: filter.type,
        tenure: filter.tenure,
        limit: '1500'
      });

      try {
        const res = await fetch(`/api/properties?${params.toString()}`, {
          signal: controller.signal
        });
        if (!res.ok) return;
        const result = await res.json();
        const tier: LodTier = result.tier || 'micro';
        currentTierRef.current = tier;
        const rawData: any[] = result.data || [];

        let features: GeoJSON.Feature[] = [];

        if (tier === 'micro') {
          propertiesDataRef.current = rawData as Property[];
          clustersDataRef.current = [];

          // 1. Group titles by exact building identity (postcode + house/building number)
          const buildingMap = new globalThis.Map<string, Property[]>();
          for (const p of rawData as Property[]) {
            const bKey = extractBuildingKey(p.property_address, p.postcode);
            let list = buildingMap.get(bKey);
            if (!list) {
              list = [];
              buildingMap.set(bKey, list);
            }
            list.push(p);
          }

          // 2. Identify distinct buildings sharing the exact same postcode coordinate
          const coordGroups = new globalThis.Map<string, Property[][]>();
          for (const propsAtBuilding of buildingMap.values()) {
            const p = propsAtBuilding[0];
            const coordKey = `${Number(p.longitude).toFixed(6)},${Number(p.latitude).toFixed(6)}`;
            let group = coordGroups.get(coordKey);
            if (!group) {
              group = [];
              coordGroups.set(coordKey, group);
            }
            group.push(propsAtBuilding);
          }

          // 3. For distinct buildings sharing the same postcode centroid, apply a small micro-offset
          // so that each building renders as its own individual pin on the street!
          features = [];
          for (const buildingsAtCoord of coordGroups.values()) {
            const numBuildings = buildingsAtCoord.length;
            buildingsAtCoord.forEach((propsAtBuilding, idx) => {
              const p = propsAtBuilding[0];
              const count = propsAtBuilding.length;
              const hasOcod = propsAtBuilding.some((item: Property) => item.dataset_type === 'OCOD');
              const bKey = extractBuildingKey(p.property_address, p.postcode);

              let lon = Number(p.longitude);
              let lat = Number(p.latitude);

              if (numBuildings > 1) {
                // Micro-disperse distinct buildings around the street point (radius ~15-20 meters)
                const radius = 0.00018; // approx 15-20 meters
                const angle = (idx / numBuildings) * 2 * Math.PI;
                lon = lon + (radius * Math.cos(angle)) / Math.cos((lat * Math.PI) / 180);
                lat = lat + radius * Math.sin(angle);
              }

              features.push({
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [lon, lat]
                },
                properties: {
                  is_cluster: false,
                  id: p.id,
                  building_key: bKey,
                  title_number: p.title_number,
                  tenure: p.tenure,
                  proprietor_name: count > 1 ? `${count} Titles: ${p.proprietor_name}` : p.proprietor_name,
                  primary_proprietor: p.proprietor_name,
                  property_address: p.property_address,
                  postcode: p.postcode,
                  dataset_type: hasOcod ? 'OCOD' : 'CCOD',
                  price_paid: p.price_paid,
                  country_incorporated: p.country_incorporated || '',
                  count: count
                }
              });
            });
          }
        } else {
          propertiesDataRef.current = [];
          clustersDataRef.current = rawData as ClusterPoint[];
          features = (rawData as ClusterPoint[]).map((c) => ({
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [Number(c.longitude), Number(c.latitude)]
            },
            properties: {
              is_cluster: true,
              tier: tier,
              code: c.code,
              count: c.count,
              total_count: c.total_count,
              ccod_count: c.ccod_count,
              ocod_count: c.ocod_count,
              avg_price: c.avg_price
            }
          }));
        }

        const geojson: GeoJSON.FeatureCollection = {
          type: 'FeatureCollection',
          features
        };

        const source = map.getSource('properties-source') as maplibregl.GeoJSONSource;
        if (source && source.setData) {
          source.setData(geojson as any);
        } else {
          setupLayers(map);
        }
      } catch (err: any) {
        if (err.name === 'AbortError') return;
        console.error('Viewport fetch error:', err);
      }
    }, 150);
  }, [filter, setupLayers]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initialStyle = getBasemapStyle(basemap, mapboxToken);

    const map = new Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [-0.1278, 51.5074], // London
      zoom: 11,
      minZoom: 4,
      maxZoom: 20
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.on('load', () => {
      setupLayers(map);
      fetchViewportProperties();
    });

    map.on('moveend', () => {
      fetchViewportProperties();
      onZoomChange(map.getZoom());
    });

    map.on('zoomend', () => {
      onZoomChange(map.getZoom());
    });

    // Click density cluster bubble to zoom into the area
    const handleClusterClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const geom = feat.geometry as any;
      const tier = feat.properties?.tier;
      const targetZoom = tier === 'macro' ? 12 : 15.5;
      map.easeTo({
        center: geom.coordinates,
        zoom: targetZoom,
        duration: 800
      });
    };

    map.on('click', 'density-clusters', handleClusterClick);
    map.on('click', 'density-labels', handleClusterClick);

    // Hover tooltip for cluster bubbles
    const handleClusterHover = (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const geom = feat.geometry as any;
      const p = feat.properties;
      const count = Number(p.count || p.total_count || 0);
      const ocod = Number(p.ocod_count || 0);
      const avgPrice = p.avg_price ? Number(p.avg_price) : null;

      const content = `
        <div style="font-family: 'Inter', -apple-system, sans-serif; font-size: 11px; line-height: 1.4; color: #ffffff;">
          <div style="font-weight: 700; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 14px; letter-spacing: -0.01em;">
            ${p.code}
          </div>
          <div style="color: rgba(255,255,255,0.7); margin-top: 2px;">
            ${count.toLocaleString()} commercial properties
          </div>
          ${ocod > 0 ? `<div style="color: #f59e0b; font-weight: 600; margin-top: 2px;">${ocod.toLocaleString()} overseas owned (${((ocod / count) * 100).toFixed(1)}%)</div>` : ''}
          ${avgPrice ? `<div style="color: #10b981; font-weight: 500; margin-top: 2px;">Avg: £${Math.round(avgPrice).toLocaleString()}</div>` : ''}
          <div style="font-size: 10px; color: rgba(255,255,255,0.4); margin-top: 4px;">Click to explore area</div>
        </div>
      `;

      popupRef.current?.setLngLat(geom.coordinates).setHTML(content).addTo(map);
    };

    const handleClusterLeave = () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
    };

    map.on('mouseenter', 'density-clusters', handleClusterHover);
    map.on('mouseleave', 'density-clusters', handleClusterLeave);
    map.on('mouseenter', 'density-labels', handleClusterHover);
    map.on('mouseleave', 'density-labels', handleClusterLeave);

    // Click unclustered point to inspect property (or multiple titles at same address)
    const handleMicroClick = (e: any) => {
      if (!e.features || e.features.length === 0) return;
      const feat = e.features[0];
      const propId = feat.properties?.id;
      const buildingKey = feat.properties?.building_key;
      const found = propertiesDataRef.current.find((p) => p.id === propId);
      if (found) {
        // Collect all commercial titles registered for this exact physical building
        const targetKey = buildingKey || extractBuildingKey(found.property_address, found.postcode);
        const related = propertiesDataRef.current.filter((p) =>
          extractBuildingKey(p.property_address, p.postcode) === targetKey
        );
        onSelectProperty({
          ...found,
          relatedProperties: related.length > 1 ? related : undefined
        });
      }
    };

    map.on('click', 'unclustered-point', handleMicroClick);
    map.on('click', 'unclustered-point-label', handleMicroClick);

    // Hover tooltip for individual properties
    popupRef.current = new Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 12
    });

    const handleMicroHover = (e: any) => {
      map.getCanvas().style.cursor = 'pointer';
      if (!e.features || e.features.length === 0) return;
      const f = e.features[0];
      const geom = f.geometry as any;
      const props = f.properties;
      const count = Number(props?.count || 1);

      const content = `
        <div style="font-family: 'Inter', sans-serif; font-size: 11px; line-height: 1.4; color: #ffffff;">
          <div style="font-weight: 600; color: #ffffff; font-family: 'Outfit', sans-serif; font-size: 13px;">
            ${count > 1 ? `${count} Titles at this Address` : (props?.proprietor_name || '')}
          </div>
          <div style="color: rgba(255,255,255,0.7);">${props?.property_address || ''}</div>
          <div style="color: ${props?.dataset_type === 'OCOD' ? '#f59e0b' : '#06b6d4'}; font-weight: 600; margin-top: 3px;">
            ${count > 1 ? `Click to inspect all ${count} titles` : `${props?.title_number} · ${props?.tenure}`}
          </div>
        </div>
      `;

      popupRef.current?.setLngLat(geom.coordinates).setHTML(content).addTo(map);
    };

    const handleMicroLeave = () => {
      map.getCanvas().style.cursor = '';
      popupRef.current?.remove();
    };

    map.on('mouseenter', 'unclustered-point', handleMicroHover);
    map.on('mouseleave', 'unclustered-point', handleMicroLeave);
    map.on('mouseenter', 'unclustered-point-label', handleMicroHover);
    map.on('mouseleave', 'unclustered-point-label', handleMicroLeave);

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Basemap Style (strictly when user actively selects a new basemap or updates token)
  useEffect(() => {
    if (activeBasemapRef.current === basemap && activeTokenRef.current === mapboxToken) {
      return;
    }

    activeBasemapRef.current = basemap;
    activeTokenRef.current = mapboxToken;

    const map = mapRef.current;
    if (!map) return;

    const nextStyle = getBasemapStyle(basemap, mapboxToken);
    map.setStyle(nextStyle);

    const handleStyleLoad = () => {
      setupLayers(map);
      fetchViewportProperties();
    };

    map.once('style.load', handleStyleLoad);
  }, [basemap, mapboxToken, setupLayers, fetchViewportProperties]);

  // Toggle Boundaries Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const applyVisibility = () => {
      try {
        if (map.getLayer('hmlr-layer')) {
          map.setLayoutProperty('hmlr-layer', 'visibility', showBoundaries ? 'visible' : 'none');
        }
      } catch (err) {
        console.warn('Could not set hmlr-layer visibility:', err);
      }
    };

    if (map.getLayer('hmlr-layer')) {
      applyVisibility();
    } else {
      map.once('idle', applyVisibility);
    }
  }, [showBoundaries]);

  // Re-fetch on filter change
  useEffect(() => {
    fetchViewportProperties();
  }, [filter, fetchViewportProperties]);

  // Fly to target
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !flyToTarget) return;

    map.flyTo({
      center: [flyToTarget.lon, flyToTarget.lat],
      zoom: 17,
      essential: true
    });
  }, [flyToTarget]);

  return <div ref={mapContainerRef} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />;
};
