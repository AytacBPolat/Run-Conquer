export type UnitClass = 'infantry' | 'archer' | 'cavalry' | 'heavy';

export interface ArmyUnit {
  id: string;
  name: string;
  unitClass: UnitClass;
  hp: number;
  maxHp: number;
  tier: number; // 1, 2, 3
  attackPower: number;
  block: number;
  isDead?: boolean;
  status: {
    pinned?: number; // Okçu veya mızrak tarafından sabitlenmiş
    shielded?: number;
    bleeding?: number;
    staggered?: number;
  };
}

export type StanceType = 'command' | 'vanguard'; // Taktik Safı vs Ön Saf

export interface Commander {
  name: string;
  title: string;
  hp: number;
  maxHp: number;
  block: number;
  stance: StanceType;
  parryActive: boolean;
  adrenaline: number; // 0 to 100
  gold: number;
  food: number; // Yiyecek ile can yenilenir
  energy: number;
  maxEnergy: number; // Varsayılan 3, maksimum 5
}

export type CardType = 'commander' | 'unit' | 'tactics';
export type CardRarity = 'starter' | 'common' | 'uncommon' | 'rare';
export type TargetType = 'single-enemy' | 'all-enemies' | 'self' | 'army';

export interface Card {
  id: string;
  cardKey: string; // Kararlı kart kimliği (ör. 'strike', 'defend', 'war_horn')
  name: string;
  cardType: CardType;
  requiredClass?: UnitClass; // Eğer varsa, orduda en az 1 canlı bu sınıftan olmalı
  rarity: CardRarity;
  cost: number; // Enerji bedeli (0 - 5)
  description: string;
  flavor?: string;
  targetType: TargetType;
  // Özel mekanik bayrakları
  isAngerMechanic?: boolean; // 0 bedel, vurup destenin üstüne geri döner
  isBodySlamMechanic?: boolean; // Mevcut blok kadar hasar vurur
  isDynamicCost?: boolean; // Koşula göre bedeli değişir
  dynamicCostCalculator?: (state: GameBattleState) => number;
  canPlayCheck?: (state: GameBattleState) => { canPlay: boolean; reason?: string };
}

export type EnemyIntentType = 'attack' | 'heavy_attack' | 'defend' | 'buff' | 'volley';

export interface EnemyIntent {
  type: EnemyIntentType;
  value: number;
  targetUnitIndex?: number | 'commander';
  description: string;
}

export interface EnemyUnit extends ArmyUnit {
  intent: EnemyIntent;
}

export interface EnemyWarband {
  id: string;
  name: string;
  commanderName: string;
  commanderHp: number;
  commanderMaxHp: number;
  commanderBlock: number;
  commanderIntent: EnemyIntent;
  units: EnemyUnit[];
  goldReward: number;
  foodReward: number;
}

export interface GameBattleState {
  playerCommander: Commander;
  playerArmy: (ArmyUnit | null)[]; // 5 slot
  enemyWarband: EnemyWarband;
  drawPile: Card[];
  hand: Card[];
  discardPile: Card[];
  exhaustPile: Card[];
  turn: number;
  isPlayerTurn: boolean;
  logs: string[];
  hasCombinedArmsBonus: boolean;
  bonusTurnEnergy?: number; // Savaş Sancağı gibi güçlendirmelerle her tur gelen ekstra enerji
  stanceLockedUntilNextTurn?: boolean; // Ön safa geçince tur sonuna kadar geri çekilmeyi kilitler
  angerDeckTopUsesThisTurn?: number; // Komutanın Gazabı abuse önleme sayacı
}

export type GameScreen = 'map' | 'battle' | 'shop' | 'victory' | 'gameover';

export interface MapNode {
  id: string;
  type: 'battle' | 'elite' | 'shop' | 'camp' | 'boss';
  title: string;
  floor: number;
  cleared: boolean;
  available: boolean;
}

export interface Relic {
  id: string;
  name: string;
  description: string;
  icon: string;
}
