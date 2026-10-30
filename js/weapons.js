// ============================================
// АТАКА ПАЛОЧКАМИ
// Правила:
//  - у оружия при атаке ВСЕГДА тратится HP (на каждого задетого врага)
//  - если HP оружия <= 0 — палочка ломается
//  - если враг убит и палочка цела — игрок встаёт на клетку врага
// ============================================
function attackEnemy(enemy) {
  // ============================================
  // БЕЗ ОРУЖИЯ — сравнение HP
  // ============================================
  if (!player.weapon) {
    const enemyHp = enemy.hp;

    // Если у врага HP больше или равно HP игрока — игрок умирает
    if (enemyHp >= player.hp) {
      log(`💀 Игрок атакует ${CONFIG.ENEMIES[enemy.type].name} (${enemyHp} HP) без оружия и погибает!`);
      player.hp = 0;
      playerWasHit = true;
      if (playerHitX === null) { playerHitX = player.x; playerHitY = player.y; }
      gameOver();
      return { killed: false, shouldMove: false };
    }

    // Иначе: враг умирает, игрок теряет HP = HP врага, встаёт на клетку
    log(`Игрок голыми руками одолевает ${CONFIG.ENEMIES[enemy.type].name} (${enemyHp} HP), теряя ${enemyHp} HP`);
    playerTakeDamage(enemyHp);
    if (gameState !== 'playing') return { killed: false, shouldMove: false };

    killEnemy(enemy, false);
    return { killed: true, shouldMove: true };
  }

  // ============================================
  // С ОРУЖИЕМ
  // ============================================
  const w = player.weapon;
  if (w.type === 'red_wand')   return attackRow(enemy, false, false);
  if (w.type === 'blue_wand')  return attackRow(enemy, true,  false);
  if (w.type === 'green_wand') return attackRow(enemy, false, true);

  return { killed: false, shouldMove: false };
}

// Общая атака по линии.
// freeze — синяя палочка (тинтакли/суккубы исчезают)
// poison — зелёная палочка (яд)
function attackRow(targetEnemy, freeze, poison) {
  const w = player.weapon;
  if (!w) return { killed: false, shouldMove: false };

  let tx = -1, ty = -1;
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++)
      if (FIELD[y][x].entity === targetEnemy) { tx = x; ty = y; }

  if (tx === -1) return { killed: false, shouldMove: false };

  const sameRow = (ty === player.y);
  const sameCol = (tx === player.x);
  if (!sameRow && !sameCol) {
    log(`❌ Цель не на линии атаки`);
    return { killed: false, shouldMove: false };
  }

  let dirX = 0, dirY = 0;
  if (sameRow) dirX = Math.sign(tx - player.x);
  else         dirY = Math.sign(ty - player.y);

  // Собираем всех врагов на линии в направлении атаки
  const targets = [];
  let cx = player.x, cy = player.y;
  while (true) {
    cx += dirX; cy += dirY;
    if (cx < 0 || cy < 0 || cx >= CONFIG.FIELD_SIZE || cy >= CONFIG.FIELD_SIZE) break;
    const c = getCell(cx, cy);
    if (c && c.entity && c.entity.kind === 'enemy') targets.push(c.entity);
  }

  if (targets.length === 0) return { killed: false, shouldMove: false };

  // Палочка бьёт всех на линии СВОИМ текущим HP
  const dmg = w.hp;
  log(`✨ Палочка бьёт линию (${dmg} урона, HP палочки: ${w.hp})`);

  let weaponBroken = false;

  for (const e of targets) {
    // Синяя палочка: тинтакль/суккуб исчезают от заморозки, но HP палочки всё равно тратится
    if (freeze && (e.type === 'tentacle' || e.type === 'succubus')) {
      log(`❄️ ${CONFIG.ENEMIES[e.type].name} заморожен и исчезает`);
      // Тратим HP палочки на заморозку
      w.hp -= 1;
      if (w.hp <= 0) { weaponBroken = true; }
      removeEnemyFromField(e);
      continue;
    }

    // Обычный урон
    e.hp -= dmg;
    log(`${CONFIG.ENEMIES[e.type].name} получает ${dmg}`);
    if (poison) e.poisoned = true;

    // Тратим HP палочки на каждого задетого врага
    w.hp -= dmg;

    if (e.hp <= 0) killEnemy(e, true);
    if (w.hp <= 0) { weaponBroken = true; }
  }

  if (weaponBroken) {
    player.weapon = null;
    log(`Палочка сломалась!`);
  } else {
    log(`Осталось прочности палочки: ${w.hp}`);
  }

  const targetStillOnField = FIELD.some(row => row.some(c => c.entity === targetEnemy));
  // Игрок встаёт на клетку врага ТОЛЬКО если враг убит И палочка ещё цела
  const shouldMove = !targetStillOnField && !!player.weapon;

  return { killed: !targetStillOnField, shouldMove };
}

function removeEnemyFromField(enemy) {
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      if (FIELD[y][x].entity === enemy) {
        FIELD[y][x].entity = null;
        FIELD[y][x].type = 'empty';
        return;
      }
    }
}