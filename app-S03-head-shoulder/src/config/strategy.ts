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
  id: 'S03',
  name: '头肩底/顶颈线突破',
  description: '头肩底形态突破颈线买入，头肩顶形态跌破颈线卖出',
  icon: 'trending-up',
  color: '#0891b2',
  execute: (klineData) => {
    if (klineData.length < 40) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const lows = klineData.map((k: any) => k.low);
    const highs = klineData.map((k: any) => k.high);
    const closes = klineData.map((k: any) => k.close);
    const lowExtrema = findLocalExtrema(lows, 5);
    const highExtrema = findLocalExtrema(highs, 5);
    const n = closes.length - 1;
    if (lowExtrema.lows.length >= 3) {
      const last3 = lowExtrema.lows.slice(-3).map(l => l.val);
      const head = Math.min(...last3);
      const shoulders = last3.filter(v => v > head);
      if (shoulders.length === 2 && Math.abs(shoulders[0] - shoulders[1]) / head < 0.05) {
        const neckline = Math.max(...klineData.slice(-20).map((k: any) => k.high));
        if (closes[n] > neckline) return { signal: 'BUY', score: 7, details: '头肩底突破颈线' + neckline.toFixed(2) };
      }
    }
    if (highExtrema.highs.length >= 3) {
      const last3 = highExtrema.highs.slice(-3).map(h => h.val);
      const head = Math.max(...last3);
      const shoulders = last3.filter(v => v < head);
      if (shoulders.length === 2 && Math.abs(shoulders[0] - shoulders[1]) / head < 0.05) {
        const neckline = Math.min(...klineData.slice(-20).map((k: any) => k.low));
        if (closes[n] < neckline) return { signal: 'SELL', score: -7, details: '头肩顶跌破颈线' + neckline.toFixed(2) };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成有效头肩形态' };
  }
};
