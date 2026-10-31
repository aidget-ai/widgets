document.documentElement.classList.add('js');

const AUTOPLAY_INTERVAL = 6000;

function initializeCarousel(carousel) {
  const slides = [...carousel.querySelectorAll('[data-carousel-slide]')];
  if (slides.length < 2) {
    throw new Error('carousel requires at least two slides');
  }

  const dots = [...carousel.querySelectorAll('[data-carousel-dot]')];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let current = 0;
  let autoplayEnabled = !reduceMotion.matches;
  let timer;

  function showSlide(index) {
    current = (index + slides.length) % slides.length;
    slides.forEach((slide, slideIndex) => {
      const active = slideIndex === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
    });
    dots.forEach((dot, dotIndex) => {
      dot.setAttribute('aria-current', String(dotIndex === current));
    });
  }

  function updatePlayback() {
    window.clearInterval(timer);
    const playing = autoplayEnabled && !document.hidden;
    if (playing) {
      timer = window.setInterval(() => {
        if (autoplayEnabled && !document.hidden) {
          showSlide(current + 1);
        }
      }, AUTOPLAY_INTERVAL);
    }
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      autoplayEnabled = false;
      showSlide(index);
      updatePlayback();
    });
  });
  reduceMotion.addEventListener('change', (event) => {
    autoplayEnabled = !event.matches;
    updatePlayback();
  });
  document.addEventListener('visibilitychange', updatePlayback);

  showSlide(0);
  updatePlayback();
}

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-carousel]').forEach(initializeCarousel);
});
