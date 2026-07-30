import { StrategyResult } from '../types';
import { calculateATR } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'V02',
  name: 'ATR窄幅后方向选择',
  description: 'ATR收窄至极低值后价格产生方向性突破',
  icon: 'trending-up',
  color: '#f43f5e',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const atr = calculateATR(highs, lows, closes, 14);
    const n = closes.length - 1;
    if (atr[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const recentATR = atr.slice(-20).filter((a): a is number => a !== null);
    if (recentATR.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const avgATR = recentATR.reduce((a, b) => a + b, 0) / recentATR.length;
    const currentATR = atr[n]!;
    const isNarrow = currentATR < avgATR * 0.6;
    const prevClose = closes[n - 1];
    const breakout = closes[n] - prevClose;
    if (isNarrow && breakout > currentATR * 0.5) return { signal: 'BUY', score: 7, details: 'ATR窄幅后向上突破' };
    if (isNarrow && breakout < -currentATR * 0.5) return { signal: 'SELL', score: -7, details: 'ATR窄幅后向下突破' };
    if (isNarrow) return { signal: 'NEUTRAL', score: 0, details: 'ATR收窄，等待方向选择' };
    return { signal: 'NEUTRAL', score: 0, details: 'ATR正常波动' };
  }
};
