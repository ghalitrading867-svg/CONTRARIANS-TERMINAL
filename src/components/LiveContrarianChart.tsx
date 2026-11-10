import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  LiveCandle,
  LiveTicker,
  ContrarianMarketData,
  ExchangeSource,
  Timeframe,
  POPULAR_USDT_PAIRS,
  fetchUnifiedKlines,
  fetchUnifiedTicker,
  fetchUnifiedContrarian,
  connectBinanceWebSocket,
} from '../services/marketApi';
import {
  TrendingUp,
  TrendingDown,
  Maximize2,
  Minimize2,
  RefreshCw,
  Radio,
  Sliders,
  ChevronDown,
  Layers,
  ShieldAlert,
  Flame,
  MousePointer,
  Minus,
  PenTool,
  GitCommit,
  Trash2,
  BoxSelect,
  ZoomIn,
  ZoomOut,
  MoveHorizontal,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

import { analyzeTechnical, calculateRSI } from '../utils/technicalAnalysis';
import { DrawingTool, DrawingItem, ChartPoint } from '../types/drawing';
import { DrawingToolbar } from './DrawingToolbar';

interface LiveContrarianChartProps {
  chartId: number;
  initialSymbol: string;
  initialTimeframe?: Timeframe;
  initialSource?: ExchangeSource;
  isMaximized: boolean;
  onToggleMaximize: () => void;
}

export const LiveContrarianChart: React.FC<LiveContrarianChartProps> = ({
  chartId,
  initialSymbol,
  initialTimeframe = '1h',
  initialSource = 'binance',
  isMaximized,
  onToggleMaximize,
}) => {
  const [symbol, setSymbol] = useState<string>(initialSymbol);
  const [timeframe, setTimeframe] = useState<Timeframe>(initialTimeframe);
  const [source, setSource] = useState<ExchangeSource>(initialSource);
  const [candles, setCandles] = useState<LiveCandle[]>([]);
  const [ticker, setTicker] = useState<LiveTicker | null>(null);
  const [contrarian, setContrarian] = useState<ContrarianMarketData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isWsLive, setIsWsLive] = useState<boolean>(false);
  const [showPairMenu, setShowPairMenu] = useState<boolean>(false);
  const [searchPair, setSearchPair] = useState<string>('');

  // Overlays & Technical indicators
  const [showBollinger, setShowBollinger] = useState<boolean>(true);
  const [showEMA, setShowEMA] = useState<boolean>(true);
  const [showPivots, setShowPivots] = useState<boolean>(false);
  const [lowerMode, setLowerMode] = useState<'volume' | 'rsi'>('volume');
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Drawing Tools State
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingTool>('none');
  const [showDrawingToolbar, setShowDrawingToolbar] = useState<boolean>(false);
  const [activeColor, setActiveColor] = useState<string>('#f59e0b');
  const [drawings, setDrawings] = useState<DrawingItem[]>([]);
  const [drawingStart, setDrawingStart] = useState<ChartPoint | null>(null);
  const [currentMousePoint, setCurrentMousePoint] = useState<ChartPoint | null>(null);

  // Pan (Geser Kiri/Kanan) & Zoom (Garis Besar vs Garis Kecil) State
  const [visibleCount, setVisibleCount] = useState<number>(45); // default 45 bars
  const [panOffset, setPanOffset] = useState<number>(0); // 0 = latest live candle at right
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartOffset, setDragStartOffset] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Load Klines, Ticker, and Contrarian positioning
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const [klines, tickData, contrarianData] = await Promise.all([
        fetchUnifiedKlines(symbol, timeframe, source, 120),
        fetchUnifiedTicker(symbol, source),
        fetchUnifiedContrarian(symbol),
      ]);

      if (klines && klines.length > 0) {
        setCandles(klines);
      }
      if (tickData) {
        setTicker(tickData);
      }
      if (contrarianData) {
        setContrarian(contrarianData);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load live data';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  }, [symbol, timeframe, source]);

  useEffect(() => {
    loadData();
    // Refresh REST poll every 12 seconds as a fallback
    const interval = setInterval(() => {
      loadData();
    }, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Connect live WebSocket for real-time sub-second updates
  useEffect(() => {
    setIsWsLive(false);
    const cleanupWs = connectBinanceWebSocket(symbol, timeframe, (livePrice, candlePart) => {
      setIsWsLive(true);
      setTicker((prev) => (prev ? { ...prev, price: livePrice } : prev));

      setCandles((prevCandles) => {
        if (!prevCandles || prevCandles.length === 0) return prevCandles;
        const updated = [...prevCandles];
        const last = { ...updated[updated.length - 1] };

        // If same candle, update high, low, close, volume
        last.close = livePrice;
        if (candlePart.high && candlePart.high > last.high) last.high = candlePart.high;
        if (candlePart.low && candlePart.low < last.low) last.low = candlePart.low;
        if (candlePart.volume) last.volume = candlePart.volume;

        updated[updated.length - 1] = last;
        return updated;
      });
    });

    return () => {
      cleanupWs();
      setIsWsLive(false);
    };
  }, [symbol, timeframe]);

  // Visible slice based on visibleCount and panOffset
  const totalCandles = candles.length;
  const endIdx = Math.min(totalCandles, Math.max(visibleCount, totalCandles - panOffset));
  const startIdx = Math.max(0, endIdx - visibleCount);
  const visibleCandles = useMemo(() => {
    if (candles.length === 0) return [];
    return candles.slice(startIdx, endIdx);
  }, [candles, startIdx, endIdx]);

  // Chart coordinate calculations based on visible window
  const { minPrice, maxPrice, maxVolume } = useMemo(() => {
    if (visibleCandles.length === 0) return { minPrice: 0, maxPrice: 100, maxVolume: 100 };
    let min = Infinity;
    let max = -Infinity;
    let maxVol = 0;

    visibleCandles.forEach((c) => {
      if (c.low < min) min = c.low;
      if (c.high > max) max = c.high;
      if (c.volume > maxVol) maxVol = c.volume;
    });

    const pad = (max - min) * 0.08 || 1;
    return {
      minPrice: min - pad,
      maxPrice: max + pad,
      maxVolume: maxVol || 1,
    };
  }, [visibleCandles]);

  const svgWidth = 600;
  const svgHeight = isMaximized ? 480 : 310;
  const priceAreaHeight = svgHeight * 0.76;
  const rightAxisWidth = 62;
  const chartWidth = svgWidth - rightAxisWidth;

  const getX = (idx: number) => {
    const step = chartWidth / (visibleCandles.length - 1 || 1);
    return idx * step;
  };

  const getY = (val: number) => {
    const range = maxPrice - minPrice || 1;
    return priceAreaHeight - ((val - minPrice) / range) * (priceAreaHeight - 16) - 8;
  };

  const getPriceFromY = (y: number) => {
    const range = maxPrice - minPrice || 1;
    const usableH = priceAreaHeight - 16;
    const ratio = (priceAreaHeight - 8 - y) / usableH;
    return minPrice + ratio * range;
  };

  const getIndexFromX = (x: number) => {
    if (visibleCandles.length <= 1) return 0;
    const step = chartWidth / (visibleCandles.length - 1);
    const idx = Math.round(x / step);
    return Math.max(0, Math.min(visibleCandles.length - 1, idx));
  };

  const getPointFromSvgEvent = (e: React.MouseEvent<SVGSVGElement>): ChartPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const clientY = e.clientY - rect.top;
    const scaleX = svgWidth / rect.width;
    const scaleY = svgHeight / rect.height;

    const svgX = Math.max(0, Math.min(chartWidth, clientX * scaleX));
    const svgY = Math.max(4, Math.min(priceAreaHeight, clientY * scaleY));
    const price = getPriceFromY(svgY);
    const candleIndex = getIndexFromX(svgX);

    return { x: svgX, y: svgY, price, candleIndex };
  };

  // Zoom & Pan Handlers
  const handleZoomIn = () => {
    soundEngine.playTick();
    setVisibleCount((prev) => Math.max(15, prev - 10)); // garis kecil (zoom in)
  };

  const handleZoomOut = () => {
    soundEngine.playTick();
    setVisibleCount((prev) => Math.min(candles.length || 120, prev + 10)); // garis besar (zoom out)
  };

  const handlePanLeft = () => {
    soundEngine.playTick();
    const maxOffset = Math.max(0, candles.length - visibleCount);
    setPanOffset((prev) => Math.min(maxOffset, prev + 10));
  };

  const handlePanRight = () => {
    soundEngine.playTick();
    setPanOffset((prev) => Math.max(0, prev - 10));
  };

  const handleResetView = () => {
    soundEngine.playTick();
    setVisibleCount(45);
    setPanOffset(0);
  };

  const handleSvgMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeDrawingTool && activeDrawingTool !== 'none' && activeDrawingTool !== 'cursor') {
      return;
    }
    if (e.button === 0) {
      setIsDragging(true);
      setDragStartX(e.clientX);
      setDragStartOffset(panOffset);
    }
  };

  const handleSvgMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleSvgWheel = (e: React.WheelEvent<SVGSVGElement>) => {
    if (e.deltaY < 0) {
      setVisibleCount((prev) => Math.max(15, prev - 5));
    } else {
      setVisibleCount((prev) => Math.min(candles.length || 120, prev + 5));
    }
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!activeDrawingTool || activeDrawingTool === 'none' || activeDrawingTool === 'cursor') return;

    const pt = getPointFromSvgEvent(e);

    if (activeDrawingTool === 'horizontal') {
      const newItem: DrawingItem = {
        id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: 'horizontal',
        p1: pt,
        color: activeColor,
      };
      setDrawings((prev) => [...prev, newItem]);
      soundEngine.playAlertPing();
      return;
    }

    if (
      activeDrawingTool === 'trendline' ||
      activeDrawingTool === 'ray' ||
      activeDrawingTool === 'fibonacci' ||
      activeDrawingTool === 'measure'
    ) {
      if (!drawingStart) {
        setDrawingStart(pt);
        soundEngine.playTick();
      } else {
        const newItem: DrawingItem = {
          id: `draw-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: activeDrawingTool,
          p1: drawingStart,
          p2: pt,
          color: activeColor,
        };
        setDrawings((prev) => [...prev, newItem]);
        setDrawingStart(null);
        setCurrentMousePoint(null);
        soundEngine.playAlertPing();
      }
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStartX;
      const candleWidth = chartWidth / (visibleCandles.length || 1);
      const candleDelta = Math.round(deltaX / candleWidth);
      const maxOffset = Math.max(0, candles.length - visibleCount);
      const nextOffset = Math.max(0, Math.min(maxOffset, dragStartOffset + candleDelta));
      setPanOffset(nextOffset);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const ratio = clientX / (rect.width * (chartWidth / svgWidth));
    const idx = Math.round(ratio * (visibleCandles.length - 1));
    if (idx >= 0 && idx < visibleCandles.length) setHoverIndex(idx);

    if (drawingStart && activeDrawingTool && activeDrawingTool !== 'none' && activeDrawingTool !== 'cursor') {
      const pt = getPointFromSvgEvent(e);
      setCurrentMousePoint(pt);
    }
  };

  const handleUndo = () => {
    setDrawings((prev) => prev.slice(0, -1));
    setDrawingStart(null);
    setCurrentMousePoint(null);
  };

  const handleClearDrawings = () => {
    setDrawings([]);
    setDrawingStart(null);
    setCurrentMousePoint(null);
  };

  // Bollinger Bands
  const { bUpper, bLower, bArea } = useMemo(() => {
    if (visibleCandles.length < 5) return { bUpper: '', bLower: '', bArea: '' };
    const upPts: string[] = [];
    const lowPts: string[] = [];

    visibleCandles.forEach((c, idx) => {
      const x = getX(idx);
      const lookback = visibleCandles.slice(Math.max(0, idx - 8), idx + 1);
      const avg = lookback.reduce((acc, curr) => acc + curr.close, 0) / lookback.length;
      const dev = (maxPrice - minPrice) * 0.07;
      upPts.push(`${x},${getY(avg + dev)}`);
      lowPts.push(`${x},${getY(avg - dev)}`);
    });

    const revLower = [...lowPts].reverse();
    const area = `M ${upPts[0]} L ${upPts.slice(1).join(' L ')} L ${revLower.join(' L ')} Z`;
    return { bUpper: upPts.join(' '), bLower: lowPts.join(' '), bArea: area };
  }, [visibleCandles, minPrice, maxPrice]);

  // 20 EMA line
  const emaPoints = useMemo(() => {
    if (visibleCandles.length < 2) return '';
    return visibleCandles
      .map((c, idx) => {
        const lookback = visibleCandles.slice(Math.max(0, idx - 12), idx + 1);
        const avg = lookback.reduce((acc, curr) => acc + curr.close, 0) / lookback.length;
        return `${getX(idx)},${getY(avg)}`;
      })
      .join(' ');
  }, [visibleCandles, minPrice, maxPrice]);

  const activeCandle = hoverIndex !== null && visibleCandles[hoverIndex] ? visibleCandles[hoverIndex] : visibleCandles[visibleCandles.length - 1];

  // Contrarian signal analysis
  const contrarianStance = useMemo(() => {
    if (!contrarian) return { label: 'NEUTRAL', color: 'text-slate-400', bg: 'bg-slate-800' };
    if (contrarian.longAccountPct >= 68) {
      return {
        label: 'CROWDED LONG ⚠️',
        color: 'text-rose-400',
        bg: 'bg-rose-950/60 border-rose-800/80',
        advice: 'Retail leverage congested in longs. Prone to sudden flush or cascade.',
      };
    }
    if (contrarian.shortAccountPct >= 62 || contrarian.fundingRate < -0.015) {
      return {
        label: 'SHORT SQUEEZE TRAP ⚡',
        color: 'text-emerald-400',
        bg: 'bg-emerald-950/60 border-emerald-800/80',
        advice: 'Aggressive crowd shorts trapped paying negative funding. High squeeze probability.',
      };
    }
    return {
      label: 'BALANCED FLOW',
      color: 'text-cyan-400',
      bg: 'bg-cyan-950/60 border-cyan-800/80',
      advice: 'Orderbook equilibrium. Awaiting crowd positioning dislocation.',
    };
  }, [contrarian]);

  // Technical analysis calculations
  const technicalAnalysis = useMemo(() => {
    return analyzeTechnical(candles, contrarian?.longAccountPct || 50);
  }, [candles, contrarian]);

  const rsiSeries = useMemo(() => {
    if (candles.length < 15) return [];
    return calculateRSI(candles.map((c) => c.close), 14);
  }, [candles]);

  const currentPrice = ticker ? ticker.price : activeCandle ? activeCandle.close : 0;
  const isPositive = ticker ? ticker.change24h >= 0 : false;

  const filteredPairs = POPULAR_USDT_PAIRS.filter(
    (p) =>
      p.symbol.toLowerCase().includes(searchPair.toLowerCase()) ||
      p.name.toLowerCase().includes(searchPair.toLowerCase())
  );

  return (
    <div
      ref={containerRef}
      className={`bg-[#0B0F17] rounded-lg border border-slate-800/90 flex flex-col overflow-hidden shadow-xl transition-all duration-200 ${
        isMaximized ? 'col-span-full h-full' : ''
      }`}
    >
      {/* Header Bar */}
      <div className="p-3 bg-[#0E1422] border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-2.5 text-xs">
        {/* Pair Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPairMenu(!showPairMenu);
              soundEngine.playTick();
            }}
            className="flex items-center gap-2 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded font-mono font-bold text-white transition-colors"
          >
            <span className="text-amber-400">#{chartId}</span>
            <span>{symbol}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showPairMenu && (
            <div className="absolute left-0 top-full mt-1 w-64 bg-[#0d131f] border border-slate-700 rounded-lg shadow-2xl z-50 p-2 font-mono text-xs">
              <input
                type="text"
                value={searchPair}
                onChange={(e) => setSearchPair(e.target.value)}
                placeholder="Search USDT pair..."
                className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-slate-200 placeholder:text-slate-500 mb-2 focus:outline-none focus:border-amber-400"
                autoFocus
              />
              <div className="max-h-48 overflow-y-auto space-y-0.5">
                {filteredPairs.map((p) => (
                  <button
                    key={p.symbol}
                    onClick={() => {
                      setSymbol(p.symbol);
                      setShowPairMenu(false);
                      setSearchPair('');
                      soundEngine.playTick();
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-left transition-colors ${
                      symbol === p.symbol
                        ? 'bg-amber-500/20 text-amber-300 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span>{p.icon}</span>
                      <span>{p.symbol}</span>
                    </div>
                    <span className="text-[10px] text-slate-500">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Live Price & Change */}
        <div className="flex items-baseline gap-2 font-mono">
          <span className="text-sm font-bold text-white tabular-nums">
            ${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          {ticker && (
            <span
              className={`text-[11px] font-semibold tabular-nums ${
                isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {isPositive ? '+' : ''}
              {ticker.change24h.toFixed(2)}%
            </span>
          )}
        </div>

        {/* Contrarian & TA Positioning Pill */}
        <div className="flex items-center gap-2 text-[10px] font-mono">
          {contrarian && (
            <div className="hidden sm:flex items-center gap-2">
              <span
                className={`px-1.5 py-0.5 rounded border font-semibold ${contrarianStance.bg} ${contrarianStance.color}`}
                title={contrarianStance.advice}
              >
                {contrarianStance.label}
              </span>
              <span className="text-slate-400">
                L: <strong className="text-emerald-400">{contrarian.longAccountPct}%</strong> / S:{' '}
                <strong className="text-rose-400">{contrarian.shortAccountPct}%</strong>
              </span>
            </div>
          )}
          {technicalAnalysis && (
            <span
              className={`hidden md:inline px-1.5 py-0.5 rounded border font-bold ${
                technicalAnalysis.summary.verdict.includes('BUY')
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-800'
                  : technicalAnalysis.summary.verdict.includes('SELL')
                  ? 'bg-rose-950/70 text-rose-300 border-rose-800'
                  : 'bg-slate-800 text-slate-300 border-slate-700'
              }`}
              title={`Technical Consensus: ${technicalAnalysis.summary.verdict} (RSI: ${technicalAnalysis.rsi14})`}
            >
              TA: {technicalAnalysis.summary.verdict}
            </span>
          )}
        </div>

        {/* Controls: Timeframe, Source, Maximize */}
        <div className="flex items-center gap-1.5">
          {/* Timeframe */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 font-mono text-[10px]">
            {(['1m', '5m', '15m', '1h', '4h', '1d'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => {
                  setTimeframe(tf);
                  soundEngine.playTick();
                }}
                className={`px-1.5 py-0.5 transition-colors ${
                  timeframe === tf
                    ? 'bg-amber-500/20 text-amber-300 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>

          {/* Source Toggle: Binance vs Bitget */}
          <button
            onClick={() => {
              const next = source === 'binance' ? 'bitget' : 'binance';
              setSource(next);
              soundEngine.playTick();
            }}
            className="px-2 py-0.5 text-[10px] font-mono rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white uppercase transition-colors"
            title={`Switch exchange source (Current: ${source})`}
          >
            {source === 'binance' ? 'BNC' : 'BGT'}
          </button>

          {/* Live WS indicator */}
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono"
            title={isWsLive ? 'Live WebSocket Streaming Active' : 'Polling REST API'}
          >
            <Radio
              className={`w-2.5 h-2.5 ${isWsLive ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`}
            />
            <span className={isWsLive ? 'text-emerald-400' : 'text-slate-500'}>
              {isWsLive ? 'LIVE' : 'REST'}
            </span>
          </div>

          {/* Zoom & Pan Viewport Controls (Garis Besar vs Garis Kecil) */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5 text-[10px] font-mono">
            {/* Zoom Out: Garis Besar */}
            <button
              onClick={handleZoomOut}
              disabled={visibleCount >= (candles.length || 120)}
              className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 rounded transition-colors disabled:opacity-30"
              title="Garis Besar (Zoom Out untuk melihat struktur tren makro)"
            >
              <ZoomOut className="w-3 h-3 inline mr-0.5" />
              <span className="hidden xl:inline">Besar</span>
            </button>

            {/* Zoom In: Garis Kecil */}
            <button
              onClick={handleZoomIn}
              disabled={visibleCount <= 15}
              className="px-1.5 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-emerald-300 rounded transition-colors disabled:opacity-30"
              title="Garis Kecil (Zoom In untuk melihat detail candlestick tebal)"
            >
              <ZoomIn className="w-3 h-3 inline mr-0.5" />
              <span className="hidden xl:inline">Kecil</span>
            </button>

            <div className="w-px h-3 bg-slate-800 mx-0.5" />

            {/* Pan Left */}
            <button
              onClick={handlePanLeft}
              disabled={panOffset >= Math.max(0, candles.length - visibleCount)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded transition-colors disabled:opacity-30"
              title="Geser ke Kiri (Lihat candle historis lampau)"
            >
              <ChevronLeft className="w-3 h-3" />
            </button>

            {/* Pan Right */}
            <button
              onClick={handlePanRight}
              disabled={panOffset <= 0}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-amber-300 rounded transition-colors disabled:opacity-30"
              title="Geser ke Kanan (Kembali ke candle live)"
            >
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Reset View */}
            {(panOffset > 0 || visibleCount !== 45) && (
              <button
                onClick={handleResetView}
                className="px-1.5 py-0.5 text-amber-400 hover:bg-amber-500/20 rounded font-bold transition-colors ml-0.5"
                title="Reset View (Kembali ke live default)"
              >
                Reset
              </button>
            )}
          </div>

          {/* Fullscreen / Maximize */}
          <button
            onClick={onToggleMaximize}
            className="p-1 rounded bg-slate-900 border border-slate-800 hover:text-amber-400 text-slate-400 transition-colors"
            title={isMaximized ? 'Restore 4-chart grid' : 'Maximize chart'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Hover Info & Overlays Kicker Bar */}
      {activeCandle && (
        <div className="px-3 py-1 bg-[#090D15] border-b border-slate-800/60 flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] overflow-x-auto">
            <span>{activeCandle.timeStr}</span>
            <span>O:<strong className="text-slate-200 ml-0.5">${activeCandle.open}</strong></span>
            <span>H:<strong className="text-slate-200 ml-0.5">${activeCandle.high}</strong></span>
            <span>L:<strong className="text-slate-200 ml-0.5">${activeCandle.low}</strong></span>
            <span>C:<strong className="text-slate-200 ml-0.5">${activeCandle.close}</strong></span>
            {technicalAnalysis && (
              <span className="hidden xl:inline text-amber-400/90">
                RSI:{technicalAnalysis.rsi14}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <button
              onClick={() => {
                setShowBollinger(!showBollinger);
                soundEngine.playTick();
              }}
              className={`px-1.5 py-0.2 rounded border transition-colors ${showBollinger ? 'bg-cyan-950/80 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title="Toggle Bollinger Bands (20, 2σ)"
            >
              BB
            </button>
            <button
              onClick={() => {
                setShowEMA(!showEMA);
                soundEngine.playTick();
              }}
              className={`px-1.5 py-0.2 rounded border transition-colors ${showEMA ? 'bg-amber-950/80 text-amber-300 border-amber-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title="Toggle 20 EMA Line"
            >
              EMA
            </button>
            <button
              onClick={() => {
                setShowPivots(!showPivots);
                soundEngine.playTick();
              }}
              className={`px-1.5 py-0.2 rounded border transition-colors ${showPivots ? 'bg-purple-950/80 text-purple-300 border-purple-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title="Toggle Pivot Points (R1, P, S1)"
            >
              Pivots
            </button>
            <button
              onClick={() => {
                setLowerMode(lowerMode === 'volume' ? 'rsi' : 'volume');
                soundEngine.playTick();
              }}
              className={`px-1.5 py-0.2 rounded border transition-colors ${lowerMode === 'rsi' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800' : 'bg-slate-900 text-slate-500 border-slate-800'}`}
              title="Toggle Lower Pane: Volume vs RSI(14)"
            >
              {lowerMode === 'volume' ? 'RSI' : 'VOL'}
            </button>
          </div>
        </div>
      )}

      {/* Chart Canvas Area */}
      <div className="flex-1 bg-[#070A11] relative select-none flex items-center justify-center min-h-[220px]">
        {/* Floating Drawing Toolbar */}
        <div className="absolute top-2 left-2 z-30">
          <DrawingToolbar
            activeTool={activeDrawingTool}
            setActiveTool={(t) => {
              setActiveDrawingTool(t);
              setDrawingStart(null);
              setCurrentMousePoint(null);
            }}
            activeColor={activeColor}
            setActiveColor={setActiveColor}
            drawingsCount={drawings.length}
            onClearAll={handleClearDrawings}
            onUndo={handleUndo}
            isVisible={showDrawingToolbar}
            onToggleVisibility={() => setShowDrawingToolbar(!showDrawingToolbar)}
          />
        </div>

        {/* Floating Historical Navigation Banner */}
        {panOffset > 0 && (
          <div className="absolute top-2 right-2 z-20">
            <button
              onClick={handleResetView}
              className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/50 text-[10px] font-mono flex items-center gap-1.5 shadow-lg transition-colors animate-pulse"
              title="Klik untuk kembali ke candle live real-time"
            >
              <span>⏪ Historis (-{panOffset} candle)</span>
              <span className="font-bold underline text-amber-200">Lompat ke Live ⏩</span>
            </button>
          </div>
        )}

        {isLoading && candles.length === 0 ? (
          <div className="flex flex-col items-center gap-2 text-slate-500 font-mono text-xs">
            <RefreshCw className="w-5 h-5 animate-spin text-amber-500" />
            <span>Fetching live candles from {source.toUpperCase()}...</span>
          </div>
        ) : errorMsg ? (
          <div className="text-center p-4 text-rose-400 font-mono text-xs">
            <ShieldAlert className="w-6 h-6 mx-auto mb-1 text-rose-500" />
            <span>{errorMsg}</span>
            <button
              onClick={loadData}
              className="mt-2 block mx-auto px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded"
            >
              Retry
            </button>
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className={`w-full h-full overflow-visible select-none ${
              activeDrawingTool && activeDrawingTool !== 'none' && activeDrawingTool !== 'cursor'
                ? 'cursor-crosshair'
                : isDragging
                ? 'cursor-grabbing'
                : 'cursor-grab'
            }`}
            onClick={handleSvgClick}
            onMouseDown={handleSvgMouseDown}
            onMouseMove={handleSvgMouseMove}
            onMouseUp={handleSvgMouseUp}
            onWheel={handleSvgWheel}
            onMouseLeave={() => {
              setHoverIndex(null);
              handleSvgMouseUp();
              if (!drawingStart) setCurrentMousePoint(null);
            }}
          >
            {/* Horizontal Grid lines */}
            {[0.2, 0.4, 0.6, 0.8].map((ratio, idx) => {
              const y = priceAreaHeight * ratio;
              const priceLevel = minPrice + (maxPrice - minPrice) * (1 - ratio);
              return (
                <g key={`grid-${idx}`}>
                  <line
                    x1={0}
                    y1={y}
                    x2={chartWidth}
                    y2={y}
                    stroke="#162032"
                    strokeWidth="0.8"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={chartWidth + 6}
                    y={y + 3.5}
                    fill="#64748b"
                    fontSize="9.5"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    ${priceLevel < 1 ? priceLevel.toFixed(4) : priceLevel.toFixed(2)}
                  </text>
                </g>
              );
            })}

            {/* Volume bars or RSI Mode */}
            {lowerMode === 'volume' &&
              visibleCandles.map((c, idx) => {
                const x = getX(idx);
                const barWidth = Math.max(3, (chartWidth / visibleCandles.length) * 0.6);
                const volRatio = c.volume / maxVolume;
                const barH = volRatio * (svgHeight - priceAreaHeight - 10);
                const isUp = c.close >= c.open;

                return (
                  <rect
                    key={`v-${idx}`}
                    x={x - barWidth / 2}
                    y={svgHeight - barH - 4}
                    width={barWidth}
                    height={barH}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    opacity={0.2}
                  />
                );
              })}

            {/* Lower Pane: RSI(14) Mode */}
            {lowerMode === 'rsi' && rsiSeries.length > 0 && (
              <g>
                <line
                  x1={0}
                  y1={priceAreaHeight + 4}
                  x2={chartWidth}
                  y2={priceAreaHeight + 4}
                  stroke="#1e293b"
                  strokeWidth="0.8"
                />
                <line
                  x1={0}
                  y1={svgHeight - 6 - 40 * 0.7}
                  x2={chartWidth}
                  y2={svgHeight - 6 - 40 * 0.7}
                  stroke="#f43f5e"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                  opacity="0.5"
                />
                <line
                  x1={0}
                  y1={svgHeight - 6 - 40 * 0.3}
                  x2={chartWidth}
                  y2={svgHeight - 6 - 40 * 0.3}
                  stroke="#10b981"
                  strokeWidth="0.7"
                  strokeDasharray="2 2"
                  opacity="0.5"
                />
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="1.2"
                  points={rsiSeries
                    .map((val, idx) => {
                      const x = getX(idx);
                      const yRsi = svgHeight - 6 - 40 * (val / 100);
                      return `${x},${yRsi}`;
                    })
                    .join(' ')}
                />
                <text
                  x={chartWidth + 4}
                  y={svgHeight - 14}
                  fill="#10b981"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  RSI: {technicalAnalysis ? technicalAnalysis.rsi14 : '---'}
                </text>
              </g>
            )}

            {/* Pivot Points S/R Overlay */}
            {showPivots && technicalAnalysis && (
              <g opacity={0.7}>
                <line
                  x1={0}
                  y1={getY(technicalAnalysis.pivots.r1)}
                  x2={chartWidth}
                  y2={getY(technicalAnalysis.pivots.r1)}
                  stroke="#f43f5e"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth + 6}
                  y={getY(technicalAnalysis.pivots.r1) + 3}
                  fill="#f43f5e"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  R1
                </text>

                <line
                  x1={0}
                  y1={getY(technicalAnalysis.pivots.pivot)}
                  x2={chartWidth}
                  y2={getY(technicalAnalysis.pivots.pivot)}
                  stroke="#f59e0b"
                  strokeWidth="0.9"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth + 6}
                  y={getY(technicalAnalysis.pivots.pivot) + 3}
                  fill="#f59e0b"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  P
                </text>

                <line
                  x1={0}
                  y1={getY(technicalAnalysis.pivots.s1)}
                  x2={chartWidth}
                  y2={getY(technicalAnalysis.pivots.s1)}
                  stroke="#10b981"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text
                  x={chartWidth + 6}
                  y={getY(technicalAnalysis.pivots.s1) + 3}
                  fill="#10b981"
                  fontSize="8"
                  fontFamily="JetBrains Mono, monospace"
                >
                  S1
                </text>
              </g>
            )}

            {/* Bollinger Bands */}
            {showBollinger && (
              <>
                <path d={bArea} fill="#06b6d4" opacity="0.05" />
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                  opacity="0.35"
                  points={bUpper}
                />
                <polyline
                  fill="none"
                  stroke="#06b6d4"
                  strokeWidth="0.9"
                  strokeDasharray="2 2"
                  opacity="0.35"
                  points={bLower}
                />
              </>
            )}

            {/* 20 EMA */}
            {showEMA && (
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="1.2"
                opacity="0.75"
                points={emaPoints}
              />
            )}

            {/* Candlesticks */}
            {visibleCandles.map((c, idx) => {
              const x = getX(idx);
              const yOpen = getY(c.open);
              const yClose = getY(c.close);
              const yHigh = getY(c.high);
              const yLow = getY(c.low);
              const isUp = c.close >= c.open;
              const barWidth = Math.max(3.5, (chartWidth / visibleCandles.length) * 0.65);

              const top = Math.min(yOpen, yClose);
              const height = Math.max(1.8, Math.abs(yClose - yOpen));

              return (
                <g key={`c-${idx}`}>
                  {/* Wick */}
                  <line
                    x1={x}
                    y1={yHigh}
                    x2={x}
                    y2={yLow}
                    stroke={isUp ? '#10b981' : '#f43f5e'}
                    strokeWidth="1.1"
                  />
                  {/* Candle Body */}
                  <rect
                    x={x - barWidth / 2}
                    y={top}
                    width={barWidth}
                    height={height}
                    fill={isUp ? '#10b981' : '#f43f5e'}
                    rx={0.5}
                  />
                </g>
              );
            })}

            {/* Live price horizontal dashed line */}
            {currentPrice > 0 && (
              <g>
                <line
                  x1={0}
                  y1={getY(currentPrice)}
                  x2={chartWidth}
                  y2={getY(currentPrice)}
                  stroke={isPositive ? '#10b981' : '#f43f5e'}
                  strokeWidth="0.9"
                  strokeDasharray="3 2"
                />
                <rect
                  x={chartWidth + 2}
                  y={getY(currentPrice) - 7}
                  width={58}
                  height={14}
                  fill={isPositive ? '#065f46' : '#881337'}
                  rx={2}
                />
                <text
                  x={chartWidth + 5}
                  y={getY(currentPrice) + 3}
                  fill="#ffffff"
                  fontSize="8.5"
                  fontFamily="JetBrains Mono, monospace"
                  fontWeight="bold"
                >
                  ${currentPrice < 1 ? currentPrice.toFixed(4) : currentPrice.toFixed(2)}
                </text>
              </g>
            )}

            {/* Hover Crosshair */}
            {hoverIndex !== null && visibleCandles[hoverIndex] && (
              <g>
                <line
                  x1={getX(hoverIndex)}
                  y1={0}
                  x2={getX(hoverIndex)}
                  y2={svgHeight}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  opacity="0.4"
                />
                <line
                  x1={0}
                  y1={getY(visibleCandles[hoverIndex].close)}
                  x2={chartWidth}
                  y2={getY(visibleCandles[hoverIndex].close)}
                  stroke="#ffffff"
                  strokeWidth="0.8"
                  strokeDasharray="2 2"
                  opacity="0.4"
                />
              </g>
            )}

            {/* Render Saved User Drawings */}
            {drawings.map((item) => {
              if (item.type === 'horizontal') {
                const yPos = getY(item.p1.price);
                return (
                  <g key={item.id}>
                    <line
                      x1={0}
                      y1={yPos}
                      x2={chartWidth}
                      y2={yPos}
                      stroke={item.color}
                      strokeWidth="1.5"
                      strokeDasharray="4 2"
                    />
                    <rect
                      x={chartWidth + 2}
                      y={yPos - 6}
                      width={58}
                      height={12}
                      fill={item.color}
                      rx={2}
                      opacity="0.9"
                    />
                    <text
                      x={chartWidth + 5}
                      y={yPos + 3}
                      fill="#000000"
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      ${item.p1.price < 1 ? item.p1.price.toFixed(4) : item.p1.price.toFixed(2)}
                    </text>
                  </g>
                );
              }

              if (item.type === 'trendline') {
                const p2 = item.p2 || item.p1;
                return (
                  <g key={item.id}>
                    <line
                      x1={item.p1.x}
                      y1={item.p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke={item.color}
                      strokeWidth="2"
                    />
                    <circle cx={item.p1.x} cy={item.p1.y} r={3} fill={item.color} />
                    <circle cx={p2.x} cy={p2.y} r={3} fill={item.color} />
                  </g>
                );
              }

              if (item.type === 'ray') {
                if (!item.p2) return null;
                const dx = item.p2.x - item.p1.x;
                const dy = item.p2.y - item.p1.y;
                let endX = chartWidth;
                let endY = item.p2.y;
                if (Math.abs(dx) > 0.001) {
                  const slope = dy / dx;
                  endY = item.p1.y + slope * (chartWidth - item.p1.x);
                }
                return (
                  <g key={item.id}>
                    <line
                      x1={item.p1.x}
                      y1={item.p1.y}
                      x2={endX}
                      y2={endY}
                      stroke={item.color}
                      strokeWidth="1.8"
                    />
                    <circle cx={item.p1.x} cy={item.p1.y} r={3} fill={item.color} />
                  </g>
                );
              }

              if (item.type === 'fibonacci') {
                if (!item.p2) return null;
                const topPrice = Math.max(item.p1.price, item.p2.price);
                const bottomPrice = Math.min(item.p1.price, item.p2.price);
                const range = topPrice - bottomPrice;
                const fibLevels = [
                  { pct: '100%', val: 1.0, color: '#f43f5e' },
                  { pct: '78.6%', val: 0.786, color: '#a855f7' },
                  { pct: '61.8%', val: 0.618, color: '#f59e0b' },
                  { pct: '50.0%', val: 0.5, color: '#38bdf8' },
                  { pct: '38.2%', val: 0.382, color: '#34d399' },
                  { pct: '23.6%', val: 0.236, color: '#94a3b8' },
                  { pct: '0.0%', val: 0.0, color: '#10b981' },
                ];
                const y50 = getY(bottomPrice + range * 0.5);
                const y618 = getY(bottomPrice + range * 0.618);

                return (
                  <g key={item.id} opacity="0.9">
                    <rect
                      x={0}
                      y={Math.min(y50, y618)}
                      width={chartWidth}
                      height={Math.max(1, Math.abs(y50 - y618))}
                      fill="#f59e0b"
                      opacity="0.12"
                    />
                    {fibLevels.map((lvl) => {
                      const lvlPrice = bottomPrice + range * lvl.val;
                      const yPos = getY(lvlPrice);
                      return (
                        <g key={`${item.id}-${lvl.pct}`}>
                          <line
                            x1={0}
                            y1={yPos}
                            x2={chartWidth}
                            y2={yPos}
                            stroke={lvl.color}
                            strokeWidth="0.8"
                            strokeDasharray="3 2"
                          />
                          <text
                            x={chartWidth + 3}
                            y={yPos + 3}
                            fill={lvl.color}
                            fontSize="7.5"
                            fontFamily="JetBrains Mono, monospace"
                          >
                            Fib {lvl.pct}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              }

              if (item.type === 'measure') {
                if (!item.p2) return null;
                const leftX = Math.min(item.p1.x, item.p2.x);
                const topY = Math.min(item.p1.y, item.p2.y);
                const w = Math.abs(item.p2.x - item.p1.x);
                const h = Math.abs(item.p2.y - item.p1.y);
                const priceDelta = item.p2.price - item.p1.price;
                const pctDelta = (priceDelta / (item.p1.price || 1)) * 100;
                const bars = Math.abs(item.p2.candleIndex - item.p1.candleIndex);
                const isUp = priceDelta >= 0;

                return (
                  <g key={item.id}>
                    <rect
                      x={leftX}
                      y={topY}
                      width={w}
                      height={h}
                      fill={isUp ? '#10b981' : '#f43f5e'}
                      opacity="0.14"
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="1"
                      strokeDasharray="2 2"
                    />
                    <rect
                      x={leftX + w / 2 - 42}
                      y={topY + h / 2 - 8}
                      width={84}
                      height={16}
                      fill="#0B0F17"
                      stroke={isUp ? '#10b981' : '#f43f5e'}
                      strokeWidth="0.8"
                      rx={3}
                    />
                    <text
                      x={leftX + w / 2}
                      y={topY + h / 2 + 3}
                      textAnchor="middle"
                      fill={isUp ? '#34d399' : '#fb7185'}
                      fontSize="8"
                      fontFamily="JetBrains Mono, monospace"
                      fontWeight="bold"
                    >
                      {isUp ? '+' : ''}{pctDelta.toFixed(2)}% ({bars}b)
                    </text>
                  </g>
                );
              }

              return null;
            })}

            {/* In-Progress Drawing Preview */}
            {drawingStart && currentMousePoint && (
              <g opacity="0.8">
                {activeDrawingTool === 'trendline' && (
                  <>
                    <line
                      x1={drawingStart.x}
                      y1={drawingStart.y}
                      x2={currentMousePoint.x}
                      y2={currentMousePoint.y}
                      stroke={activeColor}
                      strokeWidth="1.8"
                      strokeDasharray="3 3"
                    />
                    <circle cx={drawingStart.x} cy={drawingStart.y} r={3} fill={activeColor} />
                    <circle cx={currentMousePoint.x} cy={currentMousePoint.y} r={3} fill={activeColor} />
                  </>
                )}
                {activeDrawingTool === 'ray' && (
                  <line
                    x1={drawingStart.x}
                    y1={drawingStart.y}
                    x2={currentMousePoint.x}
                    y2={currentMousePoint.y}
                    stroke={activeColor}
                    strokeWidth="1.8"
                    strokeDasharray="3 3"
                  />
                )}
                {activeDrawingTool === 'measure' && (
                  <rect
                    x={Math.min(drawingStart.x, currentMousePoint.x)}
                    y={Math.min(drawingStart.y, currentMousePoint.y)}
                    width={Math.abs(currentMousePoint.x - drawingStart.x)}
                    height={Math.abs(currentMousePoint.y - drawingStart.y)}
                    fill={activeColor}
                    opacity="0.1"
                    stroke={activeColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}
                {activeDrawingTool === 'fibonacci' && (
                  <line
                    x1={0}
                    y1={currentMousePoint.y}
                    x2={chartWidth}
                    y2={currentMousePoint.y}
                    stroke={activeColor}
                    strokeWidth="1"
                    strokeDasharray="3 2"
                  />
                )}
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Bottom Contrarian Telemetry Strip */}
      <div className="p-2 bg-[#0A0E17] border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 uppercase">Signal:</span>
          <span className={`font-semibold ${contrarianStance.color}`}>
            {contrarianStance.label}
          </span>
          <span className="hidden sm:inline text-slate-600">·</span>
          <span className="hidden sm:inline text-slate-400 truncate max-w-[260px]">
            {contrarianStance.advice || 'Live market feed'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500">24h Vol:</span>
          <span className="text-slate-300 font-semibold">
            {ticker ? `$${(ticker.volumeQuote / 1000000).toFixed(1)}M` : '---'}
          </span>
        </div>
      </div>
    </div>
  );
};
