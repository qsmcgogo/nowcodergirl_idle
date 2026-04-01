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
  }
};
