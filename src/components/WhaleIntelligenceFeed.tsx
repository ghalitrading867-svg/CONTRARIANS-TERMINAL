import React, { useState } from 'react';
import { initialWhaleIntel, WhaleIntelItem } from '../data/whaleIntelligenceData';
import {
  Flame,
  Radio,
  Search,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  ArrowUpRight,
  ExternalLink,
  Layers,
  Sparkles,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface WhaleIntelligenceFeedProps {
  onSelectSymbolForChart: (symbol: string) => void;
}

export const WhaleIntelligenceFeed: React.FC<WhaleIntelligenceFeedProps> = ({
  onSelectSymbolForChart,
}) => {
  const [intelList, setIntelList] = useState<WhaleIntelItem[]>(initialWhaleIntel);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const filteredItems = intelList.filter((item) => {
    if (filterType === 'x_kol' && item.sourceType !== 'x_kol') return false;
    if (filterType === 'bloomberg' && item.sourceType !== 'bloomberg') return false;
    if (filterType === 'whale_onchain' && item.sourceType !== 'whale_onchain') return false;
    if (filterType === 'bullish' && !item.stance.includes('BULLISH')) return false;
    if (filterType === 'warning' && (item.stance.includes('BULLISH') || item.stance === 'MACRO LIQUIDITY')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.author.toLowerCase().includes(q) ||
        item.handleOrAgency.toLowerCase().includes(q) ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q) ||
        item.targetSymbol.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleRefresh = () => {
    setIsRefreshing(true);
    soundEngine.playTick();
    setTimeout(() => {
      setIsRefreshing(false);
      soundEngine.playAlertPing();
    }, 500);
  };

  const getSourceBadge = (item: WhaleIntelItem) => {
    if (item.sourceType === 'bloomberg') {
      return (
        <span className="px-2 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase flex items-center gap-1 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
          Bloomberg Terminal
        </span>
      );
    }
    if (item.sourceType === 'x_kol') {
      return (
        <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold uppercase flex items-center gap-1 font-mono">
          <span className="text-[11px]">𝕏</span>
          KOL Verified
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold uppercase flex items-center gap-1 font-mono">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
        Whale On-Chain Alert
      </span>
    );
  };

  const getStanceBadge = (stance: WhaleIntelItem['stance']) => {
    if (stance === 'BULLISH ACCUMULATION') {
      return 'bg-emerald-950/80 text-emerald-300 border-emerald-800';
    }
    if (stance === 'BEARISH DISTRIBUTION') {
      return 'bg-rose-950/80 text-rose-300 border-rose-800';
    }
    if (stance === 'SQUEEZE ALERT') {
      return 'bg-amber-950/80 text-amber-300 border-amber-800';
    }
    if (stance === 'MACRO LIQUIDITY') {
      return 'bg-cyan-950/80 text-cyan-300 border-cyan-800';
    }
    return 'bg-purple-950/80 text-purple-300 border-purple-800';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Filter Strip */}
      <div className="bg-[#0B0F17] rounded-xl border border-slate-800/80 p-5 space-y-4 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h2 className="text-base sm:text-lg font-bold text-white font-mono uppercase tracking-tight flex items-center gap-2">
                <span>Whale &amp; KOL Radar — X (Twitter) &amp; Bloomberg Terminal</span>
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-sans">
              Pantau intelijen pergerakan bandar besar (*Smart Money*), akumulasi whale wallet on-chain, serta opini trader terkemuka dari X dan media finansial Bloomberg.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-mono text-xs flex items-center gap-1.5 transition-colors"
              title="Refresh Intelijen Terbaru"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-amber-400' : 'text-slate-400'}`} />
              <span>Update Feed</span>
            </button>
          </div>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            {[
              { id: 'all', label: 'Semua Intel' },
              { id: 'bloomberg', label: 'Bloomberg Terminal' },
              { id: 'x_kol', label: 'Analisa KOL (𝕏)' },
              { id: 'whale_onchain', label: 'Whale On-Chain' },
              { id: 'bullish', label: 'Bullish Akumulasi' },
              { id: 'warning', label: 'Squeeze & Risk' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => {
                  setFilterType(f.id);
                  soundEngine.playTick();
                }}
                className={`px-3 py-1.5 rounded transition-colors ${
                  filterType === f.id
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari tokoh, ticker, atau topik..."
              className="w-full pl-8 pr-3 py-1.5 bg-[#070A10] border border-slate-800 rounded text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>

      {/* Intelligence Cards Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            className="bg-[#0B0F17] hover:bg-[#0D131F] border border-slate-800/80 hover:border-slate-700 rounded-xl p-5 space-y-3.5 transition-all shadow-lg flex flex-col justify-between"
          >
            {/* Top metadata */}
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                      item.authorAvatarBg || 'bg-slate-800 text-slate-200'
                    }`}
                  >
                    {item.author.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-white text-sm">{item.author}</span>
                      {item.isVerified && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-400">{item.handleOrAgency}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  {getSourceBadge(item)}
                  <span className="text-[10px] font-mono text-slate-500">{item.timestamp}</span>
                </div>
              </div>

              {/* Title & Stance */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold uppercase ${getStanceBadge(
                      item.stance
                    )}`}
                  >
                    {item.stance}
                  </span>
                  {item.targetSymbol !== 'GLOBAL' && (
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-amber-400 text-[10px] font-mono font-bold">
                      {item.targetSymbol}
                    </span>
                  )}
                  {item.keyMetric && (
                    <span className="px-2 py-0.5 rounded bg-slate-900/90 border border-slate-800 text-slate-300 text-[10px] font-mono">
                      {item.keyMetric}
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-slate-100 text-sm font-sans leading-snug">
                  {item.title}
                </h3>
              </div>

              {/* Content body */}
              <p className="text-xs text-slate-300 font-sans leading-relaxed">
                "{item.content}"
              </p>
            </div>

            {/* Contrarian Takeaway Box & CTA */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5 mt-2">
              <div className="p-2.5 rounded bg-[#070A10] border border-amber-500/20 text-xs font-mono space-y-1">
                <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                  ★ Sudut Pandang Kontrarian:
                </span>
                <p className="text-[11px] text-slate-300 font-sans">
                  {item.contrarianInsight}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 font-mono text-xs">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <span>Conviction:</span>
                  <span
                    className={`font-bold ${
                      item.conviction === 'MAXIMUM'
                        ? 'text-emerald-400'
                        : item.conviction === 'HIGH'
                        ? 'text-amber-400'
                        : 'text-sky-400'
                    }`}
                  >
                    {item.conviction}
                  </span>
                </div>

                {item.targetSymbol !== 'GLOBAL' && (
                  <button
                    onClick={() => {
                      onSelectSymbolForChart(item.targetSymbol);
                      soundEngine.playAlertPing();
                    }}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded font-bold text-[11px] flex items-center gap-1 transition-colors shadow-sm"
                  >
                    <span>Buka di 4-Chart ({item.targetSymbol.replace('USDT', '')})</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
