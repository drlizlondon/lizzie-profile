const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

/** @param {boolean} open */
const setMenu = (open) => {
  navToggle?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
};

navToggle?.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
nav?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) setMenu(false);
});

window.addEventListener('scroll', () => header?.classList.toggle('is-scrolled', window.scrollY > 48), { passive: true });

const revealObserver = new IntersectionObserver((entries, observer) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const parallax = /** @type {HTMLElement | null} */ (document.querySelector('[data-parallax]'));
if (parallax && !reduceMotion.matches && window.matchMedia('(pointer: fine)').matches) {
  parallax.addEventListener('pointermove', (/** @type {PointerEvent} */ event) => {
    const bounds = parallax.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 10;
    const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 10;
    parallax.style.setProperty('--move-x', `${x.toFixed(2)}px`);
    parallax.style.setProperty('--move-y', `${y.toFixed(2)}px`);
  });
  parallax.addEventListener('pointerleave', () => {
    parallax.style.setProperty('--move-x', '0px');
    parallax.style.setProperty('--move-y', '0px');
  });
}

const year = document.querySelector('[data-year]');
if (year) year.textContent = String(new Date().getFullYear());
