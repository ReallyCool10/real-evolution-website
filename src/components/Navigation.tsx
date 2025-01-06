import React from 'react';
import styled from 'styled-components';

const Nav = styled.nav`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  padding: 1rem 2rem;
  z-index: 1000;
`;

const Navigation: React.FC = () => {
  return <Nav />;
};

export default Navigation;
