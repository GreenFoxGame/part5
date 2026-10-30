// ============================================
// ИГРОК
// ============================================

let player = {
  x: 4, y: 4,
  hp: 10,
  weapon: null,
  score: 0,
  ingredients: 5,
  shieldTurns: 0,
  teleportReady: false,
  skinKey: 'fox_idle'
};

let playerWasHit = false;
let playerHitX = null;
let playerHitY = null;

function initPlayer() {
  player.x = CONFIG.PLAYER_START_X;
  player.y = CONFIG.PLAYER_START_Y;
  player.hp = CONFIG.PLAYER_START_HP;
  player.weapon = null;
  player.score = 0;
  player.ingredients = CONFIG.INGREDIENTS_START;
  player.shieldTurns = 0;
  player.teleportReady = false;

  const byId = CONFIG.PLAYER_SKINS_BY_ID[String(playerId)];
  player.skinKey = (byId && CONFIG.PLAYER_SKINS[byId])
    ? byId
    : (CONFIG.PLAYER_SKIN_DEFAULT || 'fox_idle');

  playerWasHit = false;
  playerHitX = null;
  playerHitY = null;
}

function playerTakeDamage(amount) {
  if (player.shieldTurns > 0) {
    log(`🛡️ Щит блокирует ${amount} урона`);
    return;
  }
  player.hp -= amount;
  playerWasHit = true;
  if (playerHitX === null) { playerHitX = player.x; playerHitY = player.y; }
  log(`Игрок получает ${amount} урона. HP: ${player.hp}`);
  if (player.hp <= 0) gameOver();
}

function playerHeal(amount) {
  player.hp = Math.min(CONFIG.PLAYER_MAX_HP, player.hp + amount);
  log(`Игрок восстанавливает ${amount} HP. HP: ${player.hp}`);
}

function playerPickupWeapon(newWeapon) {
  if (!player.weapon) {
    player.weapon = newWeapon;
    log(`Взял ${CONFIG.WANDS[newWeapon.type].name}`);
    return true;
  }
  if (newWeapon.hp > player.weapon.hp) {
    log(`Выкинул ${CONFIG.WANDS[player.weapon.type].name}, взял ${CONFIG.WANDS[newWeapon.type].name}`);
    player.weapon = newWeapon;
    return true;
  }
  log(`Не взял ${CONFIG.WANDS[newWeapon.type].name} — хуже текущей`);
  return false;
}

function tryThrowIngredient(slotIndex) {
  if (gameState !== 'playing') return;
  if (player.ingredients <= 0) return;

  const dx = Math.abs(player.x - CONFIG.CAULDRON_X);
  const dy = Math.abs(player.y - CONFIG.CAULDRON_Y);
  if (dx + dy !== 1) {
    log(`❌ Слишком далеко от котла`);
    return;
  }

  player.ingredients--;
  log(`🧂 Ингредиент брошен. Осталось: ${player.ingredients}`);

  if (player.ingredients === 0) {
    player.score += 1;
    player.ingredients = CONFIG.INGREDIENTS_START;
    log(`🧪 Пузырёк краски готов! Всего: ${player.score}`);
  }

  render();
  setTimeout(() => {
    if (gameState !== 'playing') return;
    endPlayerTurn();
  }, 300);
}

function getSkinCfg(skinKey) {
  return CONFIG.PLAYER_SKINS[skinKey]
      || CONFIG.PLAYER_SKINS[CONFIG.PLAYER_SKIN_DEFAULT]
      || { name: 'Лисёнок', emoji: '🦊' };
}