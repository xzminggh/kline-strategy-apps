import { StrategyResult } from '../types';
import { calculateMA } from '../shared/indicators';

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
  description: 'MA5/MA10/MA20从空头排列转为多头排列时买入，反之卖出',
  icon: 'trending-up',
  color: '#06b6d4',
  execute: (klineData) => {
    if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);
    const n = closes.length - 1;
    const p = n - 1;
    if ([ma5[n], ma10[n], ma20[n], ma5[p], ma10[p], ma20[p]].some(v => v === null)) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const bullNow = ma5[n]! > ma10[n]! && ma10[n]! > ma20[n]!;
    const bearNow = ma5[n]! < ma10[n]! && ma10[n]! < ma20[n]!;
    const bullPrev = ma5[p]! > ma10[p]! && ma10[p]! > ma20[p]!;
    const bearPrev = ma5[p]! < ma10[p]! && ma10[p]! < ma20[p]!;
    if (bullNow && !bullPrev) return { signal: 'BUY', score: 8, details: '三线由空转多（MA5>MA10>MA20）' };
    if (bearNow && !bearPrev) return { signal: 'SELL', score: -8, details: '三线由多转空（MA5<MA10<MA20）' };
    if (bullNow) return { signal: 'NEUTRAL', score: 2, details: '三线多头排列' };
    if (bearNow) return { signal: 'NEUTRAL', score: -2, details: '三线空头排列' };
    return { signal: 'NEUTRAL', score: 0, details: '三线交织，方向不明' };
  }
};
