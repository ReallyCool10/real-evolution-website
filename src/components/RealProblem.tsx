import React from 'react';
import styled, { keyframes } from 'styled-components';

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ProblemContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;
  animation: ${fadeIn} 0.5s ease-out;

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
  gap: 3.5rem;
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

  blockquote {
    border-left: 3px solid hsl(46, 65%, 52%);
    background: rgba(255, 255, 255, 0.02);
    padding: 1.25rem 1.75rem;
    margin: 2.5rem 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #ffffff;
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
    display: block;
    font-family: 'Outfit', sans-serif;
    font-size: 1.2rem;
    font-weight: 600;
    color: hsl(46, 65%, 52%);
    margin: 0.75rem 0;
  }

  .desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.7;
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
        <span>The Systemic Crisis</span>
        <h2>The REAL Problem</h2>
      </HeaderSection>

      <ContentGrid>
        <MainText>
          <p>
            The UK housing sector is in the grip of a quiet stagnation. For decades, political and economic debates have treated housing as a simple commodity market, ignoring the systemic architectural, legal, and operational gridlocks that stifle our built environment. 
          </p>
          <p>
            This crisis is characterized not only by high prices, but by a deeper, structural failure of supply, quality, and transactional trust that drains the lifeblood out of families, businesses, and the entire nation.
          </p>

          <blockquote>
            "The housing crisis is not a singular event - it is a continuous systemic drag. It devalues wages, locks talent out of high-productivity areas, and anchors our national GDP growth."
          </blockquote>

          <h3>1. The Scarcity Matrix</h3>
          <p>
            The most immediate symptom of this broken system is absolute supply scarcity. The UK built environment is severely under-built compared to its European counterparts. This manufactured scarcity acts as an artificial price support mechanism, forcing citizens into high-density, low-quality arrangements simply to secure shelter.
          </p>
          <p>
            With completions lagging behind demographic growth, the gap between home seekers and available dwellings continues to widen, creating a permanent seller's market that isolates families from housing security.
          </p>

          <h3>2. The Quality Decay</h3>
          <p>
            The quality of UK housing stock is failing. The UK possesses the oldest, least insulated housing stock in Europe, leaving families deeply vulnerable to rising energy costs and supply shocks.
          </p>
          <p>
            Cold, drafty, and damp buildings lead directly to significant public health expenses, placing a multi-billion-pound burden on the NHS for treatable cardiovascular and respiratory illnesses. Furthermore, the massive carbon footprint of these uninsulated shells represents the single greatest obstacle to achieving structural carbon net-zero.
          </p>

          <h3>3. The Conveyancing Collapse</h3>
          <p>
            The process of buying and selling a home in the UK is characterized by extreme friction and a structural lack of trust. The typical transaction is slow, manual, and highly adversarial.
          </p>
          <p>
            Approximately 30% of all sales fall through before completion, trapping buyers and sellers in stressful onward chains and causing hundreds of thousands of pounds in non-recoverable losses every year. This friction is compounded by a parasitic middleman network that extracts billions in transactional fees for low-value, administrative tasks.
          </p>
        </MainText>

        <SidebarMetrics>
          <MetricCard>
            <span className="label">Transaction Failures</span>
            <span className="number">30%</span>
            <span className="desc">Of all property purchases collapse before completion, wasting millions in unrecoverable legal and survey fees.</span>
          </MetricCard>

          <MetricCard>
            <span className="label">Housing Stock Quality</span>
            <span className="number">15%</span>
            <span className="desc">Of English homes fail to meet the Decent Homes Standard, representing the highest proportion of substandard stock in Europe.</span>
          </MetricCard>

          <MetricCard>
            <span className="label">The Transactional Drag</span>
            <span className="number">£9 Billion+</span>
            <span className="desc">Extracted annually in estate agent commissions, conveyancing fees, and mortgage broker charges, diverting capital away from the productive economy.</span>
          </MetricCard>
        </SidebarMetrics>
      </ContentGrid>
      
      <SectionSeparator />
    </ProblemContainer>
  );
};
