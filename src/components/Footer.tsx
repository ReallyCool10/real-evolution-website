import React from 'react';
import styled from 'styled-components';

interface FooterProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const FooterContainer = styled.footer`
  position: relative;
  z-index: 2;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding: 2.5rem 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    padding: 2rem 1.5rem;
  }
`;

const FooterLeft = styled.div`
  display: flex;
  align-items: baseline;
  gap: 0.9rem;
  flex-wrap: wrap;
`;

const Copyright = styled.span`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.4);
`;

const PhotoCredit = styled.a`
  font-family: 'Inter', sans-serif;
  font-size: 0.7rem;
  color: rgba(255, 255, 255, 0.25);
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const FooterLinks = styled.div`
  display: flex;
  gap: 1.75rem;
  flex-wrap: wrap;
`;

const FooterLink = styled.button`
  font-family: 'Outfit', sans-serif;
  background: transparent;
  border: none;
  font-size: 0.85rem;
  font-weight: 700;
  color: rgba(255, 255, 255, 0.6);
  cursor: pointer;
  padding: 0;
  transition: color 0.2s ease;

  &:hover {
    color: #ffffff;
  }
`;

const Footer: React.FC<FooterProps> = ({ setActiveTab }) => {
  const handleClick = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <FooterContainer>
      <FooterLeft>
        <Copyright>&copy; {new Date().getFullYear()} REAL evolution</Copyright>
        <PhotoCredit href="https://unsplash.com/@david_garrick_bangbola" target="_blank" rel="noopener noreferrer">
          Photos by David Garrick
        </PhotoCredit>
      </FooterLeft>
      <FooterLinks>
        <FooterLink onClick={() => handleClick('solutions')}>Solutions</FooterLink>
        <FooterLink onClick={() => handleClick('partners')}>Partners</FooterLink>
        <FooterLink onClick={() => handleClick('about')}>About</FooterLink>
      </FooterLinks>
    </FooterContainer>
  );
};

export default Footer;
