import {
  HEX_DRAW_RADIUS,
  hexKey,
  hexToPixel,
  hexAtPixel,
  drawHex,
} from './hex.js';
import {
  createInitialState,
  MODULE_TYPES,
  placeModule,
  extendH2,
  lowerH2,
  applySulfurCoating,
  applyCarbonLightening,
  tradeWithEarth,
  buyMaterial,
  computeStats,
  gameTick,
  getPlaceableHexes,
  restartGame,
  formatBuildCost,
  getModuleName,
  getIsruStatusLabel,
  getIsruStatusDetail,
  getAcidWaitInfo,
  getO2Flow,
  getBuildPowerPreview,
  formatH2so4Amount,
  H2_EXTEND_COST,
  COATING_S_COST,
  C_LIGHTEN_COST,
  TRADE_SULFUR_COST,
  SINK_COUNTDOWN_MAX,
  SINK_WARNING_AT,
} from './game.js';
import {
  MATERIALS,
  INVENTORY_IDS,
  getMaterialName,
  getMaterialDesc,
  getMaterialObtainLabel,
  formatAmount,
} from './materials.js';
import {
  getLocale,
  setLocale,
  onLocaleChange,
  t,
  applyStaticI18n,
} from './i18n.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = null;
let gameStarted = false;
let hoverHex = null;
let toastTimer = null;
let particles = [];
let tickInterval = null;

const OFFSET = { x: canvas.width / 2, y: canvas.height / 2 };

const newgameDialog = document.getElementById('newgame-dialog');
const inventoryDialog = document.getElementById('inventory-dialog');
const settingsDialog = document.getElementById('settings-dialog');
const gameoverOverlay = document.getElementById('gameover-overlay');
const sinkWarning = document.getElementById('sink-warning');

function getSelectedDifficulty() {
  const input = document.querySelector('input[name="difficulty"]:checked');
  return /** @type {'easy'|'normal'|'hard'} */ (input?.value ?? 'normal');
}

function startGame(difficulty = 'normal') {
  state = createInitialState(difficulty);
  gameStarted = true;
  newgameDialog.close();
  buildButtons();
  draw();
  if (!tickInterval) {
    tickInterval = setInterval(runTick, 1000);
  }
}

function syncLocaleRadios() {
  const loc = getLocale();
  for (const input of document.querySelectorAll('input[name="locale"]')) {
    input.checked = input.value === loc;
  }
}

function applyLocale() {
  applyStaticI18n();
  syncLocaleRadios();
  if (gameStarted) buildButtons();
  if (inventoryDialog.open) renderInventoryList();
  draw();
}

function pickToastEvent(events) {
  if (!events?.length) return null;
  const priority = (msg) => {
    if (msg.includes('沈没') || msg.includes('sank') || msg.includes('Sinking') || msg.includes('sank')) return 0;
    if (msg.includes('援助') || msg.includes('aid arrived') || msg.includes('periodic aid')) return 1;
    if (msg.includes('硫酸') || msg.includes('acid') || msg.includes('H₂') || msg.includes('hydrogen')) return 2;
    if (msg.includes('ISRU') || msg.includes('電力不足') || msg.includes('Power deficit')) return 3;
    if (msg.includes('風') || msg.includes('Wind')) return 4;
    return 5;
  };
  return [...events].sort((a, b) => priority(a) - priority(b))[0];
}

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
  if (!state) return;
  const cd = state.sinkCountdown ?? 0;
  if (state.gameOver || cd === 0) {
    sinkWarning.hidden = true;
    return;
  }
  sinkWarning.hidden = false;
  const remaining = SINK_COUNTDOWN_MAX - cd;
  if (cd >= SINK_WARNING_AT) {
    sinkWarning.textContent = t('sink.warning', { remaining });
    sinkWarning.className = 'sink-warning danger';
  } else {
    sinkWarning.textContent = t('sink.caution', { remaining });
    sinkWarning.className = 'sink-warning';
  }
}

function updateGameOverOverlay() {
  if (!state) return;
  if (state.gameOver) {
    gameoverOverlay.hidden = false;
    document.getElementById('gameover-tick').textContent = state.tick;
  } else {
    gameoverOverlay.hidden = true;
  }
}

function renderInventoryList() {
  if (!state) return;
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
      <strong>${getMaterialName(id)}</strong>
      <span class="inventory-desc">${getMaterialDesc(id)}</span>
      <span class="inventory-obtain">${getMaterialObtainLabel(id)}</span>
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
      buyBtn.textContent = t('inventory.buy', { price: mat.buyPrice });
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
    } else if (id === 'sulfur') {
      const exportBtn = document.createElement('button');
      exportBtn.type = 'button';
      exportBtn.className = 'export-btn';
      exportBtn.textContent = t('inventory.exportSulfur', { cost: TRADE_SULFUR_COST });
      exportBtn.disabled = state.gameOver || (state.inventory.sulfur ?? 0) < TRADE_SULFUR_COST;
      exportBtn.addEventListener('click', () => {
        const result = tradeWithEarth(state);
        if (result.ok) {
          state = result.state;
          showToast(result.message);
          renderInventoryList();
          draw();
        } else {
          showToast(result.reason);
        }
      });
      actions.appendChild(exportBtn);
    } else if (id === 'credits') {
      const hint = document.createElement('span');
      hint.className = 'inventory-hint';
      hint.textContent = t('inventory.creditsHint');
      actions.appendChild(hint);
    }

    row.append(info, holding, actions);
    list.appendChild(row);
  }
}

function openInventory() {
  if (!state || state.gameOver) return;
  renderInventoryList();
  inventoryDialog.showModal();
}

function updateUI() {
  if (!state) return;
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
  set('stat-difficulty', t(`difficulty.${state.difficulty}`));

  const isruStatusEl = document.getElementById('stat-isru');
  const isruDetailEl = document.getElementById('stat-isru-detail');
  const acidProgressWrap = document.getElementById('acid-progress-wrap');
  const acidProgressBar = document.getElementById('acid-progress-bar');
  if (isruStatusEl) {
    isruStatusEl.textContent = getIsruStatusLabel(state);
    const status = state.isruWaitStatus ?? 'noIsru';
    isruStatusEl.className = ['waitingAcid', 'waitingH2', 'electrolyzing', 'noPower'].includes(status) ? 'warning' : '';
  }
  if (isruDetailEl) {
    const detail = getIsruStatusDetail(state);
    isruDetailEl.textContent = detail ?? '';
    isruDetailEl.hidden = !detail;
  }
  if (acidProgressWrap && acidProgressBar) {
    const acid = getAcidWaitInfo(state);
    const h2so4 = state.inventory.h2so4 ?? 0;
    const showAcid = stats.isruCount > 0 && stats.powerNet >= 0 && h2so4 < 1;
    acidProgressWrap.hidden = !showAcid;
    acidProgressWrap.setAttribute('aria-hidden', showAcid ? 'false' : 'true');
    if (showAcid) {
      acidProgressBar.style.width = `${Math.min(100, acid.progress * 100)}%`;
    }
  }

  set('res-co2', state.inventory.co2.toFixed(1));
  set('res-carbon', state.inventory.carbon.toFixed(1));
  set('res-n2', state.inventory.n2.toFixed(1));
  set('res-h2so4', formatH2so4Amount(state.inventory.h2so4));
  set('res-h2', state.inventory.h2.toFixed(1));
  set('res-o2', state.inventory.o2.toFixed(1));
  const o2FlowEl = document.getElementById('res-o2-flow');
  if (o2FlowEl) {
    const flow = getO2Flow(state);
    if (flow.consume > 0) {
      o2FlowEl.textContent = t('panel.o2Flow', {
        produce: flow.produce.toFixed(1),
        consume: flow.consume.toFixed(1),
      });
      o2FlowEl.hidden = false;
    } else {
      o2FlowEl.hidden = true;
    }
  }
  set('res-h2o', state.inventory.h2o.toFixed(1));
  set('res-sulfur', state.inventory.sulfur.toFixed(1));
  set('res-iron', state.inventory.iron.toFixed(1));
  set('res-credits', state.inventory.credits.toFixed(0));

  document.getElementById('tick-counter').textContent = t('tick', { n: state.tick });

  const sel = state.selectedHex;
  const info = document.getElementById('selected-info');
  const h2Actions = document.getElementById('h2-actions');
  const extendBtn = document.getElementById('btn-extend-h2');
  const lowerBtn = document.getElementById('btn-lower-h2');
  const coatingBtn = document.getElementById('btn-apply-coating');
  if (sel && state.modules.has(sel)) {
    const mod = state.modules.get(sel);
    const isH2Cell = mod.type === 'h2cell';
    info.textContent = isH2Cell
      ? t('selectedH2Cell', {
        name: getModuleName(mod.type),
        coords: sel,
        floorArea: t('unit.floorArea'),
        layers: mod.h2Layers,
        corrosion: mod.corrosion.toFixed(0),
      })
      : t('selected', {
        name: getModuleName(mod.type),
        coords: sel,
        floorArea: t('unit.floorArea'),
        corrosion: mod.corrosion.toFixed(0),
      });
    if (h2Actions) h2Actions.hidden = !isH2Cell;
    if (isH2Cell) {
      extendBtn.disabled = state.gameOver || state.inventory.h2 < H2_EXTEND_COST || mod.h2Layers >= 4;
      if (lowerBtn) {
        lowerBtn.disabled = state.gameOver || mod.h2Layers <= 1;
      }
    }
    coatingBtn.disabled = state.gameOver
      || (state.inventory.sulfur ?? 0) < COATING_S_COST
      || mod.corrosion <= 0;
    const lightenBtn = document.getElementById('btn-carbon-lighten');
    if (lightenBtn) {
      lightenBtn.disabled = state.gameOver
        || (state.inventory.carbon ?? 0) < C_LIGHTEN_COST
        || (mod.carbonLighten ?? 0) >= 3;
    }
  } else {
    info.textContent = t('panel.selectedNone');
    if (h2Actions) h2Actions.hidden = true;
    extendBtn.disabled = true;
    if (lowerBtn) lowerBtn.disabled = true;
    coatingBtn.disabled = true;
    const lightenBtn = document.getElementById('btn-carbon-lighten');
    if (lightenBtn) lightenBtn.disabled = true;
  }

  updateSinkWarning();
  updateGameOverOverlay();

  const inventoryBtn = document.getElementById('btn-inventory');
  if (inventoryBtn) {
    inventoryBtn.disabled = state.gameOver;
  }

  const sulfurExportHint = document.getElementById('btn-sulfur-export-hint');
  if (sulfurExportHint) {
    sulfurExportHint.disabled = state.gameOver;
  }

  const buildHint = document.getElementById('build-hint');
  const cancelBuildBtn = document.getElementById('btn-cancel-build');
  if (buildHint) {
    buildHint.textContent = state.selectedBuild
      ? t('panel.buildHintActive')
      : t('panel.buildHint');
  }
  if (cancelBuildBtn) {
    cancelBuildBtn.hidden = !state.selectedBuild;
    cancelBuildBtn.disabled = state.gameOver;
  }
}

function formatBuildPowerLine(preview) {
  if (!preview) return '';
  const parts = [];
  if (preview.genDelta > 0) {
    parts.push(t('panel.buildPowerGen', { gen: preview.genDelta }));
  }
  if (preview.useDelta > 0) {
    parts.push(t('panel.buildPowerUse', { use: preview.useDelta }));
  }
  const net = preview.projectedNet;
  const netLabel = (net >= 0 ? '+' : '') + net.toFixed(0);
  parts.push(t('panel.buildPowerNetAfter', { net: netLabel }));
  return parts.join(' · ');
}

function buildButtons() {
  if (!state) return;
  const container = document.getElementById('build-buttons');
  container.innerHTML = '';
  for (const type of ['intake', 'isru', 'solar', 'h2cell']) {
    const def = MODULE_TYPES[type];
    const preview = getBuildPowerPreview(state, type);
    const powerClass = preview?.wouldDeficit ? ' build-power-preview warning' : ' build-power-preview';
    const powerLine = preview ? formatBuildPowerLine(preview) : '';
    const btn = document.createElement('button');
    btn.className = 'build-btn' + (state.selectedBuild === type ? ' active' : '');
    btn.disabled = state.gameOver;
    btn.innerHTML = `<span class="swatch" style="background:${def.color}"></span><span><strong>${getModuleName(type)}</strong><br><small>${formatBuildCost(def.cost)}</small>${powerLine ? `<br><small class="${powerClass.trim()}">${powerLine}</small>` : ''}</span>`;
    btn.addEventListener('click', () => {
      const next = state.selectedBuild === type ? null : type;
      state = { ...state, selectedBuild: next };
      buildButtons();
      draw();
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
  const tick = state?.tick ?? 0;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = '#f0883e';
    ctx.beginPath();
    ctx.ellipse(
      100 + i * 130 + Math.sin(tick * 0.05 + i) * 20,
      80 + i * 90,
      120, 30, 0, 0, Math.PI * 2
    );
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  if (!state) return;

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
      drawHex(ctx, cx, cy, HEX_DRAW_RADIUS, def.color + '55', def.color, isSelected ? 2 : 1);

      if (mod.type === 'h2cell') {
        for (let layer = 1; layer < mod.h2Layers; layer++) {
          drawHex(ctx, cx, cy - layer * 4, HEX_DRAW_RADIUS - 4 - layer * 2, null, '#a371f788', 1);
        }
      }

      if (mod.corrosion > 20) {
        ctx.globalAlpha = mod.corrosion / 200;
        drawHex(ctx, cx, cy, HEX_DRAW_RADIUS, '#f8514966', null);
        ctx.globalAlpha = 1;
      }

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const abbrev = { core: 'CORE', intake: 'INT', isru: 'ISRU', solar: 'SOL', h2cell: 'H₂' };
      ctx.fillText(abbrev[mod.type] || mod.type, cx, cy);
    } else if (isPlaceable) {
      const inBuildMode = !!state.selectedBuild;
      const fill = inBuildMode ? '#39d4d455' : (isHover ? '#39d4d433' : '#ffffff08');
      const stroke = inBuildMode ? '#39d4d4' : (isHover ? '#39d4d4' : '#ffffff22');
      const strokeWidth = inBuildMode ? 2 : 1;
      drawHex(ctx, cx, cy, HEX_DRAW_RADIUS, fill, stroke, strokeWidth);
      if (inBuildMode || isHover) {
        ctx.fillStyle = inBuildMode ? '#39d4d4cc' : '#39d4d4';
        ctx.font = inBuildMode ? 'bold 16px sans-serif' : '18px sans-serif';
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

function getInteractableHexKeys() {
  if (!state) return [];
  const placeable = state.gameOver ? new Set() : getPlaceableHexes(state);
  return [...new Set([...state.modules.keys(), ...placeable])];
}

function hexUnderPointer(layoutX, layoutY) {
  return hexAtPixel(layoutX, layoutY, getInteractableHexKeys());
}

function isTickPaused() {
  return newgameDialog.open
    || inventoryDialog.open
    || settingsDialog.open
    || !gameoverOverlay.hidden;
}

function closeBlockingDialogs() {
  if (inventoryDialog.open) inventoryDialog.close();
  if (settingsDialog.open) settingsDialog.close();
}

function runTick() {
  if (!gameStarted || !state || state.gameOver || isTickPaused()) return;
  state = gameTick(state);
  if (state.gameOver) {
    closeBlockingDialogs();
    buildButtons();
  }
  if (state.lastEvents?.length) {
    const toast = pickToastEvent(state.lastEvents);
    if (toast) showToast(toast);
  }
  draw();
}

canvas.addEventListener('mousemove', (e) => {
  const { x, y } = canvasCoords(e);
  const hit = hexUnderPointer(x, y);
  hoverHex = hit ? { q: hit.q, r: hit.r } : null;
  draw();
});

canvas.addEventListener('mouseleave', () => {
  hoverHex = null;
  draw();
});

canvas.addEventListener('click', (e) => {
  if (!gameStarted || !state || state.gameOver) return;

  const { x, y } = canvasCoords(e);
  const hit = hexUnderPointer(x, y);
  if (!hit) return;

  const { q, r, key } = hit;

  if (state.modules.has(key)) {
    state = { ...state, selectedHex: key };
    draw();
    return;
  }

  if (!state.selectedBuild) {
    showToast(t('msg.noBuildSelected'));
    return;
  }

  const buildType = state.selectedBuild;
  const result = placeModule(state, q, r);
  if (result.ok) {
    state = result.state;
    spawnParticles(q, r, MODULE_TYPES[buildType].color);
    showToast(result.message);
    buildButtons();
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-extend-h2').addEventListener('click', () => {
  if (!state || !state.selectedHex || state.gameOver) return;
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

document.getElementById('btn-lower-h2').addEventListener('click', () => {
  if (!state || !state.selectedHex || state.gameOver) return;
  const result = lowerH2(state, state.selectedHex);
  if (result.ok) {
    state = result.state;
    const [q, r] = state.selectedHex.split(',').map(Number);
    spawnParticles(q, r, '#7c5cbf');
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-apply-coating').addEventListener('click', () => {
  if (!state || !state.selectedHex || state.gameOver) return;
  const result = applySulfurCoating(state, state.selectedHex);
  if (result.ok) {
    state = result.state;
    const [q, r] = state.selectedHex.split(',').map(Number);
    spawnParticles(q, r, '#d29922');
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-carbon-lighten').addEventListener('click', () => {
  if (!state || !state.selectedHex || state.gameOver) return;
  const result = applyCarbonLightening(state, state.selectedHex);
  if (result.ok) {
    state = result.state;
    const [q, r] = state.selectedHex.split(',').map(Number);
    spawnParticles(q, r, '#58a6ff');
    showToast(result.message);
  } else {
    showToast(result.reason);
  }
  draw();
});

document.getElementById('btn-cancel-build')?.addEventListener('click', () => {
  cancelConstructionMode();
});

document.getElementById('btn-settings').addEventListener('click', () => {
  if (state?.gameOver) return;
  syncLocaleRadios();
  settingsDialog.showModal();
});

document.getElementById('btn-close-settings').addEventListener('click', () => {
  settingsDialog.close();
});

settingsDialog.addEventListener('click', (e) => {
  const rect = settingsDialog.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right
    && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) settingsDialog.close();
});

document.querySelectorAll('input[name="locale"]').forEach((input) => {
  input.addEventListener('change', () => {
    if (input.checked) setLocale(/** @type {'en'|'ja'} */ (input.value));
  });
});

document.getElementById('btn-inventory').addEventListener('click', openInventory);

document.getElementById('btn-sulfur-export-hint')?.addEventListener('click', () => {
  if (!state || state.gameOver) return;
  openInventory();
});

document.getElementById('btn-close-inventory').addEventListener('click', () => {
  inventoryDialog.close();
});

inventoryDialog.addEventListener('click', (e) => {
  const rect = inventoryDialog.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right
    && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) inventoryDialog.close();
});

document.getElementById('btn-start-game').addEventListener('click', () => {
  startGame(getSelectedDifficulty());
});

newgameDialog.addEventListener('cancel', (e) => {
  e.preventDefault();
});

newgameDialog.addEventListener('close', () => {
  if (!gameStarted) newgameDialog.showModal();
});

document.getElementById('btn-restart').addEventListener('click', () => {
  gameStarted = false;
  state = null;
  particles = [];
  inventoryDialog.close();
  gameoverOverlay.hidden = true;
  document.querySelector('input[name="difficulty"][value="normal"]').checked = true;
  newgameDialog.showModal();
  draw();
});

function cancelConstructionMode() {
  if (!state?.selectedBuild) return false;
  state = { ...state, selectedBuild: null };
  buildButtons();
  draw();
  return true;
}

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (newgameDialog.open || gameoverOverlay.hidden === false) return;
  if (inventoryDialog.open || settingsDialog.open) return;
  if (!gameStarted || !state) return;
  cancelConstructionMode();
});

onLocaleChange(() => applyLocale());

applyLocale();
newgameDialog.showModal();
draw();
