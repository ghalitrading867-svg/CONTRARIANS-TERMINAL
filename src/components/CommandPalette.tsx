import React, { useState, useEffect, useRef } from 'react';
import { ContrarianAsset } from '../types/terminal';
import { Search, Compass, TrendingUp, BarChart2, ShieldAlert, Zap, X } from 'lucide-react';
import { soundEngine } from '../utils/audio';

import { TabType } from './Header';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  assets: ContrarianAsset[];
  onSelectAsset: (asset: ContrarianAsset) => void;
  onNavigateTab: (tab: TabType) => void;
  onTriggerTick: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  assets,
  onSelectAsset,
  onNavigateTab,
  onTriggerTick,
}) => {
  const [query, setQuery] = useState<string>('');
  const [selectedIndex, setSelectedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          soundEngine.playTick();
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickNavItems = [
    { label: 'Go to 4 Live USDT Charts (Binance / Bitget)', tab: 'quad' as const, icon: BarChart2 },
    { label: 'Go to Teknikal Analysis & Multi-Oscillator Radar', tab: 'technical' as const, icon: Compass },
    { label: 'Go to Multi-Asset Screener', tab: 'screener' as const, icon: BarChart2 },
    { label: 'Go to Deep-Dive Candlestick Chart', tab: 'chart' as const, icon: TrendingUp },
    { label: 'Go to Liquidation & Squeeze Radar', tab: 'radar' as const, icon: ShieldAlert },
    { label: 'Go to Contrarian Trade Playbook', tab: 'playbook' as const, icon: Compass },
    { label: 'Go to Kelly Risk & Sizing Engine', tab: 'calculator' as const, icon: Zap },
  ];

  const matchedAssets = assets.filter(
    (a) =>
      a.ticker.toLowerCase().includes(query.toLowerCase()) ||
      a.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl bg-[#0e1422] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Search Input Bar */}
        <div className="p-3.5 border-b border-slate-800 flex items-center gap-3">
          <Search className="w-4 h-4 text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search assets, screeners, or commands (e.g. BTC, KWEB, Squeeze)..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
          />
          <button
            onClick={onClose}
            className="p-1 text-slate-500 hover:text-slate-300 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results Body */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-3 font-mono text-xs">
          {/* Quick Navigations */}
          {!query && (
            <div>
              <span className="text-[10px] uppercase text-slate-500 px-2 py-1 block font-semibold">
                Workspaces & Views
              </span>
              <div className="space-y-0.5">
                {quickNavItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => {
                        onNavigateTab(item.tab);
                        onClose();
                        soundEngine.playTick();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded text-left text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                    >
                      <Icon className="w-4 h-4 text-amber-400/80" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Matched Assets */}
          <div>
            <span className="text-[10px] uppercase text-slate-500 px-2 py-1 block font-semibold">
              Market Assets ({matchedAssets.length})
            </span>
            <div className="space-y-0.5">
              {matchedAssets.length === 0 ? (
                <div className="p-4 text-center text-slate-500 font-sans">
                  No assets found matching "{query}"
                </div>
              ) : (
                matchedAssets.map((asset) => (
                  <button
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      onNavigateTab('chart');
                      onClose();
                      soundEngine.playTick();
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded text-left text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-white text-xs">
                        {asset.ticker}
                      </span>
                      <span className="text-slate-400 font-sans text-xs truncate max-w-[200px]">
                        {asset.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="tabular-nums font-semibold text-slate-200">
                        ${asset.price < 10 ? asset.price.toFixed(3) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          asset.zScore <= -2
                            ? 'text-emerald-300 bg-emerald-950/60'
                            : asset.zScore >= 2
                            ? 'text-rose-300 bg-rose-950/60'
                            : 'text-slate-400'
                        }`}
                      >
                        {asset.zScore > 0 ? '+' : ''}
                        {asset.zScore}σ
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="p-2.5 bg-[#090D15] border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">ESC</kbd> to close
            </span>
            <span>
              <kbd className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">↵</kbd> to select
            </span>
          </div>
          <button
            onClick={() => {
              onTriggerTick();
              soundEngine.playAlertPing();
              onClose();
            }}
            className="text-amber-400 hover:text-amber-300 font-semibold"
          >
            ⚡ Simulate Market Tick
          </button>
        </div>
      </div>
    </div>
  );
};
