import React, { useState, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';

import backgroundImage0 from './assets/BackgroundImage.jpg';
import backgroundImage2 from './assets/BackgroundImage_2.jpg';
import backgroundImage3 from './assets/BackgroundImage_3.jpg';
import Navigation from './components/Navigation';
import { RealProblem } from './components/RealProblem';
import { RealNumbers } from './components/RealNumbers';
import { ResearchHub } from './components/ResearchHub';

import { PartnerPortal } from './components/PartnerPortal';
import { LandUseMap } from './components/LandUseMap';
import { SolutionsHub } from './components/SolutionsHub';
import About from './pages/About';
import Contact from './pages/Contact';
import Footer from './components/Footer';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
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

const HERO_IMAGES = [backgroundImage0, backgroundImage2, backgroundImage3];
const HERO_ROTATION_INTERVAL_MS = 11000;
const HERO_TRANSITION_MS = 3000;
const HERO_ZOOM_SCALE = 1.08;
// Zoom completes ~10% faster than an image's active window, so it has already
// settled at full zoom (and just holds there via `forwards`) before the next
// rotation starts fading it out - that's what stops the visible "reset" snap.
const HERO_ZOOM_DURATION_MS = Math.round(HERO_ROTATION_INTERVAL_MS * 0.9);

const kenBurnsZoom = keyframes`
  from { transform: scale(1); }
  to { transform: scale(${HERO_ZOOM_SCALE}); }
`;

const BackgroundContainer = styled.div<{ activeTab: string }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 1;
  overflow: hidden;
  pointer-events: none;
  transition: opacity 0.4s ease;
  /* Only display the architectural background photos on the landing Home page */
  opacity: ${props => (props.activeTab === 'home' ? 1 : 0)};
`;

// Outer layer: stays mounted for the image's whole lifetime (stable key), so its
// opacity crossfade animates correctly both fading in and fading out.
const HeroImageLayer = styled.div<{ $visible: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity ${HERO_TRANSITION_MS}ms ease-in-out;
`;

// Inner layer: remounted (fresh key) only at the moment this image becomes current,
// which restarts the zoom from scale(1) each time - independent of the outer fade.
const HeroImageZoom = styled.div<{ $bgImage: string }>`
  width: 100%;
  height: 100%;
  background-image: url(${props => props.$bgImage});
  background-position: center center;
  background-repeat: no-repeat;
  background-size: cover;
  animation: ${kenBurnsZoom} ${HERO_ZOOM_DURATION_MS}ms ease-out forwards;
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
      ? 'none'
      : `
        radial-gradient(circle at top right, rgba(212, 175, 55, 0.06) 0%, rgba(0, 0, 0, 0) 65%),
        linear-gradient(to bottom, hsl(212, 50%, 20%) 0%, hsl(220, 38%, 7%) 100%)
      `};
  transition: background 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
`;

const MainContent = styled.main<{ activeTab: string }>`
  position: relative;
  z-index: 2;
  flex: 1 0 auto;
  padding-top: ${props => (props.activeTab === 'home' ? '100px' : '2.5rem')};
  padding-bottom: ${props => (props.activeTab === 'home' ? '5rem' : '3.5rem')};
  padding-left: ${props => (props.activeTab === 'home' ? '0' : '1.5rem')};
  padding-right: ${props => (props.activeTab === 'home' ? '0' : '1.5rem')};
  width: 100%;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);

  /* Keeps non-home tabs centered and responsive, without wrapping them in an outer card.
     Wide cap so pages with charts/grids can use large screens properly; pages with a
     narrower natural content width (forms, prose) cap themselves further inside this. */
  ${props => {
    if (props.activeTab === 'home') return '';
    const maxW = 1500;
    return `
      max-width: ${maxW}px;
      margin: 110px auto 5rem auto;

      @media (max-width: ${maxW + 50}px) {
        max-width: calc(100% - 3rem);
      }
      @media (max-width: 580px) {
        max-width: calc(100% - 1.5rem);
        padding-left: 0.5rem;
        padding-right: 0.5rem;
        margin-top: 95px;
      }
    `;
  }}
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
  min-height: calc(100vh - 100px);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  text-align: center;
  padding: 3rem 0 4rem 0;
`;

const HeroTextGroup = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const HeroSubtitle = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 2rem;
  line-height: 1.5;
  color: hsl(46, 65%, 52%);
  max-width: 850px;
  margin: 0 0 3rem 0;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.4);

  @media (max-width: 768px) {
    font-size: 1.75rem;
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
  background: #ffffff;
  border: 1px solid #ffffff;
  color: #0a0d14;
  padding: 1rem 2rem;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.85);
    transform: translateY(-2px);
  }

  @media (max-width: 480px) {
    width: 100%;
  }
`;

const SectionTitle = styled.h2`
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  color: hsl(46, 65%, 52%);
  font-weight: 700;
  margin-top: 10rem;
  margin-bottom: 1rem;
  text-align: center;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.4);
`;

const SectionDesc = styled.p`
  font-family: 'Inter', sans-serif;
  font-size: 1.1rem;
  color: hsl(46, 65%, 52%);
  max-width: 820px;
  margin: 0 auto 3rem auto;
  text-align: center;
  line-height: 1.5;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.55), 0 1px 3px rgba(0, 0, 0, 0.4);
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
  // Counts rotations rather than indexing directly, so each new "current" slide
  // gets a fresh key (and therefore restarts its zoom from scale(1)) while the
  // outgoing slide keeps its own key and freezes at full zoom instead of resetting.
  const [heroPlayCount, setHeroPlayCount] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setHeroPlayCount(c => c + 1);
    }, HERO_ROTATION_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const heroCurrentIndex = heroPlayCount % HERO_IMAGES.length;

  const renderActiveView = () => {
    switch (activeTab) {
      case 'home':
        return (
          <ViewWrapper>
            <HomeContainer>
              <HeroArea>
                <HeroTextGroup>
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
                </HeroTextGroup>
              </HeroArea>

              <SectionTitle>The Systemic Issues</SectionTitle>
              <SectionDesc>
                Housing shortages hold back the UK economy, stalling GDP and productivity growth. We pioneer research and strategy to find REAL solutions.
              </SectionDesc>

              <GapGrid>
                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 6a4 4 0 00-8 0v10a2 2 0 002 2h6M6 12h8" />
                    </svg>
                    The GDP & Prosperity Gap
                  </h3>
                  <p>
                    Average house prices are up over 425% in 30 years, far outpacing earnings growth. The median home in England now costs 7.6 times median annual earnings, roughly double the ratio when the ONS series began in 1997.
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
                    Skilled workers are priced out of high-productivity urban employment hubs. Long commutes and spatial mismatch wear down the workforce and hold back UK productivity.
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
                    The UK housing stock is the oldest in Europe, with 15% falling short of the Decent Homes Standard. Damp, cold homes drive billions in NHS costs and are a major hurdle to reaching carbon net-zero.
                  </p>
                </GapCard>

                <GapCard>
                  <h3>
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    The Transactional Friction Cost
                  </h3>
                  <p>
                    Buying a home takes six months on average, and roughly a quarter of agreed sales fall through before completion. Onward chains and hidden defects contributed to more than 300,000 failed transactions in 2025, wasting millions in legal fees.
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
      case 'solutions':
        return (
          <ViewWrapper>
            <SolutionsHub />
          </ViewWrapper>
        );
      case 'partners':
        return (
          <ViewWrapper>
            <PartnerPortal onStartIntake={() => setActiveTab('contact')} />
          </ViewWrapper>
        );
      case 'about':
        return (
          <ViewWrapper>
            <About />
          </ViewWrapper>
        );
      case 'contact':
        return (
          <ViewWrapper>
            <Contact />
          </ViewWrapper>
        );
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <BackgroundContainer activeTab={activeTab}>
        {HERO_IMAGES.map((img, i) => {
          const isCurrent = i === heroCurrentIndex;
          // The tick this image most recently became current - stays constant while
          // it's idle/fading out too, so the zoom div only remounts (and restarts)
          // on the way IN, never on the way out.
          const lastActivatedAt = heroPlayCount - (((heroPlayCount - i) % HERO_IMAGES.length + HERO_IMAGES.length) % HERO_IMAGES.length);
          return (
            <HeroImageLayer key={img} $visible={isCurrent}>
              <HeroImageZoom key={`zoom-gen-${lastActivatedAt}`} $bgImage={img} />
            </HeroImageLayer>
          );
        })}
      </BackgroundContainer>
      <BackgroundOverlay activeTab={activeTab} />
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      <MainContent activeTab={activeTab}>{renderActiveView()}</MainContent>
      <Footer activeTab={activeTab} setActiveTab={setActiveTab} />
    </PageContainer>
  );
};

export default App;
