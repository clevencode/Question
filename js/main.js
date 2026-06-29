// main.js — Navigation et initialisation

function hideAllScreens() {
  ['intro-screen', 'quiz-screen', 'results-screen', 'history-screen'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

function showIntro() {
  updateHistoryLink();
  showScreen('intro-screen', {
    announceMsg: 'Étape 1 : lecture du contenu éducatif.',
    focusSelector: '#user-name'
  });
}

function goHome() {
  const onQuiz = !document.getElementById('quiz-screen')?.classList.contains('hidden');
  if (onQuiz && !confirmLeaveQuiz()) return;

  clearAdvanceTimeout();
  showIntro();
}

function clearNameError() {
  const nameInput = document.getElementById('user-name');
  const nameError = document.getElementById('name-error');
  nameError?.classList.add('hidden');
  nameInput?.classList.remove('input--error');
  nameInput?.setAttribute('aria-invalid', 'false');
}

function showNameError() {
  const nameInput = document.getElementById('user-name');
  const nameError = document.getElementById('name-error');
  nameError?.classList.remove('hidden');
  nameInput?.focus();
  nameInput?.classList.add('input--error');
  nameInput?.setAttribute('aria-invalid', 'true');
}

function launchQuiz(name) {
  userName = formatStudentName(name);
  currentQuestionIndex = 0;
  answers = {};
  clearAdvanceTimeout();

  const nameInput = document.getElementById('user-name');
  if (nameInput) nameInput.value = userName;

  showScreen('quiz-screen', {
    announceMsg: `Quiz commencé. Question 1 sur ${QUESTIONS.length}.`,
    focusSelector: '#btn-true'
  });

  const greeting = document.getElementById('quiz-greeting');
  if (greeting) greeting.textContent = userName;

  renderQuestion();
}

async function startQuiz() {
  const nameInput = document.getElementById('user-name');
  const submitBtn = document.querySelector('.start-form button[type="submit"]');
  let name = formatStudentName(nameInput?.value || userName || '');

  if (!name) {
    showNameError();
    return;
  }

  setButtonLoading(submitBtn, true, 'Préparation…');

  try {
    name = await resolveCanonicalStudentName(name);
    if (nameInput) nameInput.value = name;
    clearNameError();
    launchQuiz(name);
  } finally {
    setButtonLoading(submitBtn, false);
  }
}

function restartQuiz() {
  if (userName.trim()) {
    launchQuiz(userName);
    return;
  }

  clearAdvanceTimeout();
  currentQuestionIndex = 0;
  answers = {};
  showIntro();
}

function renderIntroContent() {
  const container = document.getElementById('intro-content');
  if (!container) return;

  container.innerHTML = INTRO_CONTENT.map(section => {
    const listHtml = section.list
      ? `<ul class="intro-list">${section.list.map(item =>
          `<li><span class="intro-list__label">${item.label}</span> : ${item.text}</li>`
        ).join('')}</ul>`
      : '';

    const bodyHtml = section.body
      ? `<p class="intro-section__body">${section.body}</p>`
      : '';

    return `
      <section class="intro-section">
        <h3 class="intro-section__title">${section.title}</h3>
        ${bodyHtml}
        ${listHtml}
      </section>`;
  }).join('');
}

function initNameInput() {
  const nameInput = document.getElementById('user-name');
  nameInput?.addEventListener('input', () => {
    if (nameInput.value.trim()) {
      clearNameError();
      updateHistoryLink(nameInput.value.trim());
    }
  });
}

function initKeyboardShortcuts() {
  document.addEventListener('keydown', e => {
    const onQuiz = !document.getElementById('quiz-screen')?.classList.contains('hidden');
    if (!onQuiz || isAdvancing) return;

    const key = e.key.toLowerCase();
    if (key === 'v') { e.preventDefault(); selectAnswer(true); }
    if (key === 'f') { e.preventDefault(); selectAnswer(false); }
    if (key === 'arrowleft') { e.preventDefault(); prevQuestion(); }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderIntroContent();
  initNameInput();
  initKeyboardShortcuts();
  initHistoryListActions();
  updateHistoryLink();
  showIntro();
});