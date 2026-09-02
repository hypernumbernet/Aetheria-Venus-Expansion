/** @typedef {'harvest' | 'process' | 'buy' | 'currency' | 'locked'} ObtainMethod */
import { getLocale, t } from './i18n.js';

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
  h2so4: {
    id: 'h2so4',
    symbol: 'H₂SO₄',
    obtain: 'harvest',
    purchasable: true,
    buyPrice: 4,
    locked: false,
  },
  h2: {
    id: 'h2',
    symbol: 'H₂',
    obtain: 'process',
    purchasable: true,
    buyPrice: 5,
    locked: false,
  },
  sulfur: {
    id: 'sulfur',
    symbol: 'S',
    obtain: 'process',
    purchasable: true,
    buyPrice: 3,
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
  carbon: {
    id: 'carbon',
    symbol: 'C',
    obtain: 'locked',
    purchasable: false,
    buyPrice: 0,
    locked: true,
  },
  iron: {
    id: 'iron',
    symbol: 'Fe',
    obtain: 'buy',
    purchasable: true,
    buyPrice: 6,
    locked: false,
  },
};

/** Active inventory material ids (shown in holdings dialog). */
export const INVENTORY_IDS = ['h2so4', 'h2', 'sulfur', 'iron', 'credits'];

/** All catalog ids including locked stubs. */
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
  const m = MATERIALS[id];
  const unitKey = id === 'credits' ? 'cr' : 't';
  const unit = t(`unit.${unitKey}`);
  const decimals = id === 'credits' ? 0 : 1;
  return `${amount.toFixed(decimals)} ${unit}`;
}
