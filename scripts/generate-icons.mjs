// Renders the PWA/Apple icons from an inline SVG. Run with `npm run icons`.
import sharp from 'sharp';

const mark = (size, { padding = 0, radius = 0.23 } = {}) => {
  const inner = size - padding * 2;
  const s = inner / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="#6B6CF6"/><stop offset="1" stop-color="#4338CA"/>
  </linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${size * radius}" fill="url(#g)"/>
  <g transform="translate(${padding} ${padding}) scale(${s})">
    <path d="M19 33.5l8.5 8.5L45 23" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
};

const out = [
  ['public/pwa-192x192.png', mark(192)],
  ['public/pwa-512x512.png', mark(512)],
  // Maskable icons need a full-bleed background and the glyph inside the 80% safe zone.
  ['public/maskable-512x512.png', mark(512, { padding: 80, radius: 0 })],
  ['public/apple-touch-icon.png', mark(180, { padding: 18, radius: 0 })],
];

for (const [file, svg] of out) {
  await sharp(Buffer.from(svg)).png().toFile(file);
  console.log('wrote', file);
}
