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

  /** 攻击力 = 思维 * 知识点 * 手速，再乘以卡片加成 */
  getAttack() {
    const base = this.getEffective('siwei') * this.getEffective('zhishi') * this.getEffective('shousu');
    const cardBonus = typeof Cards !== 'undefined' ? Cards.getBonuses().atkPercent : 0;
    return base * (1 + cardBonus / 100);
  },

  /** 血量 = 码力 * 耐力，再乘以卡片加成 */
  getHp() {
    const base = this.getEffective('mali') * this.getEffective('naili');
    const cardBonus = typeof Cards !== 'undefined' ? Cards.getBonuses().hpPercent : 0;
    return Math.floor(base * (1 + cardBonus / 100));
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
