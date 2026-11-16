import React from 'react';
import type { Card, GameBattleState, UnitClass } from '../types/game';
import { Shield, Sparkles, AlertCircle } from 'lucide-react';

interface CardViewProps {
  card: Card;
  battleState: GameBattleState;
  onPlay: (card: Card) => void;
  disabled?: boolean;
}

export const CardView: React.FC<CardViewProps> = ({ card, battleState, onPlay, disabled = false }) => {
  // Dinamik enerji bedelini hesapla
  let currentCost = card.cost;
  if (card.isDynamicCost && card.dynamicCostCalculator) {
    currentCost = card.dynamicCostCalculator(battleState);
  }

  // Birlik gereksinimi kontrolü
  let missingRequiredUnit = false;
  if (card.requiredClass) {
    const hasAliveUnit = battleState.playerArmy.some(
      u => u !== null && !u.isDead && u.unitClass === card.requiredClass
    );
    if (!hasAliveUnit) {
      missingRequiredUnit = true;
    }
  }

  // Özel oynanabilirlik kontrolü (ör. yiyecek var mı)
  let specialCheckFailed = false;
  let failureReason = '';
  if (card.canPlayCheck) {
    const check = card.canPlayCheck(battleState);
    if (!check.canPlay) {
      specialCheckFailed = true;
      failureReason = check.reason || '';
    }
  }

  const notEnoughEnergy = battleState.playerCommander.energy < currentCost;
  const isPlayable = !disabled && !missingRequiredUnit && !notEnoughEnergy && !specialCheckFailed;

  // Sınıf renk ve etiketleri
  const getClassBadge = (uClass?: UnitClass) => {
    switch (uClass) {
      case 'infantry':
        return { label: 'Piyade', color: 'bg-blue-900/80 text-blue-300 border-blue-600' };
      case 'archer':
        return { label: 'Okçu', color: 'bg-emerald-900/80 text-emerald-300 border-emerald-600' };
      case 'cavalry':
        return { label: 'Atlı', color: 'bg-amber-900/80 text-amber-300 border-amber-600' };
      case 'heavy':
        return { label: 'Ağır Zırhlı', color: 'bg-purple-900/80 text-purple-300 border-purple-600' };
      default:
        return null;
    }
  };

  const badge = getClassBadge(card.requiredClass);

  // Nadirlik çerçeve renkleri
  const getRarityBorder = () => {
    switch (card.rarity) {
      case 'rare':
        return 'border-amber-400 shadow-amber-500/20 shadow-lg bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-900';
      case 'uncommon':
        return 'border-cyan-400 shadow-cyan-500/20 shadow-md bg-gradient-to-b from-slate-900 via-cyan-950/20 to-slate-900';
      case 'starter':
        return 'border-slate-600 bg-slate-900';
      default:
        return 'border-slate-500 bg-slate-900';
    }
  };

  return (
    <div
      onClick={() => isPlayable && onPlay(card)}
      className={`relative w-44 h-64 rounded-xl border-2 p-3.5 flex flex-col justify-between cursor-pointer card-hover-effect transition-all select-none
        ${getRarityBorder()}
        ${isPlayable ? 'hover:border-yellow-300 hover:shadow-yellow-400/30' : 'opacity-60 cursor-not-allowed grayscale-[30%]'}
        ${currentCost === 0 ? 'ring-2 ring-emerald-400/60 shadow-emerald-500/30' : ''}
      `}
    >
      {/* Enerji Bedeli Rozeti (Slay The Spire Tarzı Orb) */}
      <div
        className={`absolute -top-3.5 -left-3.5 w-9 h-9 rounded-full flex items-center justify-center font-black text-lg shadow-lg border-2 z-10 transition-transform
          ${
            currentCost === 0
              ? 'bg-gradient-to-tr from-emerald-600 to-teal-400 text-white border-emerald-200 scale-110 shadow-emerald-400/50'
              : notEnoughEnergy
              ? 'bg-rose-950 text-rose-300 border-rose-500'
              : 'bg-gradient-to-tr from-amber-600 to-yellow-400 text-slate-950 border-yellow-200'
          }
        `}
      >
        {currentCost}
      </div>

      {/* Kart Başlığı ve Tipi */}
      <div>
        <div className="flex justify-between items-start pl-4">
          <h4 className="font-bold text-sm text-slate-100 tracking-tight leading-tight line-clamp-1">
            {card.name}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] uppercase font-semibold text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">
            {card.cardType === 'commander' ? 'Komutan' : card.cardType === 'unit' ? 'Birlik' : 'Taktik'}
          </span>
          {badge && (
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${badge.color}`}>
              {badge.label}
            </span>
          )}
        </div>
      </div>

      {/* Görsel Simgesi / Ortadaki Tasarım */}
      <div className="my-auto py-2 flex items-center justify-center">
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all
            ${
              currentCost === 0
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 animate-pulse'
                : 'bg-slate-800/80 border-slate-700 text-slate-300'
            }
          `}
        >
          {card.isAngerMechanic ? (
            <Sparkles className="w-7 h-7 text-rose-400" />
          ) : card.isBodySlamMechanic ? (
            <Shield className="w-7 h-7 text-blue-400" />
          ) : (
            <span className="text-xl font-black">⚔</span>
          )}
        </div>
      </div>

      {/* Açıklama Kutusu */}
      <div className="bg-slate-950/80 rounded-lg p-2 border border-slate-800 text-center text-xs text-slate-200 leading-snug">
        <p className="font-medium">{card.description}</p>
        {card.flavor && (
          <p className="text-[10px] italic text-slate-500 mt-1 line-clamp-1">
            "{card.flavor}"
          </p>
        )}
      </div>

      {/* Hata / Uyarı Bildirimi */}
      {missingRequiredUnit && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-3 text-rose-400 text-center text-xs">
          <AlertCircle className="w-6 h-6 mb-1 text-rose-500" />
          <span className="font-bold">Gerekli Birlik Yok!</span>
          <span className="text-[10px] text-slate-300 mt-0.5">
            Bu kartı oynamak için canlı bir {badge?.label} gerekiyor.
          </span>
        </div>
      )}

      {specialCheckFailed && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-[1px] rounded-xl flex flex-col items-center justify-center p-3 text-amber-400 text-center text-xs">
          <AlertCircle className="w-6 h-6 mb-1 text-amber-500" />
          <span className="font-bold">{failureReason}</span>
        </div>
      )}
    </div>
  );
};
