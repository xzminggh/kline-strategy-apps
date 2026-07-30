/**
 * generate-strategies.js — Generate all 26 strategy.ts files
 * Each strategy uses indicators from shared/indicators/Indicators.ts
 * T01 is the reference (already implemented), we generate the other 25
 */
const fs = require('fs');
const path = require('path');

const ROOT = 'F:\\opencode\\Single metric\\kline-strategy-apps';

// Strategy definitions: id, name, description, color, indicator imports, logic
const strategies = [
  // T — Trend Following
  {
    id: 'T01', dir: 'app-T01-double-ma', name: '双均线金叉/死叉',
    desc: '当短期EMA上穿长期EMA时买入，下穿时卖出',
    color: '#3b82f6', skip: true // Already implemented
  },
  {
    id: 'T02', dir: 'app-T02-ma60', name: '60日均线多空分界',
    desc: '收盘价站上60日均线买入，跌破60日均线卖出',
    color: '#10b981',
    imports: ['calculateMA'],
    logic: `if (klineData.length < 65) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma60 = calculateMA(closes, 60);
    const n = closes.length - 1;
    const prev = n - 1;
    if (ma60[n] === null || ma60[prev] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const crossUp = closes[n] > ma60[n]! && closes[prev] <= ma60[prev]!;
    const crossDown = closes[n] < ma60[n]! && closes[prev] >= ma60[prev]!;
    if (crossUp) return { signal: 'BUY', score: 8, details: '收盘价上穿60日均线' };
    if (crossDown) return { signal: 'SELL', score: -8, details: '收盘价下穿60日均线' };
    if (closes[n] > ma60[n]!) return { signal: 'NEUTRAL', score: 2, details: '收盘价在60日均线上方' };
    return { signal: 'NEUTRAL', score: -2, details: '收盘价在60日均线下方' };`
  },
  {
    id: 'T03', dir: 'app-T03-guppy', name: '顾比均线组穿越',
    desc: '短期均线组上穿长期均线组买入，下穿卖出',
    color: '#8b5cf6',
    imports: ['calculateGuppyMA'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const guppy = calculateGuppyMA(closes);
    const n = closes.length - 1;
    const prev = n - 1;
    const shortLatest = guppy.shortTerm[n];
    const longLatest = guppy.longTerm[n];
    const shortPrev = guppy.shortTerm[prev];
    const longPrev = guppy.longTerm[prev];
    if (shortLatest === null || longLatest === null || shortPrev === null || longPrev === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const crossUp = shortLatest > longLatest && shortPrev <= longPrev;
    const crossDown = shortLatest < longLatest && shortPrev >= longPrev;
    if (crossUp) return { signal: 'BUY', score: 8, details: '短期均线组上穿长期均线组' };
    if (crossDown) return { signal: 'SELL', score: -8, details: '短期均线组下穿长期均线组' };
    if (shortLatest > longLatest) return { signal: 'NEUTRAL', score: 2, details: '短期均线组在长期均线上方' };
    return { signal: 'NEUTRAL', score: -2, details: '短期均线组在长期均线下方' };`
  },
  {
    id: 'T04', dir: 'app-T04-three-line', name: '三线反向反转',
    desc: 'MA5/MA10/MA20从空头排列转为多头排列时买入，反之卖出',
    color: '#06b6d4',
    imports: ['calculateMA'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma5 = calculateMA(closes, 5);
    const ma10 = calculateMA(closes, 10);
    const ma20 = calculateMA(closes, 20);
    const n = closes.length - 1;
    const p = n - 1;
    if ([ma5[n], ma10[n], ma20[n], ma5[p], ma10[p], ma20[p]].some(v => v === null)) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const bullNow = ma5[n]! > ma10[n]! && ma10[n]! > ma20[n]!;
    const bearNow = ma5[n]! < ma10[n]! && ma10[n]! < ma20[n]!;
    const bullPrev = ma5[p]! > ma10[p]! && ma10[p]! > ma20[p]!;
    const bearPrev = ma5[p]! < ma10[p]! && ma10[p]! < ma20[p]!;
    if (bullNow && !bullPrev) return { signal: 'BUY', score: 8, details: '三线由空转多（MA5>MA10>MA20）' };
    if (bearNow && !bearPrev) return { signal: 'SELL', score: -8, details: '三线由多转空（MA5<MA10<MA20）' };
    if (bullNow) return { signal: 'NEUTRAL', score: 2, details: '三线多头排列' };
    if (bearNow) return { signal: 'NEUTRAL', score: -2, details: '三线空头排列' };
    return { signal: 'NEUTRAL', score: 0, details: '三线交织，方向不明' };`
  },

  // M — Mean Reversion
  {
    id: 'M01', dir: 'app-M01-bollinger', name: '布林带触轨反弹',
    desc: '价格触及布林带下轨时买入，触及上轨时卖出',
    color: '#ef4444',
    imports: ['calculateBollinger'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const boll = calculateBollinger(closes);
    const n = closes.length - 1;
    if (boll.lower[n] === null || boll.upper[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    if (closes[n] <= boll.lower[n]!) return { signal: 'BUY', score: 7, details: '价格触及布林带下轨，超卖反弹信号' };
    if (closes[n] >= boll.upper[n]!) return { signal: 'SELL', score: -7, details: '价格触及布林带上轨，超买回落信号' };
    const midDist = (closes[n] - boll.middle[n]!) / (boll.upper[n]! - boll.lower[n]! + 0.001);
    return { signal: 'NEUTRAL', score: 0, details: '价格在布林带中部（偏离' + (midDist * 100).toFixed(1) + '%）' };`
  },
  {
    id: 'M02', dir: 'app-M02-rsi', name: 'RSI超买超卖',
    desc: 'RSI低于30时买入（超卖），高于70时卖出（超买）',
    color: '#f59e0b',
    imports: ['calculateRSI'],
    logic: `if (klineData.length < 20) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const rsi = calculateRSI(closes, 14);
    const n = closes.length - 1;
    if (rsi[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const val = rsi[n]!;
    if (val < 30) return { signal: 'BUY', score: 7, details: 'RSI=' + val.toFixed(1) + '，超卖区域，可能反弹' };
    if (val > 70) return { signal: 'SELL', score: -7, details: 'RSI=' + val.toFixed(1) + '，超买区域，注意回调' };
    if (val < 40) return { signal: 'NEUTRAL', score: 2, details: 'RSI=' + val.toFixed(1) + '，偏弱' };
    if (val > 60) return { signal: 'NEUTRAL', score: -2, details: 'RSI=' + val.toFixed(1) + '，偏强' };
    return { signal: 'NEUTRAL', score: 0, details: 'RSI=' + val.toFixed(1) + '，中性区域' };`
  },
  {
    id: 'M03', dir: 'app-M03-triple', name: '三重过滤',
    desc: 'MA趋势+MACD动量+RSI过滤三重确认信号',
    color: '#14b8a6',
    imports: ['calculateMA', 'calculateMACD', 'calculateRSI'],
    logic: `if (klineData.length < 35) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score, details: '三重过滤中性：' + reasons.join('，') };`
  },
  {
    id: 'M04', dir: 'app-M04-gap', name: '缺口回补',
    desc: '出现向下跳空缺口后价格回补缺口时买入',
    color: '#64748b',
    imports: ['calculateMA'],
    logic: `if (klineData.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const n = klineData.length - 1;
    const today = klineData[n];
    const yesterday = klineData[n - 1];
    const gapDown = today.high < yesterday.low;
    const gapUp = today.low > yesterday.high;
    if (gapDown) {
      const gapSize = ((yesterday.low - today.high) / yesterday.close * 100).toFixed(2);
      return { signal: 'BUY', score: 6, details: '向下跳空缺口' + gapSize + '%，关注回补机会' };
    }
    if (gapUp) {
      const gapSize = ((today.low - yesterday.high) / yesterday.close * 100).toFixed(2);
      return { signal: 'SELL', score: -6, details: '向上跳空缺口' + gapSize + '%，注意回落风险' };
    }
    // Check if recent gap is being filled
    for (let i = n - 1; i >= Math.max(0, n - 5); i--) {
      const curr = klineData[i];
      const prev = klineData[i - 1];
      if (prev && curr.high < prev.low) {
        if (today.close > prev.low) {
          return { signal: 'BUY', score: 5, details: '近期向下缺口已回补，反弹信号' };
        }
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '无明显缺口信号' };`
  },

  // P — Momentum/Breakout
  {
    id: 'P01', dir: 'app-P01-mom', name: 'MOM动量穿零轴',
    desc: 'MOM指标从负转正时买入，从正转负时卖出',
    color: '#f97316',
    imports: ['calculateMOM'],
    logic: `if (klineData.length < 15) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: -2, details: 'MOM=' + mom[n]!.toFixed(2) + '，负动量' };`
  },
  {
    id: 'P02', dir: 'app-P02-roc', name: 'ROC+放量确认',
    desc: 'ROC为正且成交量放大时买入，ROC为负且放量时卖出',
    color: '#a855f7',
    imports: ['calculateROC', 'calculateVolumeMA'],
    logic: `if (klineData.length < 15) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: 0, details: 'ROC=' + rocVal.toFixed(2) + '%，横盘整理' };`
  },
  {
    id: 'P03', dir: 'app-P03-volume', name: '倍量突破前高',
    desc: '成交量大于MA20两倍且价格突破近期高点时买入',
    color: '#22c55e',
    imports: ['calculateVolumeMA', 'findLocalExtrema'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(1) + '，无突破信号' };`
  },
  {
    id: 'P04', dir: 'app-P04-engulfing', name: '大阴线/大阳线反包',
    desc: '当日实体完全吞没前日实体时产生反转信号',
    color: '#ec4899',
    imports: [],
    logic: `if (klineData.length < 5) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: 0, details: '无反包信号' };`
  },

  // S — Chart Patterns
  {
    id: 'S01', dir: 'app-S01-double-bottom', name: '双底/双顶颈线突破',
    desc: 'W底形态突破颈线买入，M顶形态跌破颈线卖出',
    color: '#0ea5e9',
    imports: ['findLocalExtrema'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const lows = klineData.map((k: any) => k.low);
    const highs = klineData.map((k: any) => k.high);
    const closes = klineData.map((k: any) => k.close);
    const extrema = findLocalExtrema(lows, 5);
    const highExtrema = findLocalExtrema(highs, 5);
    const n = closes.length - 1;
    if (extrema.lows.length < 2) return { signal: 'NEUTRAL', score: 0, details: '未识别到足够低点' };
    const lastTwoLows = extrema.lows.slice(-2);
    const lowDiff = Math.abs(lastTwoLows[0] - lastTwoLows[1]) / lastTwoLows[0];
    if (lowDiff < 0.05) {
      const neckline = Math.max(...klineData.slice(-15).map((k: any) => k.high));
      if (closes[n] > neckline) return { signal: 'BUY', score: 7, details: '双底突破颈线' + neckline.toFixed(2) };
    }
    if (highExtrema.highs.length >= 2) {
      const lastTwoHighs = highExtrema.highs.slice(-2);
      const highDiff = Math.abs(lastTwoHighs[0] - lastTwoHighs[1]) / lastTwoHighs[0];
      if (highDiff < 0.05) {
        const neckline = Math.min(...klineData.slice(-15).map((k: any) => k.low));
        if (closes[n] < neckline) return { signal: 'SELL', score: -7, details: '双顶跌破颈线' + neckline.toFixed(2) };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成有效双底/双顶' };`
  },
  {
    id: 'S02', dir: 'app-S02-triangle', name: '三角形整理末端突破',
    desc: '价格在三角形收敛末端向上或向下突破',
    color: '#6366f1',
    imports: ['findLocalExtrema', 'calculateSlope'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const n = closes.length - 1;
    const recent20 = klineData.slice(-20);
    const highPrices = recent20.map((k: any) => k.high);
    const lowPrices = recent20.map((k: any) => k.low);
    const highSlope = (highPrices[highPrices.length - 1] - highPrices[0]) / 20;
    const lowSlope = (lowPrices[lowPrices.length - 1] - lowPrices[0]) / 20;
    const converging = highSlope < 0 && lowSlope > 0;
    if (converging) {
      const range = (highPrices[0] - lowPrices[0]);
      const currentRange = (highPrices[highPrices.length - 1] - lowPrices[lowPrices.length - 1]);
      if (currentRange < range * 0.3) {
        if (closes[n] > highPrices[highPrices.length - 1]) return { signal: 'BUY', score: 7, details: '三角形向上突破' };
        if (closes[n] < lowPrices[lowPrices.length - 1]) return { signal: 'SELL', score: -7, details: '三角形向下突破' };
        return { signal: 'NEUTRAL', score: 0, details: '三角形收敛中，等待突破' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成三角形整理' };`
  },
  {
    id: 'S03', dir: 'app-S03-head-shoulder', name: '头肩底/顶颈线突破',
    desc: '头肩底形态突破颈线买入，头肩顶形态跌破颈线卖出',
    color: '#0891b2',
    imports: ['findLocalExtrema'],
    logic: `if (klineData.length < 40) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const lows = klineData.map((k: any) => k.low);
    const highs = klineData.map((k: any) => k.high);
    const closes = klineData.map((k: any) => k.close);
    const lowExtrema = findLocalExtrema(lows, 5);
    const highExtrema = findLocalExtrema(highs, 5);
    const n = closes.length - 1;
    if (lowExtrema.lows.length >= 3) {
      const last3 = lowExtrema.lows.slice(-3);
      const head = Math.min(...last3);
      const shoulders = last3.filter(v => v > head);
      if (shoulders.length === 2 && Math.abs(shoulders[0] - shoulders[1]) / head < 0.05) {
        const neckline = Math.max(...klineData.slice(-20).map((k: any) => k.high));
        if (closes[n] > neckline) return { signal: 'BUY', score: 7, details: '头肩底突破颈线' + neckline.toFixed(2) };
      }
    }
    if (highExtrema.highs.length >= 3) {
      const last3 = highExtrema.highs.slice(-3);
      const head = Math.max(...last3);
      const shoulders = last3.filter(v => v < head);
      if (shoulders.length === 2 && Math.abs(shoulders[0] - shoulders[1]) / head < 0.05) {
        const neckline = Math.min(...klineData.slice(-20).map((k: any) => k.low));
        if (closes[n] < neckline) return { signal: 'SELL', score: -7, details: '头肩顶跌破颈线' + neckline.toFixed(2) };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未形成有效头肩形态' };`
  },
  {
    id: 'S04', dir: 'app-S04-hammer', name: '锤子线/流星线确认',
    desc: '锤子线（长下影小实体）出现后确认买入，流星线确认卖出',
    color: '#d946ef',
    imports: ['calculateRSI'],
    logic: `if (klineData.length < 5) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const n = klineData.length - 1;
    const k = klineData[n];
    const body = Math.abs(k.close - k.open);
    const upperShadow = k.high - Math.max(k.open, k.close);
    const lowerShadow = Math.min(k.open, k.close) - k.low;
    const totalRange = k.high - k.low;
    if (totalRange === 0) return { signal: 'NEUTRAL', score: 0, details: '无振幅' };
    const isHammer = lowerShadow > body * 2 && upperShadow < body * 0.5 && body / totalRange < 0.3;
    const isShooting = upperShadow > body * 2 && lowerShadow < body * 0.5 && body / totalRange < 0.3;
    if (isHammer) {
      const closes = klineData.map((kk: any) => kk.close);
      const rsi = calculateRSI(closes, 14);
      const rsiVal = rsi[n];
      if (rsiVal !== null && rsiVal! < 40) return { signal: 'BUY', score: 6, details: '锤子线+RSI=' + rsiVal!.toFixed(1) + '，底部反转信号' };
      return { signal: 'NEUTRAL', score: 3, details: '锤子线出现，需RSI确认' };
    }
    if (isShooting) {
      const closes = klineData.map((kk: any) => kk.close);
      const rsi = calculateRSI(closes, 14);
      const rsiVal = rsi[n];
      if (rsiVal !== null && rsiVal! > 60) return { signal: 'SELL', score: -6, details: '流星线+RSI=' + rsiVal!.toFixed(1) + '，顶部反转信号' };
      return { signal: 'NEUTRAL', score: -3, details: '流星线出现，需RSI确认' };
    }
    return { signal: 'NEUTRAL', score: 0, details: '无锤子线/流星线信号' };`
  },

  // K — Key Price Levels
  {
    id: 'K01', dir: 'app-K01-ma-support', name: '均线支撑/压力回踩',
    desc: '价格回踩MA20获得支撑买入，回踩MA20受阻卖出',
    color: '#7c3aed',
    imports: ['calculateMA'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const ma20 = calculateMA(closes, 20);
    const n = closes.length - 1;
    const p = n - 1;
    if (ma20[n] === null || ma20[p] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const dist = Math.abs(closes[n] - ma20[n]!) / ma20[n]! * 100;
    const wasAbove = closes[p] > ma20[p]!;
    const nowAbove = closes[n] > ma20[n]!;
    const touched = dist < 2;
    if (wasAbove && touched && nowAbove) return { signal: 'BUY', score: 6, details: '回踩MA20获支撑（距离' + dist.toFixed(1) + '%）' };
    if (!wasAbove && touched && !nowAbove) return { signal: 'SELL', score: -6, details: '回踩MA20受阻（距离' + dist.toFixed(1) + '%）' };
    if (closes[n] > ma20[n]!) return { signal: 'NEUTRAL', score: 1, details: '价格在MA20上方（距离' + dist.toFixed(1) + '%）' };
    return { signal: 'NEUTRAL', score: -1, details: '价格在MA20下方（距离' + dist.toFixed(1) + '%）' };`
  },
  {
    id: 'K02', dir: 'app-K02-prev-highlow', name: '前高变支撑/前低变阻力',
    desc: '价格突破前高后回踩获得支撑买入，跌破前低后反弹受阻卖出',
    color: '#2563eb',
    imports: ['findLocalExtrema'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const extrema = findLocalExtrema(closes, 5);
    const n = closes.length - 1;
    if (extrema.highs.length < 1 || extrema.lows.length < 1) return { signal: 'NEUTRAL', score: 0, details: '未识别到关键价位' };
    const prevHigh = extrema.highs[extrema.highs.length - 1];
    const prevLow = extrema.lows[extrema.lows.length - 1];
    const distHigh = Math.abs(closes[n] - prevHigh) / prevHigh * 100;
    const distLow = Math.abs(closes[n] - prevLow) / prevLow * 100;
    if (closes[n] > prevHigh && distHigh < 3) return { signal: 'BUY', score: 6, details: '突破前高' + prevHigh.toFixed(2) + '，确认支撑' };
    if (closes[n] < prevLow && distLow < 3) return { signal: 'SELL', score: -6, details: '跌破前低' + prevLow.toFixed(2) + '，确认阻力' };
    return { signal: 'NEUTRAL', score: 0, details: '前高' + prevHigh.toFixed(2) + '，前低' + prevLow.toFixed(2) };`
  },
  {
    id: 'K03', dir: 'app-K03-fibonacci', name: '斐波那契回撤共振',
    desc: '价格回撤至斐波那契关键位（38.2%/50%/61.8%）获得支撑或阻力',
    color: '#d97706',
    imports: ['calculateFibonacciLevels', 'calculateRSI'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const n = closes.length - 1;
    const recentHigh = Math.max(...highs.slice(-60));
    const recentLow = Math.min(...lows.slice(-60));
    const fibs = calculateFibonacciLevels(recentHigh, recentLow);
    const rsi = calculateRSI(closes, 14);
    const rsiVal = rsi[n];
    const keyLevels = [fibs.level382, fibs.level500, fibs.level618];
    const levelNames = ['38.2%', '50%', '61.8%'];
    for (let i = 0; i < keyLevels.length; i++) {
      const dist = Math.abs(closes[n] - keyLevels[i]) / keyLevels[i] * 100;
      if (dist < 2) {
        const isSupport = closes[n] > keyLevels[i];
        if (isSupport && rsiVal !== null && rsiVal! < 50) return { signal: 'BUY', score: 6, details: '回撤至Fib ' + levelNames[i] + '获支撑（RSI=' + rsiVal!.toFixed(1) + '）' };
        if (!isSupport && rsiVal !== null && rsiVal! > 50) return { signal: 'SELL', score: -6, details: '反弹至Fib ' + levelNames[i] + '受阻（RSI=' + rsiVal!.toFixed(1) + '）' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '未触及Fib关键位' };`
  },

  // V — Volatility
  {
    id: 'V01', dir: 'app-V01-boll-squeeze', name: '布林带收口突破',
    desc: '布林带宽度收窄至极值后价格突破时产生信号',
    color: '#d946ef',
    imports: ['calculateBollinger', 'calculateBollingerWidth'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const boll = calculateBollinger(closes);
    const width = calculateBollingerWidth(boll.upper, boll.lower, boll.middle);
    const n = closes.length - 1;
    if (width[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const recentWidth = width.slice(-20).filter((w): w is number => w !== null);
    if (recentWidth.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const avgWidth = recentWidth.reduce((a, b) => a + b, 0) / recentWidth.length;
    const currentWidth = width[n]!;
    const isSqueeze = currentWidth < avgWidth * 0.5;
    if (isSqueeze && closes[n] > boll.upper[n]!) return { signal: 'BUY', score: 7, details: '布林带收口后向上突破' };
    if (isSqueeze && closes[n] < boll.lower[n]!) return { signal: 'SELL', score: -7, details: '布林带收口后向下突破' };
    if (isSqueeze) return { signal: 'NEUTRAL', score: 0, details: '布林带收口，等待突破' };
    return { signal: 'NEUTRAL', score: 0, details: '布林带宽度正常' };`
  },
  {
    id: 'V02', dir: 'app-V02-atr', name: 'ATR窄幅后方向选择',
    desc: 'ATR收窄至极低值后价格产生方向性突破',
    color: '#f43f5e',
    imports: ['calculateATR'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const atr = calculateATR(highs, lows, closes, 14);
    const n = closes.length - 1;
    if (atr[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const recentATR = atr.slice(-20).filter((a): a is number => a !== null);
    if (recentATR.length < 10) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const avgATR = recentATR.reduce((a, b) => a + b, 0) / recentATR.length;
    const currentATR = atr[n]!;
    const isNarrow = currentATR < avgATR * 0.6;
    const prevClose = closes[n - 1];
    const breakout = closes[n] - prevClose;
    if (isNarrow && breakout > currentATR * 0.5) return { signal: 'BUY', score: 7, details: 'ATR窄幅后向上突破' };
    if (isNarrow && breakout < -currentATR * 0.5) return { signal: 'SELL', score: -7, details: 'ATR窄幅后向下突破' };
    if (isNarrow) return { signal: 'NEUTRAL', score: 0, details: 'ATR收窄，等待方向选择' };
    return { signal: 'NEUTRAL', score: 0, details: 'ATR正常波动' };`
  },

  // Q — Volume Extremes
  {
    id: 'Q01', dir: 'app-Q01-low-volume', name: '地量见底',
    desc: '成交量萎缩至MA20的50%以下时关注底部信号',
    color: '#78716c',
    imports: ['calculateVolumeMA', 'calculateRSI'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(2) + '，非地量' };`
  },
  {
    id: 'Q02', dir: 'app-Q02-high-volume', name: '天量逃顶',
    desc: '成交量放大至MA20的3倍以上时警惕顶部风险',
    color: '#dc2626',
    imports: ['calculateVolumeMA', 'calculateRSI'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
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
    return { signal: 'NEUTRAL', score: 0, details: '量比' + volRatio.toFixed(2) + '，非天量' };`
  },

  // D — Divergence
  {
    id: 'D01', dir: 'app-D01-macd-div', name: 'MACD底/顶背离',
    desc: '价格创新低但MACD不创新低时底背离买入，价格创新高但MACD不创新高时顶背离卖出',
    color: '#eab308',
    imports: ['calculateMACD', 'findLocalExtrema'],
    logic: `if (klineData.length < 40) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const macd = calculateMACD(closes);
    const priceExtrema = findLocalExtrema(closes, 5);
    const n = closes.length - 1;
    if (priceExtrema.lows.length < 2 || macd.histogram[n] === null) {
      return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    }
    const lastLows = priceExtrema.lows.slice(-2);
    const priceMakingLow = closes[n] <= lastLows[0] * 1.02;
    const macdIdx1 = closes.indexOf(lastLows[0]);
    const macdIdx2 = n;
    const macdLow1 = macdIdx1 >= 0 ? macd.histogram[Math.min(macdIdx1, macd.histogram.length - 1)] : null;
    const macdLow2 = macd.histogram[macdIdx2];
    if (priceMakingLow && macdLow1 !== null && macdLow2 !== null && macdLow2 > macdLow1) {
      return { signal: 'BUY', score: 7, details: 'MACD底背离（价格新低但MACD不新低）' };
    }
    const lastHighs = priceExtrema.highs.slice(-2);
    const priceMakingHigh = closes[n] >= lastHighs[0] * 0.98;
    const macdHighIdx = closes.indexOf(lastHighs[0]);
    const macdHigh1 = macdHighIdx >= 0 ? macd.histogram[Math.min(macdHighIdx, macd.histogram.length - 1)] : null;
    const macdHigh2 = macd.histogram[macdIdx2];
    if (priceMakingHigh && macdHigh1 !== null && macdHigh2 !== null && macdHigh2 < macdHigh1) {
      return { signal: 'SELL', score: -7, details: 'MACD顶背离（价格新高但MACD不新高）' };
    }
    return { signal: 'NEUTRAL', score: 0, details: '无MACD背离信号' };`
  },
  {
    id: 'D02', dir: 'app-D02-rsi-div', name: 'RSI隐性背离',
    desc: '价格创新高但RSI不创新高时隐性顶背离，价格创新低但RSI不创新低时隐性底背离',
    color: '#f97316',
    imports: ['calculateRSI', 'findLocalExtrema'],
    logic: `if (klineData.length < 30) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const rsi = calculateRSI(closes, 14);
    const n = closes.length - 1;
    if (rsi[n] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const priceExtrema = findLocalExtrema(closes, 5);
    if (priceExtrema.highs.length < 2 && priceExtrema.lows.length < 2) {
      return { signal: 'NEUTRAL', score: 0, details: '未识别到足够极值' };
    }
    if (priceExtrema.highs.length >= 2) {
      const lastHighs = priceExtrema.highs.slice(-2);
      const highIdx1 = closes.indexOf(lastHighs[0]);
      const rsiHigh1 = highIdx1 >= 0 ? rsi[Math.min(highIdx1, rsi.length - 1)] : null;
      const rsiHigh2 = rsi[n];
      if (closes[n] >= lastHighs[0] * 0.98 && rsiHigh1 !== null && rsiHigh2 !== null && rsiHigh2 < rsiHigh1) {
        return { signal: 'SELL', score: -6, details: 'RSI隐性顶背离（价格新高但RSI不新高）' };
      }
    }
    if (priceExtrema.lows.length >= 2) {
      const lastLows = priceExtrema.lows.slice(-2);
      const lowIdx1 = closes.indexOf(lastLows[0]);
      const rsiLow1 = lowIdx1 >= 0 ? rsi[Math.min(lowIdx1, rsi.length - 1)] : null;
      const rsiLow2 = rsi[n];
      if (closes[n] <= lastLows[0] * 1.02 && rsiLow1 !== null && rsiLow2 !== null && rsiLow2 > rsiLow1) {
        return { signal: 'BUY', score: 6, details: 'RSI隐性底背离（价格新低但RSI不新低）' };
      }
    }
    return { signal: 'NEUTRAL', score: 0, details: '无RSI背离信号' };`
  },
  {
    id: 'D03', dir: 'app-D03-cci', name: 'CCI极端拐点',
    desc: 'CCI从-100以下向上拐头买入，从+100以上向下拐头卖出',
    color: '#ea580c',
    imports: ['calculateCCI'],
    logic: `if (klineData.length < 25) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const closes = klineData.map((k: any) => k.close);
    const highs = klineData.map((k: any) => k.high);
    const lows = klineData.map((k: any) => k.low);
    const cci = calculateCCI(highs, lows, closes, 20);
    const n = closes.length - 1;
    const prev = n - 1;
    if (cci[n] === null || cci[prev] === null) return { signal: 'NEUTRAL', score: 0, details: '数据不足' };
    const val = cci[n]!;
    const prevVal = cci[prev]!;
    if (prevVal < -100 && val > -100) return { signal: 'BUY', score: 7, details: 'CCI从' + prevVal.toFixed(0) + '拐头向上至' + val.toFixed(0) };
    if (prevVal > 100 && val < 100) return { signal: 'SELL', score: -7, details: 'CCI从' + prevVal.toFixed(0) + '拐头向下至' + val.toFixed(0) };
    if (val < -100) return { signal: 'NEUTRAL', score: 3, details: 'CCI=' + val.toFixed(0) + '，超卖区域' };
    if (val > 100) return { signal: 'NEUTRAL', score: -3, details: 'CCI=' + val.toFixed(0) + '，超买区域' };
    return { signal: 'NEUTRAL', score: 0, details: 'CCI=' + val.toFixed(0) + '，中性区域' };`
  }
];

// Generate strategy.ts for each strategy
let generated = 0;
let skipped = 0;
let failed = 0;

for (const s of strategies) {
  if (s.skip) {
    console.log(`SKIP: ${s.id} (already implemented)`);
    skipped++;
    continue;
  }

  const strategyPath = path.join(ROOT, s.dir, 'src', 'config', 'strategy.ts');

  // Build import statement
  const importLine = s.imports && s.imports.length > 0
    ? `import { ${s.imports.join(', ')} } from '../shared/indicators';`
    : '';

  const content = `import { StrategyResult } from '../types';
${importLine}

export interface StrategyConfig {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  execute: (klineData: any[]) => StrategyResult;
}

export const STRATEGY_CONFIG: StrategyConfig = {
  id: '${s.id}',
  name: '${s.name}',
  description: '${s.desc}',
  icon: 'trending-up',
  color: '${s.color}',
  execute: (klineData) => {
    ${s.logic}
  }
};
`;

  try {
    fs.writeFileSync(strategyPath, content, 'utf8');
    console.log(`OK: ${s.id} - ${s.name}`);
    generated++;
  } catch (err) {
    console.log(`FAIL: ${s.id} - ${err.message}`);
    failed++;
  }
}

console.log(`\n=== Summary ===`);
console.log(`Generated: ${generated}`);
console.log(`Skipped (T01): ${skipped}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${strategies.length}`);
