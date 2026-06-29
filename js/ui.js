// ui.js — Utilitaires UI/UX partagés

const STEPS = ['intro', 'quiz', 'results'];

function announce(message) {
  const el = document.getElementById('live-region');
  if (!el) return;
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = message; });
}

function focusFirst(container) {
  const target = container?.querySelector(
    'input:not([disabled]), button:not([disabled]), [tabindex="0"]'
  );
  target?.focus();
}

function updateStepper(step) {
  const index = STEPS.indexOf(step);
  document.querySelectorAll('[data-step]').forEach(item => {
    const itemIndex = STEPS.indexOf(item.dataset.step);
    const isActive = itemIndex === index;
    const isDone = itemIndex < index;
    item.classList.toggle('stepper__item--active', isActive);
    item.classList.toggle('stepper__item--done', isDone);
    item.setAttribute('aria-current', isActive ? 'step' : 'false');
  });
}

function showScreen(screenId, { announceMsg, focusSelector } = {}) {
  hideAllScreens();
  const screen = document.getElementById(screenId);
  if (!screen) return;
  screen.classList.remove('hidden');

  const step = screenId.replace('-screen', '');
  updateStepper(step);

  if (announceMsg) announce(announceMsg);
  if (focusSelector) {
    const el = screen.querySelector(focusSelector);
    el?.focus();
  } else {
    focusFirst(screen);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function confirmLeaveQuiz() {
  const answered = QuizFlow.getAnsweredCount();
  if (answered === 0) return true;
  return window.confirm(
    'Vous avez un quiz en cours. Voulez-vous vraiment retourner à l\'accueil ? Vos réponses seront perdues.'
  );
}