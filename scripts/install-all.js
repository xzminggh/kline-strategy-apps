/**
 * install-all.js — Run npm install in all 25 non-T01 app directories
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = 'F:\\opencode\\Single metric\\kline-strategy-apps';
const apps = fs.readdirSync(ROOT)
  .filter(d => d.startsWith('app-') && d !== 'app-template' && d !== 'app-T01-double-ma')
  .sort();

console.log(`Installing dependencies in ${apps.length} apps...`);

let ok = 0, fail = 0;

for (const app of apps) {
  const appDir = path.join(ROOT, app);
  try {
    console.log(`Installing: ${app}...`);
    execSync('npm install --legacy-peer-deps 2>&1', {
      cwd: appDir,
      timeout: 120000,
      stdio: 'pipe'
    });
    console.log(`  OK: ${app}`);
    ok++;
  } catch (e) {
    console.log(`  FAIL: ${app} - ${(e.message || '').substring(0, 100)}`);
    fail++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`OK: ${ok}`);
console.log(`Fail: ${fail}`);
console.log(`Total: ${apps.length}`);
