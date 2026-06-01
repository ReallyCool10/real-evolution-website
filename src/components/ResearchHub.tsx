import React, { useState } from 'react';
import styled from 'styled-components';
import { VisualChart } from './VisualChart';

const HubContainer = styled.div`
  max-width: 1000px;
  margin: 0 auto;
  padding: 1rem 2rem;

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
  }
`;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 3rem;
  margin-top: 2rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const Sidebar = styled.aside`
  position: sticky;
  top: 100px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  @media (max-width: 768px) {
    position: relative;
    top: 0;
    flex-direction: row;
    overflow-x: auto;
    padding-bottom: 1rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
`;

const SidebarButton = styled.button<{ active: boolean }>`
  font-family: 'Outfit', sans-serif;
  background: ${props => (props.active ? 'rgba(212, 175, 55, 0.08)' : 'transparent')};
  border: 1px solid ${props => (props.active ? 'hsl(46, 65%, 52%)' : 'transparent')};
  color: ${props => (props.active ? '#ffffff' : 'rgba(255, 255, 255, 0.6)')};
  text-align: left;
  padding: 0.85rem 1.25rem;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:hover {
    color: #ffffff;
    background: rgba(255, 255, 255, 0.03);
  }

  @media (max-width: 768px) {
    padding: 0.5rem 1rem;
    font-size: 0.85rem;
  }
`;

const ArticleContainer = styled.article`
  animation: fadeIn 0.4s ease-out;
  text-align: left;

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const ArticleHeader = styled.div`
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  padding-bottom: 1.5rem;
  margin-bottom: 2rem;
`;

const Category = styled.span`
  font-family: 'Outfit', sans-serif;
  font-size: 0.8rem;
  text-transform: uppercase;
  color: hsl(46, 65%, 52%);
  letter-spacing: 2px;
  font-weight: 600;
`;

const ArticleTitle = styled.h2`
  font-family: 'Outfit', sans-serif;
  font-size: 2.2rem;
  font-weight: 500;
  color: #ffffff;
  margin: 0.5rem 0;

  @media (max-width: 580px) {
    font-size: 1.75rem;
  }
`;

const MetaRow = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  display: flex;
  gap: 1.5rem;
  margin-top: 0.75rem;
`;

const ArticleBody = styled.div`
  font-family: 'Inter', sans-serif;
  font-size: 1.05rem;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.85);

  p {
    margin-bottom: 1.5rem;
  }

  blockquote {
    border-left: 3px solid hsl(46, 65%, 52%);
    background: rgba(255, 255, 255, 0.02);
    padding: 1rem 1.5rem;
    margin: 2rem 0;
    border-radius: 0 8px 8px 0;
    font-style: italic;
    color: #ffffff;
    
    p {
      margin: 0;
    }
  }

  h3 {
    font-family: 'Outfit', sans-serif;
    font-size: 1.4rem;
    color: #ffffff;
    margin: 2.5rem 0 1rem 0;
    font-weight: 500;
  }
`;

const CitationList = styled.ol`
  margin-top: 3rem;
  padding-top: 2rem;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  font-family: 'Inter', sans-serif;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.6;

  li {
    margin-bottom: 0.5rem;
  }

  a {
    color: #ffffff;
    text-decoration: none;
    border-bottom: 1px dashed rgba(255, 255, 255, 0.4);
    transition: all 0.2s ease;

    &:hover {
      color: hsl(46, 65%, 52%);
      border-bottom-style: solid;
      border-bottom-color: hsl(46, 65%, 52%);
    }
  }
`;

export const ResearchHub: React.FC = () => {
  const [activeArticle, setActiveArticle] = useState<'deficit' | 'quality' | 'friction' | 'sutherland'>('deficit');

  return (
    <HubContainer>
      <Layout>
        <Sidebar>
          <SidebarButton
            active={activeArticle === 'deficit'}
            onClick={() => setActiveArticle('deficit')}
          >
            The Supply Deficit
          </SidebarButton>
          <SidebarButton
            active={activeArticle === 'quality'}
            onClick={() => setActiveArticle('quality')}
          >
            Europe's Oldest Hearth
          </SidebarButton>
          <SidebarButton
            active={activeArticle === 'friction'}
            onClick={() => setActiveArticle('friction')}
          >
            The Cost of Friction
          </SidebarButton>
          <SidebarButton
            active={activeArticle === 'sutherland'}
            onClick={() => setActiveArticle('sutherland')}
          >
            The Continuous Market
          </SidebarButton>
        </Sidebar>

        <main>
          {activeArticle === 'deficit' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Supply & Density</Category>
                <ArticleTitle>The Deficit in Brick & Mortar: UK's Housing Scarcity</ArticleTitle>
                <MetaRow>
                  <span>Published: Q1 2026</span>
                  <span>Reading Time: 5 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  England has far fewer dwellings relative to its population than other developed nations, with just 434 homes per thousand inhabitants, significantly fewer than France (590), Italy (587), and the OECD average of 487 <sup>[1]</sup>. Looking at the United Kingdom as a whole, the gap is even more severe: Statista research indicates the UK has just <strong>374 dwellings per 1,000 inhabitants</strong> <sup>[2]</sup>.
                </p>

                <blockquote>
                  <p>
                    "The persistent undersupply of housing in the UK has created a system built around manufactured scarcity. Demand continues to grow rapidly from both homeowners seeking stability and investors targeting appreciating assets, yet the housing stock fails to keep pace."
                  </p>
                </blockquote>

                <VisualChart type="deficit" />

                <h3>completions and Local Disparities</h3>
                <p>
                  The housing scarcity is exacerbated by low annual construction completions. As of 2023, the housing completion rate in Great Britain stood at a mere <strong>2.8 dwellings per 1,000 people</strong> in England, 1.49 in Wales, and 3.81 in Scotland <sup>[3]</sup>. This represents a significant lag behind European counterparts who consistently replace and expand their housing grids to match demographic growth.
                </p>

                <p>
                  Furthermore, commercial real estate patterns indicate an intriguing structural shift. While traditional development languishes, the commercial vacancy rate in London's urban core has climbed to <strong>15.59% (Central London East, Q3 2024)</strong> <sup>[4]</sup>. This represents a massive opportunity to transition empty office space into prime family housing.
                </p>
              </ArticleBody>

               <CitationList>
                <li>[1] <a href="https://www.oecd.org/housing/data/affordable-housing-database/" target="_blank" rel="noopener noreferrer">OECD Affordable Housing Database</a>, Comparative Housing Stock Indicators.</li>
                <li>[2] <a href="https://www.statista.com/statistics/867687/total-housing-stock-per-1000-inhabitants-in-europe/" target="_blank" rel="noopener noreferrer">Statista Research</a>, Total Housing Stock per 1,000 Inhabitants (Europe Comparisons, 2023).</li>
                <li>[3] <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/housingstocklevelsbytenureandregioninenglandandwales" target="_blank" rel="noopener noreferrer">ONS Housing Stock & Completion Records</a>, Q3 2023.</li>
                <li>[4] <a href="https://www.cbre.co.uk/insights/articles/uk-real-estate-market-outlook-2024" target="_blank" rel="noopener noreferrer">UK Commercial Real Estate Market Report</a>, Vacancy Metrics (Q3 2024).</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'quality' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Quality & Energy Gaps</Category>
                <ArticleTitle>Europe's Oldest Hearth: Quality and Carbon in the UK Grid</ArticleTitle>
                <MetaRow>
                  <span>Published: Q2 2026</span>
                  <span>Reading Time: 6 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  Beyond absolute scarcity, the UK has amongst the oldest and least energy-efficient housing stocks in Europe. A staggering <strong>78% of UK homes</strong> were built before 1980, compared to an EU average of 61%. Even more critical, <strong>38% of the UK’s housing stock</strong> was built before 1946, compared to an EU average of just 18% <sup>[1]</sup>.
                </p>

                <blockquote>
                  <p>
                    "Living in an old house shouldn't mean living in drafty discomfort. The UK's failure to update its historical housing envelope has direct public health and environmental consequences."
                  </p>
                </blockquote>

                <VisualChart type="quality" />

                <h3>Failure to Meet Basic Decency</h3>
                <p>
                  This historical legacy has had a severe impact on the livability of homes: <strong>15% of English homes failed to meet the Decent Homes Standard</strong> as of recent surveys <sup>[2]</sup>. This is the highest proportion of substandard housing in Europe, significantly higher than peer nations like Germany (12%), Bulgaria (11%), and Poland (6%) <sup>[3]</sup>.
                </p>

                <h3>The Macro Drag: NHS and Net-Zero</h3>
                <p>
                  Substandard housing is not just a personal inconvenience; it is a major macroeconomic anchor. Damp, cold, and poorly insulated homes cost the NHS billions of pounds annually in treatable respiratory and cardiovascular conditions. 
                </p>
                <p>
                  Additionally, in an era of global energy price volatility, poorly insulated historic houses render households extremely vulnerable to energy price shocks. Retrofitting existing urban assets and utilizing high-performance building materials is therefore the most direct pathway to achieving both energy security and domestic carbon net-zero commitments.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] <a href="https://ec.europa.eu/eurostat/web/products-eurostat-news/w/ddn-20230222-1" target="_blank" rel="noopener noreferrer">European Housing Stock Age and Composition Report</a>, Eurostat Comparisons.</li>
                <li>[2] <a href="https://www.gov.uk/government/statistics/english-housing-survey-2020-to-2021-headline-report" target="_blank" rel="noopener noreferrer">English Housing Survey</a>, Ministry of Housing, Communities & Local Government (2020).</li>
                <li>[3] <a href="https://www.who.int/europe/publications/i/item/9789289052993" target="_blank" rel="noopener noreferrer">WHO European Housing and Health Database</a> (Substandard Stock Index).</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'friction' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Financial Friction</Category>
                <ArticleTitle>The Cost of Systemic Friction: A Broken Buying Cycle</ArticleTitle>
                <MetaRow>
                  <span>Published: Q2 2026</span>
                  <span>Reading Time: 7 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  Over a 30-year span, from 1995 to 2025, the average UK home has <strong>increased in price by over 425%</strong>, while the average salary rose by just 112% <sup>[1]</sup>. In 1995, a newly qualified teacher could purchase a standard family home for just 3.4x their salary. Today, that same teacher must allocate <strong>over 8x their annual salary</strong> for an equivalent dwelling <sup>[2]</sup>.
                </p>

                <blockquote>
                  <p>
                    "The transaction process itself is outdated. Onward chains, hidden property defects, and lack of upfront mortgage clarity keep buyers and sellers in a state of high-stress limbo."
                  </p>
                </blockquote>

                <VisualChart type="affordability" />

                <h3>Collapsing Chains and Wasted Capital</h3>
                <p>
                  Buying a home in the UK is characterized by extreme uncertainty. Approximately <strong>30% of all purchase attempts collapse</strong> before completion. This gridlock results in an estimated <strong>300,000 failed transactions per year</strong>, with buyers and sellers losing between £500 and £3,500 in non-recoverable survey, legal, and mortgage fees per failed attempt <sup>[3]</sup>.
                </p>

                <p>
                  The leading drivers of transaction collapses are problems uncovered during building surveys (which surprises buyers) and failures to secure final mortgages (~40% of recent failures). This extreme friction is compounded by a lack of trust: undisclosed defects and complex onward chains hold buyers and sellers hostage.
                </p>

                <h3>The Transactional Drag</h3>
                <p>
                  Beyond the stress of failed sales, the cost of successfully transacting is itself a major economic drag. The UK estate agency sector alone generates <strong>£5.7 billion per year</strong> in commission revenue. On top of this, conveyancing solicitor fees add approximately <strong>£2.5 billion</strong>, and mortgage broker charges a further <strong>£0.7 billion</strong> annually. In total, over <strong>£9 billion per year</strong> is extracted in intermediary transaction fees across the UK's ~1.1 million annual home sales <sup>[4]</sup>, capital that is diverted away from the productive economy.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] <a href="https://www.ons.gov.uk/economy/inflationandpriceindices/bulletins/housepriceindex/previousReleases" target="_blank" rel="noopener noreferrer">ONS House Price Index & Annual Survey of Hours and Earnings (ASHE)</a> 1995-2025.</li>
                <li>[2] <a href="https://www.gov.uk/government/organisations/land-registry" target="_blank" rel="noopener noreferrer">HM Land Registry Records & Salary Scale Multipliers</a>.</li>
                <li>[3] <a href="https://www.conveyancingassociation.org.uk/white-papers/" target="_blank" rel="noopener noreferrer">Conveyancing Association Transaction Survey Report</a>.</li>
                <li>[4] <a href="https://www.gov.uk/government/statistics/monthly-property-transactions-completed-in-the-uk-with-value-40000-or-above" target="_blank" rel="noopener noreferrer">UK Property Transaction Statistics & Agent Commission Index</a>.</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'sutherland' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Behavioral Economics</Category>
                <ArticleTitle>The Continuous Market: Rory Sutherland’s Universal Registry</ArticleTitle>
                <MetaRow>
                  <span>Published: Q2 2026</span>
                  <span>Reading Time: 8 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  In a provocative thought experiment published in <em>The Spectator</em> (November 2024), Rory Sutherland (Vice Chairman of Ogilvy Group and behavioral economist) proposed a radical psychological solution to housing gridlocks: <strong>what if every home in the country was listed for sale all the time?</strong> <sup>[1]</sup>.
                </p>

                <blockquote>
                  <p>
                    "In most markets, liquidity and 'promiscuity' are signs of health. The housing market is frozen because listing a home is treated as a binary crisis - you are either completely in your home, or suspended in the high-stress limbo of being 'on the market'."
                  </p>
                </blockquote>

                <p>
                  Sutherland argues that the UK housing gridlock is as much a behavioral and cognitive crisis as it is a physical supply constraint. Millions of homeowners live in properties that are structurally ill-suited for their needs - such as empty-nester retirees holding large 4-bedroom detached family homes - but avoid moving simply because the administrative, marketing, and psychological friction of active listing is too daunting.
                </p>

                <VisualChart type="sutherland" />

                <h3>The Psychology of Unsolicited Bids</h3>
                <p>
                  Under Sutherland's continuous registry framework, rather than actively managing estate agents, homeowners simply specify a public "reserve price" (which could be set at a 30% to 50% premium over fair market value if they are highly content with their current residence). Prospective buyers can browse the postal district and submit unsolicited bids directly on any property in the country <sup>[1]</sup>.
                </p>
                <p>
                  This shifts the seller's mindset from an active, anxious seeker to a passive decision-maker. Receiving a concrete, highly attractive out-of-the-blue offer bypasses the dread of listing limbo, open viewings, and real estate middleman fees, serving as a powerful behavioral trigger for downsizing and strategic family relocation.
                </p>

                <h3>Detailed Viability & Feasibility Considerations</h3>
                <p>
                  To transition Sutherland's provocative thesis into a viable strategy, we must evaluate several critical friction and mitigation parameters:
                </p>
                <ul>
                  <li>
                    <strong>The Spam and Speculation Trap</strong>: Universal addressability could invite massive speculative crawler bids or low-ball spam on desirable properties. 
                    <br />
                    <em>Mitigation</em>: Bids must be validated through escrowed deposits (e.g., staking 1% of bid value) or proof-of-funds verification, ensuring only credible, high-intent bidders can reach the owner.
                  </li>
                  <li>
                    <strong>Onward Chain Mismatch</strong>: Accepting an unsolicited bid is useless if the seller has nowhere to go. In a high-scarcity housing grid, the transaction velocity is capped by physical supply.
                    <br />
                    <em>Mitigation</em>: The platform must support delayed possession or leaseback options. Sellers should be legally entitled to a 6-month rent-free residency period post-transaction to source their onward home, decoupling transaction execution from physical move-in dates.
                  </li>
                  <li>
                    <strong>Municipal Rate Revaluations</strong>: Speculative offers could lead to local tax reassessment traps, penalizing owners for bids they never requested.
                    <br />
                    <em>Mitigation</em>: Speculative bids must remain confidential and legally protected from tax reassessments unless a formal sale transaction takes place.
                  </li>
                </ul>
              </ArticleBody>

              <CitationList>
                <li>[1] Rory Sutherland, "<a href="https://www.spectator.co.uk/article/how-to-buy-a-house-that-isnt-on-the-market/" target="_blank" rel="noopener noreferrer">How to buy a house that isn't on the market</a>," <em>The Spectator</em> (November 2024).</li>
                <li>[2] <a href="https://www.ogilvy.com/ideas/behavioral-science" target="_blank" rel="noopener noreferrer">Ogilvy UK Behavioral Economics Group</a>, Cognitive Friction in Large-Asset Transactions (2024).</li>
              </CitationList>
            </ArticleContainer>
          )}
        </main>
      </Layout>
    </HubContainer>
  );
};
