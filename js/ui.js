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
  if (index === -1) return;

  document.querySelectorAll('.stepper__item[data-step]').forEach(item => {
    const itemIndex = STEPS.indexOf(item.dataset.step);
    const numEl = item.querySelector('.stepper__num');

    item.classList.remove('stepper__item--active', 'stepper__item--done', 'stepper__item--pending');

    if (itemIndex < index) {
      item.classList.add('stepper__item--done');
      if (numEl) numEl.textContent = '✓';
      item.setAttribute('aria-current', 'false');
    } else if (itemIndex === index) {
      item.classList.add('stepper__item--active');
      if (numEl) numEl.textContent = String(itemIndex + 1);
      item.setAttribute('aria-current', 'step');
    } else {
      item.classList.add('stepper__item--pending');
      if (numEl) numEl.textContent = String(itemIndex + 1);
      item.setAttribute('aria-current', 'false');
    }
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