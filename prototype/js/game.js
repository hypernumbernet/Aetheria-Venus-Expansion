import { hexKey, getNeighbors } from './hex.js';
import { MATERIALS, INVENTORY_IDS, getMaterialName } from './materials.js';
import { t, costSeparator } from './i18n.js';

export function getModuleName(type) {
  return t(`module.${type}`);
}

export function getModuleBuildLabel(type) {
  const short = t(`moduleShort.${type}`);
  return short !== `moduleShort.${type}` ? short : getModuleName(type);
}

/**
 * Per-tick atmospheric intake rates (CORE baseline; intake modules stack).
 * Relative abundances follow Venus atmosphere (§3.1–3.2): CO₂ dominant, N₂ secondary,
 * sulfur-family and H₂O orders of magnitude lower.
 */
export const CORE_INTAKE_RATES = {
  co2: 2.0,
  n2: 0.073,
  h2so4: 0.0045,
  h2o: 0.0004,
};

/** Acid-split S yield per batch (§4.2). */
const ACID_SPLIT_S_YIELD = 0.5;

/** H₂ reserve kept for buoyancy cell before Bosch spends surplus (§4.2). */
const H2_BOSCH_RESERVE = 1;

/** §7.1 — H₂ gas demand / storage; H₂ provides dominant lift (t lift per t gas). */
export const H2_LIFT_BASE_DEMAND = 1.5;
export const H2_LIFT_PER_MODULE = 0.4;
export const H2_LIFT_PER_H2_LAYER = 1.0;
export const H2_GAS_PER_LAYER = 1.5;
/** Lift (t) gained per tonne of effective H₂ gas (linear; demand is HUD-only). */
export const H2_LIFT_PER_T = 5;

/** §7.1 / §9 — corrosion-driven H₂ leakage (t / tick). */
export const H2_LEAK_BASE = 0.005;
export const H2_LEAK_AVG_CORROSION_SCALE = 0.05;
export const H2_LEAK_MAX_CORROSION_SCALE = 0.02;
/** Coated modules contribute this fraction to leak-weighted corrosion. */
export const H2_LEAK_COATING_FACTOR = 0.45;

/** §5 / §6 — CORE built-in solar (difficulty-scaled; added in computeStats). */
export const CORE_POWER_GEN_BY_DIFFICULTY = {
  easy: 6,
  normal: 5,
  hard: 4,
};

/** §4.2 — CORE built-in water electrolysis per tick when H₂O and power allow. */
export const CORE_ELECTROLYSIS_BY_DIFFICULTY = {
  easy: { h2: 0.10, o2: 0.05, h2o: 0.25, power: 1 },
  normal: { h2: 0.06, o2: 0.03, h2o: 0.25, power: 1 },
  hard: { h2: 0.04, o2: 0.02, h2o: 0.25, power: 1 },
};

/** §4.2 — standalone water electrolysis module throughput (per module / tick). */
export const ELECTROLYZER_H2O_COST = 0.4;
export const ELECTROLYZER_H2_YIELD = 0.20;
export const ELECTROLYZER_O2_YIELD = 0.15;

/** Starting inventory by difficulty (§8.2–8.4). */
const STARTING_BY_DIFFICULTY = {
  easy: { credits: 40, h2so4: 2, sulfur: 1, iron: 2, h2: 5, h2o: 4 },
  normal: { credits: 30, h2so4: 2, sulfur: 1, iron: 1, h2: 4, h2o: 2.5 },
  hard: { credits: 18, h2so4: 2, sulfur: 2, iron: 2, h2: 3.5, h2o: 2 },
};

export const MODULE_TYPES = {
  core: {
    id: 'core',
    name: 'Core Habitat',
    color: '#f0883e',
    mass: 12,
    baseBuoyancy: 4,
    powerGen: 0,
    powerUse: 3,
    intake: 1,
    cost: null,
    desc: 'Command module. Continuous atmospheric intake.',
  },
  intake: {
    id: 'intake',
    name: 'Atmospheric Intake',
    color: '#58a6ff',
    mass: 8,
    baseBuoyancy: 2,
    powerGen: 0,
    powerUse: 2,
    intake: 1,
    cost: { iron: 2, carbon: 1, sulfur: 1 },
    desc: 'Adds CORE-equivalent atmospheric intake.',
  },
  isru: {
    id: 'isru',
    name: 'ISRU Refinery',
    color: '#39d4d4',
    mass: 10,
    baseBuoyancy: 2,
    powerGen: 0,
    powerUse: 8,
    intake: 0,
    cost: { iron: 2, sulfur: 1 },
    desc: 'Processes CO₂, H₂SO₄ via electrolysis & Bosch.',
  },
  solar: {
    id: 'solar',
    name: 'Solar Array',
    color: '#d29922',
    mass: 6,
    baseBuoyancy: 2,
    powerGen: 15,
    powerUse: 0,
    intake: 0,
    cost: { iron: 2 },
    desc: 'Generates power above the clouds.',
  },
  h2cell: {
    id: 'h2cell',
    name: 'H₂ Buoyancy Cell',
    color: '#a371f7',
    mass: 8,
    baseBuoyancy: 3,
    baseWindLoad: 4,
    powerGen: 0,
    powerUse: 1,
    intake: 0,
    cost: { iron: 1, h2: 1, carbon: 1 },
    desc: 'Stores hydrogen lift gas.',
  },
  electrolyzer: {
    id: 'electrolyzer',
    name: 'Water Electrolyzer',
    color: '#56d4a0',
    mass: 7,
    baseBuoyancy: 2,
    powerGen: 0,
    powerUse: 5,
    intake: 0,
    cost: { iron: 2, sulfur: 1 },
    desc: 'Splits H₂O into H₂ lift gas and O₂.',
  },
};

/** @typedef {'easy' | 'normal' | 'hard'} Difficulty */

export const DIFFICULTY_LEVELS = ['easy', 'normal', 'hard'];

export const EARTH_AID_INTERVAL = 60;

/** H₂O / Fe granted per aid shipment by difficulty. */
export const EARTH_AID_AMOUNTS = {
  easy: { h2o: 4, iron: 2 },
  normal: { h2o: 2, iron: 1 },
  hard: { h2o: 0, iron: 0 },
};

const H2_EXTEND_COST = 3;
const H2_EXTEND_BUOYANCY = 8;
const H2_EXTEND_WIND = 4;
const TRADE_SULFUR_COST = 2;
const TRADE_CREDITS_GAIN = 6;

/** Carried inventory mass coefficient (§7.1): 1 t cargo ≈ 0.05 t structural mass. */
export const INVENTORY_MASS_PER_TON = 0.05;

/** Cargo that adds carried mass. Raw atmosphere buffers (CO₂, N₂), structural feedstock (C), and credits are excluded. */
export const INVENTORY_CARGO_MASS_IDS = [
  'iron', 'h2o', 'sulfur', 'h2', 'o2', 'h2so4',
];

/** Emergency vent targets — all holdings except credits (§4.3). */
export const INVENTORY_VENTABLE_IDS = INVENTORY_IDS.filter((id) => id !== 'credits');

const COATING_S_COST = 1;
const COATING_CORROSION_REDUCE = 25;
const COATING_SLOW_TICKS = 20;
export const COATING_MAINTENANCE_S_PER_TICK = 0.05;
/** §9 — modules above this % may trigger automatic S upkeep when stock allows. */
export const CORROSION_MAINTENANCE_THRESHOLD = 10;
const CORROSION_RISE = 0.3;
const CORROSION_RISE_COATED = 0.1;
const CORROSION_RISE_MAINTAINED = 0.15;

/** §4.2 — CO₂ electrolysis O₂ yield per ISRU per tick (fallback when acid/Bosch unavailable). */
export const O2_ELECTROLYSIS_YIELD = 0.1;
/** §4.2 / §7.1 — CORE life-support draws O₂ each tick so electrolysis byproduct does not pile into cargo mass. */
export const O2_LIFE_SUPPORT_SINK = 0.7;
/** §7.3 — spend C to lighten a module (mass↓, lift↑). */
export const C_LIGHTEN_COST = 1;
const C_LIGHTEN_MASS_REDUCE = 2;
const C_LIGHTEN_BUOYANCY = 2;
const C_LIGHTEN_MAX = 3;

/** §7.1 / §9 — wind load above this causes real stat penalties per tick. */
export const WIND_DAMAGE_THRESHOLD = 12;
const WIND_EXTRA_CORROSION = 0.4;
const WIND_POWER_PENALTY = 3;

export const SINK_COUNTDOWN_MAX = 30;
export const SINK_WARNING_AT = 5;

/** §9 — corrosion severity bands (light stakes, no instant destruction). */
export const CORROSION_WARN_THRESHOLD = 50;
export const CORROSION_SEVERE_THRESHOLD = 75;
export const CORROSION_CRITICAL_THRESHOLD = 90;

/** Per-module corrosion penalties applied in computeStats (§9 / §7.3). */
const CORROSION_BANDS = [
  { min: 90, powerPenalty: 4, massPenalty: 2, buoyancyPenalty: 2 },
  { min: 75, powerPenalty: 2, massPenalty: 1, buoyancyPenalty: 1 },
  { min: 50, powerPenalty: 1, massPenalty: 0.5, buoyancyPenalty: 0.5 },
];

/** §7.3 — scrap refund when dismantling (partial, iron only). */
const DISMANTLE_IRON_REFUND_RATIO = 0.25;

/** §7.1 — default cargo vent batch (t). */
export const VENT_CARGO_BATCH = 1;

function createEmptyInventory() {
  const inv = {};
  for (const id of INVENTORY_IDS) {
    inv[id] = 0;
  }
  return inv;
}

/**
 * @param {Difficulty} [difficulty='normal']
 */
export function createInitialState(difficulty = 'normal') {
  const modules = new Map();
  modules.set(hexKey(0, 0), {
    type: 'core',
    h2Layers: 1,
    corrosion: 0,
    coatedTicks: 0,
    carbonLighten: 0,
  });
  const inventory = createEmptyInventory();
  const start = STARTING_BY_DIFFICULTY[difficulty] ?? STARTING_BY_DIFFICULTY.normal;
  inventory.h2so4 = start.h2so4;
  inventory.sulfur = start.sulfur;
  inventory.credits = start.credits;
  inventory.iron = start.iron;
  inventory.h2 = start.h2 ?? 0;
  inventory.h2o = start.h2o ?? 0;

  return {
    modules,
    inventory,
    tick: 0,
    difficulty,
    selectedBuild: null,
    selectedHex: null,
    messages: [],
    sinkCountdown: 0,
    gameOver: false,
    isruWaitStatus: 'noIsru',
    corrosionWarnLevel: 0,
    sUpkeepActive: false,
    windDamageActive: false,
    windShearActive: false,
    startHintShown: false,
    h2LeakWarnActive: false,
  };
}

/** @deprecated use state.inventory — kept for gradual migration */
export function getResources(state) {
  return state.inventory;
}

export function canAfford(inventory, cost) {
  if (!cost) return true;
  return Object.entries(cost).every(([k, v]) => (inventory[k] ?? 0) >= v);
}

export function payCost(inventory, cost) {
  const next = { ...inventory };
  for (const [k, v] of Object.entries(cost)) {
    next[k] = (next[k] ?? 0) - v;
  }
  return next;
}

export function formatBuildCost(cost) {
  return Object.entries(cost)
    .map(([k, v]) => `${v} ${getMaterialName(k)}`)
    .join(costSeparator());
}

/** Compact one-line cost for sidebar build grid (symbols only). */
export function formatBuildCostCompact(cost) {
  return Object.entries(cost)
    .map(([k, v]) => `${v}${MATERIALS[k]?.symbol ?? k}`)
    .join(' ');
}

const BUILD_MODULE_TYPES = ['intake', 'isru', 'solar', 'h2cell', 'electrolyzer'];

/** True when any buildable module needs more of this resource than held. */
export function isResourceShortForBuild(inventory, resourceId) {
  for (const type of BUILD_MODULE_TYPES) {
    const need = MODULE_TYPES[type]?.cost?.[resourceId];
    if (need != null && (inventory[resourceId] ?? 0) < need) return true;
  }
  return false;
}

export function getMissingMaterials(inventory, cost) {
  const missing = [];
  for (const [k, v] of Object.entries(cost)) {
    const have = inventory[k] ?? 0;
    if (have < v) missing.push({ id: k, need: v, have });
  }
  return missing;
}

export function buyMaterial(state, materialId, amount = 1) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mat = MATERIALS[materialId];
  if (!mat) return { ok: false, reason: t('msg.unknownMaterial') };
  if (mat.locked) return { ok: false, reason: t('msg.materialLocked', { name: getMaterialName(materialId) }) };
  if (!mat.purchasable) return { ok: false, reason: t('msg.materialNotBuyable', { name: getMaterialName(materialId) }) };
  if (amount < 1) return { ok: false, reason: t('msg.invalidAmount') };

  const totalCost = mat.buyPrice * amount;
  const credits = state.inventory.credits ?? 0;
  if (credits < totalCost) {
    return {
      ok: false,
      reason: t('msg.insufficientCredits', { need: totalCost, have: credits.toFixed(0) }),
    };
  }

  const inventory = { ...state.inventory };
  inventory.credits = credits - totalCost;
  inventory[materialId] = (inventory[materialId] ?? 0) + amount;

  return {
    ok: true,
    state: { ...state, inventory },
    message: t('msg.bought', { name: getMaterialName(materialId), amount, cost: totalCost }),
  };
}

export function getAdjacentEmpty(state, q, r) {
  const occupied = new Set(state.modules.keys());
  const empty = [];
  for (const n of getNeighbors(q, r)) {
    const k = hexKey(n.q, n.r);
    if (!occupied.has(k)) empty.push(n);
  }
  return empty;
}

export function getPlaceableHexes(state) {
  const placeable = new Set();
  for (const key of state.modules.keys()) {
    const { q, r } = parseKeyLocal(key);
    for (const n of getNeighbors(q, r)) {
      const k = hexKey(n.q, n.r);
      if (!state.modules.has(k)) placeable.add(k);
    }
  }
  return placeable;
}

function parseKeyLocal(key) {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

export function placeModule(state, q, r) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const key = hexKey(q, r);
  const placeable = getPlaceableHexes(state);
  if (!placeable.has(key)) return { ok: false, reason: t('msg.mustBeAdjacent') };

  const type = state.selectedBuild;
  if (!type) return { ok: false, reason: t('msg.noBuildSelected') };
  const def = MODULE_TYPES[type];
  if (!def || !def.cost) return { ok: false, reason: t('msg.invalidModule') };

  if (!canAfford(state.inventory, def.cost)) {
    const missing = getMissingMaterials(state.inventory, def.cost);
    const detail = missing
      .map((m) => t('msg.missingEntry', { name: getMaterialName(m.id), need: m.need, have: m.have.toFixed(1) }))
      .join(costSeparator());
    return {
      ok: false,
      reason: t('msg.insufficientMaterials', { detail }),
    };
  }

  const modules = new Map(state.modules);
  modules.set(key, { type, h2Layers: 1, corrosion: 0, coatedTicks: 0, carbonLighten: 0 });
  return {
    ok: true,
    state: {
      ...state,
      modules,
      inventory: payCost(state.inventory, def.cost),
      selectedHex: key,
      selectedBuild: null,
    },
    message: t('msg.built', { name: getModuleName(type), cost: formatBuildCost(def.cost) }),
  };
}

export function extendH2(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
  if (mod.type !== 'h2cell') {
    return { ok: false, reason: t('msg.h2CellOnly') };
  }
  if (state.inventory.h2 < H2_EXTEND_COST) {
    return { ok: false, reason: t('msg.needH2Extend', { amount: H2_EXTEND_COST }) };
  }
  if (mod.h2Layers >= 4) {
    return { ok: false, reason: t('msg.h2MaxHeight') };
  }

  const modules = new Map(state.modules);
  modules.set(key, { ...mod, h2Layers: mod.h2Layers + 1 });
  const inventory = { ...state.inventory, h2: state.inventory.h2 - H2_EXTEND_COST };
  return {
    ok: true,
    state: { ...state, modules, inventory },
    message: t('msg.h2Extended'),
  };
}

/** §7.3 — lower H₂ envelope (inverse of extend); floor is 1 layer. */
export function lowerH2(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
  if (mod.type !== 'h2cell') {
    return { ok: false, reason: t('msg.h2CellOnly') };
  }
  if (mod.h2Layers <= 1) {
    return { ok: false, reason: t('msg.h2MinHeight') };
  }

  const modules = new Map(state.modules);
  modules.set(key, { ...mod, h2Layers: mod.h2Layers - 1 });
  return {
    ok: true,
    state: { ...state, modules },
    message: t('msg.h2Lowered'),
  };
}

export function applySulfurCoating(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
  if (state.inventory.sulfur < COATING_S_COST) {
    return { ok: false, reason: t('msg.needSulfurCoating', { amount: COATING_S_COST }) };
  }

  const modules = new Map(state.modules);
  const newCorrosion = Math.max(0, mod.corrosion - COATING_CORROSION_REDUCE);
  modules.set(key, {
    ...mod,
    corrosion: newCorrosion,
    coatedTicks: COATING_SLOW_TICKS,
  });
  const inventory = {
    ...state.inventory,
    sulfur: state.inventory.sulfur - COATING_S_COST,
  };
  return {
    ok: true,
    state: { ...state, modules, inventory },
    message: t('msg.coatingApplied'),
  };
}

export function applyCarbonLightening(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
  const level = mod.carbonLighten ?? 0;
  if (level >= C_LIGHTEN_MAX) {
    return { ok: false, reason: t('msg.carbonLightenMax') };
  }
  if ((state.inventory.carbon ?? 0) < C_LIGHTEN_COST) {
    return { ok: false, reason: t('msg.needCarbonLighten', { amount: C_LIGHTEN_COST }) };
  }

  const modules = new Map(state.modules);
  modules.set(key, { ...mod, carbonLighten: level + 1 });
  const inventory = {
    ...state.inventory,
    carbon: state.inventory.carbon - C_LIGHTEN_COST,
  };
  return {
    ok: true,
    state: { ...state, modules, inventory },
    message: t('msg.carbonLightened'),
  };
}

/** §7.3 — remove a non-CORE module; partial iron refund, connectivity preserved. */
export function dismantleModule(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
  if (mod.type === 'core') {
    return { ok: false, reason: t('msg.cannotDismantleCore') };
  }
  if (state.modules.size <= 1) {
    return { ok: false, reason: t('msg.cannotDismantleLast') };
  }

  const modules = new Map(state.modules);
  modules.delete(key);
  const coreKey = findCoreKey(modules);
  if (!coreKey || !isModuleGraphConnected(modules, coreKey)) {
    return { ok: false, reason: t('msg.cannotDismantleBridge') };
  }

  const inventory = { ...state.inventory };
  const refund = getDismantleIronRefund(mod);
  if (refund > 0) {
    inventory.iron = (inventory.iron ?? 0) + refund;
  }

  const selectedHex = state.selectedHex === key ? null : state.selectedHex;
  return {
    ok: true,
    state: { ...state, modules, inventory, selectedHex },
    message: t('msg.dismantled', { name: getModuleName(mod.type) }),
  };
}

/** §4.3 / §7.1 — emergency vent for any holdable resource except credits. */
export function ventCargo(state, materialId, amount = VENT_CARGO_BATCH) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  if (!INVENTORY_VENTABLE_IDS.includes(materialId)) {
    return { ok: false, reason: t('msg.cannotVentMaterial', { name: getMaterialName(materialId) }) };
  }
  if (amount < 0.1) return { ok: false, reason: t('msg.invalidAmount') };

  const have = state.inventory[materialId] ?? 0;
  if (have < amount) {
    return {
      ok: false,
      reason: t('msg.insufficientCargo', { name: getMaterialName(materialId), need: amount, have: have.toFixed(1) }),
    };
  }

  const inventory = { ...state.inventory };
  inventory[materialId] = have - amount;
  return {
    ok: true,
    state: { ...state, inventory },
    message: t('msg.ventedCargo', { amount: amount.toFixed(1), name: getMaterialName(materialId) }),
  };
}

export function tradeWithEarth(state) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  if (state.inventory.sulfur < TRADE_SULFUR_COST) {
    return { ok: false, reason: t('msg.needSulfurTrade', { amount: TRADE_SULFUR_COST }) };
  }
  const inventory = {
    ...state.inventory,
    sulfur: state.inventory.sulfur - TRADE_SULFUR_COST,
    credits: state.inventory.credits + TRADE_CREDITS_GAIN,
  };
  return {
    ok: true,
    state: { ...state, inventory },
    message: t('msg.traded', { gain: TRADE_CREDITS_GAIN }),
  };
}

/** §9 — per-module corrosion stat penalties (light, no destruction). */
export function getCorrosionPenalties(corrosion) {
  for (const band of CORROSION_BANDS) {
    if (corrosion >= band.min) return band;
  }
  return { min: 0, powerPenalty: 0, massPenalty: 0, buoyancyPenalty: 0 };
}

/** §9 — whether corrosion penalties are active on a module. */
export function hasCorrosionPenalties(corrosion) {
  return corrosion >= CORROSION_WARN_THRESHOLD;
}

/** §8.3 — ticks until next Earth periodic aid shipment (null when disabled). */
export function getEarthAidEta(state) {
  const amounts = EARTH_AID_AMOUNTS[state.difficulty] ?? EARTH_AID_AMOUNTS.normal;
  if (amounts.h2o === 0 && amounts.iron === 0) {
    return { enabled: false, etaTicks: null, amounts };
  }
  const remainder = state.tick % EARTH_AID_INTERVAL;
  const etaTicks = remainder === 0 ? EARTH_AID_INTERVAL : EARTH_AID_INTERVAL - remainder;
  return { enabled: true, etaTicks, amounts };
}

/** §7.3 — iron refund preview for dismantle confirm. */
export function getDismantleIronRefund(mod) {
  const def = MODULE_TYPES[mod.type];
  const ironCost = def?.cost?.iron ?? 0;
  if (ironCost <= 0) return 0;
  return Math.max(1, Math.floor(ironCost * DISMANTLE_IRON_REFUND_RATIO));
}

/** Highest corrosion warning band currently active across modules. */
export function getCorrosionWarnLevel(modules) {
  let level = 0;
  for (const mod of modules.values()) {
    const c = mod.corrosion ?? 0;
    if (c >= CORROSION_CRITICAL_THRESHOLD) level = Math.max(level, 3);
    else if (c >= CORROSION_SEVERE_THRESHOLD) level = Math.max(level, 2);
    else if (c >= CORROSION_WARN_THRESHOLD) level = Math.max(level, 1);
  }
  return level;
}

/** §9 — aggregate corrosion stats for sidebar (avg shown elsewhere; worst + penalty count). */
export function getCorrosionSummary(modules) {
  let max = 0;
  let penaltyCount = 0;
  let sum = 0;
  const size = modules.size;
  for (const mod of modules.values()) {
    const c = mod.corrosion ?? 0;
    sum += c;
    if (c > max) max = c;
    if (hasCorrosionPenalties(c)) penaltyCount += 1;
  }
  return {
    avg: size > 0 ? sum / size : 0,
    max,
    penaltyCount,
  };
}

/** Hex key of the module with highest corrosion (for coating jump). */
export function getWorstCorrosionHex(modules) {
  let worstKey = null;
  let worst = -1;
  for (const [key, mod] of modules) {
    const c = mod.corrosion ?? 0;
    if (c > worst) {
      worst = c;
      worstKey = key;
    }
  }
  return worstKey;
}

/** §9 — whether automatic S upkeep is draining sulfur this tick. */
export function getCorrosionMaintenanceInfo(state) {
  let corrodedCount = 0;
  for (const mod of state.modules.values()) {
    if ((mod.corrosion ?? 0) > CORROSION_MAINTENANCE_THRESHOLD) corrodedCount += 1;
  }
  const sulfur = state.inventory.sulfur ?? 0;
  const active = corrodedCount > 0 && sulfur > 1;
  return {
    active,
    corrodedCount,
    sPerTick: COATING_MAINTENANCE_S_PER_TICK,
  };
}

function isModuleGraphConnected(modules, coreKey) {
  if (!modules.has(coreKey)) return false;
  const visited = new Set([coreKey]);
  const queue = [coreKey];
  while (queue.length > 0) {
    const key = queue.shift();
    const { q, r } = parseKeyLocal(key);
    for (const n of getNeighbors(q, r)) {
      const nk = hexKey(n.q, n.r);
      if (modules.has(nk) && !visited.has(nk)) {
        visited.add(nk);
        queue.push(nk);
      }
    }
  }
  return visited.size === modules.size;
}

function findCoreKey(modules) {
  for (const [key, mod] of modules) {
    if (mod.type === 'core') return key;
  }
  return null;
}

export function computeInventoryMass(inventory) {
  let total = 0;
  for (const id of INVENTORY_CARGO_MASS_IDS) {
    total += (inventory[id] ?? 0) * INVENTORY_MASS_PER_TON;
  }
  return total;
}

/** Single-pass H₂ demand, effective storage, and leak-rate scan (§7.1 / §9). */
function scanH2LiftMetrics(inventory, modules) {
  let demand = H2_LIFT_BASE_DEMAND;
  let effective = inventory.h2 ?? 0;
  const size = modules.size;
  if (size === 0) {
    return { demand, effective, leakRate: 0 };
  }

  let weightedCorrosion = 0;
  let maxCorrosion = 0;
  for (const mod of modules.values()) {
    const c = mod.corrosion ?? 0;
    if (c > maxCorrosion) maxCorrosion = c;
    const coated = (mod.coatedTicks ?? 0) > 0;
    weightedCorrosion += c * (coated ? H2_LEAK_COATING_FACTOR : 1);
    if (mod.type === 'h2cell') {
      const layers = mod.h2Layers ?? 1;
      effective += layers * H2_GAS_PER_LAYER;
      demand += layers * H2_LIFT_PER_H2_LAYER;
    } else {
      demand += H2_LIFT_PER_MODULE;
    }
  }

  const avgCorrosion = weightedCorrosion / size;
  const leakRate = H2_LEAK_BASE
    + (avgCorrosion / 100) * H2_LEAK_AVG_CORROSION_SCALE
    + (maxCorrosion / 100) * H2_LEAK_MAX_CORROSION_SCALE;
  return { demand, effective, leakRate };
}

function finalizeH2LiftInfo({ demand, effective, leakRate }) {
  const shortfall = Math.max(0, demand - effective);
  const utilization = demand > 0 ? Math.min(1, effective / demand) : 1;
  const h2GasLift = effective * H2_LIFT_PER_T;
  return {
    demand,
    effective,
    shortfall,
    utilization,
    h2GasLift,
    leakRate,
    critical: shortfall > 0.5 || utilization < 0.85,
  };
}

/** §7.1 — H₂ gas stored in inventory plus H₂ cell envelopes. */
export function getEffectiveH2(inventory, modules) {
  return scanH2LiftMetrics(inventory, modules).effective;
}

/** §7.1 — minimum H₂ gas needed to sustain lift for the current continent layout. */
export function getH2LiftDemand(modules) {
  return scanH2LiftMetrics({ h2: 0 }, modules).demand;
}

/** §7.1 / §9 — corrosion-weighted H₂ leak rate (t / tick). */
export function computeH2LeakRate(modules) {
  return scanH2LiftMetrics({ h2: 0 }, modules).leakRate;
}

/** §7.1 — H₂ gas lift (dominant buoyancy term); linear in effective H₂. */
export function computeH2GasLift(effectiveH2) {
  return effectiveH2 * H2_LIFT_PER_T;
}

/** §7.1 — H₂ lift breakdown for HUD and net-lift integration. */
export function getH2LiftInfo(state) {
  return finalizeH2LiftInfo(scanH2LiftMetrics(state.inventory, state.modules));
}

function getCoreElectrolysisConfig(difficulty) {
  return CORE_ELECTROLYSIS_BY_DIFFICULTY[difficulty]
    ?? CORE_ELECTROLYSIS_BY_DIFFICULTY.normal;
}

function hasCoreModule(modules) {
  for (const mod of modules.values()) {
    if (mod.type === 'core') return true;
  }
  return false;
}

/** §4.2 — whether CORE built-in electrolysis can run this tick (shared gate for stats + tick). */
export function canRunCoreElectrolysis(modules, inventory, difficulty, netBeforeCoreElectrolysis) {
  if (!hasCoreModule(modules)) return false;
  const cfg = getCoreElectrolysisConfig(difficulty);
  if ((inventory.h2o ?? 0) < cfg.h2o) return false;
  return netBeforeCoreElectrolysis >= cfg.power;
}

/** §4.2 — CORE built-in water electrolysis when CORE solar covers the extra draw. */
export function processCoreElectrolysis(inventory, modules, difficulty, netBeforeCoreElectrolysis) {
  if (!canRunCoreElectrolysis(modules, inventory, difficulty, netBeforeCoreElectrolysis)) {
    return { inventory, events: [], ran: false };
  }
  const cfg = getCoreElectrolysisConfig(difficulty);

  const next = { ...inventory };
  next.h2o = next.h2o - cfg.h2o;
  next.h2 = (next.h2 ?? 0) + cfg.h2;
  next.o2 = (next.o2 ?? 0) + cfg.o2;
  return {
    inventory: next,
    events: [],
    ran: true,
  };
}

/** §4.2 — standalone electrolyzer modules (H₂O → H₂ + O₂). */
export function processModuleElectrolysis(inventory, electrolyzerCount, powerNet) {
  if (electrolyzerCount <= 0 || powerNet < 0) {
    return { inventory, events: [], runs: 0 };
  }

  let inv = { ...inventory };
  let runs = 0;
  for (let i = 0; i < electrolyzerCount; i++) {
    if ((inv.h2o ?? 0) < ELECTROLYZER_H2O_COST) break;
    inv.h2o -= ELECTROLYZER_H2O_COST;
    inv.h2 = (inv.h2 ?? 0) + ELECTROLYZER_H2_YIELD;
    inv.o2 = (inv.o2 ?? 0) + ELECTROLYZER_O2_YIELD;
    runs++;
  }

  const events = runs > 0 ? [t('msg.electrolyzerRun', { amount: runs })] : [];
  return { inventory: inv, events, runs };
}

/** §7.1 / §9 — leak consumes inventory H₂ first. */
export function applyH2Leak(inventory, leakRate) {
  if (leakRate <= 0) return inventory;
  const h2 = inventory.h2 ?? 0;
  if (h2 <= 0) return inventory;
  return { ...inventory, h2: Math.max(0, h2 - leakRate) };
}

/** Post-placement power preview for build UI (§4.2 / §6.3). */
export function getBuildPowerPreview(state, moduleType, cachedStats = null) {
  const def = MODULE_TYPES[moduleType];
  if (!def) return null;

  const stats = cachedStats ?? computeStats(state);
  const genDelta = def.powerGen ?? 0;
  const useDelta = def.powerUse ?? 0;

  let windDelta = 0;
  if (def.baseWindLoad) windDelta += def.baseWindLoad;

  const currentWindPenalty = stats.windLoad > WIND_DAMAGE_THRESHOLD ? WIND_POWER_PENALTY : 0;
  const newWindPenalty = (stats.windLoad + windDelta) > WIND_DAMAGE_THRESHOLD
    ? WIND_POWER_PENALTY
    : 0;
  const windPenaltyDelta = newWindPenalty - currentWindPenalty;

  const currentNet = stats.powerNet;
  const projectedNet = currentNet + genDelta - useDelta - windPenaltyDelta;

  return {
    genDelta,
    useDelta,
    currentNet,
    projectedNet,
    wouldDeficit: projectedNet < 0,
  };
}

export function computeStats(state) {
  let moduleMass = 0;
  let structuralBuoyancy = 0;
  let powerGen = 0;
  let powerUse = 0;
  let intakeUnits = 0;
  let windLoad = 0;
  let corrosion = 0;
  let corrosionPowerPenalty = 0;
  let isruCount = 0;
  let electrolyzerCount = 0;
  let hasCore = false;
  let h2Demand = H2_LIFT_BASE_DEMAND;
  let h2Effective = state.inventory.h2 ?? 0;
  let h2WeightedCorrosion = 0;
  let h2MaxCorrosion = 0;
  const moduleCount = state.modules.size;

  for (const mod of state.modules.values()) {
    const def = MODULE_TYPES[mod.type];
    const lighten = mod.carbonLighten ?? 0;
    const corrosionVal = mod.corrosion ?? 0;
    const cPen = getCorrosionPenalties(corrosionVal);
    moduleMass += def.mass - lighten * C_LIGHTEN_MASS_REDUCE + cPen.massPenalty;
    structuralBuoyancy += def.baseBuoyancy + lighten * C_LIGHTEN_BUOYANCY - cPen.buoyancyPenalty;
    powerGen += def.powerGen;
    powerUse += def.powerUse + cPen.powerPenalty;
    corrosionPowerPenalty += cPen.powerPenalty;
    intakeUnits += def.intake ?? 0;
    if (def.baseWindLoad) {
      windLoad += def.baseWindLoad;
    }
    if (mod.type === 'h2cell') {
      const layers = mod.h2Layers ?? 1;
      h2Effective += layers * H2_GAS_PER_LAYER;
      h2Demand += layers * H2_LIFT_PER_H2_LAYER;
      windLoad += (mod.h2Layers - 1) * H2_EXTEND_WIND;
    } else {
      h2Demand += H2_LIFT_PER_MODULE;
    }
    if (corrosionVal > h2MaxCorrosion) h2MaxCorrosion = corrosionVal;
    const coated = (mod.coatedTicks ?? 0) > 0;
    h2WeightedCorrosion += corrosionVal * (coated ? H2_LEAK_COATING_FACTOR : 1);
    corrosion += corrosionVal;
    if (mod.type === 'isru') isruCount++;
    if (mod.type === 'electrolyzer') electrolyzerCount++;
    if (mod.type === 'core') hasCore = true;
  }

  if (hasCore) {
    const coreGen = CORE_POWER_GEN_BY_DIFFICULTY[state.difficulty]
      ?? CORE_POWER_GEN_BY_DIFFICULTY.normal;
    powerGen += coreGen;
  }

  const inventoryMass = computeInventoryMass(state.inventory);
  const mass = moduleMass + inventoryMass;
  const h2LeakRate = moduleCount === 0
    ? 0
    : H2_LEAK_BASE
      + ((h2WeightedCorrosion / moduleCount) / 100) * H2_LEAK_AVG_CORROSION_SCALE
      + (h2MaxCorrosion / 100) * H2_LEAK_MAX_CORROSION_SCALE;
  const h2Shortfall = Math.max(0, h2Demand - h2Effective);
  const h2Utilization = h2Demand > 0 ? Math.min(1, h2Effective / h2Demand) : 1;
  const h2GasLift = h2Effective * H2_LIFT_PER_T;
  const h2Critical = h2Shortfall > 0.5 || h2Utilization < 0.85;
  const buoyancy = structuralBuoyancy + h2GasLift;
  const netLift = buoyancy - mass;
  const windPowerPenalty = windLoad > WIND_DAMAGE_THRESHOLD ? WIND_POWER_PENALTY : 0;
  const netBeforeCoreElectrolysis = powerGen - powerUse - windPowerPenalty;
  let coreElectrolysisActive = false;
  if (canRunCoreElectrolysis(
    state.modules,
    state.inventory,
    state.difficulty,
    netBeforeCoreElectrolysis,
  )) {
    const coreCfg = getCoreElectrolysisConfig(state.difficulty);
    powerUse += coreCfg.power;
    coreElectrolysisActive = true;
  }
  const powerNet = powerGen - powerUse - windPowerPenalty;

  return {
    mass,
    moduleMass,
    inventoryMass,
    structuralBuoyancy,
    h2GasLift,
    buoyancy,
    netLift,
    powerGen,
    powerUse,
    powerNet,
    netBeforeCoreElectrolysis,
    coreElectrolysisActive,
    windPowerPenalty,
    corrosionPowerPenalty,
    intakeUnits,
    windLoad,
    corrosion,
    isruCount,
    electrolyzerCount,
    h2Demand,
    h2Effective,
    h2Shortfall,
    h2Utilization,
    h2LeakRate,
    h2Critical,
  };
}

function applyIntake(inventory, intakeUnits) {
  if (intakeUnits <= 0) return inventory;
  const next = { ...inventory };
  for (const [id, rate] of Object.entries(CORE_INTAKE_RATES)) {
    next[id] = (next[id] ?? 0) + rate * intakeUnits;
  }
  return next;
}

/**
 * @typedef {'noIsru' | 'noPower' | 'acidReady' | 'boschReady' | 'waitingAcid' | 'waitingH2' | 'electrolyzing' | 'idle'} IsruWaitStatus
 */

/** H₂SO₄ intake per tick from CORE + intake modules (§5.1). */
export function getAcidIntakePerTick(intakeUnits) {
  return CORE_INTAKE_RATES.h2so4 * intakeUnits;
}

/** Acid accumulation toward next 1t batch (§5.1 / §4.2). */
export function getAcidWaitInfo(state, cachedStats = null) {
  const stats = cachedStats ?? computeStats(state);
  const h2so4 = state.inventory.h2so4 ?? 0;
  const rate = getAcidIntakePerTick(stats.intakeUnits);
  const progress = Math.min(1, Math.max(0, h2so4));
  const etaTicks = rate > 0 ? Math.ceil((1 - progress) / rate) : null;
  const h2 = state.inventory.h2 ?? 0;
  const h2Spendable = h2 - H2_BOSCH_RESERVE;
  const fallbackElectrolysis = stats.isruCount > 0
    && stats.powerNet >= 0
    && h2so4 < 1
    && (state.inventory.co2 ?? 0) >= 1
    && h2Spendable < 1;
  return {
    progress,
    rate,
    etaTicks,
    intakeUnits: stats.intakeUnits,
    fallbackElectrolysis,
  };
}

/** O₂ production vs CORE life-support consumption per tick (§4.2). */
export function getO2Flow(state, cachedStats = null) {
  const stats = cachedStats ?? computeStats(state);
  const inv = state.inventory;
  let produce = 0;
  if (stats.isruCount > 0 && stats.powerNet >= 0 && (inv.co2 ?? 0) >= 1) {
    const h2Spendable = (inv.h2 ?? 0) - H2_BOSCH_RESERVE;
    const wouldElectrolyze = (inv.h2so4 ?? 0) < 1 && h2Spendable < 1;
    if (wouldElectrolyze) {
      produce = O2_ELECTROLYSIS_YIELD * stats.isruCount;
    }
  }
  const consume = hasCoreModule(state.modules) ? O2_LIFE_SUPPORT_SINK : 0;
  return { produce, consume, net: produce - consume };
}

/**
 * What the ISRU chain is blocked on (for HUD). §4.2
 * Acid batch ready first; when H₂SO₄ < 1 but Bosch can run, show boschReady (not acid-wait).
 */
export function analyzeIsruBottleneck(inventory) {
  const h2so4 = inventory.h2so4 ?? 0;
  if (h2so4 >= 1) return 'acidReady';
  const h2Spendable = (inventory.h2 ?? 0) - H2_BOSCH_RESERVE;
  const co2 = inventory.co2 ?? 0;
  if (co2 >= 1 && h2Spendable >= 1) return 'boschReady';
  if (co2 >= 1 && h2Spendable < 1) return 'electrolyzing';
  return 'waitingAcid';
}

/** Extra intake modules beyond CORE (§6.3). */
export function countExtraIntakeModules(modules) {
  let count = 0;
  for (const mod of modules.values()) {
    if (mod.type === 'intake') count++;
  }
  return count;
}

/** Count placed modules of a given type. */
export function countModulesOfType(modules, type) {
  let count = 0;
  for (const mod of modules.values()) {
    if (mod.type === type) count++;
  }
  return count;
}

/** Whether the HUD should offer a one-click Solar build CTA (§4.2). */
export function isPowerSolarCtaActive(state) {
  if (state.selectedBuild) return false;
  const stats = computeStats(state);
  return stats.powerNet < 0;
}

/** Hint when an H₂ cell can be extended (§7.3). */
function getH2ExtendHint(state) {
  if ((state.inventory.h2 ?? 0) < H2_EXTEND_COST) return null;
  for (const mod of state.modules.values()) {
    if (mod.type === 'h2cell' && mod.h2Layers < 4) {
      return t('panel.buildHintH2Extend');
    }
  }
  return null;
}

/**
 * Dynamic next-step hint for the build panel (§6.1 / §6.2 / §8).
 * Priority: power deficit → early coaching → post-ISRU bottlenecks → generic.
 */
export function getBuildPanelHint(state, cachedStats = null) {
  if (state.selectedBuild) return t('panel.buildHintActive');

  const inv = state.inventory;
  const stats = cachedStats ?? computeStats(state);
  const solarCount = countModulesOfType(state.modules, 'solar');
  const isruCount = stats.isruCount;
  const electrolyzerCount = stats.electrolyzerCount ?? 0;
  const iron = inv.iron ?? 0;
  const solarCost = MODULE_TYPES.solar.cost;
  const solarIron = solarCost?.iron ?? 0;

  // §7.1 — H₂ lift collapse: electrolyzer / acid chain / vent
  if (stats.h2Critical) {
    const elecCost = MODULE_TYPES.electrolyzer.cost;
    if (electrolyzerCount === 0 && canAfford(inv, elecCost)) {
      return t('panel.buildHintElectrolyzer');
    }
    if ((inv.h2o ?? 0) >= 0.25 && (stats.coreElectrolysisActive || stats.netBeforeCoreElectrolysis >= 1)) {
      return t('panel.h2LiftCoreElectro');
    }
    if (stats.netLift < 0 && (inv.h2 ?? 0) > VENT_CARGO_BATCH) {
      return t('panel.h2VentEmergency');
    }
    return t('panel.h2LiftCritical');
  }

  // §4.2 — power deficit: recommend Solar before anything else
  if (stats.powerNet < 0) {
    if (canAfford(inv, solarCost)) {
      return t('panel.powerDeficitSolar');
    }
    if (iron < solarIron) {
      if (iron >= 1) {
        return t('panel.buildHintNeedFeForSolar');
      }
      const aid = getEarthAidEta(state);
      if (aid.enabled && aid.etaTicks != null) {
        return t('isru.intakeHintFeShortWithAid', { eta: aid.etaTicks });
      }
      return t('isru.intakeHintFeShort');
    }
    return t('panel.powerDeficitSolar');
  }

  // §6.1 / §6.2 — early coaching: Fe → Solar → ISRU (before generic affordable hint)
  if (solarCount === 0) {
    if (iron < solarIron) {
      if (iron >= 1) {
        return t('panel.buildHintNeedFeForSolar');
      }
      const aid = getEarthAidEta(state);
      if (aid.enabled && aid.etaTicks != null) {
        return t('isru.intakeHintFeShortWithAid', { eta: aid.etaTicks });
      }
      return t('isru.intakeHintFeShort');
    }
    if (canAfford(inv, solarCost)) {
      return t('panel.buildHintSolarFirst');
    }
  } else if (isruCount === 0) {
    return t('panel.buildHintIsruNext');
  } else if (electrolyzerCount === 0 && (inv.h2o ?? 0) >= 1) {
    return t('panel.buildHintElectrolyzerOptional');
  }

  // Post-ISRU priority queue (§4.2 / §8.4 / §7.3)
  if (isruCount > 0) {
    const status = state.isruWaitStatus ?? analyzeIsruBottleneck(inv);

    if (status === 'waitingAcid') {
      const intakeHint = getIntakeAccelHint(state);
      if (intakeHint) return intakeHint;
    }

    if ((inv.sulfur ?? 0) >= TRADE_SULFUR_COST) {
      return t('panel.sulfurExportHint');
    }

    if (stats.netLift < 0) {
      const h2Cost = MODULE_TYPES.h2cell.cost;
      if (canAfford(inv, h2Cost)) {
        return t('panel.buildHintH2CellLift');
      }
      const extendHint = getH2ExtendHint(state);
      if (extendHint) return extendHint;
    }

    const extendHint = getH2ExtendHint(state);
    if (extendHint) return extendHint;
  }

  const affordable = BUILD_MODULE_TYPES.some((type) => {
    const cost = MODULE_TYPES[type]?.cost;
    return cost && canAfford(inv, cost);
  });
  if (affordable) return t('panel.buildHint');

  const ironNeed = Math.min(
    ...BUILD_MODULE_TYPES
      .map((type) => MODULE_TYPES[type]?.cost?.iron)
      .filter((n) => n != null),
  );
  if (iron < ironNeed) {
    const aid = getEarthAidEta(state);
    if (aid.enabled && aid.etaTicks != null) {
      return t('isru.intakeHintFeShortWithAid', { eta: aid.etaTicks });
    }
    return t('isru.intakeHintFeShort');
  }

  if (isruCount === 0) {
    const isruCost = MODULE_TYPES.isru.cost;
    if (!canAfford(inv, isruCost)) {
      const missing = getMissingMaterials(inv, isruCost);
      const ids = new Set(missing.map((m) => m.id));
      if (ids.has('sulfur')) return t('isru.intakeHintSulfurShort');
      if (ids.has('carbon')) return t('isru.intakeHintCarbonShort');
    }
    const preview = getBuildPowerPreview(state, 'isru');
    if (preview?.wouldDeficit && solarCount === 0) {
      return t('panel.buildHintShortage');
    }
    if (canAfford(inv, isruCost)) return t('panel.buildHint');
  }

  return t('panel.buildHintShortage');
}

/** Intake build hint when waiting on acid — only if no extra intake exists yet (§6.3 / §6.2 / §8). */
export function getIntakeAccelHint(state) {
  if (countExtraIntakeModules(state.modules) > 0) return null;

  const cost = MODULE_TYPES.intake.cost;
  if (!cost) return null;
  if (canAfford(state.inventory, cost)) {
    return t('isru.intakeHintAffordable');
  }

  const missing = getMissingMaterials(state.inventory, cost);
  if (missing.length === 0) return null;

  const ids = new Set(missing.map((m) => m.id));
  if (ids.has('iron')) {
    const aid = getEarthAidEta(state);
    if (aid.enabled && aid.etaTicks != null) {
      return t('isru.intakeHintFeShortWithAid', { eta: aid.etaTicks });
    }
    return t('isru.intakeHintFeShort');
  }
  if (ids.has('carbon')) return t('isru.intakeHintCarbonShort');
  if (ids.has('sulfur')) return t('isru.intakeHintSulfurShort');
  return null;
}

/** H₂SO₄ display: finer precision below 1 t so HUD matches the acid progress bar (§4.2 / §5.1). */
export function formatH2so4Amount(amount) {
  const n = amount ?? 0;
  if (n < 1) return n.toFixed(3);
  return n.toFixed(1);
}

function processIsru(inventory, isruCount, powerNet, prevWaitStatus) {
  if (isruCount <= 0) {
    return { inventory, events: [], waitStatus: 'noIsru', powerDeficit: false };
  }
  if (powerNet < 0) {
    return { inventory, events: [], waitStatus: 'noPower', powerDeficit: true };
  }

  let inv = { ...inventory };
  const events = [];
  let acidSplits = 0;
  let boschRuns = 0;

  // Per ISRU per tick: try acid split, Bosch, then CO₂ electrolysis
  for (let i = 0; i < isruCount; i++) {
    if (inv.h2so4 >= 1) {
      inv.h2so4 -= 1;
      inv.h2 = (inv.h2 ?? 0) + 2.2;
      inv.sulfur = (inv.sulfur ?? 0) + ACID_SPLIT_S_YIELD;
      inv.h2o = (inv.h2o ?? 0) + 0.4;
      acidSplits++;
      continue;
    }
    const h2Spendable = (inv.h2 ?? 0) - H2_BOSCH_RESERVE;
    if (inv.co2 >= 1 && h2Spendable >= 1) {
      inv.co2 -= 1;
      inv.h2 -= 1;
      inv.carbon = (inv.carbon ?? 0) + 1.0;
      inv.h2o = (inv.h2o ?? 0) + 0.8;
      boschRuns++;
      continue;
    }
    if (inv.co2 >= 1) {
      inv.co2 -= 1;
      inv.o2 = (inv.o2 ?? 0) + O2_ELECTROLYSIS_YIELD;
    }
  }

  const waitStatus = analyzeIsruBottleneck(inv);

  if (acidSplits > 0) {
    events.push(t('msg.isruAcidSplit', { amount: acidSplits }));
  }
  if (boschRuns > 0) {
    events.push(t('msg.isruBosch', { amount: boschRuns }));
  }
  if (waitStatus === 'waitingAcid' && prevWaitStatus !== 'waitingAcid' && prevWaitStatus !== 'noIsru') {
    events.push(t('msg.isruWaitingAcid'));
  }
  if (waitStatus === 'electrolyzing' && prevWaitStatus === 'boschReady') {
    events.push(t('msg.isruH2Reserve'));
  }

  return { inventory: inv, events, waitStatus, powerDeficit: false };
}

/** HUD label for current ISRU bottleneck. */
export function getIsruStatusLabel(state, cachedStats = null) {
  const stats = cachedStats ?? computeStats(state);
  if (stats.isruCount <= 0) return t('isru.status.noIsru');
  if (stats.powerNet < 0) return t('isru.status.noPower');
  const status = state.isruWaitStatus ?? analyzeIsruBottleneck(state.inventory);
  return t(`isru.status.${status}`);
}

/** Secondary ISRU HUD lines (acid progress, intake hint, fallback electrolysis). */
export function getIsruStatusDetail(state, cachedStats = null) {
  const stats = cachedStats ?? computeStats(state);
  if (stats.isruCount <= 0) return null;

  // §4.2 — persistent CTA while power-negative (not only transition toast)
  if (stats.powerNet < 0) {
    return t('panel.powerDeficitSolar');
  }

  const h2so4 = state.inventory.h2so4 ?? 0;
  if (h2so4 >= 1) return null;

  const acid = getAcidWaitInfo(state, stats);
  const lines = [];
  const pct = acid.progress < 0.01
    ? (Math.round(acid.progress * 1000) / 10)
    : Math.round(acid.progress * 100);
  if (acid.etaTicks != null) {
    lines.push(t('isru.acidProgress', { pct, eta: acid.etaTicks }));
  } else {
    lines.push(t('isru.acidProgressNoEta', { pct }));
  }
  const intakeHint = getIntakeAccelHint(state);
  if (intakeHint) lines.push(intakeHint);
  if (acid.fallbackElectrolysis) {
    lines.push(t('isru.fallbackElectrolysis'));
  }
  return lines.join('\n');
}

/** Consume O₂ for CORE life support (§4.2 byproduct sink while crewed). */
function applyO2LifeSupport(inventory, modules) {
  if (!hasCoreModule(modules)) return inventory;
  const o2 = inventory.o2 ?? 0;
  if (o2 <= 0) return inventory;
  const consumed = Math.min(o2, O2_LIFE_SUPPORT_SINK);
  return { ...inventory, o2: o2 - consumed };
}

function applyEarthAid(state, inventory) {
  const nextTick = state.tick + 1;
  if (nextTick % EARTH_AID_INTERVAL !== 0) return { inventory, event: null };

  const amounts = EARTH_AID_AMOUNTS[state.difficulty] ?? EARTH_AID_AMOUNTS.normal;
  if (amounts.h2o === 0 && amounts.iron === 0) {
    return { inventory, event: null };
  }

  const next = { ...inventory };
  next.h2o = (next.h2o ?? 0) + amounts.h2o;
  next.iron = (next.iron ?? 0) + amounts.iron;

  return {
    inventory: next,
    event: t('msg.earthAid', { h2o: amounts.h2o, iron: amounts.iron }),
  };
}

export function gameTick(state) {
  if (state.gameOver) return state;

  const stats = computeStats(state);
  const modules = new Map(state.modules);
  let inventory = { ...state.inventory };
  const events = [];

  // Atmospheric intake (CORE + intake modules)
  if (stats.intakeUnits > 0) {
    inventory = applyIntake(inventory, stats.intakeUnits);
  }

  // Earth periodic aid (separate from paid market)
  const aid = applyEarthAid(state, inventory);
  inventory = aid.inventory;
  if (aid.event) events.push(aid.event);

  // ISRU processing (wind load may reduce effective power — §7.1 / §9)
  const isruResult = processIsru(inventory, stats.isruCount, stats.powerNet, state.isruWaitStatus ?? 'noIsru');
  inventory = isruResult.inventory;
  events.push(...isruResult.events);
  const isruWaitStatus = isruResult.waitStatus;
  if (isruResult.powerDeficit && state.isruWaitStatus !== 'noPower') {
    events.push(t('msg.powerDeficit'));
  }

  // O₂ life-support sink while CORE is operational (§4.2 / §7.1)
  inventory = applyO2LifeSupport(inventory, modules);

  // CORE built-in + module water electrolysis (§4.2 / §5)
  const coreElectro = processCoreElectrolysis(
    inventory,
    modules,
    state.difficulty,
    stats.netBeforeCoreElectrolysis,
  );
  inventory = coreElectro.inventory;
  const moduleElectro = processModuleElectrolysis(
    inventory,
    stats.electrolyzerCount ?? 0,
    stats.powerNet,
  );
  inventory = moduleElectro.inventory;
  if (moduleElectro.runs > 0) {
    events.push(...moduleElectro.events);
  }

  // H₂ leakage from corrosion (§7.1 / §9)
  const h2LeakRate = stats.h2LeakRate;
  const h2Before = inventory.h2 ?? 0;
  inventory = applyH2Leak(inventory, h2LeakRate);
  const h2Leaked = Math.min(h2Before, h2LeakRate);
  if (h2Leaked > 0.001 && !(state.h2LeakWarnActive ?? false)) {
    events.push(t('msg.h2LeakWarn', { rate: h2LeakRate.toFixed(3) }));
  }

  // Wind-load corrosion stress (§7.1 / §9) — toast only on transition into high wind
  const windDamageActive = stats.windLoad > WIND_DAMAGE_THRESHOLD;
  const windCorrosionExtra = windDamageActive ? WIND_EXTRA_CORROSION : 0;
  if (windDamageActive && !(state.windDamageActive ?? false)) {
    events.push(t('msg.windDamage'));
  }

  // Corrosion tick (§9 — S coating slows rise)
  let maintenanceSpent = false;
  const corrodedModules = [...modules.values()]
    .filter((m) => (m.corrosion ?? 0) > CORROSION_MAINTENANCE_THRESHOLD).length;
  const canMaintain = corrodedModules > 0
    && (inventory.sulfur ?? 0) > 1;
  const sUpkeepActive = canMaintain;

  for (const [key, mod] of modules) {
    let rise = CORROSION_RISE + windCorrosionExtra;
    let coatedTicks = mod.coatedTicks ?? 0;

    if (coatedTicks > 0) {
      rise = CORROSION_RISE_COATED;
      coatedTicks -= 1;
    } else if (canMaintain && (mod.corrosion ?? 0) > CORROSION_MAINTENANCE_THRESHOLD) {
      rise = CORROSION_RISE_MAINTAINED;
      if (!maintenanceSpent) {
        inventory = {
          ...inventory,
          sulfur: inventory.sulfur - COATING_MAINTENANCE_S_PER_TICK,
        };
        maintenanceSpent = true;
      }
    }

    const c = Math.min(100, mod.corrosion + rise);
    modules.set(key, { ...mod, corrosion: c, coatedTicks });
  }

  // Wind stress warning — toast only on transition
  const windShearActive = stats.windLoad > 15 && stats.netLift < 10;
  if (windShearActive && !(state.windShearActive ?? false)) {
    events.push(t('msg.windShear'));
  }

  // Corrosion threshold warnings (§9 — coating / S upkeep motivation)
  const corrosionWarnLevel = getCorrosionWarnLevel(modules);
  const prevCorrosionWarn = state.corrosionWarnLevel ?? 0;
  if (corrosionWarnLevel > prevCorrosionWarn) {
    if (corrosionWarnLevel >= 3) {
      events.push(t('msg.corrosionCritical'));
    } else if (corrosionWarnLevel >= 2) {
      events.push(t('msg.corrosionSevere'));
    } else {
      events.push(t('msg.corrosionWarn'));
    }
  }

  // §9 — one-time toast when automatic S upkeep begins (not every tick)
  const prevSUpkeep = state.sUpkeepActive ?? false;
  if (sUpkeepActive && !prevSUpkeep) {
    events.push(t('msg.sUpkeepActive', {
      amount: COATING_MAINTENANCE_S_PER_TICK,
      count: corrodedModules,
    }));
  }

  // Sink countdown — uses post-leak stats (§7.2)
  let sinkCountdown = state.sinkCountdown ?? 0;
  let gameOver = false;
  const postStats = computeStats({ ...state, modules, inventory });

  if (postStats.netLift < 0) {
    sinkCountdown += 1;
    if (sinkCountdown === SINK_WARNING_AT) {
      if (postStats.h2Critical) {
        events.push(t('msg.sinkStartH2'));
      } else {
        events.push(t('msg.sinkStart'));
      }
    } else if (sinkCountdown >= SINK_COUNTDOWN_MAX) {
      gameOver = true;
      events.push(t('msg.sank'));
    }
  } else {
    if (sinkCountdown > 0) {
      events.push(t('msg.buoyancyRecovered'));
    }
    sinkCountdown = 0;
  }

  const h2LeakWarnActive = postStats.h2LeakRate >= 0.05 || postStats.h2Critical;

  return {
    ...state,
    modules,
    inventory,
    tick: state.tick + 1,
    lastEvents: events,
    lastStats: postStats,
    sinkCountdown,
    gameOver,
    isruWaitStatus,
    corrosionWarnLevel,
    sUpkeepActive,
    windDamageActive,
    windShearActive,
    h2LeakWarnActive,
  };
}

/**
 * @param {Difficulty} [difficulty='normal']
 */
export function restartGame(difficulty = 'normal') {
  return createInitialState(difficulty);
}

export { H2_EXTEND_COST, TRADE_SULFUR_COST, COATING_S_COST };
