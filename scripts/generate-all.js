/**
 * 批量生成26个策略App的脚本
 * 
 * 使用方法: node generate-all.js
 */

const fs = require('fs');
const path = require('path');

// 26个策略配置
const strategies = [
  { id: 'T01', name: '双均线金叉/死叉', dir: 'app-T01-double-ma', color: '#3b82f6' },
  { id: 'T02', name: '60日均线多空分界', dir: 'app-T02-ma60', color: '#10b981' },
  { id: 'T03', name: '顾比均线组穿越', dir: 'app-T03-guppy', color: '#8b5cf6' },
  { id: 'T04', name: '三线反向反转', dir: 'app-T04-three-line', color: '#f59e0b' },
  { id: 'M01', name: '布林带触轨反弹', dir: 'app-M01-bollinger', color: '#ef4444' },
  { id: 'M02', name: 'RSI超买超卖', dir: 'app-M02-rsi', color: '#ec4899' },
  { id: 'M03', name: '三重过滤', dir: 'app-M03-triple', color: '#06b6d4' },
  { id: 'M04', name: '缺口回补', dir: 'app-M04-gap', color: '#84cc16' },
  { id: 'P01', name: 'MOM动量穿零轴', dir: 'app-P01-mom', color: '#f97316' },
  { id: 'P02', name: 'ROC+放量确认', dir: 'app-P02-roc', color: '#14b8a6' },
  { id: 'P03', name: '倍量突破前高/前低', dir: 'app-P03-volume', color: '#a855f7' },
  { id: 'P04', name: '大阴线/大阳线反包', dir: 'app-P04-engulfing', color: '#64748b' },
  { id: 'S01', name: '双底/双顶颈线突破', dir: 'app-S01-double-bottom', color: '#0ea5e9' },
  { id: 'S02', name: '三角形整理末端突破', dir: 'app-S02-triangle', color: '#22c55e' },
  { id: 'S03', name: '头肩底/顶颈线突破', dir: 'app-S03-head-shoulder', color: '#eab308' },
  { id: 'S04', name: '锤子线/流星线确认', dir: 'app-S04-hammer', color: '#dc2626' },
  { id: 'K01', name: '均线支撑/压力回踩', dir: 'app-K01-ma-support', color: '#7c3aed' },
  { id: 'K02', name: '前高变支撑/前低变阻力', dir: 'app-K02-prev-highlow', color: '#0891b2' },
  { id: 'K03', name: '斐波那契回撤共振', dir: 'app-K03-fibonacci', color: '#059669' },
  { id: 'V01', name: '布林带收口突破', dir: 'app-V01-boll-squeeze', color: '#d946ef' },
  { id: 'V02', name: 'ATR窄幅后方向选择', dir: 'app-V02-atr', color: '#f43f5e' },
  { id: 'Q01', name: '地量见底', dir: 'app-Q01-low-volume', color: '#2563eb' },
  { id: 'Q02', name: '天量逃顶', dir: 'app-Q02-high-volume', color: '#dc2626' },
  { id: 'D01', name: 'MACD底/顶背离', dir: 'app-D01-macd-div', color: '#7c3aed' },
  { id: 'D02', name: 'RSI隐性背离', dir: 'app-D02-rsi-div', color: '#2563eb' },
  { id: 'D03', name: 'CCI极端拐点', dir: 'app-D03-cci', color: '#ea580c' },
];

const rootDir = path.resolve(__dirname, '..');
const templateDir = path.join(rootDir, 'app-template');

// 读取模板文件
const templateFiles = {
  'app.json': fs.readFileSync(path.join(templateDir, 'app.json'), 'utf8'),
  'package.json': fs.readFileSync(path.join(templateDir, 'package.json'), 'utf8'),
  'tsconfig.json': fs.readFileSync(path.join(templateDir, 'tsconfig.json'), 'utf8'),
  'index.js': fs.readFileSync(path.join(templateDir, 'index.js'), 'utf8'),
  'src/App.tsx': fs.readFileSync(path.join(templateDir, 'src/App.tsx'), 'utf8'),
  'src/screens/HomeScreen.tsx': fs.readFileSync(path.join(templateDir, 'src/screens/HomeScreen.tsx'), 'utf8'),
  'src/screens/DetailScreen.tsx': fs.readFileSync(path.join(templateDir, 'src/screens/DetailScreen.tsx'), 'utf8'),
  'src/screens/SettingsScreen.tsx': fs.readFileSync(path.join(templateDir, 'src/screens/SettingsScreen.tsx'), 'utf8'),
  'src/config/strategy.ts': fs.readFileSync(path.join(templateDir, 'src/config/strategy.ts'), 'utf8'),
  'src/types/index.ts': fs.readFileSync(path.join(templateDir, 'src/types/index.ts'), 'utf8'),
};

// 策略特定的执行函数映射
const strategyImplementations = {
  'T01': `return executeDoubleMA(klineData);`,
  'T02': `return executeMa60Cross(klineData);`,
  'T03': `return executeGuppyCross(klineData);`,
  'T04': `return executeThreeLineReversal(klineData);`,
  'M01': `return executeBollingerBounce(klineData);`,
  'M02': `return executeRsiOverboughtOversold(klineData);`,
  'M03': `return executeTripleFilter(klineData);`,
  'M04': `return executeGapFill(klineData);`,
  'P01': `return executeMomCrossZero(klineData);`,
  'P02': `return executeRocVolumeConfirm(klineData);`,
  'P03': `return executeVolumeBreakout(klineData);`,
  'P04': `return executeEngulfingPattern(klineData);`,
  'S01': `return executeDoubleBottomTop(klineData);`,
  'S02': `return executeTriangleBreakout(klineData);`,
  'S03': `return executeHeadShoulder(klineData);`,
  'S04': `return executeHammerShootingStar(klineData);`,
  'K01': `return executeMaSupportResistance(klineData);`,
  'K02': `return executePreviousHighLow(klineData);`,
  'K03': `return executeFibonacciRetracement(klineData);`,
  'V01': `return executeBollingerSqueeze(klineData);`,
  'V02': `return executeAtrBreakout(klineData);`,
  'Q01': `return executeLowVolumeBottom(klineData);`,
  'Q02': `return executeHighVolumeTop(klineData);`,
  'D01': `return executeMacdDivergence(klineData);`,
  'D02': `return executeRsiDivergence(klineData);`,
  'D03': `return executeCciExtreme(klineData);`,
};

console.log('开始批量生成26个策略App...\n');

let successCount = 0;
let failCount = 0;

for (const strategy of strategies) {
  try {
    const appDir = path.join(rootDir, strategy.dir);
    
    // 创建目录
    fs.mkdirSync(path.join(appDir, 'src/screens'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'src/config'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'src/types'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'assets'), { recursive: true });
    
    // 生成app.json
    const appJson = templateFiles['app.json']
      .replace('kline-T01', `kline-${strategy.id}`)
      .replace('"slug": "kline-T01"', `"slug": "kline-${strategy.id}"`);
    fs.writeFileSync(path.join(appDir, 'app.json'), appJson);
    
    // 生成package.json
    const packageJson = templateFiles['package.json']
      .replace('"name": "kline-T01"', `"name": "kline-${strategy.id}"`);
    fs.writeFileSync(path.join(appDir, 'package.json'), packageJson);
    
    // 复制tsconfig.json
    fs.writeFileSync(path.join(appDir, 'tsconfig.json'), templateFiles['tsconfig.json']);
    
    // 复制index.js
    fs.writeFileSync(path.join(appDir, 'index.js'), templateFiles['index.js']);
    
    // 生成src/App.tsx
    const appTsx = templateFiles['src/App.tsx']
      .replace("name: 'Home'", `name: 'Home'`)
      .replace("component: HomeScreen", `component: HomeScreen`);
    fs.writeFileSync(path.join(appDir, 'src/App.tsx'), appTsx);
    
    // 复制页面文件
    fs.writeFileSync(path.join(appDir, 'src/screens/HomeScreen.tsx'), templateFiles['src/screens/HomeScreen.tsx']);
    fs.writeFileSync(path.join(appDir, 'src/screens/DetailScreen.tsx'), templateFiles['src/screens/DetailScreen.tsx']);
    fs.writeFileSync(path.join(appDir, 'src/screens/SettingsScreen.tsx'), templateFiles['src/screens/SettingsScreen.tsx']);
    
    // 复制types
    fs.writeFileSync(path.join(appDir, 'src/types/index.ts'), templateFiles['src/types/index.ts']);
    
    // 生成策略配置文件
    const strategyConfig = templateFiles['src/config/strategy.ts']
      .replace("id: 'T01'", `id: '${strategy.id}'`)
      .replace("name: '双均线金叉/死叉'", `name: '${strategy.name}'`)
      .replace("color: '#3b82f6'", `color: '${strategy.color}'`)
      .replace(
        "return { signal: 'NEUTRAL', score: 0, details: '策略未配置' };",
        strategyImplementations[strategy.id]
      );
    fs.writeFileSync(path.join(appDir, 'src/config/strategy.ts'), strategyConfig);
    
    console.log(`✅ ${strategy.id} - ${strategy.name} → ${strategy.dir}`);
    successCount++;
  } catch (error) {
    console.log(`❌ ${strategy.id} - ${strategy.name}: ${error.message}`);
    failCount++;
  }
}

console.log(`\n生成完成: ${successCount} 成功, ${failCount} 失败`);
