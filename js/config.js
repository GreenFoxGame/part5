// ============================================
// ВСЕ НАСТРОЙКИ ИГРЫ — МЕНЯЙ ЗДЕСЬ
// ============================================

const CONFIG = {

  // ============================================
  // ПОЛЕ
  // ============================================
  FIELD_SIZE: 5,
  CAULDRON_X: 0,
  CAULDRON_Y: 0,

  // ============================================
  // ИГРОК
  // ============================================
  PLAYER_START_HP: 10,
  PLAYER_MAX_HP: 10,
  PLAYER_START_X: 4,
  PLAYER_START_Y: 4,

  INGREDIENTS_START: 5,

  // ============================================
  // ЛИМИТЫ НА ПОЛЕ
  // ============================================
  MAX_ENEMIES_ON_FIELD: 12,
  MAX_WEAPONS_ON_FIELD: 3,
  MAX_POTIONS_ON_FIELD: 4,

  // ============================================
  // ПАЛОЧКИ
  // ============================================
  WANDS: {
    red_wand:   { name: 'Красная палочка',  hp: 6, icon: '🔴' },
    blue_wand:  { name: 'Синяя палочка',    hp: 5, icon: '🔵' },
    green_wand: { name: 'Зелёная палочка',  hp: 5, icon: '🟢' }
  },

  WEAPON_HP_CALIBRATION: {
    ENEMY_HP_DIVISOR: 40,
    MIN_ENEMY_FACTOR: 0.7,
    MAX_ENEMY_FACTOR: 2.5,
    WEAPON_PENALTY_PER: 0.1,
    MIN_WEAPON_PENALTY: 0.6,
    RANDOM_MIN: 0.85,
    RANDOM_MAX: 1.15
  },

  // ============================================
  // СКИНЫ ИГРОКА
  // ============================================
  PLAYER_SKINS: {
    fox_skin_1: { name: 'Лисёнок',     emoji: '🦊', img: 'fox_skin_1', forPlayers: ['1'] },
    fox_skin_2: { name: 'Лисёнок II',  emoji: '🦊', img: 'fox_skin_2', forPlayers: ['2'] },
    fox_skin_3: { name: 'Лисёнок III', emoji: '🦊', img: 'fox_skin_3', forPlayers: ['3'] },
    fox_skin_4: { name: 'Лисёнок IV',  emoji: '🦊', img: 'fox_skin_4', forPlayers: ['4'] },
    fox_skin_5: { name: 'Лисёнок V',   emoji: '🦊', img: 'fox_skin_5', forPlayers: ['5'] },
    fox_skin_6: { name: 'Лисёнок VI',  emoji: '🦊', img: 'fox_skin_6', forPlayers: ['6'] },
    fox_idle:   { name: 'Лисёнок',     emoji: '🦊', img: 'fox_idle',   forPlayers: [] }
  },
  PLAYER_SKIN_DEFAULT: 'fox_idle',

  PLAYER_SKINS_BY_ID: {
    '1': 'fox_skin_1', '2': 'fox_skin_2', '3': 'fox_skin_3',
    '4': 'fox_skin_4', '5': 'fox_skin_5', '6': 'fox_skin_6'
  },

  // ============================================
  // ВРАГИ
  // ============================================
  ENEMIES: {
    sodom_spirit: { name: 'Дух Содома',       icon: '💜', hpMin: 5, hpMax: 8,
                    behavior: 'bind_witches', reward: 'potion' },
    purple_witch: { name: 'Фиолетовая ведьма', icon: '🟣', hpMin: 6, hpMax: 9,
                    behavior: 'tentacle',     reward: 'potion' },
    red_witch:    { name: 'Красная ведьма',    icon: '🔴', hpMin: 6, hpMax: 9,
                    behavior: 'summon',       reward: 'potion' },
    yellow_witch: { name: 'Жёлтая ведьма',     icon: '🟡', hpMin: 5, hpMax: 8,
                    behavior: 'shuffle',      reward: 'potion' },
    green_witch:  { name: 'Зелёная ведьма',    icon: '🟢', hpMin: 5, hpMax: 8,
                    behavior: 'push',         reward: 'potion' },
    toad:         { name: 'Жаба-фамильяр',     icon: '🐸', hpMin: 4, hpMax: 7,
                    behavior: 'toad',         reward: 'potion' },
    tentacle:     { name: 'Тинтакль',          icon: '🦑', hpMin: 1, hpMax: 1,
                    behavior: 'block',        reward: null },
    succubus:     { name: 'Суккуб',            icon: '😈', hpMin: 3, hpMax: 5,
                    behavior: 'steal',        reward: null }
  },

  // ============================================
  // ВЕСА СПАВНА (во время игры)
  // ============================================
  BASE_WEIGHTS: {
    potion_heal:   2,
    potion_tele:   2,
    potion_shield: 2,

    red_wand:      3,
    blue_wand:     3,
    green_wand:    3,

    sodom_spirit:  5,
    red_witch:    12,
    purple_witch: 12,
    yellow_witch:  9,
    green_witch:   9,
    toad:         10
  },

  // ============================================
  // СТАРТОВЫЙ РАСКЛАД
  // ============================================
  START_LAYOUT: {
    enemies: { min: 8, max: 12 },
    wands:   { min: 3, max: 5 },
    potions: { min: 4, max: 5 }
  },

  START_WEIGHTS: {
    enemy: {
      red_witch:    8,
      purple_witch: 8,
      yellow_witch: 6,
      green_witch:  6,
      toad:         7,
      sodom_spirit: 3
    },
    wand: {
      red_wand:   5,
      blue_wand:  4,
      green_wand: 5
    },
    potion: {
      potion_heal:   2,
      potion_tele:   1,
      potion_shield: 1
    }
  },

  // ============================================
  // РАЗБЛОКИРОВКА ВРАГОВ ПО СЧЁТУ
  // ============================================
  UNLOCK: {
    sodom_spirit: 3,
    red_witch:    1,
    purple_witch: 1,
    yellow_witch: 2,
    green_witch:  2,
    toad:         3
  },

  UNLOCK_WEIGHTS: {
    sodom_spirit:  5,
    red_witch:    12,
    purple_witch: 12,
    yellow_witch:  9,
    green_witch:   9,
    toad:         10
  },

  // ============================================
  // ЗЕЛЬЯ
  // ============================================
  POTIONS: {
    potion_heal:   { name: 'Зелье лечения',      icon: '🧪', heal: 3 },
    potion_tele:   { name: 'Зелье телепорта',    icon: '🌀', uses: 1 },
    potion_shield: { name: 'Зелье неуязвимости', icon: '🛡️', turns: 3 }
  },

  // ============================================
  // ИНТЕРВАЛЫ ВРАГОВ
  // ============================================
  TENTACLE_INTERVAL: 10,
  SUCCUBUS_INTERVAL: 10,
  SHUFFLE_INTERVAL: 12,
  PUSH_INTERVAL: 12,
  TOAD_INTERVAL: 12,
  SUCCUBUS_STEAL_INTERVAL: 7,
  PUSH_DISTANCE: 2,

  // ============================================
  // ЭФФЕКТЫ
  // ============================================
  POISON_DOT: 1,

  // ============================================
  // ПРОГРЕСС
  // ============================================
  GUARANTEED_SPAWN_INTERVAL: 10,
  ENEMY_GROWTH_PER_TURN: 0.01,
  ENEMY_MAX_MULTIPLIER: 1.5,

  ENEMY_HP_GROWTH_PER_TURN: 0.02,
  ENEMY_HP_MAX_MULTIPLIER: 2.5,
  ENEMY_HP_GROWTH_START_TURN: 5,

  // ============================================
  // МНОЖИТЕЛИ ВЕСОВ
  // ============================================
  WEAPON_MULT_BY_ENEMIES: [
    { enemyCount: 0,  mult: 0.5 },
    { enemyCount: 2,  mult: 0.8 },
    { enemyCount: 4,  mult: 1.2 },
    { enemyCount: 99, mult: 1.5 }
  ],

  ENEMY_MULT_BY_RESOURCES: [
    { resourceCount: 0,  mult: 1.6 },
    { resourceCount: 2,  mult: 1.3 },
    { resourceCount: 4,  mult: 1.0 },
    { resourceCount: 6,  mult: 0.8 },
    { resourceCount: 99, mult: 0.6 }
  ],

  // ============================================
  // ДУХ СОДОМА
  // ============================================
  SODOM_BIND_INTERVAL: 4,
  SODOM_BUFF_SPEED: 2,
  SODOM_BIND_DURATION: 6
};

// ============================================
// ВЗВЕШЕННЫЙ РАНДОМ
// ============================================
function weightedRandom(weights) {
  const entries = Object.entries(weights).filter(([, w]) => w > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let r = Math.random() * total;
  for (const [key, w] of entries) {
    r -= w;
    if (r <= 0) return key;
  }
  return entries[entries.length - 1][0];
}

function randomHp(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// ПОДСЧЁТ СУЩНОСТЕЙ НА ПОЛЕ
// ============================================
function countEnemies() {
  let n = 0;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'enemy' && !e.isSummon) n++;
    }
  return n;
}

function countWeapons() {
  let n = 0;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'weapon') n++;
    }
  return n;
}

function countPotions() {
  let n = 0;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.kind === 'potion') n++;
    }
  return n;
}

function countResources() {
  let n = 0;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (e && (e.kind === 'weapon' || e.kind === 'potion')) n++;
    }
  return n;
}

function getMultiplier(table, value) {
  for (const row of table) {
    const threshold = row.hpRatio ?? row.enemyCount ?? row.resourceCount;
    if (value <= threshold) return row.mult;
  }
  return table[table.length - 1].mult;
}

// ============================================
// ИТОГОВЫЕ ВЕСА СПАВНА
// ============================================
function getSpawnWeights() {
  const base = { ...CONFIG.BASE_WEIGHTS };
  const score = (typeof player !== 'undefined' && player) ? player.score : 0;

  const enemyKeys  = ['red_witch', 'purple_witch', 'yellow_witch', 'green_witch', 'toad', 'sodom_spirit'];
  const wandKeys   = ['red_wand', 'blue_wand', 'green_wand'];
  const potionKeys = ['potion_heal', 'potion_tele', 'potion_shield'];

  // Разблокировка врагов по счёту
  for (const [key, threshold] of Object.entries(CONFIG.UNLOCK)) {
    if (score >= threshold) base[key] = CONFIG.UNLOCK_WEIGHTS[key] || 0;
  }

  // Множители палочек
  const enemyCount = countEnemies();
  const weaponMult = getMultiplier(CONFIG.WEAPON_MULT_BY_ENEMIES, enemyCount);
  for (const w of wandKeys) if (base[w] !== undefined) base[w] *= weaponMult;

  // Множители врагов
  const resourceCount = countResources();
  const enemyMult = getMultiplier(CONFIG.ENEMY_MULT_BY_RESOURCES, resourceCount);
  for (const key of enemyKeys) if (base[key] !== undefined) base[key] *= enemyMult;

  const timeEnemyMult = Math.min(1 + gameTurn * CONFIG.ENEMY_GROWTH_PER_TURN,
                                 CONFIG.ENEMY_MAX_MULTIPLIER);
  for (const key of enemyKeys) if (base[key] !== undefined) base[key] *= timeEnemyMult;

  // Потолки
  if (enemyCount >= CONFIG.MAX_ENEMIES_ON_FIELD) {
    for (const key of enemyKeys) base[key] = 0;
  }
  if (countWeapons() >= CONFIG.MAX_WEAPONS_ON_FIELD) {
    for (const key of wandKeys) base[key] = 0;
  }
  if (countPotions() >= CONFIG.MAX_POTIONS_ON_FIELD) {
    for (const key of potionKeys) base[key] = 0;
  }

  // Если всё обнулилось — хотя бы зелье лечения
  const total = Object.values(base).reduce((s, w) => s + (w > 0 ? w : 0), 0);
  if (total === 0) base.potion_heal = 1;

  return base;
}