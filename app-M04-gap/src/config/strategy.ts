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
  id: 'M04',
  name: '缺口回补',
  description: '出现向下跳空缺口后价格回补缺口时买入',
  icon: 'trending-up',
  color: '#64748b',
  execute: (klineData) => {
    if (klineData.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const n = klineData.length - 1;
    const today = klineData[n];
    const yesterday = klineData[n - 1];
    const gapDown = today.high < yesterday.low;
    const gapUp = today.low > yesterday.high;
    if (gapDown) {
      const gapSize = ((yesterday.low - today.high) / yesterday.close * 100).toFixed(2);
      return { signal: 'BUY', score: 6, details: '向下跳空缺口' + gapSize + '%，关注回补机会' };
    }
    if (gapUp) {
      const gapSize = ((today.low - yesterday.high) / yesterday.close * 100).toFixed(2);
      return { signal: 'SELL', score: -6, details: '向上跳空缺口' + gapSize + '%，注意回落风险' };
    }
    // Check if recent gap is being filled
    for (let i = n - 1; i >= Math.max(0, n - 5); i--) {
      const curr = klineData[i];
      const prev = klineData[i - 1];
      if (prev && curr.high < prev.low) {
        if (today.close > prev.low) {
          return { signal: 'BUY', score: 5, details: '近期向下缺口已回补，反弹信号' };
        }
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '无明显缺口信号' };
  }
};
