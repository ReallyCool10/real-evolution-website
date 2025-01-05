import React from 'react';
import styled from 'styled-components';

const AboutContainer = styled.div`
  width: 100%;
  padding: 2rem 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  padding: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
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

const ImageSection = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
`;

const ImagePlaceholder = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  aspect-ratio: 4/3;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(5px);
  transition: transform 0.3s ease;

  &:hover {
    transform: scale(1.02);
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
            In a nation where housing shortages persist and older buildings languish, we're pioneering 
            a technology-driven approach that bridges the gap between preservation and progress. Our 
            digital twin platform doesn't just map buildings; it unlocks their potential, guiding 
            intelligent development decisions that honor architectural heritage while meeting modern 
            housing needs. This synthesis of innovation and tradition enables us to optimize existing 
            spaces, revitalize neglected properties, and create homes that enrich communities.
          </p>
          <p>
            We're seeking visionary partners who recognize that the future of real estate lies not 
            just in new construction, but in the intelligent transformation of our existing architectural 
            landscape. Together, we can address housing challenges while preserving the character that 
            makes our cities unique, creating value that extends beyond financial returns to the very 
            fabric of urban life.
          </p>
        </TextSection>
        <ImageSection>
          <ImagePlaceholder>Building 1</ImagePlaceholder>
          <ImagePlaceholder>Building 2</ImagePlaceholder>
          <ImagePlaceholder>Building 3</ImagePlaceholder>
          <ImagePlaceholder>Building 4</ImagePlaceholder>
        </ImageSection>
      </Content>
    </AboutContainer>
  );
};

export default About;
