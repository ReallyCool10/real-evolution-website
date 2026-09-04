import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ProblemContainer = styled.div`
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  animation: ${fadeIn} 0.5s ease-out;
  box-sizing: border-box;

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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 7rem;
  text-align: left;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const MainText = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);

  p {
    margin-bottom: 1.75rem;
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    color: #ffffff;
    margin: 2.5rem 0 1rem 0;
    font-weight: 500;
  }
`;

const SidebarMetrics = styled.aside`
  display: flex;
  flex-direction: column;
  gap: 2rem;
`;

const MetricCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem 2rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);

  .label {
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1.5px;
    line-height: 1.6;
  }

  .number {
    font-family: 'Outfit', sans-serif;
    font-size: 1.35rem;
    font-weight: 700;
    color: hsl(46, 65%, 52%);
    margin-right: 0.4rem;
  }

  .desc {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.75;
    margin: 0.75rem 0 0 0;
  }
`;

const SectionSeparator = styled.hr`
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0) 100%);
  margin: 4rem 0;
`;

export const RealProblem: React.FC = () => {
  return (
    <ProblemContainer>
      <HeaderSection>
        <h2>The REAL Problem</h2>
      </HeaderSection>

      <ContentGrid>
        <MainText>
          <p>
            The UK housing sector has stagnated for decades. Political and economic debates have treated housing as a simple commodity market, overlooking the architectural, legal, and operational constraints that limit our built environment.
          </p>
          <p>
            This isn't only about high prices. It reflects a deeper failure of supply, quality, and transactional trust, one that costs families, businesses, and the wider economy every year.
          </p>

          <h3>1. The Scarcity Matrix</h3>
          <p>
            The most immediate symptom is straightforward supply scarcity. The UK builds fewer homes than its European counterparts. That shortage is one lever keeping prices high; the UK's limited supply of developable land is another. Together they leave many households with less space, or fewer options, than they would otherwise choose.
          </p>
          <p>
            With completions lagging behind demographic growth, the gap between home seekers and available dwellings continues to widen, creating a permanent seller's market that isolates families from housing security.
          </p>

          <h3>2. The Quality Gap</h3>
          <p>
            UK housing quality lags behind. The UK has the oldest, least insulated housing stock in Europe, leaving families exposed to rising energy costs and supply shocks.
          </p>
          <p>
            Cold, damp buildings drive significant public health costs, placing a multi-billion-pound burden on the NHS for treatable cardiovascular and respiratory illness. Their carbon footprint is also one of the biggest obstacles to reaching carbon net-zero.
          </p>

          <h3>3. The Conveyancing Bottleneck</h3>
          <p>
            Buying and selling a home in the UK involves significant friction and a structural lack of trust. The typical transaction is slow, largely manual, and gives neither side binding commitment until exchange.
          </p>
          <p>
            Roughly a quarter of agreed sales fall through before completion, with more than 300,000 failed transactions recorded across 2025. Each failure leaves buyers and sellers with non-recoverable survey, legal, and mortgage fees, and across the market those costs run into hundreds of millions of pounds a year. A fragmented intermediary system adds further cost for largely administrative work.
          </p>
        </MainText>

        <SidebarMetrics>
          <MetricCard>
            <span className="label">Transaction Failures</span>
            <p className="desc"><span className="number">~24%</span>of agreed sales collapse before completion, wasting millions in unrecoverable legal and survey fees.</p>
          </MetricCard>

          <MetricCard>
            <span className="label">Housing Stock Quality</span>
            <p className="desc"><span className="number">15%</span>of English homes fail to meet the Decent Homes Standard, with private renters worst affected at 21%.</p>
          </MetricCard>

          <MetricCard>
            <span className="label">The Transactional Drag</span>
            <p className="desc"><span className="number">£9 Billion+</span>in estate agent commissions, conveyancing fees, and mortgage broker charges divert capital away from the productive economy.</p>
          </MetricCard>
        </SidebarMetrics>
      </ContentGrid>
      
      <SectionSeparator />
    </ProblemContainer>
  );
};
