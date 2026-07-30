import { StrategyResult } from '../types';
import { calculateFibonacciLevels, calculateRSI } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'K03',
  name: '斐波那契回撤共振',
  description: '价格回撤至斐波那契关键位（38.2%/50%/61.8%）获得支撑或阻力',
  icon: 'trending-up',
  color: '#d97706',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const n = closes.length - 1;
    const recentHigh = Math.max(...highs.slice(-60));
    const recentLow = Math.min(...lows.slice(-60));
    const fibs = calculateFibonacciLevels(recentHigh, recentLow);
    const rsi = calculateRSI(closes, 14);
    const rsiVal = rsi[n];
    const keyLevels = [fibs.level382, fibs.level50, fibs.level618];
    const levelNames = ['38.2%', '50%', '61.8%'];
    for (let i = 0; i < keyLevels.length; i++) {
      const dist = Math.abs(closes[n] - keyLevels[i]) / keyLevels[i] * 100;
      if (dist < 2) {
        const isSupport = closes[n] > keyLevels[i];
        if (isSupport && rsiVal !== null && rsiVal! < 50) return { signal: 'BUY', score: 6, details: '回撤至Fib ' + levelNames[i] + '获支撑（RSI=' + rsiVal!.toFixed(1) + '）' };
        if (!isSupport && rsiVal !== null && rsiVal! > 50) return { signal: 'SELL', score: -6, details: '反弹至Fib ' + levelNames[i] + '受阻（RSI=' + rsiVal!.toFixed(1) + '）' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未触及Fib关键位' };
  }
};
