// cloud.js — Sincronização de resultados via API (todos os dispositivos)

const RESULTS_API = '/api/results';

async function syncResultToCloud(entry) {
  try {
    const res = await fetch(RESULTS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(entry)
    });
    return res.ok;
  } catch (error) {
    console.warn('Cloud sync error:', error);
    return false;
  }
}

function getProfessorPassword() {
  if (typeof ProfessorAuthConfig === 'undefined') return '';
  return sessionStorage.getItem(ProfessorAuthConfig.passwordKey) || '';
}

async function fetchResultsFromCloud() {
  const res = await fetch(RESULTS_API, {
    headers: { 'X-Professor-Password': getProfessorPassword() },
    cache: 'no-store'
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }

  return Array.isArray(data) ? data : [];
}

async function clearResultsFromCloud() {
  const res = await fetch(RESULTS_API, {
    method: 'DELETE',
    headers: { 'X-Professor-Password': getProfessorPassword() }
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
}