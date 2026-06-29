const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROFESSOR_PASSWORD = process.env.PROFESSOR_PASSWORD || '1234';

function isConfigured() {
  return SUPABASE_URL?.startsWith('https://') && SERVICE_KEY?.length > 20;
}

function getSupabase() {
  return createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function normalizeStudentKey(name) {
  return (name?.trim() || 'sans nom')
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');
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

function fromRow(row) {
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
    attemptsHistory: Array.isArray(row.attempts_history) ? row.attempts_history : []
  };
}

function isProfessor(req) {
  return req.headers['x-professor-password'] === PROFESSOR_PASSWORD;
}

module.exports = async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({
      error: 'Supabase não configurado. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.'
    });
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Professor-Password');
    return res.status(200).end();
  }

  const supabase = getSupabase();

  try {
    if (req.method === 'POST') {
      const entry = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!entry?.id || !entry?.name) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const studentKey = entry.studentKey || normalizeStudentKey(entry.name);
      const attempt = toAttemptRecord(entry);
      const now = entry.date || new Date().toISOString();

      const { data: existing, error: fetchError } = await supabase
        .from('quiz_results')
        .select('*')
        .eq('student_key', studentKey)
        .maybeSingle();

      if (fetchError) {
        return res.status(500).json({ error: fetchError.message });
      }

      if (existing) {
        const history = Array.isArray(existing.attempts_history) ? [...existing.attempts_history] : [];
        history.unshift(attempt);

        const { error } = await supabase
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

        if (error) return res.status(500).json({ error: error.message });
        return res.status(200).json({ ok: true, updated: true });
      }

      const { error } = await supabase.from('quiz_results').insert({
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
        source: entry.source || ''
      });

      if (error) return res.status(500).json({ error: error.message });
      return res.status(201).json({ ok: true, created: true });
    }

    if (req.method === 'GET') {
      if (!isProfessor(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(500);

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json((data || []).map(fromRow));
    }

    if (req.method === 'DELETE') {
      if (!isProfessor(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { error } = await supabase
        .from('quiz_results')
        .delete()
        .neq('id', '');

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
};