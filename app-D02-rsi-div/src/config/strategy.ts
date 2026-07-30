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
    if (priceExtrema.highs.length >= 2) {
      const lastHighs = priceExtrema.highs.slice(-2);
      const highIdx1 = closes.indexOf(lastHighs[0]);
      const rsiHigh1 = highIdx1 >= 0 ? rsi[Math.min(highIdx1, rsi.length - 1)] : null;
      const rsiHigh2 = rsi[n];
      if (closes[n] >= lastHighs[0] * 0.98 && rsiHigh1 !== null && rsiHigh2 !== null && rsiHigh2 < rsiHigh1) {
        return { signal: 'SELL', score: -6, details: 'RSI隐性顶背离（价格新高但RSI不新高）' };
      }
    }
    if (priceExtrema.lows.length >= 2) {
      const lastLows = priceExtrema.lows.slice(-2);
      const lowIdx1 = closes.indexOf(lastLows[0]);
      const rsiLow1 = lowIdx1 >= 0 ? rsi[Math.min(lowIdx1, rsi.length - 1)] : null;
      const rsiLow2 = rsi[n];
      if (closes[n] <= lastLows[0] * 1.02 && rsiLow1 !== null && rsiLow2 !== null && rsiLow2 > rsiLow1) {
        return { signal: 'BUY', score: 6, details: 'RSI隐性底背离（价格新低但RSI不新低）' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '无RSI背离信号' };
  }
};
