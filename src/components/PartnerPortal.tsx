import React from 'react';
import styled from 'styled-components';

interface PartnerPortalProps {
  onStartIntake: () => void;
}

const PortalContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const HeroSection = styled.div`
  text-align: left;
  margin-bottom: 3.5rem;
  
  h2 {
    font-family: 'Outfit', sans-serif;
    font-size: 2.2rem;
    color: #ffffff;
    font-weight: 500;
    margin-bottom: 1rem;
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    max-width: 800px;
    margin-bottom: 2rem;
  }
`;

const CTAButton = styled.button`
  font-family: 'Outfit', sans-serif;
  background: hsl(46, 65%, 52%);
  color: #0a0d14;
  border: none;
  padding: 1rem 2.25rem;
  font-size: 1.05rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);

  &:hover {
    background: hsl(46, 75%, 42%);
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(212, 175, 55, 0.4);
  }
`;

const ModelGrid = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  margin-bottom: 4rem;
  text-align: left;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 2rem;
  }
`;

const ModelText = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.5rem;
    color: #ffffff;
    margin-top: 0;
    margin-bottom: 1rem;
    font-weight: 500;
  }

  p {
    margin-bottom: 1.5rem;
  }

  ul {
    padding-left: 1.25rem;
    margin-bottom: 1.5rem;

    li {
      margin-bottom: 0.75rem;
    }
  }
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.5rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  .label {
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    color: rgba(255, 255, 255, 0.5);
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .number {
    font-family: 'Outfit', sans-serif;
    font-size: 2.2rem;
    font-weight: 600;
    color: hsl(46, 65%, 52%);
  }

  .desc {
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.7);
    line-height: 1.4;
  }
`;

const SectionSeparator = styled.hr`
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0) 100%);
  margin: 4rem 0;
`;

const TimelineTitle = styled.h3`
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 2.5rem;
  text-align: left;
`;

const TimelineContainer = styled.div`
  position: relative;
  max-width: 800px;
  margin: 0 auto;
  text-align: left;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 20px;
    width: 2px;
    background: rgba(255, 255, 255, 0.08);
  }
`;

const TimelineItem = styled.div`
  position: relative;
  padding-left: 50px;
  margin-bottom: 2.5rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const TimelineDot = styled.div<{ active?: boolean }>`
  position: absolute;
  left: 11px;
  top: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: ${props => (props.active ? 'hsl(46, 65%, 52%)' : '#0a0d14')};
  border: 2px solid ${props => (props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.2)')};
  z-index: 2;
  box-shadow: ${props => (props.active ? '0 0 10px rgba(212, 175, 55, 0.5)' : 'none')};
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Outfit', sans-serif;
  font-size: 10px;
  font-weight: 600;
  color: ${props => (props.active ? '#0a0d14' : 'rgba(255, 255, 255, 0.4)')};
`;

const TimelineContent = styled.div`
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 1.5rem;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);

  h4 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.15rem;
    color: #ffffff;
    margin: 0 0 0.5rem 0;
    font-weight: 500;
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    line-height: 1.5;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
`;

export const PartnerPortal: React.FC<PartnerPortalProps> = ({ onStartIntake }) => {
  return (
    <PortalContainer>
      <HeroSection>
        <h2>Strategic Coalition & Research Sponsorship</h2>
        <p>
          We collaborate with research institutions, policy organizations, underutilized asset holders, and strategic sponsors to investigate macroeconomic built environment bottlenecks. Together, we co-author feasibility studies and model high-performance volumetric space strategies.
        </p>
        <CTAButton onClick={onStartIntake}>Initiate Strategic Research Alignment</CTAButton>
      </HeroSection>

      <SectionSeparator />

      <ModelGrid>
        <ModelText>
          <h3>Our Academic & Feasibility Modeling Framework</h3>
          <p>
            Real Evolution bridges the gap between academic macroeconomic theory and actionable, spatial-engineering strategy. We explore how planning stagnation, zoning mismatches, and outdated building footprints act as a continuous anchor on national GDP and social well-being.
          </p>
          <p>
            Our research projects model the systemic re-use of vacant building shells, leveraging Class E vacancies and Permitted Development Rights (PDR) to study next-generation spatial models:
          </p>
          <ul>
            <li>
              <strong>Spatial Grid Modeling</strong>: Simulating adaptive floorplates and high-performance volumetric layouts to double local occupant utility without greenfield sprawl.
            </li>
            <li>
              <strong>Regulatory Feasibility</strong>: Analyzing Class E to C3 prior-approval constraints to map administrative friction and identify pathways for faster structural conversions.
            </li>
            <li>
              <strong>Energy Performance Studies</strong>: Modeling structural retrofitting (ventilation, thermal insulation, and heat pumps) to transition outdated commercial envelopes into highly efficient homes.
            </li>
          </ul>
        </ModelText>

        <StatCard>
          <StatItem>
            <span className="label">Asset Feasibility Simulations</span>
            <span className="number">Class E Audit</span>
            <span className="desc">Simulating prior-approval compatibility for empty office blocks in urban cores.</span>
          </StatItem>
          <StatItem>
            <span className="label">Energy Efficiency Research</span>
            <span className="number">EPC A/B Gaps</span>
            <span className="desc">Modeling thermal envelope upgrades and heat pump pathways to eliminate heating drafts.</span>
          </StatItem>
          <StatItem>
            <span className="label">Policy Blueprint Focus</span>
            <span className="number">Open Source</span>
            <span className="desc">Publishing adaptive design catalogs and demographic impact maps for municipal planners.</span>
          </StatItem>
        </StatCard>
      </ModelGrid>

      <SectionSeparator />

      <TimelineTitle>Strategic Exploration & Coalition Timeline</TimelineTitle>
      <TimelineContainer>
        <TimelineItem>
          <TimelineDot active>1</TimelineDot>
          <TimelineContent>
            <h4>Macro Asset Auditing & Suitability study (Month 1)</h4>
            <p>
              Underutilized urban commercial office assets are audited. We verify structural suitability, column grids, and legislative designations for spatial feasibility studies.
            </p>
          </TimelineContent>
        </TimelineItem>

        <TimelineItem>
          <TimelineDot active>2</TimelineDot>
          <TimelineContent>
            <h4>Volumetric Layout Simulation (Months 2 - 3)</h4>
            <p>
              Architects simulate adaptive layout options. Outdated corridors are eliminated in modeling, maximizing open communal spaces while optimizing functional sleeping quarters.
            </p>
          </TimelineContent>
        </TimelineItem>

        <TimelineItem>
          <TimelineDot>3</TimelineDot>
          <TimelineContent>
            <h4>Regulatory Analysis & Planning Simulations (Months 4 - 5)</h4>
            <p>
              We run simulated Class E to C3 prior approval submissions, compiling datasets on planning board response times, documentation demands, and systemic hurdles.
            </p>
          </TimelineContent>
        </TimelineItem>

        <TimelineItem>
          <TimelineDot>4</TimelineDot>
          <TimelineContent>
            <h4>Acoustic & Energy Efficiency Modeling (Months 6 - 9)</h4>
            <p>
              We model dry-fit modular partitions and eco-friendly services. Computer simulations run air circulation, acoustic decoupling, and thermal performance assessments.
            </p>
          </TimelineContent>
        </TimelineItem>

        <TimelineItem>
          <TimelineDot>5</TimelineDot>
          <TimelineContent>
            <h4>Coalition Assembly & Publication (Month 10)</h4>
            <p>
              We compile peer-reviewed whitepapers and present spatial strategy blueprints to academic, policy, and municipal stakeholders to drive structural grid reform.
            </p>
          </TimelineContent>
        </TimelineItem>
      </TimelineContainer>
    </PortalContainer>
  );
};
