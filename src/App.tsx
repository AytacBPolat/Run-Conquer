import React, { useState } from 'react';
import type { GameScreen, MapNode, Commander, ArmyUnit, Card, GameBattleState, EnemyWarband } from './types/game';
import { getStarterDeck } from './data/cards';
import { getStarterArmy } from './data/units';
import { ENEMY_WARBANDS } from './data/enemies';
import { Battlefield } from './components/Battlefield';
import { MapView } from './components/MapView';
import { ShopView } from './components/ShopView';
import { CampView } from './components/CampView';
import { VictoryModal } from './components/VictoryModal';
import { sounds } from './utils/audio';
import { Volume2, VolumeX, BookOpen, RotateCcw, Shield, Swords, Crown, Skull } from 'lucide-react';

export const App: React.FC = () => {
  // 1. OYUNCU DURUMLARI
  const [commander, setCommander] = useState<Commander>({
    name: 'Komutan Aytac',
    title: 'Sancak Beyi',
    hp: 55,
    maxHp: 55,
    block: 0,
    stance: 'command', // Başlangıçta Taktik Safı
    parryActive: false,
    adrenaline: 0,
    gold: 50,
    food: 3, // 3 Erzak ile başlar
    energy: 3,
    maxEnergy: 5, // En fazla 5 enerjiye sahip olabilmeli
  });

  const [playerArmy, setPlayerArmy] = useState<(ArmyUnit | null)[]>(getStarterArmy());
  const [deck, setDeck] = useState<Card[]>(getStarterDeck());

  // 2. SEFER HARİTASI (SLAY THE SPIRE TARZI DÜĞÜMLER)
  const [mapNodes] = useState<MapNode[]>([
    { id: 'node_1', floor: 1, type: 'battle', title: 'Haydut Pusu Noktası', cleared: false, available: true },
    { id: 'node_2', floor: 2, type: 'shop', title: 'Gezgin Kervanı', cleared: false, available: false },
    { id: 'node_3', floor: 3, type: 'battle', title: 'Paralı Kara Şirket', cleared: false, available: false },
    { id: 'node_4', floor: 4, type: 'camp', title: 'Nehir Kenarı Kampı', cleared: false, available: false },
    { id: 'node_5', floor: 5, type: 'elite', title: 'Kara Şövalyeler (Elit)', cleared: false, available: false },
    { id: 'node_6', floor: 6, type: 'shop', title: 'Büyük Şehir Pazarı', cleared: false, available: false },
    { id: 'node_7', floor: 7, type: 'boss', title: 'Büyük Han Turok', cleared: false, available: false },
  ]);

  const [currentNodeIndex, setCurrentNodeIndex] = useState<number>(-1);
  const [currentScreen, setCurrentScreen] = useState<GameScreen>('map');
  const [currentBattleState, setCurrentBattleState] = useState<GameBattleState | null>(null);
  const [activeWarband, setActiveWarband] = useState<EnemyWarband>(ENEMY_WARBANDS[0]);

  // Ses ve Yardım Rehberi Modalı
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);

  const toggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  // Haritadan Düğüm Seçimi
  const handleSelectNode = (node: MapNode, index: number) => {
    setCurrentNodeIndex(index);

    if (node.type === 'battle' || node.type === 'elite' || node.type === 'boss') {
      // Düşman ordusunu belirle
      let warband = ENEMY_WARBANDS[0];
      if (node.floor === 3) warband = ENEMY_WARBANDS[1];
      if (node.floor === 5) warband = ENEMY_WARBANDS[2];
      if (node.floor === 7) warband = ENEMY_WARBANDS[3];

      setActiveWarband(warband);

      // Savaş durumunu hazırla
      const initialBattle: GameBattleState = {
        playerCommander: {
          ...commander,
          energy: Math.min(5, commander.maxEnergy),
          block: 0,
          parryActive: false,
        },
        playerArmy: JSON.parse(JSON.stringify(playerArmy)),
        enemyWarband: JSON.parse(JSON.stringify(warband)),
        drawPile: [...deck].sort(() => 0.5 - Math.random()),
        hand: [],
        discardPile: [],
        exhaustPile: [],
        turn: 1,
        isPlayerTurn: true,
        logs: [`⚔️ Savaş başladı! ${warband.name} ordusu karşında.`],
        hasCombinedArmsBonus: false,
        bonusTurnEnergy: 0,
      };

      // İlk turda 5 kart çek
      for (let i = 0; i < 5; i++) {
        const card = initialBattle.drawPile.pop();
        if (card) initialBattle.hand.push(card);
      }

      setCurrentBattleState(initialBattle);
      setCurrentScreen('battle');
    } else if (node.type === 'shop') {
      setCurrentScreen('shop');
    } else if (node.type === 'camp') {
      setCurrentScreen('camp' as any);
    }
  };

  // Savaş Zaferi
  const handleBattleVictory = (finalState: GameBattleState) => {
    // Komutanın ve ordunun canını güncelle
    setCommander(prev => ({
      ...prev,
      hp: finalState.playerCommander.hp,
      gold: prev.gold + activeWarband.goldReward,
      food: prev.food + activeWarband.foodReward,
    }));
    setPlayerArmy(finalState.playerArmy);

    // Eğer son boss kesildiyse oyun tamamlandı
    if (currentNodeIndex === 6) {
      alert('Tebrikler! Kalradya Fatihi General Turok alt edildi ve Run & Conquer seferi zaferle tamamlandı!');
    }

    setCurrentScreen('victory');
  };

  // Zafer Ödülü Seçildiğinde
  const handleRewardSelected = (card: Card | null) => {
    if (card) {
      setDeck(prev => [...prev, card]);
    }
    setCurrentScreen('map');
  };

  // Kamp Dinlenmesi
  const handleCampRest = () => {
    const healAmount = Math.floor(commander.maxHp * 0.35);
    setCommander(prev => ({
      ...prev,
      hp: Math.min(prev.maxHp, prev.hp + healAmount),
    }));

    setPlayerArmy(prev =>
      prev.map(u => {
        if (!u) return null;
        return {
          ...u,
          hp: Math.min(u.maxHp, u.hp + Math.floor(u.maxHp * 0.4)),
          isDead: false,
        };
      })
    );
  };

  // Kamp Kart Geliştirmesi
  const handleCampUpgrade = (cardId: string) => {
    setDeck(prev =>
      prev.map(c => {
        if (c.id === cardId) {
          return {
            ...c,
            name: `${c.name} +`,
            cost: Math.max(0, c.cost - (c.cost > 1 ? 1 : 0)),
            description: `${c.description} (GELİŞTİRİLDİ: +3 Güç)`,
          };
        }
        return c;
      })
    );
  };

  // Oyunu Yeniden Başlat (Restart)
  const handleRestart = () => {
    setCommander({
      name: 'Komutan Aytac',
      title: 'Sancak Beyi',
      hp: 55,
      maxHp: 55,
      block: 0,
      stance: 'command',
      parryActive: false,
      adrenaline: 0,
      gold: 50,
      food: 3,
      energy: 3,
      maxEnergy: 5,
    });
    setPlayerArmy(getStarterArmy());
    setDeck(getStarterDeck());
    setCurrentNodeIndex(-1);
    setCurrentScreen('map');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      {/* ÜST GEZİNME VE BAŞLIK ÇUBUĞU */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500">
                RUN & CONQUER
              </h1>
              <p className="text-[10px] text-slate-400 font-semibold tracking-wide uppercase">
                Slay the Spire x Mount & Blade Deste Kurma Stratejisi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Oyun Kılavuzu / Yardım Butonu */}
            <button
              onClick={() => setShowGuide(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">Kılavuz & Kurallar</span>
            </button>

            {/* Ses Aç / Kapa */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              title={isMuted ? 'Sesi Aç' : 'Sesi Kapat'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            {/* Yeniden Başlat */}
            <button
              onClick={handleRestart}
              className="p-2 rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="Yeni Sefer Başlat"
            >
              <RotateCcw className="w-4 h-4 text-yellow-400" />
            </button>
          </div>
        </div>
      </header>

      {/* ANA OYUN EKRANI */}
      <main className="flex-1 py-4">
        {currentScreen === 'map' && (
          <MapView
            nodes={mapNodes}
            currentNodeIndex={currentNodeIndex}
            commander={commander}
            playerArmy={playerArmy}
            onSelectNode={handleSelectNode}
          />
        )}

        {currentScreen === 'battle' && currentBattleState && (
          <Battlefield
            initialState={currentBattleState}
            onVictory={handleBattleVictory}
            onDefeat={() => setCurrentScreen('gameover')}
          />
        )}

        {currentScreen === 'shop' && (
          <ShopView
            commander={commander}
            playerArmy={playerArmy}
            deck={deck}
            onUpdateCommander={setCommander}
            onUpdateArmy={setPlayerArmy}
            onAddCard={c => setDeck(prev => [...prev, c])}
            onRemoveCard={id => setDeck(prev => prev.filter(c => c.id !== id))}
            onLeaveShop={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'camp' && (
          <CampView
            commander={commander}
            playerArmy={playerArmy}
            deck={deck}
            onRest={handleCampRest}
            onUpgradeCard={handleCampUpgrade}
            onLeaveCamp={() => setCurrentScreen('map')}
          />
        )}

        {currentScreen === 'victory' && (
          <VictoryModal
            warband={activeWarband}
            onSelectReward={handleRewardSelected}
          />
        )}

        {currentScreen === 'gameover' && (
          <div className="max-w-md mx-auto p-8 text-center space-y-5 bg-slate-900 border-2 border-rose-600 rounded-3xl shadow-2xl my-12">
            <div className="w-16 h-16 rounded-2xl bg-rose-950 border border-rose-500 mx-auto flex items-center justify-center text-rose-400">
              <Skull className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black text-rose-400">ORDU BOZGUNA UĞRADI!</h2>
            <p className="text-xs text-slate-300">
              Komutan savaş meydanında düştü ve sancağınız yere serildi. Ancak gerçek bir lider her yenilgiden ders çıkararak geri döner.
            </p>
            <button
              onClick={handleRestart}
              className="bg-rose-600 hover:bg-rose-500 text-white font-black px-6 py-2.5 rounded-xl shadow-lg transition-transform active:scale-95 cursor-pointer text-sm"
            >
              Yeni Bir Ordu Topla ve Yeniden Başla
            </button>
          </div>
        )}
      </main>

      {/* ALT BİLGİ */}
      <footer className="border-t border-slate-900 py-2.5 text-center text-[11px] text-slate-500">
        Run & Conquer • Slay the Spire Kart Mekaniği & Mount & Blade Ordu Taktikleri • 5 Birlik Kapasitesi
      </footer>

      {/* OYUN KILAVUZU & MEKANİK REHBERİ MODALI */}
      {showGuide && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/70 rounded-3xl max-w-2xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-amber-300 flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <span>Run & Conquer: Temel Kurallar ve Taktikler</span>
              </h3>
              <button
                onClick={() => setShowGuide(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer px-2 py-1 rounded bg-slate-800"
              >
                Kapat
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                  <Swords className="w-4 h-4" /> 1. Komutanın Ön Saf ve Taktik Safı (Mount & Blade Ruhu)
                </h4>
                <p>
                  Savaşta sadece arkada durmak zorunda değilsiniz! <strong>"Ön Safa Geç"</strong> butonuna basarak meydana inebilirsiniz. Ön safta komutanın kılıç darbeleri güçlenir ancak düşmanların doğrudan hedefi olursunuz.
                </p>
                <p className="mt-1 text-slate-300">
                  ⚔️ <strong>Ön Hat Kararlılığı:</strong> Ön safa geçiş kesin bir karardır. Vurup hemen arkaya kaçamazsınız; düşman turunu göğüsleyip kendi sıranız gelene kadar ön hatta kalırsınız. Yeni turunuz başladığında ister ön safta devam edebilir ister taktik safına geri çekilebilirsiniz.
                </p>
                <p className="mt-1 text-slate-400">
                  🛡️ <strong>Muhafız Bağı:</strong> Ön saftayken hasar alırsanız, sağ kalan piyadeleriniz hasarın %40'ını kalkanlarıyla göğüsler. Ayrıca <strong>Savuşturma (Parry)</strong> kartı ile ilk darbeyi tamamen engelleyebilirsiniz!
                </p>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                  <Shield className="w-4 h-4" /> 2. 5 Birlik Kapasitesi & Sınıf Dengesi (Anti-Spam)
                </h4>
                <p>
                  Ordunuz en fazla 5 birlikten oluşur. "Sadece en güçlü sınıfı alırsam kazanırım" algısını kırmak için Taş-Kağıt-Makas ve Kombine Harp kuralı geçerlidir:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                  <li><strong>Piyade:</strong> Süvari hücumlarını durdurur, kalkan duvarı ile komutanı korur.</li>
                  <li><strong>Süvari:</strong> Okçuları kanatlar ve ezer (+%50 hasar). Boş kanatta 0 enerjiye hücum eder.</li>
                  <li><strong>Okçu:</strong> Ağır zırhlıları uzaktan deler, düşmanı sabitler.</li>
                  <li><strong>Ağır Zırhlı:</strong> Piyadelerin kalkan bloklarını tek darbede kırar.</li>
                  <li>🌟 <strong>Kombine Harp Bonusu:</strong> Ordunuzda en az 3 farklı sınıf varsa, her tur +1 Kart ve +4 Blok kazanırsınız!</li>
                </ul>
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <h4 className="font-bold text-yellow-400 mb-1 flex items-center gap-1.5">
                  <Crown className="w-4 h-4" /> 3. Dinamik ve 0-Bedelli Kartlar (Slay the Spire Ruhu)
                </h4>
                <p>
                  Tura 3 enerji ile başlarsınız (maksimum 5 enerjiye kadar çıkabilir). Ancak her kart enerji tüketmez:
                </p>
                <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-300">
                  <li><strong>Komutanın Gazabı:</strong> 0 Enerjidir, hasar verir ve mezarlığa gitmek yerine destenin en üstüne döner!</li>
                  <li><strong>Kalkan Darbesi:</strong> Mevcut toplam kalkanınız kadar doğrudan hasar vurur.</li>
                  <li><strong>Kanat Akını:</strong> Turun ilk kartıysa veya düşmanda piyade yoksa 0 Enerjiye düşer.</li>
                  <li><strong>Yiyecek & Erzak:</strong> Çantanızdaki yiyecekle can yenileyip o tur +1 Enerji kazanabilirsiniz.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default App;
