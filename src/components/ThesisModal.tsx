import React from 'react';
import { ContrarianAsset } from '../types/terminal';
import { X, Target, ShieldCheck, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface ThesisModalProps {
  asset: ContrarianAsset | null;
  onClose: () => void;
  onLoadInChart: (asset: ContrarianAsset) => void;
  onLoadInCalculator: (asset: ContrarianAsset) => void;
}

export const ThesisModal: React.FC<ThesisModalProps> = ({
  asset,
  onClose,
  onLoadInChart,
  onLoadInCalculator,
}) => {
  if (!asset) return null;

  const isBuy = asset.zScore < 0;
  const riskDollar = Math.abs(asset.price - asset.invalidationLevel);
  const rewardDollar = Math.abs(asset.targetPrice - asset.price);
  const rrRatio = riskDollar > 0 ? (rewardDollar / riskDollar).toFixed(1) : '3.5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-[#0e1422] border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-[#0b1019]">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-xs font-mono font-bold text-slate-950">
              {asset.ticker.slice(0, 3)}
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono">
                  {asset.ticker}
                </h3>
                <span className="text-xs text-slate-400">
                  {asset.name}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                  {asset.category}
                </span>
              </div>
              <p className="text-xs text-amber-400 font-mono font-medium">
                Contrarian Signal: {asset.contrarianSignal}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs font-sans">
          {/* Executive Thesis Card */}
          <div className="bg-[#121826] border border-slate-800 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] uppercase">
              <span className="font-semibold text-slate-300">
                Core Contrarian Rationale
              </span>
              <span className="text-emerald-400 font-bold">
                Historical Win Rate: {asset.historicalWinRate}%
              </span>
            </div>
            <p className="text-slate-200 text-sm leading-relaxed">
              {asset.contrarianThesis}
            </p>
          </div>

          {/* Crowd Disparity Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#1a1215] border border-rose-950/60 rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-rose-400 font-bold block">
                Crowd Positioning: {asset.retailStance}
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Retail is holding {asset.retailLongPct}% long vs {100 - asset.retailLongPct}% short. Extreme consensus has pushed sentiment to {asset.sentimentScore}/100 ({asset.sentimentLabel}).
              </p>
            </div>

            <div className="bg-[#0f1f1d] border border-emerald-950/60 rounded-lg p-3.5 space-y-1">
              <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold block">
                Smart Money Stance: {asset.smartMoneyStance}
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                Commercial hedgers & institutional dark pools are {asset.smartMoneyLongPct}% net long, absorbing panic sell-offs at structural support.
              </p>
            </div>
          </div>

          {/* Key Execution Levels */}
          <div className="bg-[#080C14] border border-slate-800 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono">
            <div>
              <span className="text-[10px] text-slate-500 block uppercase">
                Current Price
              </span>
              <span className="text-sm font-bold text-white tabular-nums">
                ${asset.price < 10 ? asset.price.toFixed(3) : asset.price.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block uppercase">
                Invalidation Stop
              </span>
              <span className="text-sm font-bold text-rose-400 tabular-nums">
                ${asset.invalidationLevel.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block uppercase">
                Take-Profit Target
              </span>
              <span className="text-sm font-bold text-emerald-400 tabular-nums">
                ${asset.targetPrice.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block uppercase">
                Risk / Reward
              </span>
              <span className="text-sm font-bold text-amber-400 tabular-nums">
                1 : {rrRatio}
              </span>
            </div>
          </div>

          {/* Catalyst */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-slate-400 font-semibold block">
              Primary Asymmetric Catalyst:
            </span>
            <div className="flex items-start gap-2 p-3 bg-slate-900/80 border border-slate-800 rounded text-xs text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{asset.catalyst}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#0b1019] border-t border-slate-800 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              onLoadInCalculator(asset);
              onClose();
              soundEngine.playTick();
            }}
            className="px-3.5 py-2 text-xs font-mono text-slate-300 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 rounded transition-colors"
          >
            Calculate Kelly Size
          </button>

          <button
            onClick={() => {
              onLoadInChart(asset);
              onClose();
              soundEngine.playTick();
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded transition-colors flex items-center gap-1.5"
          >
            <span>Open in Terminal Chart</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
