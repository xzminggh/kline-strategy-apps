import { StrategyResult } from '../types';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

// 默认配置 - 将被每个App的策略配置替换
export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'V02',
  name: 'ATR窄幅后方向选择',
  description: '当短期EMA上穿长期EMA时买入，下穿时卖出',
  icon: 'trending-up',
  color: '#f43f5e',
  execute: (klineData) => {
    // 策略逻辑将在这里注入
    return executeAtrBreakout(klineData);
  }
};
