const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const PROFESSOR_PASSWORD = process.env.PROFESSOR_PASSWORD || '1234';

function isConfigured() {
  return SUPABASE_URL?.startsWith('https://') && SERVICE_KEY?.length > 20;
}

function supabaseHeaders(extra = {}) {
  return {
    apikey: SERVICE_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...extra
  };
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
      error: 'Nuvem não configurada. Defina SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY na Vercel.'
    });
  }

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Professor-Password');
    return res.status(200).end();
  }

  try {
    if (req.method === 'POST') {
      const entry = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      if (!entry?.id || !entry?.name) {
        return res.status(400).json({ error: 'Dados inválidos' });
      }

      const response = await fetch(`${SUPABASE_URL}/rest/v1/quiz_results`, {
        method: 'POST',
        headers: { ...supabaseHeaders(), Prefer: 'resolution=merge-duplicates' },
        body: JSON.stringify(toRow(entry))
      });

      if (!response.ok) {
        const text = await response.text();
        return res.status(response.status).json({ error: text || 'Erro ao salvar' });
      }

      return res.status(201).json({ ok: true });
    }

    if (req.method === 'GET') {
      if (!isProfessor(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/quiz_results?order=created_at.desc&limit=500`,
        { headers: supabaseHeaders(), cache: 'no-store' }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro ao buscar resultados' });
      }

      const rows = await response.json();
      return res.status(200).json(Array.isArray(rows) ? rows.map(fromRow) : []);
    }

    if (req.method === 'DELETE') {
      if (!isProfessor(req)) {
        return res.status(401).json({ error: 'Não autorizado' });
      }

      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/quiz_results?id=not.is.null`,
        { method: 'DELETE', headers: supabaseHeaders() }
      );

      if (!response.ok) {
        return res.status(response.status).json({ error: 'Erro ao apagar resultados' });
      }

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Método não permitido' });
  } catch (error) {
    return res.status(500).json({ error: error.message || 'Erro interno' });
  }
};