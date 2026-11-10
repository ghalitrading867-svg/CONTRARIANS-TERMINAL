import React, { useState, useEffect, useRef } from 'react';
import { Volume2, VolumeX, Search, Radio, User, LogOut, Power, Lock, ChevronDown, Check, BookOpen, Flame } from 'lucide-react';
import { soundEngine } from '../utils/audio';
import { UserSession } from './AuthModal';

export type TabType = 'quad' | 'intel' | 'technical' | 'screener' | 'chart' | 'radar' | 'playbook' | 'calculator';

interface HeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onOpenCommand: () => void;
  isLiveTicking: boolean;
  setIsLiveTicking: React.Dispatch<React.SetStateAction<boolean>>;
  user: UserSession | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onExitTerminal: () => void;
  onOpenGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenCommand,
  isLiveTicking,
  setIsLiveTicking,
  user,
  onOpenLogin,
  onLogout,
  onExitTerminal,
  onOpenGuide,
}) => {
  const [utcTime, setUtcTime] = useState<string>('');
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showUserDropdown, setShowUserDropdown] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setUtcTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.playTick();
    }
  };

  return (
    <header className="flex items-center justify-between gap-8 px-6 py-3.5 bg-[#0B0F17] border-b border-slate-800/80 sticky top-0 z-40 backdrop-blur-md">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('quad');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap flex items-center gap-2 group"
        >
          <span className="w-6 h-6 rounded bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center text-[11px] font-mono font-bold text-slate-950 shadow-inner">
            CT
          </span>
          <span className="font-semibold text-slate-100 group-hover:text-amber-400 transition-colors">
            CONTRARIANS TERMINAL
          </span>
        </a>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-5 text-xs font-medium">
        <button
          onClick={() => {
            setActiveTab('quad');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'quad'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          4 Live USDT Charts
        </button>
        <button
          onClick={() => {
            setActiveTab('technical');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'technical'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Teknikal Analysis
        </button>
        <button
          onClick={() => {
            setActiveTab('screener');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'screener'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Screener & Sentiment
        </button>
        <button
          onClick={() => {
            setActiveTab('chart');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'chart'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Deep-Dive Chart
        </button>
        <button
          onClick={() => {
            setActiveTab('radar');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'radar'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Liquidation Radar
        </button>
        <button
          onClick={() => {
            setActiveTab('playbook');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'playbook'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Trade Playbook
        </button>
        <button
          onClick={() => {
            setActiveTab('calculator');
            soundEngine.playTick();
          }}
          className={`transition-colors whitespace-nowrap py-1 ${
            activeTab === 'calculator'
              ? 'text-amber-400 font-semibold border-b-2 border-amber-400'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Kelly Sizing
        </button>
      </nav>

      {/* Zone 3: Actions, Clock & Command */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Live ticking indicator */}
        <button
          onClick={() => {
            setIsLiveTicking(!isLiveTicking);
            soundEngine.playTick();
          }}
          title={isLiveTicking ? 'Live streaming active (click to pause)' : 'Paused (click to resume)'}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono border rounded transition-colors ${
            isLiveTicking
              ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          }`}
        >
          <Radio className={`w-3 h-3 ${isLiveTicking ? 'animate-pulse text-emerald-400' : 'text-slate-500'}`} />
          <span>{isLiveTicking ? 'LIVE' : 'PAUSED'}</span>
        </button>

        {/* UTC Time */}
        <span className="hidden sm:inline font-mono text-xs tabular-nums text-slate-400 px-2 py-1 bg-slate-900/60 border border-slate-800 rounded">
          {utcTime || '00:00:00 UTC'}
        </span>

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleMute}
          className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900/60 border border-slate-800 rounded hover:border-slate-700 transition-colors"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle audio alerts"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-500" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
        </button>

        {/* Command Palette Trigger */}
        <button
          onClick={onOpenCommand}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap"
          title="Command Palette (Cmd+K)"
        >
          <Search className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden lg:inline text-slate-300">Quick Command</span>
          <kbd className="hidden sm:inline font-mono text-[10px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
            ⌘K
          </kbd>
        </button>

        {/* User Account / Login Button */}
        <div className="relative" ref={userMenuRef}>
          {user ? (
            <div>
              <button
                onClick={() => {
                  setShowUserDropdown(!showUserDropdown);
                  soundEngine.playTick();
                }}
                className="flex items-center gap-2 px-2.5 py-1 bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/40 rounded text-xs transition-colors"
                title="Profil Trader"
              >
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-[10px] font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline text-slate-200 font-mono text-[11px] max-w-[100px] truncate">
                  {user.name}
                </span>
                <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold uppercase font-mono">
                  {user.tier}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showUserDropdown && (
                <div className="absolute right-0 mt-2 w-52 bg-[#0B0F17] border border-slate-800 rounded-lg shadow-2xl p-2 z-50 font-mono text-xs space-y-2">
                  <div className="px-2 py-1.5 border-b border-slate-800/80">
                    <p className="text-white font-bold truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                    <div className="mt-1 flex items-center gap-1.5 text-[9.5px] text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span>Terotentikasi: Sesi Aktif</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setShowUserDropdown(false);
                      onLogout();
                      soundEngine.playTick();
                    }}
                    className="w-full px-2 py-1.5 text-left text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded flex items-center gap-2 text-[11px] transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar Akun (Log Out)</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenLogin();
                soundEngine.playTick();
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded text-xs font-semibold font-mono transition-colors shadow-sm"
              title="Masuk / Login Akun"
            >
              <User className="w-3.5 h-3.5" />
              <span>Login</span>
            </button>
          )}
        </div>

        {/* Tutup Aplikasi / Exit Button */}
        <button
          onClick={() => {
            soundEngine.playTick();
            if (window.confirm('Tutup sesi Contrarians Terminal dan kembali ke Menu Awal?')) {
              onExitTerminal();
            }
          }}
          className="p-1.5 text-slate-400 hover:text-rose-400 bg-slate-900/60 border border-slate-800 hover:border-rose-900/60 rounded transition-colors flex items-center gap-1.5"
          title="Tutup Aplikasi / Kembali ke Menu Awal"
        >
          <Power className="w-3.5 h-3.5 text-rose-400" />
          <span className="hidden xl:inline text-[11px] font-mono text-slate-300">Tutup Aplikasi</span>
        </button>
      </div>
    </header>
  );
};
