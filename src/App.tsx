import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';

import backgroundImage from './assets/BackgroundImage.png';
import Navigation from './components/Navigation';
import { RealProblem } from './components/RealProblem';
import { RealNumbers } from './components/RealNumbers';
import { ResearchHub } from './components/ResearchHub';

import { PartnerPortal } from './components/PartnerPortal';
import { InteractiveIntake } from './components/InteractiveIntake';
import { LandUseMap } from './components/LandUseMap';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  font-family: 'Inter', sans-serif;
  position: relative;
  color: #ffffff;
  background-color: hsl(220, 20%, 6%);
  overflow-x: hidden;
  box-sizing: border-box;

  * {
    box-sizing: border-box;
  }
`;

const BackgroundContainer = styled.div<{ activeTab: string }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Only display the architectural background photo on the landing Home page */
  background-image: ${props => (props.activeTab === 'home' ? `url(${backgroundImage})` : 'none')};
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: 1;
  filter: brightness(0.55) contrast(1.15);
  pointer-events: none;
  transition: opacity 0.4s ease;
  opacity: ${props => (props.activeTab === 'home' ? 1 : 0)};
`;

const BackgroundOverlay = styled.div<{ activeTab: string }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 2; /* Sits on top of the image container, but behind page content */
  pointer-events: none;
  /* Fades into a rich, deep celestial twilight sky blue gradient (matching the building's sky) on other pages, flowing from top to bottom */
  background: ${props =>
    props.activeTab === 'home'
      ? `
        radial-gradient(circle at top right, rgba(212, 175, 55, 0.08) 0%, rgba(10, 13, 20, 0) 55%),
        linear-gradient(
          to bottom,
          rgba(10, 13, 20, 0.05) 0%,
          rgba(10, 13, 20, 0.55) 45%,
          rgba(10, 13, 20, 0.98) 100%
        );
      `
      : `
        radial-gradient(circle at top right, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0) 65%),
        linear-gradient(to bottom, hsl(212, 50%, 20%) 0%, hsl(220, 38%, 7%) 100%)
      `};
  transition: background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

const MainContent = styled.main<{ activeTab: string }>`
  position: relative;
  z-index: 2;
  padding-top: ${props => (props.activeTab === 'home' ? '100px' : '2.5rem')};
  padding-bottom: ${props => (props.activeTab === 'home' ? '5rem' : '3.5rem')};
  padding-left: ${props => (props.activeTab === 'home' ? '0' : '1.5rem')};
  padding-right: ${props => (props.activeTab === 'home' ? '0' : '1.5rem')};
  width: 100%;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  /* Keeps non-home tabs centered and responsive, without wrapping them in an outer card */
  ${props =>
    props.activeTab !== 'home' &&
    `
      max-width: 1100px;
      margin: 110px auto 5rem auto;
      
      @media (max-width: 1150px) {
        max-width: calc(100% - 3rem);
      }
      @media (max-width: 580px) {
        max-width: calc(100% - 1.5rem);
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        margin-top: 95px;
      }
    `}
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(15px); }
  to { opacity: 1; transform: translateY(0); }
`;

const ViewWrapper = styled.div`
  animation: ${fadeIn} 0.5s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
  width: 100%;
`;

// ==================== HOME VIEW COMPONENTS ====================

const HomeContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 0 2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroArea = styled.section`
  min-height: calc(80vh - 100px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem 0;
  margin-bottom: 2rem;
`;



const MainTagline = styled.h1`
  font-family: 'Outfit', sans-serif;
  font-size: 3.2rem;
  line-height: 1.25;
  font-weight: 500;
  color: #ffffff;
  max-width: 850px;
  margin: 0 0 1.5rem 0;

  @media (max-width: 768px) {
    font-size: 2.2rem;
  }
`;

const HeroSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 1.25rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 650px;
  margin: 0 0 3rem 0;
  font-weight: 300;

  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 2rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1.5rem;

  @media (max-width: 480px) {
    flex-direction: column;
    width: 100%;
    gap: 1rem;
  }
`;

const PrimaryButton = styled.button`
  font-family: 'Outfit', sans-serif;
  background: hsl(46, 65%, 52%);
  color: #0a0d14;
  border: none;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  box-shadow: 0 4px 20px rgba(212, 175, 55, 0.2);

  &:hover {
    background: hsl(46, 75%, 42%);
    transform: translateY(-2px);
    box-shadow: 0 6px 24px rgba(212, 175, 55, 0.3);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.button`
  font-family: 'Outfit', sans-serif;
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: #ffffff;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.06);
    border-color: #ffffff;
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  color: #ffffff;
  font-weight: 500;
  margin-top: 4rem;
  margin-bottom: 1rem;
  text-align: center;
`;

const SectionDesc = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  color: rgba(255, 255, 255, 0.6);
  max-width: 820px;
  margin: 0 auto 3rem auto;
  text-align: center;
  line-height: 1.5;
`;

const GapGrid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  width: 100%;
  margin-bottom: 6rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const GapCard = styled.div`
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
  gap: 1rem;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.35);

  &:hover {
    transform: translateY(-3px);
    border-color: rgba(212, 175, 55, 0.35);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    color: #ffffff;
    margin: 0;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.75rem;

    svg {
      color: hsl(46, 65%, 52%);
      width: 20px;
      height: 20px;
    }
  }

  p {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    line-height: 1.6;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
  }
`;

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('home');

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ViewWrapper>
            <HomeContainer>
              <HeroArea>
                <MainTagline>
                  Evolving the UK Built Environment.
                </MainTagline>
                <HeroSubtitle>
                  Examining the data behind the UK's housing shortage and the untapped opportunities to transform it.
                </HeroSubtitle>
                <ButtonGroup>
                  <PrimaryButton onClick={() => setActiveTab('problem')}>
                    Explore The REAL Problem
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setActiveTab('numbers')}>
                    View The REAL Numbers
                  </SecondaryButton>
                </ButtonGroup>
              </HeroArea>

              <SectionTitle>The Systemic Drag</SectionTitle>
              <SectionDesc>
                The housing crisis acts as a systemic anchor on the UK economy, stalling GDP and productivity growth. We pioneer research and strategy in order to find REAL solutions.
              </SectionDesc>

              <GapGrid>
                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a4 4 0 00-8 0v10a2 2 0 002 2h6M6 12h8" />
                    </svg>
                    The GDP & Prosperity Drag
                  </h3>
                  <p>
                    With average house prices up over 400% in 30 years vs stagnant real wage growth, families allocate up to 50% of disposable income to rent and mortgages, draining local businesses, services, and the real economy.
                  </p>
                </GapCard>

                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 17l6-6 4 4 6-6M16 9h4v4" />
                    </svg>
                    The Productivity & Talent Gap
                  </h3>
                  <p>
                    Skilled workers are priced out of high-productivity urban employment hubs. Gruelling commutes and spatial mismatch exhaust the workforce, acting as a direct driver of the UK's productivity trap.
                  </p>
                </GapCard>

                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    The Quality & Energy Gap
                  </h3>
                  <p>
                    The UK housing stock is the oldest in Europe, with 15% failing the Decent Homes Standard. Damp, cold homes trigger billions in NHS expenses and serve as a major structural hurdle to domestic carbon net-zero.
                  </p>
                </GapCard>

                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    The Transactional Friction Drag
                  </h3>
                  <p>
                    Buying a home takes six months on average, with around 24% of all transactions collapsing before completion. Outdated onward chains and hidden defects result in approximately 250,000 aborted sales annually, wasting millions in legal fees.
                  </p>
                </GapCard>
              </GapGrid>
            </HomeContainer>
          </ViewWrapper>
        );
      case 'problem':
        return (
          <ViewWrapper>
            <RealProblem />
          </ViewWrapper>
        );
      case 'numbers':
        return (
          <ViewWrapper>
            <RealNumbers />
          </ViewWrapper>
        );
      case 'articles':
        return (
          <ViewWrapper>
            <ResearchHub />
          </ViewWrapper>
        );
      case 'landuse':
        return (
          <ViewWrapper>
            <LandUseMap />
          </ViewWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <BackgroundContainer activeTab={activeTab} />
      <BackgroundOverlay activeTab={activeTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <MainContent activeTab={activeTab}>{renderActiveView()}</MainContent>
    </PageContainer>
  );
};

export default App;
