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
    newGame: {
      title: 'New Game',
      intro: 'Choose difficulty. Earth periodic aid (H₂O + Fe) varies by difficulty and is locked for the run.',
      difficulty: 'Difficulty',
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
      easyDesc: 'Aid: +4 H₂O, +2 Fe every 120 ticks',
      normalDesc: 'Aid: +2 H₂O, +1 Fe every 120 ticks',
      hardDesc: 'Aid: none',
      start: 'Start',
    },
    panel: {
      continentStatus: 'Floating Continent Status',
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
      buildHint: 'Click an empty unit adjacent to your floating continent.',
      selectedUnit: 'Selected Unit',
      selectedNone: 'Click a module to select.',
      extendH2: 'Extend H₂ Layer (+buoyancy, +wind)',
      applyCoating: 'Sulfur Coating (1t S, −corrosion)',
      carbonLighten: 'Carbon Composite (−1t C: mass↓, lift↑)',
      tradeEarth: 'Trade with Earth (S → Credits)',
      inventory: 'Inventory & Earth Market',
      tickRate: '1 tick / second',
      difficulty: 'Difficulty',
    },
    footer: 'CORE intakes CO₂ continuously. ISRU: acid split → H₂, Bosch → C, electrolysis → C + O₂. Buy Fe/H₂O from Earth market.',
    inventory: {
      title: 'Inventory & Earth Market',
      intro: 'Construction requires stocked materials. Paid Earth market: Fe and H₂O only (separate from periodic aid).',
      buy: 'Buy ({price}₵)',
      creditsHint: 'Earn by exporting sulfur to Earth',
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
    selected: '{name} at ({coords})\nFloor area: {floorArea}\nH₂ layers: {layers} | Corrosion: {corrosion}%',
    module: {
      core: 'Core Habitat',
      intake: 'Atmospheric Intake',
      isru: 'ISRU Refinery',
      solar: 'Solar Array',
      h2cell: 'H₂ Buoyancy Cell',
    },
    difficulty: {
      easy: 'Easy',
      normal: 'Normal',
      hard: 'Hard',
    },
    material: {
      co2: { name: 'Carbon dioxide', desc: 'Dominant atmospheric gas. Harvested by CORE/intake.', obtain: 'Atmospheric intake (CORE)' },
      carbon: { name: 'Carbon', desc: 'Structural carbon from CO₂ reduction (Bosch, electrolysis).', obtain: 'ISRU processing' },
      n2: { name: 'Nitrogen', desc: 'Secondary atmospheric component.', obtain: 'Atmospheric intake (CORE)' },
      h2so4: { name: 'Sulfuric acid', desc: 'Trace harvest from acid clouds. ISRU feedstock.', obtain: 'Atmospheric intake (CORE)' },
      h2: { name: 'Hydrogen', desc: 'Produced by acid split. Used as lift gas and Bosch input.', obtain: 'ISRU acid split' },
      sulfur: { name: 'Sulfur', desc: 'Coatings and module construction. Exportable to Earth.', obtain: 'ISRU acid split' },
      o2: { name: 'Oxygen', desc: 'Byproduct of CO₂ electrolysis.', obtain: 'ISRU electrolysis' },
      h2o: { name: 'Water', desc: 'Scarce. Periodic Earth aid + market + ISRU recovery.', obtain: 'Earth aid / market / ISRU' },
      iron: { name: 'Iron', desc: 'Required for all module frames. Earth aid + market.', obtain: 'Earth aid / market' },
      credits: { name: 'Earth credits', desc: 'Paid Earth market currency. Earned by exporting sulfur.', obtain: 'Earth trade' },
    },
    unit: { t: 't', cr: 'cr', floorArea: '~100 m²' },
    msg: {
      gameOver: 'Game over. Please restart.',
      unknownMaterial: 'Unknown material.',
      materialLocked: '{name} is not available yet.',
      materialNotBuyable: '{name} cannot be purchased.',
      invalidAmount: 'Invalid quantity.',
      insufficientCredits: 'Insufficient credits (need {need}₵, have {have}₵). Export sulfur to Earth to earn more.',
      bought: 'Bought {name} ×{amount} for {cost}₵.',
      mustBeAdjacent: 'Must build on a unit adjacent to the floating continent.',
      invalidModule: 'Invalid module.',
      insufficientMaterials: 'Insufficient materials: {detail}. Buy from the Earth market in Inventory, or wait for intake.',
      missingEntry: '{name} (need {need}, have {have})',
      built: 'Built {name} (spent {cost})',
      noModuleSelected: 'No module selected.',
      needH2Extend: 'Need {amount}t hydrogen to extend H₂ layer.',
      h2MaxHeight: 'H₂ layer is at maximum height.',
      h2Extended: 'H₂ envelope extended — buoyancy up, wind load up.',
      needSulfurCoating: 'Need {amount}t sulfur for acid-resistant coating.',
      coatingApplied: 'Sulfur coating applied — corrosion reduced, rise slowed.',
      needSulfurTrade: 'Need {amount}t sulfur to trade with Earth.',
      traded: 'Exported sulfur to Earth — +{gain}₵ credits',
      restarted: 'Restarted with a new floating continent.',
      isruProcess: 'ISRU: processed {amount} batch(es)',
      powerDeficit: 'Power deficit — ISRU idle',
      windShear: 'Wind shear warning — reinforce or reduce H₂ height',
      windDamage: 'High wind load — extra corrosion and power drain',
      needCarbonLighten: 'Need {amount}t carbon for composite lightening.',
      carbonLightenMax: 'Carbon lightening is at maximum for this module.',
      carbonLightened: 'Carbon composite applied — mass down, buoyancy up.',
      sinkStart: '⚠ Low buoyancy — the continent is sinking!',
      sinkCountdown: 'Sinking in {remaining} ticks',
      sank: 'The continent sank beneath the clouds…',
      buoyancyRecovered: 'Buoyancy recovered — sink countdown cleared',
      earthAid: 'Earth periodic aid arrived — +{h2o} H₂O, +{iron} Fe',
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
    newGame: {
      title: 'ニューゲーム',
      intro: '難易度を選んでください。地球定期援助（H₂O + Fe）は難易度で決まり、プレイ中は変更できません。',
      difficulty: '難易度',
      easy: 'やさしい',
      normal: 'ふつう',
      hard: 'むずかしい',
      easyDesc: '援助：120ティックごとに H₂O +4、Fe +2',
      normalDesc: '援助：120ティックごとに H₂O +2、Fe +1',
      hardDesc: '援助：なし',
      start: '開始',
    },
    panel: {
      continentStatus: '浮遊大陸ステータス',
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
      buildHint: '浮遊大陸に隣接する空きユニットをクリック。',
      selectedUnit: '選択中のユニット',
      selectedNone: 'モジュールをクリックして選択。',
      extendH2: 'H₂層を延伸（浮力↑・風荷重↑）',
      applyCoating: '硫黄コーティング（S 1t・腐食↓）',
      carbonLighten: '炭素複合材（C 1t：質量↓・浮力↑）',
      tradeEarth: '地球へ輸出（S → クレジット）',
      inventory: '在庫・地球市場',
      tickRate: '1秒 = 1ティック',
      difficulty: '難易度',
    },
    footer: 'コアがCO₂を常時採取。ISRU：硫酸分解→H₂、ボッシュ→C、電解→C+O₂。Fe/H₂Oは地球市場で購入。',
    inventory: {
      title: '在庫・地球市場',
      intro: '建設には在庫の材料が必要です。有料の地球市場では Fe と H₂O のみ購入可能（定期援助とは別）。',
      buy: '購入（{price}₵）',
      creditsHint: '硫黄を地球へ輸出して獲得',
      close: '閉じる',
    },
    gameover: {
      title: '浮遊大陸が沈没しました',
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
    selected: '{name}（{coords}）\n床面積: {floorArea}\nH₂層: {layers} | 腐食: {corrosion}%',
    module: {
      core: 'コア居住域',
      intake: '大気インテーク',
      isru: 'ISRU精製所',
      solar: 'ソーラーアレイ',
      h2cell: 'H₂浮力セル',
    },
    difficulty: {
      easy: 'やさしい',
      normal: 'ふつう',
      hard: 'むずかしい',
    },
    material: {
      co2: { name: '二酸化炭素', desc: '大気の主成分。コア／インテークで常時採取。', obtain: '大気採取（コア）' },
      carbon: { name: '炭素', desc: 'CO₂還元（ボッシュ・電解）で得る構造用炭素。', obtain: 'ISRU加工' },
      n2: { name: '窒素', desc: '大気の二次成分。', obtain: '大気採取（コア）' },
      h2so4: { name: '硫酸', desc: '硫酸雲からの微量回収。ISRUの原料。', obtain: '大気採取（コア）' },
      h2: { name: '水素', desc: '硫酸分解で生成。浮力ガス・ボッシュ原料。', obtain: 'ISRU硫酸分解' },
      sulfur: { name: '硫黄', desc: '防食コーティングやモジュール建設に使用。地球へ輸出可。', obtain: 'ISRU硫酸分解' },
      o2: { name: '酸素', desc: 'CO₂電解の副産物。', obtain: 'ISRU電解' },
      h2o: { name: '水', desc: '希少資源。地球定期援助・市場・ISRU回収。', obtain: '地球援助／市場／ISRU' },
      iron: { name: '鉄', desc: '全モジュール建設に必須。地球援助・市場。', obtain: '地球援助／市場' },
      credits: { name: '地球クレジット', desc: '地球市場での購入通貨。硫黄の輸出で獲得。', obtain: '地球取引' },
    },
    unit: { t: 't', cr: 'cr', floorArea: '約100 m²' },
    msg: {
      gameOver: 'ゲームオーバーです。再起動してください。',
      unknownMaterial: '不明な材料です。',
      materialLocked: '{name}はまだ利用できません。',
      materialNotBuyable: '{name}は購入できません。',
      invalidAmount: '数量が不正です。',
      insufficientCredits: 'クレジット不足（必要 {need}₵、所持 {have}₵）。硫黄を地球へ輸出して稼いでください。',
      bought: '{name} ×{amount} を {cost}₵ で購入しました。',
      mustBeAdjacent: '浮遊大陸に隣接するユニットにのみ建設できます。',
      invalidModule: '無効なモジュールです。',
      insufficientMaterials: '材料不足：{detail}。在庫画面で地球市場から購入するか、採取を待ってください。',
      missingEntry: '{name}（必要 {need}、所持 {have}）',
      built: '{name} を建設しました（{cost} 消費）',
      noModuleSelected: 'モジュールが選択されていません。',
      needH2Extend: 'H₂層の延伸には {amount}t の水素が必要です。',
      h2MaxHeight: 'H₂層は最大高度に達しています。',
      h2Extended: 'H₂エンベロープを延伸 — 浮力↑、風荷重↑',
      needSulfurCoating: '耐酸コーティングには硫黄 {amount}t が必要です。',
      coatingApplied: '硫黄コーティングを適用 — 腐食低下、上昇速度が緩和されます。',
      needSulfurTrade: '地球への輸出には硫黄 {amount}t が必要です。',
      traded: '地球へ硫黄を輸出 — +{gain}₵ クレジット',
      restarted: '新しい浮遊大陸で再開しました。',
      isruProcess: 'ISRU: {amount} バッチ処理',
      powerDeficit: '電力不足 — ISRU停止中',
      windShear: '風切り警告 — 補強するかH₂高度を下げてください',
      windDamage: '風荷重過大 — 腐食上昇・電力消費増',
      needCarbonLighten: '軽量化には炭素 {amount}t が必要です。',
      carbonLightenMax: 'このモジュールの炭素軽量化は上限に達しています。',
      carbonLightened: '炭素複合材を適用 — 質量↓、浮力↑',
      sinkStart: '⚠ 浮力不足 — 浮遊大陸が沈み始めています！',
      sinkCountdown: '沈没まであと {remaining} ティック',
      sank: '浮遊大陸が雲の下へ沈没しました…',
      buoyancyRecovered: '浮力回復 — 沈没カウントダウン解除',
      earthAid: '地球定期援助到着 — H₂O +{h2o}、Fe +{iron}',
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
