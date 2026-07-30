/**
 * fix-app-json.js — Fix app.json for all 26 apps
 * Ensures unique slug and android.package
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'F:\\opencode\\Single metric\\kline-strategy-apps';
const dirs = fs.readdirSync(ROOT)
  .filter(d => d.startsWith('app-') && d !== 'app-template')
  .sort();

// Map directory name to slug and package
function dirToSlug(dir) {
  // app-T01-double-ma -> kline-T01
  const match = dir.match(/^app-([A-Z]\d+)/);
  return match ? `kline-${match[1]}` : `kline-${dir}`;
}

function dirToPackage(dir) {
  // app-T01-double-ma -> com.kline.t01
  const match = dir.match(/^app-([A-Z])(\d+)/);
  if (match) return `com.kline.${match[1].toLowerCase()}${match[2]}`;
  return `com.kline.${dir.replace('app-', '').replace(/-/g, '')}`;
}

// T01's app.json as template
const t01Path = path.join(ROOT, 'app-T01-double-ma', 'app.json');
const t01 = JSON.parse(fs.readFileSync(t01Path, 'utf8'));

let fixed = 0;

for (const dir of dirs) {
  const appDir = path.join(ROOT, dir);
  const jsonPath = path.join(appDir, 'app.json');
  const slug = dirToSlug(dir);
  const pkg = dirToPackage(dir);

  // Read existing or create new
  let appJson;
  if (fs.existsSync(jsonPath)) {
    appJson = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } else {
    // Create from T01 template
    appJson = JSON.parse(JSON.stringify(t01));
  }

  // Ensure expo structure exists
  if (!appJson.expo) appJson.expo = {};

  // Set unique fields
  appJson.expo.name = `kline-${dir.replace('app-', '').split('-')[0]}`;
  appJson.expo.slug = slug;
  appJson.expo.version = '1.0.0';
  appJson.expo.orientation = 'portrait';
  appJson.expo.icon = './assets/icon.png';
  appJson.expo.userInterfaceStyle = 'dark';
  appJson.expo.splash = {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#0a0a0f'
  };
  appJson.expo.ios = { supportsTablet: true };
  appJson.expo.android = {
    package: pkg,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0a0a0f'
    }
  };
  appJson.expo.plugins = ['expo-sqlite'];
  appJson.expo.extra = {
    eas: {
      projectId: appJson.expo.extra?.eas?.projectId || ''
    }
  };
  appJson.expo.owner = 'xzming';

  // Write
  fs.writeFileSync(jsonPath, JSON.stringify(appJson, null, 2), 'utf8');
  console.log(`Fixed: ${dir} -> slug=${slug}, pkg=${pkg}`);
  fixed++;
}

console.log(`\nFixed ${fixed} app.json files`);
