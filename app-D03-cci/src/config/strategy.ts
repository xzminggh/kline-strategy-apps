import { StrategyResult } from '../types';
import { calculateCCI } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'D03',
  name: 'CCI极端拐点',
  description: 'CCI从-100以下向上拐头买入，从+100以上向下拐头卖出',
  icon: 'trending-up',
  color: '#ea580c',
  execute: (klineData) => {
    if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const cci = calculateCCI(highs, lows, closes, 20);
    const n = closes.length - 1;
    const prev = n - 1;
    if (cci[n] === null || cci[prev] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const val = cci[n]!;
    const prevVal = cci[prev]!;
    if (prevVal < -100 && val > -100) return { signal: 'BUY', score: 7, details: 'CCI从' + prevVal.toFixed(0) + '拐头向上至' + val.toFixed(0) };
    if (prevVal > 100 && val < 100) return { signal: 'SELL', score: -7, details: 'CCI从' + prevVal.toFixed(0) + '拐头向下至' + val.toFixed(0) };
    if (val < -100) return { signal: 'NEUTRAL', score: 3, details: 'CCI=' + val.toFixed(0) + '，超卖区域' };
    if (val > 100) return { signal: 'NEUTRAL', score: -3, details: 'CCI=' + val.toFixed(0) + '，超买区域' };
    return { signal: 'NEUTRAL', score: 0, details: 'CCI=' + val.toFixed(0) + '，中性区域' };
  }
};
