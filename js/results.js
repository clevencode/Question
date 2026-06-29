// results.js — Calcul de la note et affichage du corrigé

let viewingHistoryId = null;

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

function buildGabaritoHtml(answersMap) {
  return QUESTIONS.map((q, i) => {
    const userAnswer = answersMap[q.id];
    const isCorrect = userAnswer === q.answer;

    return `
      <article class="gabarito-item ${isCorrect ? 'gabarito-item--correct' : 'gabarito-item--wrong'}" role="listitem">
        <header class="gabarito-item__header">
          <span class="gabarito-item__num">Question ${String(i + 1).padStart(2, '0')}</span>
          <span class="gabarito-item__badge">${isCorrect ? 'Correct' : 'Incorrect'}</span>
        </header>
        <p class="gabarito-item__question">${q.text}</p>
        <p class="gabarito-item__explanation">${q.explanation}</p>
      </article>`;
  }).join('');
}

function renderResultsUI({ score, answersMap }) {
  const scoreEl = document.getElementById('result-score');
  const detailEl = document.getElementById('result-detail');
  const gabaritoEl = document.getElementById('gabarito-list');
  const ringEl = document.getElementById('score-ring');

  if (scoreEl) scoreEl.textContent = `${score.percent}%`;
  if (detailEl) detailEl.textContent = `${score.correct} sur ${score.total} questions correctes`;

  if (gabaritoEl) gabaritoEl.innerHTML = buildGabaritoHtml(answersMap);

  if (ringEl) {
    const circumference = 2 * Math.PI * 54;
    const offset = circumference - (score.percent / 100) * circumference;
    ringEl.style.strokeDasharray = `${circumference}`;
    ringEl.style.strokeDashoffset = `${offset}`;
  }
}

function showResults() {
  clearAdvanceTimeout();
  viewingHistoryId = null;

  const score = calculateScore();
  const grade = getGradeLabel(score.percent);
  const name = formatStudentName(userName) || 'Étudiant·e';

  const entry = HistoryManager.createEntry({
    name,
    score,
    grade,
    answersMap: answers
  });

  HistoryManager.add(entry);
  syncResultToCloud(entry);
  updateHistoryLink(name);

  showScreen('results-screen', {
    announceMsg: `Résultat : ${score.percent}%. ${score.correct} réponses correctes sur ${score.total}.`,
    focusSelector: '#results-title'
  });

  renderResultsUI({ score, answersMap: answers });
}

async function showHistoryEntry(id) {
  let entry = HistoryManager.getById(id);

  if (!entry && userName?.trim()) {
    const entries = await HistoryManager.loadForStudent(userName);
    entry = entries.find(e => e.id === id) || null;
  }

  if (!entry) return;

  viewingHistoryId = id;

  showScreen('results-screen', {
    announceMsg: `Résultat de ${entry.name} : ${entry.percent}%.`,
    focusSelector: '#results-title'
  });

  renderResultsUI({
    score: {
      percent: entry.percent,
      correct: entry.correct,
      total: entry.total
    },
    answersMap: entry.answers
  });
}

async function renderHistoryScreen() {
  const container = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!container) return;

  const name = userName?.trim();
  const entries = name
    ? await HistoryManager.loadForStudent(name)
    : HistoryManager.load();

  if (empty) empty.classList.toggle('hidden', entries.length > 0);

  if (entries.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = entries.map(entry => `
    <article class="history-item">
      <div class="history-item__main">
        <p class="history-item__name">${entry.name}</p>
        <p class="history-item__date">${formatHistoryDate(entry.date)}</p>
      </div>
      <div class="history-item__score">
        <span class="history-item__percent">${entry.percent}%</span>
        <span class="history-item__detail">${entry.correct}/${entry.total}</span>
      </div>
      <div class="history-item__actions">
        <button type="button" class="btn btn--outline btn--sm" onclick="showHistoryEntry('${entry.id}')">
          Voir
        </button>
        <button type="button" class="btn btn--outline btn--sm" onclick="redoHistoryEntry('${entry.id}')" aria-label="Refaire le quiz pour ${entry.name}">
          Refaire
        </button>
      </div>
    </article>
  `).join('');
}

async function showHistory() {
  await renderHistoryScreen();
  showScreen('history-screen', {
    announceMsg: userName?.trim()
      ? `Historique de ${userName.trim()}.`
      : 'Historique des résultats.',
    focusSelector: '#history-title'
  });
}

async function redoHistoryEntry(id) {
  let entry = HistoryManager.getById(id);

  if (!entry && userName?.trim()) {
    const entries = await HistoryManager.loadForStudent(userName);
    entry = entries.find(e => e.id === id) || null;
  }

  if (!entry?.name) return;

  launchQuiz(entry.name);
}

