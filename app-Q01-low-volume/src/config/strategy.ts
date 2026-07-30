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
  id: 'Q01',
  name: '地量见底',
  description: '成交量萎缩至MA20的50%以下时关注底部信号',
  icon: 'trending-up',
  color: '#78716c',
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
    if (volRatio < 0.5 && rsiVal < 35) return { signal: 'BUY', score: 7, details: '地量+RSI=' + rsiVal.toFixed(1) + '，底部信号' };
    if (volRatio < 0.5) return { signal: 'NEUTRAL', score: 3, details: '地量（量比' + volRatio.toFixed(2) + '），关注RSI确认' };
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(2) + '，非地量' };
  }
};
