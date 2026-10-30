// ============================================
// КОНЕЦ ХОДА ИГРОКА
// ============================================

function endPlayerTurn() {
  gameTurn++;

  if (player.shieldTurns > 0) {
    player.shieldTurns--;
    if (player.shieldTurns === 0) log(`🛡️ Щит спал`);
  }

  enemiesTurn();
  if (gameState !== 'playing') return;

  // добиваем пустые клетки (палочки/зелья/враги)
  ensureNoEmptyCells();

  if (gameTurn % CONFIG.GUARANTEED_SPAWN_INTERVAL === 0) {
    forceGuaranteedNextSpawn = true;
  }

  render();

  if (playerWasHit) {
    playerWasHit = false;
    playerHitX = null;
    playerHitY = null;
    animateHitById('player', 'player');
  }
}