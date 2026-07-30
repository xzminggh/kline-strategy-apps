import { StrategyResult } from '../types';
import { calculateMOM } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'P01',
  name: 'MOM动量穿零轴',
  description: 'MOM指标从负转正时买入，从正转负时卖出',
  icon: 'trending-up',
  color: '#f97316',
  execute: (klineData) => {
    if (klineData.length < 15) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const mom = calculateMOM(closes, 10);
    const n = closes.length - 1;
    const prev = n - 1;
    if (mom[n] === null || mom[prev] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const crossUp = mom[n]! > 0 && mom[prev]! <= 0;
    const crossDown = mom[n]! < 0 && mom[prev]! >= 0;
    if (crossUp) return { signal: 'BUY', score: 7, details: 'MOM上穿零轴，动量转正' };
    if (crossDown) return { signal: 'SELL', score: -7, details: 'MOM下穿零轴，动量转负' };
    if (mom[n]! > 0) return { signal: 'NEUTRAL', score: 2, details: 'MOM=' + mom[n]!.toFixed(2) + '，正动量' };
    return { signal: 'NEUTRAL', score: -2, details: 'MOM=' + mom[n]!.toFixed(2) + '，负动量' };
  }
};
