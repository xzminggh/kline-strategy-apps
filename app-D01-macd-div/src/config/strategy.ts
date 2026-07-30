import { StrategyResult } from '../types';
import { calculateMACD, findLocalExtrema } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'D01',
  name: 'MACD底/顶背离',
  description: '价格创新低但MACD不创新低时底背离买入，价格创新高但MACD不创新高时顶背离卖出',
  icon: 'trending-up',
  color: '#eab308',
  execute: (klineData) => {
    if (klineData.length < 40) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const macd = calculateMACD(closes);
    const priceExtrema = findLocalExtrema(closes, 5);
    const n = closes.length - 1;
    if (priceExtrema.lows.length < 2 || macd.histogram[n] === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const lastLows = priceExtrema.lows.slice(-2);
    const priceMakingLow = closes[n] <= lastLows[0] * 1.02;
    const macdIdx1 = closes.indexOf(lastLows[0]);
    const macdIdx2 = n;
    const macdLow1 = macdIdx1 >= 0 ? macd.histogram[Math.min(macdIdx1, macd.histogram.length - 1)] : null;
    const macdLow2 = macd.histogram[macdIdx2];
    if (priceMakingLow && macdLow1 !== null && macdLow2 !== null && macdLow2 > macdLow1) {
      return { signal: 'BUY', score: 7, details: 'MACD底背离（价格新低但MACD不新低）' };
    }
    const lastHighs = priceExtrema.highs.slice(-2);
    const priceMakingHigh = closes[n] >= lastHighs[0] * 0.98;
    const macdHighIdx = closes.indexOf(lastHighs[0]);
    const macdHigh1 = macdHighIdx >= 0 ? macd.histogram[Math.min(macdHighIdx, macd.histogram.length - 1)] : null;
    const macdHigh2 = macd.histogram[macdIdx2];
    if (priceMakingHigh && macdHigh1 !== null && macdHigh2 !== null && macdHigh2 < macdHigh1) {
      return { signal: 'SELL', score: -7, details: 'MACD顶背离（价格新高但MACD不新高）' };
    }
    return { signal: 'NEUTRAL', score: 0, details: '无MACD背离信号' };
  }
};
