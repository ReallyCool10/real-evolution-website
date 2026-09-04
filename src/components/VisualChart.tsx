import React, { useState } from 'react';
import styled from 'styled-components';

interface ChartProps {
  type: 'deficit' | 'quality' | 'affordability' | 'sutherland';
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

  if (type === 'deficit') {
    // Dwellings per 1,000 inhabitants. England (434) and OECD average (487) are from HBF
    // Housing Horizons (Oct 2023, 2020 data). All other countries are from the OECD
    // Affordable Housing Database, Table HM1.1.A1 (latest available year: 2022, except
    // Japan which is 2018). Sorted ascending by value.
    const data = [
      { country: 'United States', value: 428, highlighted: false },
      { country: 'England', value: 434, highlighted: true },
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
          England holds fewer dwellings per head of population than most comparable developed nations.
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

  // default to affordability: 1995 vs 2025 comparison
  const wagesData = [
    { year: '1995', value: 100, label: 'Average Wage: 1.0x' },
    { year: '2025', value: 212, label: 'Average Wage: 2.1x (+112%)' },
  ];
  const houseData = [
    { year: '1995', value: 100, label: 'Average House Price: 1.0x' },
    { year: '2025', value: 525, label: 'Average House Price: 5.3x (+425%)' },
  ];

  const chartHeight = 220;
  const paddingBottom = 40;
  const paddingTop = 30;
  const chartWidth = 500;
  const startX = 60;
  const endX = chartWidth - 80;
  const maxVal = 600;
  const scale = (chartHeight - paddingTop - paddingBottom) / maxVal;

  const yWages95 = chartHeight - paddingBottom - wagesData[0].value * scale;
  const yWages25 = chartHeight - paddingBottom - wagesData[1].value * scale;
  const yHouse95 = chartHeight - paddingBottom - houseData[0].value * scale;
  const yHouse25 = chartHeight - paddingBottom - houseData[1].value * scale;

  return (
    <ChartContainer style={{ position: 'relative' }}>
      <ChartTitle>Wage Growth vs. House Price Inflation (1995 - 2025)</ChartTitle>
      <ChartSubtitle>
        In 2025 the median home in England cost 7.6 times median annual earnings (£300,000 against £39,300), roughly double the ratio when the ONS series began in 1997.
      </ChartSubtitle>
      <SVGContainer viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%">
        {/* Y Axis grid */}
        {[100, 200, 300, 400, 500, 600].map((v) => {
          const y = chartHeight - paddingBottom - v * scale;
          return (
            <g key={v}>
              <line
                x1={startX}
                y1={y}
                x2={endX}
                y2={y}
                stroke="rgba(255, 255, 255, 0.04)"
                strokeWidth="1"
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

        {/* X Axis labels */}
        <text x={startX + 30} y={chartHeight - paddingBottom + 25} fill="#ffffff" fontFamily="Inter" fontSize="12" fontWeight="600">
          Year 1995 (Baseline: 100%)
        </text>
        <text x={endX - 30} y={chartHeight - paddingBottom + 25} fill="#ffffff" fontFamily="Inter" fontSize="12" fontWeight="600" textAnchor="end">
          Year 2025
        </text>

        {/* WAGES LINE */}
        <line
          x1={startX + 40}
          y1={yWages95}
          x2={endX - 40}
          y2={yWages25}
          stroke="rgba(255, 255, 255, 0.4)"
          strokeWidth="2.5"
          strokeDasharray="4 4"
        />
        {/* WAGES DOTS */}
        <circle
          cx={startX + 40}
          cy={yWages95}
          r="5"
          fill="#c0c0c0"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="1"
          style={{ cursor: 'pointer' }}
          onMouseMove={(e) => handleMouseMove(e, 'Wages 1995', 'Baseline 100%')}
          onMouseLeave={handleMouseLeave}
        />
        <circle
          cx={endX - 40}
          cy={yWages25}
          r="5"
          fill="#c0c0c0"
          stroke="rgba(255, 255, 255, 0.8)"
          strokeWidth="1"
          style={{ cursor: 'pointer' }}
          onMouseMove={(e) => handleMouseMove(e, 'Wages 2025', '212% (+112% growth)')}
          onMouseLeave={handleMouseLeave}
        />
        <text x={endX - 25} y={yWages25 + 4} fill="rgba(255, 255, 255, 0.6)" fontFamily="Inter" fontSize="11" textAnchor="start">
          Wages (2.1x)
        </text>

        {/* HOUSE PRICES LINE */}
        <line
          x1={startX + 40}
          y1={yHouse95}
          x2={endX - 40}
          y2={yHouse25}
          stroke="hsl(46, 65%, 52%)"
          strokeWidth="3.5"
        />
        {/* HOUSE PRICES DOTS */}
        <circle
          cx={startX + 40}
          cy={yHouse95}
          r="6"
          fill="hsl(46, 65%, 52%)"
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ cursor: 'pointer' }}
          onMouseMove={(e) => handleMouseMove(e, 'House Prices 1995', 'Baseline 100%')}
          onMouseLeave={handleMouseLeave}
        />
        <circle
          cx={endX - 40}
          cy={yHouse25}
          r="6"
          fill="hsl(46, 65%, 52%)"
          stroke="#ffffff"
          strokeWidth="1.5"
          style={{ cursor: 'pointer' }}
          onMouseMove={(e) => handleMouseMove(e, 'House Prices 2025', '525% (+425% growth)')}
          onMouseLeave={handleMouseLeave}
        />
        <text x={endX - 25} y={yHouse25 + 4} fill="hsl(46, 65%, 52%)" fontFamily="Inter" fontSize="11" fontWeight="600" textAnchor="start">
          House Prices (5.3x)
        </text>
      </SVGContainer>
      {hoveredBar && (
        <Tooltip visible={true} x={hoveredBar.x} y={hoveredBar.y}>
          {hoveredBar.id}: <strong>{hoveredBar.val}</strong>
        </Tooltip>
      )}
    </ChartContainer>
  );
};
