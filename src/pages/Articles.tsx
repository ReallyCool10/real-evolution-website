import React from 'react';
import styled from 'styled-components';

const ArticlesContainer = styled.div`
  width: 100%;
  padding: 2rem 0;
`;

const Content = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
`;

const Title = styled.h2`
  font-size: 2.5rem;
  margin-bottom: 2rem;
  font-weight: 700;
  background: linear-gradient(90deg, #FFFFFF 0%, #E2E8F0 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-align: left;
`;

const ArticleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 2rem;
`;

const ArticleCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease;
  cursor: pointer;

  &:hover {
    transform: translateY(-5px);
  }
`;

const ArticleImage = styled.div`
  background: rgba(255, 255, 255, 0.05);
  aspect-ratio: 16/9;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255, 255, 255, 0.6);
`;

const ArticleContent = styled.div`
  padding: 1.5rem;
`;

const ArticleTitle = styled.h3`
  font-size: 1.25rem;
  margin-bottom: 0.5rem;
  color: white;
`;

const ArticleExcerpt = styled.p`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
  line-height: 1.6;
`;

const Articles: React.FC = () => {
  return (
    <ArticlesContainer>
      <Content>
        <Title>Articles & Research</Title>
        <ArticleGrid>
          {[1, 2, 3, 4, 5, 6].map((index) => (
            <ArticleCard key={index}>
              <ArticleImage>Article Image {index}</ArticleImage>
              <ArticleContent>
                <ArticleTitle>Digital Twin Technology in Heritage Buildings</ArticleTitle>
                <ArticleExcerpt>
                  Exploring how digital twin technology is revolutionizing the preservation and 
                  adaptation of historic architecture...
                </ArticleExcerpt>
              </ArticleContent>
            </ArticleCard>
          ))}
        </ArticleGrid>
      </Content>
    </ArticlesContainer>
  );
};

export default Articles;
