import { createState, isValidEmail, normaliseEmail } from './builder-state.js';

/**
 * Shared guided-builder engine. Each tool (Build a Business, Build a Website)
 * supplies a config; this file holds no tool-specific copy.
 * @param {Record<string, any>} config
 */
export const mountBuilder = (config) => {
  const { questions, sections } = config;
  const { loadState, saveState, clearState, hasUsefulAnswer } = createState({ storageKey: config.storageKey, questions });
  const root = document.querySelector('[data-builder]');
  const live = document.querySelector('[data-builder-live]');
  let state = loadState();

  /** @param {string} tag @param {Record<string, any>} [options] @param {any[]} [children] @returns {any} */
  const el = (tag, options = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(options)) {
      if (key === 'className') node.className = value;
      else if (key === 'text') node.textContent = value;
      else if (key.startsWith('data-')) node.setAttribute(key, value);
      else if (key in node) /** @type {any} */ (node)[key] = value;
      else node.setAttribute(key, value);
    }
    for (const child of Array.isArray(children) ? children : [children]) if (child) node.append(child);
    return node;
  };

  /** @param {string} message */
  const announce = (message) => {
    if (!live) return;
    live.textContent = '';
    requestAnimationFrame(() => { live.textContent = message; });
  };

  /** Event names only ever carry a section id, never answer text or an email. @param {string} event @param {Record<string, string>} [detail] */
  const track = (event, detail = {}) => {
    const safe = { event: `${config.eventPrefix}${event}`, ...detail };
    window.dispatchEvent(new CustomEvent('lizprofile:product-event', { detail: safe }));
    const analyticsWindow = /** @type {Window & { dataLayer?: Array<Record<string, string>> }} */ (window);
    if (Array.isArray(analyticsWindow.dataLayer)) analyticsWindow.dataLayer.push(safe);
  };

  const persist = () => saveState(state);

  /** @param {string} view */
  const setView = (view) => {
    state.view = view;
    persist();
    render();
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  };

  const restartBuilder = () => {
    if (!confirm('Start again? Your answers and generated prompts will be lost.')) return;
    track('builder_restarted');
    clearState();
    state = loadState();
    render();
    announce('Your answers have been cleared.');
  };

  const restartControl = () => {
    const wrap = el('div', { className: 'bab-restart-row' });
    const button = el('button', { type: 'button', className: 'bab-text-action', text: 'Start again' });
    button.addEventListener('click', restartBuilder);
    wrap.append(button);
    return wrap;
  };

  const progress = () => {
    const current = state.index + 1;
    const wrap = el('div', { className: 'bab-progress', role: 'progressbar', 'aria-valuemin': '1', 'aria-valuemax': String(questions.length), 'aria-valuenow': String(current), 'aria-label': `Question ${current} of ${questions.length}` });
    wrap.append(el('span', { style: `--progress:${(current / questions.length) * 100}%` }));
    return wrap;
  };

  /** @param {Record<string, any>} question @param {string} option @param {string} [description] */
  const selectionControl = (question, option, description = '') => {
    const selectedValue = state.answers[question.id];
    const selected = question.type === 'multi' ? selectedValue.includes(option) : selectedValue === option;
    const input = el('input', { type: question.type === 'multi' ? 'checkbox' : 'radio', name: question.id, value: option, checked: selected });
    const title = el('span', { className: 'bab-choice-title', text: option });
    const label = el('label', { className: `bab-choice${description ? ' bab-choice-visual' : ''}` }, [input, el('span', { className: 'bab-choice-copy' }, [title, description ? el('small', { text: description }) : null])]);
    input.addEventListener('change', () => {
      if (question.type === 'multi') {
        const values = new Set(state.answers[question.id]);
        input.checked ? values.add(option) : values.delete(option);
        if (question.max && values.size > question.max) {
          input.checked = false;
          values.delete(option);
          announce(`Choose up to ${question.max}.`);
        }
        state.answers[question.id] = [...values];
      } else {
        state.answers[question.id] = option;
        if (question.followUp && !question.followUp.when.includes(option)) state.answers[question.followUp.id] = '';
      }
      persist();
      renderQuestionContent(question, document.querySelector('[data-question-content]'));
    });
    return label;
  };

  /** @param {Record<string, any>} question @param {any} container @param {() => void} [onChange] */
  const renderQuestionContent = (question, container, onChange = () => {}) => {
    if (!container) return;
    container.replaceChildren();
    if (question.type === 'email') {
      const errorId = `${question.id}-error`;
      const input = el('input', {
        className: 'bab-text-input',
        type: 'email',
        name: question.id,
        value: state.answers[question.id],
        placeholder: question.placeholder ?? '',
        autocomplete: 'email',
        inputmode: 'email',
        maxlength: 254,
        'aria-describedby': errorId,
      });
      const error = el('p', { className: 'bab-validation bab-email-error', id: errorId, role: 'alert' });
      input.addEventListener('input', () => {
        state.answers[question.id] = normaliseEmail(input.value);
        if (isValidEmail(state.answers[question.id])) { error.textContent = ''; input.removeAttribute('aria-invalid'); }
        persist();
        onChange();
      });
      input.addEventListener('blur', () => {
        const value = normaliseEmail(input.value);
        input.value = value;
        state.answers[question.id] = value;
        persist();
        const valid = isValidEmail(value);
        error.textContent = valid ? '' : 'Please enter a valid email address.';
        if (valid) input.removeAttribute('aria-invalid'); else input.setAttribute('aria-invalid', 'true');
        onChange();
      });
      container.append(input, error);
    } else if (question.type === 'text' || question.type === 'textarea') {
      const input = el(question.type === 'textarea' ? 'textarea' : 'input', {
        className: 'bab-text-input',
        name: question.id,
        value: state.answers[question.id],
        placeholder: question.placeholder ?? '',
        rows: question.type === 'textarea' ? 5 : undefined,
        maxlength: 2000,
      });
      input.addEventListener('input', () => { state.answers[question.id] = input.value; persist(); });
      container.append(input);
      if (question.quickChoices) {
        const quick = el('div', { className: 'bab-quick-choices' });
        for (const choice of question.quickChoices) {
          const button = el('button', { type: 'button', className: 'bab-quiet-button', text: choice });
          button.addEventListener('click', () => { state.answers[question.id] = choice; persist(); render(); });
          quick.append(button);
        }
        container.append(quick);
      }
    } else {
      const choices = el('div', { className: `bab-choices${question.type === 'visual' ? ' bab-visual-grid' : ''}` });
      for (const option of question.options) {
        const [value, description] = Array.isArray(option) ? option : [option, ''];
        choices.append(selectionControl(question, value, description));
      }
      container.append(choices);
    }

    const value = state.answers[question.id];
    const guidance = config.guidanceFor(question, value);
    if (guidance) container.append(el('p', { className: 'bab-guidance', text: guidance }));

    if (question.followUp && question.followUp.when.includes(value)) {
      const field = el('label', { className: 'bab-follow-up' }, [
        el('span', { text: question.followUp.label }),
        el('input', { type: 'text', value: state.answers[question.followUp.id], placeholder: question.followUp.placeholder, maxlength: 500 }),
      ]);
      field.querySelector('input').addEventListener('input', (/** @type {InputEvent} */ event) => { state.answers[question.followUp.id] = /** @type {HTMLInputElement} */ (event.target).value; persist(); });
      container.append(field);
    }
  };

  const welcome = () => {
    const copy = config.welcome;
    const main = el('section', { className: 'bab-welcome', 'aria-labelledby': 'builder-title' });
    const left = el('div', { className: 'bab-welcome-copy' }, [
      el('p', { className: 'bab-eyebrow', text: copy.eyebrow }),
      el('span', { className: 'bab-eyebrow-rule', 'aria-hidden': 'true' }),
      el('h1', { id: 'builder-title' }, copy.titleLines.map((/** @type {string} */ text) => el('span', { text }))),
      el('p', { className: 'bab-lead', text: copy.lead }),
      el('div', { className: 'bab-welcome-body' }, copy.body.map((/** @type {string} */ text) => el('p', { text }))),
    ]);
    const start = el('button', { type: 'button', className: 'bab-primary', text: state.started ? copy.continueLabel : copy.startLabel });
    start.addEventListener('click', () => {
      if (!state.started) track('builder_started');
      state.started = true;
      state.view = 'questions';
      persist();
      render();
    });
    start.append(el('span', { className: 'bab-cta-arrow', text: '→', 'aria-hidden': 'true' }));
    left.append(start, el('div', { className: 'bab-welcome-meta' }, [el('span', { text: copy.meta })]));
    const right = el('div', { className: 'bab-welcome-features', 'aria-label': 'What you will create' });
    copy.features.forEach((/** @type {string[]} */ [icon, title, description]) => right.append(el('article', { className: 'bab-feature' }, [
      el('span', { className: `bab-feature-icon bab-feature-icon-${icon}`, 'aria-hidden': 'true' }),
      el('div', {}, [el('h2', { text: title }), el('p', { text: description })]),
    ])));
    main.append(left, right);
    return main;
  };

  const questionScreen = () => {
    const question = questions[state.index];
    const section = sections.find((/** @type {Record<string, any>} */ item) => state.index >= item.start && state.index <= item.end);
    const screen = el('section', { className: 'bab-question-screen', 'aria-labelledby': 'question-title' });
    screen.append(restartControl(), progress(), el('p', { className: 'bab-section-label', text: section?.label ?? config.sectionFallback }), el('h1', { id: 'question-title', text: question.question }));
    if (question.helper) screen.append(el('p', { className: 'bab-helper', text: question.helper }));
    const content = el('div', { 'data-question-content': '' });
    screen.append(content);

    const error = el('p', { className: 'bab-validation', role: 'alert' });
    const controls = el('div', { className: 'bab-controls' });
    const back = el('button', { type: 'button', className: 'bab-secondary', text: 'Back' });
    const next = el('button', { type: 'button', className: 'bab-primary', text: state.index === questions.length - 1 ? config.question.reviewLabel : config.question.continueLabel });
    const syncNext = () => { if (question.type === 'email') next.disabled = !hasUsefulAnswer(question, state.answers); };
    renderQuestionContent(question, content, syncNext);
    syncNext();
    back.addEventListener('click', () => {
      if (state.index === 0) setView('welcome');
      else { state.index -= 1; persist(); render(); }
    });
    next.addEventListener('click', () => {
      if (!hasUsefulAnswer(question, state.answers)) {
        error.textContent = config.question.requiredError;
        return;
      }
      const completedSection = sections.find((/** @type {Record<string, any>} */ item) => item.end === state.index);
      if (completedSection) track('section_completed', { section: completedSection.id });
      if (state.index === questions.length - 1) setView('review');
      else { state.index += 1; persist(); render(); }
    });
    controls.append(back, next);
    screen.append(error, controls, el('p', { className: 'bab-privacy', text: config.question.privacy }));
    return screen;
  };

  /** @param {Record<string, any>} question */
  const answerText = (question) => {
    const value = state.answers[question.id];
    if (Array.isArray(value)) return value.join(', ') || 'Use a placeholder';
    return value || 'Use a placeholder';
  };

  const review = () => {
    const copy = config.review;
    const screen = el('section', { className: 'bab-review', 'aria-labelledby': 'review-title' }, [
      restartControl(),
      el('p', { className: 'bab-eyebrow', text: copy.eyebrow }),
      el('h1', { id: 'review-title', text: copy.title }),
      el('p', { className: 'bab-lead bab-review-lead', text: copy.lead }),
    ]);
    const list = el('div', { className: 'bab-review-list' });
    questions.forEach((/** @type {Record<string, any>} */ question, /** @type {number} */ index) => {
      const edit = el('button', { type: 'button', className: 'bab-edit', text: 'Edit', 'aria-label': `Edit: ${question.question}` });
      edit.addEventListener('click', () => { state.index = index; setView('questions'); });
      list.append(el('article', { className: 'bab-review-item' }, [el('div', {}, [el('h2', { text: question.question }), el('p', { text: answerText(question) })]), edit]));
    });
    const controls = el('div', { className: 'bab-controls' });
    const back = el('button', { type: 'button', className: 'bab-secondary', text: 'Back' });
    back.addEventListener('click', () => { state.index = questions.length - 1; setView('questions'); });
    const create = el('button', { type: 'button', className: 'bab-primary', text: copy.createLabel });
    create.addEventListener('click', () => { track('builder_completed'); setView('results'); announce(copy.announce); });
    controls.append(back, create);
    screen.append(list, controls);
    return screen;
  };

  /** @param {string} label @param {string} value @param {string} event */
  const copyButton = (label, value, event) => {
    const button = el('button', { type: 'button', className: 'bab-copy', text: label });
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(value);
        button.textContent = 'Copied ✓';
        track(event);
        announce(`${label} copied.`);
        setTimeout(() => { button.textContent = label; }, 2200);
      } catch {
        announce('Copy was not available. Select the text and copy it manually.');
      }
    });
    return button;
  };

  /** @param {string} title @param {string} intro @param {string} value @param {string} copyLabel @param {string} event @param {boolean} [open] @param {HTMLElement|null} [extraAction] */
  const outputCard = (title, intro, value, copyLabel, event, open = false, extraAction = null) => {
    const content = el('pre', { className: 'bab-output-text', text: value, tabindex: '0' });
    const actions = el('div', { className: 'bab-output-actions' }, [copyButton(copyLabel, value, event), extraAction]);
    const body = el('div', { className: 'bab-output-body' }, [intro ? el('p', { className: 'bab-output-intro', text: intro }) : null, content, actions]);
    if (open) return el('section', { className: 'bab-output-card' }, [el('h2', { text: title }), body]);
    return el('details', { className: 'bab-output-card' }, [el('summary', { text: title }), body]);
  };

  /** Renders the config's ordered result items. @param {Record<string, any>[]} items */
  const renderResultItems = (items) => items.map((item) => {
    if (item.kind === 'output') {
      const openLovable = item.openLovable ? el('a', {
        className: 'bab-lovable-link',
        href: 'https://lovable.dev/',
        target: '_blank',
        rel: 'noreferrer',
        text: 'Open Lovable ↗',
      }) : null;
      return outputCard(item.title, item.intro, item.build(state.answers), item.copyLabel, item.event, Boolean(item.open), openLovable);
    }
    if (item.kind === 'summaryCard') {
      const list = el('dl', { className: 'baw-summary' });
      for (const [label, value] of item.lines(state.answers)) list.append(el('div', {}, [el('dt', { text: label }), el('dd', { text: value })]));
      return el('section', { className: 'bab-output-card baw-summary-card' }, [el('h2', { text: item.title }), list]);
    }
    if (item.kind === 'ticks') {
      const list = el('ul', { className: 'baw-ticks' });
      for (const line of item.items(state.answers)) list.append(el('li', {}, [el('span', { className: 'baw-tick', text: '✓', 'aria-hidden': 'true' }), line]));
      return el('section', { className: 'bab-output-card baw-includes' }, [el('h2', { text: item.title }), list]);
    }
    if (item.kind === 'note') return el('p', { className: 'bab-privacy bab-results-privacy', text: item.text });
    const checklist = el('section', { className: 'bab-output-card bab-checklist' }, [el('h2', { text: item.title })]);
    const ordered = el('ol');
    item.items.forEach((/** @type {string} */ text) => ordered.append(el('li', { text })));
    checklist.append(ordered);
    return checklist;
  });

  const results = () => {
    const copy = config.results;
    const screen = el('section', { className: 'bab-results', 'aria-labelledby': 'results-title' }, [
      restartControl(),
      el('p', { className: 'bab-eyebrow', text: copy.eyebrow }),
      el('h1', { id: 'results-title', text: copy.title }),
      el('p', { className: 'bab-lead', text: copy.lead }),
    ]);
    screen.append(...renderResultItems(copy.items));

    const actions = el('div', { className: 'bab-result-actions' });
    const edit = el('button', { type: 'button', className: 'bab-secondary', text: 'Edit My Answers' });
    edit.addEventListener('click', () => { state.index = 0; setView('review'); });
    const print = el('button', { type: 'button', className: 'bab-primary', text: 'Print or Save as PDF' });
    print.addEventListener('click', () => { track('print_selected'); window.print(); });
    const restart = el('button', { type: 'button', className: 'bab-text-action', text: 'Start Again' });
    restart.addEventListener('click', restartBuilder);
    actions.append(edit, print, restart);
    screen.append(actions);

    if (copy.support) {
      const support = el('section', { className: 'bab-support' }, [
        el('p', { className: 'bab-eyebrow', text: copy.support.eyebrow }),
        el('h2', { text: copy.support.title }),
        ...copy.support.paragraphs.map((/** @type {string} */ text) => el('p', { text })),
        el('strong', { text: copy.support.price }),
      ]);
      if (config.bookingUrl) {
        const booking = el('a', { className: 'bab-primary', href: config.bookingUrl, target: '_blank', rel: 'noreferrer', text: 'Book a Session' });
        booking.addEventListener('click', () => track('session_offer_clicked'));
        support.append(booking);
      } else support.append(el('button', { className: 'bab-primary', type: 'button', disabled: true, text: 'Booking link coming soon' }));
      screen.append(support);
    }
    if (copy.privacy) screen.append(el('p', { className: 'bab-privacy bab-results-privacy', text: copy.privacy }));
    return screen;
  };

  function render() {
    if (!root) return;
    document.body.dataset.builderView = state.view;
    root.replaceChildren(state.view === 'welcome' ? welcome() : state.view === 'questions' ? questionScreen() : state.view === 'review' ? review() : results());
    root.querySelector('h1')?.focus({ preventScroll: true });
  }

  render();
};
