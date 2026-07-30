/**
 * 批量生成26个策略App（方案B：共享文件直接复制）
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
const sharedDir = path.join(rootDir, 'shared');

// 递归复制目录
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

// package.json模板（无本地依赖）
const packageJsonTemplate = {
  "scripts": {
    "start": "expo start",
    "android": "expo start --android",
    "test": "jest"
  },
  "dependencies": {
    "expo": "~57.0.0",
    "expo-sqlite": "~57.0.1",
    "react": "19.2.3",
    "react-native": "0.86.0",
    "react-native-safe-area-context": "~5.7.0",
    "react-native-screens": "~4.26.0",
    "react-native-svg": "15.15.4",
    "@react-navigation/native": "^6.1.17",
    "@react-navigation/bottom-tabs": "^6.6.0"
  },
  "devDependencies": {
    "@babel/core": "^7.20.0",
    "typescript": "~6.0.3",
    "@types/react": "~19.2.4",
    "jest-expo": "~57.0.0"
  }
};

// tsconfig模板
const tsconfigTemplate = {
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["./**/*.ts", "./**/*.tsx"]
};

console.log('开始批量生成26个策略App（方案B：共享文件直接复制）...\n');

let successCount = 0;
let failCount = 0;

for (const strategy of strategies) {
  try {
    const appDir = path.join(rootDir, strategy.dir);
    
    // 清理并创建目录
    if (fs.existsSync(appDir)) {
      fs.rmSync(appDir, { recursive: true });
    }
    fs.mkdirSync(path.join(appDir, 'src', 'screens'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'src', 'config'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'src', 'types'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'src', 'shared'), { recursive: true });
    fs.mkdirSync(path.join(appDir, 'assets'), { recursive: true });
    
    // 复制共享模块到src/shared/
    copyDirSync(sharedDir, path.join(appDir, 'src', 'shared'));
    
    // 生成package.json（无本地依赖）
    const packageJson = {
      name: `kline-${strategy.id}`,
      version: '1.0.0',
      main: 'index.js',
      ...packageJsonTemplate
    };
    fs.writeFileSync(path.join(appDir, 'package.json'), JSON.stringify(packageJson, null, 2));
    
    // 生成tsconfig.json
    fs.writeFileSync(path.join(appDir, 'tsconfig.json'), JSON.stringify(tsconfigTemplate, null, 2));
    
    // 生成app.json
    const appJson = {
      expo: {
        name: `kline-${strategy.id}`,
        slug: `kline-${strategy.id}`,
        version: '1.0.0',
        orientation: 'portrait',
        icon: './assets/icon.png',
        userInterfaceStyle: 'dark',
        splash: { backgroundColor: '#0a0a0f' },
        ios: { supportsTablet: true },
        android: { adaptiveIcon: { backgroundColor: '#0a0a0f' } },
        plugins: ['expo-sqlite']
      }
    };
    fs.writeFileSync(path.join(appDir, 'app.json'), JSON.stringify(appJson, null, 2));
    
    // 生成index.js
    fs.writeFileSync(path.join(appDir, 'index.js'), 
      "import 'expo-dev-client';\nimport App from './src/App';\n\nexport default App;");
    
    // 复制主题色
    fs.mkdirSync(path.join(appDir, 'src', 'theme'), { recursive: true });
    fs.copyFileSync(
      path.join(sharedDir, 'theme', 'colors.ts'),
      path.join(appDir, 'src', 'theme', 'colors.ts')
    );
    
    // 生成App.tsx
    const appTsx = `import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SQLiteProvider } from './shared/database';
import HomeScreen from './screens/HomeScreen';
import DetailScreen from './screens/DetailScreen';
import SettingsScreen from './screens/SettingsScreen';
import { STRATEGY_CONFIG } from './config/strategy';
import { COLORS } from './theme/colors';

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <SQLiteProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.background,
              borderTopColor: COLORS.border,
            },
            tabBarActiveTintColor: STRATEGY_CONFIG.color,
            tabBarInactiveTintColor: COLORS.textSecondary,
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} options={{ tabBarLabel: '首页' }} />
          <Tab.Screen name="Detail" component={DetailScreen} options={{ tabBarLabel: '详情' }} />
          <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarLabel: '设置' }} />
        </Tab.Navigator>
      </NavigationContainer>
    </SQLiteProvider>
  );
}`;
    fs.writeFileSync(path.join(appDir, 'src', 'App.tsx'), appTsx);
    
    // 生成types/index.ts
    const typesIndex = `export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';

export interface StrategyResult {
  signal: SignalType;
  score: number;
  details: string;
}

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockAnalysis {
  code: string;
  name: string;
  signal: SignalType;
  score: number;
  details: string;
  klineData: KlineData[];
}`;
    fs.writeFileSync(path.join(appDir, 'src', 'types', 'index.ts'), typesIndex);
    
    // 生成策略配置
    const strategyConfig = `import { StrategyResult } from '../types';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: '${strategy.id}',
  name: '${strategy.name}',
  description: '${strategy.name}策略',
  icon: 'trending-up',
  color: '${strategy.color}',
  execute: (klineData) => {
    // TODO: 实现具体策略逻辑
    return { signal: 'NEUTRAL', score: 0, details: '策略待实现' };
  }
};`;
    fs.writeFileSync(path.join(appDir, 'src', 'config', 'strategy.ts'), strategyConfig);
    
    // 复制页面模板
    fs.copyFileSync(
      path.join(rootDir, 'app-template', 'src', 'screens', 'HomeScreen.tsx'),
      path.join(appDir, 'src', 'screens', 'HomeScreen.tsx')
    );
    fs.copyFileSync(
      path.join(rootDir, 'app-template', 'src', 'screens', 'DetailScreen.tsx'),
      path.join(appDir, 'src', 'screens', 'DetailScreen.tsx')
    );
    fs.copyFileSync(
      path.join(rootDir, 'app-template', 'src', 'screens', 'SettingsScreen.tsx'),
      path.join(appDir, 'src', 'screens', 'SettingsScreen.tsx')
    );
    
    console.log('✅ ' + strategy.id + ' - ' + strategy.name + ' → ' + strategy.dir);
    successCount++;
  } catch (error) {
    console.log('❌ ' + strategy.id + ' - ' + strategy.name + ': ' + error.message);
    failCount++;
  }
}

console.log('\n生成完成: ' + successCount + ' 成功, ' + failCount + ' 失败');
