import { LiveCandle } from '../services/marketApi';

export interface IndicatorValues {
  rsi14: number;
  rsiSignal: 'OVERSOLD (BUY)' | 'BEARISH' | 'NEUTRAL' | 'BULLISH' | 'OVERBOUGHT (SELL)';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: 'BULLISH CROSS' | 'BEARISH CROSS' | 'NEUTRAL';
  };
  ema20: number;
  ema50: number;
  ema200: number;
  maTrend: 'STRONG BULLISH' | 'BULLISH' | 'NEUTRAL' | 'BEARISH' | 'STRONG BEARISH';
  bollinger: {
    upper: number;
    middle: number;
    lower: number;
    bandwidthPct: number;
    percentB: number;
    status: 'SQUEEZE' | 'EXPANSION' | 'NORMAL';
  };
  pivots: {
    r2: number;
    r1: number;
    pivot: number;
    s1: number;
    s2: number;
  };
  atr14: number;
  summary: {
    score: number; // -10 (Strong Sell) to +10 (Strong Buy)
    verdict: 'STRONG BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG SELL';
    oscillatorScore: number;
    maScore: number;
    bullishCount: number;
    neutralCount: number;
    bearishCount: number;
  };
  contrarianDivergence?: {
    type: 'BULLISH CONTRARIAN DIVERGENCE' | 'BEARISH CONTRARIAN DIVERGENCE' | 'NONE';
    description: string;
  };
}

/**
 * Calculate Exponential Moving Average
 */
export function calculateEMA(data: number[], period: number): number[] {
  if (data.length === 0) return [];
  const k = 2 / (period + 1);
  const emaArray: number[] = [data[0]];

  for (let i = 1; i < data.length; i++) {
    const val = data[i] * k + emaArray[i - 1] * (1 - k);
    emaArray.push(val);
  }
  return emaArray;
}

/**
 * Calculate Simple Moving Average
 */
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(data[i]);
    } else {
      const window = data.slice(i - period + 1, i + 1);
      const sum = window.reduce((acc, curr) => acc + curr, 0);
      sma.push(sum / period);
    }
  }
  return sma;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
export function calculateRSI(closes: number[], period: number = 14): number[] {
  if (closes.length < period + 1) {
    return closes.map(() => 50);
  }

  const rsi: number[] = [];
  let gains = 0;
  let losses = 0;

  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) gains += diff;
    else losses += Math.abs(diff);
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  for (let i = 0; i <= period; i++) {
    rsi.push(50);
  }

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff >= 0) {
      avgGain = (avgGain * (period - 1) + diff) / period;
      avgLoss = (avgLoss * (period - 1)) / period;
    } else {
      avgGain = (avgGain * (period - 1)) / period;
      avgLoss = (avgLoss * (period - 1) + Math.abs(diff)) / period;
    }

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      const currentRsi = 100 - 100 / (1 + rs);
      rsi.push(Number(currentRsi.toFixed(2)));
    }
  }
  return rsi;
}

/**
 * Calculate MACD (12, 26, 9)
 */
export function calculateMACD(closes: number[]): {
  macdLine: number[];
  signalLine: number[];
  histogram: number[];
} {
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  const macdLine: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  const histogram: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    histogram.push(macdLine[i] - signalLine[i]);
  }

  return { macdLine, signalLine, histogram };
}

/**
 * Calculate Full Technical Analysis Indicators and Signals from candles
 */
export function analyzeTechnical(candles: LiveCandle[], longAccountPct: number = 50): IndicatorValues | null {
  if (!candles || candles.length < 15) return null;

  const closes = candles.map((c) => c.close);
  const highs = candles.map((c) => c.high);
  const lows = candles.map((c) => c.low);
  const lastIndex = candles.length - 1;
  const currentClose = closes[lastIndex];

  // 1. RSI
  const rsiSeries = calculateRSI(closes, 14);
  const rsi14 = rsiSeries[rsiSeries.length - 1] || 50;

  let rsiSignal: IndicatorValues['rsiSignal'] = 'NEUTRAL';
  if (rsi14 <= 30) rsiSignal = 'OVERSOLD (BUY)';
  else if (rsi14 <= 45) rsiSignal = 'BEARISH';
  else if (rsi14 >= 70) rsiSignal = 'OVERBOUGHT (SELL)';
  else if (rsi14 >= 55) rsiSignal = 'BULLISH';

  // 2. MACD
  const { macdLine, signalLine, histogram } = calculateMACD(closes);
  const lastMacd = macdLine[lastIndex] || 0;
  const lastSig = signalLine[lastIndex] || 0;
  const lastHist = histogram[lastIndex] || 0;
  const prevHist = histogram[lastIndex - 1] || 0;

  let macdCrossover: IndicatorValues['macd']['crossover'] = 'NEUTRAL';
  if (prevHist < 0 && lastHist > 0) macdCrossover = 'BULLISH CROSS';
  else if (prevHist > 0 && lastHist < 0) macdCrossover = 'BEARISH CROSS';

  // 3. Moving Averages
  const ema20Series = calculateEMA(closes, 20);
  const ema50Series = calculateEMA(closes, 50);
  const ema200Series = calculateEMA(closes, Math.min(200, closes.length));

  const ema20 = ema20Series[lastIndex] || currentClose;
  const ema50 = ema50Series[lastIndex] || currentClose;
  const ema200 = ema200Series[lastIndex] || currentClose;

  let maTrend: IndicatorValues['maTrend'] = 'NEUTRAL';
  if (currentClose > ema20 && ema20 > ema50 && ema50 > ema200) {
    maTrend = 'STRONG BULLISH';
  } else if (currentClose > ema20 && ema20 > ema50) {
    maTrend = 'BULLISH';
  } else if (currentClose < ema20 && ema20 < ema50 && ema50 < ema200) {
    maTrend = 'STRONG BEARISH';
  } else if (currentClose < ema20) {
    maTrend = 'BEARISH';
  }

  // 4. Bollinger Bands (20, 2σ)
  const sma20Series = calculateSMA(closes, 20);
  const sma20 = sma20Series[lastIndex] || currentClose;

  const lookback20 = closes.slice(Math.max(0, closes.length - 20));
  const variance =
    lookback20.reduce((acc, val) => acc + Math.pow(val - sma20, 2), 0) / (lookback20.length || 1);
  const stdDev = Math.sqrt(variance);

  const bbUpper = sma20 + 2 * stdDev;
  const bbLower = sma20 - 2 * stdDev;
  const bandwidthPct = sma20 > 0 ? ((bbUpper - bbLower) / sma20) * 100 : 0;
  const percentB = bbUpper !== bbLower ? (currentClose - bbLower) / (bbUpper - bbLower) : 0.5;

  let bbStatus: IndicatorValues['bollinger']['status'] = 'NORMAL';
  if (bandwidthPct < 3.5) bbStatus = 'SQUEEZE';
  else if (bandwidthPct > 10.0) bbStatus = 'EXPANSION';

  // 5. Dynamic Standard Pivot Points (from recent high/low/close)
  const recentHigh = Math.max(...highs.slice(-24));
  const recentLow = Math.min(...lows.slice(-24));
  const pivot = (recentHigh + recentLow + currentClose) / 3;
  const r1 = 2 * pivot - recentLow;
  const s1 = 2 * pivot - recentHigh;
  const r2 = pivot + (recentHigh - recentLow);
  const s2 = pivot - (recentHigh - recentLow);

  // 6. ATR (Average True Range)
  let trSum = 0;
  const atrPeriod = Math.min(14, closes.length - 1);
  for (let i = closes.length - atrPeriod; i < closes.length; i++) {
    const hl = highs[i] - lows[i];
    const hc = Math.abs(highs[i] - closes[i - 1]);
    const lc = Math.abs(lows[i] - closes[i - 1]);
    trSum += Math.max(hl, hc, lc);
  }
  const atr14 = trSum / atrPeriod || 1;

  // 7. Aggregate Consensus Score
  let bullishCount = 0;
  let neutralCount = 0;
  let bearishCount = 0;

  // Evaluate RSI
  if (rsi14 <= 30) bullishCount += 2; // Oversold = Bullish mean reversion
  else if (rsi14 >= 70) bearishCount += 2; // Overbought
  else if (rsi14 > 50) bullishCount++;
  else if (rsi14 < 50) bearishCount++;
  else neutralCount++;

  // Evaluate MACD
  if (lastHist > 0) bullishCount += 2;
  else if (lastHist < 0) bearishCount += 2;
  else neutralCount++;

  if (macdCrossover === 'BULLISH CROSS') bullishCount += 2;
  if (macdCrossover === 'BEARISH CROSS') bearishCount += 2;

  // Evaluate MAs
  if (currentClose > ema20) bullishCount++;
  else bearishCount++;

  if (currentClose > ema50) bullishCount++;
  else bearishCount++;

  if (currentClose > ema200) bullishCount += 2;
  else bearishCount += 2;

  // Evaluate Bollinger position
  if (percentB < 0.1) bullishCount++; // lower band puncture = mean reversion
  else if (percentB > 0.9) bearishCount++;
  else neutralCount++;

  const totalPoints = bullishCount - bearishCount;
  let verdict: IndicatorValues['summary']['verdict'] = 'NEUTRAL';
  if (totalPoints >= 5) verdict = 'STRONG BUY';
  else if (totalPoints >= 2) verdict = 'BUY';
  else if (totalPoints <= -5) verdict = 'STRONG SELL';
  else if (totalPoints <= -2) verdict = 'SELL';

  // 8. Contrarian Divergence Check
  let contrarianDivergence: IndicatorValues['contrarianDivergence'] = {
    type: 'NONE',
    description: 'Technical trend aligns normally with crowd positioning.',
  };

  // If technical is Strong Buy/Buy, but retail crowd is heavily short (<38% long)
  if ((verdict === 'BUY' || verdict === 'STRONG BUY') && longAccountPct < 40) {
    contrarianDivergence = {
      type: 'BULLISH CONTRARIAN DIVERGENCE',
      description: `Technicals flashing ${verdict} while crowd is heavily short (${100 - longAccountPct}% short). Prime short squeeze ignition zone!`,
    };
  } else if ((verdict === 'SELL' || verdict === 'STRONG SELL') && longAccountPct > 72) {
    contrarianDivergence = {
      type: 'BEARISH CONTRARIAN DIVERGENCE',
      description: `Technicals deteriorating to ${verdict} while crowd is overextended long (${longAccountPct}% long). High long liquidation risk!`,
    };
  }

  return {
    rsi14,
    rsiSignal,
    macd: {
      macdLine: Number(lastMacd.toFixed(2)),
      signalLine: Number(lastSig.toFixed(2)),
      histogram: Number(lastHist.toFixed(2)),
      crossover: macdCrossover,
    },
    ema20: Number(ema20.toFixed(2)),
    ema50: Number(ema50.toFixed(2)),
    ema200: Number(ema200.toFixed(2)),
    maTrend,
    bollinger: {
      upper: Number(bbUpper.toFixed(2)),
      middle: Number(sma20.toFixed(2)),
      lower: Number(bbLower.toFixed(2)),
      bandwidthPct: Number(bandwidthPct.toFixed(2)),
      percentB: Number(percentB.toFixed(2)),
      status: bbStatus,
    },
    pivots: {
      r2: Number(r2.toFixed(2)),
      r1: Number(r1.toFixed(2)),
      pivot: Number(pivot.toFixed(2)),
      s1: Number(s1.toFixed(2)),
      s2: Number(s2.toFixed(2)),
    },
    atr14: Number(atr14.toFixed(2)),
    summary: {
      score: totalPoints,
      verdict,
      oscillatorScore: rsi14,
      maScore: currentClose > ema50 ? 1 : -1,
      bullishCount,
      neutralCount,
      bearishCount,
    },
    contrarianDivergence,
  };
}
