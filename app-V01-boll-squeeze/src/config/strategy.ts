import { StrategyResult } from '../types';
import { calculateBollinger, calculateBollingerWidth } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'V01',
  name: '布林带收口突破',
  description: '布林带宽度收窄至极值后价格突破时产生信号',
  icon: 'trending-up',
  color: '#d946ef',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const boll = calculateBollinger(closes);
    const width = calculateBollingerWidth(boll.upper, boll.lower, boll.middle);
    const n = closes.length - 1;
    if (width[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const recentWidth = width.slice(-20).filter((w): w is number => w !== null);
    if (recentWidth.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const avgWidth = recentWidth.reduce((a, b) => a + b, 0) / recentWidth.length;
    const currentWidth = width[n]!;
    const isSqueeze = currentWidth < avgWidth * 0.5;
    if (isSqueeze && closes[n] > boll.upper[n]!) return { signal: 'BUY', score: 7, details: '布林带收口后向上突破' };
    if (isSqueeze && closes[n] < boll.lower[n]!) return { signal: 'SELL', score: -7, details: '布林带收口后向下突破' };
    if (isSqueeze) return { signal: 'NEUTRAL', score: 0, details: '布林带收口，等待突破' };
    return { signal: 'NEUTRAL', score: 0, details: '布林带宽度正常' };
  }
};
