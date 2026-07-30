import { StrategyResult } from '../types';


export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'P04',
  name: '大阴线/大阳线反包',
  description: '当日实体完全吞没前日实体时产生反转信号',
  icon: 'trending-up',
  color: '#ec4899',
  execute: (klineData) => {
    if (klineData.length < 5) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const n = klineData.length - 1;
    const today = klineData[n];
    const yesterday = klineData[n - 1];
    const tBody = Math.abs(today.close - today.open);
    const yBody = Math.abs(yesterday.close - yesterday.open);
    const tBull = today.close > today.open;
    const yBull = yesterday.close > yesterday.open;
    const engulfBull = tBull && !yBull && today.open <= yesterday.close && today.close >= yesterday.open && tBody > yBody * 1.2;
    const engulfBear = !tBull && yBull && today.open >= yesterday.close && today.close <= yesterday.open && tBody > yBody * 1.2;
    if (engulfBull) return { signal: 'BUY', score: 7, details: '阳包阴反包，多头反转信号' };
    if (engulfBear) return { signal: 'SELL', score: -7, details: '阴包阳反包，空头反转信号' };
    if (tBody > yBody * 2 && tBull) return { signal: 'NEUTRAL', score: 3, details: '大阳线（实体' + (tBody / yBody).toFixed(1) + '倍），关注后续' };
    if (tBody > yBody * 2 && !tBull) return { signal: 'NEUTRAL', score: -3, details: '大阴线（实体' + (tBody / yBody).toFixed(1) + '倍），关注后续' };
    return { signal: 'NEUTRAL', score: 0, details: '无反包信号' };
  }
};
