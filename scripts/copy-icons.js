const fs = require('fs');
const path = require('path');

const baseDir = path.join(__dirname, '..');
const iconsDir = path.join(baseDir, 'icons');

// Map app directories to icon files
const appIconMap = {
  'app-T01-double-ma': 't01-双均线.png',
  'app-T02-ma60': 't02-MA60.png',
  'app-T03-guppy': 't03-顾比.png',
  'app-T04-three-line': 't04-三线.png',
  'app-M01-bollinger': 'm01-BOLL.png',
  'app-M02-rsi': 'm02-RSI.png',
  'app-M03-triple': 'm03-三重.png',
  'app-M04-gap': 'm04-缺口.png',
  'app-P01-mom': 'p01-MOM.png',
  'app-P02-roc': 'p02-ROC.png',
  'app-P03-volume': 'p03-倍量.png',
  'app-P04-engulfing': 'p04-反包.png',
  'app-Q01-low-volume': 'q01-地量.png',
  'app-Q02-high-volume': 'q02-天量.png',
  'app-K01-ma-support': 'k01-支撑.png',
  'app-K02-prev-highlow': 'k02-高低.png',
  'app-K03-fibonacci': 'k03-FIB.png',
  'app-S01-double-bottom': 's01-双底.png',
  'app-S02-triangle': 's02-三角.png',
  'app-S03-head-shoulder': 's03-头肩.png',
  'app-S04-hammer': 's04-锤子.png',
  'app-D01-macd-div': 'd01-MACD.png',
  'app-D02-rsi-div': 'd02-RSI背离.png',
  'app-D03-cci': 'd03-CCI.png',
  'app-V01-boll-squeeze': 'v01-收口.png',
  'app-V02-atr': 'v02-ATR.png',
};

let count = 0;
for (const [appDir, iconFile] of Object.entries(appIconMap)) {
  const src = path.join(iconsDir, iconFile);
  const destDir = path.join(baseDir, appDir, 'assets');
  
  if (!fs.existsSync(src)) {
    console.log(`SKIP (not found): ${iconFile}`);
    continue;
  }
  
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  // Copy as icon.png and adaptive-icon.png
  fs.copyFileSync(src, path.join(destDir, 'icon.png'));
  fs.copyFileSync(src, path.join(destDir, 'adaptive-icon.png'));
  console.log(`OK: ${appDir} ← ${iconFile}`);
  count++;
}

console.log(`\nDone! Updated ${count} apps`);
