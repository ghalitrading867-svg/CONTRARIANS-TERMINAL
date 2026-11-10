export type AssetCategory = 'all' | 'equities' | 'crypto' | 'commodities' | 'rates_fx';

export interface Candle {
  time: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  sentiment: number; // 0-100 (0 = extreme fear, 100 = extreme greed)
  retailLongPct: number;
}

export interface ContrarianAsset {
  id: string;
  ticker: string;
  name: string;
  category: AssetCategory;
  price: number;
  change24h: number;
  sentimentScore: number; // 0-100
  sentimentLabel: 'EXTREME FEAR' | 'FEAR' | 'NEUTRAL' | 'GREED' | 'EXTREME GREED';
  retailStance: 'CROWDED LONG' | 'LEAN LONG' | 'BALANCED' | 'LEAN SHORT' | 'CROWDED SHORT';
  retailLongPct: number; // e.g. 84%
  smartMoneyStance: 'HEAVY ACCUMULATION' | 'MILD LONG' | 'NEUTRAL' | 'MILD DISTRIBUTION' | 'HEAVY SHORT';
  smartMoneyLongPct: number;
  contrarianSignal: 'STRONG ACCUMULATION' | 'BUY REVERSAL' | 'ACCUMULATE' | 'MEAN REVERSION LONG' | 'NEUTRAL' | 'TRIM EUPHORIA' | 'SHORT SQUEEZE ALERT' | 'FADE EXHAUSTION';
  zScore: number; // distance from 200 DMA in standard deviations
  putCallRatio?: number;
  fundingRate8h?: number; // % in crypto or borrowing premium
  shortInterestPct?: number;
  daysToCover?: number;
  liquidationUpper: number;
  liquidationLower: number;
  sparkline: number[];
  candles: Candle[];
  contrarianThesis: string;
  catalyst: string;
  invalidationLevel: number;
  targetPrice: number;
  historicalWinRate: number; // historical return win rate when sentiment reached this level
}

export interface ContrarianAlert {
  id: string;
  timestamp: string;
  ticker: string;
  assetName: string;
  severity: 'extreme' | 'high' | 'medium';
  type: 'capitulation' | 'euphoria_peak' | 'short_squeeze' | 'smart_divergence' | 'funding_anomaly';
  title: string;
  description: string;
  actionRecommendation: string;
}

export interface MacroIndicator {
  name: string;
  currentValue: string;
  subValue: string;
  status: 'EXTREME BUY' | 'BULLISH LEAN' | 'NEUTRAL' | 'BEARISH LEAN' | 'EXTREME SELL';
  zScore: string;
  description: string;
}

export interface TradePlaybook {
  id: string;
  title: string;
  ticker: string;
  assetName: string;
  setupType: 'Blood in the Streets' | 'Crowded Short Squeeze' | 'Exhaustion Fade' | 'Smart Money Divergence';
  conviction: 'HIGH' | 'MAXIMUM' | 'MEDIUM';
  riskReward: string;
  entryRange: string;
  invalidation: string;
  target1: string;
  target2: string;
  crowdFallacy: string;
  contrarianEdge: string;
  catalysts: string[];
}
