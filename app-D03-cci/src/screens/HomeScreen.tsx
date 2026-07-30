import React, { useState, useEffect } from 'react';
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
});