import React, { useState } from 'react';
import { LiveContrarianChart } from './LiveContrarianChart';
import { MarketMoversStrip } from './MarketMoversStrip';
import { Timeframe, ExchangeSource } from '../services/marketApi';
import { LayoutGrid, Columns, Rows, Layers, Sparkles, RefreshCw, Flame } from 'lucide-react';
import { soundEngine } from '../utils/audio';

type GridLayoutMode = '2x2' | 'columns' | 'rows';

interface PresetBundle {
  label: string;
  pairs: [string, string, string, string];
}

const PRESETS: PresetBundle[] = [
  { label: 'Core Majors', pairs: ['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'DOGEUSDT'] },
  { label: 'Layer-1 Run', pairs: ['SOLUSDT', 'SUIUSDT', 'AVAXUSDT', 'NEARUSDT'] },
  { label: 'Memecoin Squeeze', pairs: ['DOGEUSDT', 'PEPEUSDT', 'WIFUSDT', 'SHIBUSDT'] },
  { label: 'AI & Machine', pairs: ['NEARUSDT', 'FETUSDT', 'TAOUSDT', 'LINKUSDT'] },
];

export const QuadChartGrid: React.FC = () => {
  const [pairs, setPairs] = useState<[string, string, string, string]>([
    'BTCUSDT',
    'ETHUSDT',
    'SOLUSDT',
    'DOGEUSDT',
  ]);
  const [layoutMode, setLayoutMode] = useState<GridLayoutMode>('2x2');
  const [maximizedIndex, setMaximizedIndex] = useState<number | null>(null);
  const [showMovers, setShowMovers] = useState<boolean>(true);

  const applyPreset = (preset: PresetBundle) => {
    soundEngine.playTick();
    setPairs(preset.pairs);
    setMaximizedIndex(null);
  };

  const handleSelectMover = (newSymbol: string) => {
    soundEngine.playAlertPing();
    setPairs((prev) => {
      const idx = prev.indexOf(newSymbol);
      if (idx !== -1) {
        setMaximizedIndex(idx);
        return prev;
      }
      const targetSlot = maximizedIndex !== null ? maximizedIndex : 0;
      const updated = [...prev] as [string, string, string, string];
      updated[targetSlot] = newSymbol;
      return updated;
    });
  };

  const handleToggleMaximize = (index: number) => {
    soundEngine.playTick();
    if (maximizedIndex === index) {
      setMaximizedIndex(null);
    } else {
      setMaximizedIndex(index);
    }
  };

  const gridClass = () => {
    if (maximizedIndex !== null) return 'grid grid-cols-1 gap-4';
    if (layoutMode === '2x2') return 'grid grid-cols-1 lg:grid-cols-2 gap-4';
    if (layoutMode === 'columns') return 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3';
    return 'grid grid-cols-1 gap-4'; // rows
  };

  return (
    <div className="space-y-4">
      {/* 24h Radar: Top Gainers, Top Losers, Top Revenue */}
      {showMovers && (
        <MarketMoversStrip onSelectSymbol={handleSelectMover} />
      )}
      {/* Top Controls Bar for the 4-Chart Grid */}
      <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-3 bg-[#0E1422] flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Preset Bundles */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            Watchlists:
          </span>
          <div className="flex items-center gap-1">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="px-2 py-1 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-amber-400 text-[11px] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Mode Toggles & Global Timeframe */}
        <div className="flex items-center gap-3">
          {/* Layout switches */}
          <div className="flex items-center bg-slate-900 rounded border border-slate-800 p-0.5">
            <button
              onClick={() => {
                setLayoutMode('2x2');
                setMaximizedIndex(null);
                soundEngine.playTick();
              }}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === '2x2' && maximizedIndex === null
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2x2 Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setLayoutMode('columns');
                setMaximizedIndex(null);
                soundEngine.playTick();
              }}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'columns' && maximizedIndex === null
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="4 Columns View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                setLayoutMode('rows');
                setMaximizedIndex(null);
                soundEngine.playTick();
              }}
              className={`p-1.5 rounded transition-colors ${
                layoutMode === 'rows' && maximizedIndex === null
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Stacked Rows View"
            >
              <Rows className="w-3.5 h-3.5" />
            </button>
          </div>

          {maximizedIndex !== null && (
            <button
              onClick={() => {
                setMaximizedIndex(null);
                soundEngine.playTick();
              }}
              className="px-2 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded text-[11px] font-semibold"
            >
              ← Back to 4-Chart Grid
            </button>
          )}
        </div>
      </div>

      {/* 4 Charts Grid */}
      <div className={gridClass()}>
        {pairs.map((symbol, idx) => {
          // If one chart is maximized, only render that one
          if (maximizedIndex !== null && maximizedIndex !== idx) return null;

          return (
            <LiveContrarianChart
              key={`chart-${idx}-${symbol}`}
              chartId={idx + 1}
              initialSymbol={symbol}
              initialTimeframe="1h"
              initialSource={idx % 2 === 0 ? 'binance' : 'bitget'}
              isMaximized={maximizedIndex === idx}
              onToggleMaximize={() => handleToggleMaximize(idx)}
            />
          );
        })}
      </div>
    </div>
  );
};
