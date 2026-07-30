import { StrategyResult } from '../types';
import { findLocalExtrema } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'K02',
  name: '前高变支撑/前低变阻力',
  description: '价格突破前高后回踩获得支撑买入，跌破前低后反弹受阻卖出',
  icon: 'trending-up',
  color: '#2563eb',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const extrema = findLocalExtrema(closes, 5);
    const n = closes.length - 1;
    if (extrema.highs.length < 1 || extrema.lows.length < 1) return { signal: 'NEUTRAL', score: 0, details: '未识别到关键价位' };
    const prevHigh = extrema.highs[extrema.highs.length - 1];
    const prevLow = extrema.lows[extrema.lows.length - 1];
    const distHigh = Math.abs(closes[n] - prevHigh) / prevHigh * 100;
    const distLow = Math.abs(closes[n] - prevLow) / prevLow * 100;
    if (closes[n] > prevHigh && distHigh < 3) return { signal: 'BUY', score: 6, details: '突破前高' + prevHigh.toFixed(2) + '，确认支撑' };
    if (closes[n] < prevLow && distLow < 3) return { signal: 'SELL', score: -6, details: '跌破前低' + prevLow.toFixed(2) + '，确认阻力' };
    return { signal: 'NEUTRAL', score: 0, details: '前高' + prevHigh.toFixed(2) + '，前低' + prevLow.toFixed(2) };
  }
};
