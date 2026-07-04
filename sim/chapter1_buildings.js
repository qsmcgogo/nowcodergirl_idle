/**
 * Chapter 1 building pacing simulator.
 *
 * Run:
 *   node sim/chapter1_buildings.js
 *
 * This is an independent balance script. It does not import browser globals.
 */

const EXAM_COUNT = 5;
const QUESTIONS_PER_EXAM = 20;
const QUESTION_COUNT = EXAM_COUNT * QUESTIONS_PER_EXAM;
const QUESTION_LETTERS = 'ABCDEFGHIJKLMNOPQRST'.split('');
const QUESTION_LABELS = Array.from({ length: QUESTION_COUNT }, (_, i) => getQuestionLabel(i));

const STRATEGIES = {
  baseline: {
    label: 'Baseline / no new buildings',
    buildings: []
  },
  resourceOnly: {
    label: 'Resource buildings only',
    buildings: ['draftDesk', 'quietCorner']
  },
  recoveryAndNotes: {
    label: 'Resource + failure recovery',
    buildings: ['draftDesk', 'quietCorner', 'mistakeNotebook', 'napMat']
  },
  fullChapter1: {
    label: 'Full chapter 1 proposal',
    buildings: ['draftDesk', 'quietCorner', 'mistakeNotebook', 'napMat', 'inspirationLamp', 'autoDrafter', 'memoryShelf', 'examClock'],
    learnGrind: false
  },
  fullWithGrind: {
    label: 'Full + grind mode',
    buildings: ['draftDesk', 'quietCorner', 'mistakeNotebook', 'napMat', 'inspirationLamp', 'autoDrafter', 'memoryShelf', 'examClock'],
    learnGrind: true
  }
};

const PROFILES = {
  casual: {
    label: '佛系玩家',
    manualRetryDelay: 300,
    decisionInterval: 300,
    grindDefeatTrigger: Infinity,
    grindDuration: 0
  },
  normal: {
    label: '普通玩家',
    manualRetryDelay: 90,
    decisionInterval: 60,
    grindDefeatTrigger: 2,
    grindDuration: 60
  },
  hardcore: {
    label: '肝帝玩家',
    manualRetryDelay: 5,
    decisionInterval: 10,
    grindDefeatTrigger: 4,
    grindDuration: 30
  }
};

const REQUESTED_RUNS = [
  { profile: 'casual', strategy: 'fullChapter1' },
  { profile: 'normal', strategy: 'fullWithGrind' },
  { profile: 'hardcore', strategy: 'fullChapter1' }
];

const BUILDINGS = {
  draftDesk: {
    name: '草稿桌',
    unlock: state => state.thinkingEverReached10,
    baseCost: { thinking: 15 },
    costMult: 1.42,
    maxRecommended: 7,
    effect(level) {
      return { autoThinkingRate: 0.08 * level };
    }
  },
  quietCorner: {
    name: '安静角落',
    unlock: state => state.focusEverReached10,
    baseCost: { focus: 12, thinking: 8 },
    costMult: 1.45,
    maxRecommended: 6,
    effect(level) {
      return { autoFocusRate: 0.07 * level };
    }
  },
  mistakeNotebook: {
    name: '错题本',
    unlock: state => state.defeats > 0,
    baseCost: { mistakeNotes: 5, thinking: 10 },
    costMult: 1.5,
    maxRecommended: 5,
    effect(level) {
      return { stuckAtkPercent: 3 * level };
    }
  },
  napMat: {
    name: '小憩垫',
    unlock: state => getUnlockedMap(state) >= 1,
    baseCost: { mistakeNotes: 6, focus: 15 },
    costMult: 1.48,
    maxRecommended: 6,
    effect(level) {
      return { regenFlat: 0.12 * level };
    }
  },
  inspirationLamp: {
    name: '灵感灯',
    unlock: state => getUnlockedMap(state) >= 1 && state.inspiration > 0,
    baseCost: { mistakeNotes: 10, thinking: 20 },
    costMult: 1.55,
    maxRecommended: 3,
    effect(level) {
      return { inspirationDropRateBonus: 0.015 * level };
    }
  },
  autoDrafter: {
    name: '自动草稿机',
    unlock: state => getUnlockedMap(state) >= 2,
    baseCost: { thinking: 30, focus: 30, memoryShards: 2 },
    costMult: 1.6,
    maxRecommended: 3,
    effect(level) {
      return { idleEfficiencyPercent: 5 * level };
    }
  },
  memoryShelf: {
    name: '记忆书架',
    unlock: state => getUnlockedMap(state) >= 3,
    baseCost: { memoryShards: 3, thinking: 30 },
    costMult: 1.7,
    maxRecommended: 4,
    effect(level) {
      return { globalCombatPercent: 1.5 * level };
    }
  },
  examClock: {
    name: '备考时钟',
    unlock: state => getUnlockedMap(state) >= 4,
    baseCost: { memoryShards: 4, focus: 50 },
    costMult: 1.65,
    maxRecommended: 3,
    effect(level) {
      return {
        timeSandPracticeFlat: 2 * level,
        ticketCostReductionPercent: 2 * level
      };
    }
  }
};

function getQuestionLabel(index) {
  const exam = Math.floor(index / QUESTIONS_PER_EXAM) + 1;
  const question = index % QUESTIONS_PER_EXAM;
  return `${exam}${QUESTION_LETTERS[question]}`;
}

function getUnlockedMap(state) {
  return Math.min(EXAM_COUNT - 1, Math.floor(state.completedQuestions / QUESTIONS_PER_EXAM));
}

function getQuestionAttack(index) {
  const exam = Math.floor(index / QUESTIONS_PER_EXAM);
  const question = index % QUESTIONS_PER_EXAM;
  const chapter1Attack = 1 + (9 * question) / 19;
  if (exam === 0) return chapter1Attack;
  return chapter1Attack * Math.pow(1.35, exam) + exam * 2.5;
}

function getQuestionHp(index) {
  const exam = Math.floor(index / QUESTIONS_PER_EXAM);
  const question = index % QUESTIONS_PER_EXAM;
  const chapter1Hp = 5 + (45 * question) / 19;
  if (exam === 0) return chapter1Hp;
  return chapter1Hp * Math.pow(1.5, exam) + exam * 20;
}

function makeState(strategyName, profileName) {
  return {
    strategyName,
    profileName,
    rngSeed: 123456789,
    time: 0,
    thinking: 0,
    focus: 0,
    inspiration: 0,
    reviewTickets: 0,
    draftPaper: 0,
    mistakeNotes: 0,
    memoryShards: 0,
    answerTickets: 0,
    mathLevel: 0,
    grammarLevel: 0,
    thinkingEverReached10: false,
    focusEverReached10: false,
    practiceLearned: false,
    runningLearned: false,
    autoPracticeLearned: false,
    grindModeLearned: false,
    currentActivity: 'thinking',
    hp: 10,
    recovering: false,
    questionHp: Array.from({ length: QUESTION_COUNT }, (_, i) => getQuestionHp(i)),
    completedQuestions: 0,
    defeats: 0,
    recoverySeconds: 0,
    battleSeconds: 0,
    nextManualChallengeAt: 0,
    grindUntil: 0,
    grindRuns: 0,
    grindSeconds: 0,
    grindRewards: {
      draftPaper: 0,
      mistakeNotes: 0
    },
    questionDefeats: Array.from({ length: QUESTION_COUNT }, () => 0),
    farmRepeats: Array.from({ length: QUESTION_COUNT }, () => 0),
    milestones: {},
    buildings: Object.fromEntries(Object.keys(BUILDINGS).map(id => [id, 0])),
    log: []
  };
}

function random(state) {
  state.rngSeed = (1664525 * state.rngSeed + 1013904223) >>> 0;
  return state.rngSeed / 0x100000000;
}

function getBuildingEffect(state) {
  const total = {};
  for (const [id, level] of Object.entries(state.buildings)) {
    if (level <= 0) continue;
    const effect = BUILDINGS[id].effect(level);
    for (const [key, value] of Object.entries(effect)) {
      total[key] = (total[key] || 0) + value;
    }
  }
  return total;
}

function getSkillLevels(state) {
  return {
    math: state.mathLevel,
    grammar: state.grammarLevel
  };
}

function getCombatStats(state) {
  const skill = getSkillLevels(state);
  const effect = getBuildingEffect(state);
  const baseAttack = (1 + skill.math * 0.2) *
    (1 + skill.math * 0.2 + skill.grammar * 0.1) *
    (1 + skill.grammar * 0.1);
  const globalMult = 1 + (effect.globalCombatPercent || 0) / 100;
  const stuckMult = 1 + (effect.stuckAtkPercent || 0) / 100;
  const hp = Math.floor(10 + skill.grammar * 1);
  return {
    attack: baseAttack * globalMult * stuckMult,
    hp: Math.max(1, hp),
    regen: 1 + (effect.regenFlat || 0)
  };
}

function getRates(state) {
  const effect = getBuildingEffect(state);
  const idleMult = 1 + (effect.idleEfficiencyPercent || 0) / 100;
  return {
    thinking: 1 * idleMult,
    focus: 1 * idleMult,
    autoThinking: effect.autoThinkingRate || 0,
    autoFocus: effect.autoFocusRate || 0,
    draftPaper: state.completedQuestions >= 1 ? 0.035 * idleMult : 0
  };
}

function costFor(id, nextLevel) {
  const def = BUILDINGS[id];
  const mult = Math.pow(def.costMult, Math.max(0, nextLevel - 1));
  return Object.fromEntries(
    Object.entries(def.baseCost).map(([resource, amount]) => [resource, Math.ceil(amount * mult)])
  );
}

function canPay(state, cost) {
  return Object.entries(cost).every(([resource, amount]) => state[resource] >= amount);
}

function pay(state, cost) {
  for (const [resource, amount] of Object.entries(cost)) {
    state[resource] -= amount;
  }
}

function maybeBuild(state, strategy) {
  let upgraded = true;
  while (upgraded) {
    upgraded = false;
    for (const id of strategy.buildings) {
      const def = BUILDINGS[id];
      if (!def.unlock(state)) continue;
      const level = state.buildings[id];
      if (level >= def.maxRecommended) continue;
      const cost = costFor(id, level + 1);
      if (!canPay(state, cost)) continue;
      pay(state, cost);
      state.buildings[id] += 1;
      state.log.push(`${fmtTime(state.time)} upgrade ${def.name} -> Lv.${state.buildings[id]}`);
      upgraded = true;
    }
  }
}

function tickResources(state, seconds) {
  const rates = getRates(state);
  state.thinking += rates.autoThinking * seconds;
  state.focus += rates.autoFocus * seconds;
  if (state.thinking >= 10) state.thinkingEverReached10 = true;
  if (state.focus >= 10) state.focusEverReached10 = true;
  if (state.currentActivity === 'thinking') {
    state.thinking += rates.thinking * seconds;
    if (state.thinking >= 10) state.thinkingEverReached10 = true;
  } else if (state.currentActivity === 'focus') {
    state.focus += rates.focus * seconds;
    if (state.focus >= 10) state.focusEverReached10 = true;
  }
  state.draftPaper += rates.draftPaper * seconds;
}

function chooseActivity(state) {
  if (!state.thinkingEverReached10) return 'thinking';
  if (!state.practiceLearned && state.focus < 20) return 'focus';
  if (!state.practiceLearned && state.thinking < 20) return 'thinking';
  if (state.focus < state.thinking * 0.75) return 'focus';
  return 'thinking';
}

function maybeLearnResearch(state) {
  if (!state.practiceLearned && state.thinking >= 20 && state.focus >= 20) {
    state.thinking -= 20;
    state.focus -= 20;
    state.practiceLearned = true;
    state.log.push(`${fmtTime(state.time)} learn practice`);
  }
  if (state.defeats > 0 && !state.runningLearned && state.thinking >= 15 && state.focus >= 15) {
    state.thinking -= 15;
    state.focus -= 15;
    state.runningLearned = true;
    state.log.push(`${fmtTime(state.time)} learn running`);
  }
  if (state.completedQuestions >= 5 && !state.autoPracticeLearned && state.thinking >= 30 && state.focus >= 30) {
    state.thinking -= 30;
    state.focus -= 30;
    state.autoPracticeLearned = true;
    state.log.push(`${fmtTime(state.time)} learn auto practice`);
  }
  if (state.completedQuestions >= 5 && !state.grindModeLearned && state.strategyName === 'fullWithGrind' &&
      state.thinking >= 20 && state.focus >= 20 && state.reviewTickets >= 2) {
    state.thinking -= 20;
    state.focus -= 20;
    state.reviewTickets -= 2;
    state.grindModeLearned = true;
    state.log.push(`${fmtTime(state.time)} learn grind mode`);
  }

  let upgraded = true;
  while (upgraded) {
    upgraded = false;
    const nextMathCost = {
      inspiration: Math.ceil(Math.pow(1.218, state.mathLevel)),
      thinking: Math.ceil(10 * Math.pow(1.218, state.mathLevel))
    };
    const nextGrammarCost = {
      inspiration: Math.ceil(Math.pow(1.218, state.grammarLevel)),
      focus: Math.ceil(10 * Math.pow(1.218, state.grammarLevel))
    };
    const preferMath = state.mathLevel <= state.grammarLevel;
    const order = preferMath ? ['math', 'grammar'] : ['grammar', 'math'];
    for (const type of order) {
      const cost = type === 'math' ? nextMathCost : nextGrammarCost;
      if (!canPay(state, cost)) continue;
      pay(state, cost);
      if (type === 'math') state.mathLevel += 1;
      else state.grammarLevel += 1;
      state.log.push(`${fmtTime(state.time)} upgrade ${type} skill`);
      upgraded = true;
      break;
    }
  }
}

function awardQuestionRewards(state, index) {
  const effect = getBuildingEffect(state);
  const exam = Math.floor(index / QUESTIONS_PER_EXAM);
  const question = index % QUESTIONS_PER_EXAM;
  const dropRate = Math.min(0.75, 0.5 + (effect.inspirationDropRateBonus || 0));
  if (question === 1 || random(state) < dropRate) {
    state.inspiration += 10 * (exam + 1);
  }
  state.draftPaper += 2 + Math.floor(question / 5);
  if ([4, 9, 14, 19].includes(question)) {
    state.memoryShards += question === 19 ? 2 + exam : 1;
    state.reviewTickets += question === 4 && exam === 0 ? 3 : 2;
    if (question === 19) {
      state.answerTickets += 2;
    }
  }
}

function battleOneSecond(state) {
  const index = state.completedQuestions;
  const stats = getCombatStats(state);
  state.battleSeconds += 1;
  state.hp -= getQuestionAttack(index);
  state.questionHp[index] -= stats.attack;
  if (state.questionHp[index] <= 0 && state.hp > 0) {
    state.completedQuestions += 1;
    awardQuestionRewards(state, index);
    const label = QUESTION_LABELS[index];
    state.milestones[label] = state.time;
    state.log.push(`${fmtTime(state.time)} clear ${label}`);
    return;
  }
  if (state.hp <= 0) {
    state.defeats += 1;
    state.questionDefeats[index] += 1;
    state.recovering = true;
    state.mistakeNotes += state.defeats === 1 ? 3 : 1;
    if (random(state) < 0.25 || state.questionDefeats[index] % 3 === 0) {
      state.reviewTickets += 1;
    }
    state.mistakeNotes += Math.floor(index / 5);
    const label = QUESTION_LABELS[index];
    state.log.push(`${fmtTime(state.time)} defeat at ${label}`);
    if (!state.autoPracticeLearned) {
      state.nextManualChallengeAt = state.time + PROFILES[state.profileName].manualRetryDelay;
    }
    const profile = PROFILES[state.profileName];
    if (state.grindModeLearned && index > 0 && state.questionDefeats[index] % profile.grindDefeatTrigger === 0) {
      state.grindUntil = Math.max(state.grindUntil, state.time + profile.grindDuration);
      state.log.push(`${fmtTime(state.time)} switch to grind mode`);
    }
  }
}

function grindOneSecond(state) {
  const target = Math.max(0, state.completedQuestions - 1);
  const stats = getCombatStats(state);
  const qHp = getQuestionHp(target) * 0.6;
  const qAtk = getQuestionAttack(target) * 0.6;
  const rounds = Math.max(1, Math.ceil(qHp / Math.max(0.1, stats.attack)));
  state.grindSeconds += 1;
  if (state.time % rounds !== 0) return;

  state.hp -= qAtk;
  if (state.hp <= 0) {
    state.defeats += 1;
    state.recovering = true;
    state.mistakeNotes += 1;
    state.grindRewards.mistakeNotes += 1;
    return;
  }

  state.grindRuns += 1;
  const repeats = state.farmRepeats[target]++;
  const decay = 1 / Math.sqrt(1 + Math.floor(repeats / 5));
  const draftGain = Math.max(1, Math.floor((1 + Math.floor(target / 5)) * decay));
  state.draftPaper += draftGain;
  state.grindRewards.draftPaper += draftGain;
}

function recoverOneSecond(state) {
  const stats = getCombatStats(state);
  const regen = state.runningLearned && state.focus > 0 ? 3 : stats.regen;
  if (state.runningLearned && state.focus > 0) {
    state.focus = Math.max(0, state.focus - 0.5);
  }
  state.hp = Math.min(stats.hp, state.hp + regen);
  state.recoverySeconds += 1;
  if (state.hp >= stats.hp) {
    state.hp = stats.hp;
    state.recovering = false;
  }
}

function simulate(strategyName, profileName, maxSeconds = 12 * 3600) {
  const strategy = STRATEGIES[strategyName];
  const state = makeState(strategyName, profileName);
  while (state.time < maxSeconds && state.completedQuestions < QUESTION_COUNT) {
    const profile = PROFILES[profileName];
    if (state.time === 0 || state.time % profile.decisionInterval === 0) {
      maybeLearnResearch(state);
      maybeBuild(state, strategy);
      state.currentActivity = chooseActivity(state);
    }

    const stats = getCombatStats(state);
    if (state.hp > stats.hp) state.hp = stats.hp;
    const waitingForManualRetry = state.practiceLearned && !state.autoPracticeLearned &&
      state.time < state.nextManualChallengeAt;
    if (state.recovering || state.hp <= 0) {
      recoverOneSecond(state);
    } else if (state.grindModeLearned && state.time < state.grindUntil && state.completedQuestions > 0) {
      grindOneSecond(state);
    } else if (waitingForManualRetry) {
      tickResources(state, 1);
    } else if (state.practiceLearned) {
      battleOneSecond(state);
    } else {
      tickResources(state, 1);
    }

    if (state.practiceLearned) {
      tickResources(state, 1);
    }
    state.time += 1;
  }
  return state;
}

function fmtTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function summarize(state) {
  const effects = getBuildingEffect(state);
  return {
    strategy: STRATEGIES[state.strategyName].label,
    profile: PROFILES[state.profileName].label,
    totalTime: fmtTime(state.time),
    completedQuestions: state.completedQuestions,
    defeats: state.defeats,
    recoveryTime: fmtTime(state.recoverySeconds),
    battleTime: fmtTime(state.battleSeconds),
    inspiration: Math.floor(state.inspiration),
    skills: {
      math: state.mathLevel,
      grammar: state.grammarLevel
    },
    resources: {
      thinking: Math.floor(state.thinking),
      focus: Math.floor(state.focus),
      draftPaper: Math.floor(state.draftPaper),
      reviewTickets: Math.floor(state.reviewTickets),
      mistakeNotes: Math.floor(state.mistakeNotes),
      memoryShards: Math.floor(state.memoryShards),
      answerTickets: Math.floor(state.answerTickets)
    },
    grind: {
      learned: state.grindModeLearned,
      runs: state.grindRuns,
      time: fmtTime(state.grindSeconds),
      rewards: state.grindRewards
    },
    milestones: Object.fromEntries(
      QUESTION_LABELS.map(label => [label, state.milestones[label] != null ? fmtTime(state.milestones[label]) : '-'])
    ),
    buildings: Object.fromEntries(
      Object.entries(state.buildings)
        .filter(([, level]) => level > 0)
        .map(([id, level]) => [BUILDINGS[id].name, level])
    ),
    effects: Object.fromEntries(
      Object.entries(effects).map(([key, value]) => [key, Number(value.toFixed(3))])
    )
  };
}

function printCostGrowth() {
  console.log('\n=== Cost / effect growth check ===');
  for (const [id, def] of Object.entries(BUILDINGS)) {
    const rows = [1, 5, 10, 20, 40].map(level => {
      const cost = costFor(id, level);
      const effect = def.effect(level);
      return {
        level,
        cost: JSON.stringify(cost),
        effect: Object.fromEntries(
          Object.entries(effect).map(([key, value]) => [key, Number(value.toFixed(3))])
        )
      };
    });
    console.log(`\n${def.name}`);
    console.table(rows);
  }
}

function main() {
  const requestedStates = REQUESTED_RUNS.map(run => simulate(run.strategy, run.profile));
  const results = requestedStates.map(summarize);
  console.log('=== Requested player profiles ===');
  console.table(results.map(row => ({
    profile: row.profile,
    strategy: row.strategy,
    totalTime: row.totalTime,
    defeats: row.defeats,
    recoveryTime: row.recoveryTime,
    grindRuns: row.grind.runs,
    grindTime: row.grind.time,
    buildings: JSON.stringify(row.buildings),
    skills: JSON.stringify(row.skills)
  })));

  console.log('\n=== Map clear time ===');
  console.table(Array.from({ length: EXAM_COUNT }, (_, exam) => {
    const label = `${exam + 1}${QUESTION_LETTERS[QUESTIONS_PER_EXAM - 1]}`;
    const row = { map: `第${exam + 1}图` };
    for (const result of results) {
      row[result.profile] = result.milestones[label] || '-';
    }
    return row;
  }));

  console.log('\n=== Key unlock node clear time ===');
  console.table(Array.from({ length: EXAM_COUNT }, (_, exam) => [0, 4, 9, 14, 19].map(question => {
    const label = `${exam + 1}${QUESTION_LETTERS[question]}`;
    const row = { node: label };
    for (const result of results) {
      row[result.profile] = result.milestones[label] || '-';
    }
    return row;
  })).flat());

  console.log('\n=== First map per-question clear time ===');
  console.table(QUESTION_LABELS.slice(0, QUESTIONS_PER_EXAM).map(label => {
    const row = { question: label };
    for (const result of results) {
      row[result.profile] = result.milestones[label] || '-';
    }
    return row;
  }));

  console.log('\n=== Final resources / buildings ===');
  for (const row of results) {
    console.log(`\n${row.strategy}`);
    console.log('resources:', row.resources);
    console.log('grind:', row.grind);
    console.log('skills:', row.skills);
    console.log('buildings:', row.buildings);
    console.log('effects:', row.effects);
  }

  printCostGrowth();
}

main();
