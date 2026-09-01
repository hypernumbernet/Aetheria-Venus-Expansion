import { hexKey, getNeighbors } from './hex.js';

export const MODULE_TYPES = {
  core: {
    id: 'core',
    name: 'Core Habitat',
    color: '#f0883e',
    mass: 12,
    baseBuoyancy: 18,
    powerGen: 0,
    powerUse: 3,
    harvest: 0,
    cost: null,
    desc: 'Command module. Starting point.',
  },
  isru: {
    id: 'isru',
    name: 'ISRU Refinery',
    color: '#39d4d4',
    mass: 10,
    baseBuoyancy: 8,
    powerGen: 0,
    powerUse: 8,
    harvest: 3,
    cost: { h2so4: 2, sulfur: 1 },
    desc: 'Harvests & processes H₂SO₄ → H₂ + S.',
  },
  solar: {
    id: 'solar',
    name: 'Solar Array',
    color: '#d29922',
    mass: 6,
    baseBuoyancy: 5,
    powerGen: 15,
    powerUse: 0,
    harvest: 0,
    cost: { sulfur: 2, h2: 1 },
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
    harvest: 0,
    cost: { h2: 4, sulfur: 1 },
    desc: 'Stores hydrogen lift gas.',
  },
};

const H2_EXTEND_COST = 3;
const H2_EXTEND_BUOYANCY = 8;
const H2_EXTEND_WIND = 4;
const TRADE_SULFUR_COST = 2;
const TRADE_CREDITS_GAIN = 5;

export function createInitialState() {
  const modules = new Map();
  modules.set(hexKey(0, 0), {
    type: 'core',
    h2Layers: 1,
    corrosion: 0,
  });
  return {
    modules,
    resources: { h2so4: 6, h2: 4, sulfur: 3, credits: 10 },
    tick: 0,
    selectedBuild: 'isru',
    selectedHex: null,
    messages: [],
  };
}

export function canAfford(resources, cost) {
  if (!cost) return true;
  return Object.entries(cost).every(([k, v]) => (resources[k] ?? 0) >= v);
}

export function payCost(resources, cost) {
  const next = { ...resources };
  for (const [k, v] of Object.entries(cost)) {
    next[k] = (next[k] ?? 0) - v;
  }
  return next;
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
  const key = hexKey(q, r);
  const placeable = getPlaceableHexes(state);
  if (!placeable.has(key)) return { ok: false, reason: 'Must be adjacent to continent.' };

  const type = state.selectedBuild;
  const def = MODULE_TYPES[type];
  if (!def || !def.cost) return { ok: false, reason: 'Invalid module.' };
  if (!canAfford(state.resources, def.cost)) {
    return { ok: false, reason: 'Insufficient resources.' };
  }

  const modules = new Map(state.modules);
  modules.set(key, { type, h2Layers: 1, corrosion: 0 });
  return {
    ok: true,
    state: {
      ...state,
      modules,
      resources: payCost(state.resources, def.cost),
      selectedHex: key,
    },
    message: `Built ${def.name}`,
  };
}

export function extendH2(state, key) {
  const mod = state.modules.get(key);
  if (!mod) return { ok: false, reason: 'No module selected.' };
  if (state.resources.h2 < H2_EXTEND_COST) {
    return { ok: false, reason: 'Need 3 H₂ to extend envelope.' };
  }
  if (mod.h2Layers >= 4) {
    return { ok: false, reason: 'Max H₂ layer height reached.' };
  }

  const modules = new Map(state.modules);
  modules.set(key, { ...mod, h2Layers: mod.h2Layers + 1 });
  return {
    ok: true,
    state: {
      ...state,
      modules,
      resources: { ...state.resources, h2: state.resources.h2 - H2_EXTEND_COST },
    },
    message: 'H₂ envelope extended — buoyancy up, wind load up.',
  };
}

export function tradeWithEarth(state) {
  if (state.resources.sulfur < TRADE_SULFUR_COST) {
    return { ok: false, reason: 'Need 2 Sulfur to trade.' };
  }
  return {
    ok: true,
    state: {
      ...state,
      resources: {
        ...state.resources,
        sulfur: state.resources.sulfur - TRADE_SULFUR_COST,
        credits: state.resources.credits + TRADE_CREDITS_GAIN,
      },
    },
    message: 'Earth trade complete — research credits received.',
  };
}

export function computeStats(state) {
  let mass = 0;
  let buoyancy = 0;
  let powerGen = 0;
  let powerUse = 0;
  let harvest = 0;
  let windLoad = 0;
  let corrosion = 0;
  let isruCount = 0;

  for (const mod of state.modules.values()) {
    const def = MODULE_TYPES[mod.type];
    mass += def.mass;
    buoyancy += def.baseBuoyancy + (mod.h2Layers - 1) * H2_EXTEND_BUOYANCY;
    powerGen += def.powerGen;
    powerUse += def.powerUse;
    harvest += def.harvest;
    windLoad += (mod.h2Layers - 1) * H2_EXTEND_WIND;
    corrosion += mod.corrosion;
    if (mod.type === 'isru') isruCount++;
  }

  const netLift = buoyancy - mass;
  const powerNet = powerGen - powerUse;

  return { mass, buoyancy, netLift, powerGen, powerUse, powerNet, harvest, windLoad, corrosion, isruCount };
}

export function gameTick(state) {
  const stats = computeStats(state);
  const modules = new Map(state.modules);
  let resources = { ...state.resources };
  const events = [];

  // Atmospheric harvest
  const harvested = stats.harvest;
  if (harvested > 0) {
    resources.h2so4 += harvested;
    events.push(`+${harvested} H₂SO₄ from clouds`);
  }

  // ISRU processing: H₂SO₄ → H₂ + S (needs power)
  const canProcess = stats.powerNet >= 0 && resources.h2so4 >= 1 && stats.isruCount > 0;
  let processed = 0;
  if (canProcess) {
    const maxProcess = Math.min(resources.h2so4, stats.isruCount * 2);
    processed = maxProcess;
    resources.h2so4 -= processed;
    resources.h2 += processed * 1.5;
    resources.sulfur += processed * 0.5;
    events.push(`ISRU: ${processed} H₂SO₄ → H₂ + S`);
  } else if (stats.isruCount > 0 && resources.h2so4 >= 1 && stats.powerNet < 0) {
    events.push('Power deficit — ISRU idle');
  }

  // Corrosion tick
  for (const [key, mod] of modules) {
    const c = Math.min(100, mod.corrosion + 0.3);
    modules.set(key, { ...mod, corrosion: c });
  }

  // Wind stress warning
  if (stats.windLoad > 15 && stats.netLift < 10) {
    events.push('Wind shear warning — reinforce or reduce H₂ height');
  }

  // Buoyancy crisis
  if (stats.netLift < 0) {
    events.push('Negative buoyancy — add H₂ cells or extend envelope!');
  }

  return {
    ...state,
    modules,
    resources,
    tick: state.tick + 1,
    lastEvents: events,
    lastStats: stats,
  };
}

export { H2_EXTEND_COST, TRADE_SULFUR_COST };
