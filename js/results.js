// results.js — Calcul de la note et affichage du corrigé

function calculateScore(answersMap = answers) {
  let correct = 0;
  QUESTIONS.forEach(q => {
    if (answersMap[q.id] === q.answer) correct++;
  });
  const total = QUESTIONS.length;
  const percent = Math.round((correct / total) * 100);
  return { correct, total, percent };
}

function getGradeLabel(percent) {
  if (percent === 100) return 'Excellent';
  if (percent >= 75) return 'Très bien';
  if (percent >= 50) return 'Bien';
  if (percent >= 25) return 'À améliorer';
  return 'À retravailler';
}

function buildGabaritoHtml(answersMap = answers) {
  return QUESTIONS.map((q, i) => {
    const userAnswer = answersMap[q.id];
    const isCorrect = userAnswer === q.answer;
    const userLabel = userAnswer === true ? 'Vrai' : userAnswer === false ? 'Faux' : '—';
    const correctLabel = q.answer ? 'Vrai' : 'Faux';

    return `
      <article class="gabarito-item ${isCorrect ? 'gabarito-item--correct' : 'gabarito-item--wrong'}">
        <header class="gabarito-item__header">
          <span class="gabarito-item__num">${String(i + 1).padStart(2, '0')}</span>
          <span class="gabarito-item__status" aria-label="${isCorrect ? 'Correct' : 'Incorrect'}">
            ${isCorrect ? '✓' : '✗'}
          </span>
        </header>
        <p class="gabarito-item__question">${q.text}</p>
        <div class="gabarito-item__answers">
          <span class="gabarito-item__your">Votre réponse : <strong>${userLabel}</strong></span>
          <span class="gabarito-item__correct">Réponse correcte : <strong>${correctLabel}</strong></span>
        </div>
        <p class="gabarito-item__explanation">${q.explanation}</p>
      </article>`;
  }).join('');
}

function showResults() {
  hideAllScreens();
  const screen = document.getElementById('results-screen');
  if (!screen) return;
  screen.classList.remove('hidden');

  const score = calculateScore();
  const grade = getGradeLabel(score.percent);
  const name = userName.trim() || 'Étudiant·e';

  const nameEl = document.getElementById('result-name');
  const scoreEl = document.getElementById('result-score');
  const gradeEl = document.getElementById('result-grade');
  const detailEl = document.getElementById('result-detail');
  const gabaritoEl = document.getElementById('gabarito-list');
  const ringEl = document.getElementById('score-ring');

  if (nameEl) nameEl.textContent = name;
  if (scoreEl) scoreEl.textContent = `${score.percent}%`;
  if (gradeEl) gradeEl.textContent = grade;
  if (detailEl) detailEl.textContent = `${score.correct} sur ${score.total} réponses correctes`;
  if (gabaritoEl) gabaritoEl.innerHTML = buildGabaritoHtml();
  if (ringEl) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score.percent / 100) * circumference;
    ringEl.style.strokeDasharray = `${circumference}`;
    ringEl.style.strokeDashoffset = `${offset}`;
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}