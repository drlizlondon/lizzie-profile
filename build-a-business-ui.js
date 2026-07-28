import { BOOKING_URL, guidanceFor, questions, sections } from './build-a-business-data.js';
import { buildBusinessSummary, buildLovablePrompt, buildRefinementPrompt, firstWeekChecklist } from './build-a-business-prompts.js';
import { clearState, hasUsefulAnswer, loadState, saveState } from './build-a-business-state.js';

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

/** @param {string} event @param {Record<string, string>} [detail] */
const track = (event, detail = {}) => {
  const safe = { event, ...detail };
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

/** @param {Record<string, any>} question @param {any} container */
const renderQuestionContent = (question, container) => {
  if (!container) return;
  container.replaceChildren();
  if (question.type === 'text' || question.type === 'textarea') {
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
  const guidance = guidanceFor(question, value);
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
  const main = el('section', { className: 'bab-welcome', 'aria-labelledby': 'builder-title' });
  const left = el('div', { className: 'bab-welcome-copy' }, [
    el('p', { className: 'bab-eyebrow', text: 'Thinking with AI' }),
    el('span', { className: 'bab-eyebrow-rule', 'aria-hidden': 'true' }),
    el('h1', { id: 'builder-title' }, [el('span', { text: 'Build Your' }), el('span', { text: 'Business' })]),
    el('p', { className: 'bab-lead', text: 'Every successful business begins with one clear idea.' }),
    el('div', { className: 'bab-welcome-body' }, [
      el('p', { text: 'This interactive demonstration shows how structured thinking and AI can turn an idea into a business plan, website copy and a build-ready prompt.' }),
      el('p', { text: "You don't need all the answers. Just start with what you know." }),
    ]),
  ]);
  const start = el('button', { type: 'button', className: 'bab-primary', text: state.started ? 'Continue My Plan' : 'Start My Plan' });
  start.addEventListener('click', () => {
    if (!state.started) track('builder_started');
    state.started = true;
    state.view = 'questions';
    persist();
    render();
  });
  start.append(el('span', { className: 'bab-cta-arrow', text: '→', 'aria-hidden': 'true' }));
  left.append(start, el('div', { className: 'bab-welcome-meta' }, [el('span', { text: '◷  ~10 minutes' })]));
  const features = [
    ['strategy', 'Business Strategy', 'Clarify your idea, audience and first offer.'],
    ['copy', 'Website Copy', 'Create clear, conversion-focused website copy.'],
    ['prompt', 'AI Build Prompt', 'Generate a ready-to-use prompt for Lovable or another AI website builder.'],
  ];
  const right = el('div', { className: 'bab-welcome-features', 'aria-label': 'What you will create' });
  features.forEach(([icon, title, description]) => right.append(el('article', { className: 'bab-feature' }, [
    el('span', { className: `bab-feature-icon bab-feature-icon-${icon}`, 'aria-hidden': 'true' }),
    el('div', {}, [el('h2', { text: title }), el('p', { text: description })]),
  ])));
  main.append(left, right);
  return main;
};

const questionScreen = () => {
  const question = questions[state.index];
  const section = sections.find((item) => state.index >= item.start && state.index <= item.end);
  const screen = el('section', { className: 'bab-question-screen', 'aria-labelledby': 'question-title' });
  screen.append(restartControl(), progress(), el('p', { className: 'bab-section-label', text: section?.label ?? 'Build a Business' }), el('h1', { id: 'question-title', text: question.question }));
  if (question.helper) screen.append(el('p', { className: 'bab-helper', text: question.helper }));
  const content = el('div', { 'data-question-content': '' });
  screen.append(content);
  renderQuestionContent(question, content);

  const error = el('p', { className: 'bab-validation', role: 'alert' });
  const controls = el('div', { className: 'bab-controls' });
  const back = el('button', { type: 'button', className: 'bab-secondary', text: state.index === 0 ? 'Back to welcome' : 'Back' });
  const next = el('button', { type: 'button', className: 'bab-primary', text: state.index === questions.length - 1 ? 'Review My Answers' : 'Continue' });
  back.addEventListener('click', () => {
    if (state.index === 0) setView('welcome');
    else { state.index -= 1; persist(); render(); }
  });
  next.addEventListener('click', () => {
    if (!hasUsefulAnswer(question, state.answers)) {
      error.textContent = 'Choose an answer, or use one of the “not sure” options so we can keep going.';
      return;
    }
    const completedSection = sections.find((item) => item.end === state.index);
    if (completedSection) track('section_completed', { section: completedSection.id });
    if (state.index === questions.length - 1) setView('review');
    else { state.index += 1; persist(); render(); }
  });
  controls.append(back, next);
  screen.append(error, controls, el('p', { className: 'bab-privacy', text: 'Your answers stay in this browser unless you choose to copy them into another tool. We do not receive or store your business idea through this builder.' }));
  return screen;
};

/** @param {Record<string, any>} question */
const answerText = (question) => {
  const value = state.answers[question.id];
  if (Array.isArray(value)) return value.join(', ') || 'Use a placeholder';
  return value || 'Use a placeholder';
};

const review = () => {
  const screen = el('section', { className: 'bab-review', 'aria-labelledby': 'review-title' }, [
    restartControl(),
    el('p', { className: 'bab-eyebrow', text: 'Nearly there' }),
    el('h1', { id: 'review-title', text: 'Review your choices' }),
    el('p', { className: 'bab-lead bab-review-lead', text: 'Check what you have added. You can edit any answer before creating your website prompt.' }),
  ]);
  const list = el('div', { className: 'bab-review-list' });
  questions.forEach((question, index) => {
    const edit = el('button', { type: 'button', className: 'bab-edit', text: 'Edit', 'aria-label': `Edit: ${question.question}` });
    edit.addEventListener('click', () => { state.index = index; setView('questions'); });
    list.append(el('article', { className: 'bab-review-item' }, [el('div', {}, [el('h2', { text: question.question }), el('p', { text: answerText(question) })]), edit]));
  });
  const controls = el('div', { className: 'bab-controls' });
  const back = el('button', { type: 'button', className: 'bab-secondary', text: 'Back' });
  back.addEventListener('click', () => { state.index = questions.length - 1; setView('questions'); });
  const create = el('button', { type: 'button', className: 'bab-primary', text: 'Create My Website Prompt' });
  create.addEventListener('click', () => { track('builder_completed'); setView('results'); announce('Your business summary and website prompts are ready.'); });
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

const results = () => {
  const summary = buildBusinessSummary(state.answers);
  const lovable = buildLovablePrompt(state.answers);
  const refinement = buildRefinementPrompt(state.answers);
  const openLovable = el('a', {
    className: 'bab-lovable-link',
    href: 'https://lovable.dev/',
    target: '_blank',
    rel: 'noreferrer',
    text: 'Open Lovable ↗',
  });
  const screen = el('section', { className: 'bab-results', 'aria-labelledby': 'results-title' }, [
    restartControl(),
    el('p', { className: 'bab-eyebrow', text: 'Your starting point' }),
    el('h1', { id: 'results-title', text: 'Your business and website plan' }),
    el('p', { className: 'bab-lead', text: 'You now have everything you need to create a strong first version of your website.' }),
  ]);
  screen.append(
    outputCard('Business summary', 'A clear summary you can share or keep for reference.', summary, 'Copy Business Summary', 'business_summary_copied', true),
    outputCard('Your Lovable website prompt', 'Fast route: copy this prompt, open Lovable, start a new project and paste it into the prompt box.', lovable, 'Copy Lovable Prompt', 'lovable_prompt_copied', true, openLovable),
    outputCard('Improve My Business and Website Plan', 'Refine first: paste this into ChatGPT, Claude or another LLM before building.', refinement, 'Copy AI Refinement Prompt', 'ai_refinement_prompt_copied'),
  );

  const checklist = el('section', { className: 'bab-output-card bab-checklist' }, [el('h2', { text: 'Your first week' })]);
  const ordered = el('ol');
  firstWeekChecklist.forEach((item) => ordered.append(el('li', { text: item })));
  checklist.append(ordered);
  screen.append(checklist);

  const actions = el('div', { className: 'bab-result-actions' });
  const edit = el('button', { type: 'button', className: 'bab-secondary', text: 'Edit My Answers' });
  edit.addEventListener('click', () => { state.index = 0; setView('review'); });
  const print = el('button', { type: 'button', className: 'bab-primary', text: 'Print or Save as PDF' });
  print.addEventListener('click', () => { track('print_selected'); window.print(); });
  const restart = el('button', { type: 'button', className: 'bab-text-action', text: 'Start Again' });
  restart.addEventListener('click', restartBuilder);
  actions.append(edit, print, restart);
  screen.append(actions);

  const support = el('section', { className: 'bab-support' }, [
    el('p', { className: 'bab-eyebrow', text: 'When you are ready for more' }),
    el('h2', { text: 'Build it with Liz' }),
    el('p', { text: 'Want help turning this into a polished, live website?' }),
    el('p', { text: 'Book a one-hour session with Liz. Together, you will refine the idea, strengthen the offer and work through the website so you leave with something ready to publish.' }),
    el('strong', { text: '£150' }),
  ]);
  if (BOOKING_URL) {
    const booking = el('a', { className: 'bab-primary', href: BOOKING_URL, target: '_blank', rel: 'noreferrer', text: 'Book a Session' });
    booking.addEventListener('click', () => track('session_offer_clicked'));
    support.append(booking);
  } else support.append(el('button', { className: 'bab-primary', type: 'button', disabled: true, text: 'Booking link coming soon' }));
  screen.append(support, el('p', { className: 'bab-privacy bab-results-privacy', text: 'Your answers are stored only in this browser. Nothing from this builder is sent to LizProfile, a database or an AI provider.' }));
  return screen;
};

function render() {
  if (!root) return;
  document.body.dataset.builderView = state.view;
  root.replaceChildren(state.view === 'welcome' ? welcome() : state.view === 'questions' ? questionScreen() : state.view === 'review' ? review() : results());
  root.querySelector('h1')?.focus({ preventScroll: true });
}

render();
