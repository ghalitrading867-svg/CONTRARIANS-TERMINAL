import React, { useState, useMemo, useRef } from 'react';
import { ContrarianAsset, Candle } from '../types/terminal';
import { soundEngine } from '../utils/audio';
import {
  TrendingUp,
  TrendingDown,
  Layers,
  Eye,
  Sliders,
  Target,
  AlertOctagon,
  Maximize2,
  Crosshair,
} from 'lucide-react';

interface InteractiveChartProps {
  asset: ContrarianAsset;
  onViewThesis: (asset: ContrarianAsset) => void;
}

export const InteractiveChart: React.FC<InteractiveChartProps> = ({
  asset,
  onViewThesis,
}) => {
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | 'ALL'>('1M');
  const [chartType, setChartType] = useState<'candle' | 'line'>('candle');
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showMA200, setShowMA200] = useState<boolean>(true);
  const [showSignals, setShowSignals] = useState<boolean>(true);
  const [showVolume, setShowVolume] = useState<boolean>(true);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Timeframe slice
  const displayedCandles = useMemo(() => {
    const all = asset.candles;
    if (timeframe === '1D') return all.slice(-14);
    if (timeframe === '1W') return all.slice(-21);
    if (timeframe === '1M') return all.slice(-30);
    if (timeframe === '3M') return all.slice(-42);
    return all;
  }, [asset.candles, timeframe]);

  // Compute scale boundaries
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    displayedCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const padding = (max - min) * 0.1 || 1;
    return {
      minPrice: min - padding,
      maxPrice: max + padding,
      maxVolume: maxVol,
    };
  }, [displayedCandles]);

  // SVG dimensions
  const svgWidth = 860;
  const svgHeight = 440;
  const pricePaneHeight = 290;
  const oscPaneHeight = 110;
  const oscPaneTop = 320;
  const rightAxisWidth = 65;
  const chartAreaWidth = svgWidth - rightAxisWidth;

  // Coordinate mappers
  const getX = (idx: number) => {
    const step = chartAreaWidth / (displayedCandles.length - 1 || 1);
    return idx * step;
  };

  const getYPrice = (val: number) => {
    const range = maxPrice - minPrice || 1;
    return pricePaneHeight - ((val - minPrice) / range) * (pricePaneHeight - 20) - 10;
  };

  const getYOsc = (val: number) => {
    // 0 to 100
    const clamped = Math.max(0, Math.min(100, val));
    return oscPaneTop + oscPaneHeight - (clamped / 100) * oscPaneHeight;
  };

  // 200-period MA approximation (moving average curve)
  const maPoints = useMemo(() => {
    return displayedCandles
      .map((c, idx) => {
        // Simple smoothing for visual line
        const lookback = displayedCandles.slice(Math.max(0, idx - 5), idx + 1);
        const avg = lookback.reduce((sum, item) => sum + item.close, 0) / lookback.length;
        return `${getX(idx)},${getYPrice(avg)}`;
      })
      .join(' ');
  }, [displayedCandles, minPrice, maxPrice]);

  // Bollinger Bands path
  const { bollingerUpper, bollingerLower, bollingerArea } = useMemo(() => {
    const upperPts: string[] = [];
    const lowerPts: string[] = [];

    displayedCandles.forEach((c, idx) => {
      const x = getX(idx);
      const lookback = displayedCandles.slice(Math.max(0, idx - 5), idx + 1);
      const avg = lookback.reduce((sum, item) => sum + item.close, 0) / lookback.length;
      const dev = (maxPrice - minPrice) * 0.08;
      upperPts.push(`${x},${getYPrice(avg + dev)}`);
      lowerPts.push(`${x},${getYPrice(avg - dev)}`);
    });

    const reversedLower = [...lowerPts].reverse();
    const area = `M ${upperPts[0]} L ${upperPts.slice(1).join(' L ')} L ${reversedLower.join(' L ')} Z`;

    return {
      bollingerUpper: upperPts.join(' '),
      bollingerLower: lowerPts.join(' '),
      bollingerArea: area,
    };
  }, [displayedCandles, minPrice, maxPrice]);

  // Sentiment Oscillator line path
  const oscPoints = useMemo(() => {
    return displayedCandles
      .map((c, idx) => `${getX(idx)},${getYOsc(c.sentiment)}`)
      .join(' ');
  }, [displayedCandles]);

  // Hover detection
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = clientX / (rect.width * (chartAreaWidth / svgWidth));
    const idx = Math.round(ratio * (displayedCandles.length - 1));
    if (idx >= 0 && idx < displayedCandles.length) {
      setHoverIndex(idx);
    }
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  const activeCandle = hoverIndex !== null ? displayedCandles[hoverIndex] : displayedCandles[displayedCandles.length - 1];

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      {/* Top Chart Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0e1422] flex flex-wrap items-center justify-between gap-4">
        {/* Asset Identity & Real-Time Metrics */}
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-white tracking-wide">
                {asset.ticker}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {asset.name}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {asset.category}
              </span>
            </div>
            <div className="flex items-baseline gap-3 mt-0.5">
              <span className="font-mono text-2xl font-bold text-white tabular-nums">
                ${asset.price < 10 ? asset.price.toFixed(3) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <span
                className={`font-mono text-xs font-semibold tabular-nums ${
                  asset.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {asset.change24h >= 0 ? '+' : ''}
                {asset.change24h.toFixed(2)}%
              </span>
              <span className="text-xs text-slate-400 font-mono">
                Z-Score: <strong className={asset.zScore < 0 ? 'text-emerald-400' : 'text-rose-400'}>{asset.zScore > 0 ? '+' : ''}{asset.zScore}σ</strong>
              </span>
            </div>
          </div>
        </div>

        {/* Toggles & Timeframes */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Timeframe selector */}
          <div className="flex items-center gap-0.5 p-1 bg-slate-900 rounded border border-slate-800 font-mono text-xs">
            {(['1D', '1W', '1M', '3M', 'ALL'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  soundEngine.playTick();
                }}
                className={`px-2.5 py-1 rounded transition-colors ${
                  timeframe === tf
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Chart Type Toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-900 rounded border border-slate-800 text-xs">
            <button
              onClick={() => {
                setChartType('candle');
                soundEngine.playTick();
              }}
              className={`px-2 py-1 rounded transition-colors font-mono ${
                chartType === 'candle'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Candle
            </button>
            <button
              onClick={() => {
                setChartType('line');
                soundEngine.playTick();
              }}
              className={`px-2 py-1 rounded transition-colors font-mono ${
                chartType === 'line'
                  ? 'bg-slate-700 text-white font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Line
            </button>
          </div>

          {/* Overlays */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <button
              onClick={() => {
                setShowBollinger(!showBollinger);
                soundEngine.playTick();
              }}
              className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                showBollinger
                  ? 'bg-cyan-950/40 text-cyan-300 border-cyan-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              BBands 2σ
            </button>
            <button
              onClick={() => {
                setShowMA200(!showMA200);
                soundEngine.playTick();
              }}
              className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                showMA200
                  ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              200 MA
            </button>
            <button
              onClick={() => {
                setShowSignals(!showSignals);
                soundEngine.playTick();
              }}
              className={`px-2 py-1 rounded border text-[11px] font-mono transition-colors ${
                showSignals
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
                  : 'bg-slate-900 text-slate-500 border-slate-800'
              }`}
            >
              Signals
            </button>
          </div>
        </div>
      </div>

      {/* Floating Info Bar (Current / Hovered Candle Data) */}
      <div className="px-4 py-2 bg-[#090D15] border-b border-slate-800/60 flex flex-wrap items-center justify-between text-xs font-mono text-slate-400">
        <div className="flex items-center gap-4">
          <span className="text-slate-300">
            DATE: <strong className="text-white">{activeCandle.time}</strong>
          </span>
          <span>
            O: <strong className="text-slate-200 tabular-nums">${activeCandle.open}</strong>
          </span>
          <span>
            H: <strong className="text-slate-200 tabular-nums">${activeCandle.high}</strong>
          </span>
          <span>
            L: <strong className="text-slate-200 tabular-nums">${activeCandle.low}</strong>
          </span>
          <span>
            C: <strong className="text-slate-200 tabular-nums">${activeCandle.close}</strong>
          </span>
          {showVolume && (
            <span>
              VOL: <strong className="text-slate-300 tabular-nums">{(activeCandle.volume / 1000000).toFixed(2)}M</strong>
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <span>
            CSO SENTIMENT:{' '}
            <strong
              className={
                activeCandle.sentiment <= 25
                  ? 'text-emerald-400'
                  : activeCandle.sentiment >= 75
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }
            >
              {activeCandle.sentiment}/100
            </strong>
          </span>
          <span>
            RETAIL LONG:{' '}
            <strong className="text-slate-200">{activeCandle.retailLongPct}%</strong>
          </span>
        </div>
      </div>

      {/* Interactive Chart Canvas (SVG) */}
      <div className="p-3 bg-[#080C14] relative select-none" ref={containerRef}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-auto max-h-[500px] cursor-crosshair overflow-visible"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        >
          {/* Price Pane Grid lines */}
          {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
            const y = pricePaneHeight * ratio;
            const priceLevel = minPrice + (maxPrice - minPrice) * (1 - ratio);
            return (
              <g key={`grid-p-${idx}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartAreaWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="4 4"
                />
                <text
                  x={chartAreaWidth + 8}
                  y={y + 4}
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                  textAnchor="start"
                >
                  ${priceLevel.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Volume bars in lower part of price pane */}
          {showVolume &&
            displayedCandles.map((c, idx) => {
              const x = getX(idx);
              const barWidth = Math.max(3, (chartAreaWidth / displayedCandles.length) * 0.6);
              const volRatio = c.volume / (maxVolume || 1);
              const barHeight = volRatio * 45;
              const isUp = c.close >= c.open;

              return (
                <rect
                  key={`vol-${idx}`}
                  x={x - barWidth / 2}
                  y={pricePaneHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={isUp ? '#10b981' : '#f43f5e'}
                  opacity={0.18}
                />
              );
            })}

          {/* Bollinger Bands Shaded Area & Lines */}
          {showBollinger && (
            <>
              <path d={bollingerArea} fill="#06b6d4" opacity="0.06" />
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
                points={bollingerUpper}
              />
              <polyline
                fill="none"
                stroke="#06b6d4"
                strokeWidth="1"
                strokeDasharray="3 3"
                opacity="0.4"
                points={bollingerLower}
              />
            </>
          )}

          {/* 200 Moving Average Line */}
          {showMA200 && (
            <polyline
              fill="none"
              stroke="#f59e0b"
              strokeWidth="1.5"
              opacity="0.8"
              points={maPoints}
            />
          )}

          {/* Candlesticks or Price Line */}
          {chartType === 'candle' ? (
            displayedCandles.map((c, idx) => {
              const x = getX(idx);
              const yOpen = getYPrice(c.open);
              const yClose = getYPrice(c.close);
              const yHigh = getYPrice(c.high);
              const yLow = getYPrice(c.low);
              const isUp = c.close >= c.open;
              const barWidth = Math.max(4, (chartAreaWidth / displayedCandles.length) * 0.7);

              const top = Math.min(yOpen, yClose);
              const height = Math.max(2, Math.abs(yClose - yOpen));

              return (
                <g key={`candle-${idx}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.2"
                  />
                  {/* Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={top}
                    width={barWidth}
                    height={height}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    rx={1}
                  />
                </g>
              );
            })
          ) : (
            <polyline
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
              points={displayedCandles.map((c, idx) => `${getX(idx)},${getYPrice(c.close)}`).join(' ')}
            />
          )}

          {/* Contrarian Signal Markers on historical turning points */}
          {showSignals &&
            displayedCandles.map((c, idx) => {
              const isExtremeFear = c.sentiment <= 20;
              const isExtremeGreed = c.sentiment >= 85;
              if (!isExtremeFear && !isExtremeGreed) return null;

              const x = getX(idx);
              const y = isExtremeFear ? getYPrice(c.low) + 14 : getYPrice(c.high) - 14;

              return (
                <g key={`sig-${idx}`}>
                  {isExtremeFear ? (
                    <g transform={`translate(${x - 8}, ${y})`}>
                      <circle cx="8" cy="8" r="7" fill="#10b981" />
                      <path d="M 5 9 L 8 5 L 11 9 Z" fill="#022c22" />
                    </g>
                  ) : (
                    <g transform={`translate(${x - 8}, ${y - 16})`}>
                      <circle cx="8" cy="8" r="7" fill="#f43f5e" />
                      <path d="M 5 7 L 8 11 L 11 7 Z" fill="#4c0519" />
                    </g>
                  )}
                </g>
              );
            })}

          {/* Pane Divider */}
          <line
            x1={0}
            y1={oscPaneTop - 10}
            x2={svgWidth}
            y2={oscPaneTop - 10}
            stroke="#1e293b"
            strokeWidth="1.2"
          />

          {/* Lower Pane: Contrarian Sentiment Oscillator (CSO) */}
          {/* Accumulation Shaded Band (0 - 25) */}
          <rect
            x={0}
            y={getYOsc(25)}
            width={chartAreaWidth}
            height={getYOsc(0) - getYOsc(25)}
            fill="#10b981"
            opacity="0.08"
          />
          {/* Distribution Shaded Band (75 - 100) */}
          <rect
            x={0}
            y={getYOsc(100)}
            width={chartAreaWidth}
            height={getYOsc(75) - getYOsc(100)}
            fill="#f43f5e"
            opacity="0.08"
          />

          {/* CSO Grid Lines */}
          {[25, 50, 75].map((lvl) => {
            const y = getYOsc(lvl);
            return (
              <g key={`cso-grid-${lvl}`}>
                <line
                  x1={0}
                  y1={y}
                  x2={chartAreaWidth}
                  y2={y}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                />
                <text
                  x={chartAreaWidth + 8}
                  y={y + 3}
                  fill={lvl === 25 ? '#10b981' : lvl === 75 ? '#f43f5e' : '#64748b'}
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                >
                  {lvl}
                </text>
              </g>
            );
          })}

          {/* CSO Sentiment Curve */}
          <polyline
            fill="none"
            stroke="#f59e0b"
            strokeWidth="1.8"
            points={oscPoints}
          />

          {/* CSO Points */}
          {displayedCandles.map((c, idx) => (
            <circle
              key={`cso-pt-${idx}`}
              cx={getX(idx)}
              cy={getYOsc(c.sentiment)}
              r={hoverIndex === idx ? '4' : '2'}
              fill={c.sentiment <= 25 ? '#10b981' : c.sentiment >= 75 ? '#f43f5e' : '#f59e0b'}
            />
          ))}

          {/* CSO Labels */}
          <text
            x={10}
            y={oscPaneTop + 14}
            fill="#94a3b8"
            fontSize="10"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="600"
          >
            CONTRARIAN SENTIMENT OSCILLATOR (CSO)
          </text>
          <text
            x={10}
            y={oscPaneTop + 28}
            fill="#10b981"
            fontSize="8.5"
            fontFamily="JetBrains Mono, monospace"
          >
            &lt; 25: ASYMMETRIC BUY ZONE
          </text>
          <text
            x={10}
            y={oscPaneTop + 40}
            fill="#f43f5e"
            fontSize="8.5"
            fontFamily="JetBrains Mono, monospace"
          >
            &gt; 75: EUPHORIA FADE ZONE
          </text>

          {/* Crosshair when hovering */}
          {hoverIndex !== null && (
            <g>
              {/* Vertical line across both panes */}
              <line
                x1={getX(hoverIndex)}
                y1={10}
                x2={getX(hoverIndex)}
                y2={svgHeight - 10}
                stroke="#f8fafc"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              {/* Horizontal line at hover candle close */}
              <line
                x1={0}
                y1={getYPrice(activeCandle.close)}
                x2={chartAreaWidth}
                y2={getYPrice(activeCandle.close)}
                stroke="#f8fafc"
                strokeWidth="0.8"
                strokeDasharray="3 3"
                opacity="0.6"
              />
              {/* Price badge on right axis */}
              <rect
                x={chartAreaWidth + 2}
                y={getYPrice(activeCandle.close) - 9}
                width={56}
                height={18}
                fill="#334155"
                rx={2}
              />
              <text
                x={chartAreaWidth + 6}
                y={getYPrice(activeCandle.close) + 3}
                fill="#ffffff"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
                fontWeight="bold"
              >
                ${activeCandle.close.toFixed(2)}
              </text>
            </g>
          )}
        </svg>
      </div>

      {/* Bottom Contrarian Execution & Asymmetry Strip */}
      <div className="p-4 bg-[#0e1422] border-t border-slate-800/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full md:w-auto text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">
              Contrarian Signal
            </span>
            <span className="font-bold text-amber-400">
              {asset.contrarianSignal}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">
              Invalidation Stop
            </span>
            <span className="font-bold text-rose-400 tabular-nums">
              ${asset.invalidationLevel.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">
              Asymmetric Target
            </span>
            <span className="font-bold text-emerald-400 tabular-nums">
              ${asset.targetPrice.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block uppercase">
              Historical Win Rate
            </span>
            <span className="font-bold text-slate-200 tabular-nums">
              {asset.historicalWinRate}%
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <button
            onClick={() => {
              onViewThesis(asset);
              soundEngine.playBlip(800);
            }}
            className="w-full md:w-auto px-4 py-2 text-xs font-medium text-slate-950 bg-amber-400 hover:bg-amber-300 rounded font-sans transition-colors font-semibold"
          >
            Inspect Detailed Thesis
          </button>
        </div>
      </div>
    </div>
  );
};
