import type { ArmyUnit, UnitClass } from '../types/game';

export interface UnitArchetype {
  name: string;
  unitClass: UnitClass;
  tier: number;
  maxHp: number;
  attackPower: number;
  costInGold: number;
  description: string;
}

export const RECRUITABLE_UNITS: UnitArchetype[] = [
  // Piyadeler
  {
    name: 'Demir Kalkanlı Piyade',
    unitClass: 'infantry',
    tier: 1,
    maxHp: 24,
    attackPower: 5,
    costInGold: 35,
    description: 'Süvari akınlarını göğüsler, komutanı koruyan kalkan duvarı örer.',
  },
  {
    name: 'Kıdemli Mızrakçı Kıtası',
    unitClass: 'infantry',
    tier: 2,
    maxHp: 32,
    attackPower: 7,
    costInGold: 60,
    description: 'Süvarilere karşı ölümcül süngü barajı kurar.',
  },

  // Okçular
  {
    name: 'Orman Gözcüsü Okçuları',
    unitClass: 'archer',
    tier: 1,
    maxHp: 16,
    attackPower: 8,
    costInGold: 35,
    description: 'Arka saftan güvenli atış yapar, düşmanı sabitleyen oklar fırlatır.',
  },
  {
    name: 'Büyük Yaylı Nişancılar',
    unitClass: 'archer',
    tier: 2,
    maxHp: 22,
    attackPower: 12,
    costInGold: 65,
    description: 'Ağır zırhları bile delen yüksek kalibreli menzilli güç.',
  },

  // Süvariler
  {
    name: 'Akıncı Süvarileri',
    unitClass: 'cavalry',
    tier: 1,
    maxHp: 20,
    attackPower: 9,
    costInGold: 45,
    description: 'Açık kanatlara şok akınlar düzenler, düşman okçularını dağıtır.',
  },
  {
    name: 'Zırhlı Sipahi Bölüğü',
    unitClass: 'cavalry',
    tier: 2,
    maxHp: 28,
    attackPower: 13,
    costInGold: 75,
    description: 'Ön cepheyi yaran, yüksek momentumlu ağır atlılar.',
  },

  // Ağır Zırhlılar
  {
    name: 'Gürzlü Çelik Muhafız',
    unitClass: 'heavy',
    tier: 1,
    maxHp: 30,
    attackPower: 8,
    costInGold: 45,
    description: 'Düşman kalkanlarını kırıp parçalar, yüksek dayanıklılık sunar.',
  },
  {
    name: 'Çift Başlı Baltacılar',
    unitClass: 'heavy',
    tier: 2,
    maxHp: 38,
    attackPower: 14,
    costInGold: 80,
    description: 'Ön saftaki düşman hatlarını tek bir savuruşla biçer.',
  },
];

// Başlangıç Ordusu (3 Birlik dolu, 2 boş yuva - toplam 5 kapasite)
export const getStarterArmy = (): (ArmyUnit | null)[] => [
  {
    id: 'unit_starter_infantry',
    name: 'Acemi Kalkanlılar',
    unitClass: 'infantry',
    hp: 22,
    maxHp: 22,
    tier: 1,
    attackPower: 5,
    block: 0,
    status: {},
  },
  {
    id: 'unit_starter_archer',
    name: 'Gezgin Avcı Okçuları',
    unitClass: 'archer',
    hp: 16,
    maxHp: 16,
    tier: 1,
    attackPower: 7,
    block: 0,
    status: {},
  },
  {
    id: 'unit_starter_cavalry',
    name: 'Bozkır Atlıları',
    unitClass: 'cavalry',
    hp: 20,
    maxHp: 20,
    tier: 1,
    attackPower: 8,
    block: 0,
    status: {},
  },
  null, // Boş 4. slot
  null, // Boş 5. slot
];

// Taş-Kağıt-Makas Hasar Çarpanı Kontrolü
export const getUnitAdvantage = (attackerClass: UnitClass, defenderClass: UnitClass): { multiplier: number; reason: string } => {
  if (attackerClass === 'cavalry' && defenderClass === 'archer') {
    return { multiplier: 1.5, reason: 'Atlılar Okçuları Kanatlar ve Ezer! (+%50 Hasar)' };
  }
  if (attackerClass === 'infantry' && defenderClass === 'cavalry') {
    return { multiplier: 1.3, reason: 'Piyade Mızrağı Atlıyı Durdurur! (+%30 Hasar)' };
  }
  if (attackerClass === 'heavy' && defenderClass === 'infantry') {
    return { multiplier: 1.4, reason: 'Ağır Zırhlı Kalkanı Parçalar! (+%40 Hasar)' };
  }
  if (attackerClass === 'archer' && defenderClass === 'heavy') {
    return { multiplier: 1.25, reason: 'Okçular Yavaş Hedefi Delik Deşik Eder! (+%25 Hasar)' };
  }
  return { multiplier: 1.0, reason: 'Dengeli Karşılaşma' };
};
