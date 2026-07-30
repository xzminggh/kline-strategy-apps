const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'icons');
const appsDir = path.join(__dirname, '..');

const mapping = {
  't01-双均线.png': 'app-T01-double-ma',
  't02-MA60.png': 'app-T02-ma60',
  't03-顾比.png': 'app-T03-guppy',
  't04-三线.png': 'app-T04-three-line',
  'm01-BOLL.png': 'app-M01-bollinger',
  'm02-RSI.png': 'app-M02-rsi',
  'm03-三重.png': 'app-M03-triple',
  'm04-缺口.png': 'app-M04-gap',
  'p01-MOM.png': 'app-P01-mom',
  'p02-ROC.png': 'app-P02-roc',
  'p03-倍量.png': 'app-P03-volume',
  'p04-反包.png': 'app-P04-engulfing',
  's01-双底.png': 'app-S01-double-bottom',
  's02-三角.png': 'app-S02-triangle',
  's03-头肩.png': 'app-S03-head-shoulder',
  's04-锤子.png': 'app-S04-hammer',
  'k01-支撑.png': 'app-K01-ma-support',
  'k02-高低.png': 'app-K02-prev-highlow',
  'k03-FIB.png': 'app-K03-fibonacci',
  'v01-收口.png': 'app-V01-boll-squeeze',
  'v02-ATR.png': 'app-V02-atr',
  'q01-地量.png': 'app-Q01-low-volume',
  'q02-天量.png': 'app-Q02-high-volume',
  'd01-MACD.png': 'app-D01-macd-div',
  'd02-RSI背离.png': 'app-D02-rsi-div',
  'd03-CCI.png': 'app-D03-cci',
};

let copied = 0, skipped = 0;
for (const [iconFile, appDir] of Object.entries(mapping)) {
  const src = path.join(iconsDir, iconFile);
  const dest = path.join(appsDir, appDir, 'assets', 'icon.png');
  if (!fs.existsSync(src)) { console.log(`SKIP (no src): ${iconFile}`); skipped++; continue; }
  fs.copyFileSync(src, dest);
  console.log(`OK: ${iconFile} -> ${appDir}/assets/icon.png`);
  copied++;
}
console.log(`\nDone: ${copied} copied, ${skipped} skipped`);
