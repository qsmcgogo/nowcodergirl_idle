/**
 * 牛客娘挂机游戏 - 属性系统
 * 攻击 = 思维 * 知识点 * 手速
 * 血量 = 码力 * 耐力
 * 初始：耐力 10，其余 1
 */

const Attributes = {
  /** 基础属性 */
  siwei: 1,       // 思维
  zhishi: 1,      // 知识点
  shousu: 1,      // 手速
  mali: 1,        // 码力
  naili: 10,      // 耐力

  /** 有效属性（基础 + 技能树加成） */
  getEffective(attr) {
    const bonus = typeof SkillTree !== 'undefined' ? SkillTree.getBonuses()[attr] ?? 0 : 0;
    return this[attr] + bonus;
  },

  /** 攻击力 = (基础攻击 + 基础攻击加值) * 百分比加成 + 攻击加值 */
  getAttack() {
    const cardBonuses = typeof Cards !== 'undefined' ? Cards.getBonuses() : {};
    const base = this.getEffective('siwei') * this.getEffective('zhishi') * this.getEffective('shousu');
    const panelBase = base + (cardBonuses.baseAtkFlat || 0);
    const cardBonus = cardBonuses.atkPercent || 0;
    const achievementBonus = typeof Achievements !== 'undefined' ? Achievements.getBonusPercent() : 0;
    const buildingBonus = typeof Buildings !== 'undefined' ? (Buildings.getBonuses().globalCombatPercent || 0) : 0;
    return panelBase * (1 + (cardBonus + achievementBonus + buildingBonus) / 100) + (cardBonuses.atkFlat || 0);
  },

  /** 血量 = (基础血量 + 基础血量加值) * 百分比加成 + 血量加值 */
  getHp() {
    const cardBonuses = typeof Cards !== 'undefined' ? Cards.getBonuses() : {};
    const base = this.getEffective('mali') * this.getEffective('naili');
    const panelBase = base + (cardBonuses.baseHpFlat || 0);
    const cardBonus = cardBonuses.hpPercent || 0;
    const achievementBonus = typeof Achievements !== 'undefined' ? Achievements.getBonusPercent() : 0;
    const buildingBonus = typeof Buildings !== 'undefined' ? (Buildings.getBonuses().globalCombatPercent || 0) : 0;
    return Math.floor(panelBase * (1 + (cardBonus + achievementBonus + buildingBonus) / 100) + (cardBonuses.hpFlat || 0));
  },

  getSnapshot() {
    return {
      siwei: this.siwei,
      zhishi: this.zhishi,
      shousu: this.shousu,
      mali: this.mali,
      naili: this.naili
    };
  },

  loadSnapshot(snapshot) {
    if (!snapshot) return;
    this.siwei = snapshot.siwei ?? 1;
    this.zhishi = snapshot.zhishi ?? 1;
    this.shousu = snapshot.shousu ?? 1;
    this.mali = snapshot.mali ?? 1;
    this.naili = snapshot.naili ?? 10;
  }
};
