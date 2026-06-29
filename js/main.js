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

function initGridCanvas() {
  const canvas = document.getElementById('grid-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let particles = [];
  let animId;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particles = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 1.5 + 0.5
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 75, 243, 0.4)';
      ctx.fill();
    });

    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0, 75, 243, ${0.15 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    animId = requestAnimationFrame(draw);
  }

  resize();
  draw();
  window.addEventListener('resize', resize);

  return () => {
    cancelAnimationFrame(animId);
    window.removeEventListener('resize', resize);
  };
}

document.addEventListener('DOMContentLoaded', () => {
  renderIntroContent();
  initGridCanvas();
  showIntro();
});