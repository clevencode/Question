// dashboard.js — Painel institucional (1 aluno = 1 registro por nome)

function buildStudentSummary(entry) {
  const attempts = expandAttempts(entry);
  const best = attempts.reduce((max, a) => Math.max(max, a.percent), 0);
  const latest = attempts[0] || entry;

  return {
    name: entry.name?.trim() || 'Sans nom',
    attempts,
    best,
    latest: { ...latest, name: entry.name }
  };
}

function groupByStudent(entries) {
  return entries
    .map(buildStudentSummary)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function getStats(entries) {
  const students = groupByStudent(entries);
  const allAttempts = students.flatMap(s => s.attempts);
  const avg = allAttempts.length
    ? Math.round(allAttempts.reduce((s, a) => s + a.percent, 0) / allAttempts.length)
    : 0;

  return {
    totalAttempts: allAttempts.length,
    totalStudents: students.length,
    average: avg
  };
}

function setStatus(message, isError = false) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('sync-status--error', isError);
}

function renderStats(entries) {
  const stats = getStats(entries);
  document.getElementById('stat-students').textContent = stats.totalStudents;
  document.getElementById('stat-attempts').textContent = stats.totalAttempts;
  document.getElementById('stat-average').textContent = `${stats.average}%`;
}

function renderStudents(entries) {
  const container = document.getElementById('students-list');
  const empty = document.getElementById('dashboard-empty');
  const students = groupByStudent(entries);

  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  container.innerHTML = students.map(student => {
    const latest = student.latest;
    const count = student.attempts.length;

    return `
      <article class="student-card">
        <header class="student-card__header">
          <h3 class="student-card__name">${student.name}</h3>
          <span class="student-card__attempts">${count} tentative${count > 1 ? 's' : ''}</span>
        </header>
        <div class="student-card__scores">
          <div class="student-card__metric">
            <span class="student-card__label">Dernier score</span>
            <span class="student-card__value student-card__value--blue">${latest.percent}%</span>
            <span class="student-card__sub">${latest.correct}/${latest.total} correctes</span>
          </div>
          <div class="student-card__metric">
            <span class="student-card__label">Meilleur score</span>
            <span class="student-card__value">${student.best}%</span>
          </div>
          <div class="student-card__metric">
            <span class="student-card__label">Dernière tentative</span>
            <span class="student-card__date">${formatDate(latest.date)}</span>
          </div>
        </div>
      </article>`;
  }).join('');
}

function renderAttempts(entries) {
  const tbody = document.getElementById('attempts-body');
  const tableWrap = document.getElementById('attempts-table-wrap');
  const allAttempts = groupByStudent(entries).flatMap(s =>
    s.attempts.map(a => ({ ...a, name: s.name }))
  );

  if (!tbody) return;

  if (allAttempts.length === 0) {
    tbody.innerHTML = '';
    tableWrap?.classList.add('hidden');
    return;
  }

  tableWrap?.classList.remove('hidden');

  tbody.innerHTML = allAttempts.map(entry => `
    <tr>
      <td>${entry.name}</td>
      <td><strong>${entry.percent}%</strong></td>
      <td>${entry.correct}/${entry.total}</td>
      <td>${formatDate(entry.date)}</td>
    </tr>
  `).join('');
}

async function refreshDashboard() {
  setStatus('Synchronisation…');

  try {
    const entries = await HistoryStore.fetchAll();
    const stats = getStats(entries);
    renderStats(entries);
    renderStudents(entries);
    renderAttempts(entries);
    setStatus(
      `Synchronisé — ${stats.totalStudents} élève${stats.totalStudents !== 1 ? 's' : ''}, ` +
      `${stats.totalAttempts} tentative${stats.totalAttempts !== 1 ? 's' : ''} (par nom)`
    );
  } catch (error) {
    renderStats([]);
    renderStudents([]);
    renderAttempts([]);
    setStatus(error.message || 'Erreur de synchronisation', true);
  }
}

async function clearAllResults() {
  if (!window.confirm('Effacer tous les résultats ?')) return;

  setStatus('Suppression…');

  try {
    await HistoryStore.clear();
    await refreshDashboard();
  } catch (error) {
    setStatus(error.message || 'Erreur lors de la suppression', true);
  }
}

function initProfessorDashboard() {
  if (window.__professorDashboardReady) return;
  window.__professorDashboardReady = true;

  refreshDashboard();
  document.getElementById('btn-refresh')?.addEventListener('click', refreshDashboard);
  document.getElementById('btn-clear')?.addEventListener('click', clearAllResults);
  subscribeToResultsChanges(() => refreshDashboard());
  setInterval(refreshDashboard, 30000);
}

window.initProfessorDashboard = initProfessorDashboard;