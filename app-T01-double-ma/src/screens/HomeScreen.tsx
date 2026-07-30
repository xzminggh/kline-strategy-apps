import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useDatabase } from '../shared/database';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';
import { StockAnalysis } from '../types';
import * as DocumentPicker from 'expo-document-picker';
import SyncPanel from '../shared/components/SyncPanel';

export default function HomeScreen({ navigation }: { navigation: any }) {
  const { db, isConnected, importDatabase, getStockCount, getKlineCount, getStocks, getKlineByCode } = useDatabase();
  const [stocks, setStocks] = useState<StockAnalysis[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockAnalysis[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'BUY' | 'SELL' | 'NEUTRAL'>('all');
  const [stockCount, setStockCount] = useState(0);
  const [klineCount, setKlineCount] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, stage: '' });
  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [loadProgress, setLoadProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (isConnected) {
      loadDatabaseInfo();
      loadStocks();
    }
  }, [isConnected]);

  useEffect(() => {
    applyFilter();
  }, [stocks, search, filter]);

  const loadDatabaseInfo = async () => {
    try {
      const [sc, kc] = await Promise.all([getStockCount(), getKlineCount()]);
      setStockCount(sc);
      setKlineCount(kc);
    } catch (error) {
      console.error('Failed to load database info:', error);
    }
  };

  const loadStocks = async (expectedCount?: number) => {
    setIsLoadingStocks(true);
    setLoadProgress({ current: 0, total: expectedCount || 0 });
    try {
      const allStocks = await getStocks();
      if (!allStocks || allStocks.length === 0) {
        setStocks([]);
        setLoadProgress({ current: 0, total: 0 });
        return;
      }

      // 如果没有预设数量，使用实际数量
      const total = expectedCount || allStocks.length;
      setLoadProgress({ current: 0, total });

      const analyses: StockAnalysis[] = [];
      
      for (let i = 0; i < allStocks.length; i++) {
        const stock = allStocks[i];
        const kline = await getKlineByCode(stock.code);
        const result = STRATEGY_CONFIG.execute(kline || []);
        analyses.push({
          code: stock.code,
          name: stock.name,
          signal: result.signal,
          score: result.score,
          details: result.details,
          klineData: (kline || []) as any[],
        });
        // 更新进度
        setLoadProgress({ current: i + 1, total });
      }
      
      setStocks(analyses);
    } catch (error) {
      console.error('Failed to load stocks:', error);
      setStocks([]);
    } finally {
      setIsLoadingStocks(false);
      setLoadProgress({ current: 0, total: 0 });
    }
  };

  const handleImportDatabase = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: false,
      });
      if (result.canceled) return;
      if (result.assets && result.assets[0]) {
        const fileUri = result.assets[0].uri;
        const fileName = result.assets[0].name || '未知文件';

        Alert.alert(
          '确认导入数据',
          `即将导入文件：${fileName}\n\n导入后将自动备份当前数据库，原数据不会丢失。\n\n是否继续？`,
          [
            { text: '取消', style: 'cancel' },
            {
              text: '确认导入',
              style: 'destructive',
              onPress: async () => {
                setIsImporting(true);
                setImportProgress({ current: 0, total: 10, stage: '准备导入...' });
                try {
                  const importResult = await importDatabase(fileUri, (stage, current, total) => {
                    setImportProgress({ current, total, stage });
                  });
                  
                  if (importResult.success) {
                    // 导入完成，显示股票加载进度
                    setImportProgress({ current: 10, total: 10, stage: '导入完成' });
                    
                    Alert.alert(
                      '导入成功',
                      importResult.backupPath
                        ? `数据已更新（${importResult.stockCount || 0}只股票）\n备份已保存至：${importResult.backupPath}`
                        : `数据已成功导入（${importResult.stockCount || 0}只股票）`,
                      [{ text: '确定' }]
                    );
                    // 重新加载数据，传入预期的股票数量
                    await loadDatabaseInfo();
                    await loadStocks(importResult.stockCount);
                  } else {
                    Alert.alert('导入失败', importResult.error || '请检查文件格式', [{ text: '确定' }]);
                  }
                } catch (error) {
                  Alert.alert('导入失败', '发生未知错误', [{ text: '确定' }]);
                } finally {
                  setIsImporting(false);
                  setImportProgress({ current: 0, total: 0, stage: '' });
                }
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Import failed:', error);
      Alert.alert('导入失败', '发生未知错误', [{ text: '确定' }]);
    }
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

  const buyCount = stocks.filter(s => s.signal === 'BUY').length;
  const sellCount = stocks.filter(s => s.signal === 'SELL').length;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{STRATEGY_CONFIG.name}</Text>
      </View>

      {/* 数据库信息和导入 */}
      <View style={styles.dbSection}>
        <View style={styles.dbInfoRow}>
          <View style={styles.dbInfoItem}>
            <Text style={styles.dbInfoLabel}>数据库</Text>
            <Text style={[styles.dbInfoValue, isConnected ? styles.statusConnected : styles.statusDisconnected]}>
              {isConnected ? '已连接' : '未连接'}
            </Text>
          </View>
          <View style={styles.dbInfoItem}>
            <Text style={styles.dbInfoLabel}>股票</Text>
            <Text style={styles.dbInfoValue}>{stockCount}</Text>
          </View>
          <View style={styles.dbInfoItem}>
            <Text style={styles.dbInfoLabel}>K线</Text>
            <Text style={styles.dbInfoValue}>{klineCount.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* 导入进度条 */}
        {isImporting && importProgress.total > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(importProgress.current / importProgress.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              {importProgress.stage} ({importProgress.current}/{importProgress.total})
            </Text>
          </View>
        )}

        {/* 加载股票进度条 */}
        {isLoadingStocks && loadProgress.total > 0 && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${(loadProgress.current / loadProgress.total) * 100}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>
              加载股票 ({loadProgress.current}/{loadProgress.total})
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={[styles.importButton, isImporting && styles.importButtonDisabled]} 
          onPress={handleImportDatabase}
          disabled={isImporting || !isConnected}
        >
          {isImporting ? (
            <View style={styles.importingRow}>
              <ActivityIndicator size="small" color="#ffffff" />
              <Text style={styles.importButtonText}>导入中...</Text>
            </View>
          ) : (
            <Text style={styles.importButtonText}>导入数据库</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* 联网补全面板 */}
      {isConnected && db && (
        <View style={styles.syncSection}>
          <SyncPanel db={db} onSyncComplete={() => { loadDatabaseInfo(); loadStocks(); }} />
        </View>
      )}

      {/* 统计信息 */}
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
          <Text style={styles.summaryLabel}>中性</Text>
          <Text style={[styles.summaryValue, { color: COLORS.neutral }]}>{stocks.length - buyCount - sellCount}</Text>
        </View>
      </View>

      {/* 搜索和筛选 */}
      <View style={styles.filterSection}>
        <TextInput
          style={styles.searchInput}
          placeholder="搜索股票代码或名称..."
          placeholderTextColor={COLORS.textSecondary}
          value={search}
          onChangeText={setSearch}
        />
        <View style={styles.filterButtons}>
          {(['all', 'BUY', 'SELL', 'NEUTRAL'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterButton, filter === f && styles.filterButtonActive]}
              onPress={() => setFilter(f)}
            >
              <Text style={[styles.filterButtonText, filter === f && styles.filterButtonTextActive]}>
                {f === 'all' ? '全部' : f === 'BUY' ? '买入' : f === 'SELL' ? '卖出' : '中性'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 股票列表 */}
      <View style={styles.stockList}>
        {filteredStocks.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {isConnected ? '暂无股票数据，请先导入数据库' : '数据库未连接'}
            </Text>
          </View>
        ) : (
          filteredStocks.map((stock) => (
            <TouchableOpacity
              key={stock.code}
              style={styles.stockItem}
              onPress={() => navigation.navigate('Detail', { stock })}
            >
              <View style={styles.stockInfo}>
                <Text style={styles.stockCode}>{stock.code}</Text>
                <Text style={styles.stockName}>{stock.name}</Text>
              </View>
              <View style={styles.signalContainer}>
                <View style={[styles.signalBadge, { backgroundColor: getSignalColor(stock.signal) }]}>
                  <Text style={styles.signalText}>{stock.signal}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  dbSection: {
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    margin: SPACING.sm,
    borderRadius: 8,
  },
  dbInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  dbInfoItem: {
    alignItems: 'center',
  },
  dbInfoLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  dbInfoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  statusConnected: {
    color: COLORS.up,
  },
  statusDisconnected: {
    color: COLORS.down,
  },
  progressContainer: {
    marginTop: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#0f3460',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    backgroundColor: '#00d4ff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
    textAlign: 'center',
  },
  importButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  importButtonDisabled: {
    backgroundColor: '#3a5068',
  },
  importingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  importButtonText: {
    color: '#1a1a2e',
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncSection: {
    margin: SPACING.sm,
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
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  filterSection: {
    padding: SPACING.md,
  },
  searchInput: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: COLORS.text,
    marginBottom: 12,
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: COLORS.card,
  },
  filterButtonActive: {
    backgroundColor: COLORS.accent,
  },
  filterButtonText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#1a1a2e',
  },
  stockList: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: 8,
  },
  stockInfo: {
    flex: 1,
  },
  stockCode: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  stockName: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  signalContainer: {
    alignItems: 'flex-end',
  },
  signalBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  signalText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
});
