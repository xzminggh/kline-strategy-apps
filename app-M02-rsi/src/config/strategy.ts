import { StrategyResult } from '../types';
import { calculateRSI } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'M02',
  name: 'RSI超买超卖',
  description: 'RSI低于30时买入（超卖），高于70时卖出（超买）',
  icon: 'trending-up',
  color: '#f59e0b',
  execute: (klineData) => {
    if (klineData.length < 20) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const rsi = calculateRSI(closes, 14);
    const n = closes.length - 1;
    if (rsi[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const val = rsi[n]!;
    if (val < 30) return { signal: 'BUY', score: 7, details: 'RSI=' + val.toFixed(1) + '，超卖区域，可能反弹' };
    if (val > 70) return { signal: 'SELL', score: -7, details: 'RSI=' + val.toFixed(1) + '，超买区域，注意回调' };
    if (val < 40) return { signal: 'NEUTRAL', score: 2, details: 'RSI=' + val.toFixed(1) + '，偏弱' };
    if (val > 60) return { signal: 'NEUTRAL', score: -2, details: 'RSI=' + val.toFixed(1) + '，偏强' };
    return { signal: 'NEUTRAL', score: 0, details: 'RSI=' + val.toFixed(1) + '，中性区域' };
  }
};
