import React from 'react';
import { DrawingTool } from '../types/drawing';
import { MousePointer, TrendingUp, Minus, ArrowRight, Trash2, Undo2, Ruler } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface DrawingToolbarProps {
  activeTool: DrawingTool;
  setActiveTool: (tool: DrawingTool) => void;
  activeColor: string;
  setActiveColor: (color: string) => void;
  drawingsCount: number;
  onClearAll: () => void;
  onUndo: () => void;
  isVisible: boolean;
  onToggleVisibility: () => void;
}

const COLORS = [
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Emerald', hex: '#10b981' },
  { name: 'Rose', hex: '#f43f5e' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Purple', hex: '#a855f7' },
];

export const DrawingToolbar: React.FC<DrawingToolbarProps> = ({
  activeTool,
  setActiveTool,
  activeColor,
  setActiveColor,
  drawingsCount,
  onClearAll,
  onUndo,
  isVisible,
  onToggleVisibility,
}) => {
  if (!isVisible) {
    return (
      <button
        onClick={() => {
          onToggleVisibility();
          soundEngine.playTick();
        }}
        className="px-2 py-1 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1 shadow-md transition-colors"
        title="Buka Alat Tarik Garis Teknikal (Trendline, Horiz S/R, Fib%, Measure)"
      >
        <TrendingUp className="w-3 h-3 text-amber-400" />
        <span>Tarik Garis</span>
        {drawingsCount > 0 && (
          <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 text-[9px] flex items-center justify-center font-bold">
            {drawingsCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1 p-1 bg-[#0b1019]/95 border border-slate-700/80 rounded-lg shadow-2xl backdrop-blur-md z-30 font-mono text-[10px]">
      {/* Pointer / Cursor */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('none');
          soundEngine.playTick();
        }}
        className={`p-1.5 rounded transition-colors ${
          activeTool === 'none' || activeTool === 'cursor'
            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Kursor Biasa"
      >
        <MousePointer className="w-3.5 h-3.5" />
      </button>

      {/* Trendline Tool */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('trendline');
          soundEngine.playTick();
        }}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          activeTool === 'trendline'
            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Tarik Garis Tren (Trendline: Klik titik awal, lalu klik titik akhir)"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Trendline</span>
      </button>

      {/* Horizontal Line Tool (Support / Resistance) */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('horizontal');
          soundEngine.playTick();
        }}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          activeTool === 'horizontal'
            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Garis Horizontal Support / Resistance (Klik 1x di level harga)"
      >
        <Minus className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Horiz S/R</span>
      </button>

      {/* Fibonacci Retracement */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('fibonacci');
          soundEngine.playTick();
        }}
        className={`px-2 py-1 rounded flex items-center gap-1 transition-colors ${
          activeTool === 'fibonacci'
            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Fibonacci Retracement (Klik swing 1, lalu klik swing 2)"
      >
        <span className="text-[10px] font-bold">Fib%</span>
      </button>

      {/* Ray Tool */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('ray');
          soundEngine.playTick();
        }}
        className={`p-1.5 rounded transition-colors ${
          activeTool === 'ray'
            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Garis Ray (Memanjang ke kanan)"
      >
        <ArrowRight className="w-3.5 h-3.5" />
      </button>

      {/* Price Measure Box */}
      <button
        type="button"
        onClick={() => {
          setActiveTool('measure');
          soundEngine.playTick();
        }}
        className={`p-1.5 rounded transition-colors ${
          activeTool === 'measure'
            ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        }`}
        title="Ukur Rentang Harga & Persentase Pips"
      >
        <Ruler className="w-3.5 h-3.5" />
      </button>

      {/* Divider */}
      <div className="h-4 w-px bg-slate-800 mx-1" />

      {/* Color picker */}
      <div className="flex items-center gap-1">
        {COLORS.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => {
              setActiveColor(c.hex);
              soundEngine.playTick();
            }}
            className={`w-3.5 h-3.5 rounded-full transition-transform ${
              activeColor === c.hex ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
            }`}
            style={{ backgroundColor: c.hex }}
            title={`Warna: ${c.name}`}
          />
        ))}
      </div>

      {/* Divider */}
      <div className="h-4 w-px bg-slate-800 mx-1" />

      {/* Undo */}
      {drawingsCount > 0 && (
        <button
          type="button"
          onClick={() => {
            onUndo();
            soundEngine.playTick();
          }}
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          title="Batalkan Garis Terakhir"
        >
          <Undo2 className="w-3 h-3" />
        </button>
      )}

      {/* Clear all */}
      {drawingsCount > 0 && (
        <button
          type="button"
          onClick={() => {
            onClearAll();
            soundEngine.playTick();
          }}
          className="p-1.5 rounded text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 transition-colors"
          title="Hapus Semua Garis di Chart Ini"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      )}

      {/* Close Toolbar */}
      <button
        type="button"
        onClick={() => {
          onToggleVisibility();
          setActiveTool('none');
          soundEngine.playTick();
        }}
        className="px-1.5 py-0.5 rounded text-[9px] text-slate-500 hover:text-slate-300 ml-0.5"
      >
        Tutup
      </button>
    </div>
  );
};
