/**
 * 牛客娘挂机游戏 - 数学关卡题库
 */

const MathCampaign = {
  MAX_STAGE: 10,
  STAGE_LABELS: ['F', 'E', 'D', 'C', 'B', 'A', 'S', 'SS', 'SSS', 'SSS+'],

  getStageLabel(stage) {
    const idx = Math.max(1, Math.min(this.MAX_STAGE, Math.floor(Number(stage) || 1))) - 1;
    return `第 ${idx + 1} 关 / ${this.STAGE_LABELS[idx]}`;
  },

  getStageTitle(stage) {
    const titles = [
      '10 以内加法',
      '20 以内加减法',
      '10 以内乘法',
      '100 以内加减法',
      '两位数乘个位数',
      '加减乘混合',
      '括号四则运算',
      '两位数乘两位数',
      '括号与两位数乘法',
      '幂运算入门'
    ];
    const idx = Math.max(1, Math.min(this.MAX_STAGE, Math.floor(Number(stage) || 1))) - 1;
    return titles[idx];
  },

  getStageWeights(currentStage) {
    const stage = Math.max(1, Math.min(this.MAX_STAGE, Math.floor(Number(currentStage) || 1)));
    if (stage === 1) return [{ stage: 1, weight: 1 }];
    const weights = [];
    let used = 0;
    for (let s = stage; s >= 2; s--) {
      const distance = stage - s;
      const weight = Math.pow(0.5, distance + 1);
      weights.push({ stage: s, weight });
      used += weight;
    }
    weights.push({ stage: 1, weight: Math.max(0, 1 - used) });
    return weights;
  },

  pickQuestionStage(currentStage) {
    const weights = this.getStageWeights(currentStage);
    let r = Math.random();
    for (const item of weights) {
      r -= item.weight;
      if (r <= 0) return item.stage;
    }
    return weights[weights.length - 1].stage;
  },

  generateQuestion(currentStage) {
    const stage = this.pickQuestionStage(currentStage);
    const q = this.generateStageQuestion(stage);
    return {
      ...q,
      sourceStage: stage,
      sourceLabel: this.getStageLabel(stage),
      sourceTitle: this.getStageTitle(stage)
    };
  },

  generateQuestionBatch(currentStage, count) {
    const size = Math.max(1, Math.floor(Number(count) || 1));
    return Array.from({ length: size }, () => this.generateQuestion(currentStage));
  },

  generateStageQuestion(stage) {
    const generators = {
      1: () => this.genStage1(),
      2: () => this.genStage2(),
      3: () => this.genStage3(),
      4: () => this.genStage4(),
      5: () => this.genStage5(),
      6: () => this.genStage6(),
      7: () => this.genStage7(),
      8: () => this.genStage8(),
      9: () => this.genStage9(),
      10: () => this.genStage10()
    };
    return (generators[stage] || generators[1])();
  },

  rand(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  choice(arr) {
    return arr[this.rand(0, arr.length - 1)];
  },

  make(html, answer) {
    return { html, answer };
  },

  genStage1() {
    const a = this.rand(0, 10);
    const b = this.rand(0, 10 - a);
    return this.make(`${a} + ${b}`, a + b);
  },

  genStage2() {
    if (Math.random() < 0.5) {
      const a = this.rand(0, 20);
      const b = this.rand(0, 20 - a);
      return this.make(`${a} + ${b}`, a + b);
    }
    const a = this.rand(0, 20);
    const b = this.rand(0, a);
    return this.make(`${a} - ${b}`, a - b);
  },

  genStage3() {
    const a = this.rand(0, 10);
    const b = this.rand(0, 10);
    return this.make(`${a} × ${b}`, a * b);
  },

  genStage4() {
    if (Math.random() < 0.5) {
      const a = this.rand(0, 100);
      const b = this.rand(0, 100 - a);
      return this.make(`${a} + ${b}`, a + b);
    }
    const a = this.rand(0, 100);
    const b = this.rand(0, a);
    return this.make(`${a} - ${b}`, a - b);
  },

  genStage5() {
    const a = this.rand(10, 99);
    const b = this.rand(2, 9);
    return this.make(`${a} × ${b}`, a * b);
  },

  genStage6() {
    const forms = [
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(2, 9);
        const c = this.rand(0, 100);
        const val = a * b + c;
        return this.make(`${a} × ${b} + ${c}`, val);
      },
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(2, 9);
        const product = a * b;
        const c = this.rand(0, product);
        return this.make(`${a} × ${b} - ${c}`, product - c);
      },
      () => {
        const a = this.rand(0, 100);
        const b = this.rand(0, 100 - a);
        const c = this.rand(2, 9);
        return this.make(`${a} + ${b} × ${c}`, a + b * c);
      }
    ];
    return this.choice(forms)();
  },

  genStage7() {
    const forms = [
      () => {
        const a = this.rand(0, 50);
        const b = this.rand(0, 50 - a);
        const c = this.rand(2, 9);
        return this.make(`(${a} + ${b}) × ${c}`, (a + b) * c);
      },
      () => {
        const a = this.rand(20, 100);
        const b = this.rand(0, a);
        const c = this.rand(2, 9);
        return this.make(`(${a} - ${b}) × ${c}`, (a - b) * c);
      },
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(2, 9);
        const c = this.rand(0, 100);
        const d = this.rand(0, 100);
        const inner = c >= d ? `${c} - ${d}` : `${c} + ${d}`;
        const innerVal = c >= d ? c - d : c + d;
        return this.make(`${a} × ${b} + (${inner})`, a * b + innerVal);
      }
    ];
    return this.choice(forms)();
  },

  genStage8() {
    const a = this.rand(10, 99);
    const b = this.rand(10, 99);
    return this.make(`${a} × ${b}`, a * b);
  },

  genStage9() {
    const forms = [
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(10, 99);
        const c = this.rand(0, 100);
        return this.make(`${a} × ${b} + ${c}`, a * b + c);
      },
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(10, 99);
        const product = a * b;
        const c = this.rand(0, Math.min(300, product));
        return this.make(`${a} × ${b} - ${c}`, product - c);
      },
      () => {
        const a = this.rand(10, 99);
        const b = this.rand(0, 20);
        const c = this.rand(0, 20 - b);
        return this.make(`${a} × (${b} + ${c})`, a * (b + c));
      }
    ];
    return this.choice(forms)();
  },

  genStage10() {
    const pairs = [];
    for (let base = 2; base <= 10; base++) {
      for (let exp = 2; exp <= 10; exp++) {
        const value = Math.pow(base, exp);
        if (value <= 1000) pairs.push({ base, exp, value });
      }
    }
    const pair = this.choice(pairs);
    const expExpr = this.makeExponentExpression(pair.exp);
    const prefix = `${pair.base}<sup>${expExpr.html}</sup>`;
    if (expExpr.ops >= 2 || Math.random() < 0.45) return this.make(prefix, pair.value);
    const tail = this.rand(0, 100);
    if (Math.random() < 0.5) return this.make(`${prefix} + ${tail}`, pair.value + tail);
    const sub = this.rand(0, Math.min(tail, pair.value));
    return this.make(`${prefix} - ${sub}`, pair.value - sub);
  },

  makeExponentExpression(exp) {
    const simple = () => ({ ...this.make(String(exp), exp), ops: 0 });
    const add = () => {
      const a = this.rand(1, exp - 1);
      const b = exp - a;
      return { ...this.make(`${a} + ${b}`, exp), ops: 1 };
    };
    const sub = () => {
      const b = this.rand(1, 5);
      return { ...this.make(`${exp + b} - ${b}`, exp), ops: 1 };
    };
    const mulSub = () => {
      const factor = this.choice([2, 3, 4, 5, 6, 7]);
      const product = exp + this.rand(1, 4);
      return { ...this.make(`${factor} × ${product} - ${factor * product - exp}`, exp), ops: 2 };
    };
    if (exp <= 2) return Math.random() < 0.5 ? simple() : add();
    return this.choice([simple, add, sub, mulSub])();
  }
};
