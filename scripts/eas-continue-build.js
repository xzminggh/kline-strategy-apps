const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'F:\\opencode\\Single metric\\kline-strategy-apps';
const done = ['app-D01-macd-div','app-D02-rsi-div','app-D03-cci','app-K01-ma-support','app-K02-prev-highlow','app-K03-fibonacci','app-M01-bollinger','app-M02-rsi'];
const apps = fs.readdirSync(BASE)
  .filter(d => d.startsWith('app-') && d !== 'app-template' && !done.includes(d))
  .sort();

console.log(`Continuing: ${apps.length} apps remaining\n`);

for (let i = 0; i < apps.length; i++) {
  const app = apps[i];
  const appDir = path.join(BASE, app);
  console.log(`[${i + 1}/${apps.length}] ${app}`);

  try {
    const env = { ...process.env, EAS_PROJECT_ROOT: appDir, EAS_SKIP_AUTO_FINGERPRINT: '1' };
    const opts = { cwd: appDir, env, encoding: 'utf8', timeout: 120000, stdio: ['pipe', 'pipe', 'pipe'] };

    let init = '';
    try { init = execSync('npx eas init --non-interactive --json --force', opts); }
    catch (e) { init = (e.stdout || '') + (e.stderr || ''); }
    const id = init.match(/"projectId"\s*:\s*"([^"]+)"/);
    if (id) console.log(`  Project: ${id[1]}`);

    const out = execSync('npx eas build --platform android --profile preview --non-interactive --no-wait', opts);
    console.log(`  ✅ submitted\n`);
  } catch (error) {
    const all = (error.stdout || '') + (error.stderr || '');
    if (all.includes('Free plan') || all.includes('has used')) {
      console.log(`  ❌ QUOTA EXCEEDED\n`);
      break;
    }
    console.log(`  ❌ ${(all || error.message).substring(0, 300)}\n`);
  }
}
