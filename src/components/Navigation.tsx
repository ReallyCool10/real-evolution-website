import React, { useState } from 'react';
import styled from 'styled-components';
import topLogo from '../assets/real-evolution-logo.svg';

interface NavigationProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: rgba(10, 13, 20, 0.6);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2rem;
  box-sizing: border-box;

  @media (max-width: 1000px) {
    padding: 0 1rem;
  }
`;

const LogoLink = styled.a`
  display: flex;
  align-items: center;
  cursor: pointer;
  text-decoration: none;
`;

const LogoImage = styled.img`
  height: 38px; /* Slightly larger to look prominent as the standalone brand anchor */
  width: auto;
  filter: brightness(0) invert(1);
`;

const NavLinks = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;

  @media (max-width: 1000px) {
    display: none;
  }
`;

const NavLink = styled.button<{ active: boolean }>`
  font-family: 'Outfit', sans-serif;
  background: transparent;
  border: none;
  font-size: 0.9rem;
  color: ${props => (props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)')};
  cursor: pointer;
  padding: 0.5rem 0.6rem;
  transition: all 0.2s ease;
  position: relative;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    color: #ffffff;
  }

  &::after {
    content: '';
    position: absolute;
    bottom: -4px;
    left: 50%;
    transform: translateX(-50%);
    width: ${props => (props.active ? '16px' : '0px')};
    height: 2px;
    background: hsl(46, 65%, 52%);
    border-radius: 2px;
    transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  }
`;

const CTAButton = styled.button`
  font-family: 'Outfit', sans-serif;
  background: rgba(212, 175, 55, 0.08);
  border: 1px solid hsl(46, 65%, 52%);
  color: #ffffff;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  margin-left: 0.25rem;
  white-space: nowrap;

  &:hover {
    background: hsl(46, 65%, 52%);
    color: #0a0d14;
    transform: translateY(-1px);
    box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);
  }
`;

const BurgerMenu = styled.button`
  display: none;
  background: transparent;
  border: none;
  color: #ffffff;
  cursor: pointer;
  padding: 0.5rem;
  z-index: 1001;

  @media (max-width: 1000px) {
    display: block;
  }
`;

const MobileDropdown = styled.div<{ open: boolean }>`
  position: fixed;
  top: 70px;
  left: 0;
  right: 0;
  background: rgba(10, 13, 20, 0.98);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  z-index: 999;
  transform: translateY(${props => (props.open ? '0' : '-120%')});
  opacity: ${props => (props.open ? '1' : '0')};
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1), opacity 0.3s ease;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
`;

const MobileLink = styled.button<{ active: boolean }>`
  font-family: 'Outfit', sans-serif;
  background: transparent;
  border: none;
  font-size: 1.1rem;
  color: ${props => (props.active ? 'hsl(46, 65%, 52%)' : '#ffffff')};
  text-align: left;
  padding: 0.5rem 0;
  cursor: pointer;
  font-weight: 500;
  width: 100%;
`;

const Navigation: React.FC<NavigationProps> = ({ activeTab, setActiveTab }) => {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleTabClick = (tab: string) => {
    setActiveTab(tab);
    setMenuOpen(false);
  };

  return (
    <>
      <Nav>
        <LogoLink onClick={() => handleTabClick('home')}>
          <LogoImage src={topLogo} alt="Real Evolution Logo" />
        </LogoLink>

        <NavLinks>
          <NavLink active={activeTab === 'home'} onClick={() => handleTabClick('home')}>
            Home
          </NavLink>
          <NavLink active={activeTab === 'problem'} onClick={() => handleTabClick('problem')}>
            The REAL Problem
          </NavLink>
          <NavLink active={activeTab === 'numbers'} onClick={() => handleTabClick('numbers')}>
            The REAL Numbers
          </NavLink>
          <NavLink active={activeTab === 'articles'} onClick={() => handleTabClick('articles')}>
            Articles
          </NavLink>
          <NavLink active={activeTab === 'landuse'} onClick={() => handleTabClick('landuse')}>
            Land Use
          </NavLink>
        </NavLinks>

        <BurgerMenu onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          )}
        </BurgerMenu>
      </Nav>
 
      <MobileDropdown open={menuOpen}>
        <MobileLink active={activeTab === 'home'} onClick={() => handleTabClick('home')}>
          Home
        </MobileLink>
        <MobileLink active={activeTab === 'problem'} onClick={() => handleTabClick('problem')}>
          The REAL Problem
        </MobileLink>
        <MobileLink active={activeTab === 'numbers'} onClick={() => handleTabClick('numbers')}>
          The REAL Numbers
        </MobileLink>
        <MobileLink active={activeTab === 'articles'} onClick={() => handleTabClick('articles')}>
          Articles
        </MobileLink>
        <MobileLink active={activeTab === 'landuse'} onClick={() => handleTabClick('landuse')}>
          Land Use
        </MobileLink>
      </MobileDropdown>
    </>
  );
};

export default Navigation;
