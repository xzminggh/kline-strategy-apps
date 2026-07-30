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
  id: 'M04',
  name: '缺口回补',
  description: '缺口回补策略',
  icon: 'trending-up',
  color: '#84cc16',
  execute: (klineData) => {
    // TODO: 实现具体策略逻辑
    return { signal: 'NEUTRAL', score: 0, details: '策略待实现' };
  }
};