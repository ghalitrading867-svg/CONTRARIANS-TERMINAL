import React, { useState } from 'react';
import { ContrarianAlert } from '../types/terminal';
import { Bell, AlertTriangle, ShieldCheck, Zap, ArrowRight, ExternalLink } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface AlertsFeedProps {
  alerts: ContrarianAlert[];
  onSelectTicker: (ticker: string) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onSelectTicker,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'extreme' | 'high'>('all');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity === 'all') return true;
    return a.severity === filterSeverity;
  });

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800/80 bg-[#0e1422] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Bell className="w-3.5 h-3.5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white font-mono flex items-center gap-2">
              CONTRARIAN DISLOCATION ALERTS
              <span className="text-[10px] text-slate-400 font-sans font-normal">
                ({filteredAlerts.length} Active)
              </span>
            </h3>
          </div>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            onClick={() => {
              setFilterSeverity('all');
              soundEngine.playTick();
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterSeverity === 'all'
                ? 'bg-amber-500/20 text-amber-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilterSeverity('extreme');
              soundEngine.playTick();
            }}
            className={`px-2 py-0.5 rounded transition-colors ${
              filterSeverity === 'extreme'
                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Extreme
          </button>
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-800/60 max-h-[380px] overflow-y-auto font-mono text-xs">
        {filteredAlerts.map((alert) => {
          const isExtreme = alert.severity === 'extreme';
          const isHigh = alert.severity === 'high';

          return (
            <div
              key={alert.id}
              onClick={() => {
                onSelectTicker(alert.ticker);
                soundEngine.playTick();
              }}
              className="p-3.5 hover:bg-slate-800/40 cursor-pointer transition-colors group flex items-start justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 tabular-nums">
                    {alert.timestamp}
                  </span>
                  <span className="font-bold text-white tracking-wide">
                    {alert.ticker}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase ${
                      isExtreme
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/80'
                        : isHigh
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/80'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {alert.severity}
                  </span>
                </div>

                <h4 className="text-xs font-semibold text-slate-200 group-hover:text-amber-400 transition-colors font-sans">
                  {alert.title}
                </h4>

                <p className="text-[11px] text-slate-400 line-clamp-2 font-sans">
                  {alert.description}
                </p>

                <div className="pt-1">
                  <span className="inline-block text-[10px] font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-1.5 py-0.5 rounded">
                    → {alert.actionRecommendation}
                  </span>
                </div>
              </div>

              <div className="shrink-0 self-center opacity-40 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
