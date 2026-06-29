// storage.js — Lê o histórico do quiz (mesmo localStorage)

const HISTORY_KEY = 'techIaQuizHistory';

const HistoryStore = {
  fetchAll() {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  clear() {
    localStorage.removeItem(HISTORY_KEY);
  }
};

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}