/**
 * 牛客娘挂机游戏 - 卡片系统
 */

const CardDefs = {
  equals_init: {
    id: 'equals_init',
    name: '等号·初悟',
    type: '运算符',
    rarity: 'common',
    icon: '＝',
    description: '第一次真正理解等号的含义，数字的秩序开始浮现。',
    /** 1 级基础效果，高等级按 growthRate 指数增长 */
    baseBonus: { atkPercent: 5 },
    growthRate: 1.5
  }
};

const RARITY_LABELS = {
  common: '普通',
  rare: '稀有',
  epic: '史诗',
  legendary: '传说'
};

const Cards = {
  SLOT_COUNT: 1,

  /**
   * 持有列表：[{ defId: string, stacks: number[] }]
   * stacks[i] = 第 i+1 级的持有张数
   */
  owned: [],

  /**
   * 已装入槽的卡片 defId（null = 空槽）
   * 长度始终等于 SLOT_COUNT
   */
  slots: [],

  init() {
    this.reset();
  },

  reset() {
    this.owned = [];
    this.slots = new Array(this.SLOT_COUNT).fill(null);
  },

  /** 是否已解锁（至少拥有一张卡片） */
  isUnlocked() {
    return this.owned.length > 0;
  },

  /** 获取一张卡片（首张触发解锁） */
  addCard(defId) {
    const def = CardDefs[defId];
    if (!def) return false;
    const entry = this.owned.find(c => c.defId === defId);
    if (entry) {
      entry.stacks[0] = (entry.stacks[0] || 0) + 1;
    } else {
      this.owned.push({ defId, stacks: [1] });
    }
    return true;
  },

  getEntry(defId) {
    return this.owned.find(c => c.defId === defId) || null;
  },

  /** 当前最高有效等级（有张数的最高级），0 表示未持有 */
  getHighestLevel(defId) {
    const entry = this.getEntry(defId);
    if (!entry) return 0;
    for (let i = entry.stacks.length - 1; i >= 0; i--) {
      if (entry.stacks[i] > 0) return i + 1;
    }
    return 0;
  },

  /** 所有等级的持有总数 */
  getTotalCount(defId) {
    const entry = this.getEntry(defId);
    if (!entry) return 0;
    return entry.stacks.reduce((s, n) => s + n, 0);
  },

  isSlotted(defId) {
    return this.slots.includes(defId);
  },

  /** 将卡片装入指定槽位（默认 0） */
  equip(defId, slotIndex = 0) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
    if (!this.getEntry(defId)) return false;
    // 若该卡已在其他槽，先取出
    const prev = this.slots.indexOf(defId);
    if (prev !== -1) this.slots[prev] = null;
    this.slots[slotIndex] = defId;
    return true;
  },

  /** 从指定槽位取出卡片 */
  unequip(slotIndex = 0) {
    if (slotIndex < 0 || slotIndex >= this.slots.length) return false;
    this.slots[slotIndex] = null;
    return true;
  },

  /** 是否有可合成的等级（任意等级持有 ≥3 张） */
  canMerge(defId) {
    if (!CardDefs[defId]) return false;
    const entry = this.getEntry(defId);
    if (!entry) return false;
    return entry.stacks.some(n => n >= 3);
  },

  /** 合成（自动选最低可合成等级）：3 张 Lv.n → 1 张 Lv.n+1 */
  merge(defId) {
    if (!CardDefs[defId]) return false;
    const entry = this.getEntry(defId);
    if (!entry) return false;
    for (let i = 0; i < entry.stacks.length; i++) {
      if ((entry.stacks[i] || 0) >= 3) {
        entry.stacks[i] -= 3;
        if (i + 1 >= entry.stacks.length) entry.stacks.push(0);
        entry.stacks[i + 1] += 1;
        return true;
      }
    }
    return false;
  },

  /** 根据 baseBonus 和 growthRate 计算指定等级的效果 */
  getLevelBonus(defId, level) {
    const def = CardDefs[defId];
    if (!def || level <= 0) return {};
    const base = def.baseBonus || {};
    const rate = def.growthRate || 1.5;
    const multiplier = Math.pow(rate, level - 1);
    const result = {};
    for (const key in base) {
      result[key] = base[key] * multiplier;
    }
    return result;
  },

  /**
   * 计算所有卡片的加成总量
   * 槽内 100%，槽外 10%
   */
  getBonuses() {
    const result = { atkPercent: 0, hpPercent: 0 };
    this.owned.forEach(({ defId }) => {
      const def = CardDefs[defId];
      if (!def) return;
      const level = this.getHighestLevel(defId);
      if (level === 0) return;
      const bonus = this.getLevelBonus(defId, level);
      const multi = this.isSlotted(defId) ? 1.0 : 0.1;
      result.atkPercent += (bonus.atkPercent || 0) * multi;
      result.hpPercent  += (bonus.hpPercent  || 0) * multi;
    });
    return result;
  },

  getSnapshot() {
    return {
      owned: this.owned.map(c => ({ defId: c.defId, stacks: [...c.stacks] })),
      slots: [...this.slots]
    };
  },

  loadSnapshot(snap) {
    this.reset();
    if (!snap) return;
    if (Array.isArray(snap.owned)) {
      snap.owned.forEach(c => {
        if (!c || !CardDefs[c.defId]) return;
        const stacks = Array.isArray(c.stacks)
          ? c.stacks.map(n => Math.max(0, Number(n) || 0))
          : [1];
        // 移除末尾多余的 0
        while (stacks.length > 1 && stacks[stacks.length - 1] === 0) stacks.pop();
        this.owned.push({ defId: c.defId, stacks });
      });
    }
    if (Array.isArray(snap.slots)) {
      for (let i = 0; i < this.SLOT_COUNT; i++) {
        const id = snap.slots[i];
        this.slots[i] = (id && CardDefs[id] && this.getEntry(id)) ? id : null;
      }
    }
  }
};
