// quiz.js — Logique du questionnaire Vrai/Faux

const AUTO_ADVANCE_MS = 450;
let advanceTimeout = null;
let isAdvancing = false;

const QuizUI = { ready: false };

const QuizFlow = {
  isValidAnswer(value) {
    return value === true || value === false;
  },

  isQuestionAnswered(questionId, answersMap = answers) {
    return this.isValidAnswer(answersMap[questionId]);
  },

  getAnsweredCount(answersMap = answers, questions = QUESTIONS) {
    return questions.filter(q => this.isQuestionAnswered(q.id, answersMap)).length;
  },

  canAdvanceFrom(index, answersMap = answers, questions = QUESTIONS) {
    const question = questions[index];
    if (!question) return false;
    return this.isQuestionAnswered(question.id, answersMap);
  },

  canComplete(answersMap = answers, questions = QUESTIONS) {
    return this.getAnsweredCount(answersMap, questions) === questions.length;
  }
};

function initQuizUI() {
  if (QuizUI.ready) return;

  QuizUI.card = document.getElementById('question-card');
  QuizUI.numEl = document.getElementById('question-number');
  QuizUI.textEl = document.getElementById('question-text');
  QuizUI.btnTrue = document.getElementById('btn-true');
  QuizUI.btnFalse = document.getElementById('btn-false');
  QuizUI.btnPrev = document.getElementById('btn-prev');
  QuizUI.progressBar = document.getElementById('progress-bar');
  QuizUI.progressTrack = document.getElementById('progress-track');
  QuizUI.progressText = document.getElementById('progress-text');
  QuizUI.progressLabel = document.getElementById('progress-label');
  QuizUI.ready = true;
}

function syncAdvanceDuration() {
  document.documentElement.style.setProperty('--advance-ms', `${AUTO_ADVANCE_MS}ms`);
}

function updateAnswerButtons(selectedValue) {
  initQuizUI();
  const { btnTrue, btnFalse } = QuizUI;

  [btnTrue, btnFalse].forEach(btn => {
    btn?.classList.remove('answer-btn--confirming', 'answer-btn--dimmed');
  });

  const isTrue = selectedValue === true;
  const isFalse = selectedValue === false;

  btnTrue?.classList.toggle('answer-btn--selected', isTrue);
  btnFalse?.classList.toggle('answer-btn--selected', isFalse);
  btnTrue?.classList.toggle('answer-btn--dimmed', isFalse);
  btnFalse?.classList.toggle('answer-btn--dimmed', isTrue);

  btnTrue?.setAttribute('aria-pressed', String(isTrue));
  btnFalse?.setAttribute('aria-pressed', String(isFalse));
}

function updateProgress() {
  initQuizUI();
  const total = QUESTIONS.length;
  const current = currentQuestionIndex + 1;
  const percent = Math.round((current / total) * 100);

  if (QuizUI.progressBar) QuizUI.progressBar.style.width = `${Math.max(percent, 4)}%`;
  if (QuizUI.progressTrack) {
    QuizUI.progressTrack.setAttribute('aria-valuenow', String(current));
    QuizUI.progressTrack.setAttribute('aria-valuemax', String(total));
  }
  if (QuizUI.progressText) QuizUI.progressText.textContent = `${current}/${total}`;
  if (QuizUI.progressLabel) QuizUI.progressLabel.textContent = `Question ${current} sur ${total}`;
}

function renderQuestion({ animate = true } = {}) {
  initQuizUI();
  const question = QUESTIONS[currentQuestionIndex];
  if (!question) return;

  const { card, numEl, textEl, btnPrev } = QuizUI;

  if (numEl) numEl.textContent = String(currentQuestionIndex + 1).padStart(2, '0');
  if (textEl) textEl.textContent = question.text;

  updateAnswerButtons(answers[question.id]);

  if (btnPrev) btnPrev.disabled = currentQuestionIndex === 0;

  card?.classList.remove('question-card--advancing');

  if (animate) {
    card?.classList.remove('question-card--enter');
    void card?.offsetWidth;
    card?.classList.add('question-card--enter');
  }

  updateProgress();
  announce(`Question ${currentQuestionIndex + 1} sur ${QUESTIONS.length}. ${question.text}`);
}

function setAnswerButtonsDisabled(disabled) {
  initQuizUI();
  QuizUI.btnTrue?.toggleAttribute('disabled', disabled);
  QuizUI.btnFalse?.toggleAttribute('disabled', disabled);
}

function clearAdvanceTimeout() {
  if (advanceTimeout) {
    clearTimeout(advanceTimeout);
    advanceTimeout = null;
  }

  isAdvancing = false;
  setAnswerButtonsDisabled(false);
  QuizUI.card?.classList.remove('question-card--advancing');

  const question = QUESTIONS[currentQuestionIndex];
  if (question) updateAnswerButtons(answers[question.id]);
}

function scheduleAutoAdvance() {
  clearAdvanceTimeout();
  isAdvancing = true;
  setAnswerButtonsDisabled(true);
  QuizUI.card?.classList.add('question-card--advancing');

  advanceTimeout = setTimeout(() => {
    advanceTimeout = null;
    isAdvancing = false;
    setAnswerButtonsDisabled(false);
    QuizUI.card?.classList.remove('question-card--advancing');
    nextQuestion();
  }, AUTO_ADVANCE_MS);
}

function selectAnswer(value) {
  initQuizUI();
  const question = QUESTIONS[currentQuestionIndex];
  if (!question || isAdvancing) return;

  answers[question.id] = value;

  const selectedBtn = value ? QuizUI.btnTrue : QuizUI.btnFalse;

  updateAnswerButtons(value);
  selectedBtn?.classList.remove('answer-btn--confirming');
  void selectedBtn?.offsetWidth;
  selectedBtn?.classList.add('answer-btn--confirming');

  announce(value ? 'Vrai sélectionné.' : 'Faux sélectionné.');
  scheduleAutoAdvance();
}

function goToQuestion(index) {
  if (index < 0 || index >= QUESTIONS.length) return;
  clearAdvanceTimeout();
  currentQuestionIndex = index;
  renderQuestion();
}

function nextQuestion() {
  clearAdvanceTimeout();
  if (!QuizFlow.canAdvanceFrom(currentQuestionIndex)) return;

  if (currentQuestionIndex < QUESTIONS.length - 1) {
    goToQuestion(currentQuestionIndex + 1);
    QuizUI.btnTrue?.focus();
  } else {
    showResults();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
}

syncAdvanceDuration();