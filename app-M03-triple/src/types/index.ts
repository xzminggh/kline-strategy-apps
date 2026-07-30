export type SignalType = 'BUY' | 'SELL' | 'NEUTRAL';

export interface StrategyResult {
  signal: SignalType;
  score: number;
  details: string;
}

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockAnalysis {
  code: string;
  name: string;
  signal: SignalType;
  score: number;
  details: string;
  klineData: KlineData[];
}
