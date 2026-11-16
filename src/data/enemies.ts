import type { EnemyIntent, EnemyUnit, EnemyWarband } from '../types/game';

export const ENEMY_WARBANDS: EnemyWarband[] = [
  // 1. DÜĞÜM: Haydut Yağmacıları (Bandit Warband)
  {
    id: 'bandit_raiders',
    name: 'Haydut Yağmacıları',
    commanderName: 'Tekgöz Boris',
    commanderHp: 38,
    commanderMaxHp: 38,
    commanderBlock: 0,
    commanderIntent: {
      type: 'attack',
      value: 7,
      description: 'Paslı palasıyla Komutana saldırıyor!',
    },
    units: [
      {
        id: 'bandit_1',
        name: 'Haydut Çapulcusu',
        unitClass: 'infantry',
        hp: 14,
        maxHp: 14,
        tier: 1,
        attackPower: 4,
        block: 0,
        status: {},
        intent: {
          type: 'attack',
          value: 4,
          description: 'Piyadelerinize saldırıyor',
        },
      },
      {
        id: 'bandit_2',
        name: 'Kaçak Avcı',
        unitClass: 'archer',
        hp: 12,
        maxHp: 12,
        tier: 1,
        attackPower: 5,
        block: 0,
        status: {},
        intent: {
          type: 'volley',
          value: 5,
          description: 'Menzilden ok atışı hazırlıyor',
        },
      },
    ],
    goldReward: 25,
    foodReward: 2,
  },

  // 2. DÜĞÜM: Paralı Asker Lejyonu (Mercenary Guard)
  {
    id: 'mercenary_corps',
    name: 'Paralı Kara Şirket',
    commanderName: 'Yüzbaşı Valen',
    commanderHp: 48,
    commanderMaxHp: 48,
    commanderBlock: 5,
    commanderIntent: {
      type: 'heavy_attack',
      value: 11,
      description: 'Ağır çelik kılıcıyla ölümcül darbe indiriyor!',
    },
    units: [
      {
        id: 'merc_infantry',
        name: 'Kıdemli Lejyoner',
        unitClass: 'infantry',
        hp: 20,
        maxHp: 20,
        tier: 1,
        attackPower: 6,
        block: 4,
        status: {},
        intent: {
          type: 'defend',
          value: 6,
          description: 'Komutanını kalkanıyla koruyor',
        },
      },
      {
        id: 'merc_cavalry',
        name: 'Paralı Süvari',
        unitClass: 'cavalry',
        hp: 18,
        maxHp: 18,
        tier: 1,
        attackPower: 8,
        block: 0,
        status: {},
        intent: {
          type: 'attack',
          value: 9,
          description: 'Kanattan şok hücumu yapıyor!',
        },
      },
      {
        id: 'merc_archer',
        name: 'Yaylım Okçusu',
        unitClass: 'archer',
        hp: 14,
        maxHp: 14,
        tier: 1,
        attackPower: 6,
        block: 0,
        status: {},
        intent: {
          type: 'volley',
          value: 6,
          description: 'Arka saftan ok yağdırıyor',
        },
      },
    ],
    goldReward: 42,
    foodReward: 3,
  },

  // 3. DÜĞÜM (ELİTE): Kara Şövalye Müfrezesi
  {
    id: 'elite_black_knights',
    name: 'Kara Zırhlı Şövalyeler (Elit)',
    commanderName: 'Lord Vaelin the Ruthless',
    commanderHp: 65,
    commanderMaxHp: 65,
    commanderBlock: 8,
    commanderIntent: {
      type: 'heavy_attack',
      value: 14,
      description: 'Ezici topuz darbesi hazırlıyor!',
    },
    units: [
      {
        id: 'elite_heavy',
        name: 'Kara Muhafız Baltacısı',
        unitClass: 'heavy',
        hp: 26,
        maxHp: 26,
        tier: 2,
        attackPower: 10,
        block: 5,
        status: {},
        intent: {
          type: 'heavy_attack',
          value: 10,
          description: 'Kalkanları parçalamak için yaklaşıyor',
        },
      },
      {
        id: 'elite_cavalry',
        name: 'Zırhlı Savaş Atlısı',
        unitClass: 'cavalry',
        hp: 24,
        maxHp: 24,
        tier: 2,
        attackPower: 11,
        block: 0,
        status: {},
        intent: {
          type: 'attack',
          value: 12,
          description: 'Ön safları yarmak için at koşturuyor',
        },
      },
      {
        id: 'elite_infantry',
        name: 'Gözüpek Mızrakçı',
        unitClass: 'infantry',
        hp: 22,
        maxHp: 22,
        tier: 2,
        attackPower: 7,
        block: 6,
        status: {},
        intent: {
          type: 'defend',
          value: 8,
          description: 'Aşılmaz mızrak kalkanı oluşturuyor',
        },
      },
    ],
    goldReward: 65,
    foodReward: 4,
  },

  // BOSS: Kalradya Fatihi General Turok
  {
    id: 'boss_warlord',
    name: 'Savaş Lordu Turok (BÖLÜM SONU CANAVARI)',
    commanderName: 'Büyük Han Turok',
    commanderHp: 95,
    commanderMaxHp: 95,
    commanderBlock: 12,
    commanderIntent: {
      type: 'heavy_attack',
      value: 18,
      description: 'Kudretli Savaş Kılıcı ile tüm ön safı biçmeye hazırlanıyor!',
    },
    units: [
      {
        id: 'boss_heavy',
        name: 'Demir Cüsseli Dev',
        unitClass: 'heavy',
        hp: 34,
        maxHp: 34,
        tier: 2,
        attackPower: 12,
        block: 6,
        status: {},
        intent: {
          type: 'heavy_attack',
          value: 12,
          description: 'Deprem etkisi yaratan çekiç savuruşu',
        },
      },
      {
        id: 'boss_cavalry',
        name: 'Hanın Has Süvarisi',
        unitClass: 'cavalry',
        hp: 28,
        maxHp: 28,
        tier: 2,
        attackPower: 13,
        block: 0,
        status: {},
        intent: {
          type: 'attack',
          value: 14,
          description: 'Kanat hücumu ile komutana doğrudan hamle',
        },
      },
      {
        id: 'boss_archer',
        name: 'Kraliyet Yaylım Taburu',
        unitClass: 'archer',
        hp: 22,
        maxHp: 22,
        tier: 2,
        attackPower: 10,
        block: 0,
        status: {},
        intent: {
          type: 'volley',
          value: 10,
          description: 'Ateşli ok yaylımı hazırlıyor',
        },
      },
      {
        id: 'boss_infantry',
        name: 'Ölüm Muhafızı',
        unitClass: 'infantry',
        hp: 30,
        maxHp: 30,
        tier: 2,
        attackPower: 8,
        block: 8,
        status: {},
        intent: {
          type: 'defend',
          value: 10,
          description: 'Turok\'un önüne siper oluyor',
        },
      },
    ],
    goldReward: 120,
    foodReward: 6,
  },
];

// Düşman bir sonraki tur niyeti (Intent) hesaplayıcı
export const generateNextIntent = (unit: EnemyUnit, turnNumber: number): EnemyIntent => {
  const mod = (turnNumber + unit.maxHp) % 3;
  if (unit.unitClass === 'infantry') {
    if (mod === 0) return { type: 'defend', value: 6 + unit.tier * 2, description: 'Savunma pozisyonuna geçiyor' };
    return { type: 'attack', value: unit.attackPower, description: 'Ön safa kılıç savuruyor' };
  }
  if (unit.unitClass === 'cavalry') {
    if (mod === 1) return { type: 'heavy_attack', value: unit.attackPower + 4, description: 'Hızlı kanat hücumu!' };
    return { type: 'attack', value: unit.attackPower, description: 'At üstünden kılıç darbesi' };
  }
  if (unit.unitClass === 'archer') {
    return { type: 'volley', value: unit.attackPower, description: 'Menzilli ok atışı' };
  }
  if (unit.unitClass === 'heavy') {
    if (mod === 2) return { type: 'heavy_attack', value: unit.attackPower + 5, description: 'Zırh kırıcı ezici darbe!' };
    return { type: 'attack', value: unit.attackPower, description: 'Ağır balta darbesi' };
  }
  return { type: 'attack', value: 6, description: 'Hamle yapıyor' };
};
