import React from 'react';
import { ContrarianAsset } from '../types/terminal';
import { Flame, ShieldAlert, ArrowUpRight, ArrowDownRight, Zap } from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface LiquidationRadarProps {
  asset: ContrarianAsset;
  onSelectAsset?: (asset: ContrarianAsset) => void;
}

export const LiquidationRadar: React.FC<LiquidationRadarProps> = ({ asset }) => {
  // Compute liquidation cluster estimates
  const currentPrice = asset.price;
  const isCrowdedShort = asset.retailStance === 'CROWDED SHORT' || asset.retailStance === 'LEAN SHORT';
  const squeezeProbability = Math.min(
    95,
    Math.max(
      15,
      Math.round(
        (100 - asset.sentimentScore) * 0.5 +
          (100 - asset.retailLongPct) * 0.4 +
          (asset.shortInterestPct || 10) * 1.5
      )
    )
  );

  // Generate synthetic liquidation depth tiers
  const upperLevels = [
    { pct: '+2.0%', price: currentPrice * 1.02, volumeM: 142, density: 45 },
    { pct: '+4.5%', price: currentPrice * 1.045, volumeM: 388, density: 85 },
    { pct: '+7.0%', price: currentPrice * 1.07, volumeM: 520, density: 95 }, // Peak squeeze cluster
    { pct: '+10.0%', price: currentPrice * 1.10, volumeM: 210, density: 50 },
  ];

  const lowerLevels = [
    { pct: '-2.0%', price: currentPrice * 0.98, volumeM: 95, density: 30 },
    { pct: '-4.5%', price: currentPrice * 0.955, volumeM: 180, density: 45 },
    { pct: '-7.0%', price: currentPrice * 0.93, volumeM: 260, density: 60 },
    { pct: '-10.0%', price: currentPrice * 0.90, volumeM: 310, density: 70 },
  ];

  return (
    <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 overflow-hidden shadow-2xl flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 bg-[#0e1422] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white font-mono flex items-center gap-2">
              LIQUIDATION & SQUEEZE RADAR
              <span className="text-[11px] text-amber-400 font-sans font-normal">
                [{asset.ticker}]
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Stop-loss density mapping and market-maker liquidity sweep targets
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-mono block">
              SQUEEZE PROBABILITY
            </span>
            <span
              className={`font-mono text-base font-bold tabular-nums ${
                squeezeProbability > 70
                  ? 'text-amber-400'
                  : squeezeProbability < 40
                  ? 'text-rose-400'
                  : 'text-slate-300'
              }`}
            >
              {squeezeProbability}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upper Clusters & Lower Clusters */}
      <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Upper Liquidation Pool (Short Squeeze Zone) */}
        <div className="bg-[#090D15] border border-slate-800/80 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-amber-400 flex items-center gap-1.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                OVERHEAD SHORT LIQUIDATION POOL
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Cascade Trigger: ${asset.liquidationUpper.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Retail stop losses stacked above resistance. A break into this zone forces automatic algorithmic buy-to-covers.
            </p>

            <div className="space-y-2 font-mono text-xs">
              {upperLevels.map((lvl) => (
                <div key={lvl.pct} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>
                      {lvl.pct} (${lvl.price.toFixed(2)})
                    </span>
                    <span className="text-amber-300 font-semibold tabular-nums">
                      ${lvl.volumeM}M Liquidations
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/60 rounded h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-amber-600 to-amber-400 h-full rounded"
                      style={{ width: `${lvl.density}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Total Overhead Liquidity:</span>
            <span className="text-amber-400 font-bold">$1,260,000,000</span>
          </div>
        </div>

        {/* Lower Liquidation Pool (Long Flush Zone) */}
        <div className="bg-[#090D15] border border-slate-800/80 rounded p-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                <ArrowDownRight className="w-3.5 h-3.5" />
                DOWNSIDE LONG LIQUIDATION POOL
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                Cascade Trigger: ${asset.liquidationLower.toFixed(2)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Leveraged late bulls risk margin wipeout if price pierces key support thresholds.
            </p>

            <div className="space-y-2 font-mono text-xs">
              {lowerLevels.map((lvl) => (
                <div key={lvl.pct} className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-300">
                    <span>
                      {lvl.pct} (${lvl.price.toFixed(2)})
                    </span>
                    <span className="text-rose-400 font-semibold tabular-nums">
                      ${lvl.volumeM}M Liquidations
                    </span>
                  </div>
                  <div className="w-full bg-slate-800/60 rounded h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-rose-700 to-rose-500 h-full rounded"
                      style={{ width: `${lvl.density}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs font-mono">
            <span className="text-slate-500">Total Downside Liquidity:</span>
            <span className="text-rose-400 font-bold">$845,000,000</span>
          </div>
        </div>
      </div>

      {/* Derivative Positioning & Short Float Metrics */}
      <div className="p-4 bg-[#0e1422] border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-500 block uppercase">
            8h Perp Funding Rate
          </span>
          <span
            className={`font-bold tabular-nums ${
              (asset.fundingRate8h || 0) < 0
                ? 'text-emerald-400'
                : (asset.fundingRate8h || 0) > 0.03
                ? 'text-rose-400'
                : 'text-slate-300'
            }`}
          >
            {asset.fundingRate8h ? `${(asset.fundingRate8h * 100).toFixed(3)}%` : 'N/A (Cash Spot)'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {asset.fundingRate8h && asset.fundingRate8h < 0 ? 'Shorts paying longs' : 'Neutral cost'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 block uppercase">
            Short Interest Float %
          </span>
          <span className="font-bold text-slate-200 tabular-nums">
            {asset.shortInterestPct ? `${asset.shortInterestPct}%` : '4.2%'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            {asset.shortInterestPct && asset.shortInterestPct > 12 ? 'Heavy borrow demand' : 'Normal'}
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 block uppercase">
            Days to Cover
          </span>
          <span className="font-bold text-amber-400 tabular-nums">
            {asset.daysToCover ? `${asset.daysToCover} Days` : '1.8 Days'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Liquidity exit bottleneck
          </span>
        </div>

        <div>
          <span className="text-[10px] text-slate-500 block uppercase">
            Contrarian Skew
          </span>
          <span className="font-bold text-emerald-400">
            {isCrowdedShort ? 'ASYMMETRIC LONG SQUEEZE' : 'HIGH BLOW-OFF RISK'}
          </span>
          <span className="text-[10px] text-slate-500 block">
            Crowd consensus trap
          </span>
        </div>
      </div>
    </div>
  );
};
