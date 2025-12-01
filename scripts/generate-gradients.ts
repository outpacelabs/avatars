/**
 * Gradient Avatar Generator
 *
 * Uses Puppeteer to render mesh gradients and save them as circular WebP images.
 * Creates organic, blurred color blobs that blend together.
 *
 * Usage: npx tsx scripts/generate-gradients.ts
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { GRADIENT_PALETTES } from './gradient-palettes';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'avatars');
const SIZE = 2000;

async function generateGradients() {
  console.log('Starting gradient generation...');
  console.log(`Output directory: ${OUTPUT_DIR}`);
  console.log(`Generating ${GRADIENT_PALETTES.length} gradients at ${SIZE}x${SIZE}px`);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const palette of GRADIENT_PALETTES) {
    const { id, colors, harmony } = palette;
    console.log(`Generating gradient ${id + 1}/${GRADIENT_PALETTES.length} (${harmony})...`);

    // Create fresh page for each gradient to ensure clean slate
    const page = await browser.newPage();
    await page.setViewport({ width: SIZE, height: SIZE, deviceScaleFactor: 1 });

    // Create HTML with the mesh gradient
    const html = generateHTML(colors, id);
    await page.setContent(html, { waitUntil: 'load' });

    // Wait for canvas to render
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Screenshot
    const outputPath = path.join(OUTPUT_DIR, `gradient-${id}.jpg`);
    await page.screenshot({
      path: outputPath,
      type: 'jpeg',
      quality: 90,
    });

    await page.close();
    console.log(`  Saved: gradient-${id}.jpg (${colors.length} colors)`);
  }

  await browser.close();
  console.log(`\nDone! Generated ${GRADIENT_PALETTES.length} gradients in ${OUTPUT_DIR}`);
}

function generateHTML(colors: string[], seed: number): string {
  const colorArray = JSON.stringify(colors);

  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${SIZE}px;
      height: ${SIZE}px;
      overflow: hidden;
      background: ${colors[0]};
    }
    #gradient-container {
      width: ${SIZE}px;
      height: ${SIZE}px;
      overflow: hidden;
    }
    canvas {
      width: 100%;
      height: 100%;
      filter: blur(${Math.round(SIZE * 0.06)}px);
    }
  </style>
</head>
<body>
  <div id="gradient-container">
    <canvas id="canvas"></canvas>
  </div>
  <script>
    const colors = ${colorArray};
    const seed = ${seed};
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');
    const size = ${SIZE > 500 ? Math.round(SIZE * 1.5) : SIZE * 3}; // Higher res for better blur
    canvas.width = size;
    canvas.height = size;

    // Seeded random for reproducible results
    function seededRandom(s) {
      return function() {
        let t = s += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      };
    }

    const random = seededRandom(seed * 12345);

    // Create mesh gradient effect using overlapping radial gradients
    function createMeshGradient() {
      // Fill with the first color as base
      ctx.fillStyle = colors[0];
      ctx.fillRect(0, 0, size, size);

      // Create 8-12 color spots for more organic look
      const numSpots = 8 + Math.floor(random() * 5);
      const spots = [];

      for (let i = 0; i < numSpots; i++) {
        // Distribute spots across the canvas with some clustering
        const angle = random() * Math.PI * 2;
        const distance = random() * size * 0.4;
        const centerX = size / 2 + Math.cos(angle) * distance;
        const centerY = size / 2 + Math.sin(angle) * distance;

        spots.push({
          x: centerX + (random() - 0.5) * size * 0.3,
          y: centerY + (random() - 0.5) * size * 0.3,
          radius: size * (0.3 + random() * 0.4), // 30-70% of canvas
          color: colors[i % colors.length],
        });
      }

      // Sort by radius (draw larger spots first)
      spots.sort((a, b) => b.radius - a.radius);

      // Draw each spot with radial gradient
      for (const spot of spots) {
        const gradient = ctx.createRadialGradient(
          spot.x, spot.y, 0,
          spot.x, spot.y, spot.radius
        );

        // Higher opacity for more vivid colors
        gradient.addColorStop(0, spot.color + 'FF');     // 100% opacity at center
        gradient.addColorStop(0.3, spot.color + 'DD');   // 87% opacity
        gradient.addColorStop(0.6, spot.color + '88');   // 53% opacity
        gradient.addColorStop(1, spot.color + '00');     // Transparent at edge

        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
      }

      // Add a subtle highlight spot
      const highlightX = size * 0.3 + random() * size * 0.2;
      const highlightY = size * 0.3 + random() * size * 0.2;
      const highlightGradient = ctx.createRadialGradient(
        highlightX, highlightY, 0,
        highlightX, highlightY, size * 0.3
      );
      highlightGradient.addColorStop(0, 'rgba(255,255,255,0.15)');
      highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = highlightGradient;
      ctx.fillRect(0, 0, size, size);
    }

    createMeshGradient();
  </script>
</body>
</html>
`;
}

// Run the generator
generateGradients().catch(console.error);
