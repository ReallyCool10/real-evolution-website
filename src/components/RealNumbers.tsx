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

const ComparisonSummary = styled.div`
  margin-top: 2rem;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;

  @media (max-width: 580px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .icon-wrapper {
    background: rgba(212, 175, 55, 0.1);
    border: 1px solid rgba(212, 175, 55, 0.2);
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: hsl(46, 65%, 52%);
    flex-shrink: 0;
  }

  .text-content {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.85);

    strong {
      color: #ffffff;
    }
    
    span.highlight {
      color: hsl(46, 65%, 52%);
      font-weight: 600;
    }
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

  // 1. Scarcity Data (converted to per 100 citizens, 2023 verified)
  const scarcityData = [
    { country: 'United Kingdom', val: 44.6, highlighted: true },
    { country: 'Netherlands', val: 45.6, highlighted: false },
    { country: 'OECD Average', val: 48.7, highlighted: false },
    { country: 'EU Average', val: 50.0, highlighted: false },
    { country: 'Germany', val: 52.1, highlighted: false },
    { country: 'Japan', val: 52.3, highlighted: false },
    { country: 'Spain', val: 55.0, highlighted: false },
    { country: 'Italy', val: 58.7, highlighted: false },
    { country: 'France', val: 59.0, highlighted: false },
  ];

  const sHeight = 280;
  const sBarHeight = 16;
  const sSpacing = 6;
  const sPaddingLeft = 140;
  const sWidth = 500;
  const sScale = (sWidth - sPaddingLeft - 40) / 59.0;


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
          Compared to European and G7 developed counterparts, the UK operates under severe, chronic structural undersupply. <sup><a href="#cit-1">[1]</a></sup><sup><a href="#cit-2">[2]</a></sup>.
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
                  width={59.0 * sScale}
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
        <div style={{ marginTop: '1.2rem', padding: '0 0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem', fontFamily: 'Inter, sans-serif', lineHeight: '1.6' }}>
            To match the EU average of <strong style={{ color: '#fff' }}>50.0</strong> dwellings per 100 citizens, the UK (at <strong style={{ color: '#fff' }}>44.6</strong>) would need approximately <span style={{ color: 'hsl(46, 65%, 52%)', fontWeight: 700 }}>3.7 million</span> additional homes <span style={{ opacity: 0.5 }}>((50.0 − 44.6) × 68.3m ÷ 100 = 3,688,200)</span>.
        </div>
      </ChartWrapper>

      {/* 2. AFFORDABILITY PATHWAY CHART */}
      <ChartWrapper style={{ position: 'relative' }}>
        <ChartTitle>The 30-Year Price-to-Earnings Growth Matrix (1995 - 2025)</ChartTitle>
        <ChartDesc>
          A line graph tracking UK home price growth (+425%) against average wage growth (+112%). The median house price-to-earnings ratio has climbed from 3.1x (1995) to 7.7x (2025) <sup><a href="#cit-3">[3]</a></sup><sup><a href="#cit-4">[4]</a></sup>.
        </ChartDesc>
        <SVGContainer viewBox="0 0 500 200">
          {/* Y Grid lines */}
          {[100, 200, 300, 400, 500, 600].map((v) => {
            const y = 160 - (v * 130) / 600;
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
          <line x1="100" y1="138" x2="380" y2="114" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="3 3" />
          <circle
            cx="100"
            cy="138"
            r="4"
            fill="#c0c0c0"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'Wages 1995', 'Baseline: £16,500')}
            onMouseLeave={handleMouseLeave}
          />
          <circle
            cx="380"
            cy="114"
            r="4"
            fill="#c0c0c0"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'Wages 2025', '212% (+112% wage growth)')}
            onMouseLeave={handleMouseLeave}
          />
          <text x="390" y="117" fill="rgba(255,255,255,0.5)" fontFamily="Inter" fontSize="10">Wages (2.1x)</text>

          {/* House Prices Line */}
          <line x1="100" y1="138" x2="380" y2="46" stroke="hsl(46, 65%, 52%)" strokeWidth="3" />
          <circle
            cx="100"
            cy="138"
            r="5"
            fill="hsl(46, 65%, 52%)"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'House Prices 1995', 'Baseline: £51,000')}
            onMouseLeave={handleMouseLeave}
          />
          <circle
            cx="380"
            cy="46"
            r="5"
            fill="hsl(46, 65%, 52%)"
            stroke="#ffffff"
            strokeWidth="1"
            style={{ cursor: 'pointer' }}
            onMouseMove={(e) => handleMouseMove(e, 'House Prices 2025', '525% (+425% price surge)')}
            onMouseLeave={handleMouseLeave}
          />
          <text x="390" y="49" fill="hsl(46, 65%, 52%)" fontFamily="Inter" fontSize="10" fontWeight="600">House Prices (5.3x)</text>
        </SVGContainer>
      </ChartWrapper>

      {/* WORKED EXAMPLE: REAL NUMBERS CASE STUDY */}
      <div style={{ marginBottom: '3rem' }}>
        <ChartTitle>The Worked Example: How the Numbers Affect a Family</ChartTitle>
        <ChartDesc>
          A concrete mathematical comparison of the average UK family home price against average individual salaries in 1995 vs 2025, using ONS verified data.
        </ChartDesc>
        
        <ExampleGrid>
          <EraCard>
            <EraHeader>
              <h4>1995</h4>
            </EraHeader>
            <StatRow>
              <div className="label">Average UK Salary</div>
              <div className="value">£16,500</div>
            </StatRow>
            <StatRow>
              <div className="label">Average UK Family Home</div>
              <div className="value">£51,000</div>
            </StatRow>
            <StatRow className="multiplier-row">
              <div className="label">Price-to-Earnings Ratio</div>
              <div className="value">3.1x</div>
            </StatRow>
          </EraCard>

          <EraCard active={true}>
            <EraHeader>
              <h4>2025</h4>
            </EraHeader>
            <StatRow>
              <div className="label">Average UK Salary</div>
              <div className="value">£35,000 (+112%)</div>
            </StatRow>
            <StatRow>
              <div className="label">Average UK Family Home</div>
              <div className="value">£268,000 (+425%)</div>
            </StatRow>
            <StatRow className="multiplier-row">
              <div className="label">Price-to-Earnings Ratio</div>
              <div className="value">7.7x</div>
            </StatRow>
          </EraCard>
        </ExampleGrid>

        <ComparisonSummary>
          <div className="icon-wrapper">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="text-content">
            <strong>The Newly Qualified Teacher's Scenario:</strong> In 1995, a newly qualified teacher earning <strong>£15,000</strong> could purchase a family home for <strong>£51,000</strong> (just <span className="highlight">3.4x</span> salary). Today, a newly qualified teacher earning <strong>£33,000</strong> must pay <strong>£268,000</strong> for an equivalent home (a staggering <span className="highlight">8.1x</span> salary).
          </div>
        </ComparisonSummary>
      </div>


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
            OECD Affordable Housing Database (HM1.1). Housing stock per 1,000 inhabitants across OECD member states.
            View dataset: <a href="https://www.oecd.org/housing/data/affordable-housing-database/" target="_blank" rel="noreferrer">OECD Housing Database</a>
          </div>
          <div className="source">OECD (2023)</div>

          <div className="index" id="cit-2">[2]</div>
          <div className="text">
            National statistical offices: ONS/DLUHC Housing Stock (UK, 2023); CBS Housing Statistics (Netherlands, 2022); Destatis Census of Buildings (Germany, 2023); Statistics Bureau of Japan Housing and Land Survey (2023); INE Census/Bank of Spain (Spain, 2021); ISTAT (Italy); INSEE (France).
          </div>
          <div className="source">National Statistics (2021–2023)</div>

          <div className="index" id="cit-3">[3]</div>
          <div className="text">
            ONS UK House Price Index. Average house prices for England and Wales from January 1995 to present.
            View index: <a href="https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/previousReleases" target="_blank" rel="noreferrer">ONS HPI Archive</a>
          </div>
          <div className="source">ONS UK HPI (2025)</div>

          <div className="index" id="cit-4">[4]</div>
          <div className="text">
            ONS Annual Survey of Hours and Earnings (ASHE). Median gross annual earnings for full-time employees, April 2025 provisional.
            View data: <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours" target="_blank" rel="noreferrer">ONS Earnings</a>
          </div>
          <div className="source">ONS ASHE (2025)</div>

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
