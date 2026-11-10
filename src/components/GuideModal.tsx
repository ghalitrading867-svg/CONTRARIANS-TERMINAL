import React, { useState } from 'react';
import {
  X,
  BookOpen,
  MoveHorizontal,
  ZoomIn,
  ZoomOut,
  TrendingUp,
  Flame,
  Radio,
  Compass,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  Layers,
} from 'lucide-react';
import { soundEngine } from '../utils/audio';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterTerminal?: () => void;
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onEnterTerminal,
}) => {
  const [activeTab, setActiveTab] = useState<'pan_zoom' | 'drawing' | 'whale' | 'contrarian' | 'movers'>('pan_zoom');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0B0F17] border border-slate-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden font-sans text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800/80 bg-[#090D15] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-mono font-bold text-base text-white uppercase tracking-tight flex items-center gap-2">
                <span>Buku Panduan Penggunaan Contrarians Terminal</span>
              </h2>
              <p className="text-xs text-slate-400 font-sans">
                Pelajari cara navigasi multi-chart, alat gambar teknikal, geser chart, hingga intelijen whale.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onClose();
              soundEngine.playTick();
            }}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Tutup Panduan"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-6 border-b border-slate-800 bg-[#080C14] flex items-center gap-2 overflow-x-auto text-xs font-mono py-2.5">
          <button
            onClick={() => {
              setActiveTab('pan_zoom');
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'pan_zoom'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <MoveHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>1. Geser &amp; Zoom Chart</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('drawing');
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'drawing'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            <span>2. Tarik Garis Teknikal</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('whale');
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'whale'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-orange-400" />
            <span>3. Whale 𝕏 &amp; Bloomberg</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('contrarian');
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'contrarian'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400" />
            <span>4. Sentimen Kontrarian</span>
          </button>

          <button
            onClick={() => {
              setActiveTab('movers');
              soundEngine.playTick();
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'movers'
                ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            <span>5. Top Movers 24h</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-slate-300 text-sm leading-relaxed">
          {/* TAB 1: PAN & ZOOM */}
          {activeTab === 'pan_zoom' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <MoveHorizontal className="w-4 h-4 text-amber-400" />
                  <span>Cara Tarik Geser Chart ke Kiri dan ke Kanan (Panning)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Setiap chart memuat hingga ratusan candle historis. Anda dapat menyusuri candle masa lalu atau kembali ke candle real-time dengan sangat mudah:
                </p>
                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300 pt-1">
                  <li>
                    <strong className="text-amber-300">Drag Mouse (Klik &amp; Tahan):</strong> Pada mode kursor biasa, klik pada area grafik lalu seret ke kiri untuk melihat histori masa lalu, atau seret ke kanan untuk kembali ke harga terkini.
                  </li>
                  <li>
                    <strong className="text-amber-300">Tombol Pan Panah [← / →]:</strong> Tersedia tombol panah di bilah kontrol chart untuk menggeser chart per segmen secara presisi.
                  </li>
                  <li>
                    <strong className="text-amber-300">Tombol Reset:</strong> Jika Anda sedang berada di riwayat lama, klik badge status atau tombol <em>Reset</em> untuk langsung melompat kembali ke candle live streaming terbaru.
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-emerald-400" />
                  <span>Melihat Chart Secara Garis Besar vs Garis Kecil (Zoom)</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Gunakan tombol zoom atau scroll mouse wheel untuk berpindah perspektif:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-lg bg-[#070A10] border border-slate-800 space-y-1">
                    <span className="text-xs font-mono font-bold text-cyan-400 block">
                      [-] Garis Besar (Macro View)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Menampilkan hingga 100-120 bar candle. Sangat ideal untuk melihat tren struktural jangka panjang, support &amp; resistance mayor, serta siklus market besar.
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#070A10] border border-slate-800 space-y-1">
                    <span className="text-xs font-mono font-bold text-emerald-400 block">
                      [+] Garis Kecil (Micro View)
                    </span>
                    <p className="text-[11px] text-slate-400">
                      Memperbesar hingga 15-25 bar candle berukuran tebal. Sangat ideal untuk membedah aksi harga detil, panjang sumbu penolakan (*pinbar wick*), dan eksekusi presisi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DRAWING TOOLS */}
          {activeTab === 'drawing' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Alat Gambar Analisis Teknikal Interaktif</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Klik tombol <strong>"Tarik Garis"</strong> di sudut kiri atas setiap chart untuk memunculkan bilah alat teknikal:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono">
                  <div className="p-2.5 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-amber-400 font-bold block mb-1">1. Trendline (Garis Tren)</span>
                    <span className="text-[11px] text-slate-400 font-sans block">
                      Klik 1x pada titik swing awal, lalu klik 1x pada titik swing kedua untuk menyambungkan garis tren support/resistance miring.
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-amber-400 font-bold block mb-1">2. Horiz S/R (Horizontal S/R)</span>
                    <span className="text-[11px] text-slate-400 font-sans block">
                      Cukup klik 1x di level harga manapun, garis horizontal putus-putus akan langsung terbentang otomatis beserta label harga di sumbu kanan.
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-amber-400 font-bold block mb-1">3. Fib% (Fibonacci Retracement)</span>
                    <span className="text-[11px] text-slate-400 font-sans block">
                      Klik titik lembah lalu titik puncak (atau sebaliknya). Rasio 0%, 23.6%, 38.2%, 50%, 61.8% (*Golden Pocket* emas), dan 78.6% akan otomatis terproyeksi.
                    </span>
                  </div>

                  <div className="p-2.5 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-amber-400 font-bold block mb-1">4. Ruler / Measure Box</span>
                    <span className="text-[11px] text-slate-400 font-sans block">
                      Ukur rentang kenaikan/penurunan harga dalam persen (%), selisih nominal dolar ($), serta durasi jumlah batang candle.
                    </span>
                  </div>
                </div>

                <div className="pt-2 text-xs text-slate-400 border-t border-slate-800">
                  <span className="text-slate-300 font-bold">Kustomisasi Garis:</span> Pilih dari 5 warna (Amber, Emerald, Rose, Cyan, Purple), gunakan tombol <strong>Undo</strong> untuk membatalkan garis terakhir, atau <strong>Hapus Semua</strong> untuk membersihkan canvas.
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: WHALE & BLOOMBERG */}
          {activeTab === 'whale' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Radar Whale &amp; Analisa KOL dari X dan Bloomberg</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Di tab navigasi <strong>"Whale &amp; Bloomberg Intel"</strong>, Anda dapat memantau pergerakan uang pintar (*Smart Money*) yang menggerakkan pasar sebelum tercium oleh publik umum:
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded bg-[#070A10] border border-slate-800 flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 font-mono font-bold text-[10px] shrink-0">
                      𝕏 KOL
                    </span>
                    <div>
                      <span className="font-bold text-white block">Analisa Tokoh Berpengaruh</span>
                      <p className="text-slate-400 text-[11px]">
                        Opini terverifikasi dari Arthur Hayes (Maelstrom), Michael Saylor (MicroStrategy), Murad Mahmudov, Cobie, dan PlanB mengenai likuiditas makro dan rotasi pasar.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#070A10] border border-slate-800 flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-mono font-bold text-[10px] shrink-0">
                      BLOOMBERG
                    </span>
                    <div>
                      <span className="font-bold text-white block">Intelijen Institusi &amp; ETF Net Inflow</span>
                      <p className="text-slate-400 text-[11px]">
                        Laporan arus masuk bersih Spot Bitcoin ETF BlackRock/Fidelity, data open interest derivatif CME, serta analisis suku bunga The Fed.
                      </p>
                    </div>
                  </div>

                  <div className="p-2.5 rounded bg-[#070A10] border border-slate-800 flex items-start gap-2.5">
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px] shrink-0">
                      ON-CHAIN
                    </span>
                    <div>
                      <span className="font-bold text-white block">Aliran Wallet Paus &amp; Pencetakan USDT</span>
                      <p className="text-slate-400 text-[11px]">
                        Pelacakan pergerakan koin dalam jumlah jutaan dolar yang dipindahkan ke cold storage atau bursa derivatif.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CONTRARIAN SENTIMENT */}
          {activeTab === 'contrarian' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <Compass className="w-4 h-4 text-cyan-400" />
                  <span>Prinsip Trading Kontrarian: Mengapa 90% Ritel Kalah?</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Pasar derivatif kripto digerakkan oleh likuiditas. Ketika mayoritas trader ritel kompak membuka posisi yang sama, bandar pasar (*market maker*) cenderung menggerakkan harga ke arah berlawanan untuk memicu likuidasi massal:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-rose-400 font-bold block mb-1">Ritel Terlalu Long (&gt;75%)</span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Waspadai *Long Squeeze* tiba-tiba. Pendanaan 8h menjadi sangat mahal (positif tinggi), memicu wick tajam ke bawah sebelum reli berlanjut.
                    </p>
                  </div>
                  <div className="p-3 bg-[#070A10] border border-slate-800 rounded">
                    <span className="text-emerald-400 font-bold block mb-1">Ritel Terlalu Short (&gt;70%)</span>
                    <p className="text-[11px] text-slate-400 font-sans">
                      Peluang *Short Squeeze* asimetris. Ketika ketakutan memuncak (*capitulation*), akumulasi pasif oleh smart money sering kali menghasilkan pantulan agresif ke atas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: TOP MOVERS */}
          {activeTab === 'movers' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h3 className="font-mono font-bold text-white text-base flex items-center gap-2">
                  <Radio className="w-4 h-4 text-rose-400" />
                  <span>24h Radar: Top Gainers, Losers, dan Top Revenue</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Panel strip radar di atas 4-Chart grid menyaring pasar secara real-time langsung dari server bursa tanpa API key:
                </p>
                <ul className="text-xs space-y-1.5 list-disc list-inside text-slate-300 pt-1">
                  <li>
                    <strong className="text-emerald-300">Top Gainers:</strong> Menampilkan token dengan persentase kenaikan 24 jam tertinggi untuk mendeteksi *momentum breakouts*.
                  </li>
                  <li>
                    <strong className="text-rose-300">Top Losers:</strong> Token dengan penurunan terdalam, ideal untuk mencari *oversold mean-reversion bounces*.
                  </li>
                  <li>
                    <strong className="text-amber-300">Top Revenue / Turnover:</strong> Token dengan volume transaksi USDT terbesar di dunia (likuiditas institusional tertinggi).
                  </li>
                  <li>
                    <strong className="text-white">Interaksi 1-Klik:</strong> Klik kartu koin mana saja di strip untuk langsung memuatnya ke dalam 4-Chart grid!
                  </li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800/80 bg-[#090D15] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Platform Publik Gratis · Tanpa API Key</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                soundEngine.playTick();
              }}
              className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition-colors"
            >
              Tutup
            </button>

            {onEnterTerminal && (
              <button
                onClick={() => {
                  onClose();
                  onEnterTerminal();
                  soundEngine.playAlertPing();
                }}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-mono font-bold text-xs transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20"
              >
                <span>Mulai Trading di Workstation</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
