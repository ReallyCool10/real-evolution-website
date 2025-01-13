import React, { useRef } from 'react';
import styled from 'styled-components';
import textLogo from './assets/real-evolution-logo.svg';
import backgroundImage from './assets/BackgroundImage.png';
import Navigation from './components/Navigation';

const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  background-image: url(${backgroundImage});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  transform: rotate(2deg);
  transform-origin: center center;
  color: white;
  * {
    color: white;
  }
`;

interface SectionProps {
  isFirst?: boolean;
}

const Section = styled.section<SectionProps>`
  min-height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: ${props => props.isFirst ? 'flex-start' : 'center'};
  position: relative;
  scroll-snap-align: start;
  padding: ${props => props.isFirst ? '2rem 2rem 4rem' : '2rem'};

  @media (max-width: 768px) {
    padding: ${props => props.isFirst ? '1rem 1rem 3rem' : '1rem'};
  }
`;

const FirstSectionContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  height: 100%;
  position: relative;

  > div {
    position: absolute;
    top: 75%;
    transform: translateY(-50%);
  }
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
  filter: brightness(0) invert(1);
  margin-bottom: 1rem;
`;

const TagLine = styled.h1`
  font-size: 3rem;
  text-align: center;
  font-weight: 500;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  text-shadow: 
    0.5px 0.5px 0 #1E40AF,
    1px 1px 0 rgba(0,0,0,0.05),
    0 0 5px rgba(255,255,255,0.075);
  line-height: 1.2;
  white-space: nowrap;
  padding: 0 1rem;
  color: white;

  @media (max-width: 1024px) {
    font-size: 2.5rem;
  }

  @media (max-width: 768px) {
    font-size: 2rem;
    white-space: normal;
  }

  @media (max-width: 480px) {
    font-size: 1.75rem;
  }
`;

const SubText = styled.p`
  font-size: 1.2rem;
  text-align: center;
  max-width: 800px;
  margin: 0 auto;
  color: white;
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
  max-width: 800px;
  width: 100%;
  text-align: center;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 0 1rem;

  h2 {
    font-weight: 500;
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
    color: white;

    @media (max-width: 768px) {
      font-size: 2rem;
    }

    @media (max-width: 480px) {
      font-size: 1.75rem;
    }
  }

  p {
    font-size: 1.2rem;
    line-height: 1.6;
    font-weight: 300;
    color: white;

    @media (max-width: 768px) {
      font-size: 1.1rem;
    }

    @media (max-width: 480px) {
      font-size: 1rem;
    }
  }
`;

const AboutContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 0 2rem;
  background: linear-gradient(to bottom, 
    #1E40AF 0%,
    #1E40AF 30%,
    rgba(255, 255, 255, 0.95) 30%,
    rgba(255, 255, 255, 0.95) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);

  p {
    margin-bottom: 2rem;
    font-size: 1.2rem;
    line-height: 1.8;
    font-weight: 300;
    text-align: left;
    color: white;

    @media (max-width: 768px) {
      font-size: 1.1rem;
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
  }

  h2 {
    font-size: 2.5rem;
    font-weight: 500;
    margin-bottom: 2rem;
    color: white;
  }
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  padding: 0 1rem;

  @media (max-width: 768px) {
    max-width: 90%;
  }
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 2px solid white;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  transition: border-color 0.2s, background 0.2s;

  @media (max-width: 480px) {
    font-size: 16px; /* Prevents zoom on mobile */
    padding: 0.6rem;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(30, 64, 175, 0.6);
    background: rgba(255, 255, 255, 0.15);
  }
`;

const TextArea = styled.textarea`
  padding: 0.8rem;
  border: 2px solid white;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  font-size: 1rem;
  font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
  min-height: 150px;
  resize: vertical;
  transition: border-color 0.2s, background 0.2s;

  @media (max-width: 480px) {
    font-size: 16px; /* Prevents zoom on mobile */
    padding: 0.6rem;
    min-height: 120px;
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }

  &:focus {
    outline: none;
    border-color: rgba(30, 64, 175, 0.6);
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
    color: #1E40AF;
  }
`;

const App: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageContainer>
      <Navigation />
      <ScrollContainer>
        <Section isFirst>
          <Logo src={textLogo} alt="Real Evolution" />
          <FirstSectionContent>
            <div>
              <TagLine>Great Homes for Real People in Top Locations</TagLine>
            </div>
          </FirstSectionContent>
          <ScrollArrow onClick={() => scrollToSection(aboutRef)} />
        </Section>

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
            <h2 style={{ color: 'white', marginBottom: '2rem' }}>Contact Us</h2>
            <ContactForm onSubmit={(e) => e.preventDefault()}>
              <Input type="text" placeholder="Name" required />
              <Input type="email" placeholder="Email" required />
              <TextArea placeholder="Your message" required />
              <Button type="submit">Send Message</Button>
            </ContactForm>
          </Content>
        </Section>
      </ScrollContainer>
    </PageContainer>
  );
};

export default App;
