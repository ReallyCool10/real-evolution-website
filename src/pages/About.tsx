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
          <h2>Our Vision</h2>
          <p>
            At REAL evolution, we envision a future where every building reaches its fullest potential, 
            where derelict spaces transform into vibrant homes, and where iconic architecture finds 
            new purpose for generations to come. Our mission transcends traditional property development – 
            we're creating a digital framework that reimagines how we interact with, develop, and 
            preserve our built environment.
          </p>
          <p>
            In a nation where housing shortages persist and older buildings sit unused, we're pioneering
            a technology-driven approach that bridges the gap between preservation and progress. Our
            digital twin platform doesn't just map buildings; it shows what they could become, guiding
            intelligent development decisions that honor architectural heritage while meeting modern
            housing needs. This combination of innovation and tradition lets us optimize existing
            spaces, revitalize neglected properties, and create homes that enrich communities.
          </p>
          <p>
            We're seeking partners who recognize that the future of real estate lies not
            just in new construction, but in the intelligent transformation of our existing buildings.
            Together, we can address housing challenges while preserving the character that
            makes our cities unique, creating value that extends beyond financial returns to the
            fabric of urban life.
          </p>
        </TextSection>
      </Content>
    </AboutContainer>
  );
};

export default About;
