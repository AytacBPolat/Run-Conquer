import React from 'react';
import type { Card, Commander, ArmyUnit } from '../types/game';
import { ALL_CARDS } from '../data/cards';
import { RECRUITABLE_UNITS, type UnitArchetype } from '../data/units';
import { sounds } from '../utils/audio';
import { Coins, Utensils, Heart, PlusCircle, ArrowRight, ShieldCheck, Sparkles, Trash2, Zap } from 'lucide-react';

interface ShopViewProps {
  commander: Commander;
  playerArmy: (ArmyUnit | null)[];
  deck: Card[];
  onUpdateCommander: (newCommander: Commander) => void;
  onUpdateArmy: (newArmy: (ArmyUnit | null)[]) => void;
  onAddCard: (card: Card) => void;
  onRemoveCard: (cardId: string) => void;
  onLeaveShop: () => void;
}

export const ShopView: React.FC<ShopViewProps> = ({
  commander,
  playerArmy,
  deck,
  onUpdateCommander,
  onUpdateArmy,
  onAddCard,
  onRemoveCard,
  onLeaveShop,
}) => {
  // Satıştaki kartlar: Enerji güçlendirmesi garantili + birlik ve komutan kartları
  const shopCards: { card: Card; price: number }[] = React.useMemo(() => {
    const powerUpCards = ALL_CARDS.filter(c => c.cardKey === 'war_horn' || c.cardKey === 'war_banner' || c.cardKey === 'rallying_drill');
    const unitCards = ALL_CARDS.filter(c => c.cardType === 'unit');
    const commanderCards = ALL_CARDS.filter(c => c.cardType === 'commander' && c.rarity !== 'starter');

    const getRandom = (arr: Card[]) => arr[Math.floor(Math.random() * arr.length)];

    return [
      { card: getRandom(powerUpCards), price: 45 },
      { card: getRandom(powerUpCards), price: 55 },
      { card: getRandom(unitCards), price: 40 },
      { card: getRandom(commanderCards), price: 50 },
    ];
  }, []);

  const shopRecruits: { unit: UnitArchetype; price: number }[] = React.useMemo(() => {
    const shuffled = [...RECRUITABLE_UNITS].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 3).map(u => ({ unit: u, price: u.costInGold }));
  }, []);

  const [purchasedCardIds, setPurchasedCardIds] = React.useState<string[]>([]);
  const [purchasedRecruits, setPurchasedRecruits] = React.useState<string[]>([]);

  // Yiyecek Satın Alma & Can Yenileme
  const handleBuyFood = () => {
    const foodCost = 20;
    if (commander.gold < foodCost) return;

    sounds.playEatFood();
    const healAmount = 18;
    const newHp = Math.min(commander.maxHp, commander.hp + healAmount);

    onUpdateCommander({
      ...commander,
      gold: commander.gold - foodCost,
      hp: newHp,
      food: commander.food + 2,
    });
  };

  // Kalıcı Enerji Kapasitesi Güçlendirmesi (En Fazla 5 Sınırı)
  const energyUpgradeCost = 55;
  const isMaxEnergyReached = commander.maxEnergy >= 5;

  const handleUpgradeMaxEnergy = () => {
    if (commander.gold < energyUpgradeCost || isMaxEnergyReached) return;

    sounds.playVictory();
    const newMaxEnergy = Math.min(5, commander.maxEnergy + 1);
    const newEnergy = Math.min(5, commander.energy + 1);

    onUpdateCommander({
      ...commander,
      gold: commander.gold - energyUpgradeCost,
      maxEnergy: newMaxEnergy,
      energy: newEnergy,
    });
  };

  // Kart Satın Alma
  const handleBuyCard = (card: Card, price: number) => {
    if (commander.gold < price) return;
    sounds.playCardPlay();

    setPurchasedCardIds(prev => [...prev, card.id]);
    onUpdateCommander({
      ...commander,
      gold: commander.gold - price,
    });
    onAddCard({ ...card, id: `${card.id}_shop_${Date.now()}` });
  };

  // Birlik İşe Alma
  const handleRecruitUnit = (recruit: UnitArchetype, price: number) => {
    if (commander.gold < price) return;

    const emptyIndex = playerArmy.findIndex(u => u === null);
    if (emptyIndex === -1) {
      alert('Ordunuzun 5 birlik kapasitesi dolu! Yeni bir asker alabilmek için önce bir yuvayı boşaltmalısınız.');
      return;
    }

    sounds.playVictory();
    setPurchasedRecruits(prev => [...prev, recruit.name]);

    const newUnit: ArmyUnit = {
      id: `unit_${Date.now()}`,
      name: recruit.name,
      unitClass: recruit.unitClass,
      hp: recruit.maxHp,
      maxHp: recruit.maxHp,
      tier: recruit.tier,
      attackPower: recruit.attackPower,
      block: 0,
      status: {},
    };

    const newArmy = [...playerArmy];
    newArmy[emptyIndex] = newUnit;

    onUpdateCommander({
      ...commander,
      gold: commander.gold - price,
    });
    onUpdateArmy(newArmy);
  };

  // Deste Temizleme
  const [showPurgeModal, setShowPurgeModal] = React.useState(false);
  const purgeCost = 50;

  const handlePurgeCard = (cardId: string) => {
    if (commander.gold < purgeCost) return;
    sounds.playCardPlay();
    onUpdateCommander({
      ...commander,
      gold: commander.gold - purgeCost,
    });
    onRemoveCard(cardId);
    setShowPurgeModal(false);
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Üst Bar: Tüccar Başlığı & Oyuncu Bakiyesi */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/90 border border-amber-600/50 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-500 flex items-center justify-center text-2xl">
            🎪
          </div>
          <div>
            <h2 className="text-xl font-black text-amber-200">Gezgin Karavan & Ordu Kampı</h2>
            <p className="text-xs text-slate-400">
              Ganimetlerinle enerjini güçlendir, ordunu takviye et, yeni taktik kartları ve erzak temin et.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-yellow-950/60 border border-yellow-500/60 px-3 py-1.5 rounded-xl font-bold text-yellow-300">
            <Coins className="w-5 h-5" />
            <span className="text-base">{commander.gold} Sikke</span>
          </div>

          <div className="flex items-center gap-1.5 bg-rose-950/60 border border-rose-500/60 px-3 py-1.5 rounded-xl font-bold text-rose-300">
            <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            <span className="text-base">
              {commander.hp} / {commander.maxHp} HP
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-cyan-950/60 border border-cyan-500/60 px-3 py-1.5 rounded-xl font-bold text-cyan-300">
            <Zap className="w-5 h-5 text-cyan-400" />
            <span className="text-base">
              {commander.maxEnergy} / 5 Maks Enerji
            </span>
          </div>

          <button
            onClick={onLeaveShop}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <span>Haritaya Dön</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 1. BÖLÜM: KALICI ENERJİ GÜÇLENDİRMESİ & ERZAK YENİLEME */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Kalıcı Enerji Kapasitesi Artırma */}
        <div className="bg-gradient-to-br from-cyan-950/40 via-slate-900 to-slate-950 border-2 border-cyan-600/70 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-950 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-cyan-200">Sancak Eğitimi: Kalıcı +1 Enerji Kapasitesi</h3>
                <span className="text-[10px] bg-cyan-900/80 text-cyan-200 border border-cyan-500 px-1.5 py-0.5 rounded font-bold">
                  En Fazla 5 Sınırı
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Komutanın tur başı enerjisini kalıcı olarak <span className="text-cyan-300 font-bold">+1 arttırır</span>.
                Mevcut: <strong className="text-yellow-300">{commander.maxEnergy}/5 Enerji</strong>
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <Coins className="w-4 h-4" /> {energyUpgradeCost} Sikke
            </span>

            <button
              onClick={handleUpgradeMaxEnergy}
              disabled={commander.gold < energyUpgradeCost || isMaxEnergyReached}
              className="flex items-center gap-1.5 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{isMaxEnergyReached ? 'Maksimuma Ulaşıldı (5/5)' : 'Enerjiyi Arttır (+1)'}</span>
            </button>
          </div>
        </div>

        {/* Yiyecek & Erzak Çuvalı */}
        <div className="bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 border-2 border-amber-600/70 rounded-2xl p-4 shadow-lg flex flex-col justify-between">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-amber-950 border border-amber-400 flex items-center justify-center text-amber-300">
              <Utensils className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-amber-200">Kavurma Et & Taze Erzak Çuvalı</h3>
              <p className="text-xs text-slate-300 mt-1">
                Komutanın canını anında <span className="text-emerald-400 font-bold">+18 HP</span> yeniler ve savaşa götürmek üzere çantana <span className="text-amber-300 font-bold">+2 Erzak</span> ekler.
              </p>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center">
            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <Coins className="w-4 h-4" /> 20 Sikke
            </span>

            <button
              onClick={handleBuyFood}
              disabled={commander.gold < 20 || commander.hp >= commander.maxHp}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black px-4 py-2 rounded-xl text-xs transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Erzak Satın Al</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. BÖLÜM: SATILIK GÜÇLENDİRME & TAKTİK KARTLARI */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Enerji Güçlendirme & Savaş Kartları</span>
          </h3>
          <button
            onClick={() => setShowPurgeModal(true)}
            className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Destenden İstenmeyen Kart Sil (50 Sikke)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {shopCards.map(({ card, price }) => {
            const isBought = purchasedCardIds.includes(card.id);
            const canAfford = commander.gold >= price;

            return (
              <div
                key={card.id}
                className="bg-slate-900/90 border border-slate-700 hover:border-slate-500 rounded-xl p-3.5 flex flex-col justify-between shadow-md relative"
              >
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-bold text-sm text-slate-100">{card.name}</h4>
                    <span className="text-xs font-black text-yellow-400">{card.cost} Enerji</span>
                  </div>
                  <span className="text-[10px] text-amber-300 uppercase font-semibold">
                    {card.cardType === 'commander' ? 'Komutan Hamlesi' : card.cardType === 'unit' ? 'Birlik Taktik' : 'Güçlendirme & Taktik'}
                  </span>
                  <p className="text-xs text-slate-300 mt-2 bg-slate-950/60 p-2 rounded border border-slate-800">
                    {card.description}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {price} Sikke
                  </span>

                  <button
                    disabled={isBought || !canAfford}
                    onClick={() => handleBuyCard(card, price)}
                    className="px-3 py-1 rounded-lg text-xs font-bold bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-slate-950 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isBought ? 'Satın Alındı' : 'Satın Al'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BÖLÜM: YENİ ASKER TOPLAMA (5 BİRLİK KAPASİTESİ İÇİN) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Kışla & Paralı Asker Çadırı (Maksimum 5 Birlik)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Mevcut Ordu: {playerArmy.filter(u => u !== null).length} / 5 Slot
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shopRecruits.map(({ unit, price }) => {
            const isRecruited = purchasedRecruits.includes(unit.name);
            const canAfford = commander.gold >= price;
            const hasEmptySlot = playerArmy.some(u => u === null);

            return (
              <div
                key={unit.name}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="font-bold text-sm text-slate-100">{unit.name}</h4>
                    <span className="text-xs text-amber-400 font-bold">Tier {unit.tier}</span>
                  </div>
                  <span className="text-[10px] text-cyan-400 uppercase font-semibold">
                    {unit.unitClass.toUpperCase()}
                  </span>
                  <p className="text-xs text-slate-400 mt-2">{unit.description}</p>

                  <div className="flex gap-3 text-xs text-slate-300 mt-3 bg-slate-950 p-2 rounded border border-slate-800/80">
                    <span>❤️ Can: {unit.maxHp}</span>
                    <span>⚔️ Saldırı: {unit.attackPower}</span>
                  </div>
                </div>

                <div className="mt-4 pt-2 border-t border-slate-800 flex justify-between items-center">
                  <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
                    <Coins className="w-3.5 h-3.5" /> {price} Sikke
                  </span>

                  <button
                    disabled={isRecruited || !canAfford || !hasEmptySlot}
                    onClick={() => handleRecruitUnit(unit, price)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-slate-950 transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>{isRecruited ? 'Orduya Katıldı' : !hasEmptySlot ? 'Ordu Dolu' : 'Orduya Kat'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Kart Silme (Purge) Modal */}
      {showPurgeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-black text-base text-slate-100 flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-rose-500" />
                <span>Destenden Çıkarmak İstediğin Kartı Seç (50 Sikke)</span>
              </h3>
              <button
                onClick={() => setShowPurgeModal(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                Kapat
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {deck.map(c => (
                <div
                  key={c.id}
                  className="bg-slate-950 border border-slate-800 hover:border-rose-500/60 p-2.5 rounded-xl flex justify-between items-center"
                >
                  <div>
                    <h5 className="font-bold text-xs text-slate-100">{c.name}</h5>
                    <p className="text-[11px] text-slate-400">{c.description}</p>
                  </div>
                  <button
                    onClick={() => handlePurgeCard(c.id)}
                    disabled={commander.gold < purgeCost}
                    className="bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 text-xs px-2.5 py-1 rounded font-bold cursor-pointer disabled:opacity-40"
                  >
                    Sil
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
