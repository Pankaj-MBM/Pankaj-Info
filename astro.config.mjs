// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Set SITE_URL in the hosting dashboard (e.g. https://pankajparihar.dev) — used for canonical URLs,
// Open Graph tags and the sitemap. Falls back to the local dev server.
const site = process.env.SITE_URL ?? 'http://localhost:4321';

export default defineConfig({
  site,
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
});
