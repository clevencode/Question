// cloud.js — Sincronização por nome (mesmo nome = atualização, não novo aluno)

let supabaseClient = null;

function formatStudentName(name) {
  return (name?.trim() || '').replace(/\s+/g, ' ');
}

function normalizeStudentKey(name) {
  const formatted = formatStudentName(name);
  if (!formatted) return 'sans nom';

  return formatted
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

function dedupeAttempts(attempts) {
  const seen = new Set();
  return attempts.filter(attempt => {
    if (!attempt?.id || seen.has(attempt.id)) return false;
    seen.add(attempt.id);
    return true;
  });
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

async function findStudentRecords(sb, studentKey) {
  const { data, error } = await sb
    .from('quiz_results')
    .select('*')
    .eq('student_key', studentKey)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  if (data?.length) return data;

  const { data: all, error: allError } = await sb
    .from('quiz_results')
    .select('*')
    .order('updated_at', { ascending: false })
    .limit(500);

  if (allError) throw allError;

  return (all || []).filter(row => normalizeStudentKey(row.name) === studentKey);
}

function mergeStudentRecords(records) {
  if (!records.length) return null;

  const primary = records[0];
  const attempts = dedupeAttempts(
    records.flatMap(row => Array.isArray(row.attempts_history) ? row.attempts_history : [])
  );

  return {
    primary,
    attempts,
    duplicates: records.slice(1)
  };
}

function dedupeStudentsByKey(rows) {
  const map = new Map();

  rows.forEach(row => {
    const entry = fromCloudRow(row);
    const key = entry.studentKey;

    if (!map.has(key)) {
      map.set(key, entry);
      return;
    }

    const existing = map.get(key);
    const mergedAttempts = dedupeAttempts([
      ...(entry.attemptsHistory || []),
      ...(existing.attemptsHistory || [])
    ]);

    const latest = new Date(entry.date) > new Date(existing.date) ? entry : existing;
    const oldest = latest === entry ? existing : entry;

    map.set(key, {
      ...latest,
      name: oldest.name || latest.name,
      attemptsHistory: mergedAttempts
    });
  });

  return Array.from(map.values());
}

async function resolveCanonicalStudentName(name) {
  const formatted = formatStudentName(name);
  if (!formatted) return formatted;

  const sb = getSupabase();
  if (!sb) return formatted;

  try {
    const records = await findStudentRecords(sb, normalizeStudentKey(formatted));
    return records[0]?.name || formatted;
  } catch {
    return formatted;
  }
}

async function syncResultToCloud(entry) {
  const sb = getSupabase();
  if (!sb) return false;

  const studentKey = entry.studentKey || normalizeStudentKey(entry.name);
  const attempt = toAttemptRecord(entry);
  const now = entry.date || new Date().toISOString();

  try {
    const records = await findStudentRecords(sb, studentKey);
    const merged = mergeStudentRecords(records);

    if (merged) {
      const history = dedupeAttempts([attempt, ...merged.attempts]);

      const { error } = await sb
        .from('quiz_results')
        .update({
          student_key: studentKey,
          percent: entry.percent,
          correct: entry.correct,
          total: entry.total,
          wrong: entry.wrong ?? entry.total - entry.correct,
          grade: entry.grade || '',
          answers: entry.answers || {},
          attempts_history: history,
          updated_at: now
          // name não é atualizado — mantém o nome original registrado
        })
        .eq('id', merged.primary.id);

      if (error) {
        console.warn('Cloud sync failed:', error.message);
        return false;
      }

      for (const duplicate of merged.duplicates) {
        await sb.from('quiz_results').delete().eq('id', duplicate.id);
      }

      return true;
    }

    const displayName = formatStudentName(entry.name);
    const { error } = await sb.from('quiz_results').insert({
      id: studentKey,
      student_key: studentKey,
      name: displayName,
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
  } catch (error) {
    console.warn('Cloud sync error:', error);
    return false;
  }
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

  return dedupeStudentsByKey(Array.isArray(data) ? data : []);
}

async function fetchResultsByStudentName(name) {
  const sb = getSupabase();
  if (!sb) return [];

  const studentKey = normalizeStudentKey(name);

  try {
    const records = await findStudentRecords(sb, studentKey);
    if (!records.length) return [];

    const merged = mergeStudentRecords(records);
    const student = fromCloudRow({
      ...merged.primary,
      attempts_history: merged.attempts
    });

    return expandAttempts(student);
  } catch (error) {
    console.warn('Cloud fetch by name failed:', error.message);
    return [];
  }
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