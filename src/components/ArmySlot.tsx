import React from 'react';
import type { ArmyUnit, EnemyIntent } from '../types/game';
import { Shield, Crosshair, Swords, Award, Pin, Heart } from 'lucide-react';

interface ArmySlotProps {
  unit: ArmyUnit | null;
  slotIndex: number;
  isEnemy?: boolean;
  isSelected?: boolean;
  isTargetable?: boolean;
  intent?: EnemyIntent;
  onSelect?: (index: number) => void;
}

export const ArmySlot: React.FC<ArmySlotProps> = ({
  unit,
  slotIndex,
  isEnemy = false,
  isSelected = false,
  isTargetable = false,
  intent,
  onSelect,
}) => {
  if (!unit) {
    return (
      <div className="w-36 h-48 rounded-xl border-2 border-dashed border-slate-800/80 bg-slate-900/30 flex flex-col items-center justify-center text-slate-600">
        <span className="text-xs font-semibold">Boş Yuva</span>
        <span className="text-[10px] text-slate-700">Slot {slotIndex + 1}</span>
      </div>
    );
  }

  const isDead = unit.isDead || unit.hp <= 0;

  // Sınıf simgesi & rengi
  const getClassConfig = () => {
    switch (unit.unitClass) {
      case 'infantry':
        return {
          label: 'Piyade',
          bg: 'bg-blue-950/60 border-blue-700',
          badge: 'bg-blue-900 text-blue-200 border-blue-500',
          icon: '🛡️',
        };
      case 'archer':
        return {
          label: 'Okçu',
          bg: 'bg-emerald-950/60 border-emerald-700',
          badge: 'bg-emerald-900 text-emerald-200 border-emerald-500',
          icon: '🏹',
        };
      case 'cavalry':
        return {
          label: 'Atlı',
          bg: 'bg-amber-950/60 border-amber-700',
          badge: 'bg-amber-900 text-amber-200 border-amber-500',
          icon: '🐎',
        };
      case 'heavy':
        return {
          label: 'Ağır Zırhlı',
          bg: 'bg-purple-950/60 border-purple-700',
          badge: 'bg-purple-900 text-purple-200 border-purple-500',
          icon: '🪓',
        };
    }
  };

  const config = getClassConfig();
  const hpPercent = Math.max(0, Math.min(100, (unit.hp / unit.maxHp) * 100));

  return (
    <div
      onClick={() => isTargetable && !isDead && onSelect && onSelect(slotIndex)}
      className={`relative w-36 h-48 rounded-xl border-2 p-2.5 flex flex-col justify-between transition-all select-none
        ${config.bg}
        ${isDead ? 'opacity-40 grayscale pointer-events-none' : ''}
        ${
          isTargetable && !isDead
            ? 'cursor-pointer ring-2 ring-rose-500 hover:scale-105 hover:border-rose-400 animate-pulse'
            : ''
        }
        ${isSelected ? 'ring-4 ring-yellow-400 border-yellow-300 scale-105' : ''}
      `}
    >
      {/* Üst Kısım: Sınıf & Tier */}
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${config.badge}`}>
          {config.icon} {config.label}
        </span>
        <div className="flex items-center gap-0.5 text-amber-400 text-[10px] font-bold">
          <Award className="w-3 h-3" />
          <span>T{unit.tier}</span>
        </div>
      </div>

      {/* Düşman Niyeti (Intent) - Slay the Spire Tarzı */}
      {isEnemy && intent && !isDead && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900/95 border border-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md z-20 whitespace-nowrap text-xs">
          {intent.type === 'attack' || intent.type === 'heavy_attack' ? (
            <>
              <Swords className="w-3.5 h-3.5 text-rose-500" />
              <span className="font-black text-rose-400">{intent.value}</span>
            </>
          ) : intent.type === 'defend' ? (
            <>
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-black text-blue-300">+{intent.value}</span>
            </>
          ) : (
            <>
              <Crosshair className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-black text-emerald-300">{intent.value}</span>
            </>
          )}
        </div>
      )}

      {/* İsim */}
      <div className="text-center my-auto">
        <div className="text-2xl mb-1">{config.icon}</div>
        <h5 className="font-bold text-xs text-slate-100 line-clamp-1">{unit.name}</h5>
        <span className="text-[10px] text-slate-400 flex items-center justify-center gap-1 mt-0.5">
          <Swords className="w-3 h-3 text-slate-400" /> Güç: {unit.attackPower}
        </span>
      </div>

      {/* Statü Rozetleri */}
      {(unit.status.pinned ?? 0) > 0 && (
        <div className="absolute top-8 right-1 bg-amber-950/90 text-amber-300 border border-amber-600 text-[9px] px-1 rounded flex items-center gap-0.5">
          <Pin className="w-2.5 h-2.5" /> Sabitlendi ({unit.status.pinned})
        </div>
      )}

      {/* Alt Kısım: HP Bar & Blok */}
      <div className="space-y-1">
        {unit.block > 0 && (
          <div className="flex items-center justify-center gap-1 bg-blue-950/90 text-blue-300 border border-blue-600 rounded text-[11px] font-bold py-0.5">
            <Shield className="w-3 h-3 text-blue-400" />
            <span>{unit.block} Blok</span>
          </div>
        )}
        <div className="space-y-0.5">
          <div className="flex justify-between text-[10px] text-slate-300 font-semibold">
            <span className="flex items-center gap-0.5">
              <Heart className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> Can
            </span>
            <span>
              {unit.hp}/{unit.maxHp}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700/60">
            <div
              className={`h-full transition-all duration-300 ${
                hpPercent > 50 ? 'bg-emerald-500' : hpPercent > 25 ? 'bg-amber-500' : 'bg-rose-600'
              }`}
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
