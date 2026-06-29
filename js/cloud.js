// cloud.js — Sincronização Supabase por nome do aluno

let supabaseClient = null;

function normalizeStudentKey(name) {
  return (name?.trim() || 'sans nom')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
}

function isCloudReady() {
  return CLOUD_CONFIG.supabaseUrl.startsWith('https://')
    && CLOUD_CONFIG.supabaseKey.length > 20
    && !CLOUD_CONFIG.supabaseUrl.includes('COLE_SUA');
}

function getSupabase() {
  if (!isCloudReady()) return null;
  if (!supabaseClient) {
    supabaseClient = window.supabase.createClient(
      CLOUD_CONFIG.supabaseUrl,
      CLOUD_CONFIG.supabaseKey
    );
  }
  return supabaseClient;
}

function toCloudRow(entry) {
  const studentKey = entry.studentKey || normalizeStudentKey(entry.name);

  return {
    id: entry.id,
    student_key: studentKey,
    name: entry.name,
    percent: entry.percent,
    correct: entry.correct,
    total: entry.total,
    wrong: entry.wrong ?? entry.total - entry.correct,
    grade: entry.grade || '',
    answers: entry.answers || {},
    created_at: entry.date || new Date().toISOString(),
    source: typeof location !== 'undefined' ? location.origin : ''
  };
}

function fromCloudRow(row) {
  return {
    id: row.id,
    studentKey: row.student_key || normalizeStudentKey(row.name),
    name: row.name,
    percent: row.percent,
    correct: row.correct,
    total: row.total,
    wrong: row.wrong,
    grade: row.grade,
    answers: row.answers,
    date: row.created_at
  };
}

async function syncResultToCloud(entry) {
  const sb = getSupabase();
  if (!sb) return false;

  const { error } = await sb
    .from('quiz_results')
    .upsert(toCloudRow(entry), { onConflict: 'id' });

  if (error) {
    console.warn('Cloud sync failed:', error.message);
    return false;
  }

  return true;
}

async function fetchResultsFromCloud() {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Supabase não configurado. Edite js/cloud-config.js com URL e chave anon.');
  }

  const { data, error } = await sb
    .from('quiz_results')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500);

  if (error) {
    throw new Error(`Erreur Supabase : ${error.message}`);
  }

  return Array.isArray(data) ? data.map(fromCloudRow) : [];
}

async function fetchResultsByStudentName(name) {
  const sb = getSupabase();
  if (!sb) return [];

  const studentKey = normalizeStudentKey(name);
  const { data, error } = await sb
    .from('quiz_results')
    .select('*')
    .eq('student_key', studentKey)
    .order('created_at', { ascending: false })
    .limit(30);

  if (error) {
    console.warn('Cloud fetch by name failed:', error.message);
    return [];
  }

  return Array.isArray(data) ? data.map(fromCloudRow) : [];
}

async function clearResultsFromCloud() {
  const sb = getSupabase();
  if (!sb) {
    throw new Error('Supabase não configurado.');
  }

  const { error } = await sb
    .from('quiz_results')
    .delete()
    .neq('id', '');

  if (error) {
    throw new Error(`Erreur Supabase : ${error.message}`);
  }
}

function subscribeToResultsChanges(onChange) {
  const sb = getSupabase();
  if (!sb || typeof onChange !== 'function') return null;

  return sb
    .channel('quiz-results-live')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'quiz_results' }, onChange)
    .subscribe();
}