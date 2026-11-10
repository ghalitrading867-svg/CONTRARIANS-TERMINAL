import React, { useState, useEffect } from 'react';
import { TechnicalSummaryGauge } from './TechnicalSummaryGauge';
import { analyzeTechnical, IndicatorValues } from '../utils/technicalAnalysis';
import {
  fetchUnifiedKlines,
  fetchUnifiedTicker,
  fetchUnifiedContrarian,
  POPULAR_USDT_PAIRS,
  Timeframe,
  LiveCandle,
} from '../services/marketApi';
import {
  Sliders,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Search,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AssetTechnicalRow {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  indicators: IndicatorValues;
}

interface TechnicalAnalysisViewProps {
  initialSymbol?: string;
  onSelectTickerForChart: (ticker: string) => void;
}

export const TechnicalAnalysisView: React.FC<TechnicalAnalysisViewProps> = ({
  initialSymbol = 'BTCUSDT',
  onSelectTickerForChart,
}) => {
  const [activeSymbol, setActiveSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>('1h');
  const [activeCandles, setActiveCandles] = useState<LiveCandle[]>([]);
  const [activePrice, setActivePrice] = useState<number>(0);
  const [activeIndicators, setActiveIndicators] = useState<IndicatorValues | null>(null);
  const [isLoadingActive, setIsLoadingActive] = useState<boolean>(true);

  // Multi-asset scanner rows
  const [scannerRows, setScannerRows] = useState<AssetTechnicalRow[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Load active pair detailed technicals
  useEffect(() => {
    let isCancelled = false;
    const loadActive = async () => {
      setIsLoadingActive(true);
      try {
        const [klines, ticker, contrarian] = await Promise.all([
          fetchUnifiedKlines(activeSymbol, timeframe, 'binance', 60),
          fetchUnifiedTicker(activeSymbol, 'binance'),
          fetchUnifiedContrarian(activeSymbol),
        ]);

        if (isCancelled) return;
        setActiveCandles(klines);
        setActivePrice(ticker.price);

        const analyzed = analyzeTechnical(klines, contrarian.longAccountPct);
        setActiveIndicators(analyzed);
      } catch {
        // Handled gracefully
      } finally {
        if (!isCancelled) setIsLoadingActive(false);
      }
    };

    loadActive();
    const interval = setInterval(loadActive, 10000);
    return () => {
      isCancelled = true;
      clearInterval(interval);
    };
  }, [activeSymbol, timeframe]);

  // 2. Scan multi-asset technical matrix on mount or refresh
  const runScanner = async () => {
    setIsScanning(true);
    const topSymbols = ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT', 'XRPUSDT', 'BNBUSDT', 'SUIUSDT', 'AVAXUSDT'];
    const rows: AssetTechnicalRow[] = [];

    for (const sym of topSymbols) {
      try {
        const [klines, ticker, contrarian] = await Promise.all([
          fetchUnifiedKlines(sym, timeframe, 'binance', 40),
          fetchUnifiedTicker(sym, 'binance'),
          fetchUnifiedContrarian(sym),
        ]);

        const analyzed = analyzeTechnical(klines, contrarian.longAccountPct);
        const pairInfo = POPULAR_USDT_PAIRS.find((p) => p.symbol === sym);

        if (analyzed) {
          rows.push({
            symbol: sym,
            name: pairInfo ? pairInfo.name : sym,
            price: ticker.price,
            change24h: ticker.change24h,
            indicators: analyzed,
          });
        }
      } catch {
        // continue
      }
    }

    setScannerRows(rows);
    setIsScanning(false);
  };

  useEffect(() => {
    runScanner();
  }, [timeframe]);

  const filteredRows = scannerRows.filter(
    (r) =>
      r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header & Pair / Timeframe Toolbar */}
      <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-4 bg-[#0E1422] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            TECHNICAL ANALYSIS & MULTI-OSCILLATOR RADAR
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Algorithmic consensus derived from RSI(14), MACD(12,26,9), EMAs, Bollinger Bands, and Pivot Levels
          </p>
        </div>

        {/* Pair & Timeframe Selector */}
        <div className="flex items-center gap-3">
          {/* Active Symbol Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-1">
            {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'].map((sym) => (
              <button
                key={sym}
                onClick={() => {
                  setActiveSymbol(sym);
                  soundEngine.playTick();
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  activeSymbol === sym
                    ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sym.replace('USDT', '')}
              </button>
            ))}
          </div>

          {/* Timeframe selector */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded p-1">
            {(['5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  soundEngine.playTick();
                }}
                className={`px-2 py-1 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              runScanner();
              soundEngine.playAlertPing();
            }}
            disabled={isScanning}
            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Refresh Technical Radar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Active Pair Technical Consensus Gauge */}
      {isLoadingActive && !activeIndicators ? (
        <div className="p-12 text-center text-slate-500 font-mono text-xs bg-[#0B0F17] rounded-lg border border-slate-800">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
          <span>Computing multi-oscillator matrix for {activeSymbol}...</span>
        </div>
      ) : activeIndicators ? (
        <TechnicalSummaryGauge
          indicators={activeIndicators}
          symbol={activeSymbol}
          currentPrice={activePrice}
        />
      ) : null}

      {/* Multi-Asset Technical Intelligence Matrix */}
      <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800/80 bg-[#0E1422] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="font-mono text-xs font-bold text-white uppercase">
              USDT Market Technical Screener ({timeframe} Timeframe)
            </h3>
          </div>

          <div className="relative w-full max-w-[200px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter pair..."
              className="w-full bg-slate-900 border border-slate-800 rounded pl-8 pr-3 py-1 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-400 font-mono"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse font-mono">
            <thead>
              <tr className="border-b border-slate-800 bg-[#080C14] text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="py-2.5 px-4 font-semibold">Pair / Asset</th>
                <th className="py-2.5 px-3 font-semibold text-right">Live Price</th>
                <th className="py-2.5 px-3 font-semibold text-center">Technical Verdict</th>
                <th className="py-2.5 px-3 font-semibold text-center">RSI (14)</th>
                <th className="py-2.5 px-3 font-semibold text-center">MACD Signal</th>
                <th className="py-2.5 px-3 font-semibold text-center">MA Regime</th>
                <th className="py-2.5 px-3 font-semibold text-right">Pivot (P)</th>
                <th className="py-2.5 px-4 font-semibold">Contrarian Alignment</th>
                <th className="py-2.5 px-3 font-semibold text-right">Chart</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Scanning technicals across USDT pairs...
                  </td>
                </tr>
              ) : (
                filteredRows.map((row) => {
                  const { summary, rsi14, macd, maTrend, pivots, contrarianDivergence } = row.indicators;
                  const isSelected = row.symbol === activeSymbol;

                  const verdictBadge = () => {
                    if (summary.verdict === 'STRONG BUY') return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
                    if (summary.verdict === 'BUY') return 'bg-emerald-950/40 text-emerald-400 border-emerald-900';
                    if (summary.verdict === 'STRONG SELL') return 'bg-rose-950/80 text-rose-300 border-rose-800';
                    if (summary.verdict === 'SELL') return 'bg-rose-950/40 text-rose-400 border-rose-900';
                    return 'bg-slate-800 text-slate-300 border-slate-700';
                  };

                  return (
                    <tr
                      key={row.symbol}
                      onClick={() => {
                        setActiveSymbol(row.symbol);
                        soundEngine.playTick();
                      }}
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-amber-500/10 border-l-2 border-l-amber-500' : 'hover:bg-slate-800/40'
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-white text-xs">{row.symbol}</div>
                        <div className="text-[10px] text-slate-500 font-sans">{row.name}</div>
                      </td>

                      <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-100">
                        ${row.price < 1 ? row.price.toFixed(4) : row.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${verdictBadge()}`}>
                          {summary.verdict}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center tabular-nums">
                        <span
                          className={`font-semibold ${
                            rsi14 <= 30 ? 'text-emerald-400 font-bold' : rsi14 >= 70 ? 'text-rose-400 font-bold' : 'text-slate-300'
                          }`}
                        >
                          {rsi14}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center text-[11px]">
                        <span
                          className={
                            macd.histogram > 0 ? 'text-emerald-400 font-medium' : 'text-rose-400 font-medium'
                          }
                        >
                          {macd.crossover !== 'NEUTRAL' ? macd.crossover : macd.histogram > 0 ? 'BULL HIST' : 'BEAR HIST'}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center text-[10.5px]">
                        <span
                          className={
                            maTrend.includes('BULL') ? 'text-emerald-400' : maTrend.includes('BEAR') ? 'text-rose-400' : 'text-slate-400'
                          }
                        >
                          {maTrend}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right tabular-nums text-amber-300/90">
                        ${pivots.pivot.toFixed(2)}
                      </td>

                      <td className="py-3 px-4 text-[11px] font-sans">
                        {contrarianDivergence && contrarianDivergence.type !== 'NONE' ? (
                          <span className="text-amber-400 font-semibold flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                            {contrarianDivergence.type.replace(' DIVERGENCE', '')}
                          </span>
                        ) : (
                          <span className="text-slate-500">Aligned with trend</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTickerForChart(row.symbol);
                            soundEngine.playTick();
                          }}
                          className="px-2 py-1 text-[10px] font-sans font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded"
                        >
                          Open
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
