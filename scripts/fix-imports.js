/**
 * 批量修复所有App的页面import路径
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

// 获取所有app-*目录
const appDirs = fs.readdirSync(rootDir)
  .filter(dir => dir.startsWith('app-') && dir !== 'app-template')
  .sort();

console.log('开始修复 ' + appDirs.length + ' 个App的import路径...\n');

// 修复HomeScreen.tsx的import路径
const homeScreenFix = `import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useDatabase } from '../shared/database';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';
import { StockAnalysis } from '../types';

type Props = {
  navigation: any;
};

export default function HomeScreen({ navigation }: Props) {
  const { db } = useDatabase();
  const [stocks, setStocks] = useState<StockAnalysis[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockAnalysis[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'NEUTRAL'>('all');

  useEffect(() => {
    loadStocks();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [stocks, search, filter]);

  const loadStocks = async () => {
    if (!db) return;
    const allStocks = await db.getAllAsync<{code: string; name: string}>('SELECT * FROM stocks');
    const analyses: StockAnalysis[] = [];
    
    for (const stock of allStocks) {
      const kline = await db.getAllAsync<any>(
        'SELECT * FROM kline_daily WHERE code = ? ORDER BY date DESC LIMIT 100',
        [stock.code]
      );
      const result = STRATEGY_CONFIG.execute(kline);
      analyses.push({
        code: stock.code,
        name: stock.name,
        signal: result.signal,
        score: result.score,
        details: result.details,
        klineData: kline,
      });
    }
    
    setStocks(analyses);
  };

  const applyFilter = () => {
    let result = stocks;
    if (search) {
      result = result.filter(s => 
        s.code.includes(search) || s.name.includes(search)
      );
    }
    if (filter !== 'all') {
      result = result.filter(s => s.signal === filter);
    }
    setFilteredStocks(result);
  };

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return COLORS.up;
      case 'SELL': return COLORS.down;
      default: return COLORS.neutral;
    }
  };

  const renderItem = ({ item }: { item: StockAnalysis }) => (
    <TouchableOpacity 
      style={styles.item}
      onPress={() => navigation.navigate('Detail', { stock: item })}
    >
      <View style={styles.itemLeft}>
        <Text style={styles.code}>{item.code}</Text>
        <Text style={styles.name}>{item.name}</Text>
      </View>
      <View style={styles.itemRight}>
        <View style={[styles.signalBadge, { backgroundColor: getSignalColor(item.signal) }]}>
          <Text style={styles.signalText}>{item.signal}</Text>
        </View>
        <Text style={[styles.score, { color: getSignalColor(item.signal) }]}>
          {item.score > 0 ? '+' : ''}{item.score}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const buyCount = stocks.filter(s => s.signal === 'BUY').length;
  const sellCount = stocks.filter(s => s.signal === 'SELL').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRATEGY_CONFIG.name}</Text>
      </View>

      <View style={styles.summary}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>买入</Text>
          <Text style={[styles.summaryValue, { color: COLORS.up }]}>{buyCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>卖出</Text>
          <Text style={[styles.summaryValue, { color: COLORS.down }]}>{sellCount}</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>总数</Text>
          <Text style={styles.summaryValue}>{stocks.length}</Text>
        </View>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="搜索股票代码/名称..."
        placeholderTextColor={COLORS.textSecondary}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {(['all', 'BUY', 'SELL', 'NEUTRAL'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? '全部' : f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredStocks}
        renderItem={renderItem}
        keyExtractor={item => item.code}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    margin: SPACING.sm,
    borderRadius: 8,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  searchInput: {
    margin: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.card,
    borderRadius: 8,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  filterBtn: {
    flex: 1,
    padding: SPACING.xs,
    marginHorizontal: 2,
    backgroundColor: COLORS.card,
    borderRadius: 4,
    alignItems: 'center',
  },
  filterBtnActive: {
    backgroundColor: COLORS.accent,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  filterTextActive: {
    color: COLORS.text,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  item: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  itemLeft: {
    flex: 1,
  },
  code: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  name: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  itemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: SPACING.sm,
  },
  signalText: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 40,
    textAlign: 'right',
  },
});`;

// 修复DetailScreen.tsx的import路径
const detailScreenFix = `import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { KlineChart } from '../shared/components';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';

type Props = {
  route: any;
};

export default function DetailScreen({ route }: Props) {
  const { stock } = route.params;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.code}>{stock.code}</Text>
        <Text style={styles.name}>{stock.name}</Text>
      </View>

      <View style={styles.signalCard}>
        <View style={[styles.signalBadge, { backgroundColor: STRATEGY_CONFIG.color }]}>
          <Text style={styles.signalText}>{stock.signal}</Text>
        </View>
        <Text style={[styles.score, { color: stock.signal === 'BUY' ? COLORS.up : stock.signal === 'SELL' ? COLORS.down : COLORS.neutral }]}>
          {stock.score > 0 ? '+' : ''}{stock.score}
        </Text>
      </View>

      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>K线图</Text>
        <KlineChart data={stock.klineData} height={200} />
      </View>

      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>策略详情</Text>
        <Text style={styles.detailText}>{stock.details}</Text>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>策略信息</Text>
        <Text style={styles.infoText}>策略ID: {STRATEGY_CONFIG.id}</Text>
        <Text style={styles.infoText}>策略名称: {STRATEGY_CONFIG.name}</Text>
        <Text style={styles.infoText}>{STRATEGY_CONFIG.description}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  name: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  signalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signalText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  chartCard: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  detailsCard: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  detailText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  infoCard: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
});`;

let successCount = 0;
let failCount = 0;

for (const dir of appDirs) {
  const appDir = path.join(rootDir, dir);
  
  try {
    // 修复HomeScreen.tsx
    const homeScreenPath = path.join(appDir, 'src', 'screens', 'HomeScreen.tsx');
    if (fs.existsSync(homeScreenPath)) {
      fs.writeFileSync(homeScreenPath, homeScreenFix);
    }
    
    // 修复DetailScreen.tsx
    const detailScreenPath = path.join(appDir, 'src', 'screens', 'DetailScreen.tsx');
    if (fs.existsSync(detailScreenPath)) {
      fs.writeFileSync(detailScreenPath, detailScreenFix);
    }
    
    // 修复tsconfig.json
    const tsconfigPath = path.join(appDir, 'tsconfig.json');
    const tsconfig = {
      extends: "expo/tsconfig.base",
      compilerOptions: {
        strict: true,
        types: ["node"],
        paths: {
          "@/*": ["./src/*"]
        }
      },
      include: ["./**/*.ts", "./**/*.tsx"]
    };
    fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));
    
    // 修复package.json（添加@types/node）
    const packageJsonPath = path.join(appDir, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      if (!packageJson.devDependencies) {
        packageJson.devDependencies = {};
      }
      packageJson.devDependencies['@types/node'] = '^20.0.0';
      fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
    
    console.log('✅ ' + dir);
    successCount++;
  } catch (error) {
    console.log('❌ ' + dir + ': ' + error.message);
    failCount++;
  }
}

console.log('\n修复完成: ' + successCount + ' 成功, ' + failCount + ' 失败');
