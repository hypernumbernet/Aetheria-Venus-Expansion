import {
  HEX_SIZE,
  hexKey,
  hexToPixel,
  pixelToHex,
  drawHex,
} from './hex.js';
import {
  createInitialState,
  MODULE_TYPES,
  placeModule,
  extendH2,
  tradeWithEarth,
  buyMaterial,
  computeStats,
  gameTick,
  getPlaceableHexes,
  restartGame,
  formatBuildCost,
  H2_EXTEND_COST,
  SINK_COUNTDOWN_MAX,
  SINK_WARNING_AT,
} from './game.js';
import {
  MATERIALS,
  INVENTORY_IDS,
  formatMaterialName,
  formatAmount,
} from './materials.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = createInitialState();
let hoverHex = null;
let toastTimer = null;
let particles = [];

const OFFSET = { x: canvas.width / 2, y: canvas.height / 2 };

const inventoryDialog = document.getElementById('inventory-dialog');
const gameoverOverlay = document.getElementById('gameover-overlay');
const sinkWarning = document.getElementById('sink-warning');

function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

function spawnParticles(q, r, color) {
  const { x, y } = hexToPixel(q, r);
  for (let i = 0; i < 8; i++) {
    particles.push({
      x: x + OFFSET.x,
      y: y + OFFSET.y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 1,
      life: 40,
      color,
    });
  }
}

function updateSinkWarning() {
  const cd = state.sinkCountdown ?? 0;
  if (state.gameOver || cd === 0) {
    sinkWarning.hidden = true;
    return;
  }
  sinkWarning.hidden = false;
  const remaining = SINK_COUNTDOWN_MAX - cd;
  if (cd >= SINK_WARNING_AT) {
    sinkWarning.textContent = `⚠ 浮力不足 — 沈没まで ${remaining} ティック`;
    sinkWarning.className = 'sink-warning danger';
  } else {
    sinkWarning.textContent = `浮力がマイナス — 注意（${remaining} ティックで沈没）`;
    sinkWarning.className = 'sink-warning';
  }
}

function updateGameOverOverlay() {
  if (state.gameOver) {
    gameoverOverlay.hidden = false;
    document.getElementById('gameover-tick').textContent = state.tick;
  } else {
    gameoverOverlay.hidden = true;
  }
}

function renderInventoryList() {
  const list = document.getElementById('inventory-list');
  list.innerHTML = '';

  for (const id of INVENTORY_IDS) {
    const mat = MATERIALS[id];
    const amount = state.inventory[id] ?? 0;
    const row = document.createElement('div');
    row.className = 'inventory-row';

    const info = document.createElement('div');
    info.className = 'inventory-info';
    info.innerHTML = `
      <strong>${formatMaterialName(id)}</strong>
      <span class="inventory-desc">${mat.descJa}</span>
      <span class="inventory-obtain">${mat.obtainLabelJa}</span>
    `;

    const holding = document.createElement('div');
    holding.className = 'inventory-holding';
    holding.textContent = formatAmount(id, amount);

    const actions = document.createElement('div');
    actions.className = 'inventory-actions';

    if (mat.purchasable && !mat.locked) {
      const buyBtn = document.createElement('button');
      buyBtn.type = 'button';
      buyBtn.className = 'buy-btn';
      buyBtn.textContent = `購入（${mat.buyPrice}₵）`;
      buyBtn.disabled = state.gameOver || (state.inventory.credits ?? 0) < mat.buyPrice;
      buyBtn.addEventListener('click', () => {
        const result = buyMaterial(state, id, 1);
        if (result.ok) {
          state = result.state;
          showToast(result.message);
          renderInventoryList();
          draw();
        } else {
          showToast(result.reason);
        }
      });
      actions.appendChild(buyBtn);
    } else if (id === 'credits') {
      const hint = document.createElement('span');
      hint.className = 'inventory-hint';
      hint.textContent = '硫黄を地球へ輸出して獲得';
      actions.appendChild(hint);
    }

    row.append(info, holding, actions);
    list.appendChild(row);
  }

  // Locked stubs
  const lockedSection = document.getElementById('inventory-locked');
  lockedSection.innerHTML = '';
  for (const id of ['carbon']) {
    const mat = MATERIALS[id];
    const item = document.createElement('div');
    item.className = 'inventory-locked-item';
    item.innerHTML = `<span>${formatMaterialName(id)}</span><span class="locked-badge">近日実装</span>`;
    lockedSection.appendChild(item);
  }
}

function openInventory() {
  renderInventoryList();
  inventoryDialog.showModal();
}

function updateUI() {
  const stats = computeStats(state);
  const set = (id, text, cls = '') => {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = cls;
  };

  set('stat-buoyancy', stats.buoyancy.toFixed(1));
  set('stat-mass', stats.mass.toFixed(1));
  set('stat-net', (stats.netLift >= 0 ? '+' : '') + stats.netLift.toFixed(1),
    stats.netLift >= 0 ? 'positive' : 'negative');
  set('stat-power', `${stats.powerGen.toFixed(0)} / ${stats.powerUse.toFixed(0)} (${stats.powerNet >= 0 ? '+' : ''}${stats.powerNet.toFixed(0)})`,
    stats.powerNet >= 0 ? 'positive' : 'negative');
  set('stat-wind', stats.windLoad.toFixed(0), stats.windLoad > 12 ? 'warning' : '');
  set('stat-corrosion', (stats.corrosion / state.modules.size).toFixed(1) + '%',
    stats.corrosion / state.modules.size > 30 ? 'warning' : '');

  set('res-h2so4', state.inventory.h2so4.toFixed(1));
  set('res-h2', state.inventory.h2.toFixed(1));
  set('res-sulfur', state.inventory.sulfur.toFixed(1));
  set('res-iron', state.inventory.iron.toFixed(1));
  set('res-credits', state.inventory.credits.toFixed(0));

  document.getElementById('tick-counter').textContent = `Tick ${state.tick}`;

  const sel = state.selectedHex;
  const info = document.getElementById('selected-info');
  const extendBtn = document.getElementById('btn-extend-h2');
  if (sel && state.modules.has(sel)) {
    const mod = state.modules.get(sel);
    const def = MODULE_TYPES[mod.type];
    info.textContent = `${def.name} at (${sel})\nH₂ layers: ${mod.h2Layers} | Corrosion: ${mod.corrosion.toFixed(0)}%`;
    extendBtn.disabled = state.gameOver || state.inventory.h2 < H2_EXTEND_COST || mod.h2Layers >= 4;
  } else {
    info.textContent = 'Click a module to select.';
    extendBtn.disabled = true;
  }

  updateSinkWarning();
  updateGameOverOverlay();
}

function buildButtons() {
  const container = document.getElementById('build-buttons');
  container.innerHTML = '';
  for (const type of ['isru', 'solar', 'h2cell']) {
    const def = MODULE_TYPES[type];
    const btn = document.createElement('button');
    btn.className = 'build-btn' + (state.selectedBuild === type ? ' active' : '');
    btn.disabled = state.gameOver;
    btn.innerHTML = `<span class="swatch" style="background:${def.color}"></span><span><strong>${def.name}</strong><br><small>${formatBuildCost(def.cost)}</small></span>`;
    btn.addEventListener('click', () => {
      state = { ...state, selectedBuild: type };
      buildButtons();
    });
    container.appendChild(btn);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#3d2010');
  grad.addColorStop(0.5, '#2a1510');
  grad.addColorStop(1, '#1a0e0a');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#f0883e';
    ctx.beginPath();
    ctx.ellipse(
      100 + i * 130 + Math.sin(state.tick * 0.05 + i) * 20,
      80 + i * 90,
      120, 30, 0, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const placeable = state.gameOver ? new Set() : getPlaceableHexes(state);
  const visible = new Set([...state.modules.keys(), ...placeable]);

  if (hoverHex) visible.add(hexKey(hoverHex.q, hoverHex.r));

  for (const key of visible) {
    const [q, r] = key.split(',').map(Number);
    const { x, y } = hexToPixel(q, r);
    const cx = x + OFFSET.x;
    const cy = y + OFFSET.y;

    const mod = state.modules.get(key);
    const isPlaceable = placeable.has(key);
    const isHover = hoverHex && hoverHex.q === q && hoverHex.r === r;
    const isSelected = state.selectedHex === key;

    if (mod) {
      const def = MODULE_TYPES[mod.type];
      drawHex(ctx, cx, cy, HEX_SIZE - 2, def.color + '55', def.color, isSelected ? 3 : 1.5);

      for (let layer = 1; layer < mod.h2Layers; layer++) {
        drawHex(ctx, cx, cy - layer * 4, HEX_SIZE - 6 - layer * 2, null, '#a371f788', 1);
      }

      if (mod.corrosion > 20) {
        ctx.globalAlpha = mod.corrosion / 200;
        drawHex(ctx, cx, cy, HEX_SIZE - 4, '#f8514966', null);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const abbrev = { core: 'CORE', isru: 'ISRU', solar: 'SOL', h2cell: 'H₂' };
      ctx.fillText(abbrev[mod.type] || mod.type, cx, cy);
    } else if (isPlaceable) {
      const fill = isHover ? '#39d4d433' : '#ffffff08';
      const stroke = isHover ? '#39d4d4' : '#ffffff22';
      drawHex(ctx, cx, cy, HEX_SIZE - 4, fill, stroke, isHover ? 2 : 1);
      if (isHover) {
        ctx.fillStyle = '#39d4d4';
        ctx.font = '18px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('+', cx, cy);
      }
    }
  }

  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    ctx.globalAlpha = p.life / 40;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    return p.life > 0;
  });

  updateUI();
}

function canvasCoords(e) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: (e.clientX - rect.left) * scaleX - OFFSET.x,
    y: (e.clientY - rect.top) * scaleY - OFFSET.y,
  };
}

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasCoords(e);
  hoverHex = pixelToHex(x, y);
  draw();
});

canvas.addEventListener('mouseleave', () => {
  hoverHex = null;
  draw();
});

canvas.addEventListener('click', (e) => {
  if (state.gameOver) return;

  const { x, y } = canvasCoords(e);
  const { q, r } = pixelToHex(x, y);
  const key = hexKey(q, r);

  if (state.modules.has(key)) {
    state = { ...state, selectedHex: key };
    draw();
    return;
  }

  const result = placeModule(state, q, r);
  if (result.ok) {
    state = result.state;
    spawnParticles(q, r, MODULE_TYPES[state.selectedBuild].color);
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-extend-h2').addEventListener('click', () => {
  if (!state.selectedHex || state.gameOver) return;
  const result = extendH2(state, state.selectedHex);
  if (result.ok) {
    state = result.state;
    const [q, r] = state.selectedHex.split(',').map(Number);
    spawnParticles(q, r, '#a371f7');
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-trade').addEventListener('click', () => {
  const result = tradeWithEarth(state);
  if (result.ok) {
    state = result.state;
    showToast(result.message);
    if (inventoryDialog.open) renderInventoryList();
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-inventory').addEventListener('click', openInventory);

document.getElementById('btn-close-inventory').addEventListener('click', () => {
  inventoryDialog.close();
});

inventoryDialog.addEventListener('click', (e) => {
  const rect = inventoryDialog.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right
    && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) inventoryDialog.close();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  state = restartGame();
  particles = [];
  buildButtons();
  inventoryDialog.close();
  draw();
  showToast('新しい大陸で再開しました。');
});

setInterval(() => {
  if (!state.gameOver) {
    state = gameTick(state);
    if (state.lastEvents?.length) {
      const last = state.lastEvents[state.lastEvents.length - 1];
      showToast(last);
    }
    if (state.gameOver) {
      buildButtons();
    }
  }
  draw();
}, 1000);

buildButtons();
draw();
