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
  id: 'S01',
  name: '双底/双顶颈线突破',
  description: 'W底形态突破颈线买入，M顶形态跌破颈线卖出',
  icon: 'trending-up',
  color: '#0ea5e9',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const lows = klineData.map((k: any) => k.low);
    const highs = klineData.map((k: any) => k.high);
    const closes = klineData.map((k: any) => k.close);
    const extrema = findLocalExtrema(lows, 5);
    const highExtrema = findLocalExtrema(highs, 5);
    const n = closes.length - 1;
    if (extrema.lows.length < 2) return { signal: 'NEUTRAL', score: 0, details: '未识别到足够低点' };
    const lastTwoLows = extrema.lows.slice(-2);
    const lowDiff = Math.abs(lastTwoLows[0] - lastTwoLows[1]) / lastTwoLows[0];
    if (lowDiff < 0.05) {
      const neckline = Math.max(...klineData.slice(-15).map((k: any) => k.high));
      if (closes[n] > neckline) return { signal: 'BUY', score: 7, details: '双底突破颈线' + neckline.toFixed(2) };
    }
    if (highExtrema.highs.length >= 2) {
      const lastTwoHighs = highExtrema.highs.slice(-2);
      const highDiff = Math.abs(lastTwoHighs[0] - lastTwoHighs[1]) / lastTwoHighs[0];
      if (highDiff < 0.05) {
        const neckline = Math.min(...klineData.slice(-15).map((k: any) => k.low));
        if (closes[n] < neckline) return { signal: 'SELL', score: -7, details: '双顶跌破颈线' + neckline.toFixed(2) };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成有效双底/双顶' };
  }
};
