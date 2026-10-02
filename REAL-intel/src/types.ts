export interface Property {
  id: number;
  title_number: string;
  tenure: string;
  property_address: string;
  district: string;
  county: string;
  region: string;
  postcode: string;
  price_paid: number | null;
  proprietor_name: string;
  company_reg_no: string;
  proprietorship_category?: string;
  country_incorporated?: string;
  proprietor_address?: string;
  date_added?: string;
  dataset_type: 'CCOD' | 'OCOD';
  latitude: number;
  longitude: number;
  precision_level?: 'EXACT_OSM' | 'EXACT_UPRN' | 'STREET_UPRN' | 'POSTCODE_UPRN' | 'ESTIMATED';
  relatedProperties?: Property[];
}

export type BasemapStyle = 'dark' | 'streets' | 'light' | 'satellite';

export interface FilterState {
  type: 'ALL' | 'OCOD' | 'CCOD';
  tenure: 'ALL' | 'Freehold' | 'Leasehold';
}

export interface StatsData {
  totalProperties: number;
  ocodCount: number;
  ccodCount: number;
  geocodedCount: number;
  topOverseasCountries: { country_incorporated: string; count: number }[];
}

export type LodTier = 'macro' | 'meso' | 'micro';

export interface ClusterPoint {
  code: string;
  outcode?: string;
  count: number;
  total_count: number;
  ccod_count: number;
  ocod_count: number;
  avg_price: number | null;
  latitude: number;
  longitude: number;
}

export interface ProprietorSummary {
  proprietor_name: string;
  dataset_type: 'CCOD' | 'OCOD';
  country_incorporated?: string;
  company_reg_no?: string;
  property_count: number;
  total_price_paid: number;
}

export interface ProprietorPortfolioData {
  proprietor: ProprietorSummary;
  assets: Property[];
}

