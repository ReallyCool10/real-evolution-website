import React from 'react';
import styled from 'styled-components';

const SolutionsContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const IntroSection = styled.div`
  text-align: left;
  margin-bottom: 3rem;
  
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
  }
`;

const SolutionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SolutionCard = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  text-align: left;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);

  &:hover {
    transform: translateY(-4px);
    border-color: rgba(212, 175, 55, 0.35);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    color: #ffffff;
    margin: 0 0 1rem 0;
    font-weight: 500;
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1.5rem;
  }
`;

const StatBadge = styled.span`
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid rgba(212, 175, 55, 0.3);
  color: hsl(46, 65%, 52%);
  padding: 0.35rem 0.75rem;
  border-radius: 6px;
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  font-weight: 600;
  letter-spacing: 1px;
  text-transform: uppercase;
  margin-bottom: 1rem;
  display: inline-block;
`;

const FlowDiagram = styled.div`
  margin: 1.5rem 0;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.04);
  border-radius: 8px;
  padding: 1rem;
  display: flex;
  justify-content: space-around;
  align-items: center;
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: #ffffff;

  @media (max-width: 480px) {
    flex-direction: column;
    gap: 0.5rem;
  }
`;

const FlowStep = styled.div`
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  text-align: center;
  font-weight: 500;
  width: 100px;

  @media (max-width: 480px) {
    width: 80%;
  }
`;

const FlowArrow = styled.span`
  color: hsl(46, 65%, 52%);
  font-weight: 700;

  @media (max-width: 480px) {
    transform: rotate(90deg);
  }
`;

const SectionSeparator = styled.hr`
  border: 0;
  height: 1px;
  background: linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.08) 50%, rgba(255, 255, 255, 0) 100%);
  margin: 4rem 0;
`;

const DetailTitle = styled.h3`
  font-family: 'Outfit', sans-serif;
  font-size: 1.8rem;
  color: #ffffff;
  font-weight: 500;
  margin-bottom: 1.5rem;
  text-align: left;
`;

const DetailContent = styled.div`
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 3rem;
  text-align: left;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const DetailText = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.8);

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

const SVGVisualizer = styled.svg`
  width: 100%;
  height: auto;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(0, 0, 0, 0.25);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
`;

export const SolutionsHub: React.FC = () => {
  return (
    <SolutionsContainer>
      <IntroSection>
        <h2>Strategic Explorations & Pathways</h2>
        <p>
          Our team investigates, models, and strategises how to maximize the utility of existing built assets. We analyze structural conversion and subdivision mechanisms as potential pathways to bypass traditional development gridlocks.
        </p>
      </IntroSection>

      <SolutionGrid>
        <SolutionCard>
          <div>
            <StatBadge>Conversion Exploration</StatBadge>
            <h3>Office-to-Residential Pathways</h3>
            <p>
              Investigating the macroeconomic viability of converting underutilized urban office shells (sitting at a 15.59% vacancy rate in major hubs) to expand density while protecting greenfield areas.
            </p>
            <FlowDiagram>
              <FlowStep>Vacant Shell</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Structural Study</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Residential Model</FlowStep>
            </FlowDiagram>
          </div>
        </SolutionCard>

        <SolutionCard>
          <div>
            <StatBadge>Regulatory Modeling</StatBadge>
            <h3>Permitted Development Rights</h3>
            <p>
              Simulating fast-track conversion pathways under Class E to Class C3 prior approval rules, analyzing how regulatory frameworks can reduce administrative lead times and planning rejections.
            </p>
            <FlowDiagram>
              <FlowStep>Class E Asset</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>PDR Prior Study</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Zoning Analysis</FlowStep>
            </FlowDiagram>
          </div>
        </SolutionCard>

        <SolutionCard>
          <div>
            <StatBadge>Spatial Simulations</StatBadge>
            <h3>Volumetric Reconfiguration</h3>
            <p>
              Modeling next-generation layouts that minimize private sleeping quarters to maximize flowing, open communal zones, investigating space efficiency improvements of up to 30%.
            </p>
            <FlowDiagram>
              <FlowStep>Rigid Divisions</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Open Grid Study</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Adaptive Living</FlowStep>
            </FlowDiagram>
          </div>
        </SolutionCard>

        <SolutionCard>
          <div>
            <StatBadge>Subdivision Studies</StatBadge>
            <h3>Duplex & Density Retrofits</h3>
            <p>
              Analyzing the potential of structurally subdividing oversized, underoccupied detached suburban dwellings in high-demand school catchments to double local density without altering neighborhood character.
            </p>
            <FlowDiagram>
              <FlowStep>Detached Unit</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Structural Split</FlowStep>
              <FlowArrow>→</FlowArrow>
              <FlowStep>Duplex Model</FlowStep>
            </FlowDiagram>
          </div>
        </SolutionCard>
      </SolutionGrid>

      <SectionSeparator />

      <DetailTitle>Strategic Analysis: Volumetric Reconfiguration</DetailTitle>
      <DetailContent>
        <DetailText>
          <p>
            Traditional UK housing development is anchored on outdated room models. Homes are often sold purely based on "bedroom counts" rather than spatial quality. This forces developers to subdivide apartments into multiple, tiny, dark bedrooms linked by inefficient corridors.
          </p>
          <p>
            Our strategic modeling explores **Volumetric Spatial Reconfiguration** as a theoretical design framework:
          </p>
          <ul>
            <li>
              <strong>Minimize Sleeping Quarters</strong>: Bedrooms are designed strictly for sleeping and storage, utilizing intelligent built-in sliding systems, maximizing vertical volume.
            </li>
            <li>
              <strong>Maximize Communal Space</strong>: The saved square footage is lifted into the main living, cooking, and dining area. The result is a large, expansive, light-filled environment.
            </li>
            <li>
              <strong>Adaptive Spatial Formats</strong>: A single occupancy floor plate can function seamlessly as a family dwelling. This is achieved by creating high-quality communal zones that allow families to spend their active time together in harmonious, open atmospheres.
            </li>
          </ul>
        </DetailText>

        <div>
          <SVGVisualizer viewBox="0 0 300 220">
            {/* Outline of floorplate */}
            <rect x="10" y="10" width="280" height="200" rx="8" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />
            <text x="20" y="28" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="Outfit" letterSpacing="1">ADAPTIVE FLOORPLATE GRID</text>
            
            {/* Communal Area - gold outline */}
            <rect x="20" y="40" width="160" height="150" rx="6" fill="rgba(212, 175, 55, 0.03)" stroke="hsl(46, 65%, 52%)" strokeWidth="1.5" />
            <text x="35" y="70" fill="#ffffff" fontSize="12" fontFamily="Outfit" fontWeight="600">COMMUNAL ZONE</text>
            <text x="35" y="85" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="Inter">Kitchen / Living / Dining</text>
            <text x="35" y="98" fill="rgba(255,255,255,0.6)" fontSize="9" fontFamily="Inter">Light-filled & Expansive</text>

            {/* Inefficient Corridor - cross out */}
            <line x1="20" y1="40" x2="180" y2="40" stroke="rgba(255,255,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />

            {/* Bedroom 1 */}
            <rect x="195" y="40" width="85" height="70" rx="4" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            <text x="205" y="65" fill="#ffffff" fontSize="9" fontFamily="Outfit">BEDROOM 1</text>
            <text x="205" y="78" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter">Compact & Cozy</text>
            
            {/* Bedroom 2 */}
            <rect x="195" y="120" width="85" height="70" rx="4" fill="rgba(255, 255, 255, 0.02)" stroke="rgba(255, 255, 255, 0.1)" strokeWidth="1" />
            <text x="205" y="145" fill="#ffffff" fontSize="9" fontFamily="Outfit">BEDROOM 2</text>
            <text x="205" y="158" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="Inter">Built-in Storage</text>

            {/* Sliding partitions */}
            <line x1="190" y1="40" x2="190" y2="190" stroke="hsl(46, 65%, 52%)" strokeWidth="1.5" strokeDasharray="2 2" />
            <circle cx="190" cy="115" r="3" fill="hsl(46, 65%, 52%)" />
            <text x="180" y="118" fill="hsl(46, 65%, 52%)" fontSize="7" fontFamily="Inter" textAnchor="end">SLIDING WALL</text>
          </SVGVisualizer>
        </div>
      </DetailContent>
    </SolutionsContainer>
  );
};
