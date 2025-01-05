import React, { useRef } from 'react';
import styled from 'styled-components';
import textLogo from './assets/real-evolution-logo.svg';
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
  padding: 2rem;
`;

const Logo = styled.img`
  width: 300px;
  height: auto;
  margin-top: 2rem;
  margin-bottom: 2rem;
`;

const ScrollArrow = styled.div`
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  font-size: 2rem;
  cursor: pointer;
  animation: bounce 2s infinite;

  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-30px);
    }
    60% {
      transform: translateY(-15px);
    }
  }
`;

const AboutContent = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const ContactForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
`;

const Input = styled.input`
  padding: 0.8rem;
  border: 2px solid #ffffff;
  border-radius: 4px;
  background: transparent;
  color: white;
  font-size: 1rem;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const TextArea = styled.textarea`
  padding: 0.8rem;
  border: 2px solid #ffffff;
  border-radius: 4px;
  background: transparent;
  color: white;
  font-size: 1rem;
  min-height: 150px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.7);
  }
`;

const Button = styled.button`
  padding: 1rem 2rem;
  background: white;
  color: #1E40AF;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  transition: opacity 0.2s;

  &:hover {
    opacity: 0.9;
  }
`;

const Home: React.FC = () => {
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const scrollToSection = (ref: React.RefObject<HTMLDivElement>) => {
    ref.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <ScrollContainer>
      <Section>
        <HomeContent>
          <Logo src={textLogo} alt="Real Evolution" />
        </HomeContent>
        <ScrollArrow onClick={() => scrollToSection(aboutRef)}>↓</ScrollArrow>
      </Section>

      <Section ref={aboutRef}>
        <AboutContent>
          <h2>About Real Evolution</h2>
          <p>
            Real Evolution is a pioneering real estate development company that transforms spaces into extraordinary places.
            We believe in creating sustainable, innovative, and community-focused developments that enhance the way people live,
            work, and interact.
          </p>
          <p>
            Our vision is to lead the evolution of real estate development, setting new standards for design, sustainability,
            and community integration. We're committed to creating spaces that not only meet the needs of today but anticipate
            the demands of tomorrow.
          </p>
        </AboutContent>
        <ScrollArrow onClick={() => scrollToSection(contactRef)}>↓</ScrollArrow>
      </Section>

      <Section ref={contactRef}>
        <AboutContent>
          <h2>Contact Us</h2>
          <ContactForm onSubmit={(e) => e.preventDefault()}>
            <Input type="text" placeholder="Name" required />
            <Input type="email" placeholder="Email" required />
            <TextArea placeholder="Your message" required />
            <Button type="submit">Send Message</Button>
          </ContactForm>
        </AboutContent>
      </Section>
    </ScrollContainer>
  );
};

const App: React.FC = () => {
  return (
    <PageContainer>
      <Navigation />
      <ContentWrapper>
        <Home />
      </ContentWrapper>
    </PageContainer>
  );
};

export default App;
