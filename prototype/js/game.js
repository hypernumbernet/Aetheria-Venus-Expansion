import { hexKey, getNeighbors } from './hex.js';
import { MATERIALS, INVENTORY_IDS, getMaterialName } from './materials.js';
import { t, costSeparator } from './i18n.js';

export function getModuleName(type) {
  return t(`module.${type}`);
}

/** Per-tick atmospheric intake rates (CORE baseline; intake modules stack). */
export const CORE_INTAKE_RATES = {
  co2: 2.0,
  n2: 0.07,
  h2so4: 0.05,
  h2o: 0.01,
};

export const MODULE_TYPES = {
  core: {
    id: 'core',
    name: 'Core Habitat',
    color: '#f0883e',
    mass: 12,
    baseBuoyancy: 18,
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
    baseBuoyancy: 6,
    powerGen: 0,
    powerUse: 2,
    intake: 1,
    cost: { iron: 2, sulfur: 1 },
    desc: 'Adds CORE-equivalent atmospheric intake.',
  },
  isru: {
    id: 'isru',
    name: 'ISRU Refinery',
    color: '#39d4d4',
    mass: 10,
    baseBuoyancy: 8,
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
    baseBuoyancy: 5,
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
    baseBuoyancy: 14,
    powerGen: 0,
    powerUse: 1,
    intake: 0,
    cost: { iron: 2, h2: 3 },
    desc: 'Stores hydrogen lift gas.',
  },
};

/** @typedef {'easy' | 'normal' | 'hard'} Difficulty */

export const DIFFICULTY_LEVELS = ['easy', 'normal', 'hard'];

export const EARTH_AID_INTERVAL = 120;

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
const TRADE_CREDITS_GAIN = 5;

export const SINK_COUNTDOWN_MAX = 10;
export const SINK_WARNING_AT = 5;

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
  });
  const inventory = createEmptyInventory();
  inventory.h2so4 = 1;
  inventory.sulfur = 1;
  inventory.credits = 20;

  return {
    modules,
    inventory,
    tick: 0,
    difficulty,
    selectedBuild: 'isru',
    selectedHex: null,
    messages: [],
    sinkCountdown: 0,
    gameOver: false,
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
  modules.set(key, { type, h2Layers: 1, corrosion: 0 });
  return {
    ok: true,
    state: {
      ...state,
      modules,
      inventory: payCost(state.inventory, def.cost),
      selectedHex: key,
    },
    message: t('msg.built', { name: getModuleName(type), cost: formatBuildCost(def.cost) }),
  };
}

export function extendH2(state, key) {
  if (state.gameOver) return { ok: false, reason: t('msg.gameOver') };

  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: t('msg.noModuleSelected') };
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

export function computeStats(state) {
  let mass = 0;
  let buoyancy = 0;
  let powerGen = 0;
  let powerUse = 0;
  let intakeUnits = 0;
  let windLoad = 0;
  let corrosion = 0;
  let isruCount = 0;

  for (const mod of state.modules.values()) {
    const def = MODULE_TYPES[mod.type];
    mass += def.mass;
    buoyancy += def.baseBuoyancy + (mod.h2Layers - 1) * H2_EXTEND_BUOYANCY;
    powerGen += def.powerGen;
    powerUse += def.powerUse;
    intakeUnits += def.intake ?? 0;
    windLoad += (mod.h2Layers - 1) * H2_EXTEND_WIND;
    corrosion += mod.corrosion;
    if (mod.type === 'isru') isruCount++;
  }

  const netLift = buoyancy - mass;
  const powerNet = powerGen - powerUse;

  return { mass, buoyancy, netLift, powerGen, powerUse, powerNet, intakeUnits, windLoad, corrosion, isruCount };
}

function applyIntake(inventory, intakeUnits) {
  if (intakeUnits <= 0) return inventory;
  const next = { ...inventory };
  for (const [id, rate] of Object.entries(CORE_INTAKE_RATES)) {
    next[id] = (next[id] ?? 0) + rate * intakeUnits;
  }
  return next;
}

function processIsru(inventory, isruCount, powerNet) {
  if (isruCount <= 0 || powerNet < 0) return { inventory, events: [], powerDeficit: isruCount > 0 && powerNet < 0 };

  let inv = { ...inventory };
  const events = [];
  let processed = 0;

  // Per ISRU per tick: try acid split, Bosch, then CO₂ electrolysis
  for (let i = 0; i < isruCount; i++) {
    // H₂SO₄ → H₂ + S + H₂O
    if (inv.h2so4 >= 1) {
      inv.h2so4 -= 1;
      inv.h2 = (inv.h2 ?? 0) + 1.2;
      inv.sulfur = (inv.sulfur ?? 0) + 0.4;
      inv.h2o = (inv.h2o ?? 0) + 0.4;
      processed++;
      continue;
    }
    // Bosch: CO₂ + 2 H₂ → C + H₂O
    if (inv.co2 >= 1 && inv.h2 >= 2) {
      inv.co2 -= 1;
      inv.h2 -= 2;
      inv.carbon = (inv.carbon ?? 0) + 0.4;
      inv.h2o = (inv.h2o ?? 0) + 0.8;
      processed++;
      continue;
    }
    // CO₂ electrolysis: 2 CO₂ → C + O₂
    if (inv.co2 >= 2) {
      inv.co2 -= 2;
      inv.carbon = (inv.carbon ?? 0) + 0.3;
      inv.o2 = (inv.o2 ?? 0) + 0.6;
      processed++;
    }
  }

  if (processed > 0) {
    events.push(t('msg.isruProcess', { amount: processed }));
  }

  return { inventory: inv, events, powerDeficit: false };
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

  // ISRU processing
  const isruResult = processIsru(inventory, stats.isruCount, stats.powerNet);
  inventory = isruResult.inventory;
  events.push(...isruResult.events);
  if (isruResult.powerDeficit) {
    events.push(t('msg.powerDeficit'));
  }

  // Corrosion tick
  for (const [key, mod] of modules) {
    const c = Math.min(100, mod.corrosion + 0.3);
    modules.set(key, { ...mod, corrosion: c });
  }

  // Wind stress warning
  if (stats.windLoad > 15 && stats.netLift < 10) {
    events.push(t('msg.windShear'));
  }

  // Sink countdown
  let sinkCountdown = state.sinkCountdown ?? 0;
  let gameOver = false;

  if (stats.netLift < 0) {
    sinkCountdown += 1;
    const remaining = SINK_COUNTDOWN_MAX - sinkCountdown;
    if (sinkCountdown === SINK_WARNING_AT) {
      events.push(t('msg.sinkStart'));
    } else if (remaining > 0 && sinkCountdown > SINK_WARNING_AT) {
      events.push(t('msg.sinkCountdown', { remaining }));
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

  return {
    ...state,
    modules,
    inventory,
    tick: state.tick + 1,
    lastEvents: events,
    lastStats: stats,
    sinkCountdown,
    gameOver,
  };
}

/**
 * @param {Difficulty} [difficulty='normal']
 */
export function restartGame(difficulty = 'normal') {
  return createInitialState(difficulty);
}

export { H2_EXTEND_COST, TRADE_SULFUR_COST };
