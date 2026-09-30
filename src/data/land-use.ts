// UK land use figures. Source: UKCEH Land Cover Map UK averages (DAERA/UKCEH LCM2015) and
// ONS Standard Area Measurements. If the band shares change, update THRESHOLDS in
// scripts/build-uk-silhouette.mjs and re-run `npm run data:uk-silhouette`.

export type LandUseBand = { name: string; emoji: string; pct: number; color: string };

// Order matters: bands are drawn top to bottom in this order on the UK silhouette.
export const LAND_USE_BANDS: LandUseBand[] = [
  { name: 'Agricultural Land', emoji: '🌾', pct: 49.0, color: 'var(--gold)' },
  { name: 'Grassland & Natural Open Space', emoji: '🌿', pct: 28.7, color: 'var(--lime)' },
  { name: 'Forestry & Woodland', emoji: '🌳', pct: 12.0, color: 'var(--forest)' },
  { name: 'Residential (Homes & Gardens)', emoji: '🏠', pct: 5.6, color: 'var(--amber)' },
  { name: 'Urban (Transport & Commercial)', emoji: '🌉', pct: 1.6, color: 'var(--red)' },
  { name: 'Water & Wetlands', emoji: '💧', pct: 3.1, color: 'var(--sky-blue)' },
];

export type LandCoverType = 'Agriculture' | 'Natural' | 'Built-Up';

export type LandCoverRow = { name: string; pct: number; ha: string; type: LandCoverType };

export const LAND_COVER: LandCoverRow[] = [
  { name: 'Arable & Horticulture', pct: 25, ha: '6,068,000 ha', type: 'Agriculture' },
  { name: 'Improved Grassland', pct: 24, ha: '5,825,000 ha', type: 'Agriculture' },
  { name: 'Semi-natural Grassland & Heath', pct: 15, ha: '3,641,000 ha', type: 'Natural' },
  { name: 'Broadleaved & Mixed Woodland', pct: 7, ha: '1,699,000 ha', type: 'Natural' },
  { name: 'Coniferous Woodland', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Residential (Homes & Gardens)', pct: 5.6, ha: '1,359,000 ha', type: 'Built-Up' },
  { name: 'Bog, Marsh & Fen', pct: 5.0, ha: '1,214,000 ha', type: 'Natural' },
  { name: 'Freshwater & Coastal', pct: 3.1, ha: '752,000 ha', type: 'Natural' },
  { name: 'Urban (Transport, Commercial & Industrial)', pct: 1.6, ha: '388,000 ha', type: 'Built-Up' },
  { name: 'Other (Bare Ground, Scrub, etc.)', pct: 8.7, ha: '2,111,000 ha', type: 'Natural' },
];
