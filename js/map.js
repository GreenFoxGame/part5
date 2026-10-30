// ============================================
// ПОЛЕ 5×5 + КОТЁЛ
// ============================================

let FIELD = [];
let gameTurn = 0;
let nextEntityId = 1;
let forceGuaranteedNextSpawn = false;
let skipNextSpawnAnimation = false;

function newEntityId() { return 'e_' + (nextEntityId++); }

function isCauldronCell(x, y) {
  return x === CONFIG.CAULDRON_X && y === CONFIG.CAULDRON_Y;
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ
// ============================================
function initField() {
  FIELD = [];
  gameTurn = 0;
  nextEntityId = 1;
  forceGuaranteedNextSpawn = false;
  skipNextSpawnAnimation = false;

  for (let y = 0; y < CONFIG.FIELD_SIZE; y++) {
    FIELD[y] = [];
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const cell = { x, y, entity: null, type: 'empty' };
      if (isCauldronCell(x, y)) {
        cell.entity = { id: newEntityId(), kind: 'cauldron' };
        cell.type = 'cauldron';
      }
      FIELD[y][x] = cell;
    }
  }
}

function getCell(x, y) {
  if (x < 0 || y < 0 || x >= CONFIG.FIELD_SIZE || y >= CONFIG.FIELD_SIZE) return null;
  return FIELD[y][x];
}

function swapEntities(cellA, cellB) {
  if (!cellA || !cellB || cellA === cellB) return;
  const tmpE = cellA.entity;
  const tmpT = cellA.type;
  cellA.entity = cellB.entity;
  cellA.type = cellB.type;
  cellB.entity = tmpE;
  cellB.type = tmpT;
}

// ============================================
// СОЗДАНИЕ СУЩНОСТЕЙ
// ============================================
function createEntityByType(type) {
  if (!type) type = 'potion_heal';

  // ---- Палочки ----
  if (CONFIG.WANDS && CONFIG.WANDS[type]) {
    const hp = CONFIG.WANDS[type].hp;
    return { id: newEntityId(), kind: 'weapon', type, hp, maxHp: hp };
  }

  // ---- Зелья ----
  if (CONFIG.POTIONS && CONFIG.POTIONS[type]) {
    const p = CONFIG.POTIONS[type];
    return { id: newEntityId(), kind: 'potion', type, name: p.name, icon: p.icon };
  }

  // ---- Враги ----
  if (CONFIG.ENEMIES && CONFIG.ENEMIES[type]) {
    const e = CONFIG.ENEMIES[type];
    let hp = randomHp(e.hpMin, e.hpMax);

    // Прогресс HP — только для не-призывов
    const isSummon = (type === 'tentacle' || type === 'succubus');
    if (!isSummon) {
      const startTurn = CONFIG.ENEMY_HP_GROWTH_START_TURN ?? 0;
      const turnsPassed = Math.max(0, (gameTurn ?? 0) - startTurn);
      const growth = Math.min(
        turnsPassed * CONFIG.ENEMY_HP_GROWTH_PER_TURN,
        (CONFIG.ENEMY_HP_MAX_MULTIPLIER ?? 1) - 1
      );
      hp = Math.round(hp * (1 + growth));
      if (hp < 1) hp = 1;
    }

    return {
      id: newEntityId(), kind: 'enemy', type,
      hp, maxHp: hp,
      behavior: e.behavior || 'static',
      timer: 0,
      poisoned: false,
      frozen: false,
      isSummon: isSummon
    };
  }

  return { id: newEntityId(), kind: 'pumpkin', value: 1 };
}

function createRandomEntity() {
  const weights = getSpawnWeights();

  if (forceGuaranteedNextSpawn) {
    forceGuaranteedNextSpawn = false;
    if (countEnemies() < CONFIG.MAX_ENEMIES_ON_FIELD) {
      const g = getGuaranteedEnemyType();
      if (g) {
        log(`⚠️ Гарантированный спавн: ${CONFIG.ENEMIES[g].name}`);
        return createEntityByType(g);
      }
    }
  }

  const type = weightedRandom(weights);
  if (!type) return null;
  return createEntityByType(type);
}

// ============================================
// ДОСТУПНЫЕ ТИПЫ ВРАГОВ
// ============================================
function getAvailableEnemyTypes() {
  const score = player ? player.score : 0;
  const available = [];
  for (const [key, threshold] of Object.entries(CONFIG.UNLOCK)) {
    if (score >= threshold &&
        CONFIG.ENEMIES[key] &&
        key !== 'tentacle' &&
        key !== 'succubus' &&
        key !== 'sodom_spirit') {
      available.push(key);
    }
  }
  return available.length ? available : ['red_witch'];
}

function getGuaranteedEnemyType() {
  const available = getAvailableEnemyTypes();
  return available[Math.floor(Math.random() * available.length)];
}

// ============================================
// ЗАПОЛНЕНИЕ ПУСТЫХ КЛЕТОК (во время игры)
// ============================================
function ensureNoEmptyCells() {
  const enemyKeys  = ['red_witch', 'purple_witch', 'yellow_witch',
                      'green_witch', 'toad', 'sodom_spirit'];
  const wandKeys   = ['red_wand', 'blue_wand', 'green_wand'];
  const potionKeys = ['potion_heal', 'potion_tele', 'potion_shield'];

  for (let y = 0; y < CONFIG.FIELD_SIZE; y++) {
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const cell = FIELD[y][x];
      if (isCauldronCell(x, y)) continue;
      if (player && player.x === x && player.y === y) continue;
      if (cell.entity) continue;

      const weights = { ...getSpawnWeights() };

      // Лимиты (getSpawnWeights уже обнуляет, но подстрахуемся)
      if (countEnemies() >= CONFIG.MAX_ENEMIES_ON_FIELD) {
        for (const key of enemyKeys) weights[key] = 0;
      }
      if (countWeapons() >= CONFIG.MAX_WEAPONS_ON_FIELD) {
        for (const key of wandKeys) weights[key] = 0;
      }
      if (countPotions() >= CONFIG.MAX_POTIONS_ON_FIELD) {
        for (const key of potionKeys) weights[key] = 0;
      }

      const type = weightedRandom(weights);
      if (!type) continue;

      const ent = createEntityByType(type);
      if (!ent) continue;

      cell.entity = ent;
      cell.type = ent.kind;
    }
  }
}

// ============================================
// СТАРТОВЫЙ РАСКЛАД
// ============================================
function fillAllCells() {
  const layout = CONFIG.START_LAYOUT;
  if (!layout) {
    ensureNoEmptyCells();
    return;
  }

  // Свободные клетки (не котёл, не игрок)
  const free = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (isCauldronCell(x, y)) continue;
      if (player && player.x === x && player.y === y) continue;
      free.push({ x, y });
    }

  // Перемешиваем
  for (let i = free.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [free[i], free[j]] = [free[j], free[i]];
  }

  const pickCount = (range) => {
    if (!range) return 0;
    const min = range.min ?? 0;
    const max = range.max ?? min;
    if (max <= min) return min;
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  let enemiesCount = pickCount(layout.enemies);
  let wandsCount   = pickCount(layout.wands);
  let potionsCount = pickCount(layout.potions);

  // Обрезаем по лимитам, чтобы не вылезти за MAX_*
  enemiesCount = Math.min(enemiesCount, CONFIG.MAX_ENEMIES_ON_FIELD);
  wandsCount   = Math.min(wandsCount,   CONFIG.MAX_WEAPONS_ON_FIELD);
  potionsCount = Math.min(potionsCount, CONFIG.MAX_POTIONS_ON_FIELD);

  // Обрезаем по количеству свободных клеток
  const total = () => enemiesCount + wandsCount + potionsCount;
  while (total() > free.length) {
    if (potionsCount > 0)      potionsCount--;
    else if (wandsCount > 0)   wandsCount--;
    else if (enemiesCount > 0) enemiesCount--;
    else break;
  }

  // Ставим по категориям
  placeStartEntities(free, 'enemy',  enemiesCount, CONFIG.START_WEIGHTS.enemy);
  placeStartEntities(free, 'wand',   wandsCount,   CONFIG.START_WEIGHTS.wand);
  placeStartEntities(free, 'potion', potionsCount, CONFIG.START_WEIGHTS.potion);

  // Добиваем остаток по обычным весам (с учётом всех лимитов)
  ensureNoEmptyCells();
}

// ============================================
// РАСКЛАДКА КАТЕГОРИИ НА СТАРТЕ
// ============================================
function placeStartEntities(free, category, count, weights) {
  if (!count || count <= 0) return;

  const empty = free.filter(p => !FIELD[p.y][p.x].entity);
  if (empty.length === 0) return;

  // Перемешиваем
  for (let i = empty.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [empty[i], empty[j]] = [empty[j], empty[i]];
  }

  let placed = 0;
  for (const p of empty) {
    if (placed >= count) break;

    const type = weightedRandom(weights);
    if (!type) continue;

    const ent = createEntityByType(type);
    if (!ent) continue;

    FIELD[p.y][p.x].entity = ent;
    FIELD[p.y][p.x].type   = ent.kind;
    placed++;
  }
}