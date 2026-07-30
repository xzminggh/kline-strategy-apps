import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { STRATEGY_CONFIG } from '../config/strategy';
import { COLORS, SPACING } from '../theme/colors';

export default function SettingsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>当前策略</Text>
        <View style={styles.card}>
          <Text style={styles.strategyName}>{STRATEGY_CONFIG.name}</Text>
          <Text style={styles.strategyId}>ID: {STRATEGY_CONFIG.id}</Text>
          <Text style={styles.strategyDesc}>{STRATEGY_CONFIG.description}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>数据源</Text>
        <View style={styles.card}>
          <Text style={styles.item}>主数据源: 腾讯财经</Text>
          <Text style={styles.item}>备用数据源: 新浪财经</Text>
          <Text style={styles.item}>第三数据源: 东方财富</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.card}>
          <Text style={styles.item}>版本: 1.0.0</Text>
          <Text style={styles.item}>基于26策略引擎</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  section: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.card,
    padding: SPACING.md,
    borderRadius: 8,
  },
  strategyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  strategyId: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  strategyDesc: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 20,
  },
  item: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
});
