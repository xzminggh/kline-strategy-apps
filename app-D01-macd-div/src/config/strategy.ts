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
    if (priceExtrema.lows.length < 2 || priceExtrema.highs.length < 2 || macd.histogram[n] === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    // 底背离：前一个低点 vs 最近一个低点，MACD走高
    const prevLow = priceExtrema.lows[priceExtrema.lows.length - 2];
    const currLow = priceExtrema.lows[priceExtrema.lows.length - 1];
    const macdLow1 = macd.histogram[prevLow.idx];
    const macdLow2 = macd.histogram[currLow.idx];
    if (closes[n] <= currLow.val * 1.02 && macdLow1 !== null && macdLow2 !== null && macdLow2 > macdLow1) {
      return { signal: 'BUY', score: 7, details: `MACD底背离（${prevLow.val.toFixed(2)}→${currLow.val.toFixed(2)} MACD ${macdLow1.toFixed(2)}→${macdLow2.toFixed(2)}）` };
    }
    // 顶背离：前一个高点 vs 最近一个高点，MACD走低
    const prevHigh = priceExtrema.highs[priceExtrema.highs.length - 2];
    const currHigh = priceExtrema.highs[priceExtrema.highs.length - 1];
    const macdHigh1 = macd.histogram[prevHigh.idx];
    const macdHigh2 = macd.histogram[currHigh.idx];
    if (closes[n] >= currHigh.val * 0.98 && macdHigh1 !== null && macdHigh2 !== null && macdHigh2 < macdHigh1) {
      return { signal: 'SELL', score: -7, details: `MACD顶背离（${prevHigh.val.toFixed(2)}→${currHigh.val.toFixed(2)} MACD ${macdHigh1.toFixed(2)}→${macdHigh2.toFixed(2)}）` };
    }
    return { signal: 'NEUTRAL', score: 0, details: '无MACD背离信号' };
  }
};
