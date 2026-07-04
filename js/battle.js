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
    const base = this.runningLearned && Resources.currentActivity === 'running' ? 3 : 1;
    const bonuses = typeof Cards !== 'undefined' ? Cards.getBonuses() : {};
    const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
    return base * (1 + (bonuses.hpRegenPercent || 0) / 100) +
      (bonuses.hpRegenFlat || 0) + (buildingBonuses.regenFlat || 0);
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
  battleMode: 'push',
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

  getGrindTarget() {
    if (typeof Buildings === 'undefined' || !Buildings.grindModeLearned) return null;
    const examIdx = Exam.unlockedExamIndex;
    const row = Exam.completed[examIdx] || [];
    for (let i = Math.min(row.length, Exam.QUESTIONS_PER_EXAM) - 1; i >= 0; i--) {
      if (row[i]) return { examIndex: examIdx, questionIndex: i };
    }
    return null;
  },

  canStartGrind() {
    return typeof Buildings !== 'undefined' && Buildings.grindModeLearned &&
      Buildings.reviewTickets >= 1 && Resources.focusPower >= 1 && this.getGrindTarget() != null;
  },

  startBattle(examIndex, questionIndex, mode = 'push') {
    if (this.isInBattle || this.currentHp <= 0) return false;
    if (mode === 'grind') {
      if (!this.canStartGrind()) return false;
      Buildings.reviewTickets -= 1;
      Resources.focusPower -= 1;
    }
    const qAtk = Exam.getQuestionAttack(examIndex, questionIndex);
    const qHp = mode === 'grind'
      ? Exam.getQuestionHp(examIndex, questionIndex) * 0.6
      : Exam.getQuestionCurrentHp(examIndex, questionIndex);
    const qMaxHp = mode === 'grind'
      ? Exam.getQuestionHp(examIndex, questionIndex) * 0.6
      : Exam.getQuestionHp(examIndex, questionIndex);

    this.isInBattle = true;
    this.battleEnemyHp = qHp;
    this.battleEnemyMaxHp = qMaxHp;
    this.battleExamIndex = examIndex;
    this.battleQuestionIndex = questionIndex;
    this.battleMode = mode;

    this.runRound();
    return true;
  },

  runRound() {
    if (!this.isInBattle) return;
    const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
    const atk = Attributes.getAttack() * (1 + (buildingBonuses.retryAtkPercent || 0) / 100);
    const qAtk = Exam.getQuestionAttack(this.battleExamIndex, this.battleQuestionIndex) *
      (this.battleMode === 'grind' ? 0.6 : 1);

    this.currentHp -= qAtk;
    this.battleEnemyHp -= atk;
    if (this.battleMode !== 'grind') {
      Exam.setQuestionCurrentHp(this.battleExamIndex, this.battleQuestionIndex, this.battleEnemyHp);
    }

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
      if (this.battleMode === 'grind') {
        const gain = 1 + Math.floor(q / 5);
        const noteGain = Math.random() < 0.3 ? 1 : 0;
        if (typeof Buildings !== 'undefined') Buildings.addDraftPaper(gain);
        if (typeof Buildings !== 'undefined' && noteGain > 0) Buildings.addMistakeNotes(noteGain);
        Exam.appendBattleLog('复习了' + label + '，获得 ' + gain + ' 草稿纸' +
          (noteGain > 0 ? '、' + noteGain + ' 错题笔记' : ''));
        this.battleMode = 'push';
        return;
      }
      Exam.completeQuestion(e, q);
      const msg = this.VICTORY_MSGS[Math.floor(Math.random() * this.VICTORY_MSGS.length)].replace('{0}', label);
      Exam.appendBattleLog(msg);
      if (Exam.isExamComplete(e) && e < Exam.EXAM_COUNT - 1) {
        Exam.appendBattleLog('试卷' + (e + 2) + ' 已解锁！');
      }
      const isBDrop = q === 1;
      const pityDrop = this.victoriesWithoutDrop >= 3;
      const roll = Math.random();
      const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
      const rate = Number(this.INSPIRATION_DROP_RATE) + (buildingBonuses.inspirationDropRateBonus || 0);
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
      if (typeof Buildings !== 'undefined') {
        Buildings.addDraftPaper(2 + Math.floor(q / 5));
        if ([4, 9, 14, 19].includes(q)) {
          const memoryGain = q === 19 ? 2 + e : 1;
          const ticketGain = q === 4 && e === 0 ? 3 : 2;
          Buildings.addReviewTickets(ticketGain);
          Buildings.addMemoryShards(memoryGain);
          Exam.appendBattleLog('获得 ' + ticketGain + ' 复习券、' + memoryGain + ' 记忆碎片');
        }
        if (e === 0 && q === 4 && !this.autoPracticeUnlocked) {
          this.autoPracticeUnlocked = true;
          Buildings.grindModeUnlocked = true;
        }
      }
      const next = Exam.getCurrentQuestion();
      if (next && this.currentHp > 0) {
        this.startBattle(next.examIndex, next.questionIndex, 'push');
      }
    } else {
      this.hasDefeatedOnce = true;
      this.isRecovering = true;
      if (!this.runningUnlocked) this.runningUnlocked = true;
      if (typeof Buildings !== 'undefined') {
        Buildings.addMistakeNotes(1 + Math.floor((this.battleQuestionIndex || 0) / 5));
        if (this.battleMode !== 'grind' && Math.random() < 0.25) Buildings.addReviewTickets(1);
      }
      const msg = this.DEFEAT_MSGS[Math.floor(Math.random() * this.DEFEAT_MSGS.length)].replace('{0}', label);
      Exam.appendBattleLog(msg);
      this.battleMode = 'push';
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
            this.startBattle(next.examIndex, next.questionIndex, 'push');
          }
        }
      }
    }
  },

  fastForward(deltaSeconds) {
    let remaining = Math.max(0, Number(deltaSeconds) || 0);
    const report = {
      questionsCleared: 0,
      examsUnlocked: 0,
      inspirationGained: 0,
      defeats: 0,
      recoverySeconds: 0
    };

    if (this.battleRoundTimer) {
      clearTimeout(this.battleRoundTimer);
      this.battleRoundTimer = null;
    }

    const startBattleState = (examIndex, questionIndex) => {
      this.isInBattle = true;
      this.battleEnemyHp = Exam.getQuestionCurrentHp(examIndex, questionIndex);
      this.battleEnemyMaxHp = Exam.getQuestionHp(examIndex, questionIndex);
      this.battleExamIndex = examIndex;
      this.battleQuestionIndex = questionIndex;
    };

    const finishVictory = () => {
      const e = this.battleExamIndex;
      const q = this.battleQuestionIndex;
      const wasExamComplete = Exam.isExamComplete(e);
      Exam.completeQuestion(e, q);
      report.questionsCleared += 1;
      if (!wasExamComplete && Exam.isExamComplete(e) && e < Exam.EXAM_COUNT - 1) {
        report.examsUnlocked += 1;
      }

      const isBDrop = q === 1;
      const pityDrop = this.victoriesWithoutDrop >= 3;
      const buildingBonuses = typeof Buildings !== 'undefined' ? Buildings.getBonuses() : {};
      const rollDrop = Math.random() < Number(this.INSPIRATION_DROP_RATE) + (buildingBonuses.inspirationDropRateBonus || 0);
      const willDrop = isBDrop || pityDrop || rollDrop;
      if (typeof Resources !== 'undefined' && willDrop) {
        const amount = 10 * (e + 1);
        Resources.inspiration += amount;
        report.inspirationGained += amount;
        if (!Resources.inspirationEverDropped) Resources.inspirationEverDropped = true;
        this.victoriesWithoutDrop = 0;
      } else {
        this.victoriesWithoutDrop += 1;
      }
      if (typeof Buildings !== 'undefined') {
        Buildings.addDraftPaper(2 + Math.floor(q / 5));
        if ([4, 9, 14, 19].includes(q)) {
          const memoryGain = q === 19 ? 2 + e : 1;
          const ticketGain = q === 4 && e === 0 ? 3 : 2;
          Buildings.addReviewTickets(ticketGain);
          Buildings.addMemoryShards(memoryGain);
        }
        if (e === 0 && q === 4 && !this.autoPracticeUnlocked) {
          this.autoPracticeUnlocked = true;
          Buildings.grindModeUnlocked = true;
        }
      }
      this.isInBattle = false;
    };

    const finishDefeat = () => {
      this.isInBattle = false;
      this.hasDefeatedOnce = true;
      this.isRecovering = true;
      if (!this.runningUnlocked) this.runningUnlocked = true;
      if (typeof Buildings !== 'undefined') {
        Buildings.addMistakeNotes(1 + Math.floor((this.battleQuestionIndex || 0) / 5));
        if (Math.random() < 0.25) Buildings.addReviewTickets(1);
      }
      report.defeats += 1;
    };

    while (remaining > 0) {
      if (this.isInBattle) {
        if (remaining < this.ROUND_INTERVAL) break;
        const atk = Attributes.getAttack();
        const qAtk = Exam.getQuestionAttack(this.battleExamIndex, this.battleQuestionIndex);
        this.currentHp -= qAtk;
        this.battleEnemyHp -= atk;
        Exam.setQuestionCurrentHp(this.battleExamIndex, this.battleQuestionIndex, this.battleEnemyHp);
        remaining -= this.ROUND_INTERVAL;

        if (this.currentHp <= 0) {
          finishDefeat();
        } else if (this.battleEnemyHp <= 0) {
          finishVictory();
          const next = Exam.getCurrentQuestion();
          if (next && this.currentHp > 0) startBattleState(next.examIndex, next.questionIndex);
        }
        continue;
      }

      if (this.isRecovering && this.currentHp < Attributes.getHp()) {
        const rate = this.getRecoveryRate();
        const need = Attributes.getHp() - this.currentHp;
        const timeToFull = rate > 0 ? need / rate : remaining;
        const step = Math.min(remaining, timeToFull);
        this.currentHp = Math.min(Attributes.getHp(), this.currentHp + rate * step);
        remaining -= step;
        report.recoverySeconds += step;
        if (this.currentHp >= Attributes.getHp()) {
          this.currentHp = Attributes.getHp();
          this.isRecovering = false;
          if (Resources.currentActivity === 'running') {
            Resources.startCollectingThinking();
          }
          if (this.autoPracticeLearned && this.autoChallengeOn) {
            const next = Exam.getCurrentQuestion();
            if (next && this.currentHp > 0) startBattleState(next.examIndex, next.questionIndex);
          }
        }
        continue;
      }

      if (this.autoPracticeLearned && this.autoChallengeOn && this.currentHp > 0) {
        const next = Exam.getCurrentQuestion();
        if (next) {
          startBattleState(next.examIndex, next.questionIndex);
          continue;
        }
      }

      break;
    }

    if (this.isInBattle && !this.battleRoundTimer) {
      this.battleRoundTimer = setTimeout(() => this.runRound(), this.ROUND_INTERVAL * 1000);
    }

    return report;
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
      victoriesWithoutDrop: this.victoriesWithoutDrop,
      battleMode: this.battleMode
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
    this.battleMode = snapshot.battleMode ?? 'push';
  }
};
