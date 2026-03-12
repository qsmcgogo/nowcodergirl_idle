/**
 * 牛客娘挂机游戏 - 战斗系统
 * 回合制：1秒/回合，牛客娘先手，双方同时扣血
 */

const Battle = {
  /** 牛客娘当前血量 */
  currentHp: 10,

  /** 是否处于恢复状态（战败后） */
  isRecovering: false,

  /** 跑步研究是否已解锁（首次战败解锁） */
  runningUnlocked: false,

  /** 是否已学会跑步 */
  runningLearned: false,

  /** 恢复速率：基础1/秒，学会跑步且正在跑步时3/秒 */
  getRecoveryRate() {
    if (this.runningLearned && Resources.currentActivity === 'running') return 3;
    return 1;
  },

  /** 是否已首次战败（用于解锁跑步） */
  hasDefeatedOnce: false,

  /** 击败试卷1 E题后解锁 */
  autoPracticeUnlocked: false,
  /** 研究后学会自动练习 */
  autoPracticeLearned: false,
  /** 自动挑战开关，默认开启 */
  autoChallengeOn: true,

  /** 战斗状态 */
  isInBattle: false,
  battleEnemyHp: 0,
  battleEnemyMaxHp: 0,
  battleExamIndex: null,
  battleQuestionIndex: null,
  battleRoundTimer: null,

  /** 回合间隔（秒） */
  ROUND_INTERVAL: 1,

  /** 灵感掉落概率（0~1），初始 50% */
  INSPIRATION_DROP_RATE: 0.5,

  /** 连续胜利未掉落计数，达到 3 时下次必掉（保底） */
  victoriesWithoutDrop: 0,

  VICTORY_MSGS: [
    '牛客娘解决了{0}！',
    '牛客娘轻松拿下了{0}！',
    '牛客娘顺利通过了{0}！',
    '牛客娘攻克了{0}！',
    '牛客娘完美解决了{0}！',
    '牛客娘成功解出{0}！',
    '牛客娘把{0}拿捏了！',
    '牛客娘搞定{0}了！',
    '牛客娘顺利搞定{0}！',
    '牛客娘成功通过了{0}！'
  ],

  DEFEAT_MSGS: [
    '牛客娘被{0}难倒了…',
    '牛客娘尝试做了{0}，一筹莫展',
    '牛客娘在{0}面前败下阵来',
    '牛客娘被{0}难住了',
    '牛客娘面对{0}毫无头绪',
    '牛客娘在{0}上卡住了',
    '牛客娘没能解开{0}',
    '牛客娘被{0}难倒了，需要再想想',
    '牛客娘在{0}前陷入了沉思',
    '牛客娘暂时没能攻克{0}'
  ],

  startBattle(examIndex, questionIndex) {
    if (this.isInBattle || this.currentHp <= 0) return false;
    const qAtk = Exam.getQuestionAttack(examIndex, questionIndex);
    const qHp = Exam.getQuestionCurrentHp(examIndex, questionIndex);
    const qMaxHp = Exam.getQuestionHp(examIndex, questionIndex);

    this.isInBattle = true;
    this.battleEnemyHp = qHp;
    this.battleEnemyMaxHp = qMaxHp;
    this.battleExamIndex = examIndex;
    this.battleQuestionIndex = questionIndex;

    this.runRound();
    return true;
  },

  runRound() {
    if (!this.isInBattle) return;
    const atk = Attributes.getAttack();
    const qAtk = Exam.getQuestionAttack(this.battleExamIndex, this.battleQuestionIndex);

    this.currentHp -= qAtk;
    this.battleEnemyHp -= atk;
    Exam.setQuestionCurrentHp(this.battleExamIndex, this.battleQuestionIndex, this.battleEnemyHp);

    if (this.currentHp <= 0) {
      this.endBattle(false);
      return;
    }
    if (this.battleEnemyHp <= 0) {
      this.endBattle(true);
      return;
    }

    this.battleRoundTimer = setTimeout(() => this.runRound(), this.ROUND_INTERVAL * 1000);
  },

  endBattle(victory) {
    this.isInBattle = false;
    if (this.battleRoundTimer) {
      clearTimeout(this.battleRoundTimer);
      this.battleRoundTimer = null;
    }

    const label = Exam.getQuestionLabel(this.battleQuestionIndex);

    if (victory) {
      const e = this.battleExamIndex;
      const q = this.battleQuestionIndex;
      Exam.completeQuestion(e, q);
      const msg = this.VICTORY_MSGS[Math.floor(Math.random() * this.VICTORY_MSGS.length)].replace('{0}', label);
      Exam.appendBattleLog(msg);
      if (Exam.isExamComplete(e) && e < Exam.EXAM_COUNT - 1) {
        Exam.appendBattleLog('试卷' + (e + 2) + ' 已解锁！');
      }
      const isBDrop = q === 1;
      const pityDrop = this.victoriesWithoutDrop >= 3;
      const roll = Math.random();
      const rate = Number(this.INSPIRATION_DROP_RATE);
      const rollDrop = roll < rate;
      const willDrop = isBDrop || pityDrop || rollDrop;
      console.log('[灵感] 题' + (q + 1) + ' isBDrop=' + isBDrop + ' pityDrop=' + pityDrop
        + ' roll=' + roll.toFixed(4) + ' rate=' + rate + ' rollDrop=' + rollDrop + ' willDrop=' + willDrop
        + ' victoriesWithoutDrop=' + this.victoriesWithoutDrop);
      if (typeof Resources !== 'undefined' && willDrop) {
        const amount = 10 * (e + 1);
        Resources.inspiration += amount;
        if (!Resources.inspirationEverDropped) Resources.inspirationEverDropped = true;
        Exam.appendBattleLog('获得 ' + amount + ' 灵感');
        this.victoriesWithoutDrop = 0;
      } else {
        this.victoriesWithoutDrop += 1;
      }
      if (e === 0 && q === 4 && !this.autoPracticeUnlocked) {
        this.autoPracticeUnlocked = true;
      }
      const next = Exam.getCurrentQuestion();
      if (next && this.currentHp > 0) {
        this.startBattle(next.examIndex, next.questionIndex);
      }
    } else {
      this.hasDefeatedOnce = true;
      this.isRecovering = true;
      if (!this.runningUnlocked) this.runningUnlocked = true;
      const msg = this.DEFEAT_MSGS[Math.floor(Math.random() * this.DEFEAT_MSGS.length)].replace('{0}', label);
      Exam.appendBattleLog(msg);
    }
  },

  tick(deltaSeconds) {
    if (this.isRecovering && this.currentHp < Attributes.getHp()) {
      this.currentHp = Math.min(Attributes.getHp(), this.currentHp + this.getRecoveryRate() * deltaSeconds);
      if (this.currentHp >= Attributes.getHp()) {
        this.currentHp = Attributes.getHp();
        this.isRecovering = false;
        if (Resources.currentActivity === 'running') {
          Resources.startCollectingThinking();
        }
        if (this.autoPracticeLearned && this.autoChallengeOn) {
          const next = Exam.getCurrentQuestion();
          if (next && this.currentHp > 0) {
            this.startBattle(next.examIndex, next.questionIndex);
          }
        }
      }
    }
  },

  getSnapshot() {
    return {
      currentHp: this.currentHp,
      isRecovering: this.isRecovering,
      runningUnlocked: this.runningUnlocked,
      runningLearned: this.runningLearned,
      hasDefeatedOnce: this.hasDefeatedOnce,
      autoPracticeUnlocked: this.autoPracticeUnlocked,
      autoPracticeLearned: this.autoPracticeLearned,
      autoChallengeOn: this.autoChallengeOn,
      victoriesWithoutDrop: this.victoriesWithoutDrop
    };
  },

  loadSnapshot(snapshot) {
    if (!snapshot) {
      this.currentHp = Attributes.getHp();
      this.isRecovering = false;
      return;
    }
    this.currentHp = snapshot.currentHp ?? Attributes.getHp();
    this.isRecovering = snapshot.isRecovering ?? false;
    this.runningUnlocked = snapshot.runningUnlocked ?? false;
    this.runningLearned = snapshot.runningLearned ?? false;
    this.hasDefeatedOnce = snapshot.hasDefeatedOnce ?? false;
    this.autoPracticeUnlocked = snapshot.autoPracticeUnlocked ?? false;
    this.autoPracticeLearned = snapshot.autoPracticeLearned ?? false;
    this.autoChallengeOn = snapshot.autoChallengeOn ?? true;
    this.victoriesWithoutDrop = snapshot.victoriesWithoutDrop ?? 0;
  }
};
