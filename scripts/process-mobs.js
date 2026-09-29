const sharp = require('sharp');
const path = require('path');

async function floodFillRemoveBackground(inputPath, outputPath, tolerance = 18) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const visited = new Uint8Array(width * height);
  const queue = [];

  // Seed borders
  function pushBorder(x, y) {
    const idx = y * width + x;
    if (!visited[idx]) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  for (let x = 0; x < width; x++) {
    pushBorder(x, 0);
    pushBorder(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    pushBorder(0, y);
    pushBorder(width - 1, y);
  }

  let head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const cx = curr % width;
    const cy = Math.floor(curr / width);

    // Make this background pixel transparent
    const pixelIdx = curr * 4;
    const r = data[pixelIdx];
    const g = data[pixelIdx + 1];
    const b = data[pixelIdx + 2];
    
    // Check 4 neighbors
    const neighbors = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1]
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          const npIdx = nIdx * 4;
          const nr = data[npIdx];
          const ng = data[npIdx + 1];
          const nb = data[npIdx + 2];
          
          // Background is near black
          const maxBrightness = Math.max(nr, ng, nb);
          if (maxBrightness <= tolerance) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Set alpha for all visited pixels to 0, with a gentle 1-pixel feather
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const pIdx = idx * 4;
      if (visited[idx]) {
        data[pIdx + 3] = 0; // Transparent
      }
    }
  }

  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(outputPath);

  console.log(`Saved flood-filled PNG to ${outputPath}`);
}

async function run() {
  const heroJpg = '/Users/AndresQO/.gemini/antigravity/brain/7a7f6a8e-10e4-40b0-8e83-9bef81f8c718/ghost_pvp_hero_1790636019371.jpg';
  const endermanJpg = '/Users/AndresQO/.gemini/antigravity/brain/7a7f6a8e-10e4-40b0-8e83-9bef81f8c718/mc_enderman_mob_1790636035093.jpg';
  
  const publicDir = path.join(__dirname, '../public');
  
  await floodFillRemoveBackground(heroJpg, path.join(publicDir, 'mc-ghost-hero.png'), 20);
  await floodFillRemoveBackground(endermanJpg, path.join(publicDir, 'mc-enderman.png'), 15);
}

run().catch(console.error);
