import { StrategyResult } from '../types';
import { calculateVolumeMA, calculateRSI } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'Q02',
  name: '天量逃顶',
  description: '成交量放大至MA20的3倍以上时警惕顶部风险',
  icon: 'trending-up',
  color: '#dc2626',
  execute: (klineData) => {
    if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const volumes = klineData.map((k: any) => k.volume);
    const volMA = calculateVolumeMA(volumes, 20);
    const rsi = calculateRSI(closes, 14);
    const n = closes.length - 1;
    if (volMA[n] === null || rsi[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const volRatio = volMA[n]! > 0 ? volumes[n] / volMA[n]! : 1;
    const rsiVal = rsi[n]!;
    if (volRatio > 3 && rsiVal > 65) return { signal: 'SELL', score: -7, details: '天量+RSI=' + rsiVal.toFixed(1) + '，顶部风险' };
    if (volRatio > 3) return { signal: 'NEUTRAL', score: -3, details: '天量（量比' + volRatio.toFixed(2) + '），关注RSI确认' };
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(2) + '，非天量' };
  }
};
