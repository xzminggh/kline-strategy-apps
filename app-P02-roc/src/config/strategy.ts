import { StrategyResult } from '../types';
import { calculateROC, calculateVolumeMA } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'P02',
  name: 'ROC+放量确认',
  description: 'ROC为正且成交量放大时买入，ROC为负且放量时卖出',
  icon: 'trending-up',
  color: '#a855f7',
  execute: (klineData) => {
    if (klineData.length < 15) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const volumes = klineData.map((k: any) => k.volume);
    const roc = calculateROC(closes, 10);
    const volMA = calculateVolumeMA(volumes, 10);
    const n = closes.length - 1;
    if (roc[n] === null || volMA[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const volRatio = volMA[n]! > 0 ? volumes[n] / volMA[n]! : 1;
    const rocVal = roc[n]!;
    if (rocVal > 0 && volRatio > 1.5) return { signal: 'BUY', score: 7, details: 'ROC=' + rocVal.toFixed(2) + '%，放量上涨' };
    if (rocVal < 0 && volRatio > 1.5) return { signal: 'SELL', score: -7, details: 'ROC=' + rocVal.toFixed(2) + '%，放量下跌' };
    if (rocVal > 0) return { signal: 'NEUTRAL', score: 2, details: 'ROC=' + rocVal.toFixed(2) + '%，缩量上涨' };
    if (rocVal < 0) return { signal: 'NEUTRAL', score: -2, details: 'ROC=' + rocVal.toFixed(2) + '%，缩量下跌' };
    return { signal: 'NEUTRAL', score: 0, details: 'ROC=' + rocVal.toFixed(2) + '%，横盘整理' };
  }
};
