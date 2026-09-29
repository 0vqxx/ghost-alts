const sharp = require('sharp');
const path = require('path');

async function cleanCheckerboard(inputPath, outputPath) {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  const { data } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];

      const diffRG = Math.abs(r - g);
      const diffRB = Math.abs(r - b);
      const diffGB = Math.abs(g - b);
      const isNeutral = diffRG <= 7 && diffRB <= 7 && diffGB <= 7;

      // Pure white square
      const isWhiteSquare = r >= 235 && g >= 235 && b >= 235;
      // Gray square
      const isGraySquare = r >= 190 && r <= 234 && g >= 190 && g <= 234 && b >= 190 && b <= 234;

      // Bottom shadow check (neutral gray below y = 740)
      const isShadowNeutral = y > 720 && isNeutral && (r > 90 || isGraySquare || isWhiteSquare);

      // Enclosed checkerboard inside the bubble or between characters
      if (isNeutral && (isWhiteSquare || isGraySquare)) {
        data[idx + 3] = 0;
      } else if (isShadowNeutral && !isCharacterPixel(x, y, r, g, b)) {
        // Soften or remove floor shadow checkerboard
        if (r > 130) {
          data[idx + 3] = 0;
        } else {
          // Dim shadow for smooth blending
          data[idx + 3] = Math.round((130 - r) * 1.5);
        }
      }
    }
  }

  function isCharacterPixel(x, y, r, g, b) {
    // Enderman legs (black, x: 700..760, y: 550..770)
    if (x >= 690 && x <= 760 && y >= 550 && y <= 770 && Math.max(r, g, b) < 60) {
      return true;
    }
    // Wolf paws (x: 130..300, y: 720..850)
    if (x >= 130 && x <= 300 && y >= 720 && y <= 850 && (b > r + 8 || Math.max(r, g, b) < 50)) {
      return true;
    }
    // Mage robes / boots (x: 350..680, y: 650..850)
    if (x >= 350 && x <= 680 && y >= 650 && y <= 850 && (Math.max(r, g, b) < 80 || r > g + 15 || b > g + 15)) {
      return true;
    }
    return false;
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

  console.log(`Saved pristine transparent scene to ${outputPath}`);
}

const input = '/Users/AndresQO/.gemini/antigravity/brain/7a7f6a8e-10e4-40b0-8e83-9bef81f8c718/mc_custom_hero_1790635838377.jpg';
const output = path.join(__dirname, '../public/mc-custom-scene.png');
cleanCheckerboard(input, output).catch(console.error);
