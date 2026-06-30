// ui.js — Utilitaires UI/UX partagés

const STEPS = ['intro', 'quiz', 'results'];
const AUXILIARY_SCREENS = ['history'];

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

function setStepperVisible(visible) {
  document.querySelector('.stepper')?.classList.toggle('stepper--hidden', !visible);
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

function setButtonLoading(button, loading, loadingLabel = 'Chargement…') {
  if (!button) return;

  const label = button.querySelector('[data-btn-label]') || button;

  if (loading) {
    if (!button.dataset.originalLabel) {
      button.dataset.originalLabel = label.textContent.trim();
    }
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.classList.add('btn--loading');
    label.textContent = loadingLabel;
    return;
  }

  button.disabled = false;
  button.removeAttribute('aria-busy');
  button.classList.remove('btn--loading');
  if (button.dataset.originalLabel) {
    label.textContent = button.dataset.originalLabel;
    delete button.dataset.originalLabel;
  }
}

function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

function showScreen(screenId, { announceMsg, focusSelector } = {}) {
  hideAllScreens();
  const screen = document.getElementById(screenId);
  if (!screen) return;
  screen.classList.remove('hidden');

  const step = screenId.replace('-screen', '');
  const isAuxiliary = AUXILIARY_SCREENS.includes(step);

  setStepperVisible(!isAuxiliary);
  if (!isAuxiliary) updateStepper(step);

  if (announceMsg) announce(announceMsg);
  if (focusSelector) {
    const el = screen.querySelector(focusSelector);
    el?.focus();
  } else {
    focusFirst(screen);
  }

  const instantScroll = screenId === 'quiz-screen'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top: 0, behavior: instantScroll ? 'instant' : 'smooth' });
}

function confirmLeaveQuiz() {
  const answered = QuizFlow.getAnsweredCount();
  if (answered === 0) return true;
  return window.confirm(
    'Vous avez un quiz en cours. Voulez-vous vraiment retourner à l\'accueil ? Vos réponses seront perdues.'
  );
}