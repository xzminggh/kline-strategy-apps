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
      PATH: `F:\\opencode\\Single metric\\kline-strategy-apps\\node_modules\\.bin;${process.env.PATH}`,
    };
    
    // Step 1: eas init (create/link project)
    console.log(`  Creating EAS project...`);
    let initOutput;
    try {
      initOutput = execSync('npx eas init --non-interactive --json', {
        cwd: appDir, env, encoding: 'utf8', timeout: 30000,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } catch (initErr) {
      initOutput = (initErr.stdout || '') + (initErr.stderr || '');
    }
    
    // Extract projectId from init output
    const idMatch = initOutput.match(/"id"\s*:\s*"([^"]+)"/);
    if (idMatch) {
      console.log(`  Project ID: ${idMatch[1]}`);
    }
    
    // Step 2: eas build
    console.log(`  Building...`);
    const buildOutput = execSync(
      'npx eas build --platform android --profile preview --non-interactive',
      { 
        cwd: appDir, 
        env,
        encoding: 'utf8',
        timeout: 600000,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    
    const urlMatch = buildOutput.match(/https:\/\/expo\.dev\/artifacts\/eas\/\S+\.apk/);
    console.log(`  ✅ Uploaded - ${urlMatch ? urlMatch[0] : 'pending'}\n`);
    results.push({ app, status: 'uploaded', url: urlMatch ? urlMatch[0] : 'pending' });
    
  } catch (error) {
    const all = (error.stdout || '') + (error.stderr || '');
    
    if (all.includes('Free plan') || all.includes('has used') || all.includes('quota')) {
      console.log(`  ❌ Free plan quota exceeded\n`);
      results.push({ app, status: 'quota_exceeded' });
      break;
    } else if (all.includes('Uploaded to EAS')) {
      const urlMatch = all.match(/https:\/\/expo\.dev\/artifacts\/eas\/\S+\.apk/);
      console.log(`  ✅ Uploaded - ${urlMatch ? urlMatch[0] : 'pending'}\n`);
      results.push({ app, status: 'uploaded', url: urlMatch ? urlMatch[0] : 'pending' });
    } else {
      const shortErr = (error.stderr || error.stdout || error.message).substring(0, 300);
      console.log(`  ❌ Error: ${shortErr}\n`);
      results.push({ app, status: 'error', error: shortErr });
    }
  }
}

console.log('\n=== Build Summary ===');
results.forEach(r => {
  const icon = r.status === 'uploaded' ? '✅' : '❌';
  console.log(`${icon} ${r.app}: ${r.status}`);
});

const uploaded = results.filter(r => r.status === 'uploaded').length;
const failed = results.filter(r => r.status !== 'uploaded').length;
console.log(`\nUploaded: ${uploaded}, Failed: ${failed}`);
