import { StrategyResult } from '../types';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'T04',
  name: '三线反向反转',
  description: '三线反向反转策略',
  icon: 'trending-up',
  color: '#f59e0b',
  execute: (klineData) => {
    // TODO: 实现具体策略逻辑
    return { signal: 'NEUTRAL', score: 0, details: '策略待实现' };
  }
};