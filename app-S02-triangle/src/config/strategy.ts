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
  id: 'S02',
  name: '三角形整理末端突破',
  description: '当短期EMA上穿长期EMA时买入，下穿时卖出',
  icon: 'trending-up',
  color: '#22c55e',
  execute: (klineData) => {
    // 策略逻辑将在这里注入
    return executeTriangleBreakout(klineData);
  }
};
