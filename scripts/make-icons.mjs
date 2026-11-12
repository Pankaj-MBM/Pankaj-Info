// One-off generator for the PNG icons (run: node scripts/make-icons.mjs). Uses sharp, which ships with Astro.
import sharp from 'sharp';

const mark =
  '<path d="M16 9v15M16 9h3.25a3.4 3.4 0 0 1 0 6.8H16M16 9h-3.25a3.4 3.4 0 0 0 0 6.8H16" fill="none" stroke="#ffffff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>';

// Transparent favicon: blue arch + white mark.
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><path d="M6 29V14.5a10 10 0 0 1 20 0V29H6Z" fill="#1d5bbf"/>${mark}</svg>`;

// App icon: full-bleed brand blue, golden inner arch, white mark (content inside the maskable safe zone).
const appIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b6cd1"/><stop offset="1" stop-color="#0b2556"/></linearGradient></defs>
  <rect width="32" height="32" fill="url(#g)"/>
  <path d="M9 26V15.5a7 7 0 0 1 14 0V26Z" fill="none" stroke="#f2a93b" stroke-width="0.8" opacity="0.9"/>
  <g transform="translate(16 17) scale(0.62) translate(-16 -16.5)">${mark}</g>
</svg>`;

const jobs = [
  [favicon, 32, 'public/favicon-32.png'],
  [appIcon, 180, 'public/apple-touch-icon.png'],
  [appIcon, 192, 'public/icon-192.png'],
  [appIcon, 512, 'public/icon-512.png'],
];

for (const [svg, size, file] of jobs) {
  await sharp(Buffer.from(svg), { density: 600 }).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
