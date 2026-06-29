// main.js — Navigation et initialisation

function hideAllScreens() {
  ['intro-screen', 'quiz-screen', 'results-screen'].forEach(id => {
    document.getElementById(id)?.classList.add('hidden');
  });
}

function showIntro() {
  hideAllScreens();
  document.getElementById('intro-screen')?.classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function startQuiz() {
  const nameInput = document.getElementById('user-name');
  const nameError = document.getElementById('name-error');
  const name = nameInput?.value.trim() || '';

  if (!name) {
    nameError?.classList.remove('hidden');
    nameInput?.focus();
    nameInput?.classList.add('input--error');
    return;
  }

  nameError?.classList.add('hidden');
  nameInput?.classList.remove('input--error');
  userName = name;

  currentQuestionIndex = 0;
  answers = {};

  hideAllScreens();
  document.getElementById('quiz-screen')?.classList.remove('hidden');

  const greeting = document.getElementById('quiz-greeting');
  if (greeting) greeting.textContent = name;

  renderQuestion();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function restartQuiz() {
  userName = '';
  currentQuestionIndex = 0;
  answers = {};

  const nameInput = document.getElementById('user-name');
  if (nameInput) nameInput.value = '';

  showIntro();
}

function renderIntroContent() {
  const container = document.getElementById('intro-content');
  if (!container) return;

  container.innerHTML = INTRO_CONTENT.map((section, i) => {
    const listHtml = section.list
      ? `<ul class="intro-list">${section.list.map(item =>
          `<li><span class="intro-list__label">${item.label}</span> : ${item.text}</li>`
        ).join('')}</ul>`
      : '';

    const bodyHtml = section.body
      ? `<p class="intro-section__body">${section.body}</p>`
      : '';

    return `
      <section class="intro-section" style="--delay: ${i * 0.08}s">
        <h3 class="intro-section__title">${section.title}</h3>
        ${bodyHtml}
        ${listHtml}
      </section>`;
  }).join('');
}

document.addEventListener('DOMContentLoaded', () => {
  renderIntroContent();
  showIntro();
});