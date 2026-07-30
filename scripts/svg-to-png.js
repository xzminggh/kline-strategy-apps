const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');

async function convertAll() {
  const svgFiles = fs.readdirSync(iconsDir).filter(f => f.endsWith('.svg'));
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(iconsDir, svgFile);
    const pngFile = svgFile.replace('.svg', '.png');
    const pngPath = path.join(iconsDir, pngFile);
    
    try {
      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer)
        .resize(1024, 1024)
        .png()
        .toFile(pngPath);
      console.log(`OK: ${pngFile}`);
    } catch (err) {
      console.log(`FAIL: ${svgFile} - ${err.message}`);
    }
  }
}

convertAll().then(() => console.log('\nDone!'));
