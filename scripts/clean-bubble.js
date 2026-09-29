const sharp = require('sharp');
const path = require('path');

async function cleanBubble() {
  const input = path.join(__dirname, '../public/mc-axolotl-bubble.png');
  const image = sharp(input);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const { data } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });

  const cx = width / 2;
  const cy = height / 2;
  const radius = width / 2 - 4;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
      if (dist > radius) {
        data[idx + 3] = 0; // Circular clip outside bubble
        continue;
      }

      // Check if this is the pink axolotl
      // Axolotl pink/magenta body: r is significantly higher than g
      const isAxolotl = (r > 160 && g < 160 && b > 130) || (r > 130 && g < 100 && b > 100) || (r > 110 && g < 80 && b > 80);
      // Axolotl dark eyes
      const isEye = dist < radius * 0.7 && r < 60 && g < 50 && b > 50;

      if (!isAxolotl && !isEye) {
        // This is bubble water / background
        const diffRG = Math.abs(r - g);
        const diffRB = Math.abs(r - b);
        const diffGB = Math.abs(g - b);
        const isNeutralChecker = diffRG <= 8 && diffRB <= 8 && diffGB <= 8 && r >= 180;

        if (isNeutralChecker) {
          // Replace checkerboard with translucent magic water tint
          data[idx] = 120;     // R
          data[idx + 1] = 200; // G
          data[idx + 2] = 255; // B
          data[idx + 3] = 45;  // Soft translucent alpha
        } else if (b > r + 20 && b > g) {
          // Keep water highlights and reflection bubbles
          data[idx + 3] = Math.min(220, a);
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
  .toFile(path.join(__dirname, '../public/mc-axolotl-clean.png'));

  console.log('Saved clean axolotl bubble');
}

cleanBubble().catch(console.error);
