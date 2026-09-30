import { defineConfig } from 'astro/config';

// Fully static output for GitHub Pages. `site` is used for canonical URLs, Open Graph tags
// and the sitemap. `trailingSlash: 'always'` matches how GitHub Pages serves
// `page/index.html`, so internal links never pay for a redirect.
export default defineConfig({
  site: 'https://realevolution.co.uk',
  output: 'static',
  trailingSlash: 'always',
  // Astro 7 defaults to JSX whitespace rules, which drop the line breaks between prose and
  // inline links/expressions ("the<a>Licence</a>"). `true` compresses losslessly instead.
  compressHTML: true,
  build: {
    format: 'directory',
  },
});
