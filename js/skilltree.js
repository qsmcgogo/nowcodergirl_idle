/**
 * 牛客娘挂机游戏 - 技能树
 * 第一层：语法、数学
 * 每升一级消耗乘以 1.218
 */

const SkillTree = {
  /** 语法等级：每级 +0.1 知识点 +0.1 手速 +1 耐力 */
  grammarLevel: 0,

  /** 数学等级：每级 +0.2 思维 +0.2 知识点 */
  mathLevel: 0,

  /** 第二层：顺序结构、变量类型、加法、减法 */
  sequenceLevel: 0,
  variableLevel: 0,
  additionLevel: 0,
  subtractionLevel: 0,

  /** 每级消耗倍数 */
  COST_MULT: 1.218,

  /** 语法 1 级消耗：1 灵感 10 专注力 */
  grammarBaseCost: { inspiration: 1, focus: 10 },

  /** 数学 1 级消耗：1 灵感 10 思维力 */
  mathBaseCost: { inspiration: 1, thinking: 10 },

  nodeDefs: {
    sequence: {
      levelKey: 'sequenceLevel',
      baseCost: { inspiration: 3, focus: 25 },
      effectText: '手速 +0.08，耐力 +0.5',
      canUnlock: () => SkillTree.isLayer2Unlocked()
    },
    variable: {
      levelKey: 'variableLevel',
      baseCost: { inspiration: 5, focus: 35, thinking: 20 },
      effectText: '知识点 +0.15，码力 +0.05',
      canUnlock: () => SkillTree.isLayer2Unlocked() && SkillTree.grammarLevel >= 10
    },
    addition: {
      levelKey: 'additionLevel',
      baseCost: { inspiration: 3, thinking: 25 },
      effectText: '思维 +0.15，知识点 +0.05',
      canUnlock: () => SkillTree.isLayer2Unlocked()
    },
    subtraction: {
      levelKey: 'subtractionLevel',
      baseCost: { inspiration: 5, thinking: 35, focus: 15 },
      effectText: '手速 +0.12，耐力 +0.8',
      canUnlock: () => SkillTree.isLayer2Unlocked() && SkillTree.additionLevel >= 5
    }
  },

  getCostForLevel(baseCost, level) {
    const mult = Math.pow(this.COST_MULT, level - 1);
    return Object.fromEntries(
      Object.entries(baseCost).map(([k, v]) => [k, Math.ceil(v * mult)])
    );
  },

  getGrammarCost() {
    return this.getCostForLevel(this.grammarBaseCost, this.grammarLevel + 1);
  },

  getMathCost() {
    return this.getCostForLevel(this.mathBaseCost, this.mathLevel + 1);
  },

  isLayer2Unlocked() {
    return this.grammarLevel >= 5 && this.mathLevel >= 5;
  },

  getLayer2LockText() {
    return `第二层解锁条件\n语法 Lv.5：${this.grammarLevel}/5\n数学 Lv.5：${this.mathLevel}/5`;
  },

  getLayer3LockText() {
    return '第三层尚未开放\n后续会接入循环、函数、数组和学科专精。';
  },

  getNodeLevel(id) {
    const def = this.nodeDefs[id];
    return def ? this[def.levelKey] || 0 : 0;
  },

  getNodeCost(id) {
    const def = this.nodeDefs[id];
    if (!def) return {};
    return this.getCostForLevel(def.baseCost, this.getNodeLevel(id) + 1);
  },

  isNodeUnlocked(id) {
    const def = this.nodeDefs[id];
    return !!def && def.canUnlock();
  },

  canUpgradeGrammar() {
    if (!Resources.isSkilltreeLayerUnlocked()) return false;
    const c = this.getGrammarCost();
    return Resources.inspiration >= c.inspiration && Resources.focusPower >= c.focus;
  },

  canUpgradeMath() {
    if (!Resources.isSkilltreeLayerUnlocked()) return false;
    const c = this.getMathCost();
    return Resources.inspiration >= c.inspiration && Resources.thinkingPower >= c.thinking;
  },

  canUpgradeNode(id) {
    if (!this.isNodeUnlocked(id)) return false;
    return this.canPay(this.getNodeCost(id));
  },

  canPay(cost) {
    return Object.entries(cost).every(([key, value]) => {
      if (key === 'inspiration') return Resources.inspiration >= value;
      if (key === 'focus') return Resources.focusPower >= value;
      if (key === 'thinking') return Resources.thinkingPower >= value;
      return false;
    });
  },

  pay(cost) {
    Object.entries(cost).forEach(([key, value]) => {
      if (key === 'inspiration') Resources.inspiration -= value;
      else if (key === 'focus') Resources.focusPower -= value;
      else if (key === 'thinking') Resources.thinkingPower -= value;
    });
  },

  upgradeGrammar() {
    if (!this.canUpgradeGrammar()) return false;
    const c = this.getGrammarCost();
    Resources.inspiration -= c.inspiration;
    Resources.focusPower -= c.focus;
    this.grammarLevel++;
    return true;
  },

  upgradeMath() {
    if (!this.canUpgradeMath()) return false;
    const c = this.getMathCost();
    Resources.inspiration -= c.inspiration;
    Resources.thinkingPower -= c.thinking;
    this.mathLevel++;
    return true;
  },

  upgradeNode(id) {
    const def = this.nodeDefs[id];
    if (!def || !this.canUpgradeNode(id)) return false;
    this.pay(this.getNodeCost(id));
    this[def.levelKey]++;
    return true;
  },

  /** 获取技能加成（加到基础属性上） */
  getBonuses() {
    return {
      siwei: this.mathLevel * 0.2 + this.additionLevel * 0.15,
      zhishi: this.grammarLevel * 0.1 + this.mathLevel * 0.2 +
        this.variableLevel * 0.15 + this.additionLevel * 0.05,
      shousu: this.grammarLevel * 0.1 + this.sequenceLevel * 0.08 +
        this.subtractionLevel * 0.12,
      mali: this.variableLevel * 0.05,
      naili: this.grammarLevel * 1 + this.sequenceLevel * 0.5 +
        this.subtractionLevel * 0.8
    };
  },

  getTotalLevel() {
    return this.grammarLevel + this.mathLevel + this.sequenceLevel + this.variableLevel +
      this.additionLevel + this.subtractionLevel;
  },

  getSnapshot() {
    return {
      grammarLevel: this.grammarLevel,
      mathLevel: this.mathLevel,
      sequenceLevel: this.sequenceLevel,
      variableLevel: this.variableLevel,
      additionLevel: this.additionLevel,
      subtractionLevel: this.subtractionLevel
    };
  },

  loadSnapshot(snapshot) {
    if (!snapshot) return;
    this.grammarLevel = snapshot.grammarLevel ?? 0;
    this.mathLevel = snapshot.mathLevel ?? 0;
    this.sequenceLevel = snapshot.sequenceLevel ?? 0;
    this.variableLevel = snapshot.variableLevel ?? 0;
    this.additionLevel = snapshot.additionLevel ?? 0;
    this.subtractionLevel = snapshot.subtractionLevel ?? 0;
  }
};
