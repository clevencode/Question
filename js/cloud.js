// cloud.js — Sincronização via Supabase (gratuito, sem Vercel KV)

const QUIZ_ORIGIN = 'https://question-ecru-iota.vercel.app';

function isCloudReady() {
  return CLOUD_CONFIG.enabled
    && CLOUD_CONFIG.supabaseUrl.startsWith('https://')
    && CLOUD_CONFIG.supabaseKey.length > 20;
}

function cloudHeaders() {
  return {
    apikey: CLOUD_CONFIG.supabaseKey,
    Authorization: `Bearer ${CLOUD_CONFIG.supabaseKey}`,
    'Content-Type': 'application/json'
  };
}

function toCloudRow(entry) {
  return {
    id: entry.id,
    name: entry.name,
    percent: entry.percent,
    correct: entry.correct,
    total: entry.total,
    wrong: entry.wrong,
    grade: entry.grade || '',
    answers: entry.answers || {},
    created_at: entry.date || new Date().toISOString(),
    source: QUIZ_ORIGIN
  };
}

async function syncResultToCloud(entry) {
  if (!isCloudReady()) return false;

  try {
    const res = await fetch(`${CLOUD_CONFIG.supabaseUrl}/rest/v1/quiz_results`, {
      method: 'POST',
      headers: { ...cloudHeaders(), Prefer: 'return=minimal' },
      body: JSON.stringify(toCloudRow(entry))
    });

    if (!res.ok) {
      console.warn('Cloud sync failed:', res.status);
      return false;
    }
    return true;
  } catch (error) {
    console.warn('Cloud sync error:', error);
    return false;
  }
}