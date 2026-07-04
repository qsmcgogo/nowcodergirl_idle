/**
 * 牛客娘挂机游戏 - 成就系统
 */

const AchievementCategories = {
  map: '推图',
  challenge: '关卡',
  skilltree: '技能树',
  other: '其他',
  cards: '卡片',
  easter: '彩蛋'
};

const AchievementDefs = [
  { id: 'map_clear_1', category: 'map', title: '微光', desc: '通关主线第 1 图。', points: 1, chain: 'map_clear', order: 1, condition: () => Achievements.getClearedMapCount() >= 1 },
  { id: 'map_clear_2', category: 'map', title: '第二步', desc: '通关主线第 2 图。', points: 1, chain: 'map_clear', order: 2, condition: () => Achievements.getClearedMapCount() >= 2 },
  { id: 'map_clear_3', category: 'map', title: '三点成线', desc: '通关主线第 3 图。', points: 1, chain: 'map_clear', order: 3, condition: () => Achievements.getClearedMapCount() >= 3 },
  { id: 'map_clear_5', category: 'map', title: '小径成章', desc: '通关主线第 5 图。', points: 1, chain: 'map_clear', order: 5, condition: () => Achievements.getClearedMapCount() >= 5 },
  { id: 'map_clear_10', category: 'map', title: '十图远行', desc: '通关主线第 10 图。', points: 2, chain: 'map_clear', order: 10, condition: () => Achievements.getClearedMapCount() >= 10 },
  { id: 'map_clear_20', category: 'map', title: '二十连峰', desc: '通关主线第 20 图。', points: 2, chain: 'map_clear', order: 20, condition: () => Achievements.getClearedMapCount() >= 20 },
  { id: 'map_clear_30', category: 'map', title: '长风三十', desc: '通关主线第 30 图。', points: 3, chain: 'map_clear', order: 30, condition: () => Achievements.getClearedMapCount() >= 30 },
  { id: 'map_clear_50', category: 'map', title: '半百征途', desc: '通关主线第 50 图。', points: 5, chain: 'map_clear', order: 50, condition: () => Achievements.getClearedMapCount() >= 50 },
  { id: 'map_clear_100', category: 'map', title: '百图之证', desc: '通关主线第 100 图。', points: 10, chain: 'map_clear', order: 100, condition: () => Achievements.getClearedMapCount() >= 100 },

  { id: 'challenge_math_first', category: 'challenge', feature: 'math', title: '算式初醒', desc: '完成一次数学练习。', points: 1, chain: 'challenge_math', order: 1, condition: () => false },
  { id: 'challenge_math_f_exam', category: 'challenge', feature: 'math', title: 'F 级小测', desc: '通过数学 F 级考试。', points: 1, chain: 'challenge_math', order: 2, condition: () => false },
  { id: 'challenge_math_a_rank', category: 'challenge', feature: 'math', title: '心算如流', desc: '数学等级达到 A。', points: 2, chain: 'challenge_math', order: 3, condition: () => false },
  { id: 'challenge_chinese_first', category: 'challenge', feature: 'chinese', title: '字句初鸣', desc: '完成一次语文练习。', points: 1, chain: 'challenge_chinese', order: 1, condition: () => false },

  { id: 'skill_grammar_1', category: 'skilltree', title: '语法萌芽', desc: '语法技能达到 1 级。', points: 1, chain: 'skill_grammar', order: 1, condition: () => SkillTree.grammarLevel >= 1 },
  { id: 'skill_math_1', category: 'skilltree', title: '数学萌芽', desc: '数学技能达到 1 级。', points: 1, chain: 'skill_math', order: 1, condition: () => SkillTree.mathLevel >= 1 },
  { id: 'skill_total_10', category: 'skilltree', title: '枝叶初展', desc: '技能树总等级达到 10。', points: 2, chain: 'skill_total', order: 1, condition: () => SkillTree.getTotalLevel() >= 10 },
  { id: 'skill_total_30', category: 'skilltree', title: '根系成林', desc: '技能树总等级达到 30。', points: 3, chain: 'skill_total', order: 2, condition: () => SkillTree.getTotalLevel() >= 30 },

  { id: 'cards_first', category: 'cards', title: '第一张记忆', desc: '获得第一张卡片。', points: 1, chain: 'cards', order: 1, condition: () => Cards.owned.length >= 1 },
  { id: 'cards_equip_first', category: 'cards', title: '卡槽初鸣', desc: '装入第一张卡片。', points: 1, chain: 'cards', order: 2, condition: () => Cards.slots.some(Boolean) },
  { id: 'cards_merge_first', category: 'cards', title: '三合一', desc: '拥有任意 2 级卡片。', points: 1, chain: 'cards', order: 3, condition: () => Cards.owned.some(c => Cards.getHighestLevel(c.defId) >= 2) },
  { id: 'cards_collector_10', category: 'cards', title: '小小收藏家', desc: '累计拥有 10 张卡片。', points: 2, chain: 'cards', order: 4, condition: () => Cards.owned.reduce((sum, c) => sum + c.stacks.reduce((s, n) => s + n, 0), 0) >= 10 },

  { id: 'other_time_sand_1', category: 'other', title: '砂砾入掌', desc: '首次获得时间之砂。', points: 1, chain: 'other_time_sand', order: 1, condition: () => Resources.timeSand > 0 },
  { id: 'other_fast_forward_1', category: 'other', title: '拨快指针', desc: '完成一次全局快进。', points: 1, chain: 'other_fast_forward', order: 1, condition: () => Achievements.stats.fastForwardCount >= 1 },
  { id: 'other_ticket_1', category: 'other', title: '入场券', desc: '拥有第一张答题券。', points: 1, chain: 'other_ticket', order: 1, condition: () => Resources.answerTickets >= 1 },
  { id: 'other_save_1', category: 'other', title: '存档意识', desc: '导出或手动保存一次存档。', points: 1, chain: 'other_save', order: 1, condition: () => Achievements.stats.manualSaveCount >= 1 },

  { id: 'egg_late_night', category: 'easter', title: '深夜刷题', desc: '在很晚的时候继续陪牛客娘学习。', points: 1, secret: true, condition: () => false },
  { id: 'egg_empty_click', category: 'easter', title: '空气练习', desc: '在某个空白处反复点击。', points: 1, secret: true, condition: () => false },
  { id: 'egg_clock_watch', category: 'easter', title: '盯着指针的人', desc: '看完一次完整的快进钟表演出。', points: 1, secret: true, condition: () => false }
];

const Achievements = {
  achieved: {},
  discoveredSecrets: {},
  onUnlock: null,
  stats: {
    fastForwardCount: 0,
    manualSaveCount: 0
  },

  init() {
    this.achieved = {};
    this.discoveredSecrets = {};
    this.stats = { fastForwardCount: 0, manualSaveCount: 0 };
  },

  getClearedMapCount() {
    if (typeof Exam === 'undefined' || !Array.isArray(Exam.completed)) return 0;
    return Exam.completed.filter(row => Array.isArray(row) && row.length > 0 && row.every(Boolean)).length;
  },

  getTotalPoints() {
    return AchievementDefs.reduce((sum, def) => sum + (this.achieved[def.id] ? def.points : 0), 0);
  },

  getBonusPercent() {
    return this.getTotalPoints();
  },

  isSecretVisible(def) {
    return !def.secret || this.achieved[def.id] || this.discoveredSecrets[def.id];
  },

  isCategoryUnlocked(category) {
    if (category === 'map') return true;
    if (category === 'challenge') return typeof Resources !== 'undefined' && Resources.isCampaignUnlocked();
    if (category === 'skilltree') return typeof Resources !== 'undefined' && Resources.isSkilltreeUnlocked();
    if (category === 'cards') return typeof Cards !== 'undefined' && Cards.isUnlocked();
    if (category === 'other') {
      return Resources.timeSand > 0 ||
        Resources.answerTickets > 0 ||
        this.stats.fastForwardCount > 0 ||
        this.stats.manualSaveCount > 0;
    }
    if (category === 'easter') {
      return AchievementDefs.some(def => def.category === 'easter' && (this.achieved[def.id] || this.discoveredSecrets[def.id]));
    }
    return false;
  },

  isFeatureUnlocked(feature) {
    if (!feature) return true;
    if (feature === 'math') return typeof Resources !== 'undefined' && Resources.isCampaignUnlocked();
    if (feature === 'chinese') return typeof Exam !== 'undefined' && Exam.unlockedExamIndex >= 9;
    return true;
  },

  getVisibleCategoryKeys() {
    return Object.keys(AchievementCategories).filter(key => this.isCategoryUnlocked(key));
  },

  isChainVisible(def) {
    if (def.secret) return true;
    if (!def.chain) return true;
    if ((def.order || 1) <= 1) return true;
    const prev = AchievementDefs
      .filter(item => item.chain === def.chain && (item.order || 1) < (def.order || 1))
      .sort((a, b) => (b.order || 1) - (a.order || 1))[0];
    return !prev || !!this.achieved[prev.id];
  },

  getVisibleDefs(category = null) {
    return AchievementDefs.filter(def =>
      (!category || def.category === category) &&
      this.isCategoryUnlocked(def.category) &&
      this.isFeatureUnlocked(def.feature) &&
      this.isChainVisible(def)
    );
  },

  updateProgress() {
    const unlocked = [];
    AchievementDefs.forEach((def) => {
      if (this.achieved[def.id]) return;
      if (def.secret && !this.discoveredSecrets[def.id]) return;
      if (typeof def.condition === 'function' && def.condition()) {
        this.achieved[def.id] = true;
        unlocked.push(def);
      }
    });
    if (unlocked.length > 0 && typeof this.onUnlock === 'function') {
      unlocked.forEach(def => this.onUnlock(def));
    }
    return unlocked;
  },

  recordFastForward() {
    this.stats.fastForwardCount += 1;
    this.updateProgress();
  },

  recordManualSave() {
    this.stats.manualSaveCount += 1;
    this.updateProgress();
  },

  getSnapshot() {
    return {
      achieved: { ...this.achieved },
      discoveredSecrets: { ...this.discoveredSecrets },
      stats: { ...this.stats }
    };
  },

  loadSnapshot(snapshot) {
    this.init();
    if (!snapshot) return;
    this.achieved = snapshot.achieved && typeof snapshot.achieved === 'object' ? { ...snapshot.achieved } : {};
    this.discoveredSecrets = snapshot.discoveredSecrets && typeof snapshot.discoveredSecrets === 'object'
      ? { ...snapshot.discoveredSecrets }
      : {};
    this.stats = {
      fastForwardCount: snapshot.stats?.fastForwardCount ?? 0,
      manualSaveCount: snapshot.stats?.manualSaveCount ?? 0
    };
  }
};
