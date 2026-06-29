// results.js — Calcul de la note et affichage du corrigé

function calculateScore(answersMap = answers) {
  let correct = 0;
  QUESTIONS.forEach(q => {
    if (answersMap[q.id] === q.answer) correct++;
  });
  const total = QUESTIONS.length;
  const percent = Math.round((correct / total) * 100);
  return { correct, total, percent, wrong: total - correct };
}

function getGradeLabel(percent) {
  if (percent === 100) return 'Excellent — toutes les réponses sont correctes !';
  if (percent >= 75) return 'Très bien — bonne compréhension du sujet.';
  if (percent >= 50) return 'Bien — relisez le corrigé pour progresser.';
  if (percent >= 25) return 'À améliorer — consultez les explications ci-dessous.';
  return 'À retravailler — relisez le contenu et réessayez.';
}

function buildGabaritoHtml(answersMap = answers) {
  return QUESTIONS.map((q, i) => {
    const userAnswer = answersMap[q.id];
    const isCorrect = userAnswer === q.answer;
    const userLabel = userAnswer === true ? 'Vrai' : userAnswer === false ? 'Faux' : '—';
    const correctLabel = q.answer ? 'Vrai' : 'Faux';

    return `
      <article class="gabarito-item ${isCorrect ? 'gabarito-item--correct' : 'gabarito-item--wrong'}" role="listitem">
        <header class="gabarito-item__header">
          <span class="gabarito-item__num">Question ${String(i + 1).padStart(2, '0')}</span>
          <span class="gabarito-item__badge">${isCorrect ? 'Correct' : 'Incorrect'}</span>
        </header>
        <p class="gabarito-item__question">${q.text}</p>
        <dl class="gabarito-item__answers">
          <div class="gabarito-item__answer-row gabarito-item__answer-row--user">
            <dt>Votre réponse</dt>
            <dd>${userLabel}</dd>
          </div>
          <div class="gabarito-item__answer-row gabarito-item__answer-row--expected">
            <dt>Réponse correcte</dt>
            <dd>${correctLabel}</dd>
          </div>
        </dl>
        <p class="gabarito-item__explanation">${q.explanation}</p>
      </article>`;
  }).join('');
}

function showResults() {
  clearAdvanceTimeout();

  const score = calculateScore();
  const grade = getGradeLabel(score.percent);
  const name = userName.trim() || 'Étudiant·e';

  showScreen('results-screen', {
    announceMsg: `Résultat : ${score.percent}%. ${score.correct} réponses correctes sur ${score.total}.`,
    focusSelector: '#results-title'
  });

  const nameEl = document.getElementById('result-name');
  const scoreEl = document.getElementById('result-score');
  const gradeEl = document.getElementById('result-grade');
  const detailEl = document.getElementById('result-detail');
  const wrongEl = document.getElementById('result-wrong-count');
  const gabaritoEl = document.getElementById('gabarito-list');
  const ringEl = document.getElementById('score-ring');

  if (nameEl) nameEl.textContent = name;
  if (scoreEl) scoreEl.textContent = `${score.percent}%`;
  if (gradeEl) gradeEl.textContent = grade;
  if (detailEl) detailEl.textContent = `${score.correct} sur ${score.total} réponses correctes`;

  if (wrongEl) {
    if (score.wrong > 0) {
      wrongEl.textContent = `${score.wrong} erreur${score.wrong > 1 ? 's' : ''} — consultez le corrigé ci-dessous.`;
      wrongEl.classList.remove('hidden');
    } else {
      wrongEl.classList.add('hidden');
    }
  }

  if (gabaritoEl) gabaritoEl.innerHTML = buildGabaritoHtml();

  if (ringEl) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score.percent / 100) * circumference;
    ringEl.style.strokeDasharray = `${circumference}`;
    ringEl.style.strokeDashoffset = `${offset}`;
  }
}