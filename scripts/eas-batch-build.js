const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE = 'F:\\opencode\\Single metric\\kline-strategy-apps';
const apps = fs.readdirSync(BASE)
  .filter(d => d.startsWith('app-') && d !== 'app-template' && fs.statSync(path.join(BASE, d)).isDirectory())
  .sort();

console.log(`Found ${apps.length} apps to build\n`);
const results = [];

for (let i = 0; i < apps.length; i++) {
  const app = apps[i];
  const appDir = path.join(BASE, app);
  console.log(`[${i + 1}/${apps.length}] ${app}`);

  try {
    const env = {
      ...process.env,
      EAS_PROJECT_ROOT: appDir,
      EAS_SKIP_AUTO_FINGERPRINT: '1',
    };
    const execOpts = { cwd: appDir, env, encoding: 'utf8', timeout: 600000, stdio: ['pipe', 'pipe', 'pipe'] };

    // Step 1: eas init
    let initOutput = '';
    try {
      initOutput = execSync('npx eas init --non-interactive --json --force', execOpts);
    } catch (e) {
      initOutput = (e.stdout || '') + (e.stderr || '');
    }
    const idMatch = initOutput.match(/"projectId"\s*:\s*"([^"]+)"/);
    if (idMatch) console.log(`  Project: ${idMatch[1]}`);

    // Step 2: eas build (don't wait for completion)
    const buildOutput = execSync('npx eas build --platform android --profile preview --non-interactive --no-wait', execOpts);
    const urlMatch = buildOutput.match(/https:\/\/expo\.dev\/builds\/\S+/);
    const buildId = urlMatch ? urlMatch[0] : 'submitted';
    console.log(`  ✅ ${buildId}\n`);
    results.push({ app, status: 'submitted', url: buildId });

  } catch (error) {
    const all = (error.stdout || '') + (error.stderr || '');
    if (all.includes('Free plan') || all.includes('has used') || all.includes('quota')) {
      console.log(`  ❌ Free plan quota exceeded\n`);
      results.push({ app, status: 'quota_exceeded' });
      break;
    } else if (all.includes('Uploaded to EAS') || all.includes('Build submitted')) {
      const urlMatch = all.match(/https:\/\/expo\.dev\/builds\/\S+/);
      console.log(`  ✅ ${urlMatch ? urlMatch[0] : 'submitted'}\n`);
      results.push({ app, status: 'submitted', url: urlMatch ? urlMatch[0] : 'pending' });
    } else {
      const shortErr = (all || error.message).substring(0, 500);
      console.log(`  ❌ ${shortErr}\n`);
      results.push({ app, status: 'error', error: shortErr });
    }
  }
}

console.log('\n=== Summary ===');
results.forEach(r => console.log(`${r.status === 'uploaded' ? '✅' : '❌'} ${r.app}: ${r.status}`));
console.log(`\nSubmitted: ${results.filter(r => r.status === 'submitted').length}/${results.length}`);
