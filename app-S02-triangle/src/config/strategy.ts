import { StrategyResult } from '../types';
import { findLocalExtrema, calculateSlope } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'S02',
  name: '三角形整理末端突破',
  description: '价格在三角形收敛末端向上或向下突破',
  icon: 'trending-up',
  color: '#6366f1',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const n = closes.length - 1;
    const recent20 = klineData.slice(-20);
    const highPrices = recent20.map((k: any) => k.high);
    const lowPrices = recent20.map((k: any) => k.low);
    const highSlope = (highPrices[highPrices.length - 1] - highPrices[0]) / 20;
    const lowSlope = (lowPrices[lowPrices.length - 1] - lowPrices[0]) / 20;
    const converging = highSlope < 0 && lowSlope > 0;
    if (converging) {
      const range = (highPrices[0] - lowPrices[0]);
      const currentRange = (highPrices[highPrices.length - 1] - lowPrices[lowPrices.length - 1]);
      if (currentRange < range * 0.3) {
        if (closes[n] > highPrices[highPrices.length - 1]) return { signal: 'BUY', score: 7, details: '三角形向上突破' };
        if (closes[n] < lowPrices[lowPrices.length - 1]) return { signal: 'SELL', score: -7, details: '三角形向下突破' };
        return { signal: 'NEUTRAL', score: 0, details: '三角形收敛中，等待突破' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成三角形整理' };
  }
};
