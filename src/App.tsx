import React, { useRef } from 'react';
import styled from 'styled-components';
import textLogo from './assets/real-evolution-logo.svg';
import backgroundImage from './assets/backgroundImage.png';
import Navigation from './components/Navigation';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  position: relative;
  color: white;
  * {
    color: white;
  }
  overflow-y: scroll;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  height: 100vh;
`;

const BackgroundContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300vh; /* Make this 3x viewport height since we have 3 sections */
  background-image: url(${backgroundImage});
  background-position: center top;
  background-repeat: no-repeat;
  background-size: cover;
  z-index: -1;
`;

const ContentWrapper = styled.div`
  position: relative;
  width: 100%;
  background: rgba(0, 0, 0, 0.4);
  z-index: 1;
`;

const Section = styled.section`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  padding: 2rem;
  scroll-snap-align: start;
  scroll-snap-stop: always;

  @media (max-width: 768px) {
    padding: 1rem;
  }
`;

const FirstSection = styled(Section)`
  justify-content: flex-start;
  padding: 2rem 2rem 4rem;

  @media (max-width: 768px) {
    padding: 1rem 1rem 3rem;
  }
`;

const FirstSectionContent = styled.div`
  text-align: center;
  margin-top: 2rem;
`;

const ScrollContainer = styled.div`
  height: 100vh;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch; /* Smooth scrolling on iOS */

  &::-webkit-scrollbar {
    display: none;
  }
`;

const Logo = styled.img`
  width: 300px;
  height: auto;
  margin-bottom: 2rem;
  filter: brightness(0) invert(1);
`;

const TagLine = styled.h1`
  font-size: 3rem;
  text-align: center;
  font-weight: 500;
  margin: 0;
  text-shadow: 
    0.5px 0.5px 0 rgba(255, 255, 255, 0.3),
    1px 1px 0 rgba(255, 255, 255, 0.2),
    1.5px 1.5px 0 rgba(255, 255, 255, 0.1);
  line-height: 1.2;
  white-space: nowrap;
  padding: 0 1rem;
  color: white;

  @media (max-width: 768px) {
    font-size: 2rem;
    padding: 0 0.5rem;
    white-space: normal;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const ScrollArrow = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  width: 40px;
  height: 20px;
  cursor: pointer;
  animation: bounce 2s infinite;
  color: white;
  transform-origin: center;

  &::before,
  &::after {
    content: '';
    position: absolute;
    width: 20px;  
    height: 3px;
    background-color: white;
    transform-origin: center;
  }

  &::before {
    left: 50%;
    transform: translateX(-96%) rotate(20deg);  
  }

  &::after {
    right: 50%;
    transform: translateX(96%) rotate(-20deg);  
  }

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateX(-50%) translateY(0);
    }
    40% {
      transform: translateX(-50%) translateY(-15px);
    }
    60% {
      transform: translateX(-50%) translateY(-7.5px);
    }
  }
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  text-align: center;

  h2 {
    font-weight: 500;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: white;

    @media (max-width: 768px) {
      font-size: 2rem;
      margin-bottom: 1rem;
    }
  }

  p {
    max-width: 800px;
    margin: 0 auto;
    font-size: 1.2rem;
    line-height: 1.6;
    font-weight: 300;
    color: white;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }
  }
`;

const AboutContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  text-align: justify;
  font-weight: 500;
  
  p {
    margin-bottom: 1.5rem;
    line-height: 1.8;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    background: rgba(0, 0, 0, 0.4);
    padding: 20px;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
  }

  h2 {
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.8);
    margin-bottom: 2rem;
  }
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 540px;
  margin: 0 auto;
  margin-top: 40px;

  h2 {
    margin-left: -20px;
  }
`;

const Input = styled.input`
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  width: calc(100% + 50px);
  margin-left: -35px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const TextArea = styled.textarea`
  padding: 1rem;
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 5px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  min-height: 150px;
  resize: vertical;
  width: calc(100% + 50px);
  margin-left: -35px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background: transparent;
  border: 2px solid white;
  color: white;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 500;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: white;
    color: white;
  }
`;

const App: React.FC = () => {
  const aboutRef = useRef<HTMLElement>(null);
  const contactRef = useRef<HTMLElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageContainer>
      <BackgroundContainer />
      <ContentWrapper>
        <Navigation />
        <FirstSection>
          <Logo src={textLogo} alt="Real Evolution" />
          <FirstSectionContent>
            <TagLine>Great Homes for Real People in Top Locations</TagLine>
          </FirstSectionContent>
          <ScrollArrow onClick={() => scrollToSection(aboutRef)} />
        </FirstSection>

        <Section ref={aboutRef}>
          <Content>
            <AboutContent>
              <h2 style={{ marginBottom: '2rem', fontSize: '2.5rem', fontWeight: '500' }}>About Us</h2>
              <p>At REAL evolution, we envision a future where every building reaches its fullest potential, where derelict spaces transform into vibrant homes, and where iconic architecture finds new purpose for generations to come. Our mission transcends traditional property development – we're creating a digital framework that reimagines how we interact with, develop, and preserve our built environment.</p>
              
              <p>In a nation where housing shortages persist and older buildings languish, we're pioneering a technology-driven approach that bridges the gap between preservation and progress. This synthesis of innovation and tradition enables us to optimize existing spaces, revitalize neglected properties, and create homes that enrich communities.</p>
              
              <p>We're seeking visionary partners who recognize that the future of real estate lies not just in new construction, but in the intelligent transformation of our existing architectural landscape. Together, we can address housing challenges while preserving the character that makes our cities unique, creating value that extends beyond financial returns to the very fabric of urban life.</p>
            </AboutContent>
          </Content>
          <ScrollArrow onClick={() => scrollToSection(contactRef)} />
        </Section>

        <Section ref={contactRef}>
          <Content>
            <ContactForm onSubmit={(e) => e.preventDefault()}>
              <h2 style={{ color: 'white', marginBottom: '2rem' }}>Contact Us</h2>
              <Input type="text" placeholder="Name" required />
              <Input type="email" placeholder="Email" required />
              <TextArea placeholder="Your message" required />
              <Button type="submit">Send Message</Button>
            </ContactForm>
          </Content>
        </Section>
      </ContentWrapper>
    </PageContainer>
  );
};

export default App;
