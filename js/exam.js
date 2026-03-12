/**
 * 牛客娘挂机游戏 - 试卷/题目系统
 * 每份试卷 20 题 (A-T)，每行 5 题，共 4 行
 * 全部解决解锁下一份试卷
 */

const QUESTION_LETTERS = 'ABCDEFGHIJKLMNOPQRST';

const Exam = {
  /** 试卷数量 */
  EXAM_COUNT: 5,

  /** 每份试卷题数 */
  QUESTIONS_PER_EXAM: 20,

  /** 已解锁的试卷索引（0=试卷1，通关后+1） */
  unlockedExamIndex: 0,

  /** 每份试卷每题的完成状态 [试卷索引][题索引] */
  completed: [],

  /** 每题剩余血量 [试卷索引][题索引]，undefined 表示满血 */
  questionRemainingHp: [],

  /** 战斗记录 */
  battleLog: '',

  /** 开篇提示（黄色，常驻），白色事件最多保留条数 */
  BATTLE_LOG_INTRO: '试卷1 你来到了这个空旷的算法世界，跃跃欲试',
  BATTLE_LOG_MAX_EVENTS: 20,

  init() {
    if (this.completed.length === 0) {
      for (let i = 0; i < this.EXAM_COUNT; i++) {
        this.completed.push(new Array(this.QUESTIONS_PER_EXAM).fill(false));
      }
    }
    if (this.questionRemainingHp.length === 0) {
      for (let i = 0; i < this.EXAM_COUNT; i++) {
        this.questionRemainingHp.push(new Array(this.QUESTIONS_PER_EXAM).fill(null));
      }
    }
  },

  /** 获取当前待挑战题目（从 A 题开始的第一个未完成），全部通关则返回 null */
  getCurrentQuestion() {
    const examIdx = this.unlockedExamIndex;
    if (examIdx >= this.EXAM_COUNT) return null;
    const arr = this.completed[examIdx];
    if (!arr) return null;
    for (let i = 0; i < this.QUESTIONS_PER_EXAM; i++) {
      if (!arr[i]) return { examIndex: examIdx, questionIndex: i };
    }
    return null;
  },

  /** 获取题目当前剩余血量（未受伤则返回满血） */
  getQuestionCurrentHp(examIndex, questionIndex) {
    const row = this.questionRemainingHp[examIndex];
    if (!row) return this.getQuestionHp(examIndex, questionIndex);
    const hp = row[questionIndex];
    return hp != null && hp > 0 ? hp : this.getQuestionHp(examIndex, questionIndex);
  },

  /** 保存题目剩余血量（题目血量不恢复） */
  setQuestionCurrentHp(examIndex, questionIndex, hp) {
    if (!this.questionRemainingHp[examIndex]) this.questionRemainingHp[examIndex] = [];
    this.questionRemainingHp[examIndex][questionIndex] = hp;
  },

  /** 获取题号文字，如 A题、C题 */
  getQuestionLabel(index) {
    return QUESTION_LETTERS[index] + '题';
  },

  /** 检查某份试卷是否全部完成 */
  isExamComplete(examIndex) {
    return this.completed[examIndex]?.every(Boolean) ?? false;
  },

  /** 检查某份试卷是否已解锁 */
  isExamUnlocked(examIndex) {
    return examIndex <= this.unlockedExamIndex;
  },

  /** 完成一道题并检查是否解锁下一份 */
  completeQuestion(examIndex, questionIndex) {
    if (!this.completed[examIndex]) return;
    this.completed[examIndex][questionIndex] = true;
    if (this.questionRemainingHp[examIndex]) this.questionRemainingHp[examIndex][questionIndex] = null;
    if (this.isExamComplete(examIndex) && examIndex < this.EXAM_COUNT - 1) {
      this.unlockedExamIndex = Math.max(this.unlockedExamIndex, examIndex + 1);
    }
  },

  /** 题目攻击力：试卷1 A题1 ~ T题10，平滑 */
  getQuestionAttack(examIndex, questionIndex) {
    if (examIndex === 0) {
      return 1 + (9 * questionIndex) / 19;
    }
    return (examIndex + 1) * (questionIndex + 1);
  },

  /** 题目血量：试卷1 A题5 ~ T题50，平滑 */
  getQuestionHp(examIndex, questionIndex) {
    if (examIndex === 0) {
      return 5 + (45 * questionIndex) / 19;
    }
    return (examIndex + 1) * (questionIndex + 2) * 5;
  },

  appendBattleLog(text) {
    const intro = this.BATTLE_LOG_INTRO;
    const maxEvents = this.BATTLE_LOG_MAX_EVENTS;
    let events = [];
    if (this.battleLog) {
      const lines = this.battleLog.split('\n');
      if (lines[0] === intro) {
        events = lines.slice(1).filter(Boolean);
      } else {
        events = lines.filter(Boolean);
      }
    }
    events.push(text);
    events = events.slice(-maxEvents);
    this.battleLog = intro + (events.length ? '\n' + events.join('\n') : '');
  },

  getSnapshot() {
    return {
      unlockedExamIndex: this.unlockedExamIndex,
      completed: this.completed.map(arr => [...arr]),
      questionRemainingHp: this.questionRemainingHp.map(arr => arr ? [...arr] : []),
      battleLog: this.battleLog
    };
  },

  loadSnapshot(snapshot) {
    if (!snapshot) return;
    this.unlockedExamIndex = snapshot.unlockedExamIndex ?? 0;
    if (snapshot.completed && Array.isArray(snapshot.completed)) {
      this.completed = snapshot.completed.map(arr => Array.isArray(arr) ? [...arr] : new Array(this.QUESTIONS_PER_EXAM).fill(false));
    }
    if (snapshot.questionRemainingHp && Array.isArray(snapshot.questionRemainingHp)) {
      this.questionRemainingHp = snapshot.questionRemainingHp.map(arr => Array.isArray(arr) ? [...arr] : []);
    }
    while (this.questionRemainingHp.length < this.EXAM_COUNT) {
      this.questionRemainingHp.push(new Array(this.QUESTIONS_PER_EXAM).fill(null));
    }
    this.battleLog = snapshot.battleLog ?? '';
  }
};
