import React from 'react';
import type { Commander, EnemyIntent } from '../types/game';
import { Shield, Swords, Crown, Utensils, Coins, Zap, Flame, ShieldAlert, Lock } from 'lucide-react';
import { sounds } from '../utils/audio';

interface CommanderViewProps {
  commander: Commander;
  isEnemy?: boolean;
  intent?: EnemyIntent;
  onToggleStance?: () => void;
  isTargetable?: boolean;
  onSelect?: () => void;
  isStanceLocked?: boolean; // Ön safa geçildiğinde tur sonuna kadar kilitli tutar
}

export const CommanderView: React.FC<CommanderViewProps> = ({
  commander,
  isEnemy = false,
  intent,
  onToggleStance,
  isTargetable = false,
  onSelect,
  isStanceLocked = false,
}) => {
  const hpPercent = Math.max(0, Math.min(100, (commander.hp / commander.maxHp) * 100));
  const isVanguard = commander.stance === 'vanguard';

  const handleToggle = () => {
    if (isStanceLocked) return;
    sounds.playStanceSwitch();
    if (onToggleStance) onToggleStance();
  };

  return (
    <div
      onClick={() => isTargetable && onSelect && onSelect()}
      className={`relative rounded-2xl border-2 p-4 transition-all select-none
        ${
          isEnemy
            ? 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-800/80 shadow-rose-950/40 shadow-xl'
            : isVanguard
            ? 'bg-gradient-to-b from-red-950/60 via-slate-900 to-slate-950 border-red-500 shadow-red-500/20 shadow-2xl pulse-vanguard-glow'
            : 'bg-gradient-to-b from-amber-950/30 via-slate-900 to-slate-950 border-amber-600/60 shadow-amber-950/30 shadow-xl'
        }
        ${isTargetable ? 'cursor-pointer ring-4 ring-rose-500 hover:scale-105' : ''}
      `}
    >
      {/* Slay the Spire Tarzı Düşman Komutan Niyeti (Intent) */}
      {isEnemy && intent && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-950 border-2 border-rose-500 text-rose-100 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-xl font-bold text-xs whitespace-nowrap z-20 animate-bounce">
          <Swords className="w-4 h-4 text-rose-400" />
          <span>{intent.description} ({intent.value} Hasar)</span>
        </div>
      )}

      {/* Komutan Başlığı & Duruş */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 shadow-inner
              ${
                isEnemy
                  ? 'bg-rose-950 border-rose-500 text-rose-300'
                  : isVanguard
                  ? 'bg-red-900 border-red-400 text-red-200'
                  : 'bg-amber-950 border-amber-500 text-amber-200'
              }
            `}
          >
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-black text-sm text-slate-100 flex items-center gap-1.5">
              {commander.name}
              {!isEnemy && (
                <span className="text-[10px] text-amber-400 font-normal">
                  ({commander.title})
                </span>
              )}
            </h3>
            <span className="text-[11px] text-slate-400">
              {isEnemy ? 'Düşman Ordusu Lideri' : isVanguard ? 'Ön Safta Meydanda!' : 'Taktik Safında Komuta Ediyor'}
            </span>
          </div>
        </div>

        {/* Oyuncu İçin Duruş (Stance) Değiştirme Butonu */}
        {!isEnemy && onToggleStance && (
          <button
            onClick={handleToggle}
            disabled={isStanceLocked}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-md active:scale-95
              ${
                isStanceLocked
                  ? 'bg-red-950/80 text-amber-300 border-red-700/80 cursor-not-allowed opacity-90'
                  : isVanguard
                  ? 'bg-red-600 hover:bg-red-500 text-white border-red-300 shadow-red-600/40 cursor-pointer'
                  : 'bg-slate-800 hover:bg-slate-700 text-amber-300 border-amber-500/50 shadow-slate-900 cursor-pointer'
              }
            `}
            title={
              isStanceLocked
                ? 'Ön safta savaşma kararı verdin! Düşman turunu göğüsleyip kendi sıran gelene kadar geri çekilemezsin.'
                : ''
            }
          >
            {isStanceLocked ? (
              <>
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Ön Saftasın (Kilitli)</span>
              </>
            ) : isVanguard ? (
              <>
                <Flame className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                <span>Ön Saftasın (Geri Çekil)</span>
              </>
            ) : (
              <>
                <Swords className="w-3.5 h-3.5 text-amber-400" />
                <span>Ön Safa Geç!</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Ön Saf Uyarısı / Muhafız Bağı Rozeti */}
      {!isEnemy && isVanguard && (
        <div className="bg-red-950/60 border border-red-700/80 rounded-lg px-2.5 py-1 mb-2 flex items-center justify-between text-[11px] text-red-200">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span className="font-semibold">{isStanceLocked ? 'Ön Hat Kilitli:' : 'Muhafız Bağı:'}</span>
          </div>
          <span className="text-slate-300">
            {isStanceLocked
              ? 'Kendi turuna kadar ön saftasın (Piyadeler %40 emer)'
              : 'Piyadeler hasarın %40\'ını göğüsler'}
          </span>
        </div>
      )}

      {/* Savuşturma (Parry) Aktif Bildirimi */}
      {commander.parryActive && (
        <div className="bg-cyan-950/80 border border-cyan-500 text-cyan-200 rounded-lg px-2 py-0.5 mb-2 text-center text-xs font-bold animate-pulse">
          ⚡ Aktif Savuşturma Açık: Bir sonraki darbeyi savuşturacaksın!
        </div>
      )}

      {/* Can Barı ve Blok */}
      <div className="space-y-1.5">
        <div className="flex justify-between items-center text-xs font-bold">
          <span className="text-slate-300 flex items-center gap-1">
            <span>Can (HP):</span>
            <span className="text-rose-400">
              {commander.hp} / {commander.maxHp}
            </span>
          </span>

          {commander.block > 0 && (
            <span className="flex items-center gap-1 bg-blue-950/90 text-blue-300 border border-blue-500 px-2 py-0.5 rounded-full text-xs">
              <Shield className="w-3 h-3 text-blue-400" />
              <span>{commander.block} Blok</span>
            </span>
          )}
        </div>

        <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-700/80">
          <div
            className={`h-full transition-all duration-300 ${
              hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600'
            }`}
            style={{ width: `${hpPercent}%` }}
          />
        </div>
      </div>

      {/* Alt Kaynaklar (Yalnızca Oyuncu Komutanı İçin: Altın, Yiyecek, Enerji) */}
      {!isEnemy && (
        <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-slate-800 text-xs">
          {/* Yiyecek */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1">
            <Utensils className="w-3.5 h-3.5 text-amber-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Yiyecek</div>
              <div className="font-bold text-amber-200">{commander.food} Erzak</div>
            </div>
          </div>

          {/* Altın */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1">
            <Coins className="w-3.5 h-3.5 text-yellow-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Ganimet</div>
              <div className="font-bold text-yellow-300">{commander.gold} Sikke</div>
            </div>
          </div>

          {/* Enerji */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 rounded-lg px-2 py-1">
            <Zap className="w-3.5 h-3.5 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-400 font-semibold">Enerji Kap.</div>
              <div className="font-bold text-cyan-300">
                {commander.energy} / {commander.maxEnergy}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
