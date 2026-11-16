import React, { useEffect } from 'react';
import type { Card, EnemyWarband } from '../types/game';
import { ALL_CARDS } from '../data/cards';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, Coins, Utensils, ArrowRight, Sparkles } from 'lucide-react';

interface VictoryModalProps {
  warband: EnemyWarband;
  onSelectReward: (card: Card | null) => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ warband, onSelectReward }) => {
  useEffect(() => {
    sounds.playVictory();
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // 3 Farklı kart ödülü seçimi (Slay the Spire Card Choice)
  const rewardCards: Card[] = React.useMemo(() => {
    const pool = ALL_CARDS.filter(c => c.rarity !== 'starter');
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map((c, i) => ({ ...c, id: `${c.id}_reward_${Date.now()}_${i}` }));
  }, []);

  const [selectedCard, setSelectedCard] = React.useState<Card | null>(null);

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border-2 border-amber-500 rounded-3xl max-w-2xl w-full p-6 text-center shadow-2xl space-y-6">
        {/* Zafer Başlığı */}
        <div>
          <div className="w-16 h-16 rounded-2xl bg-amber-950 border border-amber-400 mx-auto flex items-center justify-center mb-3 text-amber-300 shadow-lg shadow-amber-500/20">
            <Trophy className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-amber-300 tracking-wide">
            MEYDAN MUHAREBESİ KAZANILDI!
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            {warband.name} ordusu darmadağın edildi. Savaş meydanından ganimetler toplandı.
          </p>
        </div>

        {/* Ganimet Dökümü */}
        <div className="flex justify-center gap-6">
          <div className="bg-slate-950 border border-yellow-500/50 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Coins className="w-6 h-6 text-yellow-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Altın Ganimeti</span>
              <span className="text-base font-black text-yellow-300">+{warband.goldReward} Sikke</span>
            </div>
          </div>

          <div className="bg-slate-950 border border-amber-500/50 rounded-2xl px-5 py-3 flex items-center gap-3">
            <Utensils className="w-6 h-6 text-amber-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Toplanan Erzak</span>
              <span className="text-base font-black text-amber-300">+{warband.foodReward} Yiyecek</span>
            </div>
          </div>
        </div>

        {/* Kart Seçimi (3'ten 1'i) */}
        <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-200 flex items-center justify-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Destene Eklemek İçin 1 Kart Seç (veya Pas Geç):</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {rewardCards.map(card => {
              const isSelected = selectedCard?.id === card.id;

              return (
                <div
                  key={card.id}
                  onClick={() => setSelectedCard(card)}
                  className={`bg-slate-950 border-2 rounded-xl p-3 text-left cursor-pointer transition-all flex flex-col justify-between
                    ${
                      isSelected
                        ? 'border-yellow-400 ring-2 ring-yellow-400/50 scale-105 bg-amber-950/20'
                        : 'border-slate-800 hover:border-slate-600'
                    }
                  `}
                >
                  <div>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="font-bold text-xs text-slate-100">{card.name}</h4>
                      <span className="text-[10px] font-black text-yellow-400">{card.cost} En.</span>
                    </div>
                    <span className="text-[9px] text-amber-400 uppercase font-semibold">
                      {card.cardType === 'commander' ? 'Komutan' : card.cardType === 'unit' ? 'Birlik' : 'Taktik'}
                    </span>
                    <p className="text-[11px] text-slate-300 mt-2 bg-slate-900/60 p-1.5 rounded">
                      {card.description}
                    </p>
                  </div>

                  <div className="mt-3 text-center">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isSelected ? 'bg-yellow-400 text-slate-950' : 'text-slate-500'
                      }`}
                    >
                      {isSelected ? '✓ Seçildi' : 'Seç'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Onay & Devam Butonu */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            onClick={() => onSelectReward(null)}
            className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer"
          >
            Kart Seçmeden Pas Geç
          </button>

          <button
            onClick={() => onSelectReward(selectedCard)}
            disabled={!selectedCard}
            className="flex items-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-400 hover:to-yellow-300 disabled:opacity-40 text-slate-950 font-black px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer disabled:cursor-not-allowed"
          >
            <span>Ödülü Al ve İlerle</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
