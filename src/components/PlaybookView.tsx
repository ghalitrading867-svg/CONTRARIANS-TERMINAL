import React, { useState } from 'react';
import { TradePlaybook, ContrarianAsset } from '../types/terminal';
import { ShieldCheck, Target, AlertTriangle, ArrowRight, CheckCircle2, Copy, Check } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface PlaybookViewProps {
  playbooks: TradePlaybook[];
  onSelectTicker: (ticker: string) => void;
}

export const PlaybookView: React.FC<PlaybookViewProps> = ({
  playbooks,
  onSelectTicker,
}) => {
  const [filterType, setFilterType] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredPlaybooks = playbooks.filter((p) => {
    if (filterType === 'all') return true;
    return p.setupType === filterType;
  });

  const handleCopy = (pb: TradePlaybook) => {
    soundEngine.playBlip(900);
    const text = `CONTRARIAN THESIS [${pb.ticker} - ${pb.assetName}]
Setup: ${pb.setupType} | Conviction: ${pb.conviction} | R:R: ${pb.riskReward}
Entry Range: ${pb.entryRange}
Invalidation Stop: ${pb.invalidation}
Target 1: ${pb.target1} | Target 2: ${pb.target2}
Crowd Fallacy: ${pb.crowdFallacy}
Contrarian Edge: ${pb.contrarianEdge}
Catalysts:
${pb.catalysts.map((c) => `- ${c}`).join('\n')}`;

    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(pb.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Playbook Header & Filter Tabs */}
      <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-4 bg-[#0e1422] flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-white font-mono flex items-center gap-2">
            CONTRARIAN TRADE PLAYBOOK
          </h2>
          <p className="text-xs text-slate-400">
            High-conviction asymmetric trade setups exploiting extreme crowd dislocations and liquidity traps
          </p>
        </div>

        {/* Filter Segmented Buttons */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded border border-slate-800 text-xs">
          {[
            { id: 'all', label: 'All Setups' },
            { id: 'Blood in the Streets', label: 'Blood in Streets' },
            { id: 'Crowded Short Squeeze', label: 'Short Squeezes' },
            { id: 'Exhaustion Fade', label: 'Euphoria Fades' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setFilterType(tab.id);
                soundEngine.playTick();
              }}
              className={`px-3 py-1.5 rounded transition-colors whitespace-nowrap font-medium ${
                filterType === tab.id
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Playbook Cards */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {filteredPlaybooks.map((pb) => {
          const isCopied = copiedId === pb.id;

          return (
            <div
              key={pb.id}
              className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-5 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-xl"
            >
              <div>
                {/* Top Strip */}
                <div className="flex items-start justify-between gap-3 mb-3 border-b border-slate-800/60 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-lg font-bold text-white">
                        {pb.ticker}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">
                        {pb.assetName}
                      </span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          pb.conviction === 'MAXIMUM'
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/70'
                            : 'bg-amber-950/80 text-amber-300 border border-amber-800/70'
                        }`}
                      >
                        {pb.conviction} CONVICTION
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-200">
                      {pb.title}
                    </h3>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono block">
                      RISK / REWARD
                    </span>
                    <span className="text-sm font-mono font-bold text-amber-400 tabular-nums">
                      {pb.riskReward}
                    </span>
                  </div>
                </div>

                {/* Crowd Fallacy vs Contrarian Edge */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-xs">
                  <div className="bg-[#121826] border border-rose-950/50 rounded p-3">
                    <span className="text-[10px] font-mono uppercase text-rose-400 font-semibold block mb-1">
                      Crowd Consensus Fallacy
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {pb.crowdFallacy}
                    </p>
                  </div>

                  <div className="bg-[#0d1e1c] border border-emerald-950/50 rounded p-3">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-semibold block mb-1">
                      Contrarian Edge & Reality
                    </span>
                    <p className="text-slate-300 leading-relaxed text-[11px]">
                      {pb.contrarianEdge}
                    </p>
                  </div>
                </div>

                {/* Execution Levels Strip */}
                <div className="bg-[#080C14] border border-slate-800/80 rounded p-3 mb-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Entry Range
                    </span>
                    <span className="text-white font-bold tabular-nums">
                      {pb.entryRange}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Invalidation Stop
                    </span>
                    <span className="text-rose-400 font-bold tabular-nums">
                      {pb.invalidation}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Target 1
                    </span>
                    <span className="text-emerald-400 font-bold tabular-nums">
                      {pb.target1}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Target 2
                    </span>
                    <span className="text-cyan-400 font-bold tabular-nums">
                      {pb.target2}
                    </span>
                  </div>
                </div>

                {/* Catalysts */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[10px] font-mono uppercase text-slate-400 block font-semibold">
                    Key Unfolding Catalysts:
                  </span>
                  {pb.catalysts.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2 text-[11px] text-slate-300"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{cat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/60 gap-3">
                <button
                  onClick={() => handleCopy(pb)}
                  className="px-3 py-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded transition-colors flex items-center gap-1.5"
                >
                  {isCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                      <span>Copy Thesis</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    onSelectTicker(pb.ticker);
                    soundEngine.playTick();
                  }}
                  className="px-3 py-1.5 text-xs font-sans font-medium text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded transition-colors flex items-center gap-1.5"
                >
                  <span>Load Chart & Radar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
