import React from 'react';
import { IndicatorValues } from '../utils/technicalAnalysis';
import { Compass, TrendingUp, TrendingDown, ShieldAlert, Sparkles, CheckCircle2 } from 'lucide-react';

interface TechnicalSummaryGaugeProps {
  indicators: IndicatorValues;
  symbol: string;
  currentPrice: number;
}

export const TechnicalSummaryGauge: React.FC<TechnicalSummaryGaugeProps> = ({
  indicators,
  symbol,
  currentPrice,
}) => {
  const { summary, rsi14, rsiSignal, macd, maTrend, bollinger, pivots, contrarianDivergence } = indicators;

  // Gauge needle calculation (-10 = -180deg, 0 = -90deg, +10 = 0deg)
  const clampedScore = Math.max(-10, Math.min(10, summary.score));
  const normalizedScore = (clampedScore + 10) / 20; // 0 to 1
  const angleDeg = -180 + normalizedScore * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const cx = 90;
  const cy = 80;
  const r = 65;
  const needleX = cx + (r - 14) * Math.cos(angleRad);
  const needleY = cy + (r - 14) * Math.sin(angleRad);

  const verdictColor = () => {
    switch (summary.verdict) {
      case 'STRONG BUY':
        return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
      case 'BUY':
        return 'text-emerald-300 bg-emerald-950/40 border-emerald-900';
      case 'STRONG SELL':
        return 'text-rose-400 bg-rose-950/70 border-rose-800';
      case 'SELL':
        return 'text-rose-300 bg-rose-950/40 border-rose-900';
      default:
        return 'text-slate-300 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-4 space-y-4 shadow-xl">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-amber-400" />
          <h3 className="font-mono text-xs font-bold text-white uppercase tracking-wider">
            Technical Consensus — {symbol}
          </h3>
        </div>
        <span className={`px-2.5 py-0.5 rounded border text-xs font-mono font-bold ${verdictColor()}`}>
          {summary.verdict}
        </span>
      </div>

      {/* Main Grid: Gauge Dial & Breakdown Meters */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Speedometer Gauge (4 cols) */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-2 bg-[#080C14] rounded-lg border border-slate-800/60">
          <svg width="180" height="95" viewBox="0 0 180 95" className="overflow-visible">
            {/* Strong Sell (Red) */}
            <path d="M 20 80 A 65 65 0 0 1 45 35" fill="none" stroke="#ef4444" strokeWidth="9" strokeLinecap="round" />
            {/* Sell (Orange) */}
            <path d="M 45 35 A 65 65 0 0 1 75 18" fill="none" stroke="#f97316" strokeWidth="9" />
            {/* Neutral (Slate) */}
            <path d="M 75 18 A 65 65 0 0 1 105 18" fill="none" stroke="#64748b" strokeWidth="9" />
            {/* Buy (Cyan) */}
            <path d="M 105 18 A 65 65 0 0 1 135 35" fill="none" stroke="#06b6d4" strokeWidth="9" />
            {/* Strong Buy (Green) */}
            <path d="M 135 35 A 65 65 0 0 1 160 80" fill="none" stroke="#10b981" strokeWidth="9" strokeLinecap="round" />

            <circle cx={cx} cy={cy} r="4" fill="#f8fafc" />
            <line x1={cx} y1={cy} x2={needleX} y2={needleY} stroke="#f8fafc" strokeWidth="2.5" strokeLinecap="round" />
          </svg>

          <div className="text-center mt-1">
            <span className="font-mono text-xs font-bold text-slate-200">
              Score: {summary.score > 0 ? `+${summary.score}` : summary.score}
            </span>
            <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mt-0.5">
              <span className="text-emerald-400 font-semibold">{summary.bullishCount} Bullish</span>
              <span>·</span>
              <span className="text-slate-400">{summary.neutralCount} Neutral</span>
              <span>·</span>
              <span className="text-rose-400 font-semibold">{summary.bearishCount} Bearish</span>
            </div>
          </div>
        </div>

        {/* Core Indicators Breakdown (8 cols) */}
        <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5 font-mono text-xs">
          {/* RSI (14) */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex justify-between">
              <span>RSI (14)</span>
              <span className="text-slate-400">{rsi14}</span>
            </div>
            <div className="font-bold text-white mt-0.5 truncate">
              {rsiSignal}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1.5 overflow-hidden">
              <div
                className={`h-full ${rsi14 <= 30 ? 'bg-emerald-400' : rsi14 >= 70 ? 'bg-rose-400' : 'bg-amber-400'}`}
                style={{ width: `${rsi14}%` }}
              />
            </div>
          </div>

          {/* MACD (12, 26, 9) */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex justify-between">
              <span>MACD</span>
              <span className={macd.histogram >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {macd.histogram >= 0 ? `+${macd.histogram}` : macd.histogram}
              </span>
            </div>
            <div className="font-bold text-white mt-0.5 truncate">
              {macd.crossover !== 'NEUTRAL' ? macd.crossover : macd.histogram >= 0 ? 'MOMENTUM UP' : 'MOMENTUM DOWN'}
            </div>
            <span className="text-[9.5px] text-slate-500 block mt-1">
              Line: {macd.macdLine} / Sig: {macd.signalLine}
            </span>
          </div>

          {/* Moving Averages Trend */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">
              MA Regime
            </div>
            <div className={`font-bold mt-0.5 truncate ${maTrend.includes('BULL') ? 'text-emerald-400' : maTrend.includes('BEAR') ? 'text-rose-400' : 'text-slate-300'}`}>
              {maTrend}
            </div>
            <span className="text-[9.5px] text-slate-500 block mt-1">
              EMA20: ${indicators.ema20}
            </span>
          </div>

          {/* Bollinger Bands */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase flex justify-between">
              <span>BBands (20,2)</span>
              <span className="text-cyan-400">{bollinger.status}</span>
            </div>
            <div className="font-bold text-white mt-0.5">
              BW: {bollinger.bandwidthPct}%
            </div>
            <span className="text-[9.5px] text-slate-500 block mt-1">
              %B: {(bollinger.percentB * 100).toFixed(0)}%
            </span>
          </div>

          {/* Pivot Point & Distance */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">
              Pivot Level (P)
            </div>
            <div className="font-bold text-amber-400 mt-0.5">
              ${pivots.pivot.toFixed(2)}
            </div>
            <span className="text-[9.5px] text-slate-500 block mt-1">
              {currentPrice >= pivots.pivot ? 'Trading Above P (Bullish)' : 'Trading Below P (Bearish)'}
            </span>
          </div>

          {/* ATR Volatility */}
          <div className="bg-[#090D15] p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500 uppercase">
              ATR Volatility
            </div>
            <div className="font-bold text-slate-200 mt-0.5">
              ${indicators.atr14.toFixed(2)}
            </div>
            <span className="text-[9.5px] text-slate-500 block mt-1">
              Daily Expected Noise
            </span>
          </div>
        </div>
      </div>

      {/* Dynamic Pivot S/R Table Strip */}
      <div className="bg-[#080C14] rounded p-2.5 border border-slate-800/80 grid grid-cols-5 gap-2 text-center font-mono text-[11px]">
        <div>
          <span className="text-[9.5px] text-rose-500 uppercase block font-semibold">Resist 2 (R2)</span>
          <span className="text-rose-400 font-bold tabular-nums">${pivots.r2.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-rose-400 uppercase block font-semibold">Resist 1 (R1)</span>
          <span className="text-rose-300 font-bold tabular-nums">${pivots.r1.toFixed(2)}</span>
        </div>
        <div className="bg-amber-500/10 rounded py-0.5 border border-amber-500/20">
          <span className="text-[9.5px] text-amber-400 uppercase block font-bold">Pivot (P)</span>
          <span className="text-amber-300 font-bold tabular-nums">${pivots.pivot.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-emerald-400 uppercase block font-semibold">Support 1 (S1)</span>
          <span className="text-emerald-300 font-bold tabular-nums">${pivots.s1.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-[9.5px] text-emerald-500 uppercase block font-semibold">Support 2 (S2)</span>
          <span className="text-emerald-400 font-bold tabular-nums">${pivots.s2.toFixed(2)}</span>
        </div>
      </div>

      {/* Contrarian Divergence Warning Banner (if applicable) */}
      {contrarianDivergence && contrarianDivergence.type !== 'NONE' && (
        <div
          className={`p-3 rounded-lg border flex items-start gap-2.5 text-xs font-sans ${
            contrarianDivergence.type === 'BULLISH CONTRARIAN DIVERGENCE'
              ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div>
            <span className="font-mono font-bold block mb-0.5">
              {contrarianDivergence.type}
            </span>
            <p className="leading-relaxed text-[11px] opacity-90">
              {contrarianDivergence.description}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
