import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { KlineChart } from '../shared/components';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';
import { fetchStockBasicInfo, fetchMarketOverview, type StockBasicInfo, type MarketOverview } from '../shared/services/StockInfoFetcher';

export default function DetailScreen({ route }: { route: any }) {
  const stock = route?.params?.stock;
  const [basicInfo, setBasicInfo] = useState<StockBasicInfo | null>(null);
  const [marketOverview, setMarketOverview] = useState<MarketOverview | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (stock) {
      loadStockInfo();
    }
  }, [stock]);

  const loadStockInfo = async () => {
    setLoading(true);
    try {
      // 先获取基本信息（包含实时价格）
      const info = await fetchStockBasicInfo(stock.code, stock.name);
      setBasicInfo(info);
      
      // 用实时价格获取走势概况
      const overview = await fetchMarketOverview(stock.code, stock.klineData, info.currentPrice ?? undefined);
      setMarketOverview(overview);
    } catch (error) {
      console.error('Failed to load stock info:', error);
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

  // K线数据倒序（最新在前）
  const klineReversed = [...(stock.klineData || [])].reverse();
  // 当前价：优先使用腾讯API实时价格，回退到数据库最新价
  const displayPrice = basicInfo?.currentPrice ?? (stock.klineData?.length > 0 ? stock.klineData[stock.klineData.length - 1].close : null);
  const priceChange = basicInfo?.priceChange ?? 0;
  const priceChangePct = basicInfo?.priceChangePct ?? 0;

  return (
    <ScrollView style={styles.container}>
      {/* 股票头部信息 */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.code}>{stock.code}</Text>
          <Text style={styles.name}>{stock.name}</Text>
        </View>
        <View style={styles.headerRight}>
          {displayPrice !== null && (
            <View style={styles.priceContainer}>
              <Text style={[styles.currentPrice, { color: priceChange >= 0 ? COLORS.up : COLORS.down }]}>
                {displayPrice.toFixed(2)}
              </Text>
              <Text style={[styles.priceChange, { color: priceChange >= 0 ? COLORS.up : COLORS.down }]}>
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)} ({priceChange >= 0 ? '+' : ''}{priceChangePct.toFixed(2)}%)
              </Text>
            </View>
          )}
          <View style={[styles.signalBadge, { backgroundColor: STRATEGY_CONFIG.color }]}>
            <Text style={styles.signalText}>{stock.signal}</Text>
          </View>
          <Text style={[styles.score, { color: stock.signal === 'BUY' ? COLORS.up : stock.signal === 'SELL' ? COLORS.down : COLORS.neutral }]}>
            {stock.score > 0 ? '+' : ''}{stock.score}
          </Text>
        </View>
      </View>

      {/* K线图 */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>K线图</Text>
          <Text style={styles.cardSubtitle}>{stock.code} {stock.name}</Text>
        </View>
        <KlineChart
          data={stock.klineData}
          height={220}
          stockCode={stock.code}
          stockName={stock.name}
          currentPrice={displayPrice}
          priceChangePct={priceChangePct}
        />
      </View>

      {/* 市场走势概况 */}
      {marketOverview && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>{stock.code} {stock.name} 走势概况</Text>
          <View style={[styles.trendBadge, {
            backgroundColor: marketOverview.trend === 'bullish' ? COLORS.up :
                             marketOverview.trend === 'bearish' ? COLORS.down : COLORS.neutral
          }]}>
            <Text style={styles.trendText}>
              {marketOverview.trend === 'bullish' ? '看多' :
               marketOverview.trend === 'bearish' ? '看空' : '中性'}
            </Text>
          </View>
          <Text style={styles.overviewSummary}>{marketOverview.summary}</Text>
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
        <Text style={styles.detailText}>{stock.details}</Text>
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
              const isUp = item.close >= item.open;
              const colorUp = COLORS.up;
              const colorDown = COLORS.down;
              return (
                <View key={index} style={styles.klineRow}>
                  <Text style={styles.klineDate}>{item.date.replace(/-/g, '')}</Text>
                  <Text style={styles.klineNum}>{item.open.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUp ? colorUp : colorDown }]}>{item.high.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUp ? colorUp : colorDown }]}>{item.low.toFixed(2)}</Text>
                  <Text style={[styles.klineNum, { color: isUp ? colorUp : colorDown, fontWeight: 'bold' }]}>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flex: 1,
  },
  code: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  name: {
    fontSize: 18,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  priceChange: {
    fontSize: 14,
    marginTop: 2,
  },
  signalBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  signalText: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    margin: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.card,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  cardSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  trendBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 8,
  },
  trendText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  overviewSummary: {
    fontSize: 16,
    color: COLORS.text,
    lineHeight: 24,
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
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  infoLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },
  strategyDesc: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f59e0b',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
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
