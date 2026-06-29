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

function fromRow(row) {
  return {
    id: row.id,
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

function toRow(entry) {
  return {
    id: entry.id,
    name: entry.name,
    percent: entry.percent,
    correct: entry.correct,
    total: entry.total,
    wrong: entry.wrong ?? entry.total - entry.correct,
    grade: entry.grade || '',
    answers: entry.answers || {},
    created_at: entry.date || new Date().toISOString(),
    source: entry.source || ''
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

      const { error } = await supabase
        .from('quiz_results')
        .upsert(toRow(entry), { onConflict: 'id' });

      if (error) {
        return res.status(500).json({ error: error.message });
      }

      return res.status(201).json({ ok: true });
    }

    if (req.method === 'GET') {
      if (!isProfessor(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const { data, error } = await supabase
        .from('quiz_results')
        .select('*')
        .order('created_at', { ascending: false })
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