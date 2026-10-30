// ============================================
// ОТРИСОВКА 5×5 + HUD + ПАНЕЛЬ ИНГРЕДИЕНТОВ
// ============================================

let fieldInitialized = false;
let cardMap = {};
let clickSlots = [];
let cardWidth = 0;
let cardHeight = 0;
let gapSize = 6;
let paddingSize = 0;

const ICON_PATHS = {
  cauldron: 'assets/characters/cauldron.png',

  fox_skin_1: 'assets/characters/fox_skin_1.png',
  fox_skin_2: 'assets/characters/fox_skin_2.png',
  fox_skin_3: 'assets/characters/fox_skin_3.png',
  fox_skin_4: 'assets/characters/fox_skin_4.png',
  fox_skin_5: 'assets/characters/fox_skin_5.png',
  fox_skin_6: 'assets/characters/fox_skin_6.png',
  fox_idle:   'assets/characters/fox_idle.png',

  held_red_wand:   'assets/characters/held_wand_red.png',
  held_blue_wand:  'assets/characters/held_wand_blue.png',
  held_green_wand: 'assets/characters/held_wand_green.png',

  sodom_spirit: 'assets/characters/sodom_spirit.png',
  red_witch:    'assets/characters/witch_red.png',
  purple_witch: 'assets/characters/witch_purple.png',
  yellow_witch: 'assets/characters/witch_yellow.png',
  green_witch:  'assets/characters/witch_green.png',
  toad:         'assets/characters/toad.png',
  tentacle:     'assets/characters/tentacle.png',
  succubus:     'assets/characters/succubus.png',

  red_wand:     'assets/characters/wand_red.png',
  blue_wand:    'assets/characters/wand_blue.png',
  green_wand:   'assets/characters/wand_green.png',

  potion_heal:  'assets/characters/potion_heal.png',
  potion_tele:  'assets/characters/potion_tele.png',
  potion_shield:'assets/characters/potion_shield.png'
};

function getIconHTML(key, emojiFallback) {
  const p = ICON_PATHS[key];
  if (p) return `<img src="${p}" class="card-img" onerror="this.style.display='none'">`;
  return emojiFallback;
}

function measureField() {
  const el = document.getElementById('field');
  const style = getComputedStyle(el);
  const padding = parseFloat(style.paddingLeft) || 0;
  const innerW = el.clientWidth - padding * 2;
  const innerH = el.clientHeight - padding * 2;
  const size = CONFIG.FIELD_SIZE;
  const gap = 6;
  cardWidth = (innerW - gap * (size - 1)) / size;
  cardHeight = (innerH - gap * (size - 1)) / size;
  gapSize = gap;
  paddingSize = padding;
}

function cellToPx(x, y) {
  return {
    left: paddingSize + x * (cardWidth + gapSize),
    top:  paddingSize + y * (cardHeight + gapSize)
  };
}

function layoutSlots() {
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const slot = clickSlots[y][x];
      if (!slot) continue;
      slot.style.width = cardWidth + 'px';
      slot.style.height = cardHeight + 'px';
      const pos = cellToPx(x, y);
      slot.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    }
}

function initFieldDOM() {
  const field = document.getElementById('field');
  field.innerHTML = '';
  cardMap = {};
  clickSlots = [];

  buildInventoryPanel();
  measureField();

  for (let y = 0; y < CONFIG.FIELD_SIZE; y++) {
    clickSlots[y] = [];
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const slot = document.createElement('div');
      slot.className = 'click-slot';
      slot.style.width = cardWidth + 'px';
      slot.style.height = cardHeight + 'px';
      const pos = cellToPx(x, y);
      slot.style.transform = `translate(${pos.left}px, ${pos.top}px)`;

      field.appendChild(slot);
      clickSlots[y][x] = slot;
    }
  }
  fieldInitialized = true;
}

function buildInventoryPanel() {
  let panel = document.getElementById('inventory');
  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'inventory';
    document.getElementById('game').appendChild(panel);
  }
  panel.innerHTML = '';
  for (let i = 0; i < CONFIG.INGREDIENTS_START; i++) {
    const btn = document.createElement('button');
    btn.className = 'ing-btn';
    btn.textContent = '🧂';
    btn.addEventListener('click', () => tryThrowIngredient(i));
    panel.appendChild(btn);
  }
}

function getOrCreateCard(id) {
  if (cardMap[id]) return cardMap[id];
  const field = document.getElementById('field');
  const card = document.createElement('div');
  card.className = 'card empty';
  if (id === 'player') card.classList.add('player');
  card.style.width = cardWidth + 'px';
  card.style.height = cardHeight + 'px';
  card.style.pointerEvents = 'none';
  card.dataset.entityId = id;
  field.appendChild(card);
  cardMap[id] = { el: card, x: -1, y: -1 };
  return cardMap[id];
}

function removeCard(id) {
  if (!cardMap[id]) return;
  cardMap[id].el.remove();
  delete cardMap[id];
}

function render() {
  if (!fieldInitialized) initFieldDOM();
  measureField();
  layoutSlots();

  const activeIds = new Set();
  activeIds.add('player');
  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (e && e.id) activeIds.add(e.id);
    }

  for (const id of Object.keys(cardMap))
    if (!activeIds.has(id)) removeCard(id);

  {
    const card = getOrCreateCard('player');
    card.el.style.width = cardWidth + 'px';
    card.el.style.height = cardHeight + 'px';
    updateCardContent(card.el, 'player', null);
    positionCard(card, player.x, player.y);
    fitTextInCard(card.el);
  }

  for (let y = 0; y < CONFIG.FIELD_SIZE; y++)
    for (let x = 0; x < CONFIG.FIELD_SIZE; x++) {
      const e = FIELD[y][x].entity;
      if (!e || !e.id) continue;
      const card = getOrCreateCard(e.id);
      card.el.style.width = cardWidth + 'px';
      card.el.style.height = cardHeight + 'px';
      updateCardContent(card.el, e.kind, e);
      positionCard(card, x, y);
      fitTextInCard(card.el);
    }

  updateHUD();
  updateInventory();
}

function positionCard(cardEntry, x, y) {
  const pos = cellToPx(x, y);
  const card = cardEntry.el;
  if (cardEntry.x === x && cardEntry.y === y) return;
  const wasFirst = (cardEntry.x === -1);
  const oldRect = card.getBoundingClientRect();
  card.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
  cardEntry.x = x;
  cardEntry.y = y;
  if (wasFirst) return;
  const newRect = card.getBoundingClientRect();
  const dx = oldRect.left - newRect.left;
  const dy = oldRect.top - newRect.top;
  if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
  card.style.transition = 'none';
  card.style.transform = `translate(${pos.left + dx}px, ${pos.top + dy}px)`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      card.style.transition = 'transform 0.3s ease-out';
      card.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
      setTimeout(() => { card.style.transition = ''; }, 310);
    });
  });
}

function updateCardContent(cardEl, kind, entity) {
  cardEl.className = 'card';
  cardEl.innerHTML = '';

  if (kind === 'player') {
    cardEl.classList.add('player');
    const skinKey = player.skinKey || CONFIG.PLAYER_SKIN_DEFAULT || 'fox_idle';
    const skinCfg = getSkinCfg(skinKey);

    let heldHTML = '';
    if (player.weapon) {
      const heldKey = 'held_' + player.weapon.type;
      if (ICON_PATHS[heldKey]) {
        heldHTML = `<img src="${ICON_PATHS[heldKey]}" class="held-weapon" alt=""
                         onerror="this.style.display='none'">`;
      }
    }

    cardEl.innerHTML = `
      <div class="hp hp-player">${player.hp}</div>
      ${player.weapon ? `<div class="hp hp-weapon">${player.weapon.hp}</div>` : ''}
      <div class="icon">
        ${getIconHTML(skinKey, skinCfg.emoji || '🦊')}
        ${heldHTML}
      </div>
      <div class="name">Игрок</div>
    `;
    return;
  }

  if (!entity) { cardEl.classList.add('empty'); return; }

  if (entity.kind === 'enemy' && entity.buffed) cardEl.classList.add('buffed');

  if (entity.kind === 'cauldron') {
    cardEl.classList.add('cauldron');
    cardEl.innerHTML = `
      <div class="icon">${getIconHTML('cauldron', '⚗️')}</div>
      <div class="name">Котёл</div>
    `;
  } else if (entity.kind === 'enemy') {
    cardEl.classList.add('enemy');
    const cfg = CONFIG.ENEMIES[entity.type];
    const status = entity.poisoned ? ' ☠️'
                 : entity.frozen   ? ' ❄️'
                 : entity.buffed   ? ' 💜'
                 : '';
    cardEl.innerHTML = `
      <div class="hp">${entity.hp}</div>
      <div class="icon">${getIconHTML(entity.type, cfg.icon)}</div>
      <div class="name">${cfg.name}${status}</div>
    `;
  } else if (entity.kind === 'weapon') {
    cardEl.classList.add('weapon');
    const cfg = CONFIG.WANDS[entity.type];
    cardEl.innerHTML = `
      <div class="hp">${entity.hp}</div>
      <div class="icon">${getIconHTML(entity.type, cfg.icon)}</div>
      <div class="name">${cfg.name}</div>
    `;
  } else if (entity.kind === 'potion') {
    cardEl.classList.add('potion');
    cardEl.innerHTML = `
      <div class="icon">${getIconHTML(entity.type, entity.icon)}</div>
      <div class="name">${entity.name}</div>
    `;
  }
}

function fitTextInCard(cardEl) {
  const nameEl = cardEl.querySelector('.name');
  if (!nameEl) return;

  // Сброс — измеряем при базовом размере
  nameEl.style.fontSize = '';

  const cardRect = cardEl.getBoundingClientRect();
  const maxW = cardRect.width - 8;      // отступы слева/справа
  const maxH = cardRect.height * 0.28;  // под имя — не больше 28% высоты

  let size = 10; // базовый (совпадает с CSS clamp max)
  nameEl.style.fontSize = size + 'px';

  // Уменьшаем, пока не влезет и по ширине, и по высоте
  while (size > 6) {
    const r = nameEl.getBoundingClientRect();
    if (r.width <= maxW && r.height <= maxH) break;
    size -= 0.5;
    nameEl.style.fontSize = size + 'px';
  }

  // Если даже 6px не помогло — режем двумя строками с многоточием
  if (size <= 6) {
    nameEl.style.display = '-webkit-box';
    nameEl.style.webkitLineClamp = '2';
    nameEl.style.webkitBoxOrient = 'vertical';
    nameEl.style.overflow = 'hidden';
  }
}

function updateHUD() {
  document.getElementById('score').textContent = `🧪 ${player.score}`;
}

function updateInventory() {
  const nearCauldron = (Math.abs(player.x - CONFIG.CAULDRON_X)
                      + Math.abs(player.y - CONFIG.CAULDRON_Y)) === 1;
  const btns = document.querySelectorAll('#inventory .ing-btn');
  btns.forEach((b, i) => {
    b.classList.toggle('used', i >= player.ingredients);
    b.classList.toggle('disabled', !nearCauldron || i >= player.ingredients);
  });
}

function animateHitById(id, type) {
  const entry = cardMap[id];
  if (!entry) return;
  const cls = type === 'player' ? 'pulse-player' : 'pulse';
  entry.el.classList.add(cls);
  setTimeout(() => entry.el.classList.remove(cls), 500);
}

function log(msg) {
  const el = document.getElementById('log');
  if (!el) return;
  const line = document.createElement('div');
  line.textContent = msg;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
  while (el.children.length > 30) el.removeChild(el.firstChild);
}

function handleResize() {
  if (!fieldInitialized) return;
  measureField();
  layoutSlots();
  for (const id in cardMap) { cardMap[id].x = -1; cardMap[id].y = -1; }
  render();
}
window.addEventListener('resize', handleResize);
window.addEventListener('orientationchange', () => setTimeout(handleResize, 150));

