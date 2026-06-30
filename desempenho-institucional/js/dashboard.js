// dashboard.js — Painel institucional (1 aluno = 1 registro por nome)

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

function getStats(entries) {
  const students = groupByStudent(entries);
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

function renderAttempts(entries) {
  const tbody = document.getElementById('attempts-body');
  const tableWrap = document.getElementById('attempts-table-wrap');
  const students = groupByStudent(entries);

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

async function refreshDashboard() {
  const refreshBtn = document.getElementById('btn-refresh');
  setStatus('Sincronizando…');
  if (refreshBtn) {
    refreshBtn.disabled = true;
    refreshBtn.setAttribute('aria-busy', 'true');
    refreshBtn.textContent = 'Atualizando…';
  }

  try {
    const entries = await HistoryStore.fetchAll();
    const stats = getStats(entries);
    renderStats(entries);
    renderStudents(entries);
    renderAttempts(entries);
    setStatus(
      `Sincronizado — ${stats.totalStudents} aluno${stats.totalStudents !== 1 ? 's' : ''}, ` +
      `${stats.totalAttempts} tentativa${stats.totalAttempts !== 1 ? 's' : ''}`
    );
  } catch (error) {
    renderStats([]);
    renderStudents([]);
    renderAttempts([]);
    setStatus(localizeError(error.message), true);
  } finally {
    const refreshBtn = document.getElementById('btn-refresh');
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
  subscribeToResultsChanges(() => refreshDashboard());
  setInterval(refreshDashboard, 30000);
}

window.initProfessorDashboard = initProfessorDashboard;