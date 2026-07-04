/**
 * 牛客娘挂机游戏 - 资源系统
 * 思维力：1点/秒，初始即可收集
 * 专注力：1点/秒，思维力≥10后解锁，可与思维力二选一（牛客娘同一时间只能做一件事）
 */

const Resources = {
  /** 资源数据 */
  thinkingPower: 0,
  focusPower: 0,
  inspiration: 0,
  timeSand: 0,
  answerTickets: 0,
  mathStage: 1,

  /** 灵感是否曾掉落过（首次掉落时显示灵感、关卡与技能树页签） */
  inspirationEverDropped: false,

  /** 旧存档兼容字段：曾用于记录技能树第一层永久解锁 */
  skilltreeEverUnlocked: false,

  /** 当前活动类型：'thinking' | 'focus' | 'running' | null */
  currentActivity: null,

  /** 产出速率（点/秒） */
  rates: {
    thinking: 1,
    focus: 1,
    running: 3
  },

  /** 兑换比例 */
  TIME_SAND_PER_FAST_FORWARD_MINUTE: 1000,
  TIME_SAND_PER_TICKET: 10000,

  /** 专注力解锁条件 */
  FOCUS_UNLOCK_THRESHOLD: 10,

  /** 思维力是否曾达到过10（达到后专注力永久解锁，不再隐藏） */
  focusEverUnlocked: false,

  /** 练习区域渲染条件：思维力和专注力都 ≥ 10（消耗仍为各 20） */
  PRACTICE_UNLOCK_THRESHOLD: 10,

  /**
   * 技能树页签是否已解锁（首次获得灵感后即可进入）
   */
  isSkilltreeUnlocked() {
    return this.inspirationEverDropped || this.skilltreeEverUnlocked;
  },

  /**
   * 技能树第一层是否已解锁（首次获得灵感后开放）
   */
  isSkilltreeLayerUnlocked() {
    return this.isSkilltreeUnlocked();
  },

  /**
   * 关卡页签是否已解锁（到达主线第 2 图后开放）
   */
  isCampaignUnlocked() {
    return typeof Exam !== 'undefined' && Exam.unlockedExamIndex >= 1;
  },

  /**
   * 专注力是否已解锁（达到过10即永久解锁）
   */
  isFocusUnlocked() {
    return this.focusEverUnlocked || this.thinkingPower >= this.FOCUS_UNLOCK_THRESHOLD;
  },

  /**
   * 练习是否已解锁
   */
  isPracticeUnlocked() {
    return this.thinkingPower >= this.PRACTICE_UNLOCK_THRESHOLD &&
           this.focusPower >= this.PRACTICE_UNLOCK_THRESHOLD;
  },

  /**
   * 开始收集思维力（会停止其他活动）
   */
  startCollectingThinking() {
    this.currentActivity = 'thinking';
  },

  /**
   * 开始收集专注力（会停止其他活动，需已解锁）
   */
  startCollectingFocus() {
    if (!this.isFocusUnlocked()) return false;
    this.currentActivity = 'focus';
    return true;
  },

  /**
   * 开始跑步（需已学会跑步，专注力>0，且处于恢复状态、非战斗中）
   */
  startRunning() {
    if (typeof Battle === 'undefined' || !Battle.runningLearned) return false;
    if (Battle.isInBattle || !Battle.isRecovering) return false;
    if (this.focusPower <= 0) return false;
    this.currentActivity = 'running';
    return true;
  },

  /**
   * 停止当前活动
   */
  stopActivity() {
    this.currentActivity = null;
  },

  addTimeSand(amount) {
    this.timeSand += Math.max(0, Math.floor(Number(amount) || 0));
  },

  addAnswerTickets(amount) {
    this.answerTickets += Math.max(0, Math.floor(Number(amount) || 0));
  },

  spendTimeSand(amount) {
    const cost = Math.max(0, Math.floor(Number(amount) || 0));
    if (this.timeSand < cost) return false;
    this.timeSand -= cost;
    return true;
  },

  getFastForwardCost(minutes) {
    return Math.max(0, Math.floor(Number(minutes) || 0)) * this.TIME_SAND_PER_FAST_FORWARD_MINUTE;
  },

  getTicketExchangeCost(count) {
    return Math.max(0, Math.floor(Number(count) || 0)) * this.TIME_SAND_PER_TICKET;
  },

  exchangeAnswerTickets(count) {
    const amount = Math.max(0, Math.floor(Number(count) || 0));
    const cost = this.getTicketExchangeCost(amount);
    if (amount <= 0 || !this.spendTimeSand(cost)) return false;
    this.answerTickets += amount;
    return true;
  },

  getActivityRate(activity) {
    const base = Number(this.rates[activity] || 0);
    const bonuses = typeof Cards !== 'undefined' ? Cards.getBonuses() : {};
    if (activity === 'thinking') {
      return base * (1 + (bonuses.thinkingRatePercent || 0) / 100) + (bonuses.thinkingRateFlat || 0);
    }
    if (activity === 'focus') {
      return base * (1 + (bonuses.focusRatePercent || 0) / 100) + (bonuses.focusRateFlat || 0);
    }
    return base;
  },

  getMathPracticeTimeSand(rankValue, correctCount) {
    const rank = Math.max(1, Math.floor(Number(rankValue) || 1));
    const solved = Math.max(0, Math.floor(Number(correctCount) || 0));
    const base = rank * rank * Math.pow(solved, 1.5);
    const bonuses = typeof Cards !== 'undefined' ? Cards.getBonuses() : {};
    const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
    return Math.floor(base * (1 + (bonuses.timeSandPracticePercent || 0) / 100) +
      (bonuses.timeSandPracticeFlat || 0) + (buildingBonuses.timeSandPracticeFlat || 0));
  },

  getMathPracticeCardDropCount(correctCount) {
    const solved = Math.max(0, Math.floor(Number(correctCount) || 0));
    if (solved <= 5) return 0;
    if (solved <= 10) return 1;
    return Math.floor(Math.pow(solved / 10, 5));
  },

  /**
   * 根据 delta 时间推进资源产出
   * @param {number} deltaSeconds 经过的秒数
   */
  tick(deltaSeconds) {
    const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
    this.thinkingPower += (buildingBonuses.autoThinkingRate || 0) * deltaSeconds;
    this.focusPower += (buildingBonuses.autoFocusRate || 0) * deltaSeconds;
    if (this.thinkingPower >= this.FOCUS_UNLOCK_THRESHOLD) this.focusEverUnlocked = true;
    if (!this.currentActivity) return;

    const rate = this.getActivityRate(this.currentActivity);
    const gained = rate * deltaSeconds;

    if (this.currentActivity === 'thinking') {
      this.thinkingPower += gained;
      if (this.thinkingPower >= this.FOCUS_UNLOCK_THRESHOLD) this.focusEverUnlocked = true;
    } else if (this.currentActivity === 'focus') {
      this.focusPower += gained;
    } else if (this.currentActivity === 'running') {
      const focusCost = 0.5 * deltaSeconds;
      this.focusPower = Math.max(0, this.focusPower - focusCost);
      if (this.focusPower <= 0) this.currentActivity = null;
    }
    /* running 的 HP 恢复效果由 Battle.tick 处理 */
  },

  /** 是否已学会练习（解锁后即视为学会） */
  practiceLearned: false,

  /**
   * 获取导出用的资源快照
   */
  getSnapshot() {
    return {
      thinkingPower: this.thinkingPower,
      focusPower: this.focusPower,
      inspiration: this.inspiration,
      timeSand: this.timeSand,
      answerTickets: this.answerTickets,
      mathStage: this.mathStage,
      inspirationEverDropped: this.inspirationEverDropped,
      skilltreeEverUnlocked: this.skilltreeEverUnlocked,
      currentActivity: this.currentActivity,
      practiceLearned: this.practiceLearned,
      focusEverUnlocked: this.focusEverUnlocked
    };
  },

  /**
   * 从快照恢复
   */
  loadSnapshot(snapshot) {
    if (!snapshot) return;
    this.thinkingPower = snapshot.thinkingPower ?? 0;
    this.focusPower = snapshot.focusPower ?? 0;
    this.inspiration = snapshot.inspiration ?? 0;
    this.timeSand = snapshot.timeSand ?? 0;
    this.answerTickets = snapshot.answerTickets ?? 0;
    this.mathStage = Math.max(1, Math.min(10, Math.floor(snapshot.mathStage ?? 1)));
    this.inspirationEverDropped = snapshot.inspirationEverDropped ?? false;
    this.skilltreeEverUnlocked = snapshot.skilltreeEverUnlocked ?? false;
    this.currentActivity = snapshot.currentActivity ?? null;
    this.practiceLearned = snapshot.practiceLearned ?? false;
    this.focusEverUnlocked = snapshot.focusEverUnlocked ?? false;
    if (this.thinkingPower >= this.FOCUS_UNLOCK_THRESHOLD) this.focusEverUnlocked = true;

    if (this.currentActivity === 'focus' && !this.isFocusUnlocked()) {
      this.currentActivity = null;
    }
  }
};
