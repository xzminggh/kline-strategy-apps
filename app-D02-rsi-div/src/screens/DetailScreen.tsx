import React from 'react';
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
});