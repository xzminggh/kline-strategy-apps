/**
 * 批量测试验证26个策略App
 * 
 * 使用方法: node test-all.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');

// 获取所有app-*目录
const appDirs = fs.readdirSync(rootDir)
  .filter(dir => dir.startsWith('app-'))
  .sort();

console.log(`开始批量测试 ${appDirs.length} 个App...\n`);

let successCount = 0;
let failCount = 0;
const results = [];

for (const dir of appDirs) {
  const appDir = path.join(rootDir, dir);
  const appId = dir.replace('app-', '').split('-')[0];
  
  try {
    // 检查package.json是否存在
    const packageJsonPath = path.join(appDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json不存在');
    }
    
    // 检查src/App.tsx是否存在
    const appTsxPath = path.join(appDir, 'src/App.tsx');
    if (!fs.existsSync(appTsxPath)) {
      throw new Error('src/App.tsx不存在');
    }
    
    // 检查策略配置
    const strategyPath = path.join(appDir, 'src/config/strategy.ts');
    if (!fs.existsSync(strategyPath)) {
      throw new Error('src/config/strategy.ts不存在');
    }
    
    // 检查策略配置内容
    const strategyContent = fs.readFileSync(strategyPath, 'utf8');
    if (!strategyContent.includes(`id: '${appId}'`)) {
      throw new Error('策略ID不匹配');
    }
    
    // 尝试运行TypeScript检查（如果有tsc）
    // 注意：这里只是检查文件结构，实际的tsc需要先npm install
    
    console.log(`✅ ${dir}`);
    results.push({ dir, status: 'PASS' });
    successCount++;
  } catch (error) {
    console.log(`❌ ${dir}: ${error.message}`);
    results.push({ dir, status: 'FAIL', error: error.message });
    failCount++;
  }
}

// 生成测试报告
const report = {
  timestamp: new Date().toISOString(),
  total: appDirs.length,
  success: successCount,
  fail: failCount,
  results,
};

fs.writeFileSync(
  path.join(rootDir, 'test-report.json'),
  JSON.stringify(report, null, 2)
);

console.log(`\n测试完成: ${successCount} 通过, ${failCount} 失败`);
console.log(`报告已保存: test-report.json`);

// 如果有失败，返回非零退出码
if (failCount > 0) {
  process.exit(1);
}
