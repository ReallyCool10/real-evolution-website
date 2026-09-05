import React from 'react';
import styled from 'styled-components';

const AboutContainer = styled.div`
  width: 100%;
  padding: 2rem 0;
`;

const Content = styled.div`
  max-width: 820px;
  margin: 0 auto;
`;

const TextSection = styled.div`
  text-align: left;
  
  h2 {
    font-size: 2.5rem;
    margin-bottom: 2rem;
    font-weight: 700;
    background: linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  p {
    font-size: 1.1rem;
    line-height: 1.8;
    margin-bottom: 2rem;
    opacity: 0.9;
    letter-spacing: 0.3px;
  }

  p:last-child {
    margin-bottom: 0;
  }
`;

const About: React.FC = () => {
  return (
    <AboutContainer>
      <Content>
        <TextSection>
          <h2>Purpose</h2>
          <p>
            Addressing the UK's housing shortage isn't only about getting new homes built. It's also
            about the utilisation of the existing built environment. REAL evolution researches the
            potential of bringing underused and vacant assets into productive use.
          </p>
          <p>
            Our work spans research and modelling, tracking vacant commercial stock suited to
            residential use, and mapping land use against demographic pressure.
          </p>
          <p>
            We're looking for partners: property owners, investors, and policymakers who see the same
            opportunity - that solving the housing crisis depends as much on using what already
            exists as it does on building new.
          </p>
        </TextSection>
      </Content>
    </AboutContainer>
  );
};

export default About;
