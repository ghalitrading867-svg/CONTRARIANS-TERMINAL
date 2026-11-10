import React, { useState } from 'react';
import { ContrarianAsset } from '../types/terminal';
import { Calculator, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface KellyCalculatorProps {
  assets: ContrarianAsset[];
  selectedAsset: ContrarianAsset;
}

export const KellyCalculator: React.FC<KellyCalculatorProps> = ({
  assets,
  selectedAsset,
}) => {
  const [accountEquity, setAccountEquity] = useState<number>(100000);
  const [entryPrice, setEntryPrice] = useState<number>(selectedAsset.price);
  const [stopPrice, setStopPrice] = useState<number>(selectedAsset.invalidationLevel);
  const [targetPrice, setTargetPrice] = useState<number>(selectedAsset.targetPrice);
  const [winRatePct, setWinRatePct] = useState<number>(selectedAsset.historicalWinRate);
  const [kellyFraction, setKellyFraction] = useState<'half' | 'quarter' | 'full'>('half');

  // Load an asset's parameters
  const loadAssetPreset = (asset: ContrarianAsset) => {
    soundEngine.playTick();
    setEntryPrice(asset.price);
    setStopPrice(asset.invalidationLevel);
    setTargetPrice(asset.targetPrice);
    setWinRatePct(asset.historicalWinRate);
  };

  // Calculations
  const isLong = targetPrice > entryPrice;
  const riskPerShare = Math.abs(entryPrice - stopPrice);
  const rewardPerShare = Math.abs(targetPrice - entryPrice);
  const payoffRatio = riskPerShare > 0 ? rewardPerShare / riskPerShare : 1;

  const p = winRatePct / 100;
  const q = 1 - p;

  // Kelly formula: f* = (p * b - q) / b
  const fullKelly = payoffRatio > 0 ? (p * payoffRatio - q) / payoffRatio : 0;
  const clampedFullKelly = Math.max(0, Math.min(1, fullKelly));

  const fractionMultiplier = kellyFraction === 'half' ? 0.5 : kellyFraction === 'quarter' ? 0.25 : 1.0;
  const recommendedKelly = clampedFullKelly * fractionMultiplier;

  const positionSizeUsd = accountEquity * recommendedKelly;
  const numUnits = entryPrice > 0 ? positionSizeUsd / entryPrice : 0;
  const totalDollarRisk = numUnits * riskPerShare;
  const riskPctOfAccount = accountEquity > 0 ? (totalDollarRisk / accountEquity) * 100 : 0;
  const expectedValue = p * rewardPerShare - q * riskPerShare;

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0e1422] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Calculator className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono">
              CONTRARIAN KELLY POSITION SIZING & RISK ENGINE
            </h2>
            <p className="text-xs text-slate-400">
              Mathematically optimal capital allocation when trading against crowd sentiment extremes
            </p>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono">
          <span className="text-slate-500 text-[11px]">Load Preset:</span>
          {assets.slice(0, 4).map((a) => (
            <button
              key={a.id}
              onClick={() => loadAssetPreset(a)}
              className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-slate-300 hover:text-amber-400 text-[11px] transition-colors"
            >
              {a.ticker}
            </button>
          ))}
        </div>
      </div>

      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters (Left 6 Cols) */}
        <div className="lg:col-span-6 space-y-4 font-mono text-xs">
          <div>
            <label className="text-slate-400 block mb-1">
              Account Equity ($ USD)
            </label>
            <input
              type="number"
              value={accountEquity}
              onChange={(e) => setAccountEquity(Number(e.target.value))}
              className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-white font-bold tabular-nums focus:outline-none focus:border-amber-500/60"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-slate-400 block mb-1">
                Entry Price ($)
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-white tabular-nums focus:outline-none focus:border-amber-500/60"
              />
            </div>
            <div>
              <label className="text-rose-400 block mb-1">
                Stop Loss ($)
              </label>
              <input
                type="number"
                step="any"
                value={stopPrice}
                onChange={(e) => setStopPrice(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-rose-300 tabular-nums focus:outline-none focus:border-rose-500/60"
              />
            </div>
            <div>
              <label className="text-emerald-400 block mb-1">
                Target ($)
              </label>
              <input
                type="number"
                step="any"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full bg-[#080C14] border border-slate-800 rounded px-3 py-2 text-emerald-300 tabular-nums focus:outline-none focus:border-emerald-500/60"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-slate-400 mb-1">
              <span>Historical Win Probability: {winRatePct}%</span>
              <span className="text-amber-400 font-semibold">
                Payoff Ratio: {payoffRatio.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="30"
              max="95"
              value={winRatePct}
              onChange={(e) => setWinRatePct(Number(e.target.value))}
              className="w-full accent-amber-400 cursor-pointer"
            />
          </div>

          {/* Fractional Kelly Selector */}
          <div>
            <label className="text-slate-400 block mb-1.5 font-sans">
              Fractional Kelly Risk Cushion
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setKellyFraction('quarter');
                  soundEngine.playTick();
                }}
                className={`py-2 px-2 rounded border text-center transition-colors ${
                  kellyFraction === 'quarter'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                1/4 Kelly (Conservative)
              </button>
              <button
                type="button"
                onClick={() => {
                  setKellyFraction('half');
                  soundEngine.playTick();
                }}
                className={`py-2 px-2 rounded border text-center transition-colors ${
                  kellyFraction === 'half'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                1/2 Kelly (Recommended)
              </button>
              <button
                type="button"
                onClick={() => {
                  setKellyFraction('full');
                  soundEngine.playTick();
                }}
                className={`py-2 px-2 rounded border text-center transition-colors ${
                  kellyFraction === 'full'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                Full Kelly (Aggressive)
              </button>
            </div>
          </div>
        </div>

        {/* Calculated Results (Right 6 Cols) */}
        <div className="lg:col-span-6 bg-[#080C14] border border-slate-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-800/60 pb-3 mb-4">
              <span className="text-xs font-mono font-semibold text-slate-300 uppercase">
                Allocation & Guardrails
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold">
                EV: +${expectedValue.toFixed(2)}/share
              </span>
            </div>

            <div className="space-y-4 font-mono">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-400">
                  Recommended Position Size:
                </span>
                <div className="text-right">
                  <span className="text-xl font-bold text-white tabular-nums">
                    ${positionSizeUsd.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-xs text-amber-400 block font-semibold">
                    ({(recommendedKelly * 100).toFixed(1)}% of Portfolio)
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-800/40 pt-3">
                <span className="text-xs text-slate-400">Total Shares / Units:</span>
                <span className="text-base font-bold text-slate-200 tabular-nums">
                  {numUnits < 1 ? numUnits.toFixed(4) : Math.floor(numUnits).toLocaleString()} Units
                </span>
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-800/40 pt-3">
                <span className="text-xs text-rose-400 font-medium">
                  Max Dollar Risk at Stop Loss:
                </span>
                <div className="text-right">
                  <span className="text-base font-bold text-rose-400 tabular-nums">
                    -${totalDollarRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-[11px] text-slate-500 block">
                    ({riskPctOfAccount.toFixed(2)}% of Account)
                  </span>
                </div>
              </div>

              <div className="flex items-baseline justify-between border-t border-slate-800/40 pt-3">
                <span className="text-xs text-emerald-400 font-medium">
                  Expected Profit at Target:
                </span>
                <span className="text-base font-bold text-emerald-400 tabular-nums">
                  +${(numUnits * rewardPerShare).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 bg-slate-900/80 border border-slate-800 rounded text-[11px] text-slate-400 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed font-sans">
              <strong>Contrarian Rule:</strong> Half-Kelly captures 75% of maximum growth with only 50% of the drawdown volatility, protecting you from irrational extended crowd runs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
