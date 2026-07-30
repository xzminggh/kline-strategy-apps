import { StrategyResult } from '../types';
import { calculateMA, calculateMACD, calculateRSI } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'M03',
  name: '三重过滤',
  description: 'MA趋势+MACD动量+RSI过滤三重确认信号',
  icon: 'trending-up',
  color: '#14b8a6',
  execute: (klineData) => {
    if (klineData.length < 35) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const n = closes.length - 1;
    const ma20 = calculateMA(closes, 20);
    const macd = calculateMACD(closes);
    const rsi = calculateRSI(closes, 14);
    if ([ma20[n], macd.histogram[n], rsi[n]].some(v => v === null || v === undefined)) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const priceAboveMA = closes[n] > ma20[n]!;
    const macdPositive = macd.histogram[n]! > 0;
    const rsiOk = rsi[n]! > 40 && rsi[n]! < 70;
    const rsiLow = rsi[n]! < 30;
    let score = 0;
    const reasons: string[] = [];
    if (priceAboveMA) { score += 3; reasons.push('价格在MA20上方'); }
    else { score -= 3; reasons.push('价格在MA20下方'); }
    if (macdPositive) { score += 3; reasons.push('MACD红柱'); }
    else { score -= 3; reasons.push('MACD绿柱'); }
    if (rsiLow) { score += 2; reasons.push('RSI超卖'); }
    else if (rsiOk) { score += 1; reasons.push('RSI适中'); }
    else { score -= 2; reasons.push('RSI超买'); }
    if (score >= 5) return { signal: 'BUY', score: 8, details: '三重过滤看多：' + reasons.join('，') };
    if (score <= -5) return { signal: 'SELL', score: -8, details: '三重过滤看空：' + reasons.join('，') };
    return { signal: 'NEUTRAL', score, details: '三重过滤中性：' + reasons.join('，') };
  }
};
