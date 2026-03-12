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

  /** 每级消耗倍数 */
  COST_MULT: 1.218,

  /** 语法 1 级消耗：1 灵感 10 专注力 */
  grammarBaseCost: { inspiration: 1, focus: 10 },

  /** 数学 1 级消耗：1 灵感 10 思维力 */
  mathBaseCost: { inspiration: 1, thinking: 10 },

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

  /** 获取技能加成（加到基础属性上） */
  getBonuses() {
    return {
      siwei: this.mathLevel * 0.2,
      zhishi: this.grammarLevel * 0.1 + this.mathLevel * 0.2,
      shousu: this.grammarLevel * 0.1,
      mali: 0,
      naili: this.grammarLevel * 1
    };
  },

  getSnapshot() {
    return {
      grammarLevel: this.grammarLevel,
      mathLevel: this.mathLevel
    };
  },

  loadSnapshot(snapshot) {
    if (!snapshot) return;
    this.grammarLevel = snapshot.grammarLevel ?? 0;
    this.mathLevel = snapshot.mathLevel ?? 0;
  }
};
