const sharp = require('sharp');
const path = require('path');

async function splitAssets() {
  const input = path.join(__dirname, '../public/mc-custom-scene.png');
  const image = sharp(input);

  // Extract Axolotl bubble (x: 90, y: 275, width: 290, height: 290)
  await image
    .clone()
    .extract({ left: 95, top: 280, width: 285, height: 285 })
    .png()
    .toFile(path.join(__dirname, '../public/mc-axolotl-bubble.png'));
  console.log('Saved Axolotl bubble');

  // Also create a version without the axolotl for the main character group
  const { data, info } = await image
    .clone()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;

  for (let y = 260; y < 580; y++) {
    for (let x = 80; x < 390; x++) {
      const idx = (y * width + x) * 4;
      // Clear axolotl bubble from the main group so it can be animated separately
      data[idx + 3] = 0;
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
  .toFile(path.join(__dirname, '../public/mc-hero-group.png'));
  console.log('Saved Hero + Enderman + Wolf group');
}

splitAssets().catch(console.error);
