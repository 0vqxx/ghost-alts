const sharp = require('sharp');
const path = require('path');

async function extractCreeper() {
  const input = path.join(__dirname, '../public/creeper-avatar.png');
  const image = sharp(input);
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  const width = info.width;
  const height = info.height;

  // Connected component flood fill from edges for the dark blue background
  const visited = new Uint8Array(width * height);
  const queue = [];

  // Corner background color is ~ (1, 28, 71)
  function isBackground(r, g, b) {
    // If it's the dark navy background
    // Notice the creeper and its glow have strong cyan (g > 70 or b > 100 with high green)
    if (r <= 25 && g <= 55 && b <= 100) {
      return true;
    }
    return false;
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

  // Alpha fade near edges
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      const p = idx * 4;
      if (visited[idx]) {
        data[p + 3] = 0;
      } else {
        const r = data[p];
        const g = data[p + 1];
        const b = data[p + 2];
        // Smooth transition on the outer glow edge
        if (g < 80 && b < 130) {
          const factor = Math.max(0, (g - 35) / 45);
          data[p + 3] = Math.round(255 * factor);
        }
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
  .toFile(path.join(__dirname, '../public/creeper-transparent.png'));

  console.log('Saved transparent creeper');
}

extractCreeper().catch(console.error);
