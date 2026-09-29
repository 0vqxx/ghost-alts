const sharp = require('sharp');
const path = require('path');

async function processHeroCreeper() {
  const input = path.join(__dirname, '../public/creeper-avatar.png');
  const image = sharp(input);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // Connected flood-fill from edges to guarantee outer background is transparent
  const visited = new Uint8Array(width * height);
  const queue = [];

  function isBackground(r, g, b) {
    // Background is dark navy: r < 30, g < 60, b < 110
    // The creeper and its glow have strong cyan / light (g > 65 or b > 115 with green)
    return r <= 32 && g <= 62 && b <= 112;
  }

  function pushBorder(x, y) {
    const idx = y * width + x;
    const p = idx * 4;
    if (!visited[idx] && isBackground(data[p], data[p + 1], data[p + 2])) {
      visited[idx] = 1;
      queue.push(idx);
    }
  }

  for (let x = 0; x < width; x++) {
    pushBorder(x, 0);
    // Don't push bottom center where neck touches bottom
    if (x < 150 || x > 490) pushBorder(x, height - 1);
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
          const np = nIdx * 4;
          if (isBackground(data[np], data[np + 1], data[np + 2])) {
            visited[nIdx] = 1;
            queue.push(nIdx);
          }
        }
      }
    }
  }

  // Apply alpha mask and soft bottom fade
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const p = idx * 4;
      
      if (visited[idx]) {
        data[p + 3] = 0; // Pure transparent background
      } else {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];

        // Smooth outer glow fade
        if (g < 90 && b < 140) {
          const factor = Math.max(0, (g - 30) / 60);
          data[p + 3] = Math.round(255 * factor);
        }

        // Smooth fade on the bottom neck cut-off (y from 540 to 640)
        if (y > 530) {
          const bottomFade = Math.max(0, (height - y) / (height - 530));
          // Apply cubic easing for ultra-smooth fade
          const eased = bottomFade * bottomFade;
          data[p + 3] = Math.round(data[p + 3] * eased);
        }
      }
    }
  }

  // Crop tightly with 10px margin
  const output = path.join(__dirname, '../public/ghost-creeper-hero.png');
  await sharp(data, {
    raw: {
      width,
      height,
      channels: 4
    }
  })
  .png()
  .toFile(output);

  console.log('Saved ghost-creeper-hero.png successfully');
}

processHeroCreeper().catch(console.error);
