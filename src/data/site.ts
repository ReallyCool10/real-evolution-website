// Site-wide constants: navigation and the article list. Adding an article means adding a
// page under src/pages/articles/ and one entry here (drives the sidebar and the index).

export const SITE = {
  name: 'Real Evolution',
  title: 'Real Evolution | Optimizing the Built Environment',
  description:
    'Research-backed strategies and solutions to maximize the efficiency and utility of existing buildings.',
  email: 'info@realevolution.co.uk',
};

export type NavLink = { href: string; label: string };

export const NAV_LINKS: NavLink[] = [
  { href: '/', label: 'Home' },
  { href: '/problem/', label: 'The REAL Problem' },
  { href: '/numbers/', label: 'The REAL Numbers' },
  { href: '/articles/', label: 'Articles' },
  { href: '/land-use/', label: 'Land Use' },
  { href: '/contact/', label: 'Contact' },
];

export type ArticleMeta = {
  slug: string;
  navTitle: string;
  title: string;
  category: string;
  published: string;
  readingTime: string;
  summary: string;
};

export const ARTICLES: ArticleMeta[] = [
  {
    slug: 'supply-deficit',
    navTitle: 'The Supply Deficit',
    title: "The Deficit in Brick & Mortar: UK's Housing Scarcity",
    category: 'Supply & Density',
    published: 'Q1 2026',
    readingTime: '1 min',
    summary: 'The UK has fewer dwellings per head than most developed nations. Closing the gap to the OECD average would take around 2.8 million homes.',
  },
  {
    slug: 'housing-quality',
    navTitle: "Europe's Oldest Hearth",
    title: "Europe's Oldest Hearth: The UK's Housing Quality Gap",
    category: 'Quality & Housing Age',
    published: 'Q2 2026',
    readingTime: '1 min',
    summary: 'The UK has one of the oldest housing stocks in Europe, and 15% of English homes fail the Decent Homes Standard.',
  },
  {
    slug: 'cost-of-friction',
    navTitle: 'The Cost of Friction',
    title: 'The Cost of Friction: A Slow, Fragile Buying Cycle',
    category: 'Financial Friction',
    published: 'Q2 2026',
    readingTime: '2 mins',
    summary: 'Roughly a quarter of agreed sales fall through, and over £9 billion a year goes on intermediary fees.',
  },
  {
    slug: 'continuous-market',
    navTitle: 'The Continuous Market',
    title: 'The Continuous Market: Rory Sutherland’s Universal Registry',
    category: 'Behavioral Economics',
    published: 'Q2 2026',
    readingTime: '2 mins',
    summary: 'What if every home in the country was listed for sale all the time? A behavioural take on housing illiquidity.',
  },
  {
    slug: 'four-nations',
    navTitle: 'Four Nations, Four Markets',
    title: 'Four Nations, Four Markets',
    category: 'Regional Comparison',
    published: 'Q3 2026',
    readingTime: '1 min',
    summary: 'England, Scotland, Wales and Northern Ireland compared on supply, prices and affordability.',
  },
  {
    slug: 'trouble-with-averages',
    navTitle: 'The Trouble With Averages',
    title: 'The Trouble With Averages',
    category: 'Methodology',
    published: 'Q3 2026',
    readingTime: '2 mins',
    summary: 'National averages are a useful starting point, and a misleading end point.',
  },
  {
    slug: 'london',
    navTitle: 'Location, Location, Location',
    title: 'Location, Location, Location: How Much Does London Distort the Picture?',
    category: 'Location & Demand',
    published: 'Q3 2026',
    readingTime: '3 mins',
    summary: 'How much of the national picture is really London, and how much of London is overseas money?',
  },
];

export function getArticle(slug: string): ArticleMeta {
  const article = ARTICLES.find(a => a.slug === slug);
  if (!article) throw new Error(`Unknown article slug: ${slug}`);
  return article;
}
