import React from 'react';
import { MacroIndicator } from '../types/terminal';
import { TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';

interface MacroOverviewProps {
  indicators: MacroIndicator[];
  compositeScore: number;
}

export const MacroOverview: React.FC<MacroOverviewProps> = ({
  indicators,
  compositeScore,
}) => {
  // SVG gauge calculation (semi-circle from 180 deg to 0 deg)
  const radius = 70;
  const strokeWidth = 10;
  const centerX = 90;
  const centerY = 80;
  
  // Angle for compositeScore: 0 -> -180 deg, 100 -> 0 deg
  const scoreClamped = Math.max(0, Math.min(100, compositeScore));
  const angleDeg = -180 + (scoreClamped / 100) * 180;
  const angleRad = (angleDeg * Math.PI) / 180;
  const needleX = centerX + (radius - 16) * Math.cos(angleRad);
  const needleY = centerY + (radius - 16) * Math.sin(angleRad);

  return (
    <section className="bg-[#0B0F17] border-b border-slate-800/80 p-4 lg:p-5">
      <div className="max-w-[1600px] mx-auto flex flex-col xl:flex-row items-stretch gap-5">
        {/* Left: Fear & Greed Sentiment Dial */}
        <div className="xl:w-[380px] shrink-0 bg-[#0e1422] border border-slate-800/80 rounded-lg p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-slate-800/60 pb-2 mb-2">
            <span className="text-xs font-semibold text-slate-300 tracking-wide uppercase">
              Global Contrarian Sentiment
            </span>
            <span className="text-[11px] font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              BUY PANIC ZONE
            </span>
          </div>

          <div className="flex items-center justify-center py-2 relative">
            <svg width="180" height="100" viewBox="0 0 180 100" className="overflow-visible">
              {/* Background Arc: 5 Segments */}
              {/* Extreme Fear (0-25) - Emerald */}
              <path
                d="M 20 80 A 70 70 0 0 1 40.5 30.5"
                fill="none"
                stroke="#10b981"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
              {/* Fear (25-45) - Teal */}
              <path
                d="M 40.5 30.5 A 70 70 0 0 1 80 10.7"
                fill="none"
                stroke="#06b6d4"
                strokeWidth={strokeWidth}
              />
              {/* Neutral (45-55) - Slate */}
              <path
                d="M 80 10.7 A 70 70 0 0 1 100 10.7"
                fill="none"
                stroke="#64748b"
                strokeWidth={strokeWidth}
              />
              {/* Greed (55-75) - Amber */}
              <path
                d="M 100 10.7 A 70 70 0 0 1 139.5 30.5"
                fill="none"
                stroke="#f59e0b"
                strokeWidth={strokeWidth}
              />
              {/* Extreme Greed (75-100) - Red */}
              <path
                d="M 139.5 30.5 A 70 70 0 0 1 160 80"
                fill="none"
                stroke="#ef4444"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />

              {/* Pivot center */}
              <circle cx={centerX} cy={centerY} r="5" fill="#f8fafc" />

              {/* Needle */}
              <line
                x1={centerX}
                y1={centerY}
                x2={needleX}
                y2={needleY}
                stroke="#f8fafc"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>

            {/* Score in center */}
            <div className="absolute bottom-0 text-center">
              <span className="font-mono text-3xl font-bold tracking-tight text-white tabular-nums">
                {scoreClamped}
              </span>
              <span className="text-xs text-slate-400 font-mono"> / 100</span>
              <p className="text-[11px] font-semibold tracking-wider text-emerald-400 uppercase mt-0.5">
                Extreme Fear
              </p>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400 leading-relaxed">
            Market consensus is pricing deep systemic pessimism. Contrarian rule: Asymmetric upside favors scaling long when fear composite is below 25.
          </div>
        </div>

        {/* Right: Macro Dislocation Indicators Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {indicators.map((ind) => {
            const isBuy = ind.status === 'EXTREME BUY' || ind.status === 'BULLISH LEAN';
            const isSell = ind.status === 'EXTREME SELL' || ind.status === 'BEARISH LEAN';

            return (
              <div
                key={ind.name}
                className="bg-[#0e1422] border border-slate-800/80 rounded-lg p-3.5 flex flex-col justify-between hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1.5">
                    <span className="truncate font-medium">{ind.name}</span>
                    <span className="font-mono tabular-nums text-slate-300 font-semibold shrink-0 ml-1">
                      {ind.zScore}
                    </span>
                  </div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-xl font-bold font-mono text-white tabular-nums">
                      {ind.currentValue}
                    </span>
                    <span
                      className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${
                        isBuy
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-800/50'
                          : isSell
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ind.status}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-slate-300 truncate">
                    {ind.subValue}
                  </p>
                </div>

                <p className="text-[11px] text-slate-400/90 leading-normal mt-2.5 pt-2 border-t border-slate-800/50 line-clamp-2">
                  {ind.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
