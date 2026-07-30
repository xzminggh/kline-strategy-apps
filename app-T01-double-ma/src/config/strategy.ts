import { StrategyResult } from '../types';
import { calculateEMA } from '../shared/indicators';

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

// T01: 双均线金叉/死叉策略
// 当短期EMA上穿长期EMA时买入，下穿时卖出
export const STRATEGY_CONFIG: StrategyConfig = {
  id: 'T01',
  name: '双均线金叉/死叉',
  description: '当短期EMA上穿长期EMA时买入，下穿时卖出',
  icon: 'trending-up',
  color: '#3b82f6',
  execute: (klineData) => {
    if (!klineData || klineData.length < 20) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }

    // 提取收盘价
    const closes = klineData.map((k: any) => k.close);
    
    // 计算EMA5和EMA20
    const ema5 = calculateEMA(closes, 5);
    const ema20 = calculateEMA(closes, 20);
    
    // 获取最新值
    const n = closes.length - 1;
    const prevN = n - 1;
    
    // 检查数据有效性
    if (ema5[n] === null || ema20[n] === null || ema5[prevN] === null || ema20[prevN] === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    
    // 判断金叉/死叉
    const goldenCross = ema5[n]! > ema20[n]! && ema5[prevN]! <= ema20[prevN]! && closes[n] > ema5[n]!;
    const deathCross = ema5[n]! < ema20[n]! && ema5[prevN]! >= ema20[prevN]! && closes[n] < ema5[n]!;
    
    if (goldenCross) {
      return { 
        signal: 'BUY', 
        score: 8, 
        details: 'EMA5上穿EMA20金叉' 
      };
    }
    
    if (deathCross) {
      return { 
        signal: 'SELL', 
        score: -8, 
        details: 'EMA5下穿EMA20死叉' 
      };
    }
    
    return { 
      signal: 'NEUTRAL', 
      score: 0, 
      details: '无交叉信号' 
    };
  }
};
