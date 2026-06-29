// quiz.js — Logique du questionnaire Vrai/Faux

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
  const answered = QuizFlow.getAnsweredCount();
  const percent = Math.round((answered / total) * 100);
  const bar = document.getElementById('progress-bar');
  const track = document.getElementById('progress-track');
  const text = document.getElementById('progress-text');

  if (bar) bar.style.width = `${answered === 0 ? 0 : Math.max(percent, 4)}%`;
  if (track) {
    track.setAttribute('aria-valuenow', String(answered));
    track.setAttribute('aria-valuemax', String(total));
  }
  if (text) text.textContent = `${answered}/${total}`;
}

function renderQuestion() {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question) return;

  const numEl = document.getElementById('question-number');
  const textEl = document.getElementById('question-text');
  const btnTrue = document.getElementById('btn-true');
  const btnFalse = document.getElementById('btn-false');
  const btnPrev = document.getElementById('btn-prev');
  const btnNext = document.getElementById('btn-next');

  if (numEl) numEl.textContent = String(currentQuestionIndex + 1).padStart(2, '0');
  if (textEl) textEl.textContent = question.text;

  const current = answers[question.id];
  btnTrue?.classList.toggle('answer-btn--selected', current === true);
  btnFalse?.classList.toggle('answer-btn--selected', current === false);

  if (btnPrev) btnPrev.disabled = currentQuestionIndex === 0;
  if (btnNext) {
    const isLast = currentQuestionIndex === QUESTIONS.length - 1;
    btnNext.textContent = isLast ? 'TERMINER' : 'SUIVANT';
    btnNext.disabled = !QuizFlow.canAdvanceFrom(currentQuestionIndex);
  }

  updateProgress();
}

function selectAnswer(value) {
  const question = QUESTIONS[currentQuestionIndex];
  if (!question) return;

  answers[question.id] = value;
  renderQuestion();
}

function goToQuestion(index) {
  if (index < 0 || index >= QUESTIONS.length) return;
  currentQuestionIndex = index;
  renderQuestion();
}

function nextQuestion() {
  if (!QuizFlow.canAdvanceFrom(currentQuestionIndex)) return;
  if (currentQuestionIndex < QUESTIONS.length - 1) {
    goToQuestion(currentQuestionIndex + 1);
  } else {
    showResults();
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) goToQuestion(currentQuestionIndex - 1);
}