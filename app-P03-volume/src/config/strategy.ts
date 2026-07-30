import { StrategyResult } from '../types';
import { calculateVolumeMA, findLocalExtrema } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'P03',
  name: '倍量突破前高',
  description: '成交量大于MA20两倍且价格突破近期高点时买入',
  icon: 'trending-up',
  color: '#22c55e',
  execute: (klineData) => {
    if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const volumes = klineData.map((k: any) => k.volume);
    const highs = klineData.map((k: any) => k.high);
    const volMA = calculateVolumeMA(volumes, 20);
    const extrema = findLocalExtrema(highs, 10);
    const n = closes.length - 1;
    if (volMA[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const volRatio = volMA[n]! > 0 ? volumes[n] / volMA[n]! : 1;
    const recentHigh = extrema.highs.length > 0 ? Math.max(...extrema.highs.slice(-3)) : closes[n];
    if (volRatio > 2 && closes[n] > recentHigh) {
      return { signal: 'BUY', score: 8, details: '倍量突破前高（量比' + volRatio.toFixed(1) + '）' };
    }
    if (volRatio > 2 && closes[n] < recentHigh * 0.95) {
      return { signal: 'SELL', score: -6, details: '放量跌破支撑（量比' + volRatio.toFixed(1) + '）' };
    }
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(1) + '，无突破信号' };
  }
};
