import React, { useState } from 'react';
import styled from 'styled-components';

const NumbersContainer = styled.div`
  max-width: 1400px;
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
  margin-bottom: 3rem;

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

const ChartWrapper = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  margin-bottom: 3rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
  text-align: left;
`;

const ChartTitle = styled.h3`
  font-family: 'Outfit', sans-serif;
  font-size: 1.4rem;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  font-weight: 500;
`;

const ChartDesc = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  margin: 0 0 2rem 0;

  a {
    color: hsl(46, 65%, 52%);
    text-decoration: none;
    font-weight: 500;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const SVGContainer = styled.svg`
  width: 100%;
  height: auto;
  overflow: visible;
`;

const CitationsContainer = styled.section`
  text-align: left;
  margin-top: 5rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    color: #ffffff;
    margin-bottom: 1.5rem;
    font-weight: 500;
  }
`;

const CitationTable = styled.div`
  display: grid;
  grid-template-columns: 80px 1fr 180px;
  gap: 1rem 2rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);

  @media (max-width: 580px) {
    grid-template-columns: 50px 1fr;
    
    .source {
      grid-column: 2;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.4);
      margin-top: -0.5rem;
      margin-bottom: 0.5rem;
    }
  }

  .index {
    color: hsl(46, 65%, 52%);
    font-family: 'Outfit', sans-serif;
    font-weight: 600;
  }

  .text a {
    color: #ffffff;
    text-decoration: none;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.4);

    &:hover {
      border-bottom-style: solid;
      color: hsl(46, 65%, 52%);
    }
  }

  .source {
    font-style: italic;
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ExampleGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const EraCard = styled.div<{ active?: boolean }>`
  background: ${props => props.active ? 'rgba(212, 175, 55, 0.04)' : 'rgba(255, 255, 255, 0.02)'};
  border: 1px solid ${props => props.active ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.06)'};
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;

  &:hover {
    border-color: ${props => props.active ? 'rgba(212, 175, 55, 0.4)' : 'rgba(255, 255, 255, 0.12)'};
    transform: translateY(-2px);
  }
`;

const EraHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  padding-bottom: 0.75rem;

  h4 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    color: #ffffff;
    margin: 0;
  }

  span {
    font-family: 'Outfit', sans-serif;
    font-size: 0.8rem;
    font-weight: 600;
    color: hsl(46, 65%, 52%);
    background: rgba(212, 175, 55, 0.1);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-family: 'Inter', sans-serif;
  font-size: 0.95rem;

  .label {
    color: rgba(255, 255, 255, 0.6);
  }

  .value {
    color: #ffffff;
    font-weight: 600;
  }

  &.multiplier-row {
    border-top: 1px dashed rgba(255, 255, 255, 0.08);
    padding-top: 1rem;
    margin-top: 1rem;
    margin-bottom: 0;
    
    .label {
      color: #ffffff;
      font-weight: 500;
    }
    
    .value {
      font-family: 'Outfit', sans-serif;
      font-size: 1.25rem;
      color: hsl(46, 65%, 52%);
    }
  }
`;

export const RealNumbers: React.FC = () => {
  // Both charts render their hover labels natively inside their own SVG, positioned with
  // the exact same coordinate math used to draw the bar/node - see the "hover label"
  // comments below. This avoids an HTML-overlay tooltip ever drifting relative to the
  // element it's meant to describe.
  const [hoveredBar, setHoveredBar] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<{ series: 'wage' | 'price'; year: number } | null>(null);

  // 1. Scarcity Data (dwellings per 100 citizens). United Kingdom is a combined figure:
  // dwelling stock from MHCLG (England, 31 Mar 2023), National Records of Scotland (2023),
  // Welsh Government (31 Mar 2023) and NISRA (Apr 2023), divided by ONS mid-2023 UK
  // population - see the "Four Nations, Four Markets" article for the by-nation breakdown
  // and full citations. OECD average is from HBF Housing Horizons (Oct 2023, 2020 data).
  // All other countries are from the OECD Affordable Housing Database, Table HM1.1.A1
  // (latest available year: 2022, except Japan which is 2018). Sorted ascending by value.
  const scarcityData = [
    { country: 'United States', val: 42.8, highlighted: false },
    { country: 'United Kingdom', val: 44.6, highlighted: true },
    { country: 'Netherlands', val: 45.4, highlighted: false },
    { country: 'OECD Average', val: 48.7, highlighted: false },
    { country: 'Japan', val: 49.3, highlighted: false },
    { country: 'Germany', val: 51.8, highlighted: false },
    { country: 'Spain', val: 56.3, highlighted: false },
    { country: 'France', val: 59.1, highlighted: false },
    { country: 'Italy', val: 59.8, highlighted: false },
  ];

  const sHeight = 310;
  const sBarHeight = 16;
  const sSpacing = 6;
  const sPaddingLeft = 140;
  const sWidth = 500;
  // Scale against the metric's true denominator (100, since this is "per 100 citizens"),
  // not the highest value in the dataset. Scaling to the data's own max stretches the bars
  // to fill the width regardless of what the numbers actually are, which exaggerates the
  // visual gap between countries - e.g. 42.8 vs 59.8 looks dramatic filling the full width,
  // but is a modest ~17-point difference out of 100. This also means the chart no longer
  // needs rescaling every time a value changes, since 100 is fixed by definition.
  const sMaxVal = 100;
  const sScale = (sWidth - sPaddingLeft - 40) / sMaxVal;

  // 2. Affordability data: England average house price (Land Registry/ONS UK HPI, January
  // of each year) vs UK median full-time weekly earnings (ONS ASHE, annualised as weekly x 52).
  // Source: ONS "Earnings time series of median gross weekly earnings from 1968 to 2025"
  // (UK) and Land Registry UK HPI region/united-kingdom/month series (UK). Both series
  // are UK-wide so the two are properly comparable - an earlier version paired UK wages
  // with England-only house prices, which mismatched geographies.
  const affordabilityData = [
    { year: 1997, wageWeekly: 320.5, housePrice: 55914 },
    { year: 2000, wageWeekly: 359.0, housePrice: 77950 },
    { year: 2005, wageWeekly: 431.2, housePrice: 138759 },
    { year: 2010, wageWeekly: 498.5, housePrice: 154268 },
    { year: 2015, wageWeekly: 527.1, housePrice: 175636 },
    { year: 2020, wageWeekly: 585.7, housePrice: 213657 },
    { year: 2025, wageWeekly: 766.6, housePrice: 264936 },
  ].map(d => ({
    ...d,
    wageAnnual: Math.round(d.wageWeekly * 52),
  }));

  const baseWage = affordabilityData[0].wageAnnual;
  const basePrice = affordabilityData[0].housePrice;
  const affordabilityIndexed = affordabilityData.map(d => ({
    ...d,
    wageIndex: (d.wageAnnual / baseWage) * 100,
    priceIndex: (d.housePrice / basePrice) * 100,
    ratio: d.housePrice / d.wageAnnual,
  }));

  const aChartW = 560;
  const aChartH = 260;
  const aPadLeft = 55;
  const aPadRight = 15;
  const aPadTop = 15;
  const aPadBottom = 35;
  const aPlotW = aChartW - aPadLeft - aPadRight;
  const aPlotH = aChartH - aPadTop - aPadBottom;
  const aYMax = 600;
  const aYearMin = affordabilityIndexed[0].year;
  const aYearMax = affordabilityIndexed[affordabilityIndexed.length - 1].year;

  const aX = (year: number) => aPadLeft + ((year - aYearMin) / (aYearMax - aYearMin)) * aPlotW;
  const aY = (indexVal: number) => aPadTop + aPlotH - (indexVal / aYMax) * aPlotH;

  const wagePoints = affordabilityIndexed.map(d => `${aX(d.year)},${aY(d.wageIndex)}`).join(' ');
  const pricePoints = affordabilityIndexed.map(d => `${aX(d.year)},${aY(d.priceIndex)}`).join(' ');

  return (
    <NumbersContainer>
      <HeaderSection>
        <h2>The REAL Numbers</h2>
      </HeaderSection>

      {/* 1. HOUSING STOCK SCARCITY CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>Dwellings per 100 Citizens</ChartTitle>
        <ChartDesc>
Compared to most European counterparts, the UK operates under significant structural undersupply - only the United States has a lower ratio among the nations shown here <sup><a href="#cit-1">[1]</a></sup><sup><a href="#cit-2">[2]</a></sup>.
        </ChartDesc>
        <SVGContainer viewBox={`0 0 ${sWidth} ${sHeight}`}>
          {scarcityData.map((d, i) => {
            const y = i * (sBarHeight + sSpacing) + 20;
            const barWidth = d.val * sScale;
            const fill = d.highlighted ? 'url(#gold-grad)' : 'rgba(255, 255, 255, 0.12)';
            const border = d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.08)';

            return (
              <g key={d.country}>
                <text
                  x={sPaddingLeft - 15}
                  y={y + sBarHeight / 2 + 4}
                  textAnchor="end"
                  fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.country}
                </text>
                <rect
                  x={sPaddingLeft}
                  y={y}
                  width={sMaxVal * sScale}
                  height={sBarHeight}
                  rx="3"
                  fill="rgba(255, 255, 255, 0.01)"
                  stroke="rgba(255, 255, 255, 0.02)"
                />
                <rect
                  x={sPaddingLeft}
                  y={y}
                  width={barWidth}
                  height={sBarHeight}
                  rx="3"
                  fill={fill}
                  stroke={border}
                  strokeWidth={d.highlighted ? '1.5' : '0.5'}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={() => setHoveredBar(d.country)}
                  onMouseLeave={() => setHoveredBar(null)}
                />
                <text
                  x={sPaddingLeft + barWidth + 8}
                  y={y + sBarHeight / 2 + 4}
                  fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                  style={{ pointerEvents: 'none' }}
                >
                  {d.val}
                </text>
                {/* On hover, show the value natively inside the bar's own filled area -
                    drawn in the same SVG coordinate space as the bar itself, so it can
                    never drift relative to it the way an HTML overlay tooltip could. */}
                {hoveredBar === d.country && (
                  <text
                    x={sPaddingLeft + barWidth / 2}
                    y={y + sBarHeight / 2 + 4}
                    textAnchor="middle"
                    fill={d.highlighted ? '#0a0d14' : '#ffffff'}
                    fontFamily="Inter"
                    fontSize="11"
                    fontWeight="700"
                    style={{ pointerEvents: 'none' }}
                  >
                    {d.val}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(46, 75%, 42%)" />
              <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
            </linearGradient>
          </defs>
        </SVGContainer>
        <div style={{ marginTop: '1.2rem', padding: '0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
            To match the OECD average of <strong style={{ color: '#fff' }}>48.7</strong> dwellings per 100 citizens, the UK (at <strong style={{ color: '#fff' }}>44.6</strong>) would need approximately <span style={{ color: 'hsl(46, 65%, 52%)', fontWeight: 700 }}>2.8 million</span> additional homes <span style={{ opacity: 0.5 }}>((48.7 − 44.6) × 68.27m ÷ 100 = 2,798,873)</span>.
        </div>
      </ChartWrapper>

      {/* 2. AFFORDABILITY PATHWAY CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>House Price Growth vs. Wage Growth (1997 - 2025)</ChartTitle>
        <ChartDesc>
          Indexed to 100 at 1997. UK house prices have grown far faster than UK median earnings at every check-in point since then <sup><a href="#cit-3">[3]</a></sup><sup><a href="#cit-4">[4]</a></sup>.
        </ChartDesc>
        <SVGContainer viewBox={`0 0 ${aChartW} ${aChartH}`}>
          {/* Y Grid lines + axis */}
          {[0, 100, 200, 300, 400, 500, 600].map((v) => (
            <g key={v}>
              <line x1={aPadLeft} y1={aY(v)} x2={aChartW - aPadRight} y2={aY(v)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
              <text x={aPadLeft - 8} y={aY(v) + 3} fill="rgba(255,255,255,0.45)" fontSize="9" fontFamily="Inter" textAnchor="end">{v}%</text>
            </g>
          ))}

          {/* X axis ticks + year labels */}
          {affordabilityIndexed.map(d => (
            <g key={d.year}>
              <line x1={aX(d.year)} y1={aPadTop + aPlotH} x2={aX(d.year)} y2={aPadTop + aPlotH + 4} stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
              <text x={aX(d.year)} y={aPadTop + aPlotH + 16} fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="Inter" textAnchor="middle">{d.year}</text>
            </g>
          ))}

          {/* Axis lines */}
          <line x1={aPadLeft} y1={aPadTop} x2={aPadLeft} y2={aPadTop + aPlotH} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1={aPadLeft} y1={aPadTop + aPlotH} x2={aChartW - aPadRight} y2={aPadTop + aPlotH} stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Wages line */}
          <polyline points={wagePoints} fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2" />
          {affordabilityIndexed.map(d => (
            <circle
              key={`wage-${d.year}`}
              cx={aX(d.year)}
              cy={aY(d.wageIndex)}
              r="3.5"
              fill="#c0c0c0"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode({ series: 'wage', year: d.year })}
              onMouseLeave={() => setHoveredNode(null)}
            />
          ))}
          <text x={aChartW - aPadRight} y={aY(affordabilityIndexed[affordabilityIndexed.length - 1].wageIndex) - 8} fill="rgba(255,255,255,0.6)" fontFamily="Inter" fontSize="10" textAnchor="end">Wages</text>

          {/* House prices line */}
          <polyline points={pricePoints} fill="none" stroke="hsl(46, 65%, 52%)" strokeWidth="3" />
          {affordabilityIndexed.map(d => (
            <circle
              key={`price-${d.year}`}
              cx={aX(d.year)}
              cy={aY(d.priceIndex)}
              r="4.5"
              fill="hsl(46, 65%, 52%)"
              stroke="#ffffff"
              strokeWidth="1"
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHoveredNode({ series: 'price', year: d.year })}
              onMouseLeave={() => setHoveredNode(null)}
            />
          ))}
          <text x={aChartW - aPadRight} y={aY(affordabilityIndexed[affordabilityIndexed.length - 1].priceIndex) - 8} fill="hsl(46, 65%, 52%)" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="end">House Prices</text>

          {/* Hover label - drawn in the same SVG coordinate space as the nodes themselves
              (cx/cy below reuse the exact aX/aY used to place the circles), so it is
              pinned exactly to whichever node is hovered with no HTML/SVG conversion. */}
          {hoveredNode && (() => {
            const d = affordabilityIndexed.find(p => p.year === hoveredNode.year);
            if (!d) return null;
            const isPrice = hoveredNode.series === 'price';
            const cx = aX(d.year);
            const cy = aY(isPrice ? d.priceIndex : d.wageIndex);
            const label = isPrice
              ? `£${d.housePrice.toLocaleString()} (${d.priceIndex.toFixed(0)}%)`
              : `£${d.wageAnnual.toLocaleString()}/yr (${d.wageIndex.toFixed(0)}%)`;
            const labelWidth = label.length * 5.6 + 16;
            const halfW = labelWidth / 2;
            let labelX = cx;
            if (labelX - halfW < aPadLeft) labelX = aPadLeft + halfW;
            if (labelX + halfW > aChartW - aPadRight) labelX = aChartW - aPadRight - halfW;
            const showBelow = cy - aPadTop < 24;
            const textY = showBelow ? cy + 24 : cy - 10;
            const rectY = textY - 14;
            return (
              <g style={{ pointerEvents: 'none' }}>
                <rect
                  x={labelX - halfW}
                  y={rectY}
                  width={labelWidth}
                  height={20}
                  rx="4"
                  fill="rgba(10,13,20,0.95)"
                  stroke={isPrice ? 'hsl(46, 65%, 52%)' : 'rgba(255,255,255,0.4)'}
                  strokeWidth="1"
                />
                <text x={labelX} y={textY} textAnchor="middle" fill="#ffffff" fontFamily="Inter" fontSize="10" fontWeight="600">
                  {label}
                </text>
              </g>
            );
          })()}
        </SVGContainer>
        <div style={{ marginTop: '1.2rem', padding: '0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
          Between 1997 and 2025, UK house prices rose from £55,914 to £264,936 (+374%), while UK median full-time earnings rose from £16,666 to £39,863 (+139%) - the price-to-earnings ratio nearly doubled, from {affordabilityIndexed[0].ratio.toFixed(1)}x to {affordabilityIndexed[affordabilityIndexed.length - 1].ratio.toFixed(1)}x.
        </div>
      </ChartWrapper>

      {/* WORKED EXAMPLE: REAL NUMBERS CASE STUDY */}
      <div style={{ marginBottom: '3rem' }}>
        <ChartTitle>The Worked Example: How the Numbers Affect a Family</ChartTitle>
        <ChartDesc>
          A concrete comparison of UK house prices against UK median full-time earnings in 1997 vs 2025, using the same ONS/Land Registry data as the chart above.
        </ChartDesc>

        <ExampleGrid>
          <EraCard>
            <EraHeader>
              <h4>1997</h4>
            </EraHeader>
            <StatRow>
              <div className="label">UK Median Earnings (Annualised)</div>
              <div className="value">£16,666</div>
            </StatRow>
            <StatRow>
              <div className="label">UK Average Home</div>
              <div className="value">£55,914</div>
            </StatRow>
            <StatRow className="multiplier-row">
              <div className="label">Price-to-Earnings Ratio</div>
              <div className="value">{affordabilityIndexed[0].ratio.toFixed(1)}x</div>
            </StatRow>
          </EraCard>

          <EraCard active={true}>
            <EraHeader>
              <h4>2025</h4>
            </EraHeader>
            <StatRow>
              <div className="label">UK Median Earnings (Annualised)</div>
              <div className="value">£39,863 (+139%)</div>
            </StatRow>
            <StatRow>
              <div className="label">UK Average Home</div>
              <div className="value">£264,936 (+374%)</div>
            </StatRow>
            <StatRow className="multiplier-row">
              <div className="label">Price-to-Earnings Ratio</div>
              <div className="value">{affordabilityIndexed[affordabilityIndexed.length - 1].ratio.toFixed(1)}x</div>
            </StatRow>
          </EraCard>
        </ExampleGrid>
      </div>

      {/* CITATION LISTING */}
      <CitationsContainer>
        <h3>Citations & Sources</h3>
        <CitationTable>
          <div className="index" id="cit-1">[1]</div>
          <div className="text">
            Home Builders Federation, Housing Horizons: Examining UK Housing Stock in an International Context. OECD benchmark of 487 dwellings per 1,000 inhabitants (2020 data). The UK figure (446 per 1,000) is a separate combined calculation across all four nations - see the "Four Nations, Four Markets" article for the full by-nation breakdown and sources.
            View report: <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noreferrer">HBF Housing Horizons</a>
          </div>
          <div className="source">HBF (Oct 2023)</div>

          <div className="index" id="cit-2">[2]</div>
          <div className="text">
            OECD Affordable Housing Database, <a href="https://webfs.oecd.org/els-com/Affordable_Housing_Database/HM1-1-Housing-stock-and-construction.xlsx" target="_blank" rel="noreferrer">Table HM1.1.A1</a>: total housing stock in OECD and EU countries. Netherlands, Germany, Spain, Italy, France and the United States are 2022 figures; Japan is 2018, the latest year available.
          </div>
          <div className="source">OECD HM1.1.A1</div>

          <div className="index" id="cit-3">[3]</div>
          <div className="text">
            HM Land Registry / ONS UK House Price Index. Average house price for the United Kingdom, January snapshot of each year shown (1997, 2000, 2005, 2010, 2015, 2020, 2025).
            View index: <a href="https://landregistry.data.gov.uk/app/ukhpi" target="_blank" rel="noreferrer">UK House Price Index</a>
          </div>
          <div className="source">Land Registry / ONS UK HPI</div>

          <div className="index" id="cit-4">[4]</div>
          <div className="text">
            ONS earnings time series of median gross weekly earnings, UK, adult full-time employees (male &amp; female), 1997-2025; annualised as weekly figure &times; 52.
            View data: <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/earningstimeseriesofmediangrossweeklyearningsfrom1968to2022/current" target="_blank" rel="noreferrer">ONS Earnings Time Series</a>
          </div>
          <div className="source">ONS ASHE / NES (2025)</div>

          <div className="index" id="cit-5">[5]</div>
          <div className="text">
            ONS Housing Affordability in England and Wales. Median house price to median earnings ratio by local authority, 2025.
            View bulletin: <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/latest" target="_blank" rel="noreferrer">ONS Affordability</a>
          </div>
          <div className="source">ONS Affordability (2025)</div>
        </CitationTable>
      </CitationsContainer>
    </NumbersContainer>
  );
};
