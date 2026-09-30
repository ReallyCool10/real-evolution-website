// Generated at build time from every page in src/pages, so new pages are listed automatically.
import type { APIRoute } from 'astro';

const pages = import.meta.glob('./**/*.astro');

export const GET: APIRoute = ({ site }) => {
  const urls = Object.keys(pages)
    .filter(file => file !== './404.astro')
    .map(file => file.replace(/^\.\//, '/').replace(/(index)?\.astro$/, ''))
    .map(path => (path.endsWith('/') ? path : `${path}/`))
    .sort()
    .map(path => `  <url><loc>${new URL(path, site)}</loc></url>`)
    .join('\n');

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } });
};
