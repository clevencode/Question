// cloud.js — Sincronização por nome do aluno (1 registro, histórico de tentativas)

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

function toAttemptRecord(entry) {
  return {
    id: entry.id,
    date: entry.date || new Date().toISOString(),
    percent: entry.percent,
    correct: entry.correct,
    total: entry.total,
    wrong: entry.wrong ?? entry.total - entry.correct,
    grade: entry.grade || '',
    answers: entry.answers || {}
  };
}

function fromCloudRow(row) {
  const attemptsHistory = Array.isArray(row.attempts_history) ? row.attempts_history : [];

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
    date: row.updated_at || row.created_at,
    attemptsHistory
  };
}

function expandAttempts(studentRow) {
  const name = studentRow.name;
  const studentKey = studentRow.studentKey || normalizeStudentKey(name);

  if (studentRow.attemptsHistory?.length) {
    return studentRow.attemptsHistory.map(attempt => ({
      id: attempt.id,
      studentKey,
      name,
      percent: attempt.percent,
      correct: attempt.correct,
      total: attempt.total,
      wrong: attempt.wrong,
      grade: attempt.grade,
      answers: attempt.answers,
      date: attempt.date
    }));
  }

  return [{
    id: studentRow.id,
    studentKey,
    name,
    percent: studentRow.percent,
    correct: studentRow.correct,
    total: studentRow.total,
    wrong: studentRow.wrong,
    grade: studentRow.grade,
    answers: studentRow.answers,
    date: studentRow.date
  }];
}

async function syncResultToCloud(entry) {
  const sb = getSupabase();
  if (!sb) return false;

  const studentKey = entry.studentKey || normalizeStudentKey(entry.name);
  const attempt = toAttemptRecord(entry);
  const now = entry.date || new Date().toISOString();

  const { data: existing, error: fetchError } = await sb
    .from('quiz_results')
    .select('*')
    .eq('student_key', studentKey)
    .maybeSingle();

  if (fetchError) {
    console.warn('Cloud sync failed:', fetchError.message);
    return false;
  }

  if (existing) {
    const history = Array.isArray(existing.attempts_history) ? [...existing.attempts_history] : [];
    history.unshift(attempt);

    const { error } = await sb
      .from('quiz_results')
      .update({
        percent: entry.percent,
        correct: entry.correct,
        total: entry.total,
        wrong: entry.wrong ?? entry.total - entry.correct,
        grade: entry.grade || '',
        answers: entry.answers || {},
        attempts_history: history,
        updated_at: now
      })
      .eq('student_key', studentKey);

    if (error) {
      console.warn('Cloud sync failed:', error.message);
      return false;
    }

    return true;
  }

  const { error } = await sb.from('quiz_results').insert({
    id: studentKey,
    student_key: studentKey,
    name: entry.name,
    percent: entry.percent,
    correct: entry.correct,
    total: entry.total,
    wrong: entry.wrong ?? entry.total - entry.correct,
    grade: entry.grade || '',
    answers: entry.answers || {},
    attempts_history: [attempt],
    created_at: now,
    updated_at: now,
    source: typeof location !== 'undefined' ? location.origin : ''
  });

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
    .order('updated_at', { ascending: false })
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
    .maybeSingle();

  if (error || !data) {
    if (error) console.warn('Cloud fetch by name failed:', error.message);
    return [];
  }

  return expandAttempts(fromCloudRow(data));
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