// dashboard.js — Painel /admin (mesmo site, localStorage)

function groupByStudent(entries) {
  const map = new Map();

  entries.forEach(entry => {
    const name = entry.name?.trim() || 'Sans nom';
    if (!map.has(name)) {
      map.set(name, { name, attempts: [], best: 0, latest: null });
    }
    const student = map.get(name);
    student.attempts.push(entry);
    student.best = Math.max(student.best, entry.percent);
    if (!student.latest || new Date(entry.date) > new Date(student.latest.date)) {
      student.latest = entry;
    }
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}

function getStats(entries) {
  const students = groupByStudent(entries);
  const avg = entries.length
    ? Math.round(entries.reduce((s, e) => s + e.percent, 0) / entries.length)
    : 0;

  return {
    totalAttempts: entries.length,
    totalStudents: students.length,
    average: avg
  };
}

function setStatus(message) {
  const el = document.getElementById('sync-status');
  if (el) el.textContent = message;
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

  if (!tbody) return;

  if (entries.length === 0) {
    tbody.innerHTML = '';
    tableWrap?.classList.add('hidden');
    return;
  }

  tableWrap?.classList.remove('hidden');

  tbody.innerHTML = entries.map(entry => `
    <tr>
      <td>${entry.name}</td>
      <td><strong>${entry.percent}%</strong></td>
      <td>${entry.correct}/${entry.total}</td>
      <td>${formatDate(entry.date)}</td>
    </tr>
  `).join('');
}

function refreshDashboard() {
  const entries = HistoryStore.fetchAll();
  renderStats(entries);
  renderStudents(entries);
  renderAttempts(entries);
  setStatus(`${entries.length} résultat${entries.length !== 1 ? 's' : ''} sur cet appareil`);
}

function clearAllResults() {
  if (!window.confirm('Effacer tous les résultats de cet appareil ?')) return;
  HistoryStore.clear();
  refreshDashboard();
}

function initProfessorDashboard() {
  if (window.__professorDashboardReady) return;
  window.__professorDashboardReady = true;

  refreshDashboard();
  document.getElementById('btn-refresh')?.addEventListener('click', refreshDashboard);
  document.getElementById('btn-clear')?.addEventListener('click', clearAllResults);

  window.addEventListener('storage', e => {
    if (e.key === HISTORY_KEY) refreshDashboard();
  });
}

window.initProfessorDashboard = initProfessorDashboard;