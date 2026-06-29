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

function renderQuestion() {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question) return;

  const card = document.getElementById('question-card');
  const numEl = document.getElementById('question-number');
  const textEl = document.getElementById('question-text');
  const btnTrue = document.getElementById('btn-true');
  const btnFalse = document.getElementById('btn-false');
  const btnPrev = document.getElementById('btn-prev');

  if (numEl) numEl.textContent = String(currentQuestionIndex + 1).padStart(2, '0');
  if (textEl) textEl.textContent = question.text;

  const current = answers[question.id];
  btnTrue?.classList.toggle('answer-btn--selected', current === true);
  btnFalse?.classList.toggle('answer-btn--selected', current === false);
  btnTrue?.setAttribute('aria-pressed', String(current === true));
  btnFalse?.setAttribute('aria-pressed', String(current === false));

  if (btnPrev) btnPrev.disabled = currentQuestionIndex === 0;

  card?.classList.remove('question-card--enter');
  void card?.offsetWidth;
  card?.classList.add('question-card--enter');

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
}

function scheduleAutoAdvance() {
  clearAdvanceTimeout();
  isAdvancing = true;
  setAnswerButtonsDisabled(true);

  advanceTimeout = setTimeout(() => {
    advanceTimeout = null;
    isAdvancing = false;
    setAnswerButtonsDisabled(false);
    nextQuestion();
  }, AUTO_ADVANCE_MS);
}

function selectAnswer(value) {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question || isAdvancing) return;

  answers[question.id] = value;
  renderQuestion();
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