import React, { useRef } from 'react';
import styled from 'styled-components';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import textLogo from './assets/real-evolution-logo.svg';
import Articles from './pages/Articles';
import Contact from './pages/Contact';
import Navigation from './components/Navigation';

const PageContainer = styled.div`
  min-height: 100vh;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background: linear-gradient(180deg, white 0%, #1E40AF 100%);
  color: white;
`;

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const Section = styled.section`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  scroll-snap-align: start;
`;

const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const HomeContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 2rem;
`;

const LogoContainer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 3rem;
  transform: translateX(50px);
`;

const HomeLogo = styled.img`
  width: 100%;
  max-width: 1033.59px;
  height: auto;
`;

const HeroTitle = styled.h1`
  font-size: 4rem;
  margin-bottom: 1rem;
  font-weight: 800;
`;

const HeroSubtitle = styled.p`
  font-size: 1.5rem;
  max-width: 600px;
  margin-bottom: 2rem;
  opacity: 0.9;
`;

const ScrollIndicator = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;

const ArrowDown = styled.div`
  width: 20px;
  height: 20px;
  border-right: 3px solid white;
  border-bottom: 3px solid white;
  transform: rotate(45deg);
`;

const AboutSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
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
`;

const Home: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);

  const scrollToAbout = () => {
    aboutRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollContainer>
      <Section>
        <HomeContent>
          <LogoContainer>
            <HomeLogo src={textLogo} alt="Real Evolution Logo" />
          </LogoContainer>
          <HeroTitle>Unlocking Property's True Potential</HeroTitle>
          <HeroSubtitle>
            Creating great homes for real people in top locations
          </HeroSubtitle>
        </HomeContent>
        <ScrollIndicator onClick={scrollToAbout}>
          <ArrowDown />
        </ScrollIndicator>
      </Section>
      <Section ref={aboutRef}>
        <AboutSection>
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
        </AboutSection>
      </Section>
    </ScrollContainer>
  );
};

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <PageContainer>
      <Navigation />
      <ContentWrapper>
        {children}
      </ContentWrapper>
    </PageContainer>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/articles" element={<Layout><Articles /></Layout>} />
        <Route path="/contact" element={<Layout><Contact /></Layout>} />
      </Routes>
    </Router>
  );
};

export default App;
