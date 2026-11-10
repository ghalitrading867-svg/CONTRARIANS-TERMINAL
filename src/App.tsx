import React, { useState, useEffect, useCallback } from 'react';
import { Header, TabType } from './components/Header';
import { MacroOverview } from './components/MacroOverview';
import { QuadChartGrid } from './components/QuadChartGrid';
import { TechnicalAnalysisView } from './components/TechnicalAnalysisView';
import { AssetScreener } from './components/AssetScreener';
import { InteractiveChart } from './components/InteractiveChart';
import { LiquidationRadar } from './components/LiquidationRadar';
import { PlaybookView } from './components/PlaybookView';
import { KellyCalculator } from './components/KellyCalculator';
import { AlertsFeed } from './components/AlertsFeed';
import { CommandPalette } from './components/CommandPalette';
import { ThesisModal } from './components/ThesisModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { AuthModal, UserSession } from './components/AuthModal';
import {
  initialAssets,
  macroIndicators,
  initialAlerts,
  tradePlaybooks,
} from './data/mockMarketData';
import { ContrarianAsset, ContrarianAlert } from './types/terminal';
import { soundEngine } from './utils/audio';
import { Terminal, Shield, Zap, TrendingUp, BarChart3, LayoutGrid } from 'lucide-react';

export default function App() {
  const [isInTerminal, setIsInTerminal] = useState<boolean>(() => {
    return localStorage.getItem('contrarians_entered') === 'true';
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const stored = localStorage.getItem('contrarians_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [activeTab, setActiveTab] = useState<TabType>('quad');
  const [assets, setAssets] = useState<ContrarianAsset[]>(initialAssets);
  const [selectedAssetId, setSelectedAssetId] = useState<string>('kweb');
  const [alerts, setAlerts] = useState<ContrarianAlert[]>(initialAlerts);
  const [isLiveTicking, setIsLiveTicking] = useState<boolean>(true);
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [thesisModalAsset, setThesisModalAsset] = useState<ContrarianAsset | null>(null);

  const selectedAsset = assets.find((a) => a.id === selectedAssetId) || assets[0];

  // Function to simulate a live market tick across assets
  const triggerTick = useCallback(() => {
    setAssets((prev) =>
      prev.map((asset) => {
        // Random micro tick between -0.3% and +0.3%
        const deltaPct = (Math.random() - 0.49) * 0.4;
        const newPrice = Number((asset.price * (1 + deltaPct / 100)).toFixed(asset.price < 10 ? 3 : 2));
        const newChange = Number((asset.change24h + deltaPct * 0.2).toFixed(2));

        // Occasionally tweak sentiment by 1 point
        let newSentiment = asset.sentimentScore;
        if (Math.random() > 0.6) {
          const sentDelta = Math.random() > 0.5 ? 1 : -1;
          newSentiment = Math.max(8, Math.min(94, asset.sentimentScore + sentDelta));
        }

        // Update latest candle close
        const updatedCandles = [...asset.candles];
        if (updatedCandles.length > 0) {
          const lastCandle = { ...updatedCandles[updatedCandles.length - 1] };
          lastCandle.close = newPrice;
          if (newPrice > lastCandle.high) lastCandle.high = newPrice;
          if (newPrice < lastCandle.low) lastCandle.low = newPrice;
          lastCandle.sentiment = newSentiment;
          updatedCandles[updatedCandles.length - 1] = lastCandle;
        }

        return {
          ...asset,
          price: newPrice,
          change24h: newChange,
          sentimentScore: newSentiment,
          candles: updatedCandles,
        };
      })
    );
  }, []);

  // Live ticking timer
  useEffect(() => {
    if (!isLiveTicking) return;
    const interval = setInterval(() => {
      triggerTick();
    }, 3200);

    return () => clearInterval(interval);
  }, [isLiveTicking, triggerTick]);

  // Periodic simulated breaking dislocation alert
  useEffect(() => {
    if (!isLiveTicking) return;
    const alertInterval = setInterval(() => {
      const randomAsset = assets[Math.floor(Math.random() * assets.length)];
      const now = new Date();
      const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(
        now.getUTCMinutes()
      ).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`;

      const newAlert: ContrarianAlert = {
        id: `alt-${Date.now()}`,
        timestamp: timeStr,
        ticker: randomAsset.ticker,
        assetName: randomAsset.name,
        severity: Math.random() > 0.4 ? 'extreme' : 'high',
        type: randomAsset.zScore < 0 ? 'capitulation' : 'euphoria_peak',
        title:
          randomAsset.zScore < 0
            ? `${randomAsset.ticker} Capitulation Vol Surge: Z-Score ${randomAsset.zScore}σ`
            : `${randomAsset.ticker} Retail Mania Skew at 92% Long Capacity`,
        description:
          randomAsset.zScore < 0
            ? `Institutional dark pools absorbing panic sell orders at historical support. Asymmetric bounce probability 82%.`
            : `Margin leverage exhausted. Commercial hedgers initiating gamma hedges.`,
        actionRecommendation:
          randomAsset.zScore < 0 ? 'ACCUMULATE DISLOCATION' : 'FADE RALLY / HEDGE',
      };

      setAlerts((prev) => [newAlert, ...prev.slice(0, 15)]);
      soundEngine.playAlertPing();
    }, 24000);

    return () => clearInterval(alertInterval);
  }, [isLiveTicking, assets]);

  // Keyboard shortcut listener for Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectAsset = (asset: ContrarianAsset) => {
    setSelectedAssetId(asset.id);
  };

  const handleSelectTicker = (ticker: string) => {
    const found = assets.find((a) => a.ticker === ticker);
    if (found) {
      setSelectedAssetId(found.id);
      setActiveTab('chart');
    }
  };

  const handleEnterTerminal = () => {
    setIsInTerminal(true);
    localStorage.setItem('contrarians_entered', 'true');
    soundEngine.playAlertPing();
  };

  const handleExitTerminal = () => {
    setIsInTerminal(false);
    localStorage.removeItem('contrarians_entered');
    soundEngine.playTick();
  };

  const handleLoginSuccess = (loggedInUser: UserSession) => {
    setUser(loggedInUser);
    setIsInTerminal(true);
    localStorage.setItem('contrarians_entered', 'true');
  };

  const handleLogout = () => {
    localStorage.removeItem('contrarians_user');
    setUser(null);
  };

  if (!isInTerminal) {
    return (
      <>
        <WelcomeScreen
          onEnterTerminal={handleEnterTerminal}
          onOpenLogin={() => setIsAuthModalOpen(true)}
          isLoggedIn={!!user}
          userName={user?.name}
        />
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col font-sans selection:bg-amber-500/20 selection:text-amber-300">
      {/* 3-Zone Top Navigation Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenCommand={() => setIsCommandOpen(true)}
        isLiveTicking={isLiveTicking}
        setIsLiveTicking={setIsLiveTicking}
        user={user}
        onOpenLogin={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onExitTerminal={handleExitTerminal}
      />

      {/* Macro Sentiment & High-Frequency Dislocation Header */}
      <MacroOverview
        indicators={macroIndicators}
        compositeScore={21}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 lg:p-6 space-y-6">
        {/* VIEW 0: 4 LIVE USDT CHARTS (BINANCE / BITGET PUBLIC STREAMS) */}
        {activeTab === 'quad' && (
          <div className="space-y-6">
            <QuadChartGrid />

            {/* Live Contrarian Anomaly Stream below the 4 charts */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <LiquidationRadar asset={selectedAsset} />
              </div>
              <div className="lg:col-span-4">
                <AlertsFeed
                  alerts={alerts}
                  onSelectTicker={handleSelectTicker}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW: TEKNIKAL ANALYSIS WORKSPACE */}
        {activeTab === 'technical' && (
          <TechnicalAnalysisView
            initialSymbol={selectedAsset.ticker.replace('/USD', 'USDT').replace('/', '')}
            onSelectTickerForChart={(ticker) => {
              const matched = assets.find(
                (a) => a.ticker.replace('/USD', '').replace('USDT', '') === ticker.replace('USDT', '')
              );
              if (matched) setSelectedAssetId(matched.id);
              setActiveTab('chart');
            }}
          />
        )}

        {/* VIEW 1: SCREENER & DISLOCATIONS */}
        {activeTab === 'screener' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              {/* Screener Table (Left 8 Cols) */}
              <div className="xl:col-span-8">
                <AssetScreener
                  assets={assets}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={handleSelectAsset}
                  onViewThesis={(asset) => setThesisModalAsset(asset)}
                />
              </div>

              {/* Real-time Alerts & Active Focus Pane (Right 4 Cols) */}
              <div className="xl:col-span-4 space-y-6">
                <AlertsFeed
                  alerts={alerts}
                  onSelectTicker={handleSelectTicker}
                />

                {/* Quick Focus Card on Selected Asset */}
                <div className="bg-[#0B0F17] rounded-lg border border-slate-800/80 p-4 space-y-3 shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white text-sm">
                        {selectedAsset.ticker}
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedAsset.name}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('chart');
                        soundEngine.playTick();
                      }}
                      className="text-xs text-amber-400 hover:text-amber-300 font-mono font-semibold"
                    >
                      Open Full Chart →
                    </button>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedAsset.contrarianThesis}
                  </p>

                  <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-1">
                    <div className="bg-[#090D15] p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Z-Score</span>
                      <span className="font-bold text-emerald-400">{selectedAsset.zScore}σ</span>
                    </div>
                    <div className="bg-[#090D15] p-2 rounded border border-slate-800">
                      <span className="text-[10px] text-slate-500 block">Win Rate</span>
                      <span className="font-bold text-slate-200">{selectedAsset.historicalWinRate}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 2: TERMINAL CHART & OSCILLATOR */}
        {activeTab === 'chart' && (
          <div className="space-y-6">
            <InteractiveChart
              asset={selectedAsset}
              onViewThesis={(asset) => setThesisModalAsset(asset)}
            />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <LiquidationRadar asset={selectedAsset} />
              </div>
              <div className="lg:col-span-4">
                <AlertsFeed
                  alerts={alerts}
                  onSelectTicker={handleSelectTicker}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: LIQUIDATION & SQUEEZE RADAR */}
        {activeTab === 'radar' && (
          <div className="space-y-6">
            <LiquidationRadar asset={selectedAsset} />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-8">
                <AssetScreener
                  assets={assets}
                  selectedAssetId={selectedAssetId}
                  onSelectAsset={handleSelectAsset}
                  onViewThesis={(asset) => setThesisModalAsset(asset)}
                />
              </div>
              <div className="lg:col-span-4">
                <AlertsFeed
                  alerts={alerts}
                  onSelectTicker={handleSelectTicker}
                />
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: TRADE PLAYBOOK */}
        {activeTab === 'playbook' && (
          <PlaybookView
            playbooks={tradePlaybooks}
            onSelectTicker={handleSelectTicker}
          />
        )}

        {/* VIEW 5: KELLY POSITION SIZING */}
        {activeTab === 'calculator' && (
          <KellyCalculator
            assets={assets}
            selectedAsset={selectedAsset}
          />
        )}
      </main>

      {/* Terminal Footer */}
      <footer className="border-t border-slate-800/80 bg-[#070A10] px-6 py-4 mt-auto">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-amber-500" />
            <span>CONTRARIANS TERMINAL WORKSTATION</span>
            <span>·</span>
            <span>REAL-TIME DISLOCATION INTELLIGENCE</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Press <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">⌘K</kbd> for command palette</span>
            <span>·</span>
            <span className="text-emerald-400">● Live Binance &amp; Bitget Feeds (Zero API Key)</span>
          </div>
        </div>
      </footer>

      {/* Modal Dialogs */}
      <ThesisModal
        asset={thesisModalAsset}
        onClose={() => setThesisModalAsset(null)}
        onLoadInChart={(asset) => {
          setSelectedAssetId(asset.id);
          setActiveTab('chart');
        }}
        onLoadInCalculator={(asset) => {
          setSelectedAssetId(asset.id);
          setActiveTab('calculator');
        }}
      />

      <CommandPalette
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        assets={assets}
        onSelectAsset={handleSelectAsset}
        onNavigateTab={(tab) => setActiveTab(tab)}
        onTriggerTick={triggerTick}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </div>
  );
}
