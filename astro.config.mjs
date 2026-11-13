// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Public address — used for canonical URLs, Open Graph tags and the sitemap. SITE_URL overrides it
// (e.g. for a preview deployment).
const site = process.env.SITE_URL ?? 'https://pankaj.2026.co.in';
// Catalyst Cloud Scale web-client hosting serves the site under /app/ (`npm run build:client`);
// Slate serves it at the root.
const base = process.env.BASE_PATH ?? '/';
// That host doesn't resolve folder URLs to index.html, so sitemap entries point at the file itself
// (mirrors pagePath() in src/lib/url.ts).
const rootUrl = new URL(base.endsWith('/') ? base : `${base}/`, site).href;
const explicitIndex = (/** @type {{ url: string }} */ item) =>
  base !== '/' && item.url !== rootUrl && item.url.endsWith('/') ? { ...item, url: `${item.url}index.html` } : item;

export default defineConfig({
  site,
  base,
  outDir: process.env.OUT_DIR ?? './dist',
  integrations: [sitemap({ filter: (page) => !page.includes('/404'), serialize: explicitIndex })],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
});
