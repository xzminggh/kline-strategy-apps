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
  id: 'T03',
  name: '顾比均线组穿越',
  description: '顾比均线组穿越策略',
  icon: 'trending-up',
  color: '#8b5cf6',
  execute: (klineData) => {
    // TODO: 实现具体策略逻辑
    return { signal: 'NEUTRAL', score: 0, details: '策略待实现' };
  }
};