// ============================================
// ОБРАБОТКА ПРЕДМЕТОВ / ЗЕЛИЙ
// ============================================

function applyPotion(e) {
  if (!e || e.kind !== 'potion') return;

  if (e.type === 'potion_heal') {
    playerHeal(CONFIG.POTIONS.potion_heal.heal);
  } else if (e.type === 'potion_tele') {
    player.teleportReady = true;
    log(`🌀 Зелье телепорта активировано — кликните по клетке!`);
  } else if (e.type === 'potion_shield') {
    player.shieldTurns = CONFIG.POTIONS.potion_shield.turns;
    log(`🛡️ Неуязвимость на ${player.shieldTurns} ходов`);
  }
}

// Проверка, можно ли телепортироваться в клетку
function canTeleportTo(cell, target) {
  if (!cell) return false;
  if (!cell.entity) return true;
  if (cell.entity.kind === 'enemy')    return false;
  if (cell.entity.kind === 'cauldron') return false;
  return true;
}