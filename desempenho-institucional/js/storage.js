// storage.js — Resultados na nuvem (todos os dispositivos)

const HistoryStore = {
  fetchAll: fetchResultsFromCloud,
  clear: clearResultsFromCloud
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