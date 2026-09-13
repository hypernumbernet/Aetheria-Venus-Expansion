import { t } from './i18n.js';

/** Earth micro-contract rotation (tester1 — one active at a time). */
export const EARTH_CONTRACT_ORDER = ['fourModules', 'holdLift', 'acidSplits'];

export const EARTH_CONTRACTS = {
  fourModules: {
    id: 'fourModules',
    target: 4,
    reward: { iron: 1 },
  },
  holdLift: {
    id: 'holdLift',
    target: 60,
    minNetLift: 5,
    reward: { h2o: 2, iron: 1 },
  },
  acidSplits: {
    id: 'acidSplits',
    target: 3,
    reward: { credits: 6 },
  },
};

/** Net lift below this after placement triggers a build warning toast (still allows build). */
export const BUILD_LIFT_WARN_THRESHOLD = 5;

function contractIndex(id) {
  return EARTH_CONTRACT_ORDER.indexOf(id);
}

export function createInitialEarthContract() {
  const id = EARTH_CONTRACT_ORDER[0];
  return { id, progress: 0, index: 0 };
}

function nextContractState(completedIndex) {
  const nextIndex = (completedIndex + 1) % EARTH_CONTRACT_ORDER.length;
  const id = EARTH_CONTRACT_ORDER[nextIndex];
  return { id, progress: 0, index: nextIndex };
}

function applyContractReward(inventory, reward) {
  const next = { ...inventory };
  for (const [key, amount] of Object.entries(reward)) {
    next[key] = (next[key] ?? 0) + amount;
  }
  return next;
}

function formatReward(reward) {
  const parts = [];
  if (reward.h2o) parts.push(t('contract.rewardH2o', { amount: reward.h2o }));
  if (reward.iron) parts.push(t('contract.rewardFe', { amount: reward.iron }));
  if (reward.credits) parts.push(t('contract.rewardCredits', { amount: reward.credits }));
  return parts.join(' · ');
}

/**
 * Advance micro-contract progress after a tick (post-leak stats).
 * @param {{ id: string, progress: number, index: number }} earthContract
 * @returns {{ earthContract, inventory, events: string[], completed: boolean }}
 */
export function tickEarthContracts(state, stats, { acidSplitsThisTick = 0, moduleCount = 0 }) {
  const earthContract = state.earthContract ?? createInitialEarthContract();
  const def = EARTH_CONTRACTS[earthContract.id];
  if (!def) {
    return { earthContract: createInitialEarthContract(), inventory: state.inventory, events: [] };
  }

  let progress = earthContract.progress ?? 0;
  let inventory = state.inventory;
  const events = [];

  if (earthContract.id === 'holdLift') {
    if (stats.netLift >= def.minNetLift) {
      progress += 1;
    } else {
      progress = 0;
    }
  } else if (earthContract.id === 'acidSplits') {
    progress += acidSplitsThisTick;
  } else if (earthContract.id === 'fourModules') {
    progress = Math.max(progress, moduleCount);
  }

  if (progress >= def.target) {
    inventory = applyContractReward(inventory, def.reward);
    events.push(t('msg.contractComplete', {
      title: t(`contract.${earthContract.id}.title`),
      reward: formatReward(def.reward),
    }));
    const next = nextContractState(earthContract.index ?? contractIndex(earthContract.id));
    return { earthContract: next, inventory, events };
  }

  return {
    earthContract: { ...earthContract, progress },
    inventory,
    events,
  };
}

/** HUD line for active Earth micro-contract. */
export function getEarthContractHud(state) {
  const earthContract = state.earthContract ?? createInitialEarthContract();
  const def = EARTH_CONTRACTS[earthContract.id];
  if (!def) return null;

  const progress = earthContract.progress ?? 0;
  const title = t(`contract.${earthContract.id}.title`);
  const detail = t(`contract.${earthContract.id}.progress`, {
    current: Math.min(progress, def.target),
    target: def.target,
  });
  const reward = formatReward(def.reward);
  return { title, detail, reward };
}
