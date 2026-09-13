import { t } from './i18n.js';

/** Earth micro-contract rotation (tester1 — one active at a time). */
export const EARTH_CONTRACT_ORDER = ['fourModules', 'holdLift', 'acidSplits'];

export const EARTH_CONTRACTS = {
  fourModules: {
    id: 'fourModules',
    /** Net modules added since this contract became active (CORE start = 1 → +3 reaches 4 total). */
    target: 3,
    reward: { iron: 1 },
  },
  holdLift: {
    id: 'holdLift',
    target: 60,
    minNetLift: 8,
    reward: { h2o: 2, iron: 1 },
  },
  acidSplits: {
    id: 'acidSplits',
    target: 3,
    reward: { credits: 6 },
  },
};

/** Contract payout by difficulty (reward tables only — §8.4 / Hard supply coaching). */
const HARD_CONTRACT_REWARD_OVERRIDE = {
  fourModules: { credits: 6 },
  holdLift: { h2o: 3 },
};

export function getEarthContractReward(contractId, difficulty = 'normal') {
  const def = EARTH_CONTRACTS[contractId];
  if (!def) return {};
  if (difficulty === 'hard') {
    const override = HARD_CONTRACT_REWARD_OVERRIDE[contractId];
    if (override) return { ...override };
  }
  return { ...def.reward };
}

/** Net lift below this after placement triggers a build warning toast (still allows build). */
export const BUILD_LIFT_WARN_THRESHOLD = 5;

function contractIndex(id) {
  return EARTH_CONTRACT_ORDER.indexOf(id);
}

export function createInitialEarthContract() {
  const id = EARTH_CONTRACT_ORDER[0];
  return {
    id,
    progress: 0,
    index: 0,
    baselineModules: 1,
    graceTicks: 0,
  };
}

function nextContractState(completedIndex, moduleCount) {
  const nextIndex = (completedIndex + 1) % EARTH_CONTRACT_ORDER.length;
  const id = EARTH_CONTRACT_ORDER[nextIndex];
  return {
    id,
    progress: 0,
    index: nextIndex,
    baselineModules: id === 'fourModules' ? moduleCount : undefined,
    graceTicks: 1,
  };
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
 * @param {{ id: string, progress: number, index: number, baselineModules?: number, graceTicks?: number }} earthContract
 * @returns {{ earthContract, inventory, events: string[] }}
 */
export function tickEarthContracts(state, stats, {
  acidSplitsThisTick = 0,
  moduleCount = 0,
  liftRunwayTicks = null,
} = {}) {
  let earthContract = { ...(state.earthContract ?? createInitialEarthContract()) };
  const def = EARTH_CONTRACTS[earthContract.id];
  if (!def) {
    return { earthContract: createInitialEarthContract(), inventory: state.inventory, events: [] };
  }

  if (earthContract.id === 'fourModules' && earthContract.baselineModules == null) {
    earthContract.baselineModules = moduleCount;
  }

  let graceTicks = earthContract.graceTicks ?? 0;
  const blockCompletion = graceTicks > 0;
  if (blockCompletion) graceTicks -= 1;

  let progress = earthContract.progress ?? 0;
  let inventory = state.inventory;
  const events = [];

  if (earthContract.id === 'holdLift') {
    const runwayPause = liftRunwayTicks != null && liftRunwayTicks <= 30;
    if (!runwayPause && stats.netLift >= def.minNetLift) {
      progress += 1;
    } else if (!runwayPause) {
      progress = 0;
    }
  } else if (earthContract.id === 'acidSplits') {
    progress += acidSplitsThisTick;
  } else if (earthContract.id === 'fourModules') {
    const baseline = earthContract.baselineModules ?? 1;
    progress = Math.max(progress, moduleCount - baseline);
  }

  if (!blockCompletion && progress >= def.target) {
    const reward = getEarthContractReward(earthContract.id, state.difficulty);
    inventory = applyContractReward(inventory, reward);
    events.push(t('msg.contractComplete', {
      title: t(`contract.${earthContract.id}.title`),
      reward: formatReward(reward),
    }));
    const next = nextContractState(
      earthContract.index ?? contractIndex(earthContract.id),
      moduleCount,
    );
    return { earthContract: next, inventory, events };
  }

  return {
    earthContract: { ...earthContract, progress, graceTicks },
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
  let detail;
  if (earthContract.id === 'holdLift') {
    detail = t('contract.holdLift.progress', {
      current: Math.min(progress, def.target),
      target: def.target,
      minLift: def.minNetLift,
      remaining: Math.max(0, def.target - progress),
    });
  } else if (earthContract.id === 'fourModules') {
    detail = t('contract.fourModules.progress', {
      current: Math.min(progress, def.target),
      target: def.target,
      total: (earthContract.baselineModules ?? 1) + def.target,
    });
  } else {
    detail = t(`contract.${earthContract.id}.progress`, {
      current: Math.min(progress, def.target),
      target: def.target,
    });
  }
  const reward = formatReward(getEarthContractReward(earthContract.id, state.difficulty));
  return { title, detail, reward };
}
