// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Public address — used for canonical URLs, Open Graph tags and the sitemap. SITE_URL overrides it
// (e.g. for a preview deployment).
const site = process.env.SITE_URL ?? 'https://pankaj.2026.co.in';

export default defineConfig({
  site,
  integrations: [sitemap({ filter: (page) => !page.includes('/404') })],
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  build: { inlineStylesheets: 'auto' },
  vite: { plugins: [tailwindcss()] },
});
