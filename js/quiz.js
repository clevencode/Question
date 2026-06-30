// quiz.js — Logique du questionnaire Vrai/Faux

const AUTO_ADVANCE_MS = 450;
let advanceTimeout = null;
let isAdvancing = false;

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

function syncAdvanceDuration() {
  document.documentElement.style.setProperty('--advance-ms', `${AUTO_ADVANCE_MS}ms`);
}

function updateAnswerButtons(selectedValue) {
  const btnTrue = document.getElementById('btn-true');
  const btnFalse = document.getElementById('btn-false');

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
  const total = QUESTIONS.length;
  const current = currentQuestionIndex + 1;
  const percent = Math.round((current / total) * 100);

  const bar = document.getElementById('progress-bar');
  const track = document.getElementById('progress-track');
  const text = document.getElementById('progress-text');
  const label = document.getElementById('progress-label');

  if (bar) bar.style.width = `${Math.max(percent, 4)}%`;
  if (track) {
    track.setAttribute('aria-valuenow', String(current));
    track.setAttribute('aria-valuemax', String(total));
  }
  if (text) text.textContent = `${current}/${total}`;
  if (label) label.textContent = `Question ${current} sur ${total}`;
}

function renderQuestion({ animate = true } = {}) {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question) return;

  const card = document.getElementById('question-card');
  const numEl = document.getElementById('question-number');
  const textEl = document.getElementById('question-text');
  const btnPrev = document.getElementById('btn-prev');

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
  document.getElementById('btn-true')?.toggleAttribute('disabled', disabled);
  document.getElementById('btn-false')?.toggleAttribute('disabled', disabled);
}

function clearAdvanceTimeout() {
  if (advanceTimeout) {
    clearTimeout(advanceTimeout);
    advanceTimeout = null;
  }

  isAdvancing = false;
  setAnswerButtonsDisabled(false);
  document.getElementById('question-card')?.classList.remove('question-card--advancing');

  const question = QUESTIONS[currentQuestionIndex];
  if (question) updateAnswerButtons(answers[question.id]);
}

function scheduleAutoAdvance() {
  clearAdvanceTimeout();
  isAdvancing = true;
  setAnswerButtonsDisabled(true);
  document.getElementById('question-card')?.classList.add('question-card--advancing');

  advanceTimeout = setTimeout(() => {
    advanceTimeout = null;
    isAdvancing = false;
    setAnswerButtonsDisabled(false);
    document.getElementById('question-card')?.classList.remove('question-card--advancing');
    nextQuestion();
  }, AUTO_ADVANCE_MS);
}

function selectAnswer(value) {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question || isAdvancing) return;

  answers[question.id] = value;

  const btnTrue = document.getElementById('btn-true');
  const btnFalse = document.getElementById('btn-false');
  const selectedBtn = value ? btnTrue : btnFalse;

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
    document.getElementById('btn-true')?.focus();
  } else {
    showResults();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
}

syncAdvanceDuration();