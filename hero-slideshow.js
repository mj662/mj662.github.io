(() => {
  const region = document.querySelector('.hero-devices-image');
  if (!region) return;
  const slides = [...region.querySelectorAll('.hero-slide')];
  const choices = [...region.querySelectorAll('[data-app-slide]')];
  const pause = region.querySelector('#hero-slide-pause');
  const titles = [...document.querySelectorAll('.hero-title-name')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let playing = !motion.matches;
  function show(index) {
    current = index;
    titles.forEach((title, i) => {
      title.classList.toggle('is-active', i === index);
      title.setAttribute('aria-hidden', String(i !== index));
    });
    slides.forEach((slide, i) => {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', String(i !== index));
    });
    choices.forEach((button, i) => button.setAttribute('aria-pressed', String(i === index)));
  }
  function label() { pause.textContent = playing ? (pause.dataset.pauseLabel || 'Pause slideshow') : (pause.dataset.playLabel || 'Play slideshow'); }
  choices.forEach((button, index) => button.addEventListener('click', () => {
    playing = false;
    show(index);
    label();
  }));
  pause.addEventListener('click', () => { playing = !playing; label(); });
  region.addEventListener('focusin', (event) => { if (event.target !== pause) { playing = false; label(); } });
  motion.addEventListener('change', () => { if (motion.matches) { playing = false; label(); } });
  setInterval(() => {
    if (playing && !document.hidden && !region.matches(':hover')) show((current + 1) % slides.length);
  }, 6000);
  label();
  region.querySelector('.hero-slide-controls').hidden = false;
})();
