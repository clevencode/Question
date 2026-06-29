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

  add(entry) {
    const history = this.load();
    history.unshift(entry);
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
    return this.load().find(e => e.id === id) || null;
  },

  getByStudentKey(studentKey, deviceKey = getDeviceKey()) {
    return this.load().filter(e => {
      const sameStudent = (e.studentKey || normalizeStudentKey(e.name)) === studentKey;
      const sameDevice = (e.deviceKey || getDeviceKey()) === deviceKey;
      return sameStudent && sameDevice;
    });
  },

  async loadForStudent(name) {
    const studentKey = normalizeStudentKey(name);
    const deviceKey = getDeviceKey();
    const cloudEntries = await fetchResultsByStudentName(name);
    const localEntries = this.getByStudentKey(studentKey, deviceKey);
    const merged = new Map();

    [...cloudEntries, ...localEntries].forEach(entry => {
      merged.set(entry.id, entry);
    });

    return Array.from(merged.values())
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  },

  createEntry({ name, score, grade, answersMap }) {
    const deviceKey = getDeviceKey();
    const studentKey = normalizeStudentKey(name);
    return {
      id: `${deviceKey}::${studentKey}-${Date.now()}`,
      deviceKey,
      studentKey,
      name,
      percent: score.percent,
      correct: score.correct,
      total: score.total,
      wrong: score.wrong,
      grade,
      answers: { ...answersMap },
      date: new Date().toISOString()
    };
  }
};

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
    count = HistoryManager.load().length;
  }

  if (link) {
    link.classList.toggle('hidden', count === 0);
    const label = link.querySelector('span');
    if (label) label.textContent = `Voir l'historique (${count})`;
  }

  if (navBtn) navBtn.classList.toggle('hidden', count === 0);
}