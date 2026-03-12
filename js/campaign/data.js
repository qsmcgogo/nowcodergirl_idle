/**
 * 牛客娘挂机游戏 - 关卡数据
 * 当前仅放 World 0 的一组关卡，后续可继续扩展。
 */

const CampaignData = {
  FIRST_STAGE_ID: 'world0_ch1_stage1',
  STAGE_ORDER: [
    'world0_ch1_stage1',
    'world0_ch1_stage2',
    'world0_ch1_stage3',
    'world0_ch1_stage4',
    'world0_ch1_stage5',
    'world0_ch1_stage6',
    'world0_ch1_stage7',
    'world0_ch1_stage8',
    'world0_ch1_boss'
  ],

  stageDefs: {
    world0_ch1_stage1: {
      id: 'world0_ch1_stage1',
      label: 'Stage 0-1',
      chapterName: 'World 0',
      stageName: '第一声心跳',
      description: '使天平平衡吧。',
      goalText: '使天平平衡吧。',
      starConditionText: '2 次操作内完成可获得本关星星。',
      rewardText: '2 次操作内完成可获得本章第 1 颗星。',
      gameType: 'balance_drag',
      starOpLimit: 2
    },
    world0_ch1_stage2: {
      id: 'world0_ch1_stage2',
      label: 'Stage 0-2',
      chapterName: 'World 0',
      stageName: '学会数数',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage3: {
      id: 'world0_ch1_stage3',
      label: 'Stage 0-3',
      chapterName: 'World 0',
      stageName: '你教我，我记住',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage4: {
      id: 'world0_ch1_stage4',
      label: 'Stage 0-4',
      chapterName: 'World 0',
      stageName: '学会失去',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage5: {
      id: 'world0_ch1_stage5',
      label: 'Stage 0-5',
      chapterName: 'World 0',
      stageName: '重复的力量',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage6: {
      id: 'world0_ch1_stage6',
      label: 'Stage 0-6',
      chapterName: 'World 0',
      stageName: '分配',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage7: {
      id: 'world0_ch1_stage7',
      label: 'Stage 0-7',
      chapterName: 'World 0',
      stageName: '余下的秘密',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一关。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_stage8: {
      id: 'world0_ch1_stage8',
      label: 'Stage 0-8',
      chapterName: 'World 0',
      stageName: '综合挑战',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁 Boss。',
      gameType: 'placeholder',
      starOpLimit: 5
    },
    world0_ch1_boss: {
      id: 'world0_ch1_boss',
      label: 'Stage 0-B',
      chapterName: 'World 0',
      stageName: 'Boss',
      description: '内容开发中。',
      goalText: '内容开发中。',
      rewardText: '通关后解锁下一章。',
      gameType: 'placeholder',
      starOpLimit: 6
    }
  }
};
