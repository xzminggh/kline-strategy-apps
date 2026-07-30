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
  id: 'S04',
  name: '锤子线/流星线确认',
  description: '当短期EMA上穿长期EMA时买入，下穿时卖出',
  icon: 'trending-up',
  color: '#dc2626',
  execute: (klineData) => {
    // 策略逻辑将在这里注入
    return executeHammerShootingStar(klineData);
  }
};
