const header = document.querySelector('[data-header]');
const navToggle = document.querySelector('.nav-toggle');
const nav = document.querySelector('.site-nav');
const navScrim = document.querySelector('.nav-scrim');
const masthead = document.querySelector('.site-header .masthead');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const projectCarousel = /** @type {HTMLElement | null} */ (document.querySelector('[data-project-carousel]'));
const introGate = /** @type {HTMLElement | null} */ (document.querySelector('[data-intro-gate]'));

if (introGate && document.documentElement.classList.contains('has-intro')) {
  const introContent = [header, document.querySelector('main'), document.querySelector('footer')].filter((element) => element instanceof HTMLElement);
  const closingPanel = /** @type {HTMLElement | null} */ (introGate.querySelector('.intro-panel-right'));
  let introComplete = false;
  let completionTimer = 0;

  const finishIntro = () => {
    if (introComplete) return;
    introComplete = true;
    window.clearTimeout(completionTimer);
    document.documentElement.classList.add('intro-complete');
    document.documentElement.classList.remove('has-intro', 'intro-running');
    introContent.forEach((element) => element.removeAttribute('inert'));
    introGate.hidden = true;
  };

  introContent.forEach((element) => element.setAttribute('inert', ''));
  requestAnimationFrame(() => document.documentElement.classList.add('intro-running'));
  closingPanel?.addEventListener('animationend', (/** @type {AnimationEvent} */ event) => {
    if (event.animationName === 'intro-door-right') window.setTimeout(finishIntro, 340);
  }, { once: true });
  completionTimer = window.setTimeout(finishIntro, 2350);
}

/** @param {boolean} open */
const setMenu = (open) => {
  navToggle?.setAttribute('aria-expanded', String(open));
  nav?.classList.toggle('is-open', open);
  document.body.classList.toggle('menu-open', open);
};

navToggle?.addEventListener('click', () => setMenu(navToggle.getAttribute('aria-expanded') !== 'true'));
navScrim?.addEventListener('click', () => setMenu(false));
masthead?.addEventListener('click', () => setMenu(false));
nav?.addEventListener('click', (event) => {
  if (event.target instanceof HTMLAnchorElement) setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && navToggle?.getAttribute('aria-expanded') === 'true') {
    setMenu(false);
    if (navToggle instanceof HTMLElement) navToggle.focus();
  }
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

let dominantSectionId = '';
let activeSectionFrame = 0;

/** @param {Element} section */
const visibleViewportShare = (section) => {
  const bounds = section.getBoundingClientRect();
  const headerBottom = header instanceof HTMLElement ? Math.max(0, header.getBoundingClientRect().bottom) : 0;
  const availableHeight = Math.max(1, window.innerHeight - headerBottom);
  const visibleTop = Math.max(bounds.top, headerBottom);
  const visibleBottom = Math.min(bounds.bottom, window.innerHeight);
  return Math.max(0, visibleBottom - visibleTop) / availableHeight;
};

const updateActiveNavFromViewport = () => {
  activeSectionFrame = 0;
  const visibleSections = navSections
    .filter((section) => section instanceof HTMLElement)
    .map((section) => ({ section, share: visibleViewportShare(section) }))
    .filter(({ share }) => share > 0)
    .sort((a, b) => b.share - a.share);

  if (visibleSections.length === 0) {
    dominantSectionId = '';
    setActiveNav('');
    return;
  }

  let dominant = visibleSections[0];
  const current = visibleSections.find(({ section }) => section.id === dominantSectionId);
  if (current && dominant.section.id !== current.section.id && dominant.share < current.share + 0.04) dominant = current;

  dominantSectionId = dominant.section.id;
  setActiveNav(dominant.section.hasAttribute('data-nav-neutral') ? '' : dominantSectionId);
};

const scheduleActiveNavUpdate = () => {
  if (!activeSectionFrame) activeSectionFrame = requestAnimationFrame(updateActiveNavFromViewport);
};

const activeSectionObserver = new IntersectionObserver(scheduleActiveNavUpdate, {
  threshold: Array.from({ length: 21 }, (_, index) => index / 20),
});
navSections.forEach((section) => activeSectionObserver.observe(section));
scheduleActiveNavUpdate();

/** @typedef {{ name: string, description: string, impact: string, website: string, websiteLabel?: string, caseStudy: string, tone: string, visual: string, image: string, alt: string }} CarouselProject */
/** @type {CarouselProject[]} */
const carouselProjects = [
  {
    name: 'BumpNotes',
    description: 'Helping women capture what matters during pregnancy.',
    impact: 'Built from my own pregnancy.',
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
    impact: 'Designed for real weeks.',
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
    impact: 'Built for more intentional attention.',
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
    impact: 'Making complexity legible.',
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
    impact: 'Created for better conversations.',
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
    impact: 'Learning through active practice.',
    website: '',
    caseStudy: '/projects/aurelle.html',
    tone: 'peach',
    visual: 'abstract abstract-pages',
    image: '',
    alt: '',
  },
];

if (projectCarousel) {
  const viewport = /** @type {HTMLElement | null} */ (projectCarousel.querySelector('.project-carousel-viewport'));
  const track = /** @type {HTMLElement | null} */ (projectCarousel.querySelector('[data-carousel-track]'));
  const previous = projectCarousel.querySelector('[data-carousel-previous]');
  const next = projectCarousel.querySelector('[data-carousel-next]');
  const dots = projectCarousel.querySelector('[data-carousel-dots]');
  const status = projectCarousel.querySelector('[data-carousel-status]');

  /** @param {CarouselProject} project @param {number} index */
  const visualMarkup = (project, index) => {
    if (project.image) {
      return `<div class="carousel-visual-frame ${project.visual}"><img src="${project.image}" alt="${project.alt}" width="1600" height="1041" loading="${index === 0 ? 'eager' : 'lazy'}" decoding="async"></div>`;
    }
    if (project.visual.includes('abstract-grid')) return '<div class="carousel-visual-frame abstract"><div class="carousel-window-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>';
    if (project.visual.includes('abstract-circles')) return '<div class="carousel-visual-frame abstract"><div class="carousel-window-circles" aria-hidden="true"><i></i><i></i><i></i></div></div>';
    return '<div class="carousel-visual-frame abstract"><div class="carousel-window-pages" aria-hidden="true"><i></i><i></i></div></div>';
  };

  if (viewport && track && dots && previous instanceof HTMLButtonElement && next instanceof HTMLButtonElement && status) {
    track.innerHTML = carouselProjects.map((project, index) => `
      <article class="carousel-slide tone-${project.tone}" aria-roledescription="slide" aria-label="${index + 1} of ${carouselProjects.length}: ${project.name}" aria-hidden="${index !== 0}">
        <div class="carousel-project-copy">
          <span class="project-index">${String(index + 1).padStart(2, '0')}</span>
          <h3>${project.name}</h3>
          <p>${project.description}</p>
          <p class="project-impact"><span aria-hidden="true">✦</span>${project.impact}</p>
          <div class="project-actions">
            ${project.website ? `<a href="${project.website}" target="_blank" rel="noreferrer">${project.websiteLabel || 'Visit website'} <span aria-hidden="true">→</span></a>` : ''}
            <a class="project-case-link" href="${project.caseStudy}">Read case study <span aria-hidden="true">→</span></a>
          </div>
        </div>
        <div class="carousel-product-stage">${visualMarkup(project, index)}</div>
      </article>`).join('');

    dots.innerHTML = carouselProjects.map((project, index) => `<button type="button" aria-label="Show ${project.name}" data-carousel-dot="${index}"></button>`).join('');

    const slides = [...track.querySelectorAll('.carousel-slide')];
    const dotButtons = [...dots.querySelectorAll('button')];
    let activeIndex = 0;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let activePointer = -1;
    let horizontalDrag = false;
    let suppressClick = false;

    const syncViewportHeight = () => {
      if (window.matchMedia('(max-width: 767px)').matches) {
        viewport.style.height = `${slides[activeIndex].scrollHeight}px`;
      } else {
        viewport.style.removeProperty('height');
      }
    };

    /** @param {number} index */
    const showProject = (index) => {
      activeIndex = Math.max(0, Math.min(carouselProjects.length - 1, index));
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
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
      requestAnimationFrame(syncViewportHeight);
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
      if (!event.isPrimary || event.button !== 0) return;
      activePointer = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      horizontalDrag = false;
    });
    projectCarousel.addEventListener('pointermove', (/** @type {PointerEvent} */ event) => {
      if (event.pointerId !== activePointer) return;
      const distanceX = event.clientX - pointerStartX;
      const distanceY = event.clientY - pointerStartY;
      if (!horizontalDrag && Math.abs(distanceX) > 10 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25) {
        horizontalDrag = true;
        try {
          projectCarousel.setPointerCapture?.(event.pointerId);
        } catch {
          // Some embedded browsers do not expose pointer capture for synthetic gestures.
        }
      }
      if (!horizontalDrag) return;
      event.preventDefault();
      const atBoundary = (activeIndex === 0 && distanceX > 0) || (activeIndex === carouselProjects.length - 1 && distanceX < 0);
      const offset = atBoundary ? distanceX * 0.22 : distanceX;
      track.classList.add('is-dragging');
      track.style.transform = `translate3d(calc(-${activeIndex * 100}% + ${offset}px), 0, 0)`;
    });
    const finishPointer = (/** @type {PointerEvent} */ event) => {
      if (event.pointerId !== activePointer) return;
      const distanceX = event.clientX - pointerStartX;
      const distanceY = event.clientY - pointerStartY;
      const shouldChange = horizontalDrag && Math.abs(distanceX) >= 48 && Math.abs(distanceX) > Math.abs(distanceY) * 1.25;
      suppressClick = shouldChange;
      track.classList.remove('is-dragging');
      activePointer = -1;
      showProject(activeIndex + (shouldChange ? (distanceX < 0 ? 1 : -1) : 0));
    };
    projectCarousel.addEventListener('pointerup', finishPointer);
    projectCarousel.addEventListener('pointercancel', (/** @type {PointerEvent} */ event) => {
      if (event.pointerId !== activePointer) return;
      track.classList.remove('is-dragging');
      activePointer = -1;
      showProject(activeIndex);
    });
    projectCarousel.addEventListener('click', (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
      suppressClick = false;
    }, true);
    projectCarousel.addEventListener('lostpointercapture', () => {
      if (activePointer === -1) return;
      track.classList.remove('is-dragging');
      activePointer = -1;
      showProject(activeIndex);
    });
    window.addEventListener('resize', syncViewportHeight, { passive: true });
    if ('ResizeObserver' in window) {
      const slideResizeObserver = new ResizeObserver(syncViewportHeight);
      slides.forEach((slide) => slideResizeObserver.observe(slide));
    }
    document.fonts?.ready.then(syncViewportHeight);
    showProject(0);
  }
}

const alignHashTarget = () => {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  target?.scrollIntoView({ block: 'start' });
};

if (window.location.hash) {
  requestAnimationFrame(() => requestAnimationFrame(alignHashTarget));
  window.addEventListener('load', alignHashTarget, { once: true });
}

window.addEventListener('scroll', () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 48);
}, { passive: true });
window.addEventListener('resize', scheduleActiveNavUpdate, { passive: true });

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
