/**
 * 牛客娘挂机游戏 - 第一章建筑与刷题资源
 */

const Buildings = {
  draftPaper: 0,
  mistakeNotes: 0,
  reviewTickets: 0,
  grindModeUnlocked: false,
  grindModeLearned: false,
  mode: 'push',

  levels: {
    draftDesk: 0,
    quietCorner: 0,
    mistakeNotebook: 0,
    napMat: 0,
    inspirationLamp: 0,
    autoDrafter: 0,
    memoryShelf: 0,
    examClock: 0
  },

  defs: {
    draftDesk: {
      name: '草稿桌',
      unlock: () => Resources.focusEverUnlocked || Resources.thinkingPower >= 10,
      costMult: 1.42,
      baseCost: { thinking: 15 },
      desc: '自动收集思维力，不提升主动收集效率。',
      effectText: level => `思维力自动 +${(0.08 * level).toFixed(2)}/s`
    },
    quietCorner: {
      name: '安静角落',
      unlock: () => Resources.isFocusUnlocked(),
      costMult: 1.45,
      baseCost: { focus: 12, thinking: 8 },
      desc: '自动收集专注力，补齐第二基础资源。',
      effectText: level => `专注力自动 +${(0.07 * level).toFixed(2)}/s`
    },
    mistakeNotebook: {
      name: '错题本',
      unlock: () => Battle.hasDefeatedOnce,
      costMult: 1.5,
      baseCost: { mistakeNotes: 5, thinking: 10 },
      desc: '当前题卡住时提供局部攻击补偿。',
      effectText: level => `当前题攻击 +${3 * level}%`
    },
    napMat: {
      name: '小憩垫',
      unlock: () => Exam.unlockedExamIndex >= 1,
      costMult: 1.48,
      baseCost: { mistakeNotes: 6, focus: 15 },
      desc: '提高非跑步恢复速度。',
      effectText: level => `恢复速度 +${(0.12 * level).toFixed(2)}/s`
    },
    inspirationLamp: {
      name: '灵感灯',
      unlock: () => Exam.unlockedExamIndex >= 1 && Resources.inspirationEverDropped,
      costMult: 1.55,
      baseCost: { mistakeNotes: 10, thinking: 20 },
      desc: '略微稳定灵感掉落，不消耗灵感。',
      effectText: level => `灵感掉率 +${(1.5 * level).toFixed(1)}%`
    },
    autoDrafter: {
      name: '自动草稿机',
      unlock: () => Exam.unlockedExamIndex >= 2,
      costMult: 1.6,
      baseCost: { thinking: 30, focus: 30, memoryShards: 2 },
      desc: '提升快进和离线时的主线结算效率。',
      effectText: level => `快进效率 +${5 * level}%`
    },
    memoryShelf: {
      name: '记忆书架',
      unlock: () => Exam.unlockedExamIndex >= 3,
      costMult: 1.7,
      baseCost: { memoryShards: 3, thinking: 30 },
      desc: '记录章节进度，提供少量全局攻血。',
      effectText: level => `攻击/血量 +${(1.5 * level).toFixed(1)}%`
    },
    examClock: {
      name: '备考时钟',
      unlock: () => Exam.unlockedExamIndex >= 4,
      costMult: 1.65,
      baseCost: { memoryShards: 4, focus: 50 },
      desc: '为数学训练预备时间之砂收益。',
      effectText: level => `练习时间之砂 +${2 * level}`
    }
  },

  init() {
    this.refreshUnlocks();
  },

  reset() {
    this.draftPaper = 0;
    this.mistakeNotes = 0;
    this.reviewTickets = 0;
    this.grindModeUnlocked = false;
    this.grindModeLearned = false;
    this.mode = 'push';
    Object.keys(this.levels).forEach((id) => { this.levels[id] = 0; });
  },

  refreshUnlocks() {
    if (Exam.completed[0]?.[4]) this.grindModeUnlocked = true;
  },

  getUnlockedIds() {
    return Object.keys(this.defs).filter((id) => this.defs[id].unlock());
  },

  isUnlocked() {
    return this.getUnlockedIds().length > 0 || this.draftPaper > 0 ||
      this.mistakeNotes > 0 || this.reviewTickets > 0;
  },

  getCost(id) {
    const def = this.defs[id];
    if (!def) return {};
    const nextLevel = (this.levels[id] || 0) + 1;
    const mult = Math.pow(def.costMult, nextLevel - 1);
    return Object.fromEntries(
      Object.entries(def.baseCost).map(([key, amount]) => [key, Math.ceil(amount * mult)])
    );
  },

  getResource(key) {
    if (key === 'thinking') return Resources.thinkingPower;
    if (key === 'focus') return Resources.focusPower;
    if (key === 'draftPaper') return this.draftPaper;
    if (key === 'mistakeNotes') return this.mistakeNotes;
    if (key === 'reviewTickets') return this.reviewTickets;
    if (key === 'memoryShards') return this.memoryShards || 0;
    return 0;
  },

  spendCost(cost) {
    Object.entries(cost).forEach(([key, amount]) => {
      if (key === 'thinking') Resources.thinkingPower -= amount;
      else if (key === 'focus') Resources.focusPower -= amount;
      else if (key === 'draftPaper') this.draftPaper -= amount;
      else if (key === 'mistakeNotes') this.mistakeNotes -= amount;
      else if (key === 'reviewTickets') this.reviewTickets -= amount;
      else if (key === 'memoryShards') this.memoryShards = Math.max(0, (this.memoryShards || 0) - amount);
    });
  },

  canAfford(cost) {
    return Object.entries(cost).every(([key, amount]) => this.getResource(key) >= amount);
  },

  upgrade(id) {
    const def = this.defs[id];
    if (!def || !def.unlock()) return false;
    const cost = this.getCost(id);
    if (!this.canAfford(cost)) return false;
    this.spendCost(cost);
    this.levels[id] += 1;
    return true;
  },

  learnGrindMode() {
    const cost = { thinking: 20, focus: 20, reviewTickets: 2 };
    if (!this.grindModeUnlocked || this.grindModeLearned || !this.canAfford(cost)) return false;
    this.spendCost(cost);
    this.grindModeLearned = true;
    this.mode = 'grind';
    return true;
  },

  addDraftPaper(amount) {
    this.draftPaper += Math.max(0, Math.floor(Number(amount) || 0));
  },

  addMistakeNotes(amount) {
    this.mistakeNotes += Math.max(0, Math.floor(Number(amount) || 0));
  },

  addReviewTickets(amount) {
    this.reviewTickets += Math.max(0, Math.floor(Number(amount) || 0));
  },

  addMemoryShards(amount) {
    this.memoryShards = (this.memoryShards || 0) + Math.max(0, Math.floor(Number(amount) || 0));
  },

  getBonuses() {
    return {
      autoThinkingRate: this.levels.draftDesk * 0.08,
      autoFocusRate: this.levels.quietCorner * 0.07,
      retryAtkPercent: this.levels.mistakeNotebook * 3,
      regenFlat: this.levels.napMat * 0.12,
      inspirationDropRateBonus: this.levels.inspirationLamp * 0.015,
      globalCombatPercent: this.levels.memoryShelf * 1.5,
      timeSandPracticeFlat: this.levels.examClock * 2
    };
  },

  getSnapshot() {
    return {
      draftPaper: this.draftPaper,
      mistakeNotes: this.mistakeNotes,
      reviewTickets: this.reviewTickets,
      memoryShards: this.memoryShards || 0,
      grindModeUnlocked: this.grindModeUnlocked,
      grindModeLearned: this.grindModeLearned,
      mode: this.mode,
      levels: { ...this.levels }
    };
  },

  loadSnapshot(snapshot) {
    this.reset();
    if (!snapshot) return;
    this.draftPaper = snapshot.draftPaper ?? 0;
    this.mistakeNotes = snapshot.mistakeNotes ?? 0;
    this.reviewTickets = snapshot.reviewTickets ?? 0;
    this.memoryShards = snapshot.memoryShards ?? 0;
    this.grindModeUnlocked = snapshot.grindModeUnlocked ?? false;
    this.grindModeLearned = snapshot.grindModeLearned ?? false;
    this.mode = snapshot.mode ?? 'push';
    Object.keys(this.levels).forEach((id) => {
      this.levels[id] = snapshot.levels?.[id] ?? 0;
    });
    this.refreshUnlocks();
  }
};
