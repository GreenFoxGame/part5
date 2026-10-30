// ============================================
// ХОД ВРАГОВ
// ============================================

function enemiesTurn() {
  tickEffects();

  for (let y = 0; y < CONFIG.FIELD_SIZE; y++) {
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const cell = FIELD[y][x];
      const e = cell.entity;
      if (!e || e.kind !== 'enemy') continue;
      if (e.frozen) continue;

      const step = e.buffed ? CONFIG.SODOM_BUFF_SPEED : 1;

      switch (e.behavior) {
        case 'tentacle':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.TENTACLE_INTERVAL) {
            e.timer = 0;
            spawnTentacle();
          }
          break;

        case 'summon':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.SUCCUBUS_INTERVAL) {
            e.timer = 0;
            spawnSuccubus();
          }
          break;

        case 'shuffle':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.SHUFFLE_INTERVAL) {
            e.timer = 0;
            shuffleField();
          }
          break;

        case 'push':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.PUSH_INTERVAL) {
            e.timer = 0;
            pushPlayer();
          }
          break;

        case 'toad':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.TOAD_INTERVAL) {
            e.timer = 0;
            toadJump(e);
          }
          break;

        case 'steal':
          // Суккуб: каждый ход двигается к игроку на 1 клетку,
          // а раз в SUCCUBUS_STEAL_INTERVAL — крадёт, если рядом
          e.timer = (e.timer || 0) + step;
          moveSuccubusTowardsPlayer(e, x, y);
          if (e.timer >= CONFIG.SUCCUBUS_STEAL_INTERVAL) {
            e.timer = 0;
            succubusSteal(e);
          }
          break;

        case 'bind_witches':
          e.timer = (e.timer || 0) + step;
          if (e.timer >= CONFIG.SODOM_BIND_INTERVAL) {
            e.timer = 0;
            tryBindWitches(e);
          }
          break;

        case 'block':
          break;
      }
    }
  }
}

// ============================================
// ТИК ЭФФЕКТОВ (яд + узы Содома)
// ============================================
function tickEffects() {
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++) {
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (!e || e.kind !== 'enemy') continue;

      if (e.poisoned && e.hp > 1) {
        e.hp -= CONFIG.POISON_DOT;
        if (e.hp < 1) e.hp = 1;
        log(`☠️ ${CONFIG.ENEMIES[e.type].name} отравлен: ${e.hp} HP`);
      }

      if (e.boundTimer > 0) {
        e.boundTimer--;
        if (e.boundTimer === 0) {
          e.boundTo = null;
          e.buffed = false;
          log(`💔 Узы спали с ${CONFIG.ENEMIES[e.type].name}`);
        }
      }
    }
  }
}

// ============================================
// СУККУБ ДВИГАЕТСЯ К ИГРОКУ
// ============================================
function moveSuccubusTowardsPlayer(succubus, sx, sy) {
  // Ищем кратчайший шаг (по манхэттену) к игроку
  const dx = player.x - sx;
  const dy = player.y - sy;
  if (Math.abs(dx) + Math.abs(dy) <= 1) return; // уже рядом

  const candidates = [];
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx !== 0) candidates.push([Math.sign(dx), 0]);
    if (dy !== 0) candidates.push([0, Math.sign(dy)]);
  } else {
    if (dy !== 0) candidates.push([0, Math.sign(dy)]);
    if (dx !== 0) candidates.push([Math.sign(dx), 0]);
  }

  for (const [mx, my] of candidates) {
    const nx = sx + mx;
    const ny = sy + my;
    const n = getCell(nx, ny);
    if (!n) continue;
    if (isCauldronCell(nx, ny)) continue;
    if (n.entity) continue; // занято
    if (player.x === nx && player.y === ny) continue;

    // Переносим суккуба
    n.entity = succubus;
    n.type = 'enemy';
    FIELD[sy][sx].entity = null;
    FIELD[sy][sx].type = 'empty';
    return;
  }
}

// ============================================
// ДУХ СОДОМА — СТАВИТ ДВУХ ВЕДЬМ РЯДОМ И ИСЧЕЗАЕТ
// ============================================
function tryBindWitches(spirit) {
  const spiritOnField = FIELD.some(row => row.some(c => c.entity === spirit));
  if (!spiritOnField) return;

  const witches = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (!e || e.kind !== 'enemy') continue;
      if (['red_witch', 'purple_witch', 'yellow_witch', 'green_witch'].includes(e.type)
          && !e.boundTo) {
        witches.push(e);
      }
    }

  if (witches.length < 2) {
    log(`💜 Дух Содома ищет пару, но ведьм недостаточно`);
    return;
  }

  const i1 = Math.floor(Math.random() * witches.length);
  let i2 = Math.floor(Math.random() * witches.length);
  while (i2 === i1) i2 = Math.floor(Math.random() * witches.length);

  const w1 = witches[i1];
  const w2 = witches[i2];

  const spot = findAdjacentPairFor(w1, w2);
  if (spot) {
    removeEnemyFromField(w1);
    removeEnemyFromField(w2);
    spot.cellA.entity = w1;
    spot.cellA.type = 'enemy';
    spot.cellB.entity = w2;
    spot.cellB.type = 'enemy';
    log(`💜 Дух Содома поставил ${CONFIG.ENEMIES[w1.type].name} и ${CONFIG.ENEMIES[w2.type].name} рядом!`);
  } else {
    log(`💜 Дух Содома не нашёл места, чтобы поставить ведьм рядом`);
    removeEnemyFromField(spirit);   // дух всё равно растворяется
    log(`💜 Дух Содома растворился`);
    return;                          // НЕ связываем — места не было
  }

  w1.boundTo = w2.id;
  w2.boundTo = w1.id;
  w1.boundTimer = CONFIG.SODOM_BIND_DURATION;
  w2.boundTimer = CONFIG.SODOM_BIND_DURATION;
  w1.buffed = true;
  w2.buffed = true;

  log(`⚡ Они теперь кастуют вдвое чаще (${CONFIG.SODOM_BIND_DURATION} ходов)`);
  removeEnemyFromField(spirit);
  log(`💜 Дух Содома растворился`);

}
  // Ищем две соседние свободные клетки (не котёл, не игрок)
function findAdjacentPairFor(w1, w2) {
  const coords = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (isCauldronCell(x, y)) continue;
      if (player.x === x && player.y === y) continue;
      const c = FIELD[y][x];
      if (c.entity && c.entity !== w1 && c.entity !== w2) continue;
      coords.push({ x, y });
    }

  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (const a of coords) {
    for (const [dx, dy] of dirs) {
      const bx = a.x + dx;
      const by = a.y + dy;
      if (bx < 0 || by < 0 || bx >= CONFIG.FIELD_SIZE || by >= CONFIG.FIELD_SIZE) continue;
      if (isCauldronCell(bx, by)) continue;
      if (player.x === bx && player.y === by) continue;
      const b = FIELD[by][bx];
      if (b.entity && b.entity !== w1 && b.entity !== w2) continue;
      return {
        cellA: FIELD[a.y][a.x],
        cellB: b
      };
    }
  }
  return null;
}

// ============================================
// ПРИЗЫВ ТИНТАКЛЯ
// ============================================
function spawnTentacle() {
  const empty = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const c = FIELD[y][x];
      if (isCauldronCell(x, y)) continue;
      if (c.entity) continue;
      if (player.x === x && player.y === y) continue;
      empty.push({ x, y });
    }
  if (empty.length === 0) return;
  const p = empty[Math.floor(Math.random() * empty.length)];
  FIELD[p.y][p.x].entity = createEntityByType('tentacle');
  FIELD[p.y][p.x].type = 'enemy';
  log(`🦑 Тинтакль появился на (${p.x},${p.y})`);
}

// ============================================
// ПРИЗЫВ СУККУБА
// ============================================
function spawnSuccubus() {
  const empty = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const c = FIELD[y][x];
      if (isCauldronCell(x, y)) continue;
      if (c.entity) continue;
      if (player.x === x && player.y === y) continue;
      empty.push({ x, y });
    }
  if (empty.length === 0) return;
  const p = empty[Math.floor(Math.random() * empty.length)];
  FIELD[p.y][p.x].entity = createEntityByType('succubus');
  FIELD[p.y][p.x].type = 'enemy';
  log(`😈 Суккуб появился на (${p.x},${p.y})`);
}

// ============================================
// КРАЖА ПОЛЕЗНОЙ КАРТЫ (палочка/зелье)
// Суккуб крадёт карту с соседней клетки (не с клетки игрока).
// Если рядом нет полезных карт — ничего не происходит.
// ============================================
function succubusSteal(succubus) {
  // Находим суккуба на поле
  if (player.shieldTurns > 0) {
    log(`🛡️ Щит блокирует кражу`);
    return;
  }
  let sx = -1, sy = -1;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++)
      if (FIELD[y][x].entity === succubus) { sx = x; sy = y; }
  if (sx === -1) return;

  // Ищем соседние клетки с палочкой или зельем
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const candidates = [];

  for (const [dx, dy] of dirs) {
    const nx = sx + dx;
    const ny = sy + dy;
    const n = getCell(nx, ny);
    if (!n) continue;
    if (isCauldronCell(nx, ny)) continue;
    if (player.x === nx && player.y === ny) continue;  // клетка игрока — пусто
    if (!n.entity) continue;

    const e = n.entity;
    if (e.kind === 'weapon' || e.kind === 'potion') {
      candidates.push({ x: nx, y: ny, cell: n, entity: e });
    }
  }

  if (candidates.length === 0) return; // нечего красть

  // Выбираем случайную
  const pick = candidates[Math.floor(Math.random() * candidates.length)];
  const stolen = pick.entity;
  pick.cell.entity = null;
  pick.cell.type = 'empty';

  const name = stolen.kind === 'weapon'
    ? CONFIG.WANDS[stolen.type].name
    : stolen.name;

  log(`😈 Суккуб украл ${name}!`);

  // Визуальный пульс на клетке, где была карта (если карта ещё в cardMap)
  if (stolen.id) {
    animateHitById(stolen.id, 'enemy');
  }

  ensureNoEmptyCells();
}

function shuffleField() {
  log(`🟡 Жёлтая ведьма перемешивает поле!`);

  // Собираем все клетки, КРОМЕ котла
  const coords = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (isCauldronCell(x, y)) continue;
      coords.push({ x, y });
    }

  // Собираем «содержимое» клеток. Клетка игрока — специальный маркер.
  const items = coords.map(c => {
    if (player.x === c.x && player.y === c.y) {
      return { kind: '__player__' };
    }
    const e = FIELD[c.y][c.x].entity;
    return { kind: e ? e.kind : 'empty', entity: e };
  });

  // Перемешиваем
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }

  // Раскладываем обратно
  let newPlayerPos = null;
  coords.forEach((c, i) => {
    const item = items[i];
    if (item.kind === '__player__') {
      // Игрок переезжает сюда
      newPlayerPos = { x: c.x, y: c.y };
      FIELD[c.y][c.x].entity = null;
      FIELD[c.y][c.x].type   = 'empty';
    } else {
      FIELD[c.y][c.x].entity = item.entity || null;
      FIELD[c.y][c.x].type   = item.entity ? item.entity.kind : 'empty';
    }
  });

  if (newPlayerPos) {
    player.x = newPlayerPos.x;
    player.y = newPlayerPos.y;
    log(`🌀 Игрока тоже перемешало на (${player.x},${player.y})`);
  }

  ensureNoEmptyCells();
}

// ============================================
// ТОЛЧОК ИГРОКА (зелёная ведьма) — СВОП
// Игрок меняется местами с картой на клетке назначения.
// Если там враг — не толкаем в ту сторону.
// ============================================
function pushPlayer() {
  if (player.shieldTurns > 0) {
    log(`🛡️ Щит блокирует толчок`);
    return;
  }
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const shuffled = dirs.slice().sort(() => Math.random() - 0.5);

  for (const [dx, dy] of shuffled) {
    for (let dist = CONFIG.PUSH_DISTANCE; dist >= 1; dist--) {
      const nx = player.x + dx * dist;
      const ny = player.y + dy * dist;
      if (nx < 0 || ny < 0 || nx >= CONFIG.FIELD_SIZE || ny >= CONFIG.FIELD_SIZE) continue;
      if (isCauldronCell(nx, ny)) continue;

      const c = getCell(nx, ny);
      if (!c) continue;
      if (c.entity && c.entity.kind === 'enemy') continue; // на врага не толкаем

      // СВОП: запоминаем, что лежало на клетке назначения
      const oldEntity = c.entity;
      const oldType   = c.type;

      // Ставим на клетку назначения то, что было у игрока (у игрока на поле пусто)
      // Фактически: игрок переезжает, а карта с клетки назначения едет на его место.
      const fromCell = getCell(player.x, player.y);
      if (fromCell) {
        fromCell.entity = oldEntity;
        fromCell.type   = oldType;
      }
      c.entity = null;
      c.type   = 'empty';

      player.x = nx;
      player.y = ny;
      log(`🟢 Зелёная ведьма откинула игрока на (${nx},${ny})`);
      ensureNoEmptyCells();
      return;
    }
  }
}

// ============================================
// ПРЫЖОК ЖАБЫ — СВОП без потерь
// ============================================
function toadJump(toad) {
  let tx = -1, ty = -1;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++)
      if (FIELD[y][x].entity === toad) { tx = x; ty = y; }
  if (tx === -1) return;

  // Куда прыгает жаба (не котёл, не игрок, не занято)
  const candidates = [];
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (x === tx && y === ty) continue;
      if (isCauldronCell(x, y)) continue;
      if (player.x === x && player.y === y) continue;
      const c = FIELD[y][x];
      if (c.entity) continue;
      candidates.push({ x, y });
    }
  if (candidates.length === 0) return;
  const dest = candidates[Math.floor(Math.random() * candidates.length)];

  // Кого тащит: соседняя карта ИЛИ игрок
  const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  const neighbors = [];
  for (const [dx, dy] of dirs) {
    const nx = tx + dx, ny = ty + dy;
    const n = getCell(nx, ny);
    if (!n) continue;
    if (isCauldronCell(nx, ny)) continue;
    if (player.x === nx && player.y === ny) {
      neighbors.push({ x: nx, y: ny, cell: n, isPlayer: true });
      continue;
    }
    if (n.entity && n.entity.kind !== 'cauldron') {
      neighbors.push({ x: nx, y: ny, cell: n, isPlayer: false });
    }
  }

  let carriedPick = null;
  if (neighbors.length > 0) {
    carriedPick = neighbors[Math.floor(Math.random() * neighbors.length)];
  }

  // Запоминаем, что тащим (для не-игрока)
  let carriedEntity = null;
  let carriedType   = 'empty';
  if (carriedPick && !carriedPick.isPlayer) {
    carriedEntity = carriedPick.cell.entity;
    carriedType   = carriedPick.cell.type;
    carriedPick.cell.entity = null;
    carriedPick.cell.type   = 'empty';
  }

  // Ставим жабу на dest
  FIELD[dest.y][dest.x].entity = toad;
  FIELD[dest.y][dest.x].type   = 'enemy';
  FIELD[ty][tx].entity = null;
  FIELD[ty][tx].type   = 'empty';

  // Тащим игрока на место, где была жаба
  if (carriedPick && carriedPick.isPlayer) {
    if (!FIELD[ty][tx].entity) {
      player.x = tx; player.y = ty;
      log(`🐸 Жаба тащит игрока на (${tx},${ty})`);
    }
  } else if (carriedEntity) {
    // СВОП: карта едет на место жабы, жаба — на dest (уже сделано).
    // Если место жабы освободилось — ставим карту туда.
    if (!FIELD[ty][tx].entity) {
      FIELD[ty][tx].entity = carriedEntity;
      FIELD[ty][tx].type   = carriedType;
    } else {
      // если вдруг занято — ищем свободного соседа
      for (const [dx, dy] of dirs) {
        const nx = tx + dx, ny = ty + dy;
        const n = getCell(nx, ny);
        if (n && !n.entity && !isCauldronCell(nx, ny)
            && !(player.x === nx && player.y === ny)) {
          n.entity = carriedEntity;
          n.type   = carriedType;
          break;
        }
      }
    }
  }

  log(`🐸 Жаба прыгнула на (${dest.x},${dest.y})`);
  ensureNoEmptyCells();
}



// ============================================
// УБИТЬ ВРАГА
// ============================================
function killEnemy(enemy, killedByWeapon) {
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (FIELD[y][x].entity !== enemy) continue;

      const cell = FIELD[y][x];
      const cfg = CONFIG.ENEMIES[enemy.type];

      let reward = null;
      if (killedByWeapon && cfg.reward === 'potion') {
        const types = ['potion_heal', 'potion_tele', 'potion_shield'];
        const t = types[Math.floor(Math.random() * types.length)];
        reward = createEntityByType(t);
      }

      if (reward) {
        skipNextSpawnAnimation = true;
        cell.entity = reward;
        cell.type = reward.kind;
      } else {
        cell.entity = null;
        cell.type = 'empty';
      }
      return;
    }
}