import React, { useState } from 'react';
import styled from 'styled-components';

const NumbersContainer = styled.div`
  max-width: 1000px;
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

const Tooltip = styled.div<{ visible: boolean; x: number; y: number }>`
  position: absolute;
  top: ${props => props.y - 45}px;
  left: ${props => props.x}px;
  transform: translateX(-50%);
  background: rgba(10, 13, 20, 0.95);
  border: 1px solid rgba(212, 175, 55, 0.4);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  pointer-events: none;
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: #ffffff;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  opacity: ${props => (props.visible ? 1 : 0)};
  transition: opacity 0.2s ease, top 0.2s ease, left 0.2s ease;
  white-space: nowrap;

  strong {
    color: hsl(46, 65%, 52%);
  }
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

export const RealNumbers: React.FC = () => {
  const [hoveredData, setHoveredData] = useState<{ id: string; val: string; x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, id: string, val: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect && parentRect) {
      setHoveredData({
        id,
        val,
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredData(null);
  };

  // 1. Scarcity Data (converted to per 100 citizens)
  const scarcityData = [
    { country: 'United Kingdom', val: 37.4, highlighted: true },
    { country: 'England (Stat)', val: 43.4, highlighted: false },
    { country: 'Netherlands', val: 45.7, highlighted: false },
    { country: 'OECD Average', val: 48.7, highlighted: false },
    { country: 'EU Average', val: 49.0, highlighted: false },
    { country: 'Japan', val: 50.3, highlighted: false },
    { country: 'Germany', val: 51.6, highlighted: false },
    { country: 'France', val: 55.3, highlighted: false },
    { country: 'Spain', val: 55.9, highlighted: false },
    { country: 'Italy', val: 58.7, highlighted: false },
    { country: 'Bulgaria', val: 66.8, highlighted: false },
  ];

  const sHeight = 280;
  const sBarHeight = 16;
  const sSpacing = 6;
  const sPaddingLeft = 140;
  const sWidth = 500;
  const sScale = (sWidth - sPaddingLeft - 40) / 66.8;

  // 2. Productivity and Housing Cost Stagnation Correlation
  // Stalling productivity growth vs house-price-to-income multiplier climb
  const productivityData = [
    { period: '1995-2000', costMultiplier: '4.4x', productivityGrowth: 2.2, highlighted: false },
    { period: '2000-2005', costMultiplier: '5.2x', productivityGrowth: 1.8, highlighted: false },
    { period: '2005-2010', costMultiplier: '6.9x', productivityGrowth: 0.9, highlighted: false },
    { period: '2010-2015', costMultiplier: '7.4x', productivityGrowth: 0.5, highlighted: false },
    { period: '2015-2020', costMultiplier: '8.2x', productivityGrowth: 0.4, highlighted: false },
    { period: '2020-2025', costMultiplier: '10.0x', productivityGrowth: 0.3, highlighted: true },
  ];

  const pHeight = 200;
  const pWidth = 500;
  const pPaddingLeft = 100;
  const pBarHeight = 18;
  const pSpacing = 8;
  const pScale = (pWidth - pPaddingLeft - 60) / 2.5;

  return (
    <NumbersContainer>
      <HeaderSection>
        <span>Data Graphed & Grounded</span>
        <h2>The REAL Numbers</h2>
      </HeaderSection>

      {/* 1. HOUSING STOCK SCARCITY CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>Dwellings per 100 Citizens</ChartTitle>
        <ChartDesc>
          Compared to European and G7 developed counterparts, the UK operates under severe, chronic structural undersupply. Divided by 10 to show dwellings per 100 inhabitants <sup><a href="#cit-1">[1]</a></sup><sup><a href="#cit-2">[2]</a></sup>.
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
                  width={66.8 * sScale}
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
                  onMouseMove={(e) => handleMouseMove(e, d.country, `${d.val} per 100 people`)}
                  onMouseLeave={handleMouseLeave}
                />
                <text
                  x={sPaddingLeft + barWidth + 8}
                  y={y + sBarHeight / 2 + 4}
                  fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.val}
                </text>
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
      </ChartWrapper>

      {/* 2. AFFORDABILITY PATHWAY CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>The 30-Year Price-to-Salary Growth Matrix (1995 - 2025)</ChartTitle>
        <ChartDesc>
          A line graph tracking home price growth (+600%) against average wage growth (+100%) in the UK. Median house price multiplier has climbed from 3x average salary (1995) to 10x average salary (2025) <sup><a href="#cit-3">[3]</a></sup><sup><a href="#cit-4">[4]</a></sup>.
        </ChartDesc>
        <SVGContainer viewBox="0 0 500 200">
          {/* Y Grid lines */}
          {[100, 200, 400, 600, 800].map((v) => {
            const y = 160 - (v * 120) / 800;
            return (
              <g key={v}>
                <line x1="60" y1={y} x2="420" y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <text x="45" y={y + 4} fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Inter" textAnchor="end">{v}%</text>
              </g>
            );
          })}

          <text x="80" y="185" fill="#ffffff" fontFamily="Inter" fontSize="11">1995 (Baseline: 100%)</text>
          <text x="400" y="185" fill="#ffffff" fontFamily="Inter" fontSize="11" textAnchor="end">2025</text>

          {/* Wages Line */}
          <line x1="100" y1="145" x2="380" y2="130" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="3 3" />
          <circle
            cx="100"
            cy="145"
            r="4"
            fill="#c0c0c0"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'Wages 1995', 'Baseline: 100%')}
            onMouseLeave={handleMouseLeave}
          />
          <circle
            cx="380"
            cy="130"
            r="4"
            fill="#c0c0c0"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'Wages 2025', '200% (+100% wage growth)')}
            onMouseLeave={handleMouseLeave}
          />
          <text x="390" y="133" fill="rgba(255,255,255,0.5)" fontFamily="Inter" fontSize="10">Wages (2.0x)</text>

          {/* House Prices Line */}
          <line x1="100" y1="145" x2="380" y2="55" stroke="hsl(46, 65%, 52%)" strokeWidth="3" />
          <circle
            cx="100"
            cy="145"
            r="5"
            fill="hsl(46, 65%, 52%)"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'House Prices 1995', 'Baseline: 100%')}
            onMouseLeave={handleMouseLeave}
          />
          <circle
            cx="380"
            cy="55"
            r="5"
            fill="hsl(46, 65%, 52%)"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'House Prices 2025', '700% (+600% price surge)')}
            onMouseLeave={handleMouseLeave}
          />
          <text x="390" y="58" fill="hsl(46, 65%, 52%)" fontFamily="Inter" fontSize="10" fontWeight="600">House Prices (7.0x)</text>
        </SVGContainer>
      </ChartWrapper>

      {/* 3. PRODUCTIVITY DRAG CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>The Stagnation Correlation: Productivity vs. Housing Cost Multiplier</ChartTitle>
        <ChartDesc>
          As housing costs (median-price-to-income multiplier) climb, UK labor productivity growth (GDP per hour worked) experiences a severe stagnation drag <sup><a href="#cit-5">[5]</a></sup>.
        </ChartDesc>
        <SVGContainer viewBox={`0 0 ${pWidth} ${pHeight}`}>
          {productivityData.map((d, i) => {
            const y = i * (pBarHeight + pSpacing) + 20;
            const barWidth = d.productivityGrowth * pScale;
            const fill = d.highlighted ? 'rgba(212, 175, 55, 0.25)' : 'rgba(255, 255, 255, 0.08)';
            const border = d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.08)';

            return (
              <g key={d.period}>
                <text
                  x={pPaddingLeft - 15}
                  y={y + pBarHeight / 2 + 4}
                  textAnchor="end"
                  fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.period}
                </text>
                
                {/* Productivity Bar */}
                <rect
                  x={pPaddingLeft}
                  y={y}
                  width={barWidth}
                  height={pBarHeight}
                  rx="3"
                  fill={fill}
                  stroke={border}
                  strokeWidth="1"
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseMove={(e) => handleMouseMove(e, `Productivity Growth (${d.period})`, `${d.productivityGrowth}% per annum`)}
                  onMouseLeave={handleMouseLeave}
                />
                
                {/* Inline Productivity Text */}
                <text
                  x={pPaddingLeft + barWidth + 8}
                  y={y + pBarHeight / 2 + 4}
                  fill="#ffffff"
                  fontFamily="Inter"
                  fontSize="11"
                >
                  +{d.productivityGrowth}%/yr
                </text>

                {/* Housing Multiplier Indicator */}
                <text
                  x={pWidth - 80}
                  y={y + pBarHeight / 2 + 4}
                  fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.4)'}
                  fontFamily="Outfit"
                  fontSize="11"
                  fontWeight="600"
                  textAnchor="end"
                >
                  Price Multiplier: {d.costMultiplier}
                </text>
              </g>
            );
          })}
        </SVGContainer>
      </ChartWrapper>

      {hoveredData && (
        <Tooltip visible={true} x={hoveredData.x} y={hoveredData.y}>
          {hoveredData.id}: <strong>{hoveredData.val}</strong>
        </Tooltip>
      )}

      {/* CITATION LISTING */}
      <CitationsContainer>
        <h3>Citations & Sources</h3>
        <CitationTable>
          <div className="index" id="cit-1">[1]</div>
          <div className="text">
            OECD Affordable Housing Database. Comparative Housing Stock indicators detailing dwellings per capita across selected developed grids.
            View the dataset: <a href="https://www.oecd.org/housing/data/affordable-housing-database/" target="_blank" rel="noreferrer">OECD Housing Registry</a>
          </div>
          <div className="source">OECD (2023)</div>

          <div className="index" id="cit-2">[2]</div>
          <div className="text">
            Statista Research Registry. International comparison of housing density per capita, incorporating Japan Ministry of Internal Affairs & Communications and Italy ISTAT records.
          </div>
          <div className="source">Statista Database (2024)</div>

          <div className="index" id="cit-3">[3]</div>
          <div className="text">
            ONS House Price Index. Long-term dataset tracing UK house price inflation from 1995 to 2025.
            View index details: <a href="https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/previousReleases" target="_blank" rel="noreferrer">ONS HPI Archive</a>
          </div>
          <div className="source">ONS Land Registry (2025)</div>

          <div className="index" id="cit-4">[4]</div>
          <div className="text">
            ONS Annual Survey of Hours and Earnings (ASHE). Tracing historical wage increases for public sector workers and teachers across three decades.
          </div>
          <div className="source">ONS ASHE (2025)</div>

          <div className="index" id="cit-5">[5]</div>
          <div className="text">
            ONS Labor Productivity Stats. GDP per hour worked and productivity stagnation logs compared across the G7.
            Verify records: <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/labourproductivity" target="_blank" rel="noreferrer">ONS Productivity Logs</a>
          </div>
          <div className="source">ONS Productivity (2025)</div>
        </CitationTable>
      </CitationsContainer>
    </NumbersContainer>
  );
};
