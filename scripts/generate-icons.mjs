/**
 * Generates the PWA icons and iOS splash screens from the rehal logo.
 *
 *   npm run icons
 *
 * Output goes to public/icons and is committed, so this only needs re-running
 * when the logo or brand colours change.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const LOGO = new URL("../src/assets/quran-rehal-svgrepo-com.svg", import.meta.url);
const OUT = new URL("../public/icons/", import.meta.url);

// Brand accent from themes.css, graded slightly for depth
const GRADIENT_TOP = "#fd6f82";
const GRADIENT_BOTTOM = "#f2304d";
const SPLASH_BG = "#000000";

/** The logo's inner markup, recoloured white for use on the gradient. */
const logoPaths = (await readFile(LOGO, "utf8"))
  .match(/<g>[\s\S]*<\/g>/)[0]
  .replace("<g>", '<g fill="#ffffff">');

const LOGO_VIEWBOX = 484.228;

/**
 * @param size   Canvas size in px
 * @param glyph  Logo width as a fraction of the canvas
 * @param radius Corner radius as a fraction of the canvas (0 = full bleed)
 */
const iconSvg = (size, { glyph, radius }) => {
  const glyphSize = size * glyph;
  const offset = (size - glyphSize) / 2;
  const scale = glyphSize / LOGO_VIEWBOX;
  const r = size * radius;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${GRADIENT_TOP}"/>
      <stop offset="1" stop-color="${GRADIENT_BOTTOM}"/>
    </linearGradient>
    <radialGradient id="sheen" cx="0.5" cy="0" r="0.9">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.18"/>
      <stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#bg)"/>
  <rect width="${size}" height="${size}" rx="${r}" fill="url(#sheen)"/>
  <g transform="translate(${offset} ${offset}) scale(${scale})">${logoPaths}</g>
</svg>`;
};

const png = (svg, file) =>
  sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(file, OUT)));

await mkdir(OUT, { recursive: true });

// Rounded for browsers/launchers that show the icon as-is
await png(iconSvg(192, { glyph: 0.62, radius: 0.225 }), "icon-192.png");
await png(iconSvg(512, { glyph: 0.62, radius: 0.225 }), "icon-512.png");

// Full bleed: Android crops maskable icons to its own shape, keeping the
// centre 80% circle, so the glyph sits well inside that safe zone
await png(iconSvg(512, { glyph: 0.5, radius: 0 }), "maskable-512.png");

// Full bleed: iOS applies its own rounded mask
await png(iconSvg(180, { glyph: 0.62, radius: 0 }), "apple-touch-icon.png");

// Vector favicon for browser tabs
await writeFile(new URL("favicon.svg", OUT), iconSvg(64, { glyph: 0.66, radius: 0.225 }));

/**
 * iOS ignores the manifest for launch screens and shows white unless it gets
 * an exact-size startup image per device. Portrait, current iPhones.
 */
const SPLASH_DEVICES = [
  // [css width, css height, pixel ratio]
  [440, 956, 3], // 16 Pro Max
  [402, 874, 3], // 16 Pro
  [430, 932, 3], // 14 Pro Max, 15 Plus, 15 Pro Max, 16 Plus
  [393, 852, 3], // 14 Pro, 15, 15 Pro, 16
  [428, 926, 3], // 12 Pro Max, 13 Pro Max, 14 Plus
  [390, 844, 3], // 12, 12 Pro, 13, 13 Pro, 14
  [375, 812, 3], // X, XS, 11 Pro, 12 mini, 13 mini
  [414, 896, 3], // XS Max, 11 Pro Max
  [414, 896, 2], // XR, 11
  [375, 667, 2], // SE (2nd/3rd gen), 8
];

const splashLinks = [];

for (const [w, h, dpr] of SPLASH_DEVICES) {
  const width = w * dpr;
  const height = h * dpr;
  const iconSize = Math.round(width * 0.28);
  const file = `splash-${width}x${height}.png`;

  const icon = await sharp(Buffer.from(iconSvg(iconSize, { glyph: 0.62, radius: 0.225 })))
    .png()
    .toBuffer();

  await sharp({
    create: { width, height, channels: 3, background: SPLASH_BG },
  })
    .composite([{ input: icon, gravity: "centre" }])
    .png({ compressionLevel: 9 })
    .toFile(fileURLToPath(new URL(file, OUT)));

  splashLinks.push(
    `<link rel="apple-touch-startup-image" media="(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)" href="/icons/${file}" />`
  );
}

console.log("Icons written to public/icons\n\nSplash <link> tags for index.html:\n");
console.log(splashLinks.join("\n"));
