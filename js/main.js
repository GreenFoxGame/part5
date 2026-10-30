// ============================================
// ГЛАВНЫЙ ФАЙЛ
// ============================================
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzl0NTICpnU3tVdfoi9HOysYgxjgWDN9md-581OF-98LpAvXq0GOdZR34PWAF9DfnW0/exec';
let gameState = 'start';
let playerId = "-";

// Заглушка статистики
function updateStats() { return { maxScore: 0, games: 0 }; }
function sendToGoogleSheets(id, score, games, maxScore) {
  if (!GOOGLE_SCRIPT_URL) {
    console.warn('Google Script URL не задан');
    return;
  }

  const payload = {
    playerId: String(id),
    score: Number(score),
    games: Number(games) || 1,
    maxScore: Number(maxScore) || Number(score)
  };

  fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain;charset=utf-8'
    },
    body: JSON.stringify(payload)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      console.log('✅ Результат отправлен:', data);
    } else {
      console.error('❌ Ошибка скрипта:', data.error);
    }
  })
  .catch(error => {
    console.error('❌ Ошибка отправки:', error);
  });
}

function gameOver() {
  if (typeof window.showGameOver === 'function') window.showGameOver();
}

window.showGameOver = function () {
  gameState = 'gameover';
  const record = { maxScore: player.score, games: 1 };
  document.getElementById('final-player-id').textContent = playerId;
  document.getElementById('final-score').textContent = player.score;
  document.getElementById('final-max-score').textContent = record.maxScore;
  document.getElementById('final-games').textContent = record.games;
  document.getElementById('gameover-modal').classList.add('active');

  sendToGoogleSheets(playerId, player.score, record.games, record.maxScore);
};

document.getElementById('start-btn').addEventListener('click', () => {
  const val = document.getElementById('player-id-input').value.trim();
  if (!val) { alert("Введите номер!"); return; }
  playerId = val;
  document.getElementById('start-modal').classList.remove('active');
  gameState = 'playing';
  startGame();
});

document.getElementById('restart-btn').addEventListener('click', () => {
  document.getElementById('gameover-modal').classList.remove('active');
  document.getElementById('start-modal').classList.add('active');
  document.getElementById('player-id-input').value = playerId;
  gameState = 'start';
});
function onCellClick(x, y) {
  if (gameState !== 'playing') return;
  if (x < 0 || y < 0 || x >= CONFIG.FIELD_SIZE || y >= CONFIG.FIELD_SIZE) return;

  // ============================================
  // ТЕЛЕПОРТ
  // ============================================
  if (player.teleportReady) {
    if (x === player.x && y === player.y) return;

    const cell = getCell(x, y);
    if (!cell) return;
    const target = cell.entity;

    if (target && target.kind === 'cauldron') {
      log(`❌ Нельзя телепортироваться в котёл`);
      return;
    }

    player.teleportReady = false;

    // Подбор зелья/палочки
    if (target && (target.kind === 'weapon' || target.kind === 'potion')) {
      interactWithCell(cell, target);
      if (gameState !== 'playing') return;
    }

    // Если на клетке враг — атакуем его ДО перемещения
    if (target && target.kind === 'enemy') {
      log(`⚔️ Телепорт-атака на ${CONFIG.ENEMIES[target.type].name}`);
      const enemyId = target.id;
      const hpBefore = player.hp;
      attackEnemy(target);
      animateHitById(enemyId, 'enemy');
      if (player.hp < hpBefore) animateHitById('player', 'player');

      if (gameState !== 'playing') { render(); return; }

      // Если враг выжил — отменяем телепорт
      const stillAlive = FIELD.some(row => row.some(c => c.entity === target));
      if (stillAlive) {
        log(`❌ Враг ещё жив — телепорт отменён`);
        render();
        setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 300);
        return;
      }
    }

    // Освобождаем старую клетку игрока
    const fromCell = getCell(player.x, player.y);
    if (fromCell) { fromCell.entity = null; fromCell.type = 'empty'; }

    // Перемещаем игрока
    player.x = x;
    player.y = y;

    log(`🌀 Телепорт на (${x},${y})`);

    pickupOnCell(getCell(player.x, player.y));

    ensureNoEmptyCells();
    render();
    setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 300);
    return;
  }

  // ============================================
  // ОБЫЧНАЯ ЛОГИКА
  // ============================================
  if (x === player.x && y === player.y) return;

  const cell = getCell(x, y);
  if (!cell) return;
  const target = cell.entity;

  const dx = x - player.x;
  const dy = y - player.y;
  const isAdjacent = (Math.abs(dx) + Math.abs(dy) === 1);
  if (!isAdjacent) return;

  if (target && target.kind === 'cauldron') {
    log(`⚗️ Бросьте ингредиент кнопкой внизу`);
    return;
  }

  if (target && target.kind === 'enemy' && target.type === 'tentacle') {
    if (!player.weapon || player.weapon.type !== 'blue_wand') {
      log(`🦑 Тинтакль блокирует клетку. Нужна синяя палочка.`);
      return;
    }
  }

  if (target && target.kind === 'enemy') {
    const enemyId = target.id;
    const hpBefore = player.hp;
    const result = attackEnemy(target);
    animateHitById(enemyId, 'enemy');
    if (player.hp < hpBefore) animateHitById('player', 'player');

    if (result.shouldMove === true) {
      const fromCell = getCell(player.x, player.y);
      if (fromCell) { fromCell.entity = null; fromCell.type = 'empty'; }
      player.x = x;
      player.y = y;
      pickupOnCell(getCell(player.x, player.y));
    }

    render();
    setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 300);
    return;
  }

  interactWithCell(cell, target);
  if (gameState !== 'playing') return;

  const fromCell = getCell(player.x, player.y);
  if (fromCell) { fromCell.entity = null; fromCell.type = 'empty'; }
  player.x = x;
  player.y = y;

  ensureNoEmptyCells();
  render();
  setTimeout(() => { if (gameState === 'playing') endPlayerTurn(); }, 300);
}

// ============================================
// ВЗАИМОДЕЙСТВИЕ С КЛЕТКОЙ (без движения)
// ============================================
function interactWithCell(cell, target) {
  if (!target) return;

  if (target.kind === 'weapon') {
    playerPickupWeapon(target);
    cell.entity = null;
    cell.type = 'empty';
    return;
  }

  if (target.kind === 'potion') {
    applyPotion(target);
    cell.entity = null;
    cell.type = 'empty';
    return;
  }
}

// Подбор с клетки после перемещения (для награды за убийство)
function pickupOnCell(cell) {
  if (!cell || !cell.entity) return;
  const e = cell.entity;
  if (e.kind === 'weapon' || e.kind === 'potion') {
    interactWithCell(cell, e);
  }
}

// ============================================
// СТАРТ
// ============================================
function startGame() {
  initField();
  initPlayer();
  document.getElementById('log').innerHTML = '';
  fillAllCells();
  fieldInitialized = false;
  initFieldDOM();
  render();
  setTimeout(attachLongPressHandlers, 100);
}

// ============================================
// ПОПАП
// ============================================
let pressTimer = null;
let isLongPress = false;

function showTooltip(title, desc) {
  const tt = document.getElementById('tooltip');
  document.getElementById('tt-title').textContent = title;
  document.getElementById('tt-desc').innerHTML = desc;
  tt.classList.add('active');
}

function hideTooltip() {
  document.getElementById('tooltip').classList.remove('active');
  isLongPress = false;
}

document.getElementById('tt-close-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  hideTooltip();
});

function buildAndShowTooltip(x, y) {
  let title = 'Пусто';
  let desc = 'Здесь ничего нет.';

  if (player.x === x && player.y === y) {
    title = 'Игрок';
    desc = `HP: ${player.hp}/${CONFIG.PLAYER_MAX_HP}<br>`;
    desc += `Оружие: ${player.weapon ? CONFIG.WANDS[player.weapon.type].name + ' (' + player.weapon.hp + ' HP)' : 'нет'}<br>`;
    desc += `Ингредиентов: ${player.ingredients}/${CONFIG.INGREDIENTS_START}<br>`;
    desc += `Пузырьков: ${player.score}`;
    if (player.shieldTurns > 0) desc += `<br>🛡️ Щит: ${player.shieldTurns} ходов`;
  } else {
    const cell = getCell(x, y);
    if (cell && cell.entity) {
      const e = cell.entity;

      if (e.kind === 'cauldron') {
        title = 'Котёл';
        desc = 'Подойди вплотную и бросай ингредиенты кнопками внизу.';
      } else if (e.kind === 'enemy') {
        const cfg = CONFIG.ENEMIES[e.type];
        title = cfg.name;
        desc = `HP: ${e.hp}<br>`;
        if (e.type === 'purple_witch') desc += `Раз в ${CONFIG.TENTACLE_INTERVAL} ходов призывает тинтакль.`;
        if (e.type === 'red_witch')    desc += `Раз в ${CONFIG.SUCCUBUS_INTERVAL} ходов призывает суккуба.`;
        if (e.type === 'yellow_witch') desc += `Раз в ${CONFIG.SHUFFLE_INTERVAL} ходов перемешивает поле.`;
        if (e.type === 'green_witch')  desc += `Раз в ${CONFIG.PUSH_INTERVAL} ходов откидывает игрока на ${CONFIG.PUSH_DISTANCE} клетки.`;
        if (e.type === 'toad')         desc += `Раз в ${CONFIG.TOAD_INTERVAL} ходов прыгает и тащит за собой карту.`;
        if (e.type === 'tentacle')     desc += `Блокирует клетку. Снимается ТОЛЬКО синей палочкой.`;
        if (e.type === 'succubus')     desc += `Крадёт полезную карту рядом.`;
        if (e.type === 'sodom_spirit') desc += `Раз в ${CONFIG.SODOM_BIND_INTERVAL} хода связывает двух ведьм любовными узами. Влюблённые кастуют заклинания вдвое чаще ${CONFIG.SODOM_BIND_DURATION} ходов.`;
        if (e.poisoned) desc += `<br>☠️ Отравлен`;
        if (e.frozen)   desc += `<br>❄️ Заморожен`;
        if (e.buffed)   desc += `<br>💜 Связан узами`;
      } else if (e.kind === 'weapon') {
        const cfg = CONFIG.WANDS[e.type];
        title = cfg.name;
        desc = `Прочность: ${e.hp} HP<br>`;
        if (e.type === 'red_wand')   desc += 'Бьёт всех в ряду.';
        if (e.type === 'blue_wand')  desc += 'Бьёт всех в ряду и снимает тинтаклей.';
        if (e.type === 'green_wand') desc += 'Бьёт всех в ряду и отравляет.';
      } else if (e.kind === 'potion') {
        title = e.name;
        if (e.type === 'potion_heal')   desc = `Лечит +${CONFIG.POTIONS.potion_heal.heal} HP.`;
        if (e.type === 'potion_tele')   desc = 'Один раз телепорт в любую клетку.';
        if (e.type === 'potion_shield') desc = `Неуязвимость ${CONFIG.POTIONS.potion_shield.turns} хода.`;
      }
    }
  }

  showTooltip(title, desc);
}
function attachLongPressHandlers() {
  const slots = document.querySelectorAll('.click-slot');

  slots.forEach((slot, index) => {
    const x = index % CONFIG.FIELD_SIZE;
    const y = Math.floor(index / CONFIG.FIELD_SIZE);

    let timer = null;
    let longPressed = false;

    const startPress = () => {
      if (gameState !== 'playing') return;
      const tt = document.getElementById('tooltip');
      if (tt && tt.classList.contains('active')) return;
      longPressed = false;
      timer = setTimeout(() => {
        longPressed = true;
        buildAndShowTooltip(x, y);
      }, 500);
    };

    const clearPress = () => {
      if (timer) { clearTimeout(timer); timer = null; }
    };

    slot.addEventListener('mousedown', startPress);
    slot.addEventListener('touchstart', startPress, { passive: true });
    slot.addEventListener('mouseup', clearPress);
    slot.addEventListener('touchend', clearPress);
    slot.addEventListener('mouseleave', clearPress);
    slot.addEventListener('touchcancel', clearPress);

    slot.addEventListener('click', () => {
      if (longPressed) { longPressed = false; return; }
      onCellClick(x, y);
    });
  });
}