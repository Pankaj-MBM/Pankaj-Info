// Generates the PNG icons from public/favicon.svg (run: node scripts/make-icons.mjs). Uses sharp, which ships with Astro.
import { readFileSync } from 'node:fs';
import sharp from 'sharp';

const svg = readFileSync('public/favicon.svg');
// App icons get a full-bleed square (iOS/Android round the corners themselves).
const fullBleed = Buffer.from(svg.toString().replace('rx="13"', 'rx="0"'));

const jobs = [
  [svg, 32, 'public/favicon-32.png'],
  [fullBleed, 180, 'public/apple-touch-icon.png'],
  [fullBleed, 192, 'public/icon-192.png'],
  [fullBleed, 512, 'public/icon-512.png'],
];
for (const [source, size, file] of jobs) {
  await sharp(source, { density: 900 }).resize(size, size).png().toFile(file);
  console.log('wrote', file);
}
