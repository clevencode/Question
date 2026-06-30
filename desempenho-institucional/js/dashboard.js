// dashboard.js — Painel institucional (1 aluno = 1 registro por nome)

let refreshTimer = null;
let isRefreshing = false;

function buildStudentSummary(entry) {
  const attemptCount = entry.attemptsHistory?.length || 1;

  return {
    name: entry.name?.trim() || 'Sem nome',
    attemptCount,
    score: entry.percent,
    correct: entry.correct,
    total: entry.total,
    modifiedAt: entry.date
  };
}

function groupByStudent(entries) {
  const map = new Map();

  entries.forEach(entry => {
    const key = entry.studentKey || normalizeStudentKey(entry.name);
    const summary = buildStudentSummary(entry);

    if (!map.has(key)) {
      map.set(key, summary);
      return;
    }

    const existing = map.get(key);
    const isNewer = new Date(summary.modifiedAt) > new Date(existing.modifiedAt);

    map.set(key, {
      name: existing.name,
      attemptCount: Math.max(existing.attemptCount, summary.attemptCount),
      score: isNewer ? summary.score : existing.score,
      correct: isNewer ? summary.correct : existing.correct,
      total: isNewer ? summary.total : existing.total,
      modifiedAt: isNewer ? summary.modifiedAt : existing.modifiedAt
    });
  });

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt'));
}

function getStatsFromStudents(students) {
  const totalAttempts = students.reduce((sum, s) => sum + s.attemptCount, 0);
  const avg = students.length
    ? Math.round(students.reduce((sum, s) => sum + s.score, 0) / students.length)
    : 0;

  return {
    totalAttempts,
    totalStudents: students.length,
    average: avg
  };
}

function localizeError(message) {
  if (!message) return 'Erro de sincronização';
  return message.replace(/^Erreur Supabase\s*:\s*/i, 'Erro Supabase: ');
}

function announce(message) {
  const el = document.getElementById('live-region');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}

function setStatus(message, isError = false) {
  const el = document.getElementById('sync-status');
  if (!el) return;
  el.textContent = message;
  el.classList.toggle('sync-status--error', isError);
  if (!isError) announce(message);
}

function renderStats(stats) {
  document.getElementById('stat-students').textContent = stats.totalStudents;
  document.getElementById('stat-attempts').textContent = stats.totalAttempts;
  document.getElementById('stat-average').textContent = `${stats.average}%`;
}

function renderStudents(students) {
  const container = document.getElementById('students-list');
  const empty = document.getElementById('dashboard-empty');

  if (!container) return;

  if (students.length === 0) {
    container.innerHTML = '';
    empty?.classList.remove('hidden');
    return;
  }

  empty?.classList.add('hidden');

  container.innerHTML = students.map(student => `
    <article class="student-card">
      <header class="student-card__header">
        <h3 class="student-card__name">${student.name}</h3>
        <span class="student-card__attempts">${student.attemptCount} tentativa${student.attemptCount > 1 ? 's' : ''}</span>
      </header>
      <div class="student-card__scores">
        <div class="student-card__metric">
          <span class="student-card__label">Pontuação</span>
          <span class="student-card__value student-card__value--blue">${student.score}%</span>
          <span class="student-card__sub">${student.correct}/${student.total} acertos</span>
        </div>
        <div class="student-card__metric">
          <span class="student-card__label">Modificado</span>
          <span class="student-card__date">${formatDate(student.modifiedAt)}</span>
        </div>
      </div>
    </article>
  `).join('');
}

function renderAttempts(students) {
  const tbody = document.getElementById('attempts-body');
  const tableWrap = document.getElementById('attempts-table-wrap');

  if (!tbody) return;

  if (students.length === 0) {
    tbody.innerHTML = '';
    tableWrap?.classList.add('hidden');
    return;
  }

  tableWrap?.classList.remove('hidden');

  const rows = [...students].sort((a, b) => new Date(b.modifiedAt) - new Date(a.modifiedAt));

  tbody.innerHTML = rows.map(student => `
    <tr>
      <td>${student.name}</td>
      <td><strong>${student.score}%</strong></td>
      <td>${student.correct}/${student.total}</td>
      <td>${formatDate(student.modifiedAt)}</td>
    </tr>
  `).join('');
}

function renderDashboard(entries) {
  const students = groupByStudent(entries);
  const stats = getStatsFromStudents(students);
  renderStats(stats);
  renderStudents(students);
  renderAttempts(students);
  return stats;
}

function scheduleDashboardRefresh() {
  clearTimeout(refreshTimer);
  refreshTimer = setTimeout(refreshDashboard, 500);
}

async function refreshDashboard() {
  if (isRefreshing) return;
  isRefreshing = true;

  const refreshBtn = document.getElementById('btn-refresh');
  setStatus('Sincronizando…');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.setAttribute('aria-busy', 'true');
    refreshBtn.textContent = 'Atualizando…';
  }

  try {
    const entries = await HistoryStore.fetchAll();
    const stats = renderDashboard(entries);
    setStatus(
      `Sincronizado — ${stats.totalStudents} aluno${stats.totalStudents !== 1 ? 's' : ''}, ` +
      `${stats.totalAttempts} tentativa${stats.totalAttempts !== 1 ? 's' : ''}`
    );
  } catch (error) {
    renderDashboard([]);
    setStatus(localizeError(error.message), true);
  } finally {
    isRefreshing = false;
    if (refreshBtn) {
      refreshBtn.disabled = false;
      refreshBtn.removeAttribute('aria-busy');
      refreshBtn.textContent = 'Atualizar';
    }
  }
}

function initProfessorDashboard() {
  if (window.__professorDashboardReady) return;
  window.__professorDashboardReady = true;

  refreshDashboard();
  document.getElementById('btn-refresh')?.addEventListener('click', refreshDashboard);
  subscribeToResultsChanges(() => scheduleDashboardRefresh());
  setInterval(scheduleDashboardRefresh, 30000);
}

window.initProfessorDashboard = initProfessorDashboard;