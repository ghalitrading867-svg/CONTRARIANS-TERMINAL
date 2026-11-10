import React, { useState } from 'react';
import { X, Lock, Mail, ShieldCheck, Zap, Sparkles, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../utils/audio';

export interface UserSession {
  email: string;
  name: string;
  tier: 'PRO' | 'INSTITUTIONAL' | 'ALPHA';
  loginTime: string;
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserSession) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [name, setName] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsSubmitting(true);
    soundEngine.playTick();

    setTimeout(() => {
      const user: UserSession = {
        email,
        name: name || email.split('@')[0] || 'Contrarian Pro',
        tier: 'ALPHA',
        loginTime: new Date().toLocaleTimeString(),
      };
      localStorage.setItem('contrarians_user', JSON.stringify(user));
      setIsSubmitting(false);
      onLoginSuccess(user);
      soundEngine.playAlertPing();
      onClose();
    }, 600);
  };

  const handleInstantDemoLogin = () => {
    soundEngine.playAlertPing();
    const demoUser: UserSession = {
      email: 'alpha.trader@contrarians.terminal',
      name: 'Alpha Trader (Pro)',
      tier: 'INSTITUTIONAL',
      loginTime: new Date().toLocaleTimeString(),
    };
    localStorage.setItem('contrarians_user', JSON.stringify(demoUser));
    onLoginSuccess(demoUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B0F17] border border-slate-800 rounded-xl shadow-2xl p-6 font-mono text-slate-100 space-y-5">
        {/* Close Button */}
        <button
          onClick={() => {
            onClose();
            soundEngine.playTick();
          }}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded transition-colors"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="space-y-1 text-center">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-2">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-base font-bold text-white tracking-tight uppercase">
            {isRegisterMode ? 'Daftar Akun Trader' : 'Masuk Contrarians Terminal'}
          </h2>
          <p className="text-xs text-slate-400 font-sans">
            Akses tak terbatas ke 4-Chart live streaming, tools tarik garis teknikal, dan telemetry sentimen kontrarian.
          </p>
        </div>

        {/* 1-Click Instant Demo Login CTA */}
        <div className="p-3 bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900 border border-amber-500/40 rounded-lg space-y-2">
          <div className="flex items-center gap-2 text-xs text-amber-300 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Akses Cepat 1-Klik (Demo Pro)</span>
          </div>
          <p className="text-[11px] text-slate-400 font-sans leading-relaxed">
            Langsung masuk sebagai trader pro terverifikasi tanpa perlu verifikasi email atau password.
          </p>
          <button
            type="button"
            onClick={handleInstantDemoLogin}
            className="w-full py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>MASUK SEBAGAI ALPHA TRADER PRO</span>
          </button>
        </div>

        <div className="flex items-center gap-2 my-2 text-[10px] text-slate-500 font-sans">
          <div className="flex-1 h-px bg-slate-800" />
          <span>ATAU MASUK DENGAN EMAIL</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          {isRegisterMode && (
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Nama Lengkap / Alias</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth. Satoshi Naga"
                className="w-full px-3 py-2 bg-[#070A10] border border-slate-700/80 rounded focus:border-amber-400 focus:outline-none text-slate-100 placeholder:text-slate-600 font-sans"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Mail className="w-3 h-3 text-slate-500" />
              <span>Email Trader</span>
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="trader@domain.com"
              className="w-full px-3 py-2 bg-[#070A10] border border-slate-700/80 rounded focus:border-amber-400 focus:outline-none text-slate-100 placeholder:text-slate-600 font-sans"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 flex items-center gap-1">
              <Lock className="w-3 h-3 text-slate-500" />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 bg-[#070A10] border border-slate-700/80 rounded focus:border-amber-400 focus:outline-none text-slate-100 placeholder:text-slate-600 font-sans"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold rounded transition-colors flex items-center justify-center gap-2 mt-2"
          >
            {isSubmitting ? (
              <span className="inline-block animate-pulse">Memverifikasi Kredensial...</span>
            ) : (
              <span>{isRegisterMode ? 'Buat Akun Trader' : 'Masuk ke Terminal'}</span>
            )}
          </button>
        </form>

        {/* Toggle Mode */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              soundEngine.playTick();
            }}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-sans underline underline-offset-2"
          >
            {isRegisterMode
              ? 'Sudah punya akun? Masuk di sini'
              : 'Belum punya akun? Registrasi Akun Baru'}
          </button>
        </div>

        {/* Terminal Perks list */}
        <div className="border-t border-slate-800/80 pt-3 grid grid-cols-2 gap-2 text-[10px] text-slate-400 font-sans">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Garis Gambar Auto-Save</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>4 Chart Live Feeds</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Zero API Key Required</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            <span>Top Movers 24h Radar</span>
          </div>
        </div>
      </div>
    </div>
  );
};
