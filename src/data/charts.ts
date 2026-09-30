// Every dataset shown in a chart, with its sources. Pages import from here, so a
// corrected figure only ever needs changing in one place.

export type Bar = {
  label: string;
  value: number;
  /** Text shown beside the bar; defaults to the raw value. */
  display?: string;
  highlight?: boolean;
};

// Dwellings per 1,000 inhabitants. United Kingdom (446) is a combined figure across all four
// nations: dwelling stock from MHCLG (England, 31 Mar 2023), National Records of Scotland
// (2023), Welsh Government (31 Mar 2023) and NISRA (Apr 2023), divided by ONS mid-2023 UK
// population. OECD average (487) is from HBF Housing Horizons (Oct 2023, 2020 data). All other
// countries are from the OECD Affordable Housing Database, Table HM1.1.A1 (latest available
// year: 2022, except Japan which is 2018). Sorted ascending by value.
export const DWELLINGS_PER_1000: Bar[] = [
  { label: 'United States', value: 428 },
  { label: 'United Kingdom', value: 446, highlight: true },
  { label: 'Netherlands', value: 454 },
  { label: 'OECD Average', value: 487 },
  { label: 'Japan', value: 493 },
  { label: 'Germany', value: 518 },
  { label: 'Spain', value: 563 },
  { label: 'France', value: 591 },
  { label: 'Italy', value: 598 },
];

// The same figures per 100 citizens, used on The REAL Numbers page and scaled against 100
// (the metric's true denominator) rather than the data's own maximum, so the visual gap
// between countries isn't exaggerated.
export const DWELLINGS_PER_100: Bar[] = DWELLINGS_PER_1000.map(d => ({
  ...d,
  value: d.value / 10,
  display: (d.value / 10).toFixed(1),
}));

// English Housing Survey 2022-23: share of homes failing the Decent Homes Standard, by tenure.
export const NON_DECENT_BY_TENURE: Bar[] = [
  { label: 'Private Rented', value: 21, display: '21%', highlight: true },
  { label: 'Local Authority', value: 15, display: '15%' },
  { label: 'All Tenures', value: 14, display: '14%' },
  { label: 'Owner Occupied', value: 13, display: '13%' },
  { label: 'Housing Assoc.', value: 9, display: '9%' },
];

// UK house price (HM Land Registry / ONS UK HPI, January of each year) vs UK median full-time
// weekly earnings (ONS ASHE, annualised as weekly x 52). Both series are UK-wide so they are
// properly comparable.
const AFFORDABILITY_RAW = [
  { year: 1997, wageWeekly: 320.5, housePrice: 55914 },
  { year: 2000, wageWeekly: 359.0, housePrice: 77950 },
  { year: 2005, wageWeekly: 431.2, housePrice: 138759 },
  { year: 2010, wageWeekly: 498.5, housePrice: 154268 },
  { year: 2015, wageWeekly: 527.1, housePrice: 175636 },
  { year: 2020, wageWeekly: 585.7, housePrice: 213657 },
  { year: 2025, wageWeekly: 766.6, housePrice: 264936 },
];

export const AFFORDABILITY = AFFORDABILITY_RAW.map(d => {
  const wageAnnual = Math.round(d.wageWeekly * 52);
  const base = AFFORDABILITY_RAW[0];
  return {
    year: d.year,
    wageAnnual,
    housePrice: d.housePrice,
    wageIndex: (wageAnnual / Math.round(base.wageWeekly * 52)) * 100,
    priceIndex: (d.housePrice / base.housePrice) * 100,
    ratio: d.housePrice / wageAnnual,
  };
});

// England, Wales, Scotland and Northern Ireland, all matched to ~2023 vintage. Dwelling stock:
// MHCLG, National Records of Scotland, Welsh Government/StatsWales, NISRA. House prices:
// HM Land Registry UK HPI (Jan 2023). Earnings: ONS ASHE Table 7.1a (England/Wales/Scotland)
// and NISRA ASHE (Northern Ireland).
const NATIONS = [
  { nation: 'Northern Ireland', dwellingsPer100: 43.2, price: 162479, wageAnnual: 33228 },
  { nation: 'England', dwellingsPer100: 44.0, price: 285817, wageAnnual: 35875 },
  { nation: 'Wales', dwellingsPer100: 46.7, price: 201853, wageAnnual: 33088 },
  { nation: 'Scotland', dwellingsPer100: 49.5, price: 175092, wageAnnual: 36878 },
];

export const NATIONS_DWELLINGS: Bar[] = NATIONS.map(n => ({
  label: n.nation,
  value: n.dwellingsPer100,
  display: n.dwellingsPer100.toFixed(1),
  highlight: n.nation === 'Northern Ireland',
}));

export const NATIONS_PRICE: Bar[] = NATIONS.map(n => ({
  label: n.nation,
  value: n.price,
  display: `£${n.price.toLocaleString('en-GB')}`,
  highlight: n.nation === 'England',
}));

export const NATIONS_RATIO: Bar[] = NATIONS.map(n => {
  const ratio = n.price / n.wageAnnual;
  return { label: n.nation, value: ratio, display: `${ratio.toFixed(2)}x`, highlight: n.nation === 'England' };
});

// HM Land Registry / ONS UK HPI, reference month November 2025. The two "excluding London"
// rows are our own calculation: London's sales volume and total sale value subtracted from
// the England/UK totals in the same dataset, then divided through.
export const LONDON_PREMIUM: Bar[] = [
  { label: 'UK excl. London', value: 250113 },
  { label: 'England excl. London', value: 266965 },
  { label: 'United Kingdom', value: 272248 },
  { label: 'England', value: 294466 },
  { label: 'London', value: 556044, highlight: true },
].map(d => ({ ...d, display: `£${d.value.toLocaleString('en-GB')}` }));

// University of York, Centre for Housing Policy, "Overseas Investors in London's New Build
// Housing Market" (June 2017), commissioned by the GLA. Overseas sales as a share of all
// sales within each area, Land Registry data, April 2014 - March 2016.
export const LONDON_OVERSEAS: Bar[] = [
  { label: 'Outer London', value: 5.7 },
  { label: 'Kensington & Chelsea', value: 32.2 },
  { label: 'Westminster', value: 37.9 },
  { label: 'City of London', value: 40.8, highlight: true },
].map(d => ({ ...d, display: `${d.value}%` }));
