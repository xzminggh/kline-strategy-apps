import { StrategyResult } from '../types';
import { calculateGuppyMA } from '../shared/indicators';

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
  description: '短期均线组上穿长期均线组买入，下穿卖出',
  icon: 'trending-up',
  color: '#8b5cf6',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const guppy = calculateGuppyMA(closes);
    const n = closes.length - 1;
    const prev = n - 1;
    const shortLatest = guppy.shortTerm[n];
    const longLatest = guppy.longTerm[n];
    const shortPrev = guppy.shortTerm[prev];
    const longPrev = guppy.longTerm[prev];
    if (shortLatest === null || longLatest === null || shortPrev === null || longPrev === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const crossUp = shortLatest > longLatest && shortPrev <= longPrev;
    const crossDown = shortLatest < longLatest && shortPrev >= longPrev;
    if (crossUp) return { signal: 'BUY', score: 8, details: '短期均线组上穿长期均线组' };
    if (crossDown) return { signal: 'SELL', score: -8, details: '短期均线组下穿长期均线组' };
    if (shortLatest > longLatest) return { signal: 'NEUTRAL', score: 2, details: '短期均线组在长期均线上方' };
    return { signal: 'NEUTRAL', score: -2, details: '短期均线组在长期均线下方' };
  }
};
