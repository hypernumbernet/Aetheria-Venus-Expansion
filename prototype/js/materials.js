/** @typedef {'harvest' | 'process' | 'buy' | 'currency' | 'locked'} ObtainMethod */

/**
 * @typedef {Object} MaterialDef
 * @property {string} id
 * @property {string} nameJa
 * @property {string} symbol
 * @property {string} descJa
 * @property {ObtainMethod} obtain
 * @property {string} obtainLabelJa
 * @property {string} unitJa
 * @property {boolean} purchasable
 * @property {number} buyPrice
 * @property {boolean} locked
 */

/** @type {Record<string, MaterialDef>} */
export const MATERIALS = {
  h2so4: {
    id: 'h2so4',
    nameJa: '硫酸',
    symbol: 'H₂SO₄',
    descJa: '大気の硫酸雲から回収。ISRUの原料。',
    obtain: 'harvest',
    obtainLabelJa: '大気回収（ISRU）',
    unitJa: 't',
    purchasable: true,
    buyPrice: 4,
    locked: false,
  },
  h2: {
    id: 'h2',
    nameJa: '水素',
    symbol: 'H₂',
    descJa: '電気分解で生成。浮力ガスとして使用。',
    obtain: 'process',
    obtainLabelJa: '電気分解（ISRU）',
    unitJa: 't',
    purchasable: true,
    buyPrice: 5,
    locked: false,
  },
  sulfur: {
    id: 'sulfur',
    nameJa: '硫黄',
    symbol: 'S',
    descJa: '防食コーティングやモジュール建設に使用。地球へ輸出可。',
    obtain: 'process',
    obtainLabelJa: 'ISRU精製',
    unitJa: 't',
    purchasable: true,
    buyPrice: 3,
    locked: false,
  },
  credits: {
    id: 'credits',
    nameJa: '地球クレジット',
    symbol: '₵',
    descJa: '地球市場での購入通貨。硫黄の輸出で獲得。',
    obtain: 'currency',
    obtainLabelJa: '地球取引',
    unitJa: 'cr',
    purchasable: false,
    buyPrice: 0,
    locked: false,
  },
  carbon: {
    id: 'carbon',
    nameJa: '炭素',
    symbol: 'C',
    descJa: 'CO₂還元による炭素材料。（次スプリントで実装予定）',
    obtain: 'locked',
    obtainLabelJa: '近日実装',
    unitJa: 't',
    purchasable: false,
    buyPrice: 0,
    locked: true,
  },
  iron: {
    id: 'iron',
    nameJa: '鉄',
    symbol: 'Fe',
    descJa: 'モジュールの骨格・接合部に必須。地球市場から調達（地表採掘は今後実装）。',
    obtain: 'buy',
    obtainLabelJa: '地球市場で購入',
    unitJa: 't',
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

export function formatMaterialName(id) {
  const m = MATERIALS[id];
  if (!m) return id;
  return m.symbol ? `${m.nameJa}（${m.symbol}）` : m.nameJa;
}

export function formatAmount(id, amount) {
  const m = MATERIALS[id];
  const unit = m?.unitJa ?? '';
  const decimals = id === 'credits' ? 0 : 1;
  return `${amount.toFixed(decimals)} ${unit}`;
}
