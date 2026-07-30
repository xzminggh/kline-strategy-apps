/**
 * sync-infra.js — Sync T01's infrastructure to all 25 other apps
 * Preserves each app's existing strategy.ts
 * Safe: never modifies T01
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'F:\\opencode\\Single metric\\kline-strategy-apps';
const T01 = path.join(ROOT, 'app-T01-double-ma');

// Get all app dirs except T01 and template
const apps = fs.readdirSync(ROOT)
  .filter(d => d.startsWith('app-') && d !== 'app-template' && d !== 'app-T01-double-ma')
  .sort();

console.log(`Found ${apps.length} apps to sync (excluding T01 and template)`);

// Recursively copy directory
function copyDirSync(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Recursively remove directory contents
function clearDirSync(dir) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      fs.rmSync(fullPath, { recursive: true, force: true });
    } else {
      fs.unlinkSync(fullPath);
    }
  }
}

let successCount = 0;
let failCount = 0;

for (const app of apps) {
  const appDir = path.join(ROOT, app);
  console.log(`\n--- Syncing: ${app} ---`);

  try {
    // 1. Backup existing strategy.ts
    const strategyPath = path.join(appDir, 'src', 'config', 'strategy.ts');
    let strategyBackup = null;
    if (fs.existsSync(strategyPath)) {
      strategyBackup = fs.readFileSync(strategyPath, 'utf8');
      console.log('  Backed up existing strategy.ts');
    }

    // 2. Ensure src/ directory structure
    const dirsToCreate = [
      'src/shared/indicators',
      'src/shared/services',
      'src/shared/database',
      'src/shared/components',
      'src/shared/theme',
      'src/screens',
      'src/types',
      'src/theme',
      'src/config'
    ];
    for (const d of dirsToCreate) {
      const fullPath = path.join(appDir, d);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    }

    // 3. Clear old shared/ contents
    const destShared = path.join(appDir, 'src', 'shared');
    clearDirSync(destShared);

    // 4. Copy T01's shared/ to app's src/shared/
    const t01Shared = path.join(T01, 'src', 'shared');
    copyDirSync(t01Shared, destShared);
    console.log('  Copied shared/ (indicators, services, database, components, theme)');

    // 5. Copy screens/
    const destScreens = path.join(appDir, 'src', 'screens');
    clearDirSync(destScreens);
    copyDirSync(path.join(T01, 'src', 'screens'), destScreens);
    console.log('  Copied screens/');

    // 6. Copy types/
    const destTypes = path.join(appDir, 'src', 'types');
    clearDirSync(destTypes);
    copyDirSync(path.join(T01, 'src', 'types'), destTypes);
    console.log('  Copied types/');

    // 7. Copy theme/ (src/theme/colors.ts)
    const destTheme = path.join(appDir, 'src', 'theme');
    clearDirSync(destTheme);
    copyDirSync(path.join(T01, 'src', 'theme'), destTheme);
    console.log('  Copied theme/');

    // 8. Copy App.tsx
    fs.copyFileSync(path.join(T01, 'src', 'App.tsx'), path.join(appDir, 'src', 'App.tsx'));
    console.log('  Copied App.tsx');

    // 9. Copy root config files
    const rootFiles = ['package.json', 'tsconfig.json', 'index.js', '.easignore'];
    for (const f of rootFiles) {
      const srcFile = path.join(T01, f);
      const destFile = path.join(appDir, f);
      if (fs.existsSync(srcFile)) {
        fs.copyFileSync(srcFile, destFile);
      }
    }
    console.log('  Copied root config files');

    // 10. Restore strategy.ts
    if (strategyBackup) {
      const configDir = path.join(appDir, 'src', 'config');
      if (!fs.existsSync(configDir)) {
        fs.mkdirSync(configDir, { recursive: true });
      }
      fs.writeFileSync(strategyPath, strategyBackup, 'utf8');
      console.log('  Restored strategy.ts');
    }

    successCount++;
    console.log(`  OK: ${app}`);

  } catch (err) {
    failCount++;
    console.log(`  FAIL: ${app} - ${err.message}`);
  }
}

console.log(`\n=== Summary ===`);
console.log(`Synced: ${successCount}`);
console.log(`Failed: ${failCount}`);
console.log(`Total: ${apps.length}`);
