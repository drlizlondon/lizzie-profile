import { trackSiteEvent } from './site-events.js';
import './resources.js';

trackSiteEvent('site_viewed');

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

const navLinks = [...document.querySelectorAll('[data-nav-section]')];
const navSections = [...document.querySelectorAll('[data-nav-target]')];
const mobileMenuQuery = window.matchMedia('(max-width: 820px)');
const menuBackground = [document.querySelector('.skip-link'), document.querySelector('main'), document.querySelector('footer')]
  .filter((element) => element instanceof HTMLElement);

let activeNavSectionId = '';
let dominantSectionId = '';
let activeSectionFrame = 0;
let menuOpen = false;
let menuClosing = false;
let menuScrollY = 0;
let menuCloseTimer = 0;
let navigationLockId = '';
let navigationToken = 0;
let navigationSettleFrame = 0;
/** @type {HTMLElement | null} */
let navigationFocusTarget = null;
/** @type {{ position: string, top: string, left: string, right: string, width: string, menuScrollOffset: string } | null} */
let savedBodyStyles = null;

/** @param {string} sectionId */
const setActiveNav = (sectionId) => {
  if (activeNavSectionId === sectionId) return;
  activeNavSectionId = sectionId;
  navLinks.forEach((link) => {
    const active = link.getAttribute('data-nav-section') === sectionId;
    link.classList.toggle('is-active', active);
    if (active) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
};

const lockMenuBackground = () => {
  menuScrollY = window.scrollY;
  savedBodyStyles = {
    position: document.body.style.position,
    top: document.body.style.top,
    left: document.body.style.left,
    right: document.body.style.right,
    width: document.body.style.width,
    menuScrollOffset: document.body.style.getPropertyValue('--menu-scroll-y'),
  };
  document.body.style.position = 'fixed';
  document.body.style.top = `-${menuScrollY}px`;
  document.body.style.left = '0';
  document.body.style.right = '0';
  document.body.style.width = '100%';
  document.body.style.setProperty('--menu-scroll-y', `${menuScrollY}px`);
  menuBackground.forEach((element) => element.setAttribute('inert', ''));
};

const restoreMenuScroll = () => {
  const restoreY = menuScrollY;
  if (savedBodyStyles) {
    document.body.style.position = savedBodyStyles.position;
    document.body.style.top = savedBodyStyles.top;
    document.body.style.left = savedBodyStyles.left;
    document.body.style.right = savedBodyStyles.right;
    document.body.style.width = savedBodyStyles.width;
    if (savedBodyStyles.menuScrollOffset) document.body.style.setProperty('--menu-scroll-y', savedBodyStyles.menuScrollOffset);
    else document.body.style.removeProperty('--menu-scroll-y');
  }
  savedBodyStyles = null;

  const previousScrollBehavior = document.documentElement.style.scrollBehavior;
  document.documentElement.style.scrollBehavior = 'auto';
  window.scrollTo(0, restoreY);
  requestAnimationFrame(() => {
    window.scrollTo(0, restoreY);
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
  });
};

const finishMenuClose = () => {
  window.clearTimeout(menuCloseTimer);
  menuCloseTimer = 0;
  menuClosing = false;
  document.body.classList.remove('menu-closing');
  menuBackground.forEach((element) => element.removeAttribute('inert'));
  if (navScrim instanceof HTMLElement) navScrim.tabIndex = -1;
  scheduleActiveNavUpdate();
};

/**
 * @param {boolean} open
 * @param {{ restoreFocus?: boolean, immediate?: boolean }} [options]
 */
const setMenu = (open, { restoreFocus = false, immediate = false } = {}) => {
  const nextOpen = open && mobileMenuQuery.matches;
  if (nextOpen === menuOpen) {
    if (!nextOpen && immediate && menuClosing) finishMenuClose();
    return;
  }

  menuOpen = nextOpen;
  navToggle?.setAttribute('aria-expanded', String(nextOpen));
  nav?.classList.toggle('is-open', nextOpen);

  if (nextOpen) {
    window.clearTimeout(menuCloseTimer);
    menuClosing = false;
    document.body.classList.remove('menu-closing');
    lockMenuBackground();
    document.body.classList.add('menu-open');
    if (navScrim instanceof HTMLElement) navScrim.tabIndex = 0;
    return;
  }

  document.body.classList.remove('menu-open');
  document.body.classList.add('menu-closing');
  menuClosing = true;
  restoreMenuScroll();
  if (restoreFocus && navToggle instanceof HTMLElement) navToggle.focus({ preventScroll: true });

  if (immediate || reduceMotion.matches) finishMenuClose();
  else menuCloseTimer = window.setTimeout(finishMenuClose, 420);
};

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
  if (menuOpen || menuClosing || navigationLockId) return;

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
  if (menuOpen || menuClosing || navigationLockId) return;
  if (!activeSectionFrame) activeSectionFrame = requestAnimationFrame(updateActiveNavFromViewport);
};

/** @param {number} token @param {boolean} destinationReached */
const finishSectionNavigation = (token, destinationReached) => {
  if (token !== navigationToken) return;
  cancelAnimationFrame(navigationSettleFrame);
  navigationSettleFrame = 0;
  navigationLockId = '';
  updateActiveNavFromViewport();

  const focusTarget = navigationFocusTarget;
  navigationFocusTarget = null;
  if (destinationReached && focusTarget) {
    const previousTabIndex = focusTarget.getAttribute('tabindex');
    focusTarget.setAttribute('tabindex', '-1');
    focusTarget.focus({ preventScroll: true });
    focusTarget.addEventListener('blur', () => {
      if (previousTabIndex === null) focusTarget.removeAttribute('tabindex');
      else focusTarget.setAttribute('tabindex', previousTabIndex);
    }, { once: true });
  }
};

/** @param {HTMLElement} target @param {number} token */
const waitForSectionNavigation = (target, token) => {
  let previousScrollY = window.scrollY;
  let stableFrames = 0;
  const startedAt = performance.now();

  const checkPosition = () => {
    if (token !== navigationToken) return;
    const currentScrollY = window.scrollY;
    const movement = Math.abs(currentScrollY - previousScrollY);
    const targetDistance = Math.abs(target.getBoundingClientRect().top);
    const maximumScrollY = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    const atDocumentEnd = Math.abs(currentScrollY - maximumScrollY) <= 2;
    const destinationReached = targetDistance <= 3 || atDocumentEnd;
    stableFrames = movement < 0.5 ? stableFrames + 1 : 0;
    previousScrollY = currentScrollY;

    if (stableFrames >= 3 && destinationReached) {
      finishSectionNavigation(token, true);
      return;
    }
    if (performance.now() - startedAt > 1500) {
      finishSectionNavigation(token, false);
      return;
    }
    navigationSettleFrame = requestAnimationFrame(checkPosition);
  };

  navigationSettleFrame = requestAnimationFrame(checkPosition);
};

/** @param {string} sectionId @param {string} hash */
const navigateFromMobileMenu = (sectionId, hash) => {
  const target = document.getElementById(sectionId);
  if (!(target instanceof HTMLElement)) {
    setMenu(false);
    return;
  }

  navigationToken += 1;
  const token = navigationToken;
  cancelAnimationFrame(navigationSettleFrame);
  navigationLockId = sectionId;
  dominantSectionId = sectionId;
  const headingId = target.getAttribute('aria-labelledby');
  const heading = headingId ? document.getElementById(headingId) : null;
  navigationFocusTarget = heading instanceof HTMLElement ? heading : target;
  setActiveNav(sectionId);
  setMenu(false);

  if (hash && window.location.hash !== hash) window.history.pushState(null, '', hash);
  requestAnimationFrame(() => {
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    waitForSectionNavigation(target, token);
  });
};

navToggle?.addEventListener('click', () => setMenu(!menuOpen));
navScrim?.addEventListener('click', () => setMenu(false, { restoreFocus: true }));
masthead?.addEventListener('click', (event) => {
  if (mobileMenuQuery.matches && menuOpen && masthead instanceof HTMLAnchorElement) {
    const homeTarget = document.getElementById('home');
    if (homeTarget) {
      event.preventDefault();
      navigateFromMobileMenu('home', masthead.hash);
    } else {
      setMenu(false);
    }
    return;
  }
  setMenu(false);
});
nav?.addEventListener('pointerdown', (event) => event.stopPropagation());
nav?.addEventListener('click', (event) => {
  event.stopPropagation();
  const link = event.target instanceof Element ? event.target.closest('a[data-nav-section]') : null;
  if (!(link instanceof HTMLAnchorElement)) return;

  if (mobileMenuQuery.matches && menuOpen) {
    event.preventDefault();
    navigateFromMobileMenu(link.dataset.navSection ?? '', link.hash);
    return;
  }
  setMenu(false);
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && menuOpen) setMenu(false, { restoreFocus: true });
});
mobileMenuQuery.addEventListener('change', (event) => {
  if (!event.matches) setMenu(false, { immediate: true });
  scheduleActiveNavUpdate();
});

const activeSectionObserver = new IntersectionObserver(scheduleActiveNavUpdate, {
  threshold: Array.from({ length: 21 }, (_, index) => index / 20),
});
navSections.forEach((section) => activeSectionObserver.observe(section));
scheduleActiveNavUpdate();

/** @typedef {{ name: string, problem: string, thinking: string, outcome: string, website: string, caseStudy: string, tone: string, visual: string, image: string, alt: string }} CarouselProject */
/** @type {CarouselProject[]} */
const carouselProjects = [
  {
    name: 'BumpNotes',
    problem: 'Pregnancy information is fragmented, while the details that matter are difficult to recall under pressure.',
    thinking: 'Design around the woman’s own story, not another generic stream of health content.',
    outcome: 'A simple record that helps women capture what matters and communicate it clearly.',
    website: 'https://www.bumpnotes.co.uk',
    caseStudy: '/projects/bumpnotes.html',
    tone: 'lavender',
    visual: 'screen',
    image: new URL('./assets/images/project-bumpnotes.webp', import.meta.url).href,
    alt: 'BumpNotes pregnancy summary interface',
  },
  {
    name: 'Big Picture Planner',
    problem: 'Traditional planners reward busyness and allow urgent tasks to crowd out meaningful priorities.',
    thinking: 'Plan around the reality of a whole week, including limited time, energy and competing roles.',
    outcome: 'A weekly planning system that keeps the bigger picture visible while making the next step practical.',
    website: 'https://www.bigpictureplanner.app',
    caseStudy: '/projects/big-picture-planner.html',
    tone: 'cream',
    visual: 'screen planner-screen',
    image: new URL('./assets/images/project-big-picture-planner.webp', import.meta.url).href,
    alt: 'Big Picture Planner weekly planning interface',
  },
  {
    name: 'myBishBash',
    problem: 'Phones are designed to capture attention, even when that attention conflicts with the life someone wants.',
    thinking: 'Replace restriction and guilt with deliberate choices about what the phone is there to support.',
    outcome: 'A calmer way to shape phone use around personal priorities and intentional attention.',
    website: 'https://mybishbash.app',
    caseStudy: '/projects/mybishbash.html',
    tone: 'sage',
    visual: 'screen',
    image: new URL('./assets/images/project-mybishbash.webp', import.meta.url).href,
    alt: 'myBishBash intentional phone app preview',
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
          <dl class="project-reasoning">
            <div><dt>Problem</dt><dd>${project.problem}</dd></div>
            <div><dt>Thinking</dt><dd>${project.thinking}</dd></div>
            <div><dt>Outcome</dt><dd>${project.outcome}</dd></div>
          </dl>
          <div class="project-actions">
            <a class="project-case-link" href="${project.website}" target="_blank" rel="noopener noreferrer">Visit ${project.name} <span aria-hidden="true">→</span></a>
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

    /** @param {number} index */
    const showProject = (index) => {
      activeIndex = Math.max(0, Math.min(carouselProjects.length - 1, index));
      track.style.transform = `translate3d(-${activeIndex * 100}%, 0, 0)`;
      slides.forEach((slide, slideIndex) => {
        const active = slideIndex === activeIndex;
        slide.setAttribute('aria-hidden', String(!active));
        slide.querySelectorAll('a, button').forEach((control) => control.setAttribute('tabindex', active ? '0' : '-1'));
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
    showProject(0);
  }
}

const syncHeaderState = () => {
  header?.classList.toggle('is-scrolled', window.scrollY > 48);
};

const alignHashTarget = () => {
  const id = decodeURIComponent(window.location.hash.slice(1));
  const target = id ? document.getElementById(id) : null;
  target?.scrollIntoView({ block: 'start' });
  syncHeaderState();
};

if (window.location.hash) {
  requestAnimationFrame(() => requestAnimationFrame(alignHashTarget));
  window.addEventListener('load', alignHashTarget, { once: true });
}

window.addEventListener('scroll', syncHeaderState, { passive: true });
window.addEventListener('resize', scheduleActiveNavUpdate, { passive: true });
syncHeaderState();

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

const fableCopyButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-copy-fable]'));
const fableDownloadButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-download-fable]'));
const fablePrompt = document.querySelector('[data-fable-prompt]');
const fableCopyStatus = document.querySelector('[data-fable-copy-status]');

if (fablePrompt) trackSiteEvent('fable_prompt_viewed');

fableCopyButton?.addEventListener('click', async () => {
  const prompt = fablePrompt?.textContent?.trim();
  if (!prompt) return;
  try {
    await navigator.clipboard.writeText(prompt);
    const buttonLabel = fableCopyButton.firstChild;
    if (buttonLabel) buttonLabel.textContent = 'Copied ';
    if (fableCopyStatus) fableCopyStatus.textContent = 'The Betty Prompt has been copied to your clipboard.';
    trackSiteEvent('fable_free_prompt_copied');
    window.setTimeout(() => {
      if (buttonLabel) buttonLabel.textContent = 'Copy it now ';
      if (fableCopyStatus) fableCopyStatus.textContent = '';
    }, 2400);
  } catch {
    if (fableCopyStatus) fableCopyStatus.textContent = 'Copy failed. Select the prompt text and copy it manually.';
  }
});

fableDownloadButton?.addEventListener('click', () => {
  const prompt = fablePrompt?.textContent?.trim();
  if (!prompt) return;

  try {
    const downloadUrl = URL.createObjectURL(new Blob([`${prompt}\n`], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'the-betty-prompt.txt';
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    if (fableCopyStatus) fableCopyStatus.textContent = 'The Betty Prompt has been downloaded as a text file.';
    trackSiteEvent('fable_free_prompt_downloaded');
    window.setTimeout(() => {
      if (fableCopyStatus) fableCopyStatus.textContent = '';
    }, 2400);
  } catch {
    if (fableCopyStatus) fableCopyStatus.textContent = 'Download failed. Select the prompt text and copy it manually.';
  }
});
