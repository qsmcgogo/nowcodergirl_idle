/**
 * 牛客娘挂机游戏 - 主入口
 */

(function () {
  const GAME_CONTAINER = document.querySelector('.game-container');
  const BTN_THINKING = document.getElementById('btn-collect-thinking');
  const BTN_FOCUS = document.getElementById('btn-collect-focus');
  const FOCUS_RESOURCE = document.getElementById('focus-resource');
  const PRACTICE_SECTION = document.getElementById('practice-section');
  const BTN_LEARN_PRACTICE = document.getElementById('btn-learn-practice');
  const THINKING_EL = document.getElementById('thinking-power');
  const FOCUS_EL = document.getElementById('focus-power');
  const INSPIRATION_EL = document.getElementById('inspiration-power');
  const THINKING_RATE_EL = document.getElementById('thinking-rate');
  const FOCUS_RATE_EL = document.getElementById('focus-rate');
  const CURRENT_ACTIVITY_EL = document.getElementById('current-activity');
  const PLACEHOLDER = document.getElementById('display-placeholder');
  const ACTIVITY_DISPLAY = document.getElementById('activity-display');
  const CAMPAIGN_DISPLAY = document.getElementById('campaign-display');
  const PRACTICE_DISPLAY = document.getElementById('practice-display');
  const ACTIVITY_TEXT = document.getElementById('activity-text');
  const ACTIVITY_RATE = document.getElementById('activity-rate');
  const AVATAR_IMG = document.getElementById('avatar');
  let activePanel = 'daily';
  let campaignStageViewOpen = false;
  let campaignStageFeedback = '';
  let campaignStageFeedbackType = '';
  let campaignDragSource = null;
  let campaignSuccessModalState = null;
  let campaignNodeGridSignature = '';
  let campaignMapDirty = true;
  let campaignBoardSignature = '';
  let campaignStageSession = createCampaignStageSession();

  function markCampaignMapDirty() {
    campaignMapDirty = true;
    campaignNodeGridSignature = '';
  }

  function createCampaignStageSession() {
    return {
      leftBallCount: 0,
      rightBallCount: 0,
      operations: 0,
      completed: false
    };
  }

  function resetCampaignStageSession() {
    campaignStageSession = createCampaignStageSession();
    campaignStageFeedback = '';
    campaignStageFeedbackType = '';
    campaignDragSource = null;
    campaignBoardSignature = '';
  }

  function updateResourceDisplay() {
    const fmt = n => (n < 1000 ? n.toFixed(1) : Utils.formatNumber(n));
    THINKING_EL.textContent = fmt(Resources.thinkingPower);
    FOCUS_EL.textContent = fmt(Resources.focusPower);
    if (INSPIRATION_EL) INSPIRATION_EL.textContent = fmt(Resources.inspiration);

    const act = Resources.currentActivity;
    const thinkingRate = act === 'thinking' ? 1 : 0;
    const focusRate = act === 'focus' ? 1 : 0;
    if (THINKING_RATE_EL) {
      THINKING_RATE_EL.textContent = thinkingRate + '/s';
      THINKING_RATE_EL.classList.toggle('rate-active', thinkingRate > 0);
    }
    if (FOCUS_RATE_EL) {
      FOCUS_RATE_EL.textContent = focusRate + '/s';
      FOCUS_RATE_EL.classList.toggle('rate-active', focusRate > 0);
    }

    const focusUnlocked = Resources.isFocusUnlocked();
    [FOCUS_RESOURCE, BTN_FOCUS].forEach((el) => {
      if (focusUnlocked) {
        if (el.classList.contains('locked')) {
          el.classList.remove('locked');
          el.classList.add('revealed');
        }
      } else {
        el.classList.add('locked');
        el.classList.remove('revealed');
      }
    });
    if (focusUnlocked) BTN_FOCUS.disabled = false;

    const systemsUnlocked = Resources.inspirationEverDropped || Resources.skilltreeEverUnlocked;
    const skilltreeTabUnlocked = Resources.isSkilltreeUnlocked();
    const skilltreeLayerUnlocked = Resources.isSkilltreeLayerUnlocked();
    [document.getElementById('inspiration-resource'), document.getElementById('tab-campaign'), document.getElementById('tab-skilltree'), document.getElementById('attr-inspiration-rate')].forEach((el) => {
      if (!el) return;
      if (systemsUnlocked) {
        el.classList.remove('locked');
        el.classList.add('revealed');
      } else {
        el.classList.add('locked');
        el.classList.remove('revealed');
      }
    });
    const tabSkilltree = document.getElementById('tab-skilltree');
    if (tabSkilltree) {
      tabSkilltree.classList.toggle('skilltree-locked', !skilltreeTabUnlocked);
      tabSkilltree.disabled = !skilltreeTabUnlocked;
    }
    const tabCampaign = document.getElementById('tab-campaign');
    if (tabCampaign) {
      tabCampaign.disabled = !Resources.isCampaignUnlocked();
    }
    const ph = document.getElementById('skilltree-placeholder');
    const stc = document.getElementById('skilltree-content');
    if (ph && stc) {
      ph.classList.toggle('hidden', skilltreeLayerUnlocked);
      stc.classList.toggle('hidden', !skilltreeLayerUnlocked);
    }

    const practiceUnlocked = Resources.isPracticeUnlocked();
    const runningUnlocked = typeof Battle !== 'undefined' && Battle.runningUnlocked;
    const sectionRevealed = practiceUnlocked || runningUnlocked;
    if (PRACTICE_SECTION) {
      if (sectionRevealed) {
        if (PRACTICE_SECTION.classList.contains('locked')) {
          PRACTICE_SECTION.classList.remove('locked');
          PRACTICE_SECTION.classList.add('revealed');
        }
      } else {
        PRACTICE_SECTION.classList.add('locked');
        PRACTICE_SECTION.classList.remove('revealed');
      }
    }
  }

  function updatePracticeDisplay() {
    const learned = Resources.practiceLearned;
    if (PRACTICE_DISPLAY) PRACTICE_DISPLAY.classList.toggle('hidden', !learned);
    const btnWrap = document.getElementById('practice-buttons');
    const hasResearchToShow = !learned ||
      (typeof Battle !== 'undefined' && (
        (Battle.runningUnlocked && !Battle.runningLearned) ||
        (Battle.autoPracticeUnlocked && !Battle.autoPracticeLearned)
      ));
    if (btnWrap) btnWrap.classList.toggle('hidden', !hasResearchToShow);

    const btnLearnRunning = document.getElementById('btn-learn-running');
    if (btnLearnRunning) {
      const showRunning = typeof Battle !== 'undefined' && Battle.runningUnlocked && !Battle.runningLearned;
      if (showRunning) {
        btnLearnRunning.classList.remove('locked');
        btnLearnRunning.classList.add('revealed');
      } else {
        btnLearnRunning.classList.add('locked');
        btnLearnRunning.classList.remove('revealed');
      }
    }

    /* 研究按钮：练习学会后隐藏；条件满足时高亮，不满足时灰色 */
    const btnPractice = document.getElementById('btn-learn-practice');
    if (btnPractice) {
      btnPractice.classList.toggle('research-done-hidden', learned);
      if (!learned) {
        const canPractice = Resources.thinkingPower >= 20 && Resources.focusPower >= 20;
        btnPractice.classList.toggle('reqs-not-met', !canPractice);
      }
    }
    const btnRunResearch = document.getElementById('btn-learn-running');
    if (btnRunResearch) {
      const canRun = Resources.thinkingPower >= 15 && Resources.focusPower >= 15;
      btnRunResearch.classList.toggle('reqs-not-met', !canRun);
    }
    const btnAutoPractice = document.getElementById('btn-learn-autopractice');
    if (btnAutoPractice) {
      const showAuto = typeof Battle !== 'undefined' && Battle.autoPracticeUnlocked && !Battle.autoPracticeLearned;
      btnAutoPractice.classList.toggle('research-done-hidden', Battle.autoPracticeLearned);
      if (showAuto) {
        btnAutoPractice.classList.remove('locked');
        btnAutoPractice.classList.add('revealed');
        const canAuto = Resources.thinkingPower >= 30 && Resources.focusPower >= 30;
        btnAutoPractice.classList.toggle('reqs-not-met', !canAuto);
      } else if (!Battle.autoPracticeLearned) {
        btnAutoPractice.classList.add('locked');
        btnAutoPractice.classList.remove('revealed');
      }
    }

    const btnCollectRunning = document.getElementById('btn-collect-running');
    if (btnCollectRunning) {
      const showRunningBtn = typeof Battle !== 'undefined' && Battle.runningLearned;
      if (showRunningBtn) {
        btnCollectRunning.classList.remove('locked');
        btnCollectRunning.classList.add('revealed');
        const canRun = Battle.isRecovering && !Battle.isInBattle;
        btnCollectRunning.disabled = !canRun;
        btnCollectRunning.classList.toggle('reqs-not-met', !canRun);
      } else {
        btnCollectRunning.classList.add('locked');
        btnCollectRunning.classList.remove('revealed');
      }
    }
    if (learned) {
      PLACEHOLDER.classList.add('hidden');
      ACTIVITY_DISPLAY.classList.add('hidden');
    }
  }

  function updateAttributesDisplay() {
    if (!Resources.practiceLearned) return;
    const ids = ['attr-siwei', 'attr-zhishi', 'attr-shousu', 'attr-mali', 'attr-naili'];
    const baseVals = [Attributes.siwei, Attributes.zhishi, Attributes.shousu, Attributes.mali, Attributes.naili];
    const bonus = typeof SkillTree !== 'undefined' ? SkillTree.getBonuses() : { siwei: 0, zhishi: 0, shousu: 0, mali: 0, naili: 0 };
    const keys = ['siwei', 'zhishi', 'shousu', 'mali', 'naili'];
    ids.forEach((id, i) => {
      const el = document.getElementById(id);
      if (el) {
        const total = baseVals[i] + (bonus[keys[i]] ?? 0);
        el.textContent = total % 1 ? total.toFixed(1) : total;
      }
    });
    const rateEl = document.getElementById('attr-inspiration-rate-val');
    if (rateEl && typeof Battle !== 'undefined') {
      rateEl.textContent = Math.round(Battle.INSPIRATION_DROP_RATE * 100) + '%';
    }
  }

  function updateCombatDisplay() {
    if (!Resources.practiceLearned) return;
    const btnChallenge = document.getElementById('btn-challenge');
    const cur = Exam.getCurrentQuestion();
    const maxHp = Attributes.getHp();
    const hpZero = Battle.currentHp <= 0;
    const canChallenge = !hpZero && !Battle.isInBattle && !Battle.isRecovering && cur != null;

    if (btnChallenge) {
      btnChallenge.disabled = !canChallenge;
      btnChallenge.classList.toggle('challenge-disabled', hpZero);
    }

    const btnAutoChallenge = document.getElementById('btn-auto-challenge');
    if (btnAutoChallenge) {
      const showAutoBtn = Battle.autoPracticeLearned;
      btnAutoChallenge.classList.toggle('hidden', !showAutoBtn);
      if (showAutoBtn) {
        btnAutoChallenge.classList.toggle('auto-challenge-on', Battle.autoChallengeOn);
        btnAutoChallenge.classList.toggle('auto-challenge-off', !Battle.autoChallengeOn);
        btnAutoChallenge.textContent = Battle.autoChallengeOn ? '自动练习' : '关闭自动练习';
        btnAutoChallenge.title = Battle.autoChallengeOn ? '点击关闭自动练习' : '点击开启自动练习';
      }
    }

    const atkSelf = document.getElementById('combat-atk-self');
    const hpFillSelf = document.getElementById('hp-fill-self');
    const hpTextSelf = document.getElementById('hp-text-self');
    const questionLabel = document.getElementById('combat-question-label');
    const atkEnemy = document.getElementById('combat-atk-enemy');
    const hpFillEnemy = document.getElementById('hp-fill-enemy');
    const hpTextEnemy = document.getElementById('hp-text-enemy');

    const selfAtk = Attributes.getAttack();
    if (atkSelf) atkSelf.textContent = Utils.formatCombatNum(selfAtk);
    if (hpFillSelf) hpFillSelf.style.width = Math.max(0, (Battle.currentHp / maxHp) * 100) + '%';
    if (hpTextSelf) hpTextSelf.textContent = Utils.formatCombatNum(Math.max(0, Battle.currentHp)) + '/' + Utils.formatCombatNum(maxHp);

    if (Battle.isInBattle && Battle.battleExamIndex != null && Battle.battleQuestionIndex != null) {
      const e = Battle.battleExamIndex;
      const q = Battle.battleQuestionIndex;
      if (questionLabel) questionLabel.textContent = Exam.getQuestionLabel(q);
      if (atkEnemy) atkEnemy.textContent = Utils.formatCombatNum(Exam.getQuestionAttack(e, q));
      if (hpFillEnemy) hpFillEnemy.style.width = Math.max(0, (Battle.battleEnemyHp / Battle.battleEnemyMaxHp) * 100) + '%';
      if (hpTextEnemy) hpTextEnemy.textContent = Utils.formatCombatNum(Math.max(0, Battle.battleEnemyHp)) + '/' + Utils.formatCombatNum(Battle.battleEnemyMaxHp);
    } else if (cur != null) {
      const qAtk = Exam.getQuestionAttack(cur.examIndex, cur.questionIndex);
      const qHp = Exam.getQuestionCurrentHp(cur.examIndex, cur.questionIndex);
      const qMax = Exam.getQuestionHp(cur.examIndex, cur.questionIndex);
      if (questionLabel) questionLabel.textContent = Exam.getQuestionLabel(cur.questionIndex);
      if (atkEnemy) atkEnemy.textContent = Utils.formatCombatNum(qAtk);
      if (hpFillEnemy) hpFillEnemy.style.width = Math.max(0, (qHp / qMax) * 100) + '%';
      if (hpTextEnemy) hpTextEnemy.textContent = Utils.formatCombatNum(Math.max(0, qHp)) + '/' + Utils.formatCombatNum(qMax);
    } else {
      if (questionLabel) questionLabel.textContent = '—';
      if (atkEnemy) atkEnemy.textContent = '0';
      if (hpFillEnemy) hpFillEnemy.style.width = '0%';
      if (hpTextEnemy) hpTextEnemy.textContent = '—';
    }
  }

  function updateBattleLog() {
    const el = document.getElementById('battle-log');
    if (!el) return;
    const intro = Exam.BATTLE_LOG_INTRO;
    const maxEvents = Exam.BATTLE_LOG_MAX_EVENTS;
    const log = Exam.battleLog || '';
    const escape = (s) => String(s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const lines = log.split('\n').filter(Boolean);
    let events = [];
    if (lines[0] === intro) {
      events = lines.slice(1);
    } else {
      events = lines;
    }
    events = events.slice(-maxEvents);
    const parts = ['<span class="battle-log-intro">' + escape(intro) + '</span>'];
    events.forEach((line) => parts.push(escape(line)));
    el.innerHTML = parts.join('<br>');
  }

  function renderExamLabel() {
    const el = document.getElementById('exam-label');
    if (el) el.textContent = '试卷' + (Exam.unlockedExamIndex + 1);
  }

  function renderQuestionsGrid() {
    const container = document.getElementById('questions-grid');
    if (!container) return;

    container.innerHTML = '';
    const examIdx = Exam.unlockedExamIndex;
    const cur = Exam.getCurrentQuestion();

    for (let i = 0; i < Exam.QUESTIONS_PER_EXAM; i++) {
      const span = document.createElement('span');
      span.className = 'question-chip' + (Exam.completed[examIdx]?.[i] ? ' completed' : '') +
        (cur && cur.examIndex === examIdx && cur.questionIndex === i ? ' current' : '');
      const isExam1E = examIdx === 0 && i === 4;
      const showBook = isExam1E && !Exam.completed[0]?.[4];
      if (showBook) {
        span.classList.add('question-chip-book', 'tooltip-btn');
        span.setAttribute('data-tooltip', '下一题');
        span.innerHTML = '<span class="question-book-icon">📖</span>';
      } else {
        span.textContent = '';
      }
      container.appendChild(span);
    }
  }

  function updateExamDisplay() {
    if (!Resources.practiceLearned) return;
    renderExamLabel();
    renderQuestionsGrid();
    updateCombatDisplay();
    updateBattleLog();
  }

  function updateActivityDisplay() {
    const act = Resources.currentActivity;
    const learned = Resources.practiceLearned;

    if (BTN_THINKING) BTN_THINKING.classList.toggle('active', act === 'thinking');
    if (BTN_FOCUS) BTN_FOCUS.classList.toggle('active', act === 'focus');
    const btnRunning = document.getElementById('btn-collect-running');
    if (btnRunning) btnRunning.classList.toggle('active', act === 'running');

    if (learned) {
      PLACEHOLDER.classList.add('hidden');
      ACTIVITY_DISPLAY.classList.add('hidden');
      if (act === 'thinking') CURRENT_ACTIVITY_EL.textContent = '正在收集思维力...';
      else if (act === 'focus') CURRENT_ACTIVITY_EL.textContent = '正在收集专注力...';
      else if (act === 'running') CURRENT_ACTIVITY_EL.textContent = '正在跑步恢复...';
      else CURRENT_ACTIVITY_EL.textContent = '空闲中...';
      return;
    }

    if (act === 'thinking') {
      CURRENT_ACTIVITY_EL.textContent = '正在收集思维力...';
      PLACEHOLDER.classList.add('hidden');
      ACTIVITY_DISPLAY.classList.remove('hidden');
      ACTIVITY_TEXT.textContent = '牛客娘正在思考...';
      ACTIVITY_RATE.textContent = '';
      if (AVATAR_IMG) AVATAR_IMG.src = 'pics/learning.png';
    } else if (act === 'focus') {
      CURRENT_ACTIVITY_EL.textContent = '正在收集专注力...';
      PLACEHOLDER.classList.add('hidden');
      ACTIVITY_DISPLAY.classList.remove('hidden');
      ACTIVITY_TEXT.textContent = '牛客娘正在专注学习...';
      ACTIVITY_RATE.textContent = '';
      if (AVATAR_IMG) AVATAR_IMG.src = 'pics/learning.png';
    } else {
      CURRENT_ACTIVITY_EL.textContent = '空闲中...';
      PLACEHOLDER.classList.remove('hidden');
      ACTIVITY_DISPLAY.classList.add('hidden');
    }
  }

  function updateCampaignDisplay() {
    const summary = document.getElementById('campaign-summary-text');
    const mapView = document.getElementById('campaign-map-view');
    const stageView = document.getElementById('campaign-stage-view');
    const mapDesc = document.getElementById('campaign-map-description');
    const mapMeta = document.getElementById('campaign-map-meta');
    const nodeGrid = document.getElementById('campaign-node-grid');
    const totalStarsEl = document.getElementById('campaign-total-stars');
    const totalStarsValueEl = document.getElementById('campaign-total-stars-value');
    const title = document.getElementById('campaign-title');
    const kicker = document.getElementById('campaign-kicker');
    const description = document.getElementById('campaign-description');
    const feedback = document.getElementById('campaign-feedback');
    const reward = document.getElementById('campaign-reward');
    const stageStats = document.querySelector('.campaign-stage-stats');
    const opCountEl = document.getElementById('campaign-op-count');
    const bestOpEl = document.getElementById('campaign-best-op');
    const starRuleEl = document.getElementById('campaign-star-rule');
    const balanceBoard = document.getElementById('campaign-balance-board');
    const leftZone = document.getElementById('campaign-left-zone');
    const rightZone = document.getElementById('campaign-right-zone');
    const stockZone = document.getElementById('campaign-stock-zone');

    const def = Campaign.getStageDef();
    const state = Campaign.getStageState();
    const totalStars = Campaign.getTotalStars();
    const totalAtkBonus = totalStars;
    const totalHpBonus = totalStars;

    if (summary) {
      summary.textContent = Resources.isCampaignUnlocked()
        ? '右侧显示关卡地图。点击小方块进入关卡。'
        : '首次获得灵感后解锁关卡系统。';
    }
    if (totalStarsValueEl) totalStarsValueEl.textContent = totalStars;
    if (totalStarsEl) {
      totalStarsEl.setAttribute('data-tooltip', `攻击 +${totalAtkBonus}%\n血量 +${totalHpBonus}%`);
    }
    if (mapDesc) {
      mapDesc.textContent = '点击小方块进入关卡。';
    }
    if (mapMeta) mapMeta.textContent = '';

    const isCampaignPanel = activePanel === 'campaign';
    if (CAMPAIGN_DISPLAY) CAMPAIGN_DISPLAY.classList.toggle('hidden', !isCampaignPanel);
    if (!isCampaignPanel) return;

    PLACEHOLDER.classList.add('hidden');
    ACTIVITY_DISPLAY.classList.add('hidden');
    PRACTICE_DISPLAY.classList.add('hidden');
    if (mapView) mapView.classList.toggle('hidden', campaignStageViewOpen);
    if (stageView) stageView.classList.toggle('hidden', !campaignStageViewOpen);
    if (!campaignStageViewOpen && campaignMapDirty) {
      renderCampaignNodeGrid(nodeGrid);
    }
    if (!campaignStageViewOpen || !def) return;

    if (kicker) kicker.textContent = def.chapterName;
    if (title) title.textContent = (def.label ? def.label + ' · ' : '') + def.stageName;
    if (description) description.textContent = def.goalText || def.description;
    if (reward) {
      reward.textContent = '';
      reward.classList.add('hidden');
    }
    if (opCountEl) opCountEl.textContent = campaignStageSession.operations;
    if (bestOpEl) bestOpEl.textContent = state.bestOps == null ? '-' : state.bestOps;
    if (starRuleEl) starRuleEl.textContent = '<= ' + (def.starOpLimit ?? '-') + ' 次';
    if (feedback) {
      feedback.classList.remove('success', 'error');
      if (campaignStageFeedbackType) feedback.classList.add(campaignStageFeedbackType);
      feedback.textContent = campaignStageFeedback;
    }

    const isBalanceStage = def.gameType === 'balance_drag';
    if (stageStats) stageStats.classList.toggle('hidden', !isBalanceStage);
    if (balanceBoard) balanceBoard.classList.toggle('hidden', !isBalanceStage);
    if (leftZone?.parentElement) leftZone.parentElement.classList.toggle('hidden', !isBalanceStage);
    if (rightZone?.parentElement) rightZone.parentElement.classList.toggle('hidden', !isBalanceStage);
    if (stockZone?.parentElement?.parentElement) stockZone.parentElement.parentElement.classList.toggle('hidden', !isBalanceStage);
    if (!isBalanceStage) {
      if (feedback) {
        feedback.classList.remove('success', 'error');
        feedback.textContent = '该关卡内容正在制作中。';
      }
      return;
    }

    const totalRightCount = 2 + campaignStageSession.rightBallCount;
    updateCampaignBalanceAnimation(balanceBoard, campaignStageSession.leftBallCount, totalRightCount);
    const boardSignature = JSON.stringify({
      stageId: def.id,
      leftBallCount: campaignStageSession.leftBallCount,
      rightBallCount: campaignStageSession.rightBallCount,
      completed: campaignStageSession.completed
    });
    if (campaignBoardSignature !== boardSignature) {
      campaignBoardSignature = boardSignature;
      renderCampaignLeftZone(leftZone, campaignStageSession.leftBallCount);
      renderCampaignRightZone(rightZone, campaignStageSession.rightBallCount);
      renderCampaignStockZone(stockZone);
    }
  }

  function renderCampaignNodeGrid(container) {
    if (!container) return;
    const stages = Campaign.getVisibleStages();
    const signature = JSON.stringify(stages.map(({ def, state, unlocked }) => ({
      id: def.id,
      cleared: !!state.cleared,
      stars: state.stars || 0,
      unlocked
    })));
    if (campaignNodeGridSignature === signature) return;

    campaignNodeGridSignature = signature;
    campaignMapDirty = false;
    container.innerHTML = '';
    stages.forEach(({ def, state, unlocked }) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'campaign-node-btn';
      if (state.cleared) button.classList.add('cleared');
      if ((state.stars || 0) > 0) button.classList.add('starred');
      if (!unlocked) button.classList.add('locked');
      button.disabled = !Resources.isCampaignUnlocked() || !unlocked;
      button.dataset.stageId = def.id;
      button.innerHTML =
        `<span class="campaign-node-label">${def.label ?? ''}</span>` +
        `<span class="campaign-node-name">${def.stageName}</span>` +
        `<span class="campaign-node-star">${(state.stars || 0) > 0 ? '⭐' : '☆'}</span>`;
      button.addEventListener('click', () => {
        if (!Resources.isCampaignUnlocked()) return;
        if (!Campaign.selectStage(def.id)) return;
        resetCampaignStageSession();
        campaignStageViewOpen = true;
        refreshUI();
      });
      container.appendChild(button);
    });
  }

  function updateCampaignBalanceAnimation(board, leftCount, rightCount) {
    if (!board) return;
    board.classList.remove('left-heavy', 'right-heavy', 'balanced');
    if (leftCount === rightCount) board.classList.add('balanced');
    else if (leftCount > rightCount) board.classList.add('left-heavy');
    else board.classList.add('right-heavy');
  }

  function createCampaignDraggableBall(zone, clickTargetZone) {
    const ball = document.createElement('div');
    ball.className = 'campaign-ball draggable';
    ball.draggable = !campaignStageSession.completed;
    ball.dataset.zone = zone;
    ball.addEventListener('dragstart', (e) => {
      if (campaignStageSession.completed) return;
      campaignDragSource = { zone };
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', zone);
      }
    });
    ball.addEventListener('dragend', () => {
      campaignDragSource = null;
    });
    ball.addEventListener('click', () => {
      if (campaignStageSession.completed) return;
      campaignDragSource = { zone };
      moveCampaignBall(clickTargetZone);
      campaignDragSource = null;
      refreshUI();
    });
    return ball;
  }

  function createCampaignPlacedBall() {
    const ball = document.createElement('div');
    ball.className = 'campaign-ball fixed';
    return ball;
  }

  function renderCampaignLeftZone(container, leftBallCount) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < leftBallCount; i++) {
      container.appendChild(createCampaignPlacedBall());
    }
  }

  function renderCampaignRightZone(container, rightBallCount) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 2; i++) {
      const fixedBall = document.createElement('div');
      fixedBall.className = 'campaign-ball fixed';
      container.appendChild(fixedBall);
    }
    for (let i = 0; i < rightBallCount; i++) {
      container.appendChild(createCampaignPlacedBall());
    }
  }

  function renderCampaignStockZone(container) {
    if (!container) return;
    container.innerHTML = '';
    for (let i = 0; i < 6; i++) {
      container.appendChild(createCampaignDraggableBall('stock', 'left'));
    }
  }

  function moveCampaignBall(targetZone) {
    if (!campaignDragSource || campaignStageSession.completed) return;
    const fromZone = campaignDragSource.zone;
    if (!fromZone || fromZone === targetZone) return;

    if (fromZone === 'stock' && targetZone === 'left') {
      campaignStageSession.leftBallCount += 1;
    } else if (fromZone === 'stock' && targetZone === 'right') {
      campaignStageSession.rightBallCount += 1;
    } else {
      return;
    }

    campaignStageSession.operations += 1;
    const totalRightCount = 2 + campaignStageSession.rightBallCount;

    if (campaignStageSession.leftBallCount === totalRightCount) {
      campaignStageSession.completed = true;
      const result = Campaign.completeStage(Campaign.selectedStageId, campaignStageSession.operations);
      campaignStageFeedbackType = 'success';
      campaignStageFeedback = result.message;
      campaignSuccessModalState = {
        operations: campaignStageSession.operations,
        starRule: '<= ' + (Campaign.getStageDef(Campaign.selectedStageId)?.starOpLimit ?? '-') + ' 次',
        gainedStars: result.gainedStars ?? 0
      };
      markCampaignMapDirty();
      openCampaignSuccessModal();
    } else {
      campaignStageFeedbackType = '';
      campaignStageFeedback = '';
    }
  }

  function openCampaignSuccessModal() {
    const modal = document.getElementById('modal-campaign-success');
    const opsEl = document.getElementById('campaign-success-ops');
    const ruleEl = document.getElementById('campaign-success-rule');
    const countEl = document.getElementById('campaign-success-star-count');
    const starsEl = document.getElementById('campaign-success-stars');
    if (!modal || !campaignSuccessModalState) return;

    if (opsEl) opsEl.textContent = campaignSuccessModalState.operations;
    if (ruleEl) ruleEl.textContent = campaignSuccessModalState.starRule;
    if (countEl) countEl.textContent = '⭐ × ' + campaignSuccessModalState.gainedStars;
    if (starsEl) {
      starsEl.textContent = campaignSuccessModalState.gainedStars > 0 ? '⭐' : '☆';
    }
    modal.classList.remove('hidden');
  }

  function closeCampaignSuccessModal(returnToMap = false) {
    const modal = document.getElementById('modal-campaign-success');
    if (modal) modal.classList.add('hidden');
    if (returnToMap) {
      campaignStageViewOpen = false;
      resetCampaignStageSession();
      markCampaignMapDirty();
      refreshUI();
    }
  }

  function setTemporaryButtonText(button, text, fallback, duration = 1500) {
    if (!button) return;
    button.textContent = text;
    setTimeout(() => {
      button.textContent = fallback;
    }, duration);
  }

  function setModalStatus(el, text) {
    if (!el) return;
    el.textContent = text;
  }

  function buildSaveFileName() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const stamp = now.getFullYear()
      + pad(now.getMonth() + 1)
      + pad(now.getDate())
      + '-'
      + pad(now.getHours())
      + pad(now.getMinutes())
      + pad(now.getSeconds());
    return `nowcodergirl-idle-save-${stamp}.txt`;
  }

  function downloadTextFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  function importSaveFromBase64(base64, modalImport, btnLoad, importStatusEl) {
    const normalized = (base64 || '').trim();
    if (!normalized) {
      setModalStatus(importStatusEl, '请先输入 Base64，或选择 txt 存档文件。');
      return false;
    }
    if (Save.importFromBase64(normalized)) {
      Game.lastAutoSave = Date.now();
      campaignStageViewOpen = false;
      campaignSuccessModalState = null;
      closeCampaignSuccessModal(false);
      resetCampaignStageSession();
      markCampaignMapDirty();
      switchPanel('daily');
      if (modalImport) modalImport.classList.add('hidden');
      setModalStatus(importStatusEl, '加载成功');
      setTemporaryButtonText(btnLoad, '加载成功', '加载');
      return true;
    }
    setModalStatus(importStatusEl, '加载失败，请检查存档内容是否正确。');
    alert('加载失败，请检查 Base64 内容是否正确');
    return false;
  }

  function updateSkillTreeDisplay() {
    if (!Resources.isSkilltreeUnlocked()) return;
    const gl = document.getElementById('skill-grammar-lv');
    const ml = document.getElementById('skill-math-lv');
    if (gl) gl.textContent = SkillTree.grammarLevel;
    if (ml) ml.textContent = SkillTree.mathLevel;
    const btnG = document.getElementById('btn-upgrade-grammar');
    const btnM = document.getElementById('btn-upgrade-math');
    if (btnG) {
      const canUpgrade = SkillTree.canUpgradeGrammar();
      btnG.disabled = !canUpgrade;
      btnG.classList.toggle('reqs-not-met', !canUpgrade);
    }
    if (btnM) {
      const canUpgrade = SkillTree.canUpgradeMath();
      btnM.disabled = !canUpgrade;
      btnM.classList.toggle('reqs-not-met', !canUpgrade);
    }
  }

  function refreshUI() {
    updateResourceDisplay();
    updatePracticeDisplay();
    updateAttributesDisplay();
    updateSkillTreeDisplay();
    updateExamDisplay();
    updateActivityDisplay();
    updateCampaignDisplay();
  }

  function gameLoop() {
    Game.tick();
    refreshUI();
  }

  function switchPanel(panelName) {
    activePanel = panelName;
    if (GAME_CONTAINER) GAME_CONTAINER.classList.toggle('campaign-mode', panelName === 'campaign');
    if (panelName === 'campaign') markCampaignMapDirty();
    const backBtn = document.getElementById('btn-panel-back');
    if (backBtn) backBtn.classList.toggle('hidden', panelName !== 'campaign');
    const tabs = {
      daily: document.getElementById('tab-daily'),
      campaign: document.getElementById('tab-campaign'),
      skilltree: document.getElementById('tab-skilltree')
    };
    const panels = {
      daily: document.getElementById('panel-daily'),
      campaign: document.getElementById('panel-campaign'),
      skilltree: document.getElementById('panel-skilltree')
    };

    Object.entries(tabs).forEach(([key, el]) => {
      if (el) el.classList.toggle('active', key === panelName);
    });
    Object.entries(panels).forEach(([key, el]) => {
      if (el) el.classList.toggle('hidden', key !== panelName);
    });

    refreshUI();
  }

  function bindEvents() {
    const tabDaily = document.getElementById('tab-daily');
    const tabCampaign = document.getElementById('tab-campaign');
    const tabSkilltree = document.getElementById('tab-skilltree');
    const btnPanelBack = document.getElementById('btn-panel-back');
    const panelDaily = document.getElementById('panel-daily');
    const panelCampaign = document.getElementById('panel-campaign');
    const panelSkilltree = document.getElementById('panel-skilltree');
    if (tabDaily && tabCampaign && tabSkilltree && panelDaily && panelCampaign && panelSkilltree) {
      tabDaily.addEventListener('click', () => {
        switchPanel('daily');
      });
      tabCampaign.addEventListener('click', () => {
        if (!Resources.isCampaignUnlocked()) return;
        switchPanel('campaign');
      });
      tabSkilltree.addEventListener('click', () => {
        if (!Resources.isSkilltreeUnlocked()) return;
        switchPanel('skilltree');
        updateSkillTreeDisplay();
      });
    }
    if (btnPanelBack) {
      btnPanelBack.addEventListener('click', () => {
        campaignStageViewOpen = false;
        switchPanel('daily');
      });
    }

    const btnUpgradeGrammar = document.getElementById('btn-upgrade-grammar');
    const btnUpgradeMath = document.getElementById('btn-upgrade-math');
    if (btnUpgradeGrammar) {
      btnUpgradeGrammar.addEventListener('click', () => {
        if (SkillTree.upgradeGrammar()) refreshUI();
      });
    }
    if (btnUpgradeMath) {
      btnUpgradeMath.addEventListener('click', () => {
        if (SkillTree.upgradeMath()) refreshUI();
      });
    }

    const campaignNodeGrid = document.getElementById('campaign-node-grid');
    const btnCampaignBack = document.getElementById('btn-campaign-back');
    const btnCampaignSuccessConfirm = document.getElementById('btn-campaign-success-confirm');
    const campaignLeftZone = document.getElementById('campaign-left-zone');
    const campaignRightZone = document.getElementById('campaign-right-zone');
    const campaignStockZone = document.getElementById('campaign-stock-zone');
    const closeCampaignStage = () => {
      campaignStageViewOpen = false;
      resetCampaignStageSession();
      refreshUI();
    };
    if (btnCampaignBack) {
      btnCampaignBack.addEventListener('click', closeCampaignStage);
    }
    if (btnCampaignSuccessConfirm) {
      btnCampaignSuccessConfirm.addEventListener('click', () => {
        closeCampaignSuccessModal(true);
      });
    }
    const modalCampaignSuccess = document.getElementById('modal-campaign-success');
    if (modalCampaignSuccess) {
      modalCampaignSuccess.addEventListener('click', (e) => {
        if (e.target === modalCampaignSuccess) closeCampaignSuccessModal(true);
      });
    }

    [campaignLeftZone, campaignRightZone, campaignStockZone].forEach((zoneEl) => {
      if (!zoneEl) return;
      zoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        if (!campaignStageSession.completed) zoneEl.classList.add('drag-over');
      });
      zoneEl.addEventListener('dragleave', () => {
        zoneEl.classList.remove('drag-over');
      });
      zoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        zoneEl.classList.remove('drag-over');
        if (!campaignDragSource) return;
        moveCampaignBall(zoneEl.dataset.zone);
        campaignDragSource = null;
        refreshUI();
      });
    });

    if (BTN_THINKING) {
      BTN_THINKING.addEventListener('click', () => {
        Resources.startCollectingThinking();
        refreshUI();
      });
    }

    if (BTN_FOCUS) {
      BTN_FOCUS.addEventListener('click', () => {
        if (Resources.startCollectingFocus()) refreshUI();
      });
    }

    const btnLearnAutoPractice = document.getElementById('btn-learn-autopractice');
    if (btnLearnAutoPractice) {
      btnLearnAutoPractice.addEventListener('click', () => {
        const costThinking = 30, costFocus = 30;
        if (Resources.thinkingPower >= costThinking && Resources.focusPower >= costFocus) {
          Resources.thinkingPower -= costThinking;
          Resources.focusPower -= costFocus;
          Battle.autoPracticeLearned = true;
          refreshUI();
        }
      });
    }

    const btnChallenge = document.getElementById('btn-challenge');
    if (btnChallenge) {
      btnChallenge.addEventListener('click', () => {
        const cur = Exam.getCurrentQuestion();
        if (!cur || Battle.currentHp <= 0 || Battle.isInBattle) return;
        if (Battle.startBattle(cur.examIndex, cur.questionIndex)) {
          updateBattleLog();
          refreshUI();
        }
      });
    }

    const btnAutoChallenge = document.getElementById('btn-auto-challenge');
    if (btnAutoChallenge) {
      btnAutoChallenge.addEventListener('click', () => {
        if (!Battle.autoPracticeLearned) return;
        Battle.autoChallengeOn = !Battle.autoChallengeOn;
        refreshUI();
      });
    }

    const btnRunning = document.getElementById('btn-collect-running');
    if (btnRunning) {
      btnRunning.addEventListener('click', () => {
        if (Resources.startRunning()) refreshUI();
      });
    }

    const btnLearnRunning = document.getElementById('btn-learn-running');
    if (btnLearnRunning) {
      btnLearnRunning.addEventListener('click', () => {
        const costThinking = 15, costFocus = 15;
        if (Resources.thinkingPower >= costThinking && Resources.focusPower >= costFocus) {
          Resources.thinkingPower -= costThinking;
          Resources.focusPower -= costFocus;
          Battle.runningLearned = true;
          refreshUI();
        }
      });
    }

    if (BTN_LEARN_PRACTICE) {
      BTN_LEARN_PRACTICE.addEventListener('click', () => {
        const costThinking = 20, costFocus = 20;
        if (Resources.thinkingPower >= costThinking && Resources.focusPower >= costFocus) {
          Resources.thinkingPower -= costThinking;
          Resources.focusPower -= costFocus;
          Resources.practiceLearned = true;
          if (Exam.battleLog === '') {
            Exam.battleLog = Exam.BATTLE_LOG_INTRO;
          }
          const btnWrap = document.getElementById('practice-buttons');
          if (btnWrap) btnWrap.classList.add('hidden');
          refreshUI();
        }
      });
    }

    const btnAutoSave = document.getElementById('btn-auto-save');
    const btnExport = document.getElementById('btn-export');
    const btnImport = document.getElementById('btn-import');
    const modalExport = document.getElementById('modal-export');
    const modalImport = document.getElementById('modal-import');
    const exportTextarea = document.getElementById('export-textarea');
    const importTextarea = document.getElementById('import-textarea');
    const exportStatusEl = document.getElementById('export-status');
    const importStatusEl = document.getElementById('import-status');
    const btnCopy = document.getElementById('btn-copy');
    const btnSaveFile = document.getElementById('btn-save-file');
    const btnLoadFile = document.getElementById('btn-load-file');
    const btnLoad = document.getElementById('btn-load');
    const importFileInput = document.getElementById('import-file-input');
    const btnCloseExport = document.getElementById('btn-close-export');
    const btnCloseImport = document.getElementById('btn-close-import');

    if (btnAutoSave) btnAutoSave.addEventListener('click', () => {
      if (Save.saveToCache()) {
        btnAutoSave.textContent = '已保存';
        setTimeout(() => { btnAutoSave.textContent = '自动保存'; }, 1500);
      }
    });

    if (btnExport) btnExport.addEventListener('click', () => {
      const base64 = Save.exportToBase64();
      exportTextarea.value = base64 || '';
      setModalStatus(exportStatusEl, '');
      modalExport.classList.remove('hidden');
    });

    if (btnImport) btnImport.addEventListener('click', () => {
      importTextarea.value = '';
      if (importFileInput) importFileInput.value = '';
      setModalStatus(importStatusEl, '');
      modalImport.classList.remove('hidden');
    });

    if (btnCopy) btnCopy.addEventListener('click', async () => {
      const text = exportTextarea.value;
      try {
        await navigator.clipboard.writeText(text);
        btnCopy.textContent = '已复制';
      } catch {
        exportTextarea.select();
        document.execCommand('copy');
        btnCopy.textContent = '已复制';
      }
      setModalStatus(exportStatusEl, '已复制到剪贴板');
      setTimeout(() => { btnCopy.textContent = '一键复制'; }, 1500);
    });

    if (btnSaveFile) btnSaveFile.addEventListener('click', () => {
      const text = exportTextarea.value.trim();
      if (!text) {
        setModalStatus(exportStatusEl, '当前没有可导出的存档内容。');
        return;
      }
      downloadTextFile(buildSaveFileName(), text);
      setModalStatus(exportStatusEl, '已开始下载 txt 存档文件');
      setTemporaryButtonText(btnSaveFile, '已保存', '保存为文件');
    });

    if (btnLoadFile && importFileInput) btnLoadFile.addEventListener('click', () => {
      importFileInput.value = '';
      importFileInput.click();
    });

    if (importFileInput) importFileInput.addEventListener('change', async (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        importTextarea.value = text.trim();
        setModalStatus(importStatusEl, `已读取文件：${file.name}`);
        importSaveFromBase64(importTextarea.value, modalImport, btnLoad, importStatusEl);
      } catch {
        setModalStatus(importStatusEl, '读取文件失败，请重试。');
        alert('读取文件失败，请确认 txt 文件可正常访问');
      }
    });

    if (btnLoad) btnLoad.addEventListener('click', () => {
      importSaveFromBase64(importTextarea.value, modalImport, btnLoad, importStatusEl);
    });

    if (btnCloseExport) btnCloseExport.addEventListener('click', () => modalExport.classList.add('hidden'));
    if (btnCloseImport) btnCloseImport.addEventListener('click', () => modalImport.classList.add('hidden'));

    const modalVersion = document.getElementById('modal-version');
    const btnVersion = document.getElementById('btn-version');
    const btnCloseVersion = document.getElementById('btn-close-version');
    if (btnVersion) btnVersion.addEventListener('click', () => modalVersion?.classList.remove('hidden'));
    if (btnCloseVersion) btnCloseVersion.addEventListener('click', () => modalVersion?.classList.add('hidden'));
    if (modalVersion) modalVersion.addEventListener('click', (e) => {
      if (e.target === modalVersion) modalVersion.classList.add('hidden');
    });

    const btnReset = document.getElementById('btn-reset');
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (!confirm('确定要重置所有数据吗？此操作不可恢复。')) return;
        Resources.thinkingPower = 0;
        Resources.focusPower = 0;
        Resources.inspiration = 0;
        Resources.inspirationEverDropped = false;
        Resources.skilltreeEverUnlocked = false;
        Campaign.reset();
        SkillTree.grammarLevel = 0;
        SkillTree.mathLevel = 0;
        Resources.currentActivity = null;
        Resources.practiceLearned = false;
        Resources.focusEverUnlocked = false;
        Attributes.siwei = 1;
        Attributes.zhishi = 1;
        Attributes.shousu = 1;
        Attributes.mali = 1;
        Attributes.naili = 10;
        Battle.currentHp = Attributes.getHp();
        Battle.isRecovering = false;
        Battle.runningUnlocked = false;
        Battle.runningLearned = false;
        Battle.autoPracticeUnlocked = false;
        Battle.autoPracticeLearned = false;
        Battle.autoChallengeOn = true;
        Battle.hasDefeatedOnce = false;
        Battle.victoriesWithoutDrop = 0;
        Battle.isInBattle = false;
        if (Battle.battleRoundTimer) {
          clearTimeout(Battle.battleRoundTimer);
          Battle.battleRoundTimer = null;
        }
        Exam.unlockedExamIndex = 0;
        Exam.battleLog = '';
        Exam.completed = [];
        Exam.questionRemainingHp = [];
        for (let i = 0; i < Exam.EXAM_COUNT; i++) {
          Exam.completed.push(new Array(Exam.QUESTIONS_PER_EXAM).fill(false));
          Exam.questionRemainingHp.push(new Array(Exam.QUESTIONS_PER_EXAM).fill(null));
        }
        Game.lastUpdateTime = Date.now();
        Game.lastAutoSave = Date.now();
        localStorage.removeItem(Save.CACHE_KEY);
        campaignStageViewOpen = false;
        campaignSuccessModalState = null;
        markCampaignMapDirty();
        closeCampaignSuccessModal(false);
        resetCampaignStageSession();
        const btnWrap = document.getElementById('practice-buttons');
        if (btnWrap) btnWrap.classList.remove('hidden');
        switchPanel('daily');
      });
    }

    if (modalExport) modalExport.addEventListener('click', (e) => {
      if (e.target === modalExport) modalExport.classList.add('hidden');
    });
    if (modalImport) modalImport.addEventListener('click', (e) => {
      if (e.target === modalImport) modalImport.classList.add('hidden');
    });
  }

  function buildResearchTooltip(btn) {
    const type = btn.getAttribute('data-tooltip-type');
    if (!type) return null;
    const think = Resources.thinkingPower;
    const focus = Resources.focusPower;
    let costThink = 20, costFocus = 20;
    let title = '解锁练习';
    let desc = '准备上战场了！';
    if (type === 'running') {
      costThink = 15;
      costFocus = 15;
      title = '解锁跑步';
      desc = '受伤恢复更快！';
    } else if (type === 'autopractice') {
      costThink = 30;
      costFocus = 30;
      title = '解锁自动练习';
      desc = '体力回满时自动开始练习！';
    }
    const thinkMet = think >= costThink;
    const focusMet = focus >= costFocus;
    const span = (text, met) => `<span class="${met ? 'req-met' : 'req-unmet'}">${text}</span>`;
    return `${title}\n${desc}\n消耗 ${span('思维力×' + costThink, thinkMet)} ${span('专注力×' + costFocus, focusMet)}`;
  }

  function buildSkillTreeTooltip(btn) {
    const type = btn.getAttribute('data-tooltip-type');
    if (!type) return null;
    const span = (text, met) => `<span class="${met ? 'req-met' : 'req-unmet'}">${text}</span>`;
    if (type === 'skill-grammar') {
      const c = SkillTree.getGrammarCost();
      const inspMet = Resources.inspiration >= c.inspiration;
      const focusMet = Resources.focusPower >= c.focus;
      return `语法好，代码不报错！\n手速+0.1 知识点+0.1 耐力+1\n${span('灵感 ×' + c.inspiration, inspMet)} ${span('专注力 ×' + c.focus, focusMet)}`;
    }
    if (type === 'skill-math') {
      const c = SkillTree.getMathCost();
      const inspMet = Resources.inspiration >= c.inspiration;
      const thinkMet = Resources.thinkingPower >= c.thinking;
      return `数学是算法之母！\n思维+0.2 知识点+0.2\n${span('灵感 ×' + c.inspiration, inspMet)} ${span('思维力 ×' + c.thinking, thinkMet)}`;
    }
    return null;
  }

  function initTooltips() {
    const tooltipEl = document.getElementById('tooltip-floating');
    if (!tooltipEl) return;
    const GAP = 8;
    const MARGIN = 10;

    document.addEventListener('mouseover', (e) => {
      const btn = e.target.closest('.tooltip-btn');
      if (!btn) return;
      const content = btn.getAttribute('data-tooltip');
      if (!content || btn.classList.contains('tooltip-research') || btn.classList.contains('tooltip-skilltree') || btn.classList.contains('tooltip-multiline')) return;
      tooltipEl.textContent = content;
      tooltipEl.classList.add('visible');
      const rect = btn.getBoundingClientRect();
      let left = rect.left + rect.width / 2;
      let top = rect.bottom + GAP;
      tooltipEl.style.left = left + 'px';
      tooltipEl.style.top = top + 'px';
      tooltipEl.style.transform = 'translate(-50%, 0)';
      tooltipEl.style.maxWidth = Math.min(280, window.innerWidth - MARGIN * 2) + 'px';
      requestAnimationFrame(() => {
        const tt = tooltipEl.getBoundingClientRect();
        let x = left - tt.width / 2;
        let y = top;
        if (x < MARGIN) x = MARGIN;
        if (x + tt.width > window.innerWidth - MARGIN) x = window.innerWidth - tt.width - MARGIN;
        if (y + tt.height > window.innerHeight - MARGIN) {
          y = rect.top - tt.height - GAP;
          if (y < MARGIN) y = MARGIN;
        }
        if (y < MARGIN) y = rect.bottom + GAP;
        tooltipEl.style.left = x + 'px';
        tooltipEl.style.top = y + 'px';
        tooltipEl.style.transform = 'none';
      });
    });
    document.addEventListener('mouseout', (e) => {
      if (e.relatedTarget?.closest('.tooltip-btn')) return;
      const btn = e.target.closest('.tooltip-btn');
      if (btn) {
        tooltipEl.classList.remove('visible');
        tooltipEl.textContent = '';
      }
    });

    document.querySelectorAll('.tooltip-btn').forEach((btn) => {
      btn.addEventListener('mouseenter', (e) => {
        let content;
        if (btn.classList.contains('tooltip-research')) {
          content = buildResearchTooltip(btn);
        } else if (btn.classList.contains('tooltip-skilltree')) {
          content = buildSkillTreeTooltip(btn);
        } else {
          content = btn.getAttribute('data-tooltip');
        }
        if (!content) return;
        if (btn.classList.contains('tooltip-research') || btn.classList.contains('tooltip-skilltree') || btn.classList.contains('tooltip-multiline')) {
          tooltipEl.innerHTML = content.replace(/\n/g, '<br>');
        } else {
          tooltipEl.textContent = content;
        }
        tooltipEl.classList.add('visible');

        const rect = btn.getBoundingClientRect();
        let left = rect.left + rect.width / 2;
        let top = rect.bottom + GAP;

        tooltipEl.style.left = left + 'px';
        tooltipEl.style.top = top + 'px';
        tooltipEl.style.transform = 'translate(-50%, 0)';
        tooltipEl.style.maxWidth = Math.min(280, window.innerWidth - MARGIN * 2) + 'px';

        requestAnimationFrame(() => {
          const tt = tooltipEl.getBoundingClientRect();
          let x = left - tt.width / 2;
          let y = top;

          if (x < MARGIN) x = MARGIN;
          if (x + tt.width > window.innerWidth - MARGIN) x = window.innerWidth - tt.width - MARGIN;
          if (y + tt.height > window.innerHeight - MARGIN) {
            y = rect.top - tt.height - GAP;
            if (y < MARGIN) y = MARGIN;
          }
          if (y < MARGIN) y = rect.bottom + GAP;

          tooltipEl.style.left = x + 'px';
          tooltipEl.style.top = y + 'px';
          tooltipEl.style.transform = 'none';
        });
      });

      btn.addEventListener('mouseleave', () => {
        tooltipEl.classList.remove('visible');
        tooltipEl.innerHTML = '';
        tooltipEl.textContent = '';
      });
    });
  }

  function start() {
    Game.init();
    bindEvents();
    initTooltips();
    refreshUI();

    setInterval(gameLoop, 100);
    window.addEventListener('beforeunload', () => Save.saveToCache());
  }

  start();
})();
