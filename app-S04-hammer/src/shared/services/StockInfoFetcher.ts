/**
 * StockInfoFetcher — 联网获取股票基本信息、市场走势概况、大盘指数
 *
 * 数据源：
 *  - 基本信息：腾讯财经 web.sqt.gtimg.cn（实时行情接口）
 *  - 近期K线：新浪财经 money.finance.sina.com.cn（日K线接口）
 *  - 大盘指数：腾讯财经 web.sqt.gtimg.cn（实时行情接口）
 *  - 走势概况：根据实时K线数据 + 技术指标计算
 *
 * 腾讯API字段（以~分隔）：
 *  [1]=名称, [2]=代码, [3]=现价, [31]=涨跌额, [32]=涨跌幅
 *  [44]=总市值(亿), [45]=流通市值(亿), [46]=PB, [39]=PE(动)
 *
 * Sina K线API返回格式：
 *  [{"day":"2026-07-30","open":"2.870","high":"2.960","low":"2.860","close":"2.920","volume":"123073164"}]
 */

import { calculateMA, calculateMACD, calculateRSI } from '../indicators/Indicators';

/** 股票基本信息 */
export interface StockBasicInfo {
  code: string;
  name: string;
  market: string;
  industry: string;
  listDate: string;
  totalShares: string;
  floatShares: string;
  totalAssets: string;
  revenue: string;
  profit: string;
  pe: string;
  pb: string;
  totalMV: string;
  circMV: string;
  currentPrice: number | null;
  priceChange: number;
  priceChangePct: number;
}

/** 大盘指数 */
export interface MarketIndex {
  code: string;
  name: string;
  current: number;
  change: number;
  changePct: number;
}

/** 市场走势概况（重构版） */
export interface MarketOverview {
  indices: MarketIndex[];
  marketTrend: 'bullish' | 'bearish' | 'neutral';
  marketSummary: string;
  stockTrend: 'bullish' | 'bearish' | 'neutral';
  stockSummary: string;
  keyPoints: string[];
  dataSource: 'realtime' | 'database';
  dataDate: string;
  riskWarning: string;
}

/** 数字格式化 */
const fmtNum = (v: unknown): string => {
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  if (!Number.isFinite(n) || n === 0) return '—';
  if (Math.abs(n) >= 1e8) return (n / 1e8).toFixed(2) + '亿';
  if (Math.abs(n) >= 1e4) return (n / 1e4).toFixed(2) + '万';
  return n.toFixed(2);
};

/** 腾讯API股票代码前缀 */
const getTencentSymbol = (code: string): string => {
  const c = code.trim();
  if (/^(60|68)/.test(c)) return `sh${c}`;
  if (/^(43|83|87|92)/.test(c)) return `bj${c}`;
  return `sz${c}`;
};

/** 带超时的fetch */
const fetchWithTimeout = async (url: string, timeoutMs = 8000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://web.sqt.gtimg.cn/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
};

/** 带超时的fetch（JSON解析） */
const fetchJsonWithTimeout = async (url: string, timeoutMs = 8000): Promise<any> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': '*/*',
        'Referer': 'https://finance.sina.com.cn/',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
};

/** 获取股票实时行情（腾讯API） */
export const fetchStockBasicInfo = async (code: string, name: string): Promise<StockBasicInfo> => {
  try {
    const symbol = getTencentSymbol(code);
    const url = `https://web.sqt.gtimg.cn/q=${symbol}`;
    const text = await fetchWithTimeout(url);

    const match = text.match(/"(.+)"/);
    if (!match) return fallbackInfo(code, name);

    const fields = match[1].split('~');
    if (fields.length < 50) return fallbackInfo(code, name);

    const getVal = (idx: number): string => {
      const v = fields[idx];
      return v && v !== '' ? v : '—';
    };

    return {
      code: code.trim(),
      name: fields[1] || name,
      market: code.startsWith('6') ? '上交所' : '深交所',
      industry: '—',
      listDate: '—',
      totalShares: fmtNum(parseFloat(getVal(72))),
      floatShares: fmtNum(parseFloat(getVal(73))),
      totalAssets: '—',
      revenue: '—',
      profit: '—',
      pe: getVal(39),
      pb: getVal(46),
      totalMV: fmtNum(parseFloat(getVal(44))),
      circMV: fmtNum(parseFloat(getVal(45))),
      currentPrice: parseFloat(fields[3]) || null,
      priceChange: parseFloat(fields[31]) || 0,
      priceChangePct: parseFloat(fields[32]) || 0,
    };
  } catch (error) {
    console.log('[StockInfoFetcher] fetchStockBasicInfo failed:', error);
    return fallbackInfo(code, name);
  }
};

const fallbackInfo = (code: string, name: string): StockBasicInfo => ({
  code: code.trim(),
  name,
  market: code.startsWith('6') ? '上交所' : '深交所',
  industry: '—',
  listDate: '—',
  totalShares: '—',
  floatShares: '—',
  totalAssets: '—',
  revenue: '—',
  profit: '—',
  pe: '—',
  pb: '—',
  totalMV: '—',
  circMV: '—',
  currentPrice: null,
  priceChange: 0,
  priceChangePct: 0,
});

/** 获取近期K线数据（Sina API，最多返回最近20个交易日） */
export const fetchRecentKline = async (code: string, datalen: number = 20): Promise<{
  data: Array<{ date: string; open: number; high: number; low: number; close: number; volume: number }>;
  dataSource: 'realtime' | 'database';
  dataDate: string;
}> => {
  try {
    const prefix = code.startsWith('6') ? 'sh' : 'sz';
    const symbol = `${prefix}${code}`;
    const url = `https://money.finance.sina.com.cn/quotes_service/api/json_v2.php/CN_MarketData.getKLineData?symbol=${symbol}&scale=240&ma=5&datalen=${datalen}`;
    
    const result = await fetchJsonWithTimeout(url);
    
    if (!Array.isArray(result) || result.length === 0) {
      return { data: [], dataSource: 'database', dataDate: '' };
    }

    const data = result.map((item: any) => ({
      date: item.day,
      open: parseFloat(item.open) || 0,
      high: parseFloat(item.high) || 0,
      low: parseFloat(item.low) || 0,
      close: parseFloat(item.close) || 0,
      volume: parseFloat(item.volume) || 0,
    }));

    return {
      data,
      dataSource: 'realtime',
      dataDate: data[data.length - 1]?.date || '',
    };
  } catch (error) {
    console.log('[StockInfoFetcher] fetchRecentKline failed:', error);
    return { data: [], dataSource: 'database', dataDate: '' };
  }
};

/** 获取大盘指数（上证/深证/创业板） */
export const fetchMarketIndices = async (): Promise<MarketIndex[]> => {
  try {
    const url = 'https://web.sqt.gtimg.cn/q=sh000001,sz399001,sz399006';
    const text = await fetchWithTimeout(url);
    
    const indices: MarketIndex[] = [];
    
    // 解析上证指数
    const shMatch = text.match(/v_sh000001="(.+?)"/);
    if (shMatch) {
      const fields = shMatch[1].split('~');
      indices.push({
        code: '000001',
        name: '上证指数',
        current: parseFloat(fields[3]) || 0,
        change: parseFloat(fields[31]) || 0,
        changePct: parseFloat(fields[32]) || 0,
      });
    }

    // 解析深证成指
    const szMatch = text.match(/v_sz399001="(.+?)"/);
    if (szMatch) {
      const fields = szMatch[1].split('~');
      indices.push({
        code: '399001',
        name: '深证成指',
        current: parseFloat(fields[3]) || 0,
        change: parseFloat(fields[31]) || 0,
        changePct: parseFloat(fields[32]) || 0,
      });
    }

    // 解析创业板指
    const cyMatch = text.match(/v_sz399006="(.+?)"/);
    if (cyMatch) {
      const fields = cyMatch[1].split('~');
      indices.push({
        code: '399006',
        name: '创业板指',
        current: parseFloat(fields[3]) || 0,
        change: parseFloat(fields[31]) || 0,
        changePct: parseFloat(fields[32]) || 0,
      });
    }

    return indices;
  } catch (error) {
    console.log('[StockInfoFetcher] fetchMarketIndices failed:', error);
    return [];
  }
};

/** 获取市场走势概况（重构版：大盘+个股） */
export const fetchMarketOverview = async (
  code: string,
  klineData: any[],
): Promise<MarketOverview> => {
  // 获取大盘指数
  const indices = await fetchMarketIndices();
  
  // 判断大盘整体趋势
  let marketTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (indices.length > 0) {
    const avgChangePct = indices.reduce((sum, idx) => sum + idx.changePct, 0) / indices.length;
    if (avgChangePct > 0.5) marketTrend = 'bullish';
    else if (avgChangePct < -0.5) marketTrend = 'bearish';
  }

  const marketTrendText = marketTrend === 'bullish' ? '偏强' : marketTrend === 'bearish' ? '偏弱' : '震荡';
  const marketSummary = indices.length > 0
    ? indices.map(idx => `${idx.name} ${idx.current.toFixed(2)} ${idx.changePct >= 0 ? '+' : ''}${idx.changePct.toFixed(2)}%`).join('  ')
    : '暂无大盘数据';

  // 获取实时K线数据（优先）
  const recentKline = await fetchRecentKline(code, 30);
  let useData: any[];
  let dataSource: 'realtime' | 'database';
  let dataDate: string;

  if (recentKline.data.length >= 20) {
    // 使用实时数据（Sina API返回从旧到新排序）
    useData = recentKline.data;
    dataSource = 'realtime';
    dataDate = recentKline.dataDate;
  } else if (klineData && klineData.length >= 26) {
    // 降级使用数据库数据（需要反转为从旧到新）
    useData = [...klineData].reverse();
    dataSource = 'database';
    dataDate = klineData[0]?.date || '';
  } else {
    return {
      indices,
      marketTrend,
      marketSummary,
      stockTrend: 'neutral',
      stockSummary: 'K线数据不足，无法判断走势',
      keyPoints: [],
      dataSource: 'database',
      dataDate: '',
      riskWarning: '投资有风险，入市需谨慎',
    };
  }

  const closes = useData.map((k: any) => k.close);
  const volumes = useData.map((k: any) => k.volume);
  const len = closes.length;
  const latest = closes[len - 1];
  const prev = closes[len - 2];

  // 涨跌幅
  const changePct = prev > 0 ? ((latest - prev) / prev * 100) : 0;

  // 均线系统
  const ma5 = calculateMA(closes, 5);
  const ma10 = calculateMA(closes, 10);
  const ma20 = calculateMA(closes, 20);
  const latestMA5 = ma5[len - 1];
  const latestMA10 = ma10[len - 1];
  const latestMA20 = ma20[len - 1];

  // MACD
  const macdResult = calculateMACD(closes);
  const latestMACD = macdResult.macd[len - 1];
  const latestSignal = macdResult.signal[len - 1];
  const latestHistogram = macdResult.histogram[len - 1];
  const prevHistogram = macdResult.histogram[len - 2];

  // RSI
  const rsi = calculateRSI(closes, 14);
  const latestRSI = rsi[len - 1];

  // 成交量趋势
  const volRecent5 = volumes.slice(-5).reduce((a: number, b: number) => a + b, 0) / 5;
  const volPrev5 = volumes.slice(-10, -5).reduce((a: number, b: number) => a + b, 0) / 5;
  const volTrend = volPrev5 > 0 ? (volRecent5 / volPrev5) : 1;

  const keyPoints: string[] = [];
  let bullishCount = 0;
  let bearishCount = 0;

  // 1. 均线排列判断（新增粘合检测）
  const maSpread = latestMA20 > 0 ? Math.abs(latestMA5 - latestMA20) / latestMA20 * 100 : 0;
  
  if (maSpread < 2) {
    keyPoints.push(`均线粘合（MA5与MA20价差${maSpread.toFixed(1)}%），方向待确认`);
  } else if (latest > latestMA5 && latestMA5 > latestMA10 && latestMA10 > latestMA20) {
    bullishCount += 2;
    keyPoints.push('均线多头排列（价格>MA5>MA10>MA20）');
  } else if (latest < latestMA5 && latestMA5 < latestMA10 && latestMA10 < latestMA20) {
    bearishCount += 2;
    keyPoints.push('均线空头排列（价格<MA5<MA10<MA20）');
  } else if (latest > latestMA5 && latestMA5 > latestMA10) {
    bullishCount += 1;
    keyPoints.push('短期均线多头（价格>MA5>MA10）');
  } else if (latest < latestMA5 && latestMA5 < latestMA10) {
    bearishCount += 1;
    keyPoints.push('短期均线空头（价格<MA5<MA10）');
  } else {
    keyPoints.push('均线交织，方向不明');
  }

  // 2. MACD判断
  if (latestMACD > latestSignal && latestHistogram > 0 && prevHistogram <= 0) {
    bullishCount += 2;
    keyPoints.push('MACD金叉，看多信号');
  } else if (latestMACD < latestSignal && latestHistogram < 0 && prevHistogram >= 0) {
    bearishCount += 2;
    keyPoints.push('MACD死叉，看空信号');
  } else if (latestHistogram > 0 && latestHistogram > prevHistogram) {
    bullishCount += 1;
    keyPoints.push('MACD红柱放大，多头增强');
  } else if (latestHistogram < 0 && latestHistogram < prevHistogram) {
    bearishCount += 1;
    keyPoints.push('MACD绿柱放大，空头增强');
  }

  // 3. RSI判断
  if (latestRSI > 70) {
    bearishCount += 1;
    keyPoints.push(`RSI=${latestRSI.toFixed(1)}，超买区域，注意回调`);
  } else if (latestRSI < 30) {
    bullishCount += 1;
    keyPoints.push(`RSI=${latestRSI.toFixed(1)}，超卖区域，可能反弹`);
  } else if (latestRSI > 50) {
    bullishCount += 1;
    keyPoints.push(`RSI=${latestRSI.toFixed(1)}，多方占优`);
  } else {
    bearishCount += 1;
    keyPoints.push(`RSI=${latestRSI.toFixed(1)}，空方占优`);
  }

  // 4. 量价配合
  if (volTrend > 1.5 && changePct > 0) {
    bullishCount += 1;
    keyPoints.push('放量上涨，量价配合良好');
  } else if (volTrend > 1.5 && changePct < 0) {
    bearishCount += 1;
    keyPoints.push('放量下跌，恐慌抛售');
  } else if (volTrend < 0.6) {
    keyPoints.push('缩量整理，观望为主');
  }

  // 5. 近期涨跌（使用实时数据）
  if (len >= 6) {
    const recent5Change = ((latest - closes[len - 6]) / closes[len - 6] * 100);
    if (Math.abs(recent5Change) > 10) {
      keyPoints.push(`近5日涨跌${recent5Change > 0 ? '+' : ''}${recent5Change.toFixed(2)}%，波动剧烈`);
    } else if (Math.abs(recent5Change) > 5) {
      keyPoints.push(`近5日涨跌${recent5Change > 0 ? '+' : ''}${recent5Change.toFixed(2)}%，波动较大`);
    } else if (Math.abs(recent5Change) > 0) {
      keyPoints.push(`近5日涨跌${recent5Change > 0 ? '+' : ''}${recent5Change.toFixed(2)}%`);
    }
  }

  // 综合判断
  let stockTrend: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  if (bullishCount >= bearishCount + 2) {
    stockTrend = 'bullish';
  } else if (bearishCount >= bullishCount + 2) {
    stockTrend = 'bearish';
  }

  const stockTrendText = stockTrend === 'bullish' ? '偏多' : stockTrend === 'bearish' ? '偏空' : '中性';
  const stockSummary = `当前价${latest.toFixed(2)}，MACD柱${latestHistogram > 0 ? '红' : '绿'}，RSI=${latestRSI.toFixed(1)}，走势${stockTrendText}`;

  return {
    indices,
    marketTrend,
    marketSummary,
    stockTrend,
    stockSummary,
    keyPoints,
    dataSource,
    dataDate,
    riskWarning: '以上分析基于历史数据，仅供参考，不构成投资建议',
  };
};
