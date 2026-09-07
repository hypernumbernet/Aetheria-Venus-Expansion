import {
  hexKey,
  hexToPixel,
  hexAtPixel,
} from './hex.js';
import {
  createInitialState,
  MODULE_TYPES,
  placeModule,
  extendH2,
  lowerH2,
  applySulfurCoating,
  applyCarbonLightening,
  dismantleModule,
  ventCargo,
  tradeWithEarth,
  buyMaterial,
  computeStats,
  gameTick,
  getPlaceableHexes,
  restartGame,
  formatBuildCost,
  formatBuildCostCompact,
  isResourceShortForBuild,
  getModuleName,
  getModuleBuildLabel,
  getIsruStatusLabel,
  getIsruStatusDetail,
  getAcidWaitInfo,
  getO2Flow,
  getBuildPowerPreview,
  formatH2so4Amount,
  getEarthAidEta,
  getBuildPanelHint,
  isPowerSolarCtaActive,
  getWorstCorrosionHex,
  getCorrosionPenalties,
  hasCorrosionPenalties,
  getCorrosionSummary,
  getCorrosionMaintenanceInfo,
  canAfford,
  getMissingMaterials,
  getDismantleIronRefund,
  H2_EXTEND_COST,
  COATING_S_COST,
  C_LIGHTEN_COST,
  TRADE_SULFUR_COST,
  VENT_CARGO_BATCH,
  INVENTORY_CARGO_MASS_IDS,
  INVENTORY_VENTABLE_IDS,
  getH2LiftInfo,
  CORROSION_WARN_THRESHOLD,
  CORE_POWER_GEN_BY_DIFFICULTY,
  CORE_ELECTROLYSIS_BY_DIFFICULTY,
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
  costSeparator,
} from './i18n.js';
import {
  drawVenusSky,
  drawMistMotes,
  drawViewportVignette,
  drawOccupiedHex,
  drawEmptyHex,
} from './render.js';

const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

let state = null;
let gameStarted = false;
let gamePaused = false;
let hoverHex = null;
let toastTimer = null;
let particles = [];
let tickInterval = null;

const OFFSET = { x: canvas.width / 2, y: canvas.height / 2 };

const newgameDialog = document.getElementById('newgame-dialog');
const inventoryDialog = document.getElementById('inventory-dialog');
const settingsDialog = document.getElementById('settings-dialog');
const confirmDialog = document.getElementById('confirm-dialog');
const gameoverOverlay = document.getElementById('gameover-overlay');
const sinkWarning = document.getElementById('sink-warning');

let confirmResolve = null;

function showConfirmDialog(message) {
  return new Promise((resolve) => {
    confirmResolve = resolve;
    document.getElementById('confirm-dialog-message').textContent = message;
    confirmDialog.showModal();
  });
}

function resolveConfirm(result) {
  if (confirmDialog.open) confirmDialog.close();
  if (confirmResolve) {
    confirmResolve(result);
    confirmResolve = null;
  }
}

function getSelectedDifficulty() {
  const input = document.querySelector('input[name="difficulty"]:checked');
  return /** @type {'easy'|'normal'|'hard'} */ (input?.value ?? 'normal');
}

function startGame(difficulty = 'normal') {
  state = createInitialState(difficulty);
  gameStarted = true;
  gamePaused = false;
  newgameDialog.close();
  buildButtons();
  updatePauseUi();
  draw();
  if (!state.startHintShown) {
    state = { ...state, startHintShown: true };
    const cfg = CORE_ELECTROLYSIS_BY_DIFFICULTY[difficulty] ?? CORE_ELECTROLYSIS_BY_DIFFICULTY.normal;
    const power = CORE_POWER_GEN_BY_DIFFICULTY[difficulty] ?? CORE_POWER_GEN_BY_DIFFICULTY.normal;
    showToast(t('panel.coreBootstrap', { power, h2: cfg.h2.toFixed(2) }));
  }
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

function enterSolarBuildMode() {
  if (!state || state.gameOver || state.selectedBuild === 'solar') return;
  state = { ...state, selectedBuild: 'solar', selectedHex: null };
  buildButtons();
  draw();
}

function bindPowerSolarCta(el) {
  if (!el) return;
  const active = isPowerSolarCtaActive(state);
  el.onclick = null;
  el.classList.remove('clickable', 'power-cta');
  if (active) {
    el.classList.add('clickable', 'power-cta');
    el.onclick = () => enterSolarBuildMode();
  }
}

function updatePauseUi() {
  const pauseBtn = document.getElementById('btn-pause');
  const tickPanel = document.querySelector('.tick-panel');
  if (pauseBtn) {
    pauseBtn.textContent = gamePaused ? t('resume') : t('pause');
    pauseBtn.setAttribute('aria-pressed', gamePaused ? 'true' : 'false');
    pauseBtn.setAttribute('aria-label', gamePaused ? t('resume') : t('pause'));
  }
  tickPanel?.classList.toggle('paused', gamePaused);
}

function togglePause() {
  if (!gameStarted || !state || state.gameOver) return;
  gamePaused = !gamePaused;
  updatePauseUi();
}

function applyLocale() {
  applyStaticI18n();
  syncLocaleRadios();
  updatePauseUi();
  if (gameStarted) buildButtons();
  if (inventoryDialog.open) renderInventoryList();
  draw();
}

function pickToastEvent(events) {
  if (!events?.length) return null;
  const priority = (msg) => {
    if (msg.includes('沈没') || msg.includes('sank') || msg.includes('Sinking')) return 0;
    if (msg.includes('援助') || msg.includes('aid arrived') || msg.includes('periodic aid')) return 1;
    if (msg.includes('腐食') || msg.includes('corrosion') || msg.includes('Corrosion')) return 2;
    if (msg.includes('硫酸') || msg.includes('acid') || msg.includes('H₂') || msg.includes('hydrogen')) return 3;
    if (msg.includes('ISRU') || msg.includes('電力不足') || msg.includes('Power deficit')) return 4;
    if (msg.includes('風') || msg.includes('Wind')) return 5;
    return 6;
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
  const h2Critical = getH2LiftInfo(state).critical;
  if (cd >= SINK_WARNING_AT) {
    sinkWarning.textContent = h2Critical
      ? t('sink.warningH2', { remaining })
      : t('sink.warning', { remaining });
    sinkWarning.className = 'sink-warning danger';
  } else {
    sinkWarning.textContent = h2Critical
      ? t('sink.cautionH2', { remaining })
      : t('sink.caution', { remaining });
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

function createInventoryRow(id, compact = false) {
  const mat = MATERIALS[id];
  const amount = state.inventory[id] ?? 0;
  const row = document.createElement('div');
  row.className = 'inventory-row' + (compact ? ' inventory-row-compact' : '');
  row.dataset.materialId = id;

  const info = document.createElement('div');
  info.className = 'inventory-info';
  if (compact) {
    info.innerHTML = `<strong>${getMaterialName(id)}</strong>`;
  } else {
    info.innerHTML = `
      <strong>${getMaterialName(id)}</strong>
      <span class="inventory-desc">${getMaterialDesc(id)}</span>
      <span class="inventory-obtain">${getMaterialObtainLabel(id)}</span>
    `;
  }

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
        buildButtons();
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
        buildButtons();
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
  } else if (INVENTORY_VENTABLE_IDS.includes(id) && amount > 0) {
    const ventBtn = document.createElement('button');
    ventBtn.type = 'button';
    ventBtn.className = 'vent-btn';
    ventBtn.textContent = t('inventory.ventCargo', { amount: VENT_CARGO_BATCH });
    const hasMass = INVENTORY_CARGO_MASS_IDS.includes(id);
    ventBtn.title = hasMass ? t('inventory.ventCargoHint') : t('inventory.ventEmergencyHint');
    ventBtn.disabled = state.gameOver || amount < VENT_CARGO_BATCH;
    ventBtn.addEventListener('click', async () => {
      const confirmMsg = t('msg.confirmVent', {
        amount: VENT_CARGO_BATCH,
        name: getMaterialName(id),
      });
      if (!(await showConfirmDialog(confirmMsg))) return;
      const result = ventCargo(state, id, VENT_CARGO_BATCH);
      if (result.ok) {
        state = result.state;
        showToast(result.message);
        renderInventoryList();
        buildButtons();
        draw();
      } else {
        showToast(result.reason);
      }
    });
    actions.appendChild(ventBtn);
  }

  row.append(info, holding, actions);
  return row;
}

function renderInventoryList() {
  if (!state) return;
  const purchaseEl = document.getElementById('inventory-purchase');
  const list = document.getElementById('inventory-list');
  purchaseEl.innerHTML = '';
  list.innerHTML = '';

  for (const id of ['iron', 'h2o']) {
    purchaseEl.appendChild(createInventoryRow(id, true));
  }

  const restHeading = document.createElement('h3');
  restHeading.className = 'inventory-list-heading';
  restHeading.textContent = t('inventory.holdings');
  list.appendChild(restHeading);

  const restIds = INVENTORY_IDS.filter((id) => id !== 'iron' && id !== 'h2o');
  for (const id of restIds) {
    list.appendChild(createInventoryRow(id, true));
  }
}

function openInventory(focusMaterialId = null) {
  if (!state || state.gameOver) return;
  renderInventoryList();
  inventoryDialog.showModal();
  if (focusMaterialId) {
    requestAnimationFrame(() => {
      const row = inventoryDialog.querySelector(`[data-material-id="${focusMaterialId}"]`);
      row?.scrollIntoView({ block: 'nearest' });
    });
  }
}

function tryBuyMaterial(materialId) {
  if (!state || state.gameOver) return;
  const mat = MATERIALS[materialId];
  if (!mat?.purchasable) return;
  const price = mat.buyPrice;
  if ((state.inventory.credits ?? 0) >= price) {
    const result = buyMaterial(state, materialId, 1);
    if (result.ok) {
      state = result.state;
      showToast(result.message);
      buildButtons();
      draw();
      return;
    }
    showToast(result.reason);
    return;
  }
  openInventory(materialId);
}

function tryBuyIron() {
  tryBuyMaterial('iron');
}

function tryBuyH2o() {
  tryBuyMaterial('h2o');
}

function tryExportSulfur() {
  if (!state || state.gameOver) return;
  if ((state.inventory.sulfur ?? 0) < TRADE_SULFUR_COST) {
    openInventory('sulfur');
    return;
  }
  const result = tradeWithEarth(state);
  if (result.ok) {
    state = result.state;
    showToast(result.message);
    buildButtons();
    draw();
  } else {
    showToast(result.reason);
  }
}

function formatPenaltyValue(n) {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

function formatCorrosionEffectsLine(corrosion) {
  if (!hasCorrosionPenalties(corrosion)) return '';
  const pen = getCorrosionPenalties(corrosion);
  return t('selectedCorrosionEffects', {
    power: formatPenaltyValue(pen.powerPenalty),
    mass: formatPenaltyValue(pen.massPenalty),
    lift: formatPenaltyValue(pen.buoyancyPenalty),
  });
}

function formatSelectedInfo(mod, key) {
  const isH2Cell = mod.type === 'h2cell';
  const base = isH2Cell
    ? t('selectedH2Cell', {
      name: getModuleName(mod.type),
      coords: key,
      floorArea: t('unit.floorArea'),
      layers: mod.h2Layers,
      corrosion: mod.corrosion.toFixed(0),
    })
    : t('selected', {
      name: getModuleName(mod.type),
      coords: key,
      floorArea: t('unit.floorArea'),
      corrosion: mod.corrosion.toFixed(0),
    });
  const effects = formatCorrosionEffectsLine(mod.corrosion ?? 0);
  return effects ? `${base}\n${effects}` : base;
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
  const corrosionSummary = getCorrosionSummary(state.modules);
  const corrosionAvgEl = document.getElementById('stat-corrosion');
  const corrosionDetailEl = document.getElementById('stat-corrosion-detail');
  const hasModuleSelection = state.selectedHex
    && state.modules.has(state.selectedHex)
    && !state.selectedBuild;
  const worstCorrosionKey = getWorstCorrosionHex(state.modules);
  const worstCorrosionMod = worstCorrosionKey ? state.modules.get(worstCorrosionKey) : null;
  const worstCorrosionPct = worstCorrosionMod?.corrosion ?? 0;
  if (corrosionAvgEl) {
    corrosionAvgEl.textContent = corrosionSummary.avg.toFixed(1) + '%';
    corrosionAvgEl.className = corrosionSummary.avg >= CORROSION_WARN_THRESHOLD ? 'warning' : '';
  }
  if (corrosionDetailEl) {
    const showWorst = corrosionSummary.max > corrosionSummary.avg + 0.5
      || corrosionSummary.penaltyCount > 0;
    const showCoatingJump = !hasModuleSelection
      && worstCorrosionPct >= CORROSION_WARN_THRESHOLD
      && worstCorrosionKey;

    corrosionDetailEl.onclick = null;
    corrosionDetailEl.classList.remove('clickable');

    if (showCoatingJump) {
      corrosionDetailEl.textContent = t('panel.coatingJumpWorst', {
        max: worstCorrosionPct.toFixed(0),
      });
      corrosionDetailEl.hidden = false;
      corrosionDetailEl.className = 'resource-flow warning clickable';
      corrosionDetailEl.onclick = () => {
        state = { ...state, selectedHex: worstCorrosionKey, selectedBuild: null };
        draw();
      };
    } else if (showWorst) {
      corrosionDetailEl.textContent = t('panel.corrosionWorst', {
        max: corrosionSummary.max.toFixed(0),
        count: corrosionSummary.penaltyCount,
      });
      corrosionDetailEl.hidden = false;
      corrosionDetailEl.className = corrosionSummary.max >= CORROSION_WARN_THRESHOLD
        ? 'resource-flow warning'
        : 'resource-flow';
    } else {
      corrosionDetailEl.hidden = true;
    }
  }
  const isruStatusEl = document.getElementById('stat-isru');
  const isruDetailEl = document.getElementById('stat-isru-detail');
  const isruDetailsEl = document.getElementById('isru-details');
  const isruSummaryEl = document.getElementById('isru-summary-line');
  const acidProgressWrap = document.getElementById('acid-progress-wrap');
  const acidProgressBar = document.getElementById('acid-progress-bar');
  const isruStatus = state.isruWaitStatus ?? 'noIsru';
  const waitingIsru = ['waitingAcid', 'waitingH2', 'electrolyzing', 'noPower'].includes(isruStatus);
  if (isruStatusEl) {
    isruStatusEl.textContent = getIsruStatusLabel(state);
    isruStatusEl.className = waitingIsru ? 'warning' : '';
  }
  if (isruDetailEl) {
    const detail = getIsruStatusDetail(state);
    isruDetailEl.textContent = detail ?? '';
    isruDetailEl.hidden = !detail;
    bindPowerSolarCta(isruDetailEl);
  }
  if (isruSummaryEl) {
    const detail = getIsruStatusDetail(state);
    const detailsClosed = isruDetailsEl && !isruDetailsEl.open;
    const showSummary = detailsClosed && detail
      && (waitingIsru || (stats.powerNet < 0 && stats.isruCount > 0));
    if (showSummary) {
      isruSummaryEl.textContent = detail.split('\n')[0];
      isruSummaryEl.hidden = false;
      bindPowerSolarCta(isruSummaryEl);
    } else {
      isruSummaryEl.hidden = true;
      isruSummaryEl.onclick = null;
      isruSummaryEl.classList.remove('clickable', 'power-cta');
    }
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

  const earthAidEl = document.getElementById('earth-aid-eta');
  if (earthAidEl) {
    const aid = getEarthAidEta(state);
    if (!aid.enabled) {
      earthAidEl.textContent = t('panel.earthAidNone');
      earthAidEl.className = 'earth-aid-eta none';
      earthAidEl.hidden = false;
    } else {
      earthAidEl.textContent = t('panel.earthAidEtaShort', {
        eta: aid.etaTicks,
        h2o: aid.amounts.h2o,
        iron: aid.amounts.iron,
      });
      earthAidEl.className = 'earth-aid-eta';
      earthAidEl.hidden = false;
    }
  }

  const exportSulfurBtn = document.getElementById('btn-export-sulfur');
  const sulfurAmount = state.inventory.sulfur ?? 0;
  const canExportSulfur = sulfurAmount >= TRADE_SULFUR_COST;
  if (exportSulfurBtn) {
    if (canExportSulfur) {
      exportSulfurBtn.textContent = t('panel.exportSulfurShort', { cost: TRADE_SULFUR_COST });
      exportSulfurBtn.title = '';
    } else {
      exportSulfurBtn.textContent = t('panel.exportSulfurProgress', {
        have: sulfurAmount.toFixed(1),
        need: TRADE_SULFUR_COST,
      });
      exportSulfurBtn.title = t('panel.sulfurExportWait');
    }
    exportSulfurBtn.disabled = state.gameOver;
  }

  const setResource = (id, text) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = text;
    const resId = id.replace('res-', '');
    el.className = isResourceShortForBuild(state.inventory, resId) ? 'resource-short' : '';
  };

  setResource('res-co2', state.inventory.co2.toFixed(1));
  setResource('res-carbon', state.inventory.carbon.toFixed(1));
  setResource('res-n2', state.inventory.n2.toFixed(1));
  setResource('res-h2so4', formatH2so4Amount(state.inventory.h2so4));
  setResource('res-h2', state.inventory.h2.toFixed(1));
  const h2LiftEl = document.getElementById('res-h2-lift');
  if (h2LiftEl) {
    const h2Lift = getH2LiftInfo(state);
    if (h2Lift.leakRate > 0.001 || h2Lift.shortfall > 0.01) {
      h2LiftEl.textContent = t('panel.h2LiftStatus', {
        effective: h2Lift.effective.toFixed(1),
        demand: h2Lift.demand.toFixed(1),
        leak: h2Lift.leakRate.toFixed(3),
      });
      h2LiftEl.hidden = false;
      h2LiftEl.className = h2Lift.critical ? 'resource-flow warning' : 'resource-flow';
    } else {
      h2LiftEl.hidden = true;
    }
  }
  setResource('res-o2', state.inventory.o2.toFixed(1));
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
  setResource('res-h2o', state.inventory.h2o.toFixed(1));
  setResource('res-sulfur', state.inventory.sulfur.toFixed(1));
  const sulfurUpkeepEl = document.getElementById('sulfur-upkeep-hint');
  if (sulfurUpkeepEl) {
    const upkeep = getCorrosionMaintenanceInfo(state);
    if (upkeep.active) {
      sulfurUpkeepEl.textContent = t('panel.sulfurUpkeep', { amount: upkeep.sPerTick });
      sulfurUpkeepEl.hidden = false;
    } else {
      sulfurUpkeepEl.hidden = true;
    }
  }
  setResource('res-iron', state.inventory.iron.toFixed(1));
  set('res-credits', state.inventory.credits.toFixed(0));

  const otherResourcesDetails = document.getElementById('other-resources-details');
  if (otherResourcesDetails) {
    const foldShort = ['co2', 'n2', 'o2'].some((id) => isResourceShortForBuild(state.inventory, id));
    if (foldShort) otherResourcesDetails.open = true;
  }

  const buyIronBtn = document.getElementById('btn-buy-iron');
  if (buyIronBtn) {
    const price = MATERIALS.iron.buyPrice;
    buyIronBtn.textContent = t('panel.buyIron', { price });
    buyIronBtn.disabled = state.gameOver;
  }
  const buyH2oBtn = document.getElementById('btn-buy-h2o');
  if (buyH2oBtn) {
    const price = MATERIALS.h2o.buyPrice;
    buyH2oBtn.textContent = t('panel.buyH2o', { price });
    buyH2oBtn.disabled = state.gameOver;
  }

  document.getElementById('tick-counter').textContent = gamePaused
    ? t('paused')
    : t('tick', { n: state.tick });

  const sel = state.selectedHex;
  const inBuildMode = !!state.selectedBuild;
  const info = document.getElementById('selected-info');
  const mapActionDock = document.getElementById('map-action-dock');
  const selectionActions = document.getElementById('selection-actions');
  const h2Actions = document.getElementById('h2-actions');
  const extendBtn = document.getElementById('btn-extend-h2');
  const lowerBtn = document.getElementById('btn-lower-h2');
  const coatingBtn = document.getElementById('btn-apply-coating');
  const coatingHint = document.getElementById('coating-hint');
  const dismantleBtn = document.getElementById('btn-dismantle');
  const lightenBtn = document.getElementById('btn-carbon-lighten');
  if (sel && state.modules.has(sel) && !inBuildMode) {
    const mod = state.modules.get(sel);
    const isH2Cell = mod.type === 'h2cell';
    info.textContent = formatSelectedInfo(mod, sel);
    info.classList.add('has-selection');
    if (mapActionDock) mapActionDock.hidden = false;
    if (selectionActions) selectionActions.hidden = false;
    if (h2Actions) h2Actions.hidden = !isH2Cell;
    if (isH2Cell) {
      extendBtn.disabled = state.gameOver || state.inventory.h2 < H2_EXTEND_COST || mod.h2Layers >= 4;
      if (lowerBtn) {
        lowerBtn.disabled = state.gameOver || mod.h2Layers <= 1;
      }
    }
    coatingBtn.disabled = state.gameOver
      || (state.inventory.sulfur ?? 0) < COATING_S_COST;
    if (coatingBtn.disabled && !state.gameOver) {
      if ((state.inventory.sulfur ?? 0) < COATING_S_COST) {
        coatingBtn.title = t('panel.coatingDisabledNoSulfur', { amount: COATING_S_COST });
      } else {
        coatingBtn.title = '';
      }
    } else {
      coatingBtn.title = t('panel.applyCoating');
    }
    if (coatingHint) {
      const showHint = mod.corrosion >= CORROSION_WARN_THRESHOLD
        && (mod.coatedTicks ?? 0) <= 0;
      coatingHint.hidden = !showHint;
      if (showHint) {
        const worstKey = getWorstCorrosionHex(state.modules);
        const worstMod = worstKey ? state.modules.get(worstKey) : null;
        const worstCorrosion = worstMod?.corrosion ?? 0;
        if (worstKey && worstKey !== sel && worstCorrosion >= CORROSION_WARN_THRESHOLD) {
          coatingHint.textContent = t('panel.coatingJumpWorst', { max: worstCorrosion.toFixed(0) });
          coatingHint.classList.add('clickable');
          coatingHint.onclick = () => {
            state = { ...state, selectedHex: worstKey, selectedBuild: null };
            draw();
          };
        } else {
          coatingHint.textContent = t('panel.coatingHint');
          coatingHint.classList.remove('clickable');
          coatingHint.onclick = null;
        }
      } else {
        coatingHint.classList.remove('clickable');
        coatingHint.onclick = null;
      }
    }
    if (dismantleBtn) {
      dismantleBtn.disabled = state.gameOver || mod.type === 'core';
    }
    if (lightenBtn) {
      lightenBtn.disabled = state.gameOver
        || (state.inventory.carbon ?? 0) < C_LIGHTEN_COST
        || (mod.carbonLighten ?? 0) >= 3;
    }
  } else {
    info.textContent = '';
    info.classList.remove('has-selection');
    if (mapActionDock) mapActionDock.hidden = true;
    if (selectionActions) selectionActions.hidden = true;
    if (h2Actions) h2Actions.hidden = true;
    if (coatingHint) coatingHint.hidden = true;
  }

  updateSinkWarning();
  updateGameOverOverlay();

  const inventoryBtn = document.getElementById('btn-inventory');
  if (inventoryBtn) {
    inventoryBtn.disabled = state.gameOver;
  }

  const buildModeBanner = document.getElementById('build-mode-banner');
  const buildModeLabel = document.getElementById('build-mode-label');
  const mapPanel = document.querySelector('.map-panel');
  const mapBottomBar = document.querySelector('.map-bottom-bar');
  if (buildModeBanner && buildModeLabel) {
    if (state.selectedBuild) {
      buildModeBanner.hidden = false;
      buildModeLabel.textContent = t('panel.buildModeBanner', {
        module: getModuleName(state.selectedBuild),
      });
      mapPanel?.classList.add('build-mode-active');
    } else {
      buildModeBanner.hidden = true;
      mapPanel?.classList.remove('build-mode-active');
    }
  }
  if (mapBottomBar) {
    const showDock = !!(sel && state.modules.has(sel) && !inBuildMode);
    const showBuild = inBuildMode;
    mapBottomBar.hidden = !showDock && !showBuild;
    mapBottomBar.classList.remove('compact');
  }

  const buildHintEl = document.getElementById('build-hint-line');
  if (buildHintEl) {
    const hint = getBuildPanelHint(state);
    buildHintEl.textContent = hint;
    buildHintEl.hidden = !hint;
    bindPowerSolarCta(buildHintEl);
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

function formatBuildMissingLine(missing) {
  if (!missing.length) return '';
  const detail = missing
    .map((m) => t('msg.missingEntry', {
      name: getMaterialName(m.id),
      need: m.need,
      have: m.have.toFixed(1),
    }))
    .join(costSeparator());
  return t('panel.buildMaterialShort', { detail });
}

function formatBuildShortageReason(missing, preview) {
  const parts = [];
  for (const m of missing) {
    const symbol = MATERIALS[m.id]?.symbol ?? m.id;
    parts.push(t('panel.buildShortMaterial', { material: symbol }));
  }
  if (preview?.wouldDeficit) {
    const net = Math.round(preview.projectedNet);
    parts.push(t('panel.buildShortPower', { net }));
  }
  return parts.join(' · ');
}

function buildButtons() {
  if (!state) return;
  const container = document.getElementById('build-buttons');
  container.innerHTML = '';
  for (const type of ['intake', 'isru', 'solar', 'h2cell', 'electrolyzer']) {
    const def = MODULE_TYPES[type];
    const preview = getBuildPowerPreview(state, type);
    const affordable = canAfford(state.inventory, def.cost);
    const missing = affordable ? [] : getMissingMaterials(state.inventory, def.cost);
    const powerLine = preview ? formatBuildPowerLine(preview) : '';
    const missingLine = formatBuildMissingLine(missing);
    const shortageReason = formatBuildShortageReason(missing, preview);
    const selected = state.selectedBuild === type;
    const tooltipParts = [];
    if (shortageReason) tooltipParts.push(shortageReason);
    if (missingLine) tooltipParts.push(missingLine);
    if (powerLine) tooltipParts.push(powerLine);
    const btn = document.createElement('button');
    btn.className = 'build-btn' + (selected ? ' active' : '')
      + (!affordable && !state.gameOver ? ' unaffordable' : '');
    btn.style.borderLeftColor = def.color;
    btn.disabled = state.gameOver;
    btn.setAttribute('aria-pressed', selected ? 'true' : 'false');
    const ariaLabelParts = [getModuleBuildLabel(type), formatBuildCostCompact(def.cost)];
    if (shortageReason) ariaLabelParts.push(shortageReason);
    if (powerLine) ariaLabelParts.push(powerLine);
    btn.setAttribute('aria-label', ariaLabelParts.join(', '));
    if (tooltipParts.length) btn.title = tooltipParts.join('\n');
    const powerFaceHtml = selected && powerLine
      ? `<span class="build-power-line">${powerLine}</span>`
      : '';
    btn.innerHTML = `<span class="build-btn-label"><span class="build-btn-title"><strong>${getModuleBuildLabel(type)}</strong></span><small>${formatBuildCostCompact(def.cost)}</small>${powerFaceHtml}</span>`;
    btn.addEventListener('click', () => {
      const next = state.selectedBuild === type ? null : type;
      state = { ...state, selectedBuild: next, selectedHex: next ? null : state.selectedHex };
      buildButtons();
      draw();
    });
    container.appendChild(btn);
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const tick = state?.tick ?? 0;
  drawVenusSky(ctx, canvas.width, canvas.height, tick);
  drawMistMotes(ctx, canvas.width, canvas.height, tick);

  if (!state) {
    drawViewportVignette(ctx, canvas.width, canvas.height);
    return;
  }

  const placeable = state.gameOver ? new Set() : getPlaceableHexes(state);
  const visible = new Set([...state.modules.keys(), ...placeable]);

  if (hoverHex) visible.add(hexKey(hoverHex.q, hoverHex.r));

  const inBuildMode = !!state.selectedBuild;

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
      drawOccupiedHex(ctx, cx, cy, mod, def, isSelected);
    } else if (isPlaceable) {
      drawEmptyHex(ctx, cx, cy, { inBuildMode, isHover });
    }
  }

  particles = particles.filter((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.life--;
    ctx.globalAlpha = (p.life / 40) * 0.85;
    ctx.fillStyle = p.color;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = 4;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2 + (40 - p.life) * 0.02, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    return p.life > 0;
  });

  drawViewportVignette(ctx, canvas.width, canvas.height);
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
  return gamePaused
    || newgameDialog.open
    || inventoryDialog.open
    || settingsDialog.open
    || confirmDialog.open
    || !gameoverOverlay.hidden;
}

function closeBlockingDialogs() {
  if (inventoryDialog.open) inventoryDialog.close();
  if (settingsDialog.open) settingsDialog.close();
  resolveConfirm(false);
}

function runTick() {
  if (!gameStarted || !state || state.gameOver || isTickPaused()) return;
  state = gameTick(state);
  if (state.gameOver) {
    closeBlockingDialogs();
  }
  buildButtons();
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
  if (!hit) {
    if (state.selectedHex) {
      state = { ...state, selectedHex: null };
      draw();
    }
    return;
  }

  const { q, r, key } = hit;

  if (state.modules.has(key)) {
    state = {
      ...state,
      selectedHex: key,
      selectedBuild: null,
    };
    draw();
    return;
  }

  if (!state.selectedBuild) {
    clearSelection();
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

document.getElementById('btn-dismantle')?.addEventListener('click', async () => {
  if (!state || !state.selectedHex || state.gameOver) return;
  const mod = state.modules.get(state.selectedHex);
  if (!mod) return;
  const refund = getDismantleIronRefund(mod);
  const confirmMsg = t('msg.confirmDismantle', { name: getModuleName(mod.type), iron: refund });
  if (!(await showConfirmDialog(confirmMsg))) return;
  const key = state.selectedHex;
  const [q, r] = key.split(',').map(Number);
  const result = dismantleModule(state, key);
  if (result.ok) {
    state = result.state;
    spawnParticles(q, r, '#f85149');
    showToast(result.message);
    buildButtons();
  } else {
    showToast(result.reason);
  }
  draw();
});


document.getElementById('btn-cancel-build-map')?.addEventListener('click', () => {
  cancelConstructionMode();
});

document.getElementById('btn-pause')?.addEventListener('click', () => togglePause());

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

document.getElementById('btn-inventory').addEventListener('click', () => openInventory());

document.getElementById('btn-buy-iron')?.addEventListener('click', tryBuyIron);

document.getElementById('btn-buy-h2o')?.addEventListener('click', tryBuyH2o);

document.getElementById('btn-export-sulfur')?.addEventListener('click', tryExportSulfur);

document.getElementById('btn-confirm-ok')?.addEventListener('click', () => resolveConfirm(true));
document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => resolveConfirm(false));

confirmDialog?.addEventListener('click', (e) => {
  const rect = confirmDialog.getBoundingClientRect();
  const inDialog = e.clientX >= rect.left && e.clientX <= rect.right
    && e.clientY >= rect.top && e.clientY <= rect.bottom;
  if (!inDialog) resolveConfirm(false);
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
  gamePaused = false;
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

function clearSelection() {
  if (!state?.selectedHex) return false;
  state = { ...state, selectedHex: null };
  draw();
  return true;
}

function isInteractiveElementFocused() {
  const el = document.activeElement;
  if (!el || el === document.body || el === document.documentElement) return false;
  const tag = el.tagName;
  if (tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return true;
  if (el.isContentEditable) return true;
  return el.closest('button, input, select, textarea, [contenteditable="true"]') != null;
}

document.addEventListener('keydown', (e) => {
  if (e.key === ' ' || e.code === 'Space') {
    if (!gameStarted || !state || state.gameOver) return;
    if (newgameDialog.open || !gameoverOverlay.hidden) return;
    if (confirmDialog.open || inventoryDialog.open || settingsDialog.open) return;
    if (isInteractiveElementFocused()) return;
    e.preventDefault();
    togglePause();
    return;
  }
  if (e.key !== 'Escape') return;
  if (newgameDialog.open || gameoverOverlay.hidden === false) return;
  if (confirmDialog.open) {
    resolveConfirm(false);
    return;
  }
  if (inventoryDialog.open) {
    inventoryDialog.close();
    return;
  }
  if (settingsDialog.open) {
    settingsDialog.close();
    return;
  }
  if (!gameStarted || !state) return;
  if (cancelConstructionMode()) return;
  clearSelection();
});

document.getElementById('isru-details')?.addEventListener('toggle', () => {
  if (state) draw();
});

function initDetailsAccordion() {
  const detailsEls = document.querySelectorAll('.status-details');
  detailsEls.forEach((el) => {
    el.addEventListener('toggle', () => {
      if (!el.open) return;
      detailsEls.forEach((other) => {
        if (other !== el) other.open = false;
      });
    });
  });
}

initDetailsAccordion();

onLocaleChange(() => applyLocale());

applyLocale();
updatePauseUi();
newgameDialog.showModal();
draw();
