import { StrategyResult } from '../types';
import { calculateBollinger } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'M01',
  name: '布林带触轨反弹',
  description: '价格触及布林带下轨时买入，触及上轨时卖出',
  icon: 'trending-up',
  color: '#ef4444',
  execute: (klineData) => {
    if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const boll = calculateBollinger(closes);
    const n = closes.length - 1;
    if (boll.lower[n] === null || boll.upper[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    if (closes[n] <= boll.lower[n]!) return { signal: 'BUY', score: 7, details: '价格触及布林带下轨，超卖反弹信号' };
    if (closes[n] >= boll.upper[n]!) return { signal: 'SELL', score: -7, details: '价格触及布林带上轨，超买回落信号' };
    const midDist = (closes[n] - boll.middle[n]!) / (boll.upper[n]! - boll.lower[n]! + 0.001);
    return { signal: 'NEUTRAL', score: 0, details: '价格在布林带中部（偏离' + (midDist * 100).toFixed(1) + '%）' };
  }
};
