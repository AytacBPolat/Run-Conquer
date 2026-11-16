import React from 'react';
import type { MapNode, Commander, ArmyUnit } from '../types/game';
import { Swords, ShoppingBag, Flame, Skull, Shield, Coins, Heart, Utensils } from 'lucide-react';

interface MapViewProps {
  nodes: MapNode[];
  currentNodeIndex: number;
  commander: Commander;
  playerArmy: (ArmyUnit | null)[];
  onSelectNode: (node: MapNode, index: number) => void;
}

export const MapView: React.FC<MapViewProps> = ({
  nodes,
  currentNodeIndex,
  commander,
  playerArmy,
  onSelectNode,
}) => {
  const getNodeIcon = (type: MapNode['type']) => {
    switch (type) {
      case 'battle':
        return <Swords className="w-5 h-5 text-rose-400" />;
      case 'elite':
        return <Skull className="w-5 h-5 text-amber-400" />;
      case 'shop':
        return <ShoppingBag className="w-5 h-5 text-cyan-400" />;
      case 'camp':
        return <Flame className="w-5 h-5 text-emerald-400" />;
      case 'boss':
        return <Skull className="w-7 h-7 text-red-500 animate-pulse" />;
    }
  };

  const aliveUnitsCount = playerArmy.filter(u => u !== null && !u.isDead).length;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Üst Bar: Komutan Durumu & Ordu Sayısı */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-600 flex items-center justify-center font-black text-amber-400">
            ⚔️
          </div>
          <div>
            <h2 className="text-base font-black text-slate-100">{commander.name} Sefer Haritası</h2>
            <p className="text-xs text-slate-400">
              Kalradya topraklarında ilerle, düşman ordularını alt et ve nihai zafere ulaş.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span className="font-bold text-rose-300">
              {commander.hp}/{commander.maxHp} HP
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-blue-300">{aliveUnitsCount}/5 Birlik Canlı</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Utensils className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-amber-300">{commander.food} Erzak</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
            <Coins className="w-4 h-4 text-yellow-400" />
            <span className="font-bold text-yellow-300">{commander.gold} Sikke</span>
          </div>
        </div>
      </div>

      {/* Harita Düğümleri (Slay the Spire Yol Haritası) */}
      <div className="relative py-8 px-4 bg-slate-950/80 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
        {/* Yol Çizgisi */}
        <div className="absolute top-1/2 left-8 right-8 h-1 bg-slate-800 -translate-y-1/2 z-0 hidden md:block" />

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-4 relative z-10">
          {nodes.map((node, idx) => {
            const isCurrent = idx === currentNodeIndex;
            const isAvailable = idx === currentNodeIndex + 1 || (currentNodeIndex === -1 && idx === 0);
            const isPassed = idx <= currentNodeIndex;

            return (
              <div
                key={node.id}
                onClick={() => isAvailable && onSelectNode(node, idx)}
                className={`flex flex-col items-center justify-between p-4 rounded-2xl border-2 transition-all select-none
                  ${
                    isCurrent
                      ? 'bg-amber-950/80 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400/50'
                      : isPassed
                      ? 'bg-slate-900/40 border-slate-800 opacity-50 grayscale'
                      : isAvailable
                      ? 'bg-slate-900 border-yellow-500/80 hover:border-yellow-300 hover:scale-110 cursor-pointer shadow-md shadow-yellow-500/10 animate-pulse'
                      : 'bg-slate-950 border-slate-800/60 opacity-30 cursor-not-allowed'
                  }
                `}
              >
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Kat {node.floor}
                </span>

                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all mb-2
                    ${
                      isAvailable
                        ? 'bg-yellow-950/40 border-yellow-400'
                        : isCurrent
                        ? 'bg-amber-900 border-amber-400'
                        : 'bg-slate-900 border-slate-700'
                    }
                  `}
                >
                  {getNodeIcon(node.type)}
                </div>

                <div className="text-center">
                  <h4 className="font-bold text-xs text-slate-200 line-clamp-1">{node.title}</h4>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {node.type === 'battle'
                      ? 'Normal Meydan'
                      : node.type === 'elite'
                      ? 'Elit Birlik'
                      : node.type === 'shop'
                      ? 'Tüccar'
                      : node.type === 'camp'
                      ? 'Dinlenme'
                      : 'Büyük Han'}
                  </span>
                </div>

                {isAvailable && (
                  <span className="mt-3 text-[10px] bg-yellow-400 text-slate-950 font-black px-2 py-0.5 rounded-full shadow">
                    Hücum Et!
                  </span>
                )}
                {isPassed && (
                  <span className="mt-3 text-[10px] text-slate-500 font-semibold">Tamamlandı</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
