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
  const [activeArticle, setActiveArticle] = useState<'deficit' | 'quality' | 'friction' | 'sutherland' | 'nations' | 'averages' | 'location'>('deficit');

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
          <SidebarButton
            active={activeArticle === 'nations'}
            onClick={() => setActiveArticle('nations')}
          >
            Four Nations, Four Markets
          </SidebarButton>
          <SidebarButton
            active={activeArticle === 'averages'}
            onClick={() => setActiveArticle('averages')}
          >
            The Trouble With Averages
          </SidebarButton>
          <SidebarButton
            active={activeArticle === 'location'}
            onClick={() => setActiveArticle('location')}
          >
            Location, Location, Location
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
                  The UK has far fewer dwellings relative to its population than other developed nations, with just <strong>446 homes per thousand inhabitants</strong>, fewer than France (591), Italy (598), and the OECD average of 487 <sup>[1]</sup>. Closing the gap to the OECD average alone would require approximately <strong>2.8 million additional homes</strong> <sup>[2]</sup>.
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
                <li>[1] Home Builders Federation, <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noopener noreferrer">Housing Horizons: Examining UK Housing Stock in an International Context</a> (October 2023), OECD benchmark of 487 (2020 data). The UK figure (446 per 1,000) is a combined calculation across all four nations - see "Four Nations, Four Markets" for the by-nation breakdown and sources.</li>
                <li>[2] Deficit calculation: (487 − 446) × 68,265,200 ÷ 1,000 ≈ 2,798,873 homes. UK population: <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/populationandmigration/populationestimates/bulletins/annualmidyearpopulationestimates/mid2023" target="_blank" rel="noopener noreferrer">ONS mid-2023 population estimates</a> (68,265,200).</li>
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
                  House prices have risen far faster than earnings for three decades. In 2025 the median UK home cost <strong>6.6 times median annual earnings</strong> (£264,936 against £39,863), roughly double the ratio when the ONS affordability series began in 1997 <sup>[1]</sup>.
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
                <li>[2] <a href="https://www.ons.gov.uk/peoplepopulationandcommunity/housing/datasets/ratioofhousepricetoworkplacebasedearningslowerquartileandmedian" target="_blank" rel="noopener noreferrer">ONS, Ratio of house price to workplace-based earnings</a> (median and lower quartile), 1997-2025.</li>
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
                    "It would be a disaster if we applied the same principle to dating - it would lead to massive promiscuity and family breakdown. But in all other markets, we call promiscuity 'liquidity', and it's exactly what families need."
                  </p>
                </blockquote>

                <p>
                  Sutherland argues that the UK's illiquid housing market is as much a behavioral question as a physical supply constraint. Millions of homeowners live in properties that no longer suit their needs, such as empty-nester retirees holding large 4-bedroom detached family homes, but avoid moving simply because the administrative, marketing, and psychological friction of active listing is too daunting.
                </p>

                <VisualChart type="sutherland" />

                <h3>The Psychology of Unsolicited Bids</h3>
                <p>
                  Sutherland's proposal is deliberately simple: government "mandates that all homes are for sale all the time", with "no obligation to sell - you could simply quote a ridiculously high price" <sup>[1]</sup>. An owner content where they are names a figure high enough to make a sale unlikely; buyers can then approach any property directly, rather than choosing only from the small fraction actively listed.
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

          {activeArticle === 'nations' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Regional Comparison</Category>
                <ArticleTitle>Four Nations, Four Markets</ArticleTitle>
                <MetaRow>
                  <span>Published: Q3 2026</span>
                  <span>Reading Time: 1 min</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  UK housing figures are usually reported as a single national number, but England, Scotland, Wales and Northern Ireland have meaningfully different housing markets. Comparing dwellings per capita, average house prices, and the price-to-earnings ratio across all four shows where the pressure is actually concentrated <sup>[1]</sup>.
                </p>

                <h3>Dwellings Per Capita</h3>
                <p>
                  Northern Ireland has the fewest dwellings relative to its population among the four nations, at 43.2 per 100 people, just below England's 44.0. Wales (46.7) and Scotland (49.5) are both better supplied, though all four still fall short of the OECD average of 48.7 <sup>[1]</sup><sup>[2]</sup>.
                </p>

                <VisualChart type="nations-dwellings" />

                <h3>House Prices</h3>
                <p>
                  House prices vary far more sharply than housing supply does. As of January 2023, the average home in England cost £285,817, compared with £201,853 in Wales, £175,092 in Scotland, and £162,479 in Northern Ireland <sup>[3]</sup>.
                </p>

                <VisualChart type="nations-price" />

                <h3>Affordability: Price to Earnings</h3>
                <p>
                  Scotland combines relatively low house prices with the UK's highest median full-time earnings of the four nations (£709 a week in 2023), giving it by far the most affordable price-to-earnings ratio at 4.75x. England, despite not having the lowest dwellings per capita, has both the highest prices and the highest ratio, at 7.97x <sup>[3]</sup><sup>[4]</sup>.
                </p>

                <VisualChart type="nations-ratio" />

                <p>
                  The pattern suggests undersupply alone doesn't explain the UK's affordability problem. Northern Ireland has a tighter dwellings-per-capita figure than England, yet its housing is far more affordable, because prices and wages there sit much closer together.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] Home Builders Federation, <a href="https://www.hbf.co.uk/news/housing-horizons/" target="_blank" rel="noopener noreferrer">Housing Horizons: Examining UK Housing Stock in an International Context</a> (October 2023). OECD benchmark, 2020 data.</li>
                <li>[2] Dwelling stock estimates, ~2023: <a href="https://www.gov.uk/government/statistics/dwelling-stock-estimates-in-england-2023/dwelling-stock-estimates-england-31-march-2023" target="_blank" rel="noopener noreferrer">MHCLG, England</a> (31 March 2023); <a href="https://www.nrscotland.gov.uk/publications/households-and-dwellings-in-scotland-2023/" target="_blank" rel="noopener noreferrer">National Records of Scotland</a> (2023); <a href="https://www.gov.wales/dwelling-stock-estimates-31-march-2023-html" target="_blank" rel="noopener noreferrer">Welsh Government</a> (31 March 2023); <a href="https://datavis.nisra.gov.uk/communities/northern-ireland-housing-statistics-2022-2023.html" target="_blank" rel="noopener noreferrer">NISRA</a> (April 2023). Population: ONS mid-2023 estimates.</li>
                <li>[3] HM Land Registry / ONS, <a href="https://landregistry.data.gov.uk/app/ukhpi" target="_blank" rel="noopener noreferrer">UK House Price Index</a>, average price by nation, January 2023.</li>
                <li>[4] ONS, <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/datasets/placeofworkbylocalauthorityashetable7" target="_blank" rel="noopener noreferrer">ASHE Table 7.1a</a> (Work Geography): median gross weekly earnings, full-time, 2023 (England, Wales, Scotland); <a href="https://www.nisra.gov.uk/statistics/work-pay-and-benefits/annual-survey-hours-and-earnings" target="_blank" rel="noopener noreferrer">NISRA Annual Survey of Hours and Earnings</a>, 2023 (Northern Ireland).</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'averages' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Methodology</Category>
                <ArticleTitle>The Trouble With Averages</ArticleTitle>
                <MetaRow>
                  <span>Published: Q3 2026</span>
                  <span>Reading Time: 2 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  Every chart on this site relies on an average of some kind: a median house price, a median wage, a per-capita dwelling count. Averages are useful. They are also a compression of a much messier reality, and the compression can hide exactly the detail that matters most.
                </p>

                <h3>No Nation Is Average</h3>
                <p>
                  In 1950, the US Air Force asked researcher Gilbert Daniels to work out how many of its pilots actually matched the "average pilot" its cockpits had been designed around. Daniels measured 4,063 pilots across ten body dimensions. Not one of them was average on all ten <sup>[1]</sup>. The average pilot didn't exist, and a cockpit built for him fit almost nobody. Our own "Four Nations, Four Markets" makes a similar point about housing: a single UK figure for dwellings per capita, house prices, or affordability describes a nation, not a place any household actually lives in.
                </p>

                <h3>Planning Around a Number That Doesn't Exist</h3>
                <p>
                  Statistician Sam Savage calls this the flaw of averages: plans built on a single central estimate, rather than the actual spread of outcomes around it, tend to be wrong on average <sup>[2]</sup>. A national house price figure that averages £600,000 London flats with £120,000 terraces elsewhere in the country describes neither market accurately.
                </p>

                <h3>Why We Still Use Medians</h3>
                <p>
                  Most of the housing statistics on this site, and most of the official ones they're drawn from, use the median rather than the mean specifically because house prices and earnings are skewed: a small number of very expensive properties or very high earners pull a simple average upward, while the median describes the middle of the distribution more honestly <sup>[3]</sup>. That's a real improvement over a raw mean, but it doesn't solve the deeper problem. A median for the whole UK still says nothing about how far any one region sits from it, which is exactly what "Four Nations, Four Markets" and the Resolution Foundation's own work on regional affordability both show matters <sup>[4]</sup>.
                </p>

                <p>
                  None of this means national figures are useless. They're a reasonable place to start. But treating them as the whole picture, rather than a starting point, is exactly the kind of generic framing our own Purpose page argues against: solving the housing crisis requires specific, buildable interventions in specific places, not a single national number.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] Todd Rose, <em>The End of Average: How We Succeed in a World That Values Sameness</em> (2016), recounting Gilbert S. Daniels' 1952 US Air Force cockpit study. Summary: <a href="https://futureforlearning.org/media/end-of-average/" target="_blank" rel="noopener noreferrer">Partnership for the Future of Learning</a>.</li>
                <li>[2] Sam L. Savage, <em>The Flaw of Averages: Why We Underestimate Risk in the Face of Uncertainty</em> (2009). <a href="https://www.flawofaverages.com/books" target="_blank" rel="noopener noreferrer">flawofaverages.com</a>.</li>
                <li>[3] ONS, <a href="https://www.ons.gov.uk/employmentandlabourmarket/peopleinwork/earningsandworkinghours/methodologies/guidetointerpretingannualsurveyofhoursandearningsasheestimates/pdf" target="_blank" rel="noopener noreferrer">Guide to interpreting Annual Survey of Hours and Earnings (ASHE) estimates</a>: median preferred over mean due to skewed earnings distribution.</li>
                <li>[4] Resolution Foundation, <a href="https://www.resolutionfoundation.org/comment/two-housing-crises/" target="_blank" rel="noopener noreferrer">Two housing crises</a>, on how national affordability figures mask regional disparity.</li>
              </CitationList>
            </ArticleContainer>
          )}

          {activeArticle === 'location' && (
            <ArticleContainer>
              <ArticleHeader>
                <Category>Location &amp; Demand</Category>
                <ArticleTitle>Location, Location, Location: How Much Does London Distort the Picture?</ArticleTitle>
                <MetaRow>
                  <span>Published: Q3 2026</span>
                  <span>Reading Time: 3 mins</span>
                </MetaRow>
              </ArticleHeader>

              <ArticleBody>
                <p>
                  As of November 2025, the average home in London cost £556,044, against £294,466 in England and £272,248 across the UK as a whole <sup>[1]</sup>. London alone is worth roughly double the national figure. "Location, location, location" is the oldest cliche in property, but it raises a real question for a site built on national averages: how much of the national picture is actually just London, and how much of London's own premium is domestic desirability versus money from abroad?
                </p>

                <VisualChart type="london-premium" />

                <p>
                  It's worth going one step further than the headline nation-vs-capital comparison. Stripping London's own sales out of the England and UK figures entirely, using the same underlying transaction-weighted dataset, leaves an average home price of <strong>£266,965 for the rest of England</strong> and <strong>£250,113 for the rest of the UK</strong> <sup>[1]</sup>, both meaningfully below the published national averages. London isn't just an outlier sitting on top of the national figure; it's propping that figure up.
                </p>

                <h3>The Superstar City Effect</h3>
                <p>
                  Economists Joseph Gyourko, Christopher Mayer and Todd Sinai call cities like London "superstar cities": places where the supply of land is effectively fixed, and a growing number of high-income households nationally compete for the same scarce, unique locations <sup>[2]</sup>. Prices in these cities decouple from local wages because the buyers bidding them up aren't only local; they're the country's highest earners choosing where to live. This mechanism would produce a large London premium even if not a single overseas buyer ever entered the market. It's also not a one-way ratchet: in the twelve months to November 2025, London prices actually fell 0.7% while the UK as a whole rose 2.9% <sup>[1]</sup>, a reminder that the premium is a deep structural gap built up over decades, not evidence of an active, ongoing price surge.
                </p>

                <h3>How Much Is International Demand, Really?</h3>
                <p>
                  The most detailed answer comes from a University of York study commissioned by the Greater London Authority, which traced Land Registry sales of new-build homes across London between April 2014 and March 2016 <sup>[3]</sup>. Overseas buyers accounted for <strong>13% of all new-build sales</strong> London-wide, rising from 10.5% in 2014 to 17.9% in 2016. That share concentrates enormously in the prime central boroughs: overseas buyers made up <strong>40.8% of sales in the City of London, 37.9% in Westminster, and 32.2% in Kensington &amp; Chelsea</strong>, against just 5.7% in outer London <sup>[3]</sup>.
                </p>

                <VisualChart type="london-overseas" />

                <p>
                  But those three prime boroughs account for only around 7% of all new-build sales in London. Overseas money is genuinely concentrated at the very top of the market, but the top of the market is a small slice of the city, which is why the researchers describe its direct effect on London-wide prices as limited.
                </p>

                <h3>Occupied, Not Empty</h3>
                <p>
                  The other half of the "investment demand" question is whether these homes sit empty. Using commercial and administrative data as a proxy for occupation, the same study inferred that 10.2% of new-build homes across London were under-used in some way, rising to around half in prime central London specifically. Overseas owners were more likely to hold an under-used property than UK owners (42.3% versus 5.6%) <sup>[3]</sup>. But because overseas buyers are a minority of the market, the absolute numbers were close either way: an estimated 402 under-used homes owned overseas against 389 owned by UK buyers, in a sample of under 8,000 properties. Even the "empty homes" story, once you look past the headline percentage, turns out to be roughly split rather than a story about foreign money alone.
                </p>
              </ArticleBody>

              <CitationList>
                <li>[1] HM Land Registry / ONS, <a href="https://www.gov.uk/government/statistical-data-sets/uk-house-price-index-data-downloads-january-2026" target="_blank" rel="noopener noreferrer">UK House Price Index: data downloads</a>. Average price, 12-month growth rate and sales volume by nation and region, reference month November 2025 (the most recent month with published regional sales volumes at time of writing). England-excluding-London and UK-excluding-London figures are our own calculation: subtracting London's sales volume and total sale value from the England and UK totals in the same dataset, then dividing through, so all figures are transaction-weighted and drawn from a single consistent source.</li>
                <li>[2] Joseph Gyourko, Christopher Mayer and Todd Sinai, <a href="https://www.nber.org/papers/w12355" target="_blank" rel="noopener noreferrer">Superstar Cities</a>, NBER Working Paper 12355, published in <em>American Economic Journal: Economic Policy</em> (2013).</li>
                <li>[3] Alison Wallace, David Rhodes and Richard Webber (Centre for Housing Policy, University of York), <a href="https://www.london.gov.uk/sites/default/files/08b2c_overseas_buyers_-_homes_for_londoners_sub_group_-_university_of_york_data_report.pdf" target="_blank" rel="noopener noreferrer">Overseas Investors in London's New Build Housing Market</a> (June 2017), commissioned by the Greater London Authority. Land Registry sales data, new-build homes, April 2014 - March 2016.</li>
              </CitationList>
            </ArticleContainer>
          )}
        </main>
      </Layout>
    </HubContainer>
  );
};
