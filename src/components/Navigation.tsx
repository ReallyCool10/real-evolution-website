import React, { useState } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import topLogo from '../assets/top-logo.svg';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 1000;
`;

const Logo = styled.img`
  width: 72px;
  height: auto;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 0.9;
  }
`;

const HamburgerButton = styled.button`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 2rem;
  height: 2rem;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  z-index: 999;

  &:focus {
    outline: none;
  }
`;

const HamburgerLine = styled.span<{ isOpen?: boolean }>`
  width: 30px;
  height: 3px;
  background: ${({ isOpen }) => isOpen ? 'white' : '#1E3A8A'};
  transition: all 0.3s ease;
  position: relative;
  transform-origin: 1px;

  &:first-child {
    transform: ${({ isOpen }) => isOpen ? 'rotate(45deg)' : 'rotate(0)'};
  }

  &:nth-child(2) {
    opacity: ${({ isOpen }) => isOpen ? '0' : '1'};
    transform: ${({ isOpen }) => isOpen ? 'translateX(20px)' : 'translateX(0)'};
  }

  &:nth-child(3) {
    transform: ${({ isOpen }) => isOpen ? 'rotate(-45deg)' : 'rotate(0)'};
  }
`;

const MenuItems = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  right: ${({ isOpen }) => (isOpen ? '0' : '-100%')};
  height: 100vh;
  width: 300px;
  background: rgba(30, 58, 138, 0.95);
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  padding: 5rem 2rem;
  transition: right 0.3s ease;
  z-index: 998;
`;

const MenuItem = styled(Link)<{ $isActive?: boolean }>`
  color: white;
  text-decoration: none;
  font-size: 1.5rem;
  margin: 1rem 0;
  opacity: ${({ $isActive }) => ($isActive ? 1 : 0.8)};
  transition: opacity 0.2s ease;

  &:hover {
    opacity: 1;
  }
`;

const Overlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 997;
`;

const Navigation: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <Nav>
      <Logo src={topLogo} alt="Real Evolution Logo" onClick={() => navigate('/')} />
      <HamburgerButton onClick={() => setIsOpen(!isOpen)}>
        <HamburgerLine isOpen={isOpen} />
        <HamburgerLine isOpen={isOpen} />
        <HamburgerLine isOpen={isOpen} />
      </HamburgerButton>
      <MenuItems isOpen={isOpen}>
        <MenuItem 
          to="/" 
          onClick={() => setIsOpen(false)}
          $isActive={location.pathname === '/'}
        >
          Home
        </MenuItem>
        <MenuItem 
          to="/articles" 
          onClick={() => setIsOpen(false)}
          $isActive={location.pathname === '/articles'}
        >
          Articles
        </MenuItem>
        <MenuItem 
          to="/contact" 
          onClick={() => setIsOpen(false)}
          $isActive={location.pathname === '/contact'}
        >
          Contact
        </MenuItem>
      </MenuItems>
      {isOpen && <Overlay onClick={() => setIsOpen(false)} />}
    </Nav>
  );
};

export default Navigation;
