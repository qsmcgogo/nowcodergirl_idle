/**
 * 牛客娘挂机游戏 - 关卡状态与规则
 */

const Campaign = {
  FIRST_STAGE_ID: CampaignData.FIRST_STAGE_ID,

  stageStates: {},
  selectedStageId: CampaignData.FIRST_STAGE_ID,

  get stageDefs() {
    return CampaignData.stageDefs;
  },

  get stageOrder() {
    return CampaignData.STAGE_ORDER;
  },

  init() {
    this.reset();
  },

  reset() {
    this.stageStates = {};
    this.stageOrder.forEach((stageId) => {
      this.stageStates[stageId] = {
        cleared: false,
        stars: 0,
        attempts: 0,
        bestOps: null,
        introSeen: false
      };
    });
    this.selectedStageId = this.FIRST_STAGE_ID;
  },

  getStageDef(stageId = this.selectedStageId) {
    return this.stageDefs[stageId] ?? null;
  },

  getStageState(stageId = this.selectedStageId) {
    if (!this.stageStates[stageId]) {
      this.stageStates[stageId] = { cleared: false, stars: 0, attempts: 0, bestOps: null, introSeen: false };
    }
    return this.stageStates[stageId];
  },

  getStageIndex(stageId) {
    return this.stageOrder.indexOf(stageId);
  },

  isStageUnlocked(stageId) {
    if (!this.stageDefs[stageId]) return false;
    const index = this.getStageIndex(stageId);
    if (index <= 0) return true;
    const prevStageId = this.stageOrder[index - 1];
    return !!this.getStageState(prevStageId).cleared;
  },

  getAllStages() {
    return this.stageOrder.map((stageId) => ({
      def: this.getStageDef(stageId),
      state: this.getStageState(stageId),
      unlocked: this.isStageUnlocked(stageId)
    }));
  },

  getVisibleStages() {
    const allStages = this.getAllStages();
    const lastUnlockedIndex = allStages.reduce((lastIndex, stage, index) => (
      stage.unlocked ? index : lastIndex
    ), 0);
    const maxVisibleIndex = Math.min(allStages.length - 1, lastUnlockedIndex + 1);
    return allStages.filter((_, index) => index <= maxVisibleIndex);
  },

  selectStage(stageId) {
    if (!this.stageDefs[stageId] || !this.isStageUnlocked(stageId)) return false;
    this.selectedStageId = stageId;
    return true;
  },

  isUnlocked() {
    return Resources.isCampaignUnlocked();
  },

  isFirstChapterCleared() {
    return this.stageOrder.every(stageId => this.getStageState(stageId).cleared);
  },

  completeStage(stageId, operationCount) {
    const def = this.getStageDef(stageId);
    if (!def) return { ok: false, message: '关卡不存在。' };
    const state = this.getStageState(stageId);
    const firstClear = !state.cleared;
    const opCount = Math.max(0, Number(operationCount) || 0);

    state.attempts += 1;
    state.cleared = true;
    if (state.bestOps == null || opCount < state.bestOps) {
      state.bestOps = opCount;
    }

    const hadStar = state.stars > 0;
    const gotStar = opCount <= (def.starOpLimit ?? Infinity);
    if (gotStar) state.stars = Math.max(state.stars, 1);
    const gainedStars = !hadStar && state.stars > 0 ? 1 : 0;

    // 首次通关 Stage 0-1 掉落第一张卡片
    let cardReward = null;
    if (firstClear && stageId === 'world0_ch1_stage1') {
      if (typeof Cards !== 'undefined') {
        Cards.addCard('equals_init');
        cardReward = 'equals_init';
      }
    }

    return {
      ok: true,
      firstClear,
      unlockedSkilltree: false,
      gotStar,
      gainedStars,
      cardReward,
      bestOps: state.bestOps,
      message: firstClear
        ? (gotStar ? '通关成功。' : '通关成功。')
        : (gotStar ? '再次挑战成功。' : '这关已经通关过了。')
    };
  },

  getTotalStars() {
    return Object.values(this.stageStates).reduce((sum, state) => sum + (state.stars || 0), 0);
  },

  getSnapshot() {
    return {
      stageStates: Object.fromEntries(
        Object.entries(this.stageStates).map(([id, state]) => [id, { ...state }])
      ),
      selectedStageId: this.selectedStageId
    };
  },

  loadSnapshot(snapshot) {
    this.reset();
    if (!snapshot) return;
    if (snapshot.stageStates && typeof snapshot.stageStates === 'object') {
      Object.entries(snapshot.stageStates).forEach(([id, state]) => {
        if (!this.stageDefs[id] || !state) return;
        this.stageStates[id] = {
          cleared: !!state.cleared,
          stars: Number(state.stars) || 0,
          attempts: Number(state.attempts) || 0,
          bestOps: state.bestOps == null ? null : Number(state.bestOps) || 0,
          introSeen: !!state.introSeen
        };
      });
    }
    if (snapshot.selectedStageId && this.stageDefs[snapshot.selectedStageId]) {
      this.selectedStageId = snapshot.selectedStageId;
    }
  }
};
