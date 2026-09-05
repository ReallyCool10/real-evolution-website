import React, { useState } from 'react';
import styled from 'styled-components';

interface ChartProps {
  type: 'deficit' | 'quality' | 'affordability' | 'sutherland' | 'nations-dwellings' | 'nations-price' | 'nations-ratio' | 'london-premium' | 'london-overseas';
}

const ChartContainer = styled.div`
  width: 100%;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 1.5rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  margin: 1.5rem 0;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
`;

const ChartTitle = styled.h4`
  font-family: 'Outfit', sans-serif;
  font-size: 1.25rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0 0 0.5rem 0;
  text-align: left;
`;

const ChartSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.6);
  margin: 0 0 1.5rem 0;
  text-align: left;
  line-height: 1.4;
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
  background: rgba(11, 14, 23, 0.95);
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

export const VisualChart: React.FC<ChartProps> = ({ type }) => {
  const [hoveredBar, setHoveredBar] = useState<{ id: string; val: string; x: number; y: number } | null>(null);

  const handleMouseMove = (e: React.MouseEvent, id: string, val: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const parentRect = e.currentTarget.parentElement?.getBoundingClientRect();
    if (rect && parentRect) {
      setHoveredBar({
        id,
        val,
        x: rect.left - parentRect.left + rect.width / 2,
        y: rect.top - parentRect.top,
      });
    }
  };

  const handleMouseLeave = () => {
    setHoveredBar(null);
  };

  // Used by 'affordability' and the 'nations-*' charts: hover labels rendered natively
  // inside the SVG at the same coordinates as the node/bar itself, rather than as an
  // HTML overlay positioned via getBoundingClientRect (the older approach above, which
  // can drift relative to the element it's meant to describe).
  const [hoveredNode, setHoveredNode] = useState<{ series: string; year: string } | null>(null);
  const [hoveredNationBar, setHoveredNationBar] = useState<string | null>(null);

  if (type === 'deficit') {
    // Dwellings per 1,000 inhabitants. United Kingdom (446) is a combined figure across
    // all four nations - see the "Four Nations, Four Markets" article for the by-nation
    // breakdown and full citations. OECD average (487) is from HBF Housing Horizons (Oct
    // 2023, 2020 data). All other countries are from the OECD Affordable Housing Database,
    // Table HM1.1.A1 (latest available year: 2022, except Japan which is 2018). Sorted
    // ascending by value.
    const data = [
      { country: 'United States', value: 428, highlighted: false },
      { country: 'United Kingdom', value: 446, highlighted: true },
      { country: 'Netherlands', value: 454, highlighted: false },
      { country: 'OECD Average', value: 487, highlighted: false },
      { country: 'Japan', value: 493, highlighted: false },
      { country: 'Germany', value: 518, highlighted: false },
      { country: 'Spain', value: 563, highlighted: false },
      { country: 'France', value: 591, highlighted: false },
      { country: 'Italy', value: 598, highlighted: false },
    ];

    const chartHeight = 270;
    const barHeight = 18;
    const barSpacing = 8;
    const paddingLeft = 140;
    const paddingRight = 40;
    const chartWidth = 500;
    // Scale to the actual max in the dataset, not a hardcoded value - otherwise a bar can
    // silently overflow the track once the data changes (as happened here: France used to
    // be the max at 590, then Italy's corrected figure of 598 overflowed the fixed scale).
    const maxVal = Math.max(...data.map(d => d.value));
    const scale = (chartWidth - paddingLeft - paddingRight) / maxVal;

    return (
      <ChartContainer style={{ position: 'relative' }}>
        <ChartTitle>Dwellings per 1,000 Inhabitants</ChartTitle>
        <ChartSubtitle>
          The UK holds fewer dwellings per head of population than most comparable developed nations.
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%">
          {data.map((d, i) => {
            const y = i * (barHeight + barSpacing) + 20;
            const barWidth = d.value * scale;
            const fill = d.highlighted ? 'url(#gold-gradient)' : 'rgba(255, 255, 255, 0.15)';
            const border = d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.1)';

            return (
              <g key={d.country}>
                {/* Y-Axis Label */}
                <text
                  x={paddingLeft - 15}
                  y={y + barHeight / 2 + 4}
                  textAnchor="end"
                  fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.country}
                </text>
                {/* Background Track */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={maxVal * scale}
                  height={barHeight}
                  rx="4"
                  fill="rgba(255, 255, 255, 0.02)"
                  stroke="rgba(255, 255, 255, 0.03)"
                  strokeWidth="1"
                />
                {/* Value Bar */}
                <rect
                  x={paddingLeft}
                  y={y}
                  width={barWidth}
                  height={barHeight}
                  rx="4"
                  fill={fill}
                  stroke={border}
                  strokeWidth={d.highlighted ? '1.5' : '0.5'}
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseMove={(e) => handleMouseMove(e, d.country, `${d.value} dwellings / 1k`)}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Inline Value Indicator */}
                <text
                  x={paddingLeft + barWidth + 8}
                  y={y + barHeight / 2 + 4}
                  fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.value}
                </text>
              </g>
            );
          })}
          {/* Gradients definition */}
          <defs>
            <linearGradient id="gold-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(46, 75%, 42%)" />
              <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
            </linearGradient>
          </defs>
        </SVGContainer>
        {hoveredBar && (
          <Tooltip visible={true} x={hoveredBar.x} y={hoveredBar.y}>
            {hoveredBar.id}: <strong>{hoveredBar.val}</strong>
          </Tooltip>
        )}
      </ChartContainer>
    );
  }

  if (type === 'quality') {
    // English Housing Survey 2022-23: Non-decent homes by tenure
    const data = [
      { country: 'Private Rented', label: ['Private', 'Rented'], value: 21, highlighted: true },
      { country: 'Local Authority', label: ['Local', 'Authority'], value: 15, highlighted: false },
      { country: 'All Tenures', label: ['All', 'Tenures'], value: 14, highlighted: false },
      { country: 'Owner Occupied', label: ['Owner', 'Occupied'], value: 13, highlighted: false },
      { country: 'Housing Assoc.', label: ['Housing', 'Assoc.'], value: 9, highlighted: false },
    ];

    const chartHeight = 235;
    const paddingBottom = 55;
    const paddingTop = 30;
    const chartWidth = 500;
    const colWidth = 45;
    const colSpacing = 40;
    const startX = 60;
    const maxVal = 25;
    const scale = (chartHeight - paddingTop - paddingBottom) / maxVal;

    return (
      <ChartContainer style={{ position: 'relative' }}>
        <ChartTitle>Homes Failing Decent Homes Standard by Tenure (%)</ChartTitle>
        <ChartSubtitle>
          Private renters face the worst conditions, with over 1 in 5 homes failing to meet basic decency standards (EHS 2022-23).
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%">
          {/* Grid lines */}
          {[0, 5, 10, 15, 20, 25].map((v) => {
            const y = chartHeight - paddingBottom - v * scale;
            return (
              <g key={v}>
                <line
                  x1={startX}
                  y1={y}
                  x2={chartWidth - 20}
                  y2={y}
                  stroke="rgba(255, 255, 255, 0.05)"
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text
                  x={startX - 15}
                  y={y + 4}
                  fill="rgba(255, 255, 255, 0.4)"
                  fontSize="10"
                  fontFamily="Inter"
                  textAnchor="end"
                >
                  {v}%
                </text>
              </g>
            );
          })}

          {data.map((d, i) => {
            const x = startX + i * (colWidth + colSpacing) + 20;
            const barHeight = d.value * scale;
            const y = chartHeight - paddingBottom - barHeight;
            const fill = 'url(#gold-gradient-v)';
            const border = 'hsl(46, 65%, 52%)';

            return (
              <g key={d.country}>
                {/* Column Bar */}
                <rect
                  x={x}
                  y={y}
                  width={colWidth}
                  height={barHeight}
                  rx="6"
                  fill={fill}
                  stroke={border}
                  strokeWidth={d.highlighted ? '1.5' : '0.5'}
                  style={{ transition: 'all 0.3s ease', cursor: 'pointer' }}
                  onMouseMove={(e) => handleMouseMove(e, d.country, `${d.value}% non-decent`)}
                  onMouseLeave={handleMouseLeave}
                />
                {/* Value Text */}
                <text
                  x={x + colWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.6)'}
                  fontFamily="Inter"
                  fontSize="11"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  {d.value}%
                </text>
                {/* X-axis Label (two rows) */}
                <text
                  x={x + colWidth / 2}
                  y={chartHeight - paddingBottom + 16}
                  textAnchor="middle"
                  fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'}
                  fontFamily="Inter"
                  fontSize="10"
                  fontWeight={d.highlighted ? '600' : '400'}
                >
                  <tspan x={x + colWidth / 2} dy="0">{d.label[0]}</tspan>
                  <tspan x={x + colWidth / 2} dy="13">{d.label[1]}</tspan>
                </text>
              </g>
            );
          })}
          <defs>
            <linearGradient id="gold-gradient-v" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="hsl(46, 75%, 32%)" />
              <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
            </linearGradient>
          </defs>
        </SVGContainer>
        {hoveredBar && (
          <Tooltip visible={true} x={hoveredBar.x} y={hoveredBar.y}>
            {hoveredBar.id}: <strong>{hoveredBar.val}</strong>
          </Tooltip>
        )}
      </ChartContainer>
    );
  }

  if (type === 'sutherland') {
    const chartHeight = 240;
    const chartWidth = 500;

    return (
      <ChartContainer style={{ position: 'relative' }}>
        <ChartTitle>The Liquidity Framework: Binary vs. Continuous Market</ChartTitle>
        <ChartSubtitle>
          Comparing the traditional listing system, where only a small fraction of homes are on the market at any time, against Sutherland's proposal that every home be addressable.
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%">
          {/* Traditional Panel */}
          <rect x="20" y="25" width="210" height="190" rx="8" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1.5" />
          <text x="35" y="45" fill="rgba(255,255,255,0.4)" fontSize="9" fontFamily="Outfit" fontWeight="600" letterSpacing="1">TRADITIONAL MARKET</text>
          
          {/* Traditional Bar: 2% Active Listings */}
          <rect x="35" y="60" width="180" height="16" rx="4" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
          <rect x="35" y="60" width="12" height="16" rx="4" fill="hsl(46, 65%, 52%)" />
          <text x="53" y="72" fill="rgba(255,255,255,0.5)" fontSize="8" fontFamily="Inter">Few Active Listings</text>

          {/* Traditional Metrics */}
          <text x="35" y="100" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="Inter">• 6-Month Average Sale Time</text>
          <text x="35" y="120" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="Inter">• ~24% Fall-Through Rate</text>
          <text x="35" y="140" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="Inter">• £9B+ Transactional Drag</text>
          <text x="35" y="160" fill="rgba(255,255,255,0.6)" fontSize="10" fontFamily="Inter">• Locked "Shadow Inventory"</text>
          
          <text x="35" y="195" fill="rgba(255,255,255,0.3)" fontSize="9" fontFamily="Outfit" fontWeight="600" letterSpacing="0.5">BINARY LISTING LIMBO</text>

          {/* Continuous Panel */}
          <rect x="270" y="25" width="210" height="190" rx="8" fill="rgba(212, 175, 55, 0.03)" stroke="hsl(46, 65%, 52%)" strokeWidth="1.5" />
          <text x="285" y="45" fill="hsl(46, 65%, 52%)" fontSize="9" fontFamily="Outfit" fontWeight="600" letterSpacing="1">CONTINUOUS MARKET</text>

          {/* Continuous Bar: 100% Addressable */}
          <rect x="285" y="60" width="180" height="16" rx="4" fill="url(#gold-gradient)" stroke="hsl(46, 65%, 52%)" strokeWidth="1" />
          <text x="375" y="71" fill="#ffffff" fontSize="8" fontFamily="Inter" fontWeight="700" textAnchor="middle">100% Addressable Assets</text>

          {/* Continuous Metrics */}
          <text x="285" y="100" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Inter">• Instant Bid-Ask Discovery</text>
          <text x="285" y="120" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Inter">• Zero-Limbo "Reserve Pricing"</text>
          <text x="285" y="140" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Inter">• Decoupled Onward Chains</text>
          <text x="285" y="160" fill="rgba(255,255,255,0.85)" fontSize="10" fontFamily="Inter">• Active Downsizing Incentives</text>

          <text x="285" y="195" fill="hsl(46, 65%, 52%)" fontSize="9" fontFamily="Outfit" fontWeight="600" letterSpacing="0.5">UNLOCKED SHADOW LIQUIDITY</text>
        </SVGContainer>
      </ChartContainer>
    );
  }

  if (type === 'affordability') {
    // UK-wide, 1997 baseline (index 100), matching the corrected figures on The REAL
    // Numbers page: HM Land Registry / ONS UK HPI (house prices) and ONS median gross
    // weekly earnings time series (wages). Same source pair used throughout that page.
    const wagesData = [
      { year: '1997', value: 100, amount: '£16,666/yr' },
      { year: '2025', value: 239, amount: '£39,863/yr' },
    ];
    const houseData = [
      { year: '1997', value: 100, amount: '£55,914' },
      { year: '2025', value: 474, amount: '£264,936' },
    ];

    const chartHeight = 220;
    const paddingBottom = 40;
    const paddingTop = 30;
    const chartWidth = 500;
    const startX = 60;
    const endX = chartWidth - 80;
    const maxVal = 600;
    const scale = (chartHeight - paddingTop - paddingBottom) / maxVal;

    const yWages97 = chartHeight - paddingBottom - wagesData[0].value * scale;
    const yWages25 = chartHeight - paddingBottom - wagesData[1].value * scale;
    const yHouse97 = chartHeight - paddingBottom - houseData[0].value * scale;
    const yHouse25 = chartHeight - paddingBottom - houseData[1].value * scale;

    return (
      <ChartContainer style={{ position: 'relative' }}>
        <ChartTitle>Wage Growth vs. House Price Inflation (1997 - 2025)</ChartTitle>
        <ChartSubtitle>
          In 2025 the median UK home cost 6.6 times median annual earnings (£264,936 against £39,863), roughly double the ratio when the ONS series began in 1997.
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%">
          {/* Y Axis grid (affordability chart) */}
          {[100, 200, 300, 400, 500, 600].map((v) => {
            const y = chartHeight - paddingBottom - v * scale;
            return (
              <g key={v}>
                <line x1={startX} y1={y} x2={endX} y2={y} stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
                <text x={startX - 15} y={y + 4} fill="rgba(255, 255, 255, 0.4)" fontSize="10" fontFamily="Inter" textAnchor="end">
                  {v}%
                </text>
              </g>
            );
          })}

          {/* X Axis labels */}
          <text x={startX + 30} y={chartHeight - paddingBottom + 25} fill="#ffffff" fontFamily="Inter" fontSize="12" fontWeight="600">
            Year 1997 (Baseline: 100%)
          </text>
          <text x={endX - 30} y={chartHeight - paddingBottom + 25} fill="#ffffff" fontFamily="Inter" fontSize="12" fontWeight="600" textAnchor="end">
            Year 2025
          </text>

          {/* WAGES LINE */}
          <line x1={startX + 40} y1={yWages97} x2={endX - 40} y2={yWages25} stroke="rgba(255, 255, 255, 0.4)" strokeWidth="2.5" />
          {[{ x: startX + 40, y: yWages97, d: wagesData[0] }, { x: endX - 40, y: yWages25, d: wagesData[1] }].map(p => (
            <g key={`wage-${p.d.year}`}>
              <circle cx={p.x} cy={p.y} r="5" fill="#c0c0c0" stroke="rgba(255, 255, 255, 0.8)" strokeWidth="1" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredNode({ series: 'wage', year: p.d.year })} onMouseLeave={() => setHoveredNode(null)} />
              {hoveredNode?.series === 'wage' && hoveredNode.year === p.d.year && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={p.x - 46} y={p.y - 32} width="92" height="20" rx="4" fill="rgba(10,13,20,0.95)" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                  <text x={p.x} y={p.y - 18} textAnchor="middle" fill="#ffffff" fontFamily="Inter" fontSize="10" fontWeight="600">{p.d.amount} ({p.d.value}%)</text>
                </g>
              )}
            </g>
          ))}
          <text x={endX - 25} y={yWages25 + 4} fill="rgba(255, 255, 255, 0.6)" fontFamily="Inter" fontSize="11" textAnchor="start">
            Wages (2.4x)
          </text>

          {/* HOUSE PRICES LINE */}
          <line x1={startX + 40} y1={yHouse97} x2={endX - 40} y2={yHouse25} stroke="hsl(46, 65%, 52%)" strokeWidth="3.5" />
          {[{ x: startX + 40, y: yHouse97, d: houseData[0] }, { x: endX - 40, y: yHouse25, d: houseData[1] }].map(p => (
            <g key={`price-${p.d.year}`}>
              <circle cx={p.x} cy={p.y} r="6" fill="hsl(46, 65%, 52%)" stroke="#ffffff" strokeWidth="1.5" style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredNode({ series: 'price', year: p.d.year })} onMouseLeave={() => setHoveredNode(null)} />
              {hoveredNode?.series === 'price' && hoveredNode.year === p.d.year && (
                <g style={{ pointerEvents: 'none' }}>
                  <rect x={p.x - 46} y={p.y - 34} width="92" height="20" rx="4" fill="rgba(10,13,20,0.95)" stroke="hsl(46, 65%, 52%)" strokeWidth="1" />
                  <text x={p.x} y={p.y - 20} textAnchor="middle" fill="#ffffff" fontFamily="Inter" fontSize="10" fontWeight="600">{p.d.amount} ({p.d.value}%)</text>
                </g>
              )}
            </g>
          ))}
          <text x={endX - 25} y={yHouse25 + 4} fill="hsl(46, 65%, 52%)" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="start">
            House Prices (4.7x)
          </text>
        </SVGContainer>
      </ChartContainer>
    );
  }

  // Shared by the three 'nations-*' charts below: England, Wales, Scotland and Northern
  // Ireland, all matched to ~2023 vintage. Sources: MHCLG (England), National Records of
  // Scotland, Welsh Government/StatsWales, and NISRA for dwelling stock; HM Land Registry
  // UK HPI for house prices; ONS ASHE Table 7.1a (England/Wales/Scotland) and NISRA ASHE
  // (Northern Ireland) for earnings. See the article's own citation list for full detail.
  const nationsData = [
    { nation: 'Northern Ireland', dwellingsPer100: 43.2, price: 162479, wageAnnual: 33228 },
    { nation: 'England', dwellingsPer100: 44.0, price: 285817, wageAnnual: 35875 },
    { nation: 'Wales', dwellingsPer100: 46.7, price: 201853, wageAnnual: 33088 },
    { nation: 'Scotland', dwellingsPer100: 49.5, price: 175092, wageAnnual: 36878 },
  ].map(d => ({ ...d, ratio: d.price / d.wageAnnual }));

  const nBarHeight = 20;
  const nSpacing = 10;
  const nPaddingLeft = 150;
  const nWidth = 500;
  const nHeight = nationsData.length * (nBarHeight + nSpacing) + 20;

  const renderNationsBar = (
    getValue: (d: typeof nationsData[number]) => number,
    formatValue: (v: number) => string,
    domainMax: number,
    highlightNation: string,
    unitSuffix: string
  ) => {
    const scale = (nWidth - nPaddingLeft - 50) / domainMax;
    return (
      <SVGContainer viewBox={`0 0 ${nWidth} ${nHeight}`}>
        {nationsData.map((d, i) => {
          const y = i * (nBarHeight + nSpacing) + 10;
          const val = getValue(d);
          const barWidth = val * scale;
          const isHighlighted = d.nation === highlightNation;
          const fill = isHighlighted ? 'url(#gold-gradient-nations)' : 'rgba(255, 255, 255, 0.15)';
          const border = isHighlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.1)';
          return (
            <g key={d.nation}>
              <text x={nPaddingLeft - 12} y={y + nBarHeight / 2 + 4} textAnchor="end" fill={isHighlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} fontFamily="Inter" fontSize="11" fontWeight={isHighlighted ? '600' : '400'}>
                {d.nation}
              </text>
              <rect x={nPaddingLeft} y={y} width={domainMax * scale} height={nBarHeight} rx="4" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <rect
                x={nPaddingLeft}
                y={y}
                width={barWidth}
                height={nBarHeight}
                rx="4"
                fill={fill}
                stroke={border}
                strokeWidth={isHighlighted ? '1.5' : '0.5'}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseEnter={() => setHoveredNationBar(d.nation)}
                onMouseLeave={() => setHoveredNationBar(null)}
              />
              <text x={nPaddingLeft + barWidth + 8} y={y + nBarHeight / 2 + 4} fill={isHighlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'} fontFamily="Inter" fontSize="11" fontWeight={isHighlighted ? '600' : '400'} style={{ pointerEvents: 'none' }}>
                {formatValue(val)}{unitSuffix}
              </text>
              {/* Hover label drawn natively inside the bar's own filled area, same
                  pattern used on The REAL Numbers page - no HTML overlay involved. */}
              {hoveredNationBar === d.nation && (
                <text x={nPaddingLeft + barWidth / 2} y={y + nBarHeight / 2 + 4} textAnchor="middle" fill={isHighlighted ? '#0a0d14' : '#ffffff'} fontFamily="Inter" fontSize="11" fontWeight="700" style={{ pointerEvents: 'none' }}>
                  {formatValue(val)}{unitSuffix}
                </text>
              )}
            </g>
          );
        })}
        <defs>
          <linearGradient id="gold-gradient-nations" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(46, 75%, 42%)" />
            <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
          </linearGradient>
        </defs>
      </SVGContainer>
    );
  };

  if (type === 'nations-dwellings') {
    return (
      <ChartContainer>
        <ChartTitle>Dwellings per 100 People, by UK Nation</ChartTitle>
        <ChartSubtitle>
          Northern Ireland has the fewest dwellings relative to its population; Scotland has the most.
        </ChartSubtitle>
        {renderNationsBar(d => d.dwellingsPer100, v => v.toFixed(1), 100, 'Northern Ireland', '')}
      </ChartContainer>
    );
  }

  if (type === 'nations-price') {
    return (
      <ChartContainer>
        <ChartTitle>Average House Price, by UK Nation (Jan 2023)</ChartTitle>
        <ChartSubtitle>
          England's average house price is more than 60% higher than Wales, and over 70% higher than Scotland or Northern Ireland.
        </ChartSubtitle>
        {renderNationsBar(d => d.price, v => `£${Math.round(v).toLocaleString()}`, 300000, 'England', '')}
      </ChartContainer>
    );
  }

  if (type === 'nations-ratio') {
    return (
      <ChartContainer>
        <ChartTitle>Price-to-Earnings Ratio, by UK Nation</ChartTitle>
        <ChartSubtitle>
          England combines the highest house prices with a middling dwellings-per-capita figure, giving it the least affordable ratio of the four.
        </ChartSubtitle>
        {renderNationsBar(d => d.ratio, v => `${v.toFixed(2)}x`, 9, 'England', '')}
      </ChartContainer>
    );
  }

  // HM Land Registry / ONS UK House Price Index, reference month November 2025 (the most
  // recent month with published regional sales volumes at time of writing). The two
  // "excluding London" rows are our own calculation: London's sales volume and total sale
  // value subtracted from the England/UK totals in the same dataset, then divided through -
  // all five figures are transaction-weighted and drawn from a single consistent source.
  const premiumData = [
    { area: 'UK excl. London', value: 250113, highlighted: false },
    { area: 'England excl. London', value: 266965, highlighted: false },
    { area: 'United Kingdom', value: 272248, highlighted: false },
    { area: 'England', value: 294466, highlighted: false },
    { area: 'London', value: 556044, highlighted: true },
  ];

  if (type === 'london-premium') {
    const scale = (nWidth - nPaddingLeft - 60) / 600000;
    return (
      <ChartContainer>
        <ChartTitle>Average House Price: London vs. England vs. UK (Nov 2025)</ChartTitle>
        <ChartSubtitle>
          Once London's own sales are excluded from the England and UK totals, the remaining "typical" home is cheaper still - and London's premium widens further.
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${nWidth} ${premiumData.length * (nBarHeight + nSpacing) + 20}`}>
          {premiumData.map((d, i) => {
            const y = i * (nBarHeight + nSpacing) + 10;
            const barWidth = d.value * scale;
            const fill = d.highlighted ? 'url(#gold-gradient-nations)' : 'rgba(255, 255, 255, 0.15)';
            const border = d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.1)';
            const label = `£${d.value.toLocaleString()}`;
            return (
              <g key={d.area}>
                <text x={nPaddingLeft - 12} y={y + nBarHeight / 2 + 4} textAnchor="end" fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} fontFamily="Inter" fontSize="11" fontWeight={d.highlighted ? '600' : '400'}>
                  {d.area}
                </text>
                <rect
                  x={nPaddingLeft}
                  y={y}
                  width={barWidth}
                  height={nBarHeight}
                  rx="4"
                  fill={fill}
                  stroke={border}
                  strokeWidth={d.highlighted ? '1.5' : '0.5'}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={() => setHoveredNationBar(d.area)}
                  onMouseLeave={() => setHoveredNationBar(null)}
                />
                <text x={nPaddingLeft + barWidth + 8} y={y + nBarHeight / 2 + 4} fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'} fontFamily="Inter" fontSize="11" fontWeight={d.highlighted ? '600' : '400'} style={{ pointerEvents: 'none' }}>
                  {label}
                </text>
                {hoveredNationBar === d.area && (
                  <text x={nPaddingLeft + barWidth / 2} y={y + nBarHeight / 2 + 4} textAnchor="middle" fill={d.highlighted ? '#0a0d14' : '#ffffff'} fontFamily="Inter" fontSize="11" fontWeight="700" style={{ pointerEvents: 'none' }}>
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <linearGradient id="gold-gradient-nations" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(46, 75%, 42%)" />
              <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
            </linearGradient>
          </defs>
        </SVGContainer>
      </ChartContainer>
    );
  }

  // University of York, Centre for Housing Policy, "Overseas Investors in London's New
  // Build Housing Market" (June 2017), commissioned by the GLA. Overseas sales as a share
  // of all sales within each area, Land Registry data, April 2014 - March 2016.
  const overseasData = [
    { area: 'Outer London', value: 5.7, highlighted: false },
    { area: 'Kensington & Chelsea', value: 32.2, highlighted: false },
    { area: 'Westminster', value: 37.9, highlighted: false },
    { area: 'City of London', value: 40.8, highlighted: true },
  ];

  if (type === 'london-overseas') {
    const scale = (nWidth - nPaddingLeft - 60) / 45;
    return (
      <ChartContainer>
        <ChartTitle>Overseas Buyer Share of New-Build Sales, by Area (2014-2016)</ChartTitle>
        <ChartSubtitle>
          Overseas buying concentrates heavily in the three prime central boroughs - but London-wide, across all new-build sales, the overseas share was 13%.
        </ChartSubtitle>
        <SVGContainer viewBox={`0 0 ${nWidth} ${overseasData.length * (nBarHeight + nSpacing) + 20}`}>
          {overseasData.map((d, i) => {
            const y = i * (nBarHeight + nSpacing) + 10;
            const barWidth = d.value * scale;
            const fill = d.highlighted ? 'url(#gold-gradient-nations)' : 'rgba(255, 255, 255, 0.15)';
            const border = d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.1)';
            const label = `${d.value}%`;
            return (
              <g key={d.area}>
                <text x={nPaddingLeft - 12} y={y + nBarHeight / 2 + 4} textAnchor="end" fill={d.highlighted ? '#ffffff' : 'rgba(255, 255, 255, 0.7)'} fontFamily="Inter" fontSize="11" fontWeight={d.highlighted ? '600' : '400'}>
                  {d.area}
                </text>
                <rect
                  x={nPaddingLeft}
                  y={y}
                  width={barWidth}
                  height={nBarHeight}
                  rx="4"
                  fill={fill}
                  stroke={border}
                  strokeWidth={d.highlighted ? '1.5' : '0.5'}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseEnter={() => setHoveredNationBar(d.area)}
                  onMouseLeave={() => setHoveredNationBar(null)}
                />
                <text x={nPaddingLeft + barWidth + 8} y={y + nBarHeight / 2 + 4} fill={d.highlighted ? 'hsl(46, 65%, 52%)' : 'rgba(255, 255, 255, 0.8)'} fontFamily="Inter" fontSize="11" fontWeight={d.highlighted ? '600' : '400'} style={{ pointerEvents: 'none' }}>
                  {label}
                </text>
                {hoveredNationBar === d.area && (
                  <text x={nPaddingLeft + barWidth / 2} y={y + nBarHeight / 2 + 4} textAnchor="middle" fill={d.highlighted ? '#0a0d14' : '#ffffff'} fontFamily="Inter" fontSize="11" fontWeight="700" style={{ pointerEvents: 'none' }}>
                    {label}
                  </text>
                )}
              </g>
            );
          })}
          <defs>
            <linearGradient id="gold-gradient-nations" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="hsl(46, 75%, 42%)" />
              <stop offset="100%" stopColor="hsl(46, 65%, 52%)" />
            </linearGradient>
          </defs>
        </SVGContainer>
      </ChartContainer>
    );
  }

  return null;
};
