/** @typedef {'en' | 'ja'} Locale */

export const LOCALE_STORAGE_KEY = 'aetheria-locale';
/** Default locale when nothing is saved (user designs in Japanese). */
export const DEFAULT_LOCALE = 'ja';

/** @type {Locale} */
let locale = loadLocale();

/** @type {Set<(loc: Locale) => void>} */
const listeners = new Set();

function loadLocale() {
  try {
    const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (saved === 'en' || saved === 'ja') return saved;
  } catch {
    /* localStorage unavailable */
  }
  return DEFAULT_LOCALE;
}

if (typeof document !== 'undefined') {
  document.documentElement.lang = locale === 'ja' ? 'ja' : 'en';
}

/** @returns {Locale} */
export function getLocale() {
  return locale;
}

/** @param {Locale} newLocale */
export function setLocale(newLocale) {
  if (newLocale !== 'en' && newLocale !== 'ja') return;
  if (newLocale === locale) return;
  locale = newLocale;
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = newLocale === 'ja' ? 'ja' : 'en';
  }
  for (const fn of listeners) fn(locale);
}

/** @param {(loc: Locale) => void} fn */
export function onLocaleChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * @param {string} key dot-separated path
 * @param {Record<string, string | number>} [params]
 */
export function t(key, params = {}) {
  const parts = key.split('.');
  let node = STRINGS[locale];
  for (const p of parts) {
    node = node?.[p];
  }
  if (typeof node !== 'string') {
    node = STRINGS.en;
    for (const p of parts) {
      node = node?.[p];
    }
  }
  let text = typeof node === 'string' ? node : key;
  for (const [k, v] of Object.entries(params)) {
    text = text.replaceAll(`{${k}}`, String(v));
  }
  return text;
}

/** Cost list separator for build labels. */
export function costSeparator() {
  return locale === 'ja' ? '、' : ', ';
}

const STRINGS = {
  en: {
    subtitle: '2D Browser Prototype — Floating Continent at 50 km',
    settings: {
      title: 'Settings',
      language: 'Language',
      close: 'Close',
      ariaGear: 'Open settings',
    },
    panel: {
      continentStatus: 'Continent Status',
      buoyancy: 'Buoyancy',
      mass: 'Mass',
      netLift: 'Net Lift',
      power: 'Power',
      windLoad: 'Wind Load',
      corrosion: 'Corrosion',
      resources: 'Resources',
      sulfur: 'Sulfur',
      iron: 'Iron',
      earthCredits: 'Earth Credits',
      buildModule: 'Build Module',
      buildHint: 'Click an empty hex adjacent to your continent.',
      selectedHex: 'Selected Hex',
      selectedNone: 'Click a module to select.',
      extendH2: 'Extend H₂ Layer (+buoyancy, +wind)',
      tradeEarth: 'Trade with Earth (S → Credits)',
      inventory: 'Inventory & Earth Market',
      tickRate: '1 tick / second',
    },
    footer: 'ISRU loop: harvest H₂SO₄ → electrolyze to H₂ → extend buoyancy envelope. Buy materials from Earth before building.',
    inventory: {
      title: 'Inventory & Earth Market',
      intro: 'Construction requires stocked materials. Buy from Earth with credits.',
      futureMaterials: 'Coming materials',
      buy: 'Buy ({price}₵)',
      creditsHint: 'Earn by exporting sulfur to Earth',
      comingSoon: 'Coming soon',
      close: 'Close',
    },
    gameover: {
      title: 'Continent Sank',
      body: 'Buoyancy failed — the floating continent slipped beneath the sulfur clouds of Venus.',
      hope: 'This is not the end — revise your design and try again.',
      survivalTicks: 'Survival ticks:',
      restart: 'Restart',
    },
    sink: {
      warning: '⚠ Low buoyancy — sinking in {remaining} ticks',
      caution: 'Negative lift — caution ({remaining} ticks to sink)',
    },
    tick: 'Tick {n}',
    selected: '{name} at ({coords})\nH₂ layers: {layers} | Corrosion: {corrosion}%',
    module: {
      core: 'Core Habitat',
      isru: 'ISRU Refinery',
      solar: 'Solar Array',
      h2cell: 'H₂ Buoyancy Cell',
    },
    material: {
      h2so4: { name: 'Sulfuric acid', desc: 'Harvested from atmospheric acid clouds. ISRU feedstock.', obtain: 'Atmospheric harvest (ISRU)' },
      h2: { name: 'Hydrogen', desc: 'Produced by electrolysis. Used as lift gas.', obtain: 'Electrolysis (ISRU)' },
      sulfur: { name: 'Sulfur', desc: 'Coatings and module construction. Exportable to Earth.', obtain: 'ISRU refining' },
      iron: { name: 'Iron', desc: 'Required for module frames and joints. Earth market supply (surface mining later).', obtain: 'Earth market purchase' },
      credits: { name: 'Earth credits', desc: 'Purchase currency on the Earth market. Earned by exporting sulfur.', obtain: 'Earth trade' },
      carbon: { name: 'Carbon', desc: 'Carbon materials from CO₂ reduction. (Next sprint)', obtain: 'Coming soon' },
    },
    unit: { t: 't', cr: 'cr' },
    msg: {
      gameOver: 'Game over. Please restart.',
      unknownMaterial: 'Unknown material.',
      materialLocked: '{name} is not available yet.',
      materialNotBuyable: '{name} cannot be purchased.',
      invalidAmount: 'Invalid quantity.',
      insufficientCredits: 'Insufficient credits (need {need}₵, have {have}₵). Export sulfur to Earth to earn more.',
      bought: 'Bought {name} ×{amount} for {cost}₵.',
      mustBeAdjacent: 'Must build on a hex adjacent to the continent.',
      invalidModule: 'Invalid module.',
      insufficientMaterials: 'Insufficient materials: {detail}. Buy from the Earth market in Inventory, or wait for ISRU harvest.',
      missingEntry: '{name} (need {need}, have {have})',
      built: 'Built {name} (spent {cost})',
      noModuleSelected: 'No module selected.',
      needH2Extend: 'Need {amount}t hydrogen to extend H₂ layer.',
      h2MaxHeight: 'H₂ layer is at maximum height.',
      h2Extended: 'H₂ envelope extended — buoyancy up, wind load up.',
      needSulfurTrade: 'Need {amount}t sulfur to trade with Earth.',
      traded: 'Exported sulfur to Earth — +{gain}₵ credits',
      restarted: 'Restarted with a new continent.',
      harvest: '+{amount} H₂SO₄ from clouds',
      isruProcess: 'ISRU: {amount} H₂SO₄ → H₂ + S',
      powerDeficit: 'Power deficit — ISRU idle',
      windShear: 'Wind shear warning — reinforce or reduce H₂ height',
      sinkStart: '⚠ Low buoyancy — the continent is sinking!',
      sinkCountdown: 'Sinking in {remaining} ticks',
      sank: 'The continent sank beneath the clouds…',
      buoyancyRecovered: 'Buoyancy recovered — sink countdown cleared',
    },
  },
  ja: {
    subtitle: '2Dブラウザ試作版 — 高度50kmの浮遊大陸',
    settings: {
      title: '設定',
      language: '言語',
      close: '閉じる',
      ariaGear: '設定を開く',
    },
    panel: {
      continentStatus: '大陸ステータス',
      buoyancy: '浮力',
      mass: '質量',
      netLift: '正味浮力',
      power: '電力',
      windLoad: '風荷重',
      corrosion: '腐食',
      resources: '資源',
      sulfur: '硫黄',
      iron: '鉄',
      earthCredits: '地球クレジット',
      buildModule: 'モジュール建設',
      buildHint: '大陸に隣接する空きヘックスをクリック。',
      selectedHex: '選択中のヘックス',
      selectedNone: 'モジュールをクリックして選択。',
      extendH2: 'H₂層を延伸（浮力↑・風荷重↑）',
      tradeEarth: '地球へ輸出（S → クレジット）',
      inventory: '在庫・地球市場',
      tickRate: '1秒 = 1ティック',
    },
    footer: 'ISRUループ：硫酸雲を回収 → 電気分解でH₂ → 浮力エンベロープを延伸。建設前に地球市場で材料を購入。',
    inventory: {
      title: '在庫・地球市場',
      intro: '建設には在庫の材料が必要です。クレジットで地球から購入できます。',
      futureMaterials: '今後の材料',
      buy: '購入（{price}₵）',
      creditsHint: '硫黄を地球へ輸出して獲得',
      comingSoon: '近日実装',
      close: '閉じる',
    },
    gameover: {
      title: '大陸が沈没しました',
      body: '浮力が持たず、浮遊大陸は金星の硫酸雲の下へ消えていきました。',
      hope: 'まだ終わりではありません — 設計を見直して、もう一度挑戦しましょう。',
      survivalTicks: '生存ティック:',
      restart: '再起動',
    },
    sink: {
      warning: '⚠ 浮力不足 — 沈没まで {remaining} ティック',
      caution: '浮力がマイナス — 注意（{remaining} ティックで沈没）',
    },
    tick: 'ティック {n}',
    selected: '{name}（{coords}）\nH₂層: {layers} | 腐食: {corrosion}%',
    module: {
      core: 'コア居住域',
      isru: 'ISRU精製所',
      solar: 'ソーラーアレイ',
      h2cell: 'H₂浮力セル',
    },
    material: {
      h2so4: { name: '硫酸', desc: '大気の硫酸雲から回収。ISRUの原料。', obtain: '大気回収（ISRU）' },
      h2: { name: '水素', desc: '電気分解で生成。浮力ガスとして使用。', obtain: '電気分解（ISRU）' },
      sulfur: { name: '硫黄', desc: '防食コーティングやモジュール建設に使用。地球へ輸出可。', obtain: 'ISRU精製' },
      iron: { name: '鉄', desc: 'モジュールの骨格・接合部に必須。地球市場から調達（地表採掘は今後実装）。', obtain: '地球市場で購入' },
      credits: { name: '地球クレジット', desc: '地球市場での購入通貨。硫黄の輸出で獲得。', obtain: '地球取引' },
      carbon: { name: '炭素', desc: 'CO₂還元による炭素材料。（次スプリントで実装予定）', obtain: '近日実装' },
    },
    unit: { t: 't', cr: 'cr' },
    msg: {
      gameOver: 'ゲームオーバーです。再起動してください。',
      unknownMaterial: '不明な材料です。',
      materialLocked: '{name}はまだ利用できません。',
      materialNotBuyable: '{name}は購入できません。',
      invalidAmount: '数量が不正です。',
      insufficientCredits: 'クレジット不足（必要 {need}₵、所持 {have}₵）。硫黄を地球へ輸出して稼いでください。',
      bought: '{name} ×{amount} を {cost}₵ で購入しました。',
      mustBeAdjacent: '大陸に隣接するヘックスにのみ建設できます。',
      invalidModule: '無効なモジュールです。',
      insufficientMaterials: '材料不足：{detail}。在庫画面で地球市場から購入するか、ISRUの収穫を待ってください。',
      missingEntry: '{name}（必要 {need}、所持 {have}）',
      built: '{name} を建設しました（{cost} 消費）',
      noModuleSelected: 'モジュールが選択されていません。',
      needH2Extend: 'H₂層の延伸には {amount}t の水素が必要です。',
      h2MaxHeight: 'H₂層は最大高度に達しています。',
      h2Extended: 'H₂エンベロープを延伸 — 浮力↑、風荷重↑',
      needSulfurTrade: '地球への輸出には硫黄 {amount}t が必要です。',
      traded: '地球へ硫黄を輸出 — +{gain}₵ クレジット',
      restarted: '新しい大陸で再開しました。',
      harvest: '雲から +{amount} H₂SO₄',
      isruProcess: 'ISRU: {amount} H₂SO₄ → H₂ + S',
      powerDeficit: '電力不足 — ISRU停止中',
      windShear: '風切り警告 — 補強するかH₂高度を下げてください',
      sinkStart: '⚠ 浮力不足 — 大陸が沈み始めています！',
      sinkCountdown: '沈没まであと {remaining} ティック',
      sank: '大陸が雲の下へ沈没しました…',
      buoyancyRecovered: '浮力回復 — 沈没カウントダウン解除',
    },
  },
};

/** Apply static [data-i18n] text from the current locale. */
export function applyStaticI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) el.textContent = t(key);
  });
  root.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) el.setAttribute('aria-label', t(key));
  });
}
