import React from 'react';
import type { Commander, ArmyUnit, Card } from '../types/game';
import { sounds } from '../utils/audio';
import { Flame, Utensils, Sparkles, ArrowRight } from 'lucide-react';

interface CampViewProps {
  commander: Commander;
  playerArmy: (ArmyUnit | null)[];
  deck: Card[];
  onRest: () => void;
  onUpgradeCard: (cardId: string) => void;
  onLeaveCamp: () => void;
}

export const CampView: React.FC<CampViewProps> = ({
  commander,
  playerArmy,
  deck,
  onRest,
  onUpgradeCard,
  onLeaveCamp,
}) => {
  const [hasActed, setHasActed] = React.useState(false);
  const [showUpgradeSelection, setShowUpgradeSelection] = React.useState(false);

  const handleRest = () => {
    sounds.playEatFood();
    onRest();
    setHasActed(true);
  };

  const handleUpgrade = (cardId: string) => {
    sounds.playVictory();
    onUpgradeCard(cardId);
    setShowUpgradeSelection(false);
    setHasActed(true);
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="bg-slate-900 border-2 border-amber-600/60 rounded-3xl p-6 text-center shadow-2xl space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-amber-950 border border-amber-500 mx-auto flex items-center justify-center text-amber-400">
          <Flame className="w-8 h-8 animate-pulse" />
        </div>

        <div>
          <h2 className="text-2xl font-black text-amber-300">Gece Kampı & Ateş Başı</h2>
          <p className="text-xs text-slate-300 mt-1">
            Yorucu seferin ardından ordunla mola ver. Sıcak ateş başında dinlenebilir veya silahlarını bileyebilirsin.
          </p>
        </div>

        {!hasActed ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Seçenek: Dinlen & Erzak Tüket */}
            <div
              onClick={handleRest}
              className="bg-slate-950 border-2 border-slate-800 hover:border-emerald-500 rounded-2xl p-5 text-left cursor-pointer transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500 flex items-center justify-center text-emerald-400 mb-3 group-hover:bg-emerald-900">
                <Utensils className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-100 group-hover:text-emerald-300">
                Ateş Başında Dinlen & Ziyafet
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Komutanın ve tüm ordunun canını <span className="text-emerald-400 font-bold">%30 yeniler</span>.
              </p>
            </div>

            {/* 2. Seçenek: Kart Geliştir (Demirci) */}
            <div
              onClick={() => setShowUpgradeSelection(true)}
              className="bg-slate-950 border-2 border-slate-800 hover:border-amber-500 rounded-2xl p-5 text-left cursor-pointer transition-all hover:scale-105 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-amber-400 mb-3 group-hover:bg-amber-900">
                <Sparkles className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-100 group-hover:text-amber-300">
                Kılıçları Bile & Taktik Çalış
              </h4>
              <p className="text-xs text-slate-400 mt-1">
                Destendeki bir kartı geliştirerek hasarını veya blok gücünü artır.
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-slate-950 border border-emerald-500/60 p-4 rounded-2xl text-emerald-300 font-bold text-sm">
            ✓ Kamp eylemi tamamlandı. Ordun sefere hazır!
          </div>
        )}

        <div className="pt-2">
          <button
            onClick={onLeaveCamp}
            className="flex items-center gap-2 mx-auto bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <span>Sefer Haritasına Devam Et</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Kart Seçim Modalı */}
      {showUpgradeSelection && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-sm text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Geliştirmek İstediğin Kartı Seç:</span>
              </h3>
              <button
                onClick={() => setShowUpgradeSelection(false)}
                className="text-xs text-slate-400 hover:text-white cursor-pointer"
              >
                Vazgeç
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {deck.map(c => (
                <div
                  key={c.id}
                  onClick={() => handleUpgrade(c.id)}
                  className="bg-slate-950 border border-slate-800 hover:border-amber-400 p-2.5 rounded-xl flex justify-between items-center cursor-pointer transition-colors"
                >
                  <div>
                    <h5 className="font-bold text-xs text-slate-100">{c.name}</h5>
                    <p className="text-[11px] text-slate-400">{c.description}</p>
                  </div>
                  <span className="text-xs text-amber-400 font-bold bg-amber-950/60 px-2 py-1 rounded border border-amber-600/40">
                    Geliştir
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
