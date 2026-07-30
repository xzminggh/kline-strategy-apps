/**
 * 批量安装所有App的依赖（使用--legacy-peer-deps）
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 获取所有app-*目录
const appDirs = fs.readdirSync(rootDir)
  .filter(dir => dir.startsWith('app-') && dir !== 'app-template')
  .sort();

console.log('开始批量安装 ' + appDirs.length + ' 个App的依赖...\n');

let successCount = 0;
let failCount = 0;

for (const dir of appDirs) {
  const appDir = path.join(rootDir, dir);
  console.log('📦 ' + dir + '...');
  
  try {
    execSync('npm install --legacy-peer-deps', { 
      cwd: appDir,
      stdio: 'pipe',
      timeout: 180000
    });
    console.log('✅ ' + dir + ' 安装完成');
    successCount++;
  } catch (error) {
    console.log('❌ ' + dir + ' 安装失败');
    failCount++;
  }
}

console.log('\n安装完成: ' + successCount + ' 成功, ' + failCount + ' 失败');
