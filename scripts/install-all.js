/**
 * 批量安装所有App的依赖
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 先安装shared
console.log('安装 shared 模块依赖...\n');
try {
  execSync('npm install', { 
    cwd: path.join(rootDir, 'shared'),
    stdio: 'inherit' 
  });
  console.log('✅ shared 安装完成\n');
} catch (e) {
  console.log('⚠️ shared 安装失败，继续...\n');
}

// 获取所有app-*目录
const appDirs = fs.readdirSync(rootDir)
  .filter(dir => dir.startsWith('app-') && dir !== 'app-template')
  .sort();

console.log(`开始安装 ${appDirs.length} 个App的依赖...\n`);

let successCount = 0;
let failCount = 0;

for (const dir of appDirs) {
  const appDir = path.join(rootDir, dir);
  console.log(`📦 ${dir}...`);
  
  try {
    execSync('npm install', { 
      cwd: appDir,
      stdio: 'pipe',
      timeout: 120000
    });
    console.log(`✅ ${dir} 安装完成`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${dir} 安装失败: ${error.message.substring(0, 50)}`);
    failCount++;
  }
}

console.log(`\n安装完成: ${successCount} 成功, ${failCount} 失败`);
