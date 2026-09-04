import React, { useState } from 'react';
import styled from 'styled-components';
import { VisualChart } from './VisualChart';

const HubContainer = styled.div`
  max-width: 1400px;
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
                  <span>Reading Time: 1 min</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  England has far fewer dwellings relative to its population than other developed nations, with just <strong>434 homes per thousand inhabitants</strong>, fewer than France (591), Italy (598), and the OECD average of 487 <sup>[1]</sup>. Closing the gap to the OECD average alone would require approximately <strong>3.1 million additional homes</strong> <sup>[2]</sup>.
                </p>

                <blockquote>
                  <p>
                    The persistent undersupply of housing in the UK has created a system built around structural scarcity. Demand keeps growing, from both homeowners seeking stability and investors targeting appreciating assets, but the housing stock hasn't kept pace.
                  </p>
                </blockquote>

                <VisualChart type="deficit" />

                <h3>completions and Local Disparities</h3>
                <p>
                  Completion rates remain modest relative to the size of the existing stock. In 2024-25, new-build completions ran at <strong>33 per 10,000 people in England</strong>, 35 in Scotland, 32 in Northern Ireland and 15 in Wales <sup>[3]</sup>. At roughly three homes per thousand people a year, the per-capita gap described above closes over decades rather than years.
                </p>

                <p>
                  Commercial real estate points to a parallel structural shift. Central London office vacancy stood at <strong>10.1% in Q3 2024</strong>, above its ten-year average of 9.0%, with the City higher still at 11.8% <sup>[4]</sup>. That is a meaningful pool of underused floorspace, some of which could be suitable for conversion to housing.
                </p>
              </ArticleBody>

               <CitationList>
                <li>[1] Home Builders Federation, <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noopener noreferrer">Housing Horizons: Examining UK Housing Stock in an International Context</a> (October 2023). Dwellings per thousand inhabitants, 2020 data; England figure benchmarked against OECD.</li>
                <li>[2] Deficit calculation: (487 − 434) × 57,690,300 ÷ 1,000 ≈ 3,057,586 homes. England population: <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2023" target="_blank" rel="noopener noreferrer">ONS mid-2023 population estimates</a> (57,690,300).</li>
                <li>[3] Scottish Government, <a href="https://www.gov.scot/publications/quarterly-housing-statistics-december-2025/pages/housing-supply-including-affordable-across-the-uk/" target="_blank" rel="noopener noreferrer">Housing supply across the UK</a>. New-build completions per 10,000 population, financial year 2024-25.</li>
                <li>[4] BNP Paribas Real Estate, <a href="https://www.realestate.bnpparibas.co.uk/sites/default/files/2024-10/CentralLondonMarketUpdateQ32024.pdf" target="_blank" rel="noopener noreferrer">Central London Offices Update, Q3 2024</a>. Central London vacancy 10.1%; City 11.82%; ten-year average 9.0%.</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'quality' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Quality & Housing Age</Category>
                <ArticleTitle>Europe's Oldest Hearth: The UK's Housing Quality Gap</ArticleTitle>
                <MetaRow>
                  <span>Published: Q2 2026</span>
                  <span>Reading Time: 1 min</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  Beyond absolute scarcity, the UK has amongst the oldest and least energy-efficient housing stocks in Europe. <strong>78% of homes</strong> were built before 1980, compared to an EU average of 61%. And <strong>38% of the housing stock</strong> was built before 1946, compared to the EU average of 18% <sup>[1]</sup>.
                </p>

                <blockquote>
                  <p>
                    Leaving the historical housing envelope unmodernized has direct public health and environmental consequences.
                  </p>
                </blockquote>

                <VisualChart type="quality" />

                <h3>Failure to Meet Basic Decency</h3>
                <p>
                  This historical legacy has a direct impact on the livability of homes: <strong>15%, or 3.7 million dwellings, failed to meet the Decent Homes Standard</strong> in 2022 <sup>[2]</sup>. Private renters are worst affected, with 21% living in non-decent conditions, against 14% of owner-occupied and 10% of social rented homes. The Home Builders Federation puts England's proportion of substandard homes as the highest in Europe on this measure, ahead of Germany (12%), Bulgaria (11%), Lithuania (11%) and Poland (6%) <sup>[3]</sup>.
                </p>

                <h3>The Downstream Cost of an Ageing Stock</h3>
                <p>
                  Homes built before modern insulation standards tend to be significantly less energy-efficient. The BRE Trust estimates that poor housing conditions in England cost the NHS approximately <strong>£1.4 billion per year</strong> in first-year treatment costs for conditions linked to cold, damp, and hazardous homes <sup>[4]</sup>. Excess cold alone accounts for £857 million of that figure.
                </p>
                <p>
                  These are structural characteristics of the existing housing grid, not individual choices. Understanding the scale of this quality deficit is a prerequisite for any serious conversation about housing reform in the UK.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] Home Builders Federation, <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noopener noreferrer">Housing Horizons: Examining UK Housing Stock in an International Context</a> (October 2023), housing stock age against EU averages.</li>
                <li>[2] <a href="https://assets.publishing.service.gov.uk/media/657c3ff691864e001308bdba/2022-23_EHS_Headline_Report.pdf" target="_blank" rel="noopener noreferrer">English Housing Survey 2022-23, Headline Report</a>, Department for Levelling Up, Housing &amp; Communities. "In 2022, 15% or 3.7 million dwellings failed to meet the Decent Homes Standard."</li>
                <li>[3] Home Builders Federation, <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noopener noreferrer">Housing Horizons: Examining UK Housing Stock in an International Context</a> (October 2023), European comparison based on 2020 data.</li>
                <li>[4] <a href="https://www.bregroup.com/press-releases/bre-report-finds-poor-housing-is-costing-nhs-1-4bn-a-year/" target="_blank" rel="noopener noreferrer">BRE Trust</a>, The Cost of Poor Housing to the NHS (2021).</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'friction' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Financial Friction</Category>
                <ArticleTitle>The Cost of Friction: A Slow, Fragile Buying Cycle</ArticleTitle>
                <MetaRow>
                  <span>Published: Q2 2026</span>
                  <span>Reading Time: 2 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  House prices have risen far faster than earnings for three decades. In 2025 the median home in England cost <strong>7.6 times median annual earnings</strong> (£300,000 against £39,300), roughly double the ratio when the ONS affordability series began in 1997 <sup>[1]</sup>.
                </p>

                <blockquote>
                  <p>
                    The transaction process itself hasn't kept up. Onward chains, hidden property defects, and a lack of upfront mortgage clarity leave buyers and sellers stuck in limbo.
                  </p>
                </blockquote>

                <VisualChart type="affordability" />

                <h3>Collapsing Chains and Wasted Capital</h3>
                <p>
                  Buying a home in the UK involves a lot of uncertainty. Published fall-through rates vary by source and by quarter, but cluster around a quarter of agreed sales: TwentyCi put the national rate at <strong>23.7% in Q1 2026</strong>, little changed from 24% a year earlier, while Quick Move Now recorded over a quarter of sales collapsing across 2024 with individual quarters peaking above 30% <sup>[3]</sup>. In absolute terms TwentyCi counted <strong>303,538 failed transactions in 2025</strong>, up 4.5% on the previous year. Buyers and sellers lose between £500 and £3,500 in non-recoverable survey, legal, and mortgage fees per failed attempt.
                </p>

                <p>
                  The leading causes of transaction collapse are problems uncovered during building surveys and difficulty securing a mortgage. In Quick Move Now's Q2 2026 analysis, buyer mortgage or lending issues accounted for 33% of fall-throughs and survey issues for 27% <sup>[3]</sup>. This friction is compounded by a lack of trust: undisclosed defects and complex onward chains leave buyers and sellers stuck.
                </p>

                <h3>The Transactional Drag</h3>
                <p>
                  Beyond the stress of failed sales, the cost of successfully transacting is itself a major economic drag. The UK estate agency sector alone generates <strong>£5.7 billion per year</strong> in commission revenue. On top of this, conveyancing solicitor fees add approximately <strong>£2.5 billion</strong>, and mortgage broker charges a further <strong>£0.7 billion</strong> annually. In total, over <strong>£9 billion per year</strong> goes to intermediary transaction fees across the UK's ~1.1 million annual home sales <sup>[4]</sup>, capital that is diverted away from the productive economy.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/housing/bulletins/housingaffordabilityinenglandandwales/2025" target="_blank" rel="noopener noreferrer">ONS, Housing affordability in England and Wales: 2025</a>. Median house price to median gross annual earnings, full-time employees; series begins 1997.</li>
                <li>[2] <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/ratioofhousepricetoworkplacebasedearningslowerquartileandmedian" target="_blank" rel="noopener noreferrer">ONS, Ratio of house price to workplace-based earnings</a> (median and lower quartile), 1997&ndash;2025.</li>
                <li>[3] <a href="https://www.twentyci.co.uk/phmr/" target="_blank" rel="noopener noreferrer">TwentyCi Property &amp; Homemover Report</a> (national fall-through rate and failed-transaction counts); reasons-for-failure breakdown from <a href="https://www.quickmovenow.com/media-centre/property-sale-fall-through-indexes" target="_blank" rel="noopener noreferrer">Quick Move Now's fall-through index</a>.</li>
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
                  <span>Reading Time: 2 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  In a thought experiment published in <em>The Spectator</em> (November 2024), Rory Sutherland (Vice Chairman of Ogilvy Group and behavioral economist) proposed a psychological solution to the housing market's illiquidity: <strong>what if every home in the country was listed for sale all the time?</strong> <sup>[1]</sup>.
                </p>

                <blockquote>
                  <p>
                    "It would be a disaster if we applied the same principle to dating &ndash; it would lead to massive promiscuity and family breakdown. But in all other markets, we call promiscuity 'liquidity', and it's exactly what families need."
                  </p>
                </blockquote>

                <p>
                  Sutherland argues that the UK's illiquid housing market is as much a behavioral question as a physical supply constraint. Millions of homeowners live in properties that no longer suit their needs, such as empty-nester retirees holding large 4-bedroom detached family homes, but avoid moving simply because the administrative, marketing, and psychological friction of active listing is too daunting.
                </p>

                <VisualChart type="sutherland" />

                <h3>The Psychology of Unsolicited Bids</h3>
                <p>
                  Sutherland's proposal is deliberately simple: government "mandates that all homes are for sale all the time", with "no obligation to sell &ndash; you could simply quote a ridiculously high price" <sup>[1]</sup>. An owner content where they are names a figure high enough to make a sale unlikely; buyers can then approach any property directly, rather than choosing only from the small fraction actively listed.
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
                    <em>Mitigation</em>: The platform must support delayed possession or leaseback options. Sellers could be legally entitled to a 6-month rent-free residency period post-transaction to source their onward home, decoupling transaction execution from physical move-in dates.
                  </li>
                  <li>
                    <strong>Municipal Rate Revaluations</strong>: Speculative offers could lead to local tax reassessment traps, penalizing owners for bids they never requested.
                    <br />
                    <em>Mitigation</em>: Speculative bids must remain confidential and legally protected from tax reassessments unless a formal sale transaction takes place.
                  </li>
                </ul>
              </ArticleBody>

              <CitationList>
                <li>[1] Rory Sutherland, "<a href="https://www.spectator.co.uk/article/how-to-buy-a-house-that-isnt-on-the-market/" target="_blank" rel="noopener noreferrer">How to buy a house that isn't on the market</a>," <em>The Spectator</em>, 9 November 2024.</li>
              </CitationList>
            </ArticleContainer>
          )}
        </main>
      </Layout>
    </HubContainer>
  );
};
