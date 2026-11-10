import React, { useState, useEffect } from 'react';
import { MarketMoversData, fetchUnifiedMarketMovers } from '../services/marketApi';
import { TrendingUp, TrendingDown, DollarSign, Flame, ArrowUpRight, ArrowDownRight, RefreshCw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface MarketMoversStripProps {
  onSelectSymbol: (symbol: string) => void;
}

export const MarketMoversStrip: React.FC<MarketMoversStripProps> = ({ onSelectSymbol }) => {
  const [data, setData] = useState<MarketMoversData | null>(null);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers' | 'revenue'>('gainers');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const result = await fetchUnifiedMarketMovers();
      setData(result);
    } catch {
      // Handled by fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, []);

  if (!data) return null;

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-3.5 space-y-3 font-mono text-xs shadow-xl">
      {/* Top Header & Tab Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400" />
          <span className="font-bold text-white uppercase text-xs">
            Market Movers — 24h Radar
          </span>
        </div>

        {/* Segmented Category Buttons */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded p-0.5 text-[11px]">
          <button
            onClick={() => {
              setActiveTab('gainers');
              soundEngine.playTick();
            }}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'gainers'
                ? 'bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-800/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            <span>Top Gainers ({data.gainers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('losers');
              soundEngine.playTick();
            }}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'losers'
                ? 'bg-rose-950/80 text-rose-300 font-bold border border-rose-800/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TrendingDown className="w-3 h-3 text-rose-400" />
            <span>Top Losers ({data.losers.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('revenue');
              soundEngine.playTick();
            }}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1.5 ${
              activeTab === 'revenue'
                ? 'bg-amber-950/80 text-amber-300 font-bold border border-amber-800/70'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-3 h-3 text-amber-400" />
            <span>Top Revenue / Turnover</span>
          </button>
        </div>
      </div>

      {/* Horizontal Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {(activeTab === 'gainers' ? data.gainers : activeTab === 'losers' ? data.losers : data.topRevenue).map(
          (item) => {
            const isPositive = item.change24h >= 0;
            return (
              <button
                key={item.symbol}
                onClick={() => {
                  onSelectSymbol(item.symbol);
                  soundEngine.playTick();
                }}
                className="bg-[#080C14] hover:bg-slate-800/60 border border-slate-800/80 hover:border-amber-500/40 rounded p-2 text-left transition-all duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-100 group-hover:text-amber-400 transition-colors text-[11px] truncate">
                    {item.symbol.replace('USDT', '')}
                  </span>
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      isPositive ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {isPositive ? '+' : ''}
                    {item.change24h.toFixed(1)}%
                  </span>
                </div>

                <div className="text-[11px] font-bold text-white tabular-nums mt-0.5">
                  ${item.price < 1 ? item.price.toFixed(4) : item.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>

                <div className="text-[9.5px] text-slate-500 truncate mt-0.5">
                  Vol: ${(item.volumeQuote / 1000000).toFixed(0)}M
                </div>
              </button>
            );
          }
        )}
      </div>
    </div>
  );
};
