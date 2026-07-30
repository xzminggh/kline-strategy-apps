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
        <Text style={styles.sectionTitle}>使用说明</Text>
        <View style={styles.card}>
          <Text style={styles.instructionTitle}>1. 导入数据</Text>
          <Text style={styles.instructionText}>
            • 在首页顶部点击「导入数据库」按钮{'\n'}
            • 选择包含股票K线数据的SQLite数据库文件{'\n'}
            • 导入后首页会自动显示策略信号
          </Text>

          <Text style={styles.instructionTitle}>2. 联网补齐</Text>
          <Text style={styles.instructionText}>
            • 点击首页「联网补齐最新K线」按钮{'\n'}
            • 系统会自动联网获取最新K线数据{'\n'}
            • 只新增缺失K线，不修改已有历史
          </Text>

          <Text style={styles.instructionTitle}>3. 首页功能</Text>
          <Text style={styles.instructionText}>
            • 顶部显示数据库状态和导入按钮{'\n'}
            • 查看所有股票的策略信号{'\n'}
            • 买入信号显示为红色，卖出信号显示为绿色{'\n'}
            • 点击搜索框可按股票代码或名称筛选{'\n'}
            • 使用顶部按钮可按信号类型筛选
          </Text>

          <Text style={styles.instructionTitle}>4. 详情页功能</Text>
          <Text style={styles.instructionText}>
            • 点击首页任意股票可查看详情{'\n'}
            • 查看K线图和策略信号{'\n'}
            • 查看股票基本信息和走势概况{'\n'}
            • 了解策略的具体判断依据
          </Text>

          <Text style={styles.instructionTitle}>5. 策略说明</Text>
          <Text style={styles.instructionText}>
            本App使用「{STRATEGY_CONFIG.name}」策略：{'\n'}
            {STRATEGY_CONFIG.description}
          </Text>

          <Text style={styles.instructionTitle}>6. 信号解读</Text>
          <Text style={styles.instructionText}>
            • BUY（买入）：策略发出买入信号{'\n'}
            • SELL（卖出）：策略发出卖出信号{'\n'}
            • NEUTRAL（中性）：无明确信号{'\n'}
            • 分数越高表示信号越强
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>关于</Text>
        <View style={styles.card}>
          <Text style={styles.infoText}>版本: 1.0.0</Text>
          <Text style={styles.infoText}>基于26策略引擎</Text>
          <Text style={styles.infoText}>本App仅用于策略回测和学习交流</Text>
        </View>
      </View>

      <View style={styles.warningSection}>
        <Text style={styles.warningText}>
          ⚠️ 本软件所提供的所有信息仅供学习交流和策略回测使用，不构成任何投资建议。股市有风险，投资需谨慎。
        </Text>
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
    fontSize: 22,
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
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  strategyId: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  strategyDesc: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 24,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.accent,
    marginTop: 12,
    marginBottom: 6,
  },
  instructionText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  infoText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  warningSection: {
    padding: SPACING.md,
    marginTop: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#f59e0b',
    lineHeight: 22,
    textAlign: 'center',
  },
});
