const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const projectCarousel = /** @type {HTMLElement | null} */ (document.querySelector('[data-project-carousel]'));

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

const navLinks = [...document.querySelectorAll('[data-nav-section]')];
const navSections = [...document.querySelectorAll('[data-nav-target]')];

/** @param {string} sectionId */
const setActiveNav = (sectionId) => {
  navLinks.forEach((link) => {
    const active = link.getAttribute('data-nav-section') === sectionId;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const updateActiveNav = () => {
  const marker = window.scrollY + Math.min(window.innerHeight * 0.34, 280);
  let activeSection = navSections[0]?.id || '';
  navSections.forEach((section) => {
    if (section instanceof HTMLElement && section.offsetTop <= marker) activeSection = section.id;
  });
  setActiveNav(activeSection);
};

updateActiveNav();

/** @typedef {{ name: string, description: string, website: string, websiteLabel?: string, caseStudy: string, tone: string, visual: string, image: string, alt: string }} CarouselProject */
/** @type {CarouselProject[]} */
const carouselProjects = [
  {
    name: 'BumpNotes',
    description: 'Helping women capture and communicate what matters throughout pregnancy.',
    website: 'https://www.bumpnotes.co.uk',
    websiteLabel: 'View BumpNotes',
    caseStudy: '/projects/bumpnotes.html',
    tone: 'lavender',
    visual: 'phone',
    image: new URL('./assets/images/project-bumpnotes.webp', import.meta.url).href,
    alt: 'BumpNotes pregnancy summary interface',
  },
  {
    name: 'Big Picture Planner',
    description: 'Weekly planning that helps you focus on what actually matters.',
    website: 'https://www.bigpictureplanner.app',
    caseStudy: '/projects/big-picture-planner.html',
    tone: 'cream',
    visual: 'screen planner-screen',
    image: new URL('./assets/images/project-big-picture-planner.webp', import.meta.url).href,
    alt: 'Big Picture Planner weekly planning interface',
  },
  {
    name: 'myBishBash',
    description: 'Helping you use your phone intentionally, so it supports the life you actually want.',
    website: 'https://mybishbash.app',
    caseStudy: '/projects/mybishbash.html',
    tone: 'sage',
    visual: 'phone mybishbash-phone',
    image: new URL('./assets/images/project-mybishbash.webp', import.meta.url).href,
    alt: 'myBishBash intentional phone app preview',
  },
  {
    name: 'Mission Control',
    description: 'Complex systems made easier to understand.',
    website: '',
    caseStudy: '/projects/mission-control.html',
    tone: 'cool',
    visual: 'abstract abstract-grid',
    image: '',
    alt: '',
  },
  {
    name: 'Common Ground',
    description: 'Better questions. Stronger connections.',
    website: '',
    caseStudy: '/projects/common-ground.html',
    tone: 'butter',
    visual: 'abstract abstract-circles',
    image: '',
    alt: '',
  },
  {
    name: 'Aurelle',
    description: 'Learning by doing, not just reading.',
    website: '',
    caseStudy: '/projects/aurelle.html',
    tone: 'peach',
    visual: 'abstract abstract-pages',
    image: '',
    alt: '',
  },
];

if (projectCarousel) {
  const track = /** @type {HTMLElement | null} */ (projectCarousel.querySelector('[data-carousel-track]'));
  const previous = projectCarousel.querySelector('[data-carousel-previous]');
  const next = projectCarousel.querySelector('[data-carousel-next]');
  const dots = projectCarousel.querySelector('[data-carousel-dots]');
  const status = projectCarousel.querySelector('[data-carousel-status]');

  /** @param {CarouselProject} project */
  const visualMarkup = (project) => {
    if (project.image) {
      return `<div class="carousel-visual-frame ${project.visual}"><img src="${project.image}" alt="${project.alt}" width="1600" height="1041" loading="lazy"></div>`;
    }
    if (project.visual.includes('abstract-grid')) return '<div class="carousel-visual-frame abstract"><div class="carousel-window-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>';
    if (project.visual.includes('abstract-circles')) return '<div class="carousel-visual-frame abstract"><div class="carousel-window-circles" aria-hidden="true"><i></i><i></i><i></i></div></div>';
    return '<div class="carousel-visual-frame abstract"><div class="carousel-window-pages" aria-hidden="true"><i></i><i></i></div></div>';
  };

  if (track && dots && previous instanceof HTMLButtonElement && next instanceof HTMLButtonElement && status) {
    track.innerHTML = carouselProjects.map((project, index) => `
      <article class="carousel-slide tone-${project.tone}" aria-roledescription="slide" aria-label="${index + 1} of ${carouselProjects.length}: ${project.name}" aria-hidden="${index !== 0}">
        <div class="carousel-project-copy">
          <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
          <h3>${project.name}</h3>
          <p>${project.description}</p>
          <div class="project-actions">
            ${project.website ? `<a href="${project.website}" target="_blank" rel="noreferrer">${project.websiteLabel || 'Visit website'} <span aria-hidden="true">→</span></a>` : ''}
            <a class="project-case-link" href="${project.caseStudy}">Read case study <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="carousel-product-stage">${visualMarkup(project)}</div>
      </article>`).join('');

    dots.innerHTML = carouselProjects.map((project, index) => `<button type="button" aria-label="Show ${project.name}" data-carousel-dot="${index}"></button>`).join('');

    const slides = [...track.querySelectorAll('.carousel-slide')];
    const dotButtons = [...dots.querySelectorAll('button')];
    let activeIndex = 0;
    let pointerStart = 0;

    /** @param {number} index */
    const showProject = (index) => {
      activeIndex = Math.max(0, Math.min(carouselProjects.length - 1, index));
      track.style.transform = `translateX(-${activeIndex * 100}%)`;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.setAttribute('aria-hidden', String(!active));
        slide.querySelectorAll('a').forEach((link) => link.setAttribute('tabindex', active ? '0' : '-1'));
      });
      dotButtons.forEach((dot, dotIndex) => {
        dot.toggleAttribute('aria-current', dotIndex === activeIndex);
      });
      previous.disabled = activeIndex === 0;
      next.disabled = activeIndex === carouselProjects.length - 1;
      status.textContent = `Project ${activeIndex + 1} of ${carouselProjects.length}: ${carouselProjects[activeIndex].name}`;
    };

    previous.addEventListener('click', () => showProject(activeIndex - 1));
    next.addEventListener('click', () => showProject(activeIndex + 1));
    dotButtons.forEach((dot, index) => dot.addEventListener('click', () => showProject(index)));
    projectCarousel.addEventListener('keydown', (/** @type {KeyboardEvent} */ event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        showProject(activeIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        showProject(activeIndex + 1);
      }
    });
    projectCarousel.addEventListener('pointerdown', (/** @type {PointerEvent} */ event) => {
      pointerStart = event.clientX;
    });
    projectCarousel.addEventListener('pointerup', (/** @type {PointerEvent} */ event) => {
      const distance = event.clientX - pointerStart;
      if (Math.abs(distance) > 45) showProject(activeIndex + (distance < 0 ? 1 : -1));
    });
    showProject(0);
  }
}


window.addEventListener('scroll', () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 48);
  updateActiveNav();
}, { passive: true });
window.addEventListener('resize', updateActiveNav, { passive: true });

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
