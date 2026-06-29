// history.js — Historique des résultats (localStorage)

const HISTORY_KEY = 'techIaQuizHistory';
const MAX_HISTORY_ENTRIES = 30;

const HistoryManager = {
  load() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  saveAll(entries) {
    try {
      const limited = entries.slice(0, MAX_HISTORY_ENTRIES);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(limited));
      return limited;
    } catch {
      return entries;
    }
  },

  upsert(entry) {
    const history = this.load();
    const key = entry.studentKey || normalizeStudentKey(entry.name);
    const index = history.findIndex(e => (e.studentKey || normalizeStudentKey(e.name)) === key);
    const record = {
      ...entry,
      id: key,
      studentKey: key,
      name: index >= 0 ? history[index].name : entry.name,
      attemptCount: entry.attemptCount ?? (index >= 0 ? history[index].attemptCount : 1)
    };

    if (index >= 0) {
      history[index] = record;
    } else {
      history.unshift(record);
    }

    return this.saveAll(history);
  },

  remove(id) {
    return this.saveAll(this.load().filter(e => e.id !== id));
  },

  clear() {
    localStorage.removeItem(HISTORY_KEY);
    return [];
  },

  getById(id) {
    const key = normalizeStudentKey(id) || id;
    return this.load().find(e => {
      const entryKey = e.studentKey || normalizeStudentKey(e.name);
      return e.id === id || entryKey === key;
    }) || null;
  },

  getByStudentKey(studentKey) {
    const key = normalizeStudentKey(studentKey) || studentKey;
    return this.load().filter(e => (e.studentKey || normalizeStudentKey(e.name)) === key);
  },

  getStudentEntry(studentKey) {
    const entries = this.getByStudentKey(studentKey);
    if (!entries.length) return null;

    return entries.sort((a, b) => new Date(b.date) - new Date(a.date))[0];
  },

  getUniqueStudents() {
    const map = new Map();

    this.load().forEach(entry => {
      const key = entry.studentKey || normalizeStudentKey(entry.name);
      const current = map.get(key);

      if (!current || new Date(entry.date) > new Date(current.date)) {
        map.set(key, {
          ...entry,
          id: key,
          studentKey: key,
          name: current?.name || entry.name
        });
      }
    });

    return Array.from(map.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  async loadForStudent(name) {
    const studentKey = normalizeStudentKey(name);
    const cloudEntry = await fetchStudentSummary(name);
    const localEntry = this.getByStudentKey(studentKey)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

    if (cloudEntry && localEntry) {
      const newer = new Date(cloudEntry.date) > new Date(localEntry.date) ? cloudEntry : localEntry;
      const attemptCount = Math.max(
        cloudEntry.attemptCount || 1,
        localEntry.attemptCount || 1
      );
      return [{
        ...newer,
        id: studentKey,
        studentKey,
        name: localEntry.name || cloudEntry.name,
        attemptCount
      }];
    }

    const entry = cloudEntry || localEntry;
    return entry ? [{ ...entry, id: studentKey, studentKey }] : [];
  },

  createEntry({ name, score, grade, answersMap }) {
    const displayName = formatStudentName(name);
    const studentKey = normalizeStudentKey(displayName);
    const existing = this.getStudentEntry(studentKey);
    const attemptCount = (existing?.attemptCount || 0) + 1;

    return {
      id: studentKey,
      studentKey,
      name: displayName,
      percent: score.percent,
      correct: score.correct,
      total: score.total,
      wrong: score.wrong,
      grade,
      answers: { ...answersMap },
      date: new Date().toISOString(),
      attemptCount
    };
  }
};

function escapeHtmlAttr(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function resolveHistoryEntry(studentKey) {
  const key = normalizeStudentKey(studentKey) || studentKey;
  const local = HistoryManager.getStudentEntry(key);
  const cloud = await fetchStudentSummary(key);

  if (local && cloud) {
    const newer = new Date(cloud.date) > new Date(local.date) ? cloud : local;
    return {
      ...newer,
      id: key,
      studentKey: key,
      name: local.name || cloud.name,
      answers: newer.answers || local.answers || cloud.answers || {}
    };
  }

  const entry = local || cloud;
  if (!entry) return null;

  return {
    ...entry,
    id: key,
    studentKey: key,
    answers: entry.answers || {}
  };
}

function formatHistoryDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

async function updateHistoryLink(name = userName?.trim()) {
  const link = document.getElementById('intro-history-link');
  const navBtn = document.getElementById('nav-history-btn');
  let count = 0;

  if (name) {
    const entries = await HistoryManager.loadForStudent(name);
    count = entries.length;
  } else {
    count = HistoryManager.getUniqueStudents().length;
  }

  if (link) {
    link.classList.toggle('hidden', count === 0);
    const label = link.querySelector('span');
    if (label) label.textContent = `Voir l'historique (${count})`;
  }

  if (navBtn) navBtn.classList.toggle('hidden', count === 0);
}