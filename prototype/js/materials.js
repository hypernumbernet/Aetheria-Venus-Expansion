/** @typedef {'harvest' | 'process' | 'buy' | 'currency' | 'aid'} ObtainMethod */
import { t } from './i18n.js';

/**
 * @typedef {Object} MaterialDef
 * @property {string} id
 * @property {string} symbol
 * @property {ObtainMethod} obtain
 * @property {boolean} purchasable
 * @property {number} buyPrice
 * @property {boolean} locked
 */

/** @type {Record<string, MaterialDef>} */
export const MATERIALS = {
  co2: {
    id: 'co2',
    symbol: 'CO₂',
    obtain: 'harvest',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  carbon: {
    id: 'carbon',
    symbol: 'C',
    obtain: 'process',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  n2: {
    id: 'n2',
    symbol: 'N₂',
    obtain: 'harvest',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  h2so4: {
    id: 'h2so4',
    symbol: 'H₂SO₄',
    obtain: 'harvest',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  sulfur: {
    id: 'sulfur',
    symbol: 'S',
    obtain: 'process',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  h2: {
    id: 'h2',
    symbol: 'H₂',
    obtain: 'process',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  o2: {
    id: 'o2',
    symbol: 'O₂',
    obtain: 'process',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  h2o: {
    id: 'h2o',
    symbol: 'H₂O',
    obtain: 'buy',
    purchasable: true,
    buyPrice: 5,
    locked: false,
  },
  iron: {
    id: 'iron',
    symbol: 'Fe',
    obtain: 'buy',
    purchasable: true,
    buyPrice: 6,
    locked: false,
  },
  credits: {
    id: 'credits',
    symbol: '₵',
    obtain: 'currency',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
};

/** Active inventory material ids (shown in holdings dialog). */
export const INVENTORY_IDS = [
  'co2', 'carbon', 'n2', 'h2so4', 'sulfur', 'h2', 'o2', 'h2o', 'iron', 'credits',
];

/** All catalog ids. */
export const ALL_MATERIAL_IDS = Object.keys(MATERIALS);

export function getMaterial(id) {
  return MATERIALS[id] ?? null;
}

export function getMaterialName(id) {
  const m = MATERIALS[id];
  if (!m) return id;
  const name = t(`material.${id}.name`);
  return m.symbol ? `${name} (${m.symbol})` : name;
}

/** @deprecated use getMaterialName */
export function formatMaterialName(id) {
  return getMaterialName(id);
}

export function getMaterialDesc(id) {
  return t(`material.${id}.desc`);
}

export function getMaterialObtainLabel(id) {
  return t(`material.${id}.obtain`);
}

export function formatAmount(id, amount) {
  const unitKey = id === 'credits' ? 'cr' : 't';
  const unit = t(`unit.${unitKey}`);
  const decimals = id === 'credits' ? 0 : 1;
  return `${amount.toFixed(decimals)} ${unit}`;
}
