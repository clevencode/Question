// sync.js — Envio de resultados para o dashboard institucional

const SYNC_API = 'https://note-sigma-bice.vercel.app/api/results';
const QUIZ_ORIGIN = 'https://question-ecru-iota.vercel.app';

async function syncResultToCloud(entry) {
  try {
    const res = await fetch(SYNC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: entry.id,
        name: entry.name,
        percent: entry.percent,
        correct: entry.correct,
        total: entry.total,
        wrong: entry.wrong,
        grade: entry.grade,
        answers: entry.answers,
        date: entry.date,
        source: QUIZ_ORIGIN
      })
    });

    if (!res.ok) {
      console.warn('Sync cloud failed:', res.status);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('Sync cloud error:', error);
    return false;
  }
}