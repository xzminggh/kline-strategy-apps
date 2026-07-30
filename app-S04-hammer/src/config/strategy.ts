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
  id: 'S04',
  name: '锤子线/流星线确认',
  description: '锤子线（长下影小实体）出现后确认买入，流星线确认卖出',
  icon: 'trending-up',
  color: '#d946ef',
  execute: (klineData) => {
    if (klineData.length < 5) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const n = klineData.length - 1;
    const k = klineData[n];
    const body = Math.abs(k.close - k.open);
    const upperShadow = k.high - Math.max(k.open, k.close);
    const lowerShadow = Math.min(k.open, k.close) - k.low;
    const totalRange = k.high - k.low;
    if (totalRange === 0) return { signal: 'NEUTRAL', score: 0, details: '无振幅' };
    const isHammer = lowerShadow > body * 2 && upperShadow < body * 0.5 && body / totalRange < 0.3;
    const isShooting = upperShadow > body * 2 && lowerShadow < body * 0.5 && body / totalRange < 0.3;
    if (isHammer) {
      const closes = klineData.map((kk: any) => kk.close);
      const rsi = calculateRSI(closes, 14);
      const rsiVal = rsi[n];
      if (rsiVal !== null && rsiVal! < 40) return { signal: 'BUY', score: 6, details: '锤子线+RSI=' + rsiVal!.toFixed(1) + '，底部反转信号' };
      return { signal: 'NEUTRAL', score: 3, details: '锤子线出现，需RSI确认' };
    }
    if (isShooting) {
      const closes = klineData.map((kk: any) => kk.close);
      const rsi = calculateRSI(closes, 14);
      const rsiVal = rsi[n];
      if (rsiVal !== null && rsiVal! > 60) return { signal: 'SELL', score: -6, details: '流星线+RSI=' + rsiVal!.toFixed(1) + '，顶部反转信号' };
      return { signal: 'NEUTRAL', score: -3, details: '流星线出现，需RSI确认' };
    }
    return { signal: 'NEUTRAL', score: 0, details: '无锤子线/流星线信号' };
  }
};
