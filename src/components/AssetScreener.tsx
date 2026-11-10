import React, { useState, useMemo } from 'react';
import { ContrarianAsset, AssetCategory } from '../types/terminal';
import { Search, ArrowUpDown, ChevronRight, Filter, AlertCircle, Sparkles } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AssetScreenerProps {
  assets: ContrarianAsset[];
  selectedAssetId: string;
  onSelectAsset: (asset: ContrarianAsset) => void;
  onViewThesis: (asset: ContrarianAsset) => void;
}

export const AssetScreener: React.FC<AssetScreenerProps> = ({
  assets,
  selectedAssetId,
  onSelectAsset,
  onViewThesis,
}) => {
  const [category, setCategory] = useState<AssetCategory>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyExtreme, setOnlyExtreme] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'zScore' | 'sentiment' | 'change' | 'price'>('zScore');
  const [sortAsc, setSortAsc] = useState<boolean>(true); // For zScore, most negative (deepest capitulation) first by default

  const filteredAssets = useMemo(() => {
    return assets
      .filter((a) => {
        if (category !== 'all' && a.category !== category) return false;
        if (onlyExtreme && Math.abs(a.zScore) < 2.0) return false;
        if (
          searchQuery.trim() &&
          !a.ticker.toLowerCase().includes(searchQuery.toLowerCase()) &&
          !a.name.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortBy === 'zScore') diff = a.zScore - b.zScore;
        else if (sortBy === 'sentiment') diff = a.sentimentScore - b.sentimentScore;
        else if (sortBy === 'change') diff = a.change24h - b.change24h;
        else if (sortBy === 'price') diff = a.price - b.price;
        return sortAsc ? diff : -diff;
      });
  }, [assets, category, onlyExtreme, searchQuery, sortBy, sortAsc]);

  const handleSort = (field: 'zScore' | 'sentiment' | 'change' | 'price') => {
    soundEngine.playTick();
    if (sortBy === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(field);
      setSortAsc(field === 'zScore' ? true : false);
    }
  };

  const getSignalBadgeStyle = (signal: ContrarianAsset['contrarianSignal']) => {
    switch (signal) {
      case 'STRONG ACCUMULATION':
      case 'BUY REVERSAL':
        return 'bg-emerald-950/70 text-emerald-300 border-emerald-800/80';
      case 'SHORT SQUEEZE ALERT':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/80 animate-pulse';
      case 'FADE EXHAUSTION':
      case 'TRIM EUPHORIA':
        return 'bg-rose-950/70 text-rose-300 border-rose-800/80';
      case 'MEAN REVERSION LONG':
      case 'ACCUMULATE':
        return 'bg-cyan-950/70 text-cyan-300 border-cyan-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getSentimentColor = (score: number) => {
    if (score <= 25) return 'text-emerald-400 bg-emerald-500';
    if (score <= 45) return 'text-cyan-400 bg-cyan-500';
    if (score <= 55) return 'text-slate-400 bg-slate-500';
    if (score <= 75) return 'text-amber-400 bg-amber-500';
    return 'text-rose-400 bg-rose-500';
  };

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl">
      {/* Controls Bar */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4 bg-[#0e1422]">
        {/* Categories Tab Bar */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded border border-slate-800">
          {(
            [
              { id: 'all', label: 'All Markets' },
              { id: 'equities', label: 'Equities' },
              { id: 'crypto', label: 'Crypto' },
              { id: 'commodities', label: 'Commodities' },
              { id: 'rates_fx', label: 'Rates & FX' },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                soundEngine.playTick();
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap ${
                category === cat.id
                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Extreme Dislocation Filter */}
        <div className="flex items-center gap-3 flex-1 max-w-md justify-end">
          <button
            onClick={() => {
              setOnlyExtreme(!onlyExtreme);
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 text-xs font-mono font-medium rounded border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              onlyExtreme
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3 h-3" />
            <span>Extreme Dislocation (&gt;2σ)</span>
          </button>

          <div className="relative w-full max-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or name..."
              className="w-full bg-slate-900/90 border border-slate-800 rounded pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500/60 transition-colors font-mono"
            />
          </div>
        </div>
      </div>

      {/* High-Density Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-[#080C14] text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-4 font-semibold">Asset / Ticker</th>
              <th
                onClick={() => handleSort('price')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>Price</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                </div>
              </th>
              <th
                onClick={() => handleSort('change')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>24h Chg</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                </div>
              </th>
              <th
                onClick={() => handleSort('sentiment')}
                className="py-2.5 px-4 font-semibold cursor-pointer hover:text-slate-200 min-w-[170px]"
              >
                <div className="flex items-center gap-1">
                  <span>Contrarian Sentiment</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                </div>
              </th>
              <th className="py-2.5 px-4 font-semibold min-w-[170px]">
                Crowd vs Smart Money
              </th>
              <th
                onClick={() => handleSort('zScore')}
                className="py-2.5 px-3 font-semibold cursor-pointer hover:text-slate-200 text-right"
              >
                <div className="flex items-center justify-end gap-1">
                  <span>200d Z-Score</span>
                  <ArrowUpDown className="w-3 h-3 text-slate-600" />
                </div>
              </th>
              <th className="py-2.5 px-4 font-semibold min-w-[180px]">
                Contrarian Action
              </th>
              <th className="py-2.5 px-3 font-semibold text-center w-28">
                7d Trend
              </th>
              <th className="py-2.5 px-3 font-semibold text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {filteredAssets.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-12 text-center text-slate-500 font-sans">
                  <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
                  No assets match current filters. Try resetting the search or extreme dislocation toggle.
                </td>
              </tr>
            ) : (
              filteredAssets.map((asset) => {
                const isSelected = asset.id === selectedAssetId;
                const sentimentColors = getSentimentColor(asset.sentimentScore);

                // Render mini sparkline
                const minVal = Math.min(...asset.sparkline);
                const maxVal = Math.max(...asset.sparkline);
                const range = maxVal - minVal || 1;
                const points = asset.sparkline
                  .map((val, idx) => {
                    const x = (idx / (asset.sparkline.length - 1)) * 70;
                    const y = 20 - ((val - minVal) / range) * 16;
                    return `${x},${y}`;
                  })
                  .join(' ');

                const isPositive = asset.change24h >= 0;

                return (
                  <tr
                    key={asset.id}
                    onClick={() => {
                      onSelectAsset(asset);
                      soundEngine.playTick();
                    }}
                    className={`cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-amber-500/10 border-l-2 border-l-amber-500'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Ticker & Name */}
                    <td className="py-3 px-4">
                      <div className="flex items-baseline gap-2">
                        <span className="font-bold text-slate-100 tracking-wide text-xs">
                          {asset.ticker}
                        </span>
                        <span className="text-[10px] text-slate-500 uppercase font-sans">
                          {asset.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 font-sans truncate max-w-[150px]">
                        {asset.name}
                      </div>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-100">
                      ${asset.price < 10 ? asset.price.toFixed(3) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* 24h Change */}
                    <td
                      className={`py-3 px-3 text-right font-semibold tabular-nums ${
                        isPositive ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {isPositive ? '+' : ''}
                      {asset.change24h.toFixed(2)}%
                    </td>

                    {/* Sentiment Score & Gauge */}
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={`font-semibold ${sentimentColors.split(' ')[0]}`}>
                          {asset.sentimentScore} / 100
                        </span>
                        <span className="text-[10px] text-slate-400 font-sans">
                          {asset.sentimentLabel}
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${sentimentColors.split(' ')[1]}`}
                          style={{ width: `${asset.sentimentScore}%` }}
                        />
                      </div>
                    </td>

                    {/* Crowd vs Smart Money */}
                    <td className="py-3 px-4 text-[11px]">
                      <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-sans">
                        <span>Retail: {asset.retailLongPct}% Long</span>
                        <span className="text-emerald-400 font-medium">
                          Smart: {asset.smartMoneyLongPct}%
                        </span>
                      </div>
                      {/* Split Bar */}
                      <div className="w-full bg-slate-800 rounded h-1.5 flex overflow-hidden">
                        <div
                          className="bg-rose-500/80 h-full"
                          style={{ width: `${100 - asset.smartMoneyLongPct}%` }}
                          title={`Retail/Crowd Short Exposure: ${100 - asset.retailLongPct}%`}
                        />
                        <div
                          className="bg-emerald-500 h-full"
                          style={{ width: `${asset.smartMoneyLongPct}%` }}
                          title={`Smart Money Net Long: ${asset.smartMoneyLongPct}%`}
                        />
                      </div>
                    </td>

                    {/* 200d Z-Score */}
                    <td className="py-3 px-3 text-right tabular-nums">
                      <span
                        className={`font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          asset.zScore <= -2
                            ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-800/40'
                            : asset.zScore >= 2
                            ? 'text-rose-300 bg-rose-950/60 border border-rose-800/40'
                            : 'text-slate-300'
                        }`}
                      >
                        {asset.zScore > 0 ? '+' : ''}
                        {asset.zScore.toFixed(1)}σ
                      </span>
                    </td>

                    {/* Contrarian Signal */}
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold border rounded ${getSignalBadgeStyle(
                          asset.contrarianSignal
                        )}`}
                      >
                        {asset.contrarianSignal}
                      </span>
                    </td>

                    {/* Sparkline */}
                    <td className="py-3 px-3 text-center">
                      <svg width="70" height="20" className="inline-block overflow-visible">
                        <polyline
                          fill="none"
                          stroke={isPositive ? '#10b981' : '#f43f5e'}
                          strokeWidth="1.5"
                          points={points}
                        />
                      </svg>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewThesis(asset);
                          soundEngine.playBlip(750);
                        }}
                        className="px-2 py-1 text-[11px] font-sans font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors whitespace-nowrap"
                        title="View Detailed Contrarian Thesis"
                      >
                        Thesis
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
  );
};
