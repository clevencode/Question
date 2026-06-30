// results.js — Calcul de la note et affichage du corrigé

let viewingHistoryId = null;
const SCORE_RING_CIRCUMFERENCE = 2 * Math.PI * 54;

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

function setResultsContext({ mode, name = '', date = '' }) {
  const contextEl = document.getElementById('results-context');
  const studentEl = document.getElementById('results-student');
  const primaryBtn = document.getElementById('results-primary-btn');
  const secondaryBtn = document.getElementById('results-secondary-btn');

  if (contextEl) {
    if (mode === 'history') {
      contextEl.textContent = date
        ? `Résultat enregistré le ${formatHistoryDate(date)}`
        : 'Consultation d\'un résultat enregistré';
      contextEl.classList.remove('hidden');
    } else {
      contextEl.textContent = 'Nouveau résultat enregistré';
      contextEl.classList.remove('hidden');
    }
  }

  if (studentEl) {
    if (name) {
      studentEl.textContent = name;
      studentEl.classList.remove('hidden');
    } else {
      studentEl.classList.add('hidden');
    }
  }

  if (primaryBtn) {
    primaryBtn.textContent = mode === 'history'
      ? 'Refaire le quiz'
      : 'Recommencer le quiz';
    primaryBtn.onclick = mode === 'history'
      ? () => redoHistoryEntry(viewingHistoryId, name)
      : restartQuiz;
  }

  if (secondaryBtn) {
    secondaryBtn.textContent = mode === 'history'
      ? 'Retour à l\'historique'
      : 'Voir l\'historique';
    secondaryBtn.onclick = mode === 'history' ? showHistory : showHistory;
  }
}

function setSyncStatus(synced) {
  const el = document.getElementById('result-sync');
  if (!el) return;

  if (synced) {
    el.textContent = 'Synchronisé — accessible sur tous vos appareils';
    el.classList.remove('hidden', 'result-sync--offline');
  } else if (isCloudReady()) {
    el.textContent = 'Enregistré localement — synchronisation en attente';
    el.classList.remove('hidden');
    el.classList.add('result-sync--offline');
  } else {
    el.classList.add('hidden');
  }
}

function renderResultsUI({ score, answersMap, grade = '' }) {
  const scoreEl = document.getElementById('result-score');
  const detailEl = document.getElementById('result-detail');
  const gradeEl = document.getElementById('result-grade');
  const gabaritoEl = document.getElementById('gabarito-list');
  const ringEl = document.getElementById('score-ring');

  if (scoreEl) scoreEl.textContent = `${score.percent}%`;
  if (detailEl) detailEl.textContent = `${score.correct} sur ${score.total} questions correctes`;

  if (gradeEl) {
    gradeEl.textContent = grade || getGradeLabel(score.percent);
  }

  if (gabaritoEl) gabaritoEl.innerHTML = buildGabaritoHtml(answersMap);

  if (ringEl) {
    const offset = SCORE_RING_CIRCUMFERENCE - (score.percent / 100) * SCORE_RING_CIRCUMFERENCE;
    ringEl.style.strokeDasharray = `${SCORE_RING_CIRCUMFERENCE}`;
    ringEl.style.strokeDashoffset = `${offset}`;
  }
}

async function showResults() {
  clearAdvanceTimeout();
  QuizProgress.clear();
  viewingHistoryId = null;

  const score = calculateScore();
  const grade = getGradeLabel(score.percent);
  let name = formatStudentName(userName) || 'Étudiant·e';
  name = await resolveCanonicalStudentName(name);
  userName = name;

  const entry = HistoryManager.createEntry({
    name,
    score,
    grade,
    answersMap: answers
  });

  HistoryManager.upsert(entry);
  updateHistoryLinkLocal(name);

  setResultsContext({ mode: 'fresh', name });
  setSyncStatus(false);

  showScreen('results-screen', {
    announceMsg: `Résultat : ${score.percent}%. ${score.correct} réponses correctes sur ${score.total}.`,
    focusSelector: '#results-title'
  });

  renderResultsUI({ score, answersMap: answers, grade });

  syncResultToCloud(entry).then(synced => {
    setSyncStatus(synced);
    updateHistoryLink(name);
  });
}

async function showHistoryEntry(studentKey) {
  const entry = await resolveHistoryEntry(studentKey);
  if (!entry) {
    announce('Résultat introuvable.');
    return;
  }

  viewingHistoryId = entry.studentKey;
  userName = entry.name;

  setResultsContext({ mode: 'history', name: entry.name, date: entry.date });
  setSyncStatus(isCloudReady());

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
    answersMap: entry.answers || {},
    grade: entry.grade || getGradeLabel(entry.percent)
  });
}

function formatAttemptLabel(count) {
  if (!count || count <= 1) return '';
  return `${count} tentative${count > 1 ? 's' : ''}`;
}

function buildHistoryItemHtml(entry) {
  const attempts = formatAttemptLabel(entry.attemptCount);
  const attemptsHtml = attempts
    ? `<p class="history-item__attempts">${attempts}</p>`
    : '';

  return `
    <article class="history-item" role="listitem">
      <div class="history-item__main">
        <p class="history-item__name">${entry.name}</p>
        <p class="history-item__date">${formatHistoryDate(entry.date)}</p>
        ${attemptsHtml}
      </div>
      <div class="history-item__score">
        <span class="history-item__percent">${entry.percent}%</span>
        <span class="history-item__detail">${entry.correct}/${entry.total}</span>
      </div>
      <div class="history-item__actions">
        <button
          type="button"
          class="btn btn--outline btn--sm"
          data-action="view"
          data-student-key="${escapeHtmlAttr(entry.studentKey)}"
          aria-label="Voir le résultat de ${entry.name}"
        >
          Voir
        </button>
        <button
          type="button"
          class="btn btn--outline btn--sm"
          data-action="redo"
          data-student-key="${escapeHtmlAttr(entry.studentKey)}"
          data-student-name="${escapeHtmlAttr(entry.name)}"
          aria-label="Refaire le quiz pour ${entry.name}"
        >
          Refaire
        </button>
      </div>
    </article>`;
}

function setHistoryLoading(loading) {
  const loadingEl = document.getElementById('history-loading');
  const listEl = document.getElementById('history-list');
  const emptyEl = document.getElementById('history-empty');

  loadingEl?.classList.toggle('hidden', !loading);
  if (listEl) {
    listEl.setAttribute('aria-busy', loading ? 'true' : 'false');
    if (loading) listEl.innerHTML = '';
  }
  if (loading) emptyEl?.classList.add('hidden');
}

function updateHistorySubtitle(name) {
  const subtitle = document.getElementById('history-subtitle');
  if (!subtitle) return;

  subtitle.textContent = name?.trim()
    ? `Résultats de ${name.trim()} — un seul score par nom, mis à jour à chaque tentative.`
    : 'Un score par nom d\'élève — consultez ou refaites le quiz pour progresser.';
}

async function renderHistoryScreen() {
  const container = document.getElementById('history-list');
  const empty = document.getElementById('history-empty');
  if (!container) return;

  const name = userName?.trim();
  updateHistorySubtitle(name);
  setHistoryLoading(true);

  let entries;
  try {
    entries = name
      ? await HistoryManager.loadForStudent(name)
      : HistoryManager.getUniqueStudents();
  } finally {
    setHistoryLoading(false);
  }

  if (empty) empty.classList.toggle('hidden', entries.length > 0);

  if (entries.length === 0) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = entries.map(buildHistoryItemHtml).join('');
}

function initHistoryListActions() {
  const container = document.getElementById('history-list');
  if (!container || container.dataset.bound === 'true') return;

  container.dataset.bound = 'true';
  container.addEventListener('click', async event => {
    const button = event.target.closest('[data-action]');
    if (!button || button.disabled) return;

    const studentKey = button.dataset.studentKey;
    if (!studentKey) return;

    if (button.dataset.action === 'view') {
      setButtonLoading(button, true, 'Ouverture…');
      try {
        await showHistoryEntry(studentKey);
      } finally {
        setButtonLoading(button, false);
      }
      return;
    }

    if (button.dataset.action === 'redo') {
      setButtonLoading(button, true, 'Préparation…');
      try {
        await redoHistoryEntry(studentKey, button.dataset.studentName);
      } finally {
        setButtonLoading(button, false);
      }
    }
  });
}

async function showHistory() {
  initHistoryListActions();
  setHistoryLoading(true);
  showScreen('history-screen', {
    announceMsg: userName?.trim()
      ? `Historique de ${userName.trim()}.`
      : 'Historique des résultats.',
    focusSelector: '#history-title'
  });
  await renderHistoryScreen();
}

async function clearAllHistory() {
  const students = HistoryManager.getUniqueStudents();
  const count = students.length;

  if (count === 0) return;

  const cloudNote = isCloudReady()
    ? ' Les données synchronisées seront aussi supprimées du cloud.'
    : '';

  if (!window.confirm(
    `Effacer l'historique de ${count} élève${count > 1 ? 's' : ''} sur cet appareil ?${cloudNote} Cette action est irréversible.`
  )) {
    return;
  }

  const clearBtn = document.querySelector('.history-footer .btn--danger');
  setButtonLoading(clearBtn, true, 'Suppression…');

  try {
    for (const student of students) {
      await clearStudentFromCloud(student.studentKey);
    }

    HistoryManager.clear();
    updateHistoryLink();
    await renderHistoryScreen();
    announce('Historique effacé.');
  } finally {
    setButtonLoading(clearBtn, false);
  }
}

async function redoHistoryEntry(studentKey, studentName = '') {
  const entry = await resolveHistoryEntry(studentKey);
  const baseName = entry?.name || studentName;
  if (!baseName) return;

  const name = await resolveCanonicalStudentName(baseName);
  userName = name;

  const nameInput = document.getElementById('user-name');
  if (nameInput) nameInput.value = name;

  launchQuiz(name);
}