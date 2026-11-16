import React, { useState } from 'react';
import type { GameBattleState, Card, ArmyUnit } from '../types/game';
import { CardView } from './CardView';
import { ArmySlot } from './ArmySlot';
import { CommanderView } from './CommanderView';
import { sounds } from '../utils/audio';
import { getUnitAdvantage } from '../data/units';
import { generateNextIntent } from '../data/enemies';
import { Zap, Layers, RefreshCw, Sparkles, Shield, Swords, Target } from 'lucide-react';

interface BattlefieldProps {
  initialState: GameBattleState;
  onVictory: (finalState: GameBattleState) => void;
  onDefeat: () => void;
}

export const Battlefield: React.FC<BattlefieldProps> = ({ initialState, onVictory, onDefeat }) => {
  const [battleState, setBattleState] = useState<GameBattleState>(initialState);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [hitFeedback, setHitFeedback] = useState<{ target: number | 'commander'; text: string; id: number } | null>(null);

  // Kombine Harp Kontrolü: 3+ farklı yaşayan birlik tipi var mı?
  const checkCombinedArms = (army: (ArmyUnit | null)[]) => {
    const aliveClasses = new Set(
      army.filter(u => u !== null && !u.isDead && u.hp > 0).map(u => u!.unitClass)
    );
    return aliveClasses.size >= 3;
  };

  // Kart Seçimi & Hedefleme Başlatma
  const handleCardClick = (card: Card) => {
    // Dinamik bedel hesapla
    let cost = card.cost;
    if (card.isDynamicCost && card.dynamicCostCalculator) {
      cost = card.dynamicCostCalculator(battleState);
    }

    if (battleState.playerCommander.energy < cost) {
      return;
    }

    // Hedef gerektirmeyen kartlar doğrudan uygulanır
    if (card.targetType === 'self' || card.targetType === 'army' || card.targetType === 'all-enemies') {
      applyCardPlay(card, null);
    } else {
      // Tek hedefli kart ise:
      // Eğer aynı kart tekrar tıklandıysa, otomatik olarak ilk canlı düşmana uygula!
      if (selectedCard?.id === card.id) {
        applyCardPlay(card, null);
      } else {
        setSelectedCard(card);
      }
    }
  };

  // Kart Etkisini Uygula
  const applyCardPlay = (card: Card, targetIndex: number | 'commander' | null) => {
    let cost = card.cost;
    if (card.isDynamicCost && card.dynamicCostCalculator) {
      cost = card.dynamicCostCalculator(battleState);
    }

    sounds.playCardPlay();

    setBattleState(prev => {
      const newState: GameBattleState = JSON.parse(JSON.stringify(prev));
      const commander = newState.playerCommander;
      commander.energy -= cost;

      const newLogs = [...newState.logs];
      const isVanguard = commander.stance === 'vanguard';

      // Otomatik hedefleme: tek hedefli kartta hedef null ise ilk canlı düşmana yönlendir
      if (card.targetType === 'single-enemy' && targetIndex === null) {
        const firstAlive = newState.enemyWarband.units.findIndex(u => !u.isDead);
        targetIndex = firstAlive !== -1 ? firstAlive : 'commander';
      }

      // Kart anahtarını belirle (sağlam tanımlayıcı)
      const key =
        card.cardKey ||
        (card.id.includes('strike')
          ? 'strike'
          : card.id.includes('defend')
          ? 'defend'
          : card.id.includes('rally')
          ? 'rally'
          : card.id);

      // --- KART EFEKT UYGULAMASI ---
      if (key === 'strike') {
        sounds.playSwordSlash();
        const baseDmg = isVanguard ? 9 : 6;
        applyDamageToTarget(newState, targetIndex, baseDmg, newLogs, 'Komutan Kılıç Darbesi');
      } else if (key === 'defend') {
        sounds.playShieldBlock();
        commander.block += 5;
        newLogs.unshift('Komutan kalkanını kaldırdı (+5 Blok).');
      } else if (key === 'rally') {
        sounds.playShieldBlock();
        commander.block += 3;
        newState.playerArmy.forEach(u => {
          if (u && !u.isDead) u.block += 3;
        });
        drawCards(newState, 1);
        newLogs.unshift('Komuta Narası! Tüm orduya +3 Blok ve 1 Kart çekildi.');
      } else if (key === 'war_horn') {
        // ENERJİ GÜÇLENDİRMESİ: +2 Enerji (en fazla 5) ve 1 Kart çek
        sounds.playVictory();
        commander.energy = Math.min(5, commander.energy + 2);
        drawCards(newState, 1);
        newLogs.unshift('📯 Hücum Borusu çalındı! Komutan +2 Enerji kazandı (Maks 5 Sınırlı) ve 1 Kart çekildi.');
      } else if (key === 'war_banner') {
        // KALICI TUR ENERJİSİ GÜÇLENDİRMESİ
        sounds.playVictory();
        newState.bonusTurnEnergy = (newState.bonusTurnEnergy || 0) + 1;
        newLogs.unshift('🚩 Savaş Sancağı dikildi! Bu savaş boyunca HER TUR +1 Ekstra Enerji kazanacaksın (Maks 5).');
      } else if (key === 'rallying_drill') {
        sounds.playShieldBlock();
        commander.energy = Math.min(5, commander.energy + 1);
        commander.block += 5;
        newState.playerArmy.forEach(u => {
          if (u && !u.isDead) u.block += 5;
        });
        newLogs.unshift('⚔️ Taktik Disiplin: +1 Enerji (Maks 5) ve tüm orduya +5 Blok sağlandı.');
      } else if (key === 'anger' || card.isAngerMechanic) {
        sounds.playSwordSlash();
        const dmg = isVanguard ? 8 : 6;
        applyDamageToTarget(newState, targetIndex, dmg, newLogs, 'Komutanın Gazabı');
      } else if (key === 'shield_bash' || card.isBodySlamMechanic) {
        sounds.playShieldBlock();
        const totalBlock = commander.block;
        applyDamageToTarget(
          newState,
          targetIndex,
          Math.max(1, totalBlock),
          newLogs,
          `Kalkan Darbesi (${totalBlock} Hasar)`
        );
      } else if (key === 'flank_charge') {
        sounds.playCavalryCharge();
        applyDamageToTarget(newState, targetIndex, 14, newLogs, 'Kanat Akını (Süvari)');
      } else if (key === 'pinning_volley') {
        sounds.playArrowShot();
        applyDamageToTarget(newState, targetIndex, 9, newLogs, 'Hedefli Yaylım Ateşi (3x3)');
        if (typeof targetIndex === 'number' && newState.enemyWarband.units[targetIndex]) {
          newState.enemyWarband.units[targetIndex].status.pinned = 2;
          newLogs.unshift(`${newState.enemyWarband.units[targetIndex].name} 2 tur Sabitlendi (Pinned)!`);
        }
      } else if (key === 'parry_and_counter') {
        sounds.playShieldBlock();
        commander.block += 6;
        commander.parryActive = true;
        newLogs.unshift('Savuşturma hazırlandı! Bir sonraki düşman darbesi engellenecek.');
      } else if (key === 'infantry_phalanx') {
        sounds.playShieldBlock();
        const infantryCount = newState.playerArmy.filter(u => u && !u.isDead && u.unitClass === 'infantry').length;
        const totalAdd = Math.max(1, infantryCount) * 6;
        commander.block += totalAdd;
        newState.playerArmy.forEach(u => {
          if (u && !u.isDead) u.block += totalAdd;
        });
        newLogs.unshift(`Kalkan Duvarı! Canlı ${infantryCount} piyade ile her birime +${totalAdd} Blok sağlandı.`);
      } else if (key === 'infantry_spear_wall') {
        sounds.playShieldBlock();
        commander.block += 8;
        newLogs.unshift('Süngü Karşılama! Komutana +8 Blok verildi.');
      } else if (key === 'archer_rain_arrows') {
        sounds.playArrowShot();
        newState.enemyWarband.commanderHp = Math.max(0, newState.enemyWarband.commanderHp - 7);
        newState.enemyWarband.units.forEach(u => {
          if (!u.isDead) {
            u.hp = Math.max(0, u.hp - 7);
            if (u.hp <= 0) u.isDead = true;
          }
        });
        newLogs.unshift('Ok Yağmuru! Tüm düşman saflarına 7 menzilli hasar indi.');
      } else if (key === 'cavalry_trample') {
        sounds.playCavalryCharge();
        let dmg = 11;
        if (typeof targetIndex === 'number' && newState.enemyWarband.units[targetIndex]?.unitClass === 'archer') {
          dmg = 16;
          newLogs.unshift('Atlılar Düşman Okçusunu Çiğnedi! (+%50 Bonus Hasar)');
        }
        applyDamageToTarget(newState, targetIndex, dmg, newLogs, 'Ezici Süvari Koşusu');
      } else if (key === 'heavy_armor_crush') {
        sounds.playHeavySmash();
        if (typeof targetIndex === 'number' && newState.enemyWarband.units[targetIndex]) {
          newState.enemyWarband.units[targetIndex].block = 0;
        } else if (targetIndex === 'commander') {
          newState.enemyWarband.commanderBlock = 0;
        }
        applyDamageToTarget(newState, targetIndex, 12, newLogs, 'Zırh Kıran Gürz (Blok Sıfırlandı!)');
      } else if (key === 'heavy_cleave') {
        sounds.playHeavySmash();
        newState.enemyWarband.commanderHp = Math.max(0, newState.enemyWarband.commanderHp - 10);
        newState.enemyWarband.units.forEach(u => {
          if (!u.isDead) {
            u.hp = Math.max(0, u.hp - 10);
            if (u.hp <= 0) u.isDead = true;
          }
        });
        newLogs.unshift('Geniş Balta Savuruşu! Tüm düşman safları 10 hasar ile yarıldı.');
      } else if (key === 'combined_arms_assault') {
        sounds.playSwordSlash();
        applyDamageToTarget(newState, targetIndex, 8, newLogs, 'Kombine Hücum');
        if (checkCombinedArms(newState.playerArmy)) {
          drawCards(newState, 2);
          commander.energy = Math.min(5, commander.energy + 1);
          newLogs.unshift('Kombine Harp Bonusu Tetiklendi: +2 Kart ve +1 Enerji (Maks 5) sağlandı!');
        }
      } else if (key === 'battlefield_ration') {
        sounds.playEatFood();
        commander.food = Math.max(0, commander.food - 1);
        commander.hp = Math.min(commander.maxHp, commander.hp + 10);
        commander.energy = Math.min(5, commander.energy + 1);
        newLogs.unshift('Savaş Erzakı tüketildi: Komutan +10 HP ve +1 Enerji kazandı (Maks 5)!');
      } else if (key === 'bodyguard_sacrifice') {
        sounds.playShieldBlock();
        commander.block += 12;
        const aliveInfantry = newState.playerArmy.find(u => u && !u.isDead && u.unitClass === 'infantry');
        if (aliveInfantry) {
          aliveInfantry.hp = Math.max(1, aliveInfantry.hp - 3);
          newLogs.unshift(`Muhafız Kalkanı: ${aliveInfantry.name} komutanın önüne atıldı (-3 HP, Komutana +12 Blok).`);
        }
      } else if (key === 'duel_challenge') {
        sounds.playSwordSlash();
        newState.enemyWarband.commanderHp = Math.max(0, newState.enemyWarband.commanderHp - 15);
        commander.energy = Math.min(5, commander.energy + 2);
        newLogs.unshift(`Meydan Okuma: Düşman Komutanına 15 düello hasarı vuruldu ve +2 Enerji morali kazanıldı (Maks 5)!`);
      }

      // Kartı elden çıkar (Anger ise destenin üstüne koy - abuse önleme mekanizması)
      const handIndex = newState.hand.findIndex(c => c.id === card.id);
      if (handIndex !== -1) {
        const [playedCard] = newState.hand.splice(handIndex, 1);
        if (key === 'anger' || card.isAngerMechanic) {
          const usesThisTurn = newState.angerDeckTopUsesThisTurn || 0;
          if (usesThisTurn === 0) {
            newState.drawPile.unshift(playedCard);
            newState.angerDeckTopUsesThisTurn = 1;
            newLogs.unshift('Komutanın Gazabı destenin EN ÜSTÜNE yerleşti (Turda 1 kez).');
          } else {
            // Abuse önleme: Aynı turda tekrar oynanırsa mezarlığa gönderilir
            newState.discardPile.push(playedCard);
            newLogs.unshift('Komutanın Gazabı mezarlığa gönderildi (Aynı tur içinde sınırsız döngü engellendi).');
          }
        } else {
          newState.discardPile.push(playedCard);
        }
      }

      // Zafer kontrolü
      const allEnemyUnitsDead = newState.enemyWarband.units.every(u => u.isDead);
      const enemyCommanderDead = newState.enemyWarband.commanderHp <= 0;

      if (enemyCommanderDead || (allEnemyUnitsDead && newState.enemyWarband.commanderHp <= 0)) {
        setTimeout(() => onVictory(newState), 600);
      }

      newState.logs = newLogs.slice(0, 8);
      return newState;
    });

    setSelectedCard(null);
  };

  // Hasar Hesaplama ve Dağıtımı (Kalkan -> Can)
  const applyDamageToTarget = (
    state: GameBattleState,
    target: number | 'commander' | null,
    amount: number,
    logs: string[],
    sourceName: string
  ) => {
    // Otomatik hedef seçimi: Eğer target null geldiyse ilk canlı düşmana yönlendir
    if (target === null) {
      const firstAliveIdx = state.enemyWarband.units.findIndex(u => !u.isDead);
      target = firstAliveIdx !== -1 ? firstAliveIdx : 'commander';
    }

    if (target === 'commander') {
      let remainingDmg = amount;
      if (state.enemyWarband.commanderBlock > 0) {
        const absorbed = Math.min(state.enemyWarband.commanderBlock, remainingDmg);
        state.enemyWarband.commanderBlock -= absorbed;
        remainingDmg -= absorbed;
      }
      state.enemyWarband.commanderHp = Math.max(0, state.enemyWarband.commanderHp - remainingDmg);
      logs.unshift(`${sourceName} düşman komutanına ${amount} hasar verdi! (Kalan HP: ${state.enemyWarband.commanderHp})`);

      setHitFeedback({ target: 'commander', text: `-${amount}`, id: Date.now() });
      setTimeout(() => setHitFeedback(null), 1000);
    } else if (typeof target === 'number' && state.enemyWarband.units[target]) {
      const unit = state.enemyWarband.units[target];
      let dmg = amount;

      if (unit.block > 0) {
        const absorbed = Math.min(unit.block, dmg);
        unit.block -= absorbed;
        dmg -= absorbed;
      }
      unit.hp = Math.max(0, unit.hp - dmg);
      if (unit.hp <= 0) {
        unit.isDead = true;
        logs.unshift(`Düşman ${unit.name} savaş dışı kaldı!`);
      } else {
        logs.unshift(`${sourceName} düşman ${unit.name} birliğine ${amount} hasar vurdu.`);
      }

      setHitFeedback({ target: target, text: `-${amount}`, id: Date.now() });
      setTimeout(() => setHitFeedback(null), 1000);
    }
  };

  // Kart Çekme Fonksiyonu
  const drawCards = (state: GameBattleState, count: number) => {
    for (let i = 0; i < count; i++) {
      if (state.drawPile.length === 0) {
        if (state.discardPile.length === 0) break;
        state.drawPile = [...state.discardPile].sort(() => 0.5 - Math.random());
        state.discardPile = [];
      }
      const card = state.drawPile.pop();
      if (card) state.hand.push(card);
    }
  };

  // Komutan Duruşu Değiştirme (Taktik Safı <-> Ön Saf)
  const handleToggleStance = () => {
    setBattleState(prev => {
      // Eğer ön saf kilitliyse (kendi turuna kadar geri çekilme yasak)
      if (prev.stanceLockedUntilNextTurn) {
        return prev;
      }

      const nextStance = prev.playerCommander.stance === 'command' ? 'vanguard' : 'command';
      let isLocked = false;
      let logMsg = '';

      if (nextStance === 'vanguard') {
        isLocked = true; // Ön safa geçen oyuncu kendi turu gelene kadar ön safta kalmak zorundadır
        logMsg = '⚔️ Komutan ÖN SAFA GEÇTİ! Kendi turuna kadar ön safta kalacaksın (Muhafız Bağı devrede).';
      } else {
        logMsg = '🛡️ Komutan TAKTİK SAFI\'na çekildi. Güvenli komuta moduna geçildi.';
      }

      return {
        ...prev,
        stanceLockedUntilNextTurn: isLocked,
        playerCommander: {
          ...prev.playerCommander,
          stance: nextStance,
        },
        logs: [logMsg, ...prev.logs].slice(0, 8),
      };
    });
  };

  // TURU BİTİR (Düşman Hamleleri & Intent Yürütme)
  const handleEndTurn = () => {
    const stateCopy: GameBattleState = JSON.parse(JSON.stringify(battleState));
    stateCopy.discardPile.push(...stateCopy.hand);
    stateCopy.hand = [];

    const logs = [...stateCopy.logs];
    logs.unshift('--- DÜŞMANIN HAMLE SIRASI ---');

    // Düşman Komutanı Hamlesi
    const enemyCommander = stateCopy.enemyWarband;
    if (enemyCommander.commanderHp > 0) {
      executeEnemyAction(
        enemyCommander.commanderIntent,
        enemyCommander.commanderName,
        stateCopy,
        logs,
        true
      );
    }

    // Düşman Birlikleri Hamlesi
    enemyCommander.units.forEach(u => {
      if (!u.isDead && u.hp > 0) {
        executeEnemyAction(u.intent, u.name, stateCopy, logs, false, u);
      }
    });

    if (stateCopy.playerCommander.hp <= 0) {
      setTimeout(() => onDefeat(), 500);
      return;
    }

    // Yeni Tur Başlangıcı:
    // Oyuncu kendi turuna ulaştığında Ön Saf kilidi kalkar ve abuse sayacı sıfırlanır
    stateCopy.turn += 1;
    stateCopy.stanceLockedUntilNextTurn = false;
    stateCopy.angerDeckTopUsesThisTurn = 0;

    const bonusEnergy = stateCopy.bonusTurnEnergy || 0;
    const turnEnergy = Math.min(5, stateCopy.playerCommander.maxEnergy + bonusEnergy);
    stateCopy.playerCommander.energy = turnEnergy;

    let cardsToDraw = 5;

    // Kombine Harp Bonusu (3+ farklı sınıf varsa)
    const hasCombined = checkCombinedArms(stateCopy.playerArmy);
    stateCopy.hasCombinedArmsBonus = hasCombined;
    if (hasCombined) {
      cardsToDraw += 1;
      stateCopy.playerCommander.block += 4;
      logs.unshift('🌟 Kombine Harp Bonusu: +1 Ekstra Kart Çekildi ve +4 Ordu Bloğu sağlandı!');
    }

    // Blokları sıfırla (yeni tur)
    stateCopy.playerCommander.block = 0;
    stateCopy.playerArmy.forEach(u => {
      if (u) u.block = 0;
    });

    // Kartları çek
    drawCards(stateCopy, cardsToDraw);

    // Düşmanlara yeni niyetler (intent) ata
    stateCopy.enemyWarband.units.forEach(u => {
      if (!u.isDead) {
        u.intent = generateNextIntent(u, stateCopy.turn);
      }
    });

    stateCopy.logs = logs.slice(0, 8);
    setBattleState(stateCopy);
  };

  // Düşman Eylemi
  const executeEnemyAction = (
    intent: any,
    attackerName: string,
    state: GameBattleState,
    logs: string[],
    isBoss: boolean = false,
    unitRef?: ArmyUnit
  ) => {
    if (intent.type === 'defend') {
      if (isBoss) {
        state.enemyWarband.commanderBlock += intent.value;
      } else if (unitRef) {
        unitRef.block += intent.value;
      }
      logs.unshift(`${attackerName} savunma pozisyonu aldı (+${intent.value} Blok).`);
      return;
    }

    const isVanguard = state.playerCommander.stance === 'vanguard';
    const hasParry = state.playerCommander.parryActive;

    let targetIsCommander = isVanguard || isBoss;
    let incomingDamage = intent.value;

    if (targetIsCommander) {
      if (hasParry) {
        sounds.playShieldBlock();
        state.playerCommander.parryActive = false;
        logs.unshift(`⚡ ${state.playerCommander.name} gelen darbeyi kusursuz savuşturdu (0 Hasar)!`);
        return;
      }

      const aliveInfantry = state.playerArmy.find(u => u && !u.isDead && u.unitClass === 'infantry');
      if (isVanguard && aliveInfantry) {
        const absorbedByInfantry = Math.floor(incomingDamage * 0.4);
        incomingDamage -= absorbedByInfantry;
        aliveInfantry.hp = Math.max(0, aliveInfantry.hp - absorbedByInfantry);
        if (aliveInfantry.hp <= 0) aliveInfantry.isDead = true;
        logs.unshift(`🛡️ Muhafız Bağı: ${aliveInfantry.name} komutanın önünde siper oldu (-${absorbedByInfantry} HP).`);
      }

      if (state.playerCommander.block > 0) {
        const blocked = Math.min(state.playerCommander.block, incomingDamage);
        state.playerCommander.block -= blocked;
        incomingDamage -= blocked;
      }

      state.playerCommander.hp = Math.max(0, state.playerCommander.hp - incomingDamage);
      logs.unshift(`${attackerName} Komutana saldırdı! (-${incomingDamage} Can)`);
    } else {
      const alivePlayerUnits = state.playerArmy.filter(u => u && !u.isDead);
      if (alivePlayerUnits.length > 0) {
        const targetUnit = alivePlayerUnits[Math.floor(Math.random() * alivePlayerUnits.length)]!;
        let unitDmg = incomingDamage;

        if (unitRef) {
          const adv = getUnitAdvantage(unitRef.unitClass, targetUnit.unitClass);
          unitDmg = Math.floor(unitDmg * adv.multiplier);
        }

        if (targetUnit.block > 0) {
          const blocked = Math.min(targetUnit.block, unitDmg);
          targetUnit.block -= blocked;
          unitDmg -= blocked;
        }

        targetUnit.hp = Math.max(0, targetUnit.hp - unitDmg);
        if (targetUnit.hp <= 0) {
          targetUnit.isDead = true;
          logs.unshift(`⚔️ Askeriniz ${targetUnit.name} savaşta düştü!`);
        } else {
          logs.unshift(`${attackerName} birliğiniz ${targetUnit.name}'e saldırdı (-${unitDmg} HP).`);
        }
      }
    }
  };

  const isTargetingMode = selectedCard !== null;
  const isVanguard = battleState.playerCommander.stance === 'vanguard';

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col justify-between min-h-[92vh] select-none">
      {/* 1. ÜST ALAN: DÜŞMAN ORDUSU (Düşman Komutanı + 5 Slot Düşman Askeri) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 shadow-2xl relative">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-widest text-rose-400">
              DÜŞMAN CEPHESİ:
            </span>
            <span className="text-sm font-black text-slate-100">
              {battleState.enemyWarband.name}
            </span>
          </div>

          {isTargetingMode && (
            <div className="bg-rose-950 border border-rose-500 text-rose-200 text-xs px-3 py-1 rounded-full animate-pulse flex items-center gap-1.5 font-bold">
              <Target className="w-4 h-4 text-rose-400" />
              <span>Vurmak istediğin düşmana tıkla (veya karta tekrar tıkla)!</span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 relative">
          {/* Düşman Komutanı */}
          <div className="relative">
            <CommanderView
              commander={{
                name: battleState.enemyWarband.commanderName,
                title: 'Düşman Generali',
                hp: battleState.enemyWarband.commanderHp,
                maxHp: battleState.enemyWarband.commanderMaxHp,
                block: battleState.enemyWarband.commanderBlock,
                stance: 'command',
                parryActive: false,
                adrenaline: 0,
                gold: 0,
                food: 0,
                energy: 0,
                maxEnergy: 0,
              }}
              isEnemy={true}
              intent={battleState.enemyWarband.commanderIntent}
              isTargetable={isTargetingMode}
              onSelect={() => selectedCard && applyCardPlay(selectedCard, 'commander')}
            />
            {hitFeedback && hitFeedback.target === 'commander' && (
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(239,68,68,0.9)] animate-bounce pointer-events-none z-30">
                {hitFeedback.text}
              </div>
            )}
          </div>

          {/* Düşman Askerleri (Maks 5 Slot) */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {battleState.enemyWarband.units.map((unit, idx) => (
              <div key={unit.id} className="relative">
                <ArmySlot
                  unit={unit}
                  slotIndex={idx}
                  isEnemy={true}
                  intent={unit.intent}
                  isTargetable={isTargetingMode}
                  onSelect={() => selectedCard && applyCardPlay(selectedCard, idx)}
                />
                {hitFeedback && hitFeedback.target === idx && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-black text-2xl text-yellow-300 drop-shadow-[0_2px_10px_rgba(239,68,68,0.9)] animate-bounce pointer-events-none z-30">
                    {hitFeedback.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. ORTA ALAN: SAVAŞ MEYDANI, TUR BİLGİSİ & COMBAT LOG */}
      <div className="my-3 grid grid-cols-1 md:grid-cols-3 items-center gap-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl p-3">
        {/* Sol: Kombine Harp & Strateji Bildirimi */}
        <div className="flex flex-col gap-1 text-xs">
          <div className="flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-slate-200">Kombine Harp Doktrini:</span>
          </div>
          {checkCombinedArms(battleState.playerArmy) ? (
            <span className="text-emerald-400 font-semibold bg-emerald-950/40 border border-emerald-800/60 px-2 py-0.5 rounded">
              ✓ AKTİF (3+ Farklı Sınıf): Her tur +1 Kart & +4 Takım Bloğu
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">
              En az 3 farklı sınıf (Piyade, Okçu, Atlı, Ağır) toplayarak kombine harp bonusunu aç.
            </span>
          )}
        </div>

        {/* Orta: Tur ve Savaş Günlüğü (Combat Log) */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2 h-20 overflow-y-auto text-[11px] space-y-1">
          {battleState.logs.map((log, i) => (
            <div key={i} className="text-slate-300">
              • {log}
            </div>
          ))}
        </div>

        {/* Sağ: Tur Bitir & Enerji Göstergesi (Maksimum 5 Enerji Sınırlı) */}
        <div className="flex items-center justify-end gap-3">
          {/* Slay the Spire Enerji Küresi (En Fazla 5 ile Sınırlandırılmış) */}
          <div className="flex items-center gap-2 bg-slate-900 border-2 border-yellow-500/80 rounded-2xl px-3 py-1.5 shadow-lg">
            <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            <div className="text-left">
              <span className="text-[10px] text-slate-400 block font-bold leading-tight">ENERJİ (MAKS 5)</span>
              <span className="text-lg font-black text-yellow-300 leading-tight">
                {battleState.playerCommander.energy} / {Math.min(5, battleState.playerCommander.maxEnergy)}
              </span>
            </div>
          </div>

          <button
            onClick={handleEndTurn}
            className="bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white font-black px-5 py-2.5 rounded-2xl shadow-lg border border-red-400/50 transition-transform active:scale-95 cursor-pointer text-sm"
          >
            Turu Bitir
          </button>
        </div>
      </div>

      {/* 3. ALT ALAN: OYUNCU ORDUSU (Komutan + 5 Slot Birlik) */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-4 shadow-2xl relative mb-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-black tracking-widest text-amber-400">
              SENİN ORDUN (MAKSİMUM 5 BİRLİK):
            </span>
            <span className="text-xs text-slate-400">
              Tur {battleState.turn} - {isVanguard ? 'Ön Saf Modu' : 'Taktik Safı'}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            <span>Toplam Komutan Kalkanı: {battleState.playerCommander.block}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4">
          {/* Oyuncu Komutanı (Ön Saf / Taktik Safı Değişimi ile) */}
          <CommanderView
            commander={battleState.playerCommander}
            isEnemy={false}
            isStanceLocked={battleState.stanceLockedUntilNextTurn}
            onToggleStance={handleToggleStance}
          />

          {/* 5 Birlik Slotu */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            {battleState.playerArmy.map((unit, idx) => (
              <ArmySlot
                key={unit ? unit.id : `empty_${idx}`}
                unit={unit}
                slotIndex={idx}
                isEnemy={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 4. KART ELİ & DESTE BİLGİSİ (Slay The Spire Tarzı) */}
      <div className="relative pt-2">
        <div className="flex justify-between items-center px-4 mb-2 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span>Çekme Destesi: {battleState.drawPile.length}</span>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            {isTargetingMode ? (
              <span className="text-yellow-300 font-bold animate-pulse flex items-center gap-1">
                <Target className="w-3.5 h-3.5" /> Hedef Seç: {selectedCard?.name} (Vurmak için düşmana veya karta tekrar tıkla)
              </span>
            ) : (
              <span>Oynamak için karta tıkla</span>
            )}
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Mezarlık: {battleState.discardPile.length}</span>
          </div>
        </div>

        {/* Kartlar */}
        <div className="flex items-center justify-center -space-x-3 overflow-x-auto py-2 px-6">
          {battleState.hand.map(card => {
            const isSelected = selectedCard?.id === card.id;
            return (
              <div
                key={card.id}
                className={`animate-card-in transition-transform ${isSelected ? '-translate-y-6 scale-105 z-40' : ''}`}
              >
                <CardView
                  card={card}
                  battleState={battleState}
                  onPlay={handleCardClick}
                  disabled={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
