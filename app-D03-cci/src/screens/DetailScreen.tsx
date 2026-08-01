import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { KlineChart } from '../shared/components';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';
import { fetchStockBasicInfo, fetchMarketOverview, type StockBasicInfo, type MarketOverview } from '../shared/services/StockInfoFetcher';
import { useDatabase } from '../shared/database';

export default function DetailScreen({ route }: { route: any }) {
  const stock = route?.params?.stock;
  const { getKlineByCode } = useDatabase();
  const [basicInfo, setBasicInfo] = useState<StockBasicInfo | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(false);
  const [klineData, setKlineData] = useState<any[]>(stock?.klineData || []);
  const [signal, setSignal] = useState(stock?.signal || 'NEUTRAL');
  const [details, setDetails] = useState(stock?.details || '');

  const refreshFromDB = useCallback(async () => {
    if (!stock?.code) return;
    try {
      const latest = await getKlineByCode(stock.code);
      if (latest && latest.length > 0) {
        setKlineData(latest as any[]);
        const result = STRATEGY_CONFIG.execute(latest);
        setSignal(result.signal);
        setDetails(result.details);
        const overview = await fetchMarketOverview(stock.code, latest);
        setMarketOverview(overview);
      }
    } catch (e) {
      console.error('refreshFromDB failed:', String(e));
    }
  }, [stock?.code]);

  useEffect(() => {
    if (stock) {
      loadStockInfo();
      refreshFromDB();
    }
  }, [stock]);

  const loadStockInfo = async () => {
    setLoading(true);
    try {
      const info = await fetchStockBasicInfo(stock.code, stock.name);
      setBasicInfo(info);
      const overview = await fetchMarketOverview(stock.code, klineData);
      setMarketOverview(overview);
    } catch (error) {
      console.error('Failed to load stock info:', String(error));
    } finally {
      setLoading(false);
    }
  };

  if (!stock) {
    return (
      <View style={styles.container}>
        <View style={styles.centered}>
          <Text style={styles.emptyText}>请从首页选择一只股票查看详情</Text>
        </View>
      </View>
    );
  }

  const klineReversed = [...klineData].reverse();
  const displayPrice = basicInfo?.currentPrice ?? (klineData.length > 0 ? klineData[klineData.length - 1].close : null);
  const priceChange = basicInfo?.priceChange ?? 0;
  const priceChangePct = basicInfo?.priceChangePct ?? 0;
  const isUp = priceChange >= 0;

  const marketTrendText = marketOverview
    ? marketOverview.marketTrend === 'bullish' ? '偏强'
    : marketOverview.marketTrend === 'bearish' ? '偏弱' : '震荡'
    : '';

  return (
    <ScrollView style={styles.container}>
      {/* 股票头部信息 - 两行布局 */}
      <View style={styles.header}>
        {/* 第一行：代码 + 名称 + 信号徽章 */}
        <View style={styles.headerRow1}>
          <View style={styles.headerLeft}>
            <Text style={styles.code}>{stock.code}</Text>
            <Text style={styles.name}>{stock.name}</Text>
          </View>
          <View style={[styles.signalBadge, { backgroundColor: STRATEGY_CONFIG.color }]}>
            <Text style={styles.signalText}>{signal}</Text>
          </View>
        </View>
        {/* 第二行：价格 + 涨跌 */}
        {displayPrice !== null && (
          <View style={styles.headerRow2}>
            <Text style={[styles.currentPrice, { color: isUp ? COLORS.up : COLORS.down }]}>
              {displayPrice.toFixed(2)}
            </Text>
            <Text style={[styles.priceChange, { color: isUp ? COLORS.up : COLORS.down }]}>
              {isUp ? '+' : ''}{priceChange.toFixed(2)}  {isUp ? '+' : ''}{priceChangePct.toFixed(2)}%
            </Text>
          </View>
        )}
      </View>

      {/* 大盘概况 - 市场情绪在标题行 */}
      {marketOverview && marketOverview.indices.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardTitleRow}>
            <Text style={styles.cardTitle}>📊 大盘概况</Text>
            <View style={[styles.marketTrendBadge, {
              backgroundColor: marketOverview.marketTrend === 'bullish' ? COLORS.up :
                               marketOverview.marketTrend === 'bearish' ? COLORS.down : COLORS.neutral
            }]}>
              <Text style={styles.marketTrendText}>市场情绪：{marketTrendText}</Text>
            </View>
          </View>
          <View style={styles.indicesContainer}>
            {marketOverview.indices.map((index) => (
              <View key={index.code} style={styles.indexItem}>
                <Text style={styles.indexName}>{index.name}</Text>
                <Text style={[styles.indexValue, { color: index.changePct >= 0 ? COLORS.up : COLORS.down }]}>
                  {index.current.toFixed(2)}
                </Text>
                <Text style={[styles.indexChange, { color: index.changePct >= 0 ? COLORS.up : COLORS.down }]}>
                  {index.changePct >= 0 ? '+' : ''}{index.changePct.toFixed(2)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* K线图 - 标题左侧代码名称 */}
      <View style={styles.card}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle}>{stock.code} {stock.name}</Text>
        </View>
        <KlineChart
          data={klineData}
          height={220}
          stockCode={stock.code}
          stockName={stock.name}
          currentPrice={displayPrice}
          priceChangePct={priceChangePct}
        />
      </View>

      {/* 个股走势概况 */}
      {marketOverview && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{stock.code} {stock.name} 走势概况</Text>
          <View style={styles.trendRow}>
            <View style={[styles.trendBadge, {
              backgroundColor: marketOverview.stockTrend === 'bullish' ? COLORS.up :
                               marketOverview.stockTrend === 'bearish' ? COLORS.down : COLORS.neutral
            }]}>
              <Text style={styles.trendText}>
                {marketOverview.stockTrend === 'bullish' ? '看多' :
                 marketOverview.stockTrend === 'bearish' ? '看空' : '中性'}
              </Text>
            </View>
            <Text style={styles.dataSourceTag}>
              {marketOverview.dataSource === 'realtime' ? '实时数据' : '数据库数据'}
              {marketOverview.dataDate ? `（${marketOverview.dataDate}）` : ''}
            </Text>
          </View>
          <Text style={styles.overviewSummary}>{marketOverview.stockSummary}</Text>
          {marketOverview.keyPoints.length > 0 && (
            <View style={styles.keyPoints}>
              {marketOverview.keyPoints.map((point, index) => (
                <Text key={index} style={styles.keyPoint}>• {point}</Text>
              ))}
            </View>
          )}
          <Text style={styles.riskWarning}>{marketOverview.riskWarning}</Text>
        </View>
      )}

      {/* 策略详情 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>策略详情</Text>
        <Text style={styles.detailText}>{details}</Text>
      </View>

      {/* 基本信息 */}
      {basicInfo && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>基本信息</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>市场</Text>
            <Text style={styles.infoValue}>{basicInfo.market}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>总市值</Text>
            <Text style={styles.infoValue}>{basicInfo.totalMV}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>流通市值</Text>
            <Text style={styles.infoValue}>{basicInfo.circMV}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>市盈率(动)</Text>
            <Text style={styles.infoValue}>{basicInfo.pe}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>市净率</Text>
            <Text style={styles.infoValue}>{basicInfo.pb}</Text>
          </View>
        </View>
      )}

      {/* 策略信息 */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>策略信息</Text>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>策略ID</Text>
          <Text style={styles.infoValue}>{STRATEGY_CONFIG.id}</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>策略名称</Text>
          <Text style={styles.infoValue}>{STRATEGY_CONFIG.name}</Text>
        </View>
        <Text style={styles.strategyDesc}>{STRATEGY_CONFIG.description}</Text>
      </View>

      {/* 历史K线清单 */}
      {klineReversed.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>历史K线（共{klineReversed.length}条，倒序）</Text>
          <View style={styles.klineTableHeader}>
            <Text style={styles.klineHeaderDate}>日期</Text>
            <Text style={styles.klineHeaderNum}>开盘</Text>
            <Text style={styles.klineHeaderNum}>最高</Text>
            <Text style={styles.klineHeaderNum}>最低</Text>
            <Text style={styles.klineHeaderNum}>收盘</Text>
            <Text style={styles.klineHeaderNum}>成交量</Text>
          </View>
          <ScrollView style={styles.klineList} showsVerticalScrollIndicator={true} persistentScrollbar={true} nestedScrollEnabled={true}>
            {klineReversed.map((item, index) => {
              const isUpItem = item.close >= item.open;
              return (
                <View key={index} style={styles.klineRow}>
                  <Text style={styles.klineDate}>{item.date.replace(/-/g, '')}</Text>
                  <Text style={styles.klineNum}>{item.open.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUpItem ? COLORS.up : COLORS.down }]}>{item.high.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUpItem ? COLORS.up : COLORS.down }]}>{item.low.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUpItem ? COLORS.up : COLORS.down, fontWeight: 'bold' }]}>
                    {item.close.toFixed(2)}
                  </Text>
                  <Text style={styles.klineNum}>{item.volume.toFixed(2)}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 风险警示 */}
      <View style={styles.warningCard}>
        <Text style={styles.warningTitle}>⚠️ 风险警示</Text>
        <Text style={styles.warningText}>
          本软件所提供的所有信息仅供学习交流和策略回测使用，不构成任何投资建议。
          股市有风险，投资需谨慎。据此操作，风险自担。
        </Text>
        <Text style={styles.warningFooter}>
          — {STRATEGY_CONFIG.name}策略分析系统
        </Text>
      </View>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={COLORS.accent} />
          <Text style={styles.loadingText}>加载中...</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.card,
  },
  headerRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  code: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  name: {
    fontSize: 16,
    color: COLORS.textSecondary,
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
  headerRow2: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  priceChange: {
    fontSize: 16,
  },
  card: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  marketTrendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  marketTrendText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  indicesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  indexItem: {
    alignItems: 'center',
    flex: 1,
  },
  indexName: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  indexValue: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  indexChange: {
    fontSize: 13,
    marginTop: 2,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  trendBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
  },
  trendText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 'bold',
  },
  dataSourceTag: {
    fontSize: 11,
    color: COLORS.accent,
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 3,
  },
  overviewSummary: {
    fontSize: 15,
    color: COLORS.text,
    lineHeight: 22,
    marginBottom: 8,
  },
  keyPoints: {
    marginTop: 8,
  },
  keyPoint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  riskWarning: {
    fontSize: 12,
    color: '#f59e0b',
    marginTop: 12,
    fontStyle: 'italic',
  },
  detailText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 15,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: '500',
  },
  strategyDesc: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginTop: 8,
  },
  klineList: {
    maxHeight: 300,
  },
  klineTableHeader: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#0f3460',
    borderRadius: 6,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COLORS.accent,
  },
  klineHeaderDate: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    width: 60,
  },
  klineHeaderNum: {
    color: COLORS.accent,
    fontSize: 11,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  klineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  klineDate: {
    color: COLORS.textSecondary,
    fontSize: 11,
    width: 60,
  },
  klineNum: {
    color: COLORS.text,
    fontSize: 11,
    flex: 1,
    textAlign: 'center',
  },
  warningCard: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: '#1a1a2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  warningFooter: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 12,
    textAlign: 'right',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.text,
    marginTop: 12,
    fontSize: 16,
  },
});
