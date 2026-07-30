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
  id: 'T02',
  name: '60日均线多空分界',
  description: '收盘价站上60日均线买入，跌破60日均线卖出',
  icon: 'trending-up',
  color: '#10b981',
  execute: (klineData) => {
    if (klineData.length < 65) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma60 = calculateMA(closes, 60);
    const n = closes.length - 1;
    const prev = n - 1;
    if (ma60[n] === null || ma60[prev] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const crossUp = closes[n] > ma60[n]! && closes[prev] <= ma60[prev]!;
    const crossDown = closes[n] < ma60[n]! && closes[prev] >= ma60[prev]!;
    if (crossUp) return { signal: 'BUY', score: 8, details: '收盘价上穿60日均线' };
    if (crossDown) return { signal: 'SELL', score: -8, details: '收盘价下穿60日均线' };
    if (closes[n] > ma60[n]!) return { signal: 'NEUTRAL', score: 2, details: '收盘价在60日均线上方' };
    return { signal: 'NEUTRAL', score: -2, details: '收盘价在60日均线下方' };
  }
};
