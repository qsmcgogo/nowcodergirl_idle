/**
 * 牛客娘挂机游戏 - 游戏状态
 * 存档逻辑见 save.js
 */

const Game = {
  /** 上次更新时间戳 */
  lastUpdateTime: null,

  /** 自动存档间隔（毫秒），默认 60 秒 */
  AUTO_SAVE_INTERVAL: 60000,

  /** 上次自动存档时间 */
  lastAutoSave: null,

  /**
   * 初始化游戏（读档或新游戏）
   */
  init() {
    this.lastUpdateTime = Date.now();
    Exam.init();
    Campaign.init();
    Cards.init();
    Achievements.init();
    Buildings.init();
    const saved = Save.loadFromCache();
    if (saved) {
      Save.applySaveData(saved);
    } else {
      Battle.loadSnapshot(null);
    }
    this.lastAutoSave = Date.now();
  },

  /**
   * 主循环 tick
   */
  tick() {
    const now = Date.now();
    const deltaMs = now - this.lastUpdateTime;
    const deltaSeconds = deltaMs / 1000;
    this.lastUpdateTime = now;

    Resources.tick(deltaSeconds);
    Battle.tick(deltaSeconds);

    // 自动存档（60 秒）
    if (now - this.lastAutoSave >= this.AUTO_SAVE_INTERVAL) {
      Save.saveToCache();
      this.lastAutoSave = now;
    }
  },

  fastForward(minutes) {
    const totalSeconds = Math.max(0, Math.floor(Number(minutes) || 0)) * 60;
    const before = {
      thinkingPower: Resources.thinkingPower,
      focusPower: Resources.focusPower,
      inspiration: Resources.inspiration,
      timeSand: Resources.timeSand,
      answerTickets: Resources.answerTickets
    };
    const battle = {
      questionsCleared: 0,
      examsUnlocked: 0,
      inspirationGained: 0,
      defeats: 0,
      recoverySeconds: 0
    };

    let remaining = totalSeconds;
    while (remaining > 0) {
      const needsBattleStep = Battle.isInBattle ||
        Battle.isRecovering ||
        (Battle.autoPracticeLearned && Battle.autoChallengeOn && Battle.currentHp > 0 && Exam.getCurrentQuestion());
      const step = needsBattleStep ? Math.min(1, remaining) : remaining;
      Resources.tick(step);
      const battlePart = Battle.fastForward(step);
      Object.keys(battle).forEach((key) => {
        battle[key] += battlePart[key] || 0;
      });
      remaining -= step;
    }

    const after = {
      thinkingPower: Resources.thinkingPower,
      focusPower: Resources.focusPower,
      inspiration: Resources.inspiration,
      timeSand: Resources.timeSand,
      answerTickets: Resources.answerTickets
    };

    this.lastUpdateTime = Date.now();
    Save.saveToCache();

    return {
      durationMinutes: Math.floor(Number(minutes) || 0),
      resources: Object.fromEntries(
        Object.keys(before).map((key) => [key, {
          before: before[key],
          after: after[key],
          gained: after[key] - before[key]
        }])
      ),
      mainBattle: battle
    };
  }
};
