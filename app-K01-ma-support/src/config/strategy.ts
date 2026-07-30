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
  id: 'K01',
  name: '均线支撑/压力回踩',
  description: '价格回踩MA20获得支撑买入，回踩MA20受阻卖出',
  icon: 'trending-up',
  color: '#7c3aed',
  execute: (klineData) => {
    if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma20 = calculateMA(closes, 20);
    const n = closes.length - 1;
    const p = n - 1;
    if (ma20[n] === null || ma20[p] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const dist = Math.abs(closes[n] - ma20[n]!) / ma20[n]! * 100;
    const wasAbove = closes[p] > ma20[p]!;
    const nowAbove = closes[n] > ma20[n]!;
    const touched = dist < 2;
    if (wasAbove && touched && nowAbove) return { signal: 'BUY', score: 6, details: '回踩MA20获支撑（距离' + dist.toFixed(1) + '%）' };
    if (!wasAbove && touched && !nowAbove) return { signal: 'SELL', score: -6, details: '回踩MA20受阻（距离' + dist.toFixed(1) + '%）' };
    if (closes[n] > ma20[n]!) return { signal: 'NEUTRAL', score: 1, details: '价格在MA20上方（距离' + dist.toFixed(1) + '%）' };
    return { signal: 'NEUTRAL', score: -1, details: '价格在MA20下方（距离' + dist.toFixed(1) + '%）' };
  }
};
