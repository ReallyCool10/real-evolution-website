# Real Evolution website

Static site for [realevolution.co.uk](https://realevolution.co.uk), built with
[Astro](https://astro.build) and hosted on GitHub Pages.

Pages are plain HTML and CSS at build time: no client-side framework ships to the browser.
The only JavaScript is a few inline lines that defer the second and third hero images and
upgrade the contact form to an in-page submit (the form still works without it).

## Commands

Requires Node 22.12 or newer.

```bash
npm install
npm run dev        # local dev server at http://localhost:4321
npm run build      # type-check (astro check) and build to dist/
npm run preview    # serve the built dist/ locally
```

Pushing to `main` builds and deploys via `.github/workflows/static.yml`. Pull requests run the
same type-check and build without deploying.

## Layout

| Path | What lives there |
| :-- | :-- |
| `src/pages/` | One file per URL. Articles are in `src/pages/articles/`. |
| `src/layouts/` | `BaseLayout` (head, nav, footer) and `ArticleLayout` (article sidebar, header). |
| `src/components/charts/` | `BarChart` (HTML/CSS bars) and `LineChart`, both rendered at build time. |
| `src/data/site.ts` | Navigation and the article list (drives the sidebar, index and page titles). |
| `src/data/charts.ts` | Every dataset shown in a chart, with its sources. |
| `src/data/land-use.ts` | Land use percentages and land cover table. |
| `src/styles/global.css` | Design tokens (colours, fonts, spacing) and shared base styles. |
| `src/assets/` | Source images; Astro resizes and converts them to AVIF/WebP at build. |
| `public/` | Files served as-is: favicon, icons, share image, robots.txt, CNAME. |
| `scripts/build-uk-silhouette.mjs` | Regenerates the UK outline used on the Land Use page. |
| `REAL-intel/` | Separate local GIS tool; not part of the website build. |

## Common changes

- **Add an article:** create `src/pages/articles/<slug>.astro` using `ArticleLayout`, then add
  its metadata to `ARTICLES` in `src/data/site.ts`.
- **Correct a chart figure:** edit `src/data/charts.ts`; every page using it updates.
- **Change land use shares:** edit `src/data/land-use.ts`, update `THRESHOLDS` in
  `scripts/build-uk-silhouette.mjs` to match, and run `npm run data:uk-silhouette`
  (needs network access).
