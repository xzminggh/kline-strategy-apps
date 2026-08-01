import { StrategyResult } from '../types';
import { calculateRSI, findLocalExtrema } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'D02',
  name: 'RSI隐性背离',
  description: '价格创新高但RSI不创新高时隐性顶背离，价格创新低但RSI不创新低时隐性底背离',
  icon: 'trending-up',
  color: '#f97316',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const rsi = calculateRSI(closes, 14);
    const n = closes.length - 1;
    if (rsi[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const priceExtrema = findLocalExtrema(closes, 5);
    if (priceExtrema.highs.length < 2 && priceExtrema.lows.length < 2) {
      return { signal: 'NEUTRAL', score: 0, details: '未识别到足够极值' };
    }
    // 顶背离：前一个高点 vs 最近一个高点，RSI走低
    if (priceExtrema.highs.length >= 2) {
      const prev = priceExtrema.highs[priceExtrema.highs.length - 2];
      const curr = priceExtrema.highs[priceExtrema.highs.length - 1];
      const rsiPrev = rsi[prev.idx];
      const rsiCurr = rsi[curr.idx];
      if (closes[n] >= curr.val * 0.98 && rsiPrev !== null && rsiCurr !== null && rsiCurr < rsiPrev) {
        return { signal: 'SELL', score: -6, details: `RSI隐性顶背离（${prev.val.toFixed(2)}→${curr.val.toFixed(2)} RSI ${rsiPrev.toFixed(1)}→${rsiCurr.toFixed(1)}）` };
      }
    }
    // 底背离：前一个低点 vs 最近一个低点，RSI走高
    if (priceExtrema.lows.length >= 2) {
      const prev = priceExtrema.lows[priceExtrema.lows.length - 2];
      const curr = priceExtrema.lows[priceExtrema.lows.length - 1];
      const rsiPrev = rsi[prev.idx];
      const rsiCurr = rsi[curr.idx];
      if (closes[n] <= curr.val * 1.02 && rsiPrev !== null && rsiCurr !== null && rsiCurr > rsiPrev) {
        return { signal: 'BUY', score: 6, details: `RSI隐性底背离（${prev.val.toFixed(2)}→${curr.val.toFixed(2)} RSI ${rsiPrev.toFixed(1)}→${rsiCurr.toFixed(1)}）` };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '无RSI背离信号' };
  }
};
