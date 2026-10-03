import { questions as businessQuestions } from './build-a-business-data.js';
import { buildSiteSummaryLines, buildWebsiteSteps, firstPublishChecklist, websiteIncludes, websiteStepMeta } from './build-a-website-prompts.js';

export const STORAGE_KEY = 'lizprofile.build-a-website.v1';
export const BOOKING_URL = '';

/** Reused unchanged from Build a Business. @param {string} id */
const reuse = (id) => {
  const found = businessQuestions.find((question) => question.id === id);
  if (!found) throw new Error(`Missing shared question: ${id}`);
  return found;
};

export const sections = [
  { id: 'site', label: 'Your blog', start: 0, end: 3 },
  { id: 'content', label: 'What you’ll publish', start: 4, end: 7 },
  { id: 'website', label: 'Your website', start: 8, end: 9 },
  { id: 'visual', label: 'Look and feel', start: 10, end: 13 },
  { id: 'admin', label: 'Managing it', start: 14, end: 14 },
  { id: 'story', label: 'About you', start: 15, end: 15 },
];

/** @type {Array<Record<string, any>>} */
export const questions = [
  {
    id: 'siteName', type: 'text', required: true,
    question: 'What is your blog or website called?',
    quickChoices: ['I need a working name'],
  },
  {
    id: 'ownerName', type: 'text', required: true,
    question: 'Whose name should appear as the author or owner?',
    helper: 'This can be your name, a pen name or a business name.',
  },
  {
    id: 'topic', type: 'textarea', required: true,
    question: 'What will you write about?',
    placeholder: 'For example: slow living in London, early-career medicine, baking for beginners…',
  },
  {
    id: 'audience', type: 'text', required: true,
    question: 'Who are you writing for?',
    helper: 'Try to describe one type of reader rather than everyone.',
    quickChoices: ["I'm not sure yet"],
  },
  {
    id: 'contentTypes', type: 'multi', required: true,
    question: 'What kind of posts will you publish?',
    options: ['Articles', 'Essays', 'Guides and how-tos', 'Recipes', 'Reviews', 'News and updates', 'Photo stories'],
  },
  {
    id: 'categories', type: 'text', required: false,
    question: 'Do you want to group posts into topics?',
    helper: 'List a few, separated by commas, or leave blank.',
    quickChoices: ['No topics for now'],
  },
  {
    id: 'cadence', type: 'single', required: true,
    question: 'How often do you expect to publish?',
    options: ['Weekly', 'A few times a month', 'Monthly', 'Whenever I have something to say'],
  },
  {
    id: 'authors', type: 'single', required: true,
    question: 'Who will write?',
    options: ['Just me', 'Me and occasional guests', 'A small team'],
  },
  {
    id: 'primaryAction', type: 'single', required: true,
    question: 'What is the one thing a reader should do?',
    options: ['Read the latest post', 'Join my newsletter', 'Contact me', 'Follow me', 'Work with me', 'Buy or book something'],
  },
  {
    id: 'websiteSections', type: 'multi', required: true,
    question: 'What pages do you need?',
    helper: 'We have preselected a simple starting set. Change anything you like.',
    defaults: ['Home', 'About', 'Articles', 'Contact'],
    options: ['Home', 'About', 'Articles', 'Contact', 'Topics', 'Newsletter signup', 'Search', 'Resources', 'Work with me', 'Shop'],
  },
  { ...reuse('traits'), question: 'How should your blog feel?' },
  reuse('visualStyle'),
  reuse('colours'),
  reuse('images'),
  {
    id: 'adminEmail', type: 'email', required: true,
    question: 'What email address will you use to manage your website?',
    helper: 'This will be used as the initial administrator email for your website. You will use it to access your private website dashboard and manage your content. It stays on this device and only goes into your prompt; we never receive it.',
    placeholder: 'you@example.com',
  },
  reuse('story'),
];

/** @param {Record<string, any>} question @param {any} value */
export const guidanceFor = (question, value) => {
  if (question.id === 'audience' && typeof value === 'string' && /everyone|anyone|all people/i.test(value)) {
    return 'Writing for one clear type of reader often makes a blog easier to grow. You can always widen it later.';
  }
  if (question.id === 'siteName' && value === 'I need a working name') {
    return 'A working name is enough to begin. You can change it in Lovable later.';
  }
  return '';
};

const FREE_PLAN_NOTE = "Built for Lovable's free plan. Do one step a day: the free plan gives 5 credits a day (up to 30 a month), and each step is sized to fit in one day with room for a fix. Paste each step in Build mode. Avoid chatting to Lovable between steps, because chat messages use credits too. If something breaks, send one short message describing what you see. If you run out, stop and carry on tomorrow: credits reset every day. Lovable charges by the work done, so we can't promise an exact number. That is why the steps are small.";

/** One output card per step: Day N, its check lines, a copy button. Day 1 starts open. */
const stepItems = websiteStepMeta.map(({ step, title, check }) => ({
  kind: 'output',
  title: `Day ${step}: ${title}`,
  intro: `Check it worked: ${check.join(' · ')}`,
  build: (/** @type {Record<string, any>} */ answers) => buildWebsiteSteps(answers)[step - 1].prompt,
  copyLabel: `Copy step ${step}`,
  event: `lovable_step_${step}_copied`,
  open: step === 1,
  openLovable: step === 1,
}));

/** Every Build a Website screen string lives here; the shared engine is builder-ui.js. */
export const websiteConfig = {
  questions,
  sections,
  guidanceFor,
  storageKey: STORAGE_KEY,
  bookingUrl: BOOKING_URL,
  eventPrefix: 'baw_',
  sectionFallback: 'Build a Website',
  welcome: {
    eyebrow: 'A free guided tool',
    titleLines: ['Build Your', 'Website'],
    lead: 'A blog you own, with a private place to write and publish.',
    body: [
      'Answer a few simple questions about your blog. You will leave with a complete prompt to give Lovable, so it can build the website and the tools to run it.',
      "You don't need all the answers. Just start with what you know.",
    ],
    startLabel: 'Start My Website',
    continueLabel: 'Continue My Website',
    meta: '◷  ~8 minutes',
    features: [
      ['strategy', 'Your Site', 'See your blog, pages and settings on one clear page.'],
      ['copy', 'A private place to write', 'A simple dashboard to draft, preview and publish your posts.'],
      ['prompt', 'Seven short Lovable steps', 'One step a day, sized to fit Lovable’s free plan.'],
    ],
  },
  question: {
    continueLabel: 'Continue',
    reviewLabel: 'Review My Answers',
    requiredError: 'Choose an answer, or use one of the “not sure” options so we can keep going.',
    privacy: 'Your answers stay in this browser unless you choose to copy them into another tool. Nothing is sent to us.',
  },
  review: {
    eyebrow: 'Nearly there',
    title: 'Review your choices',
    lead: 'Check what you have added. You can edit any answer before creating your Lovable prompt.',
    createLabel: 'Create My Lovable Prompt',
    announce: 'Your site summary and Lovable prompt are ready.',
  },
  results: {
    eyebrow: 'Your starting point',
    title: 'Your website plan',
    lead: 'Your Site turns everything you’ve told us into a complete website plan and Lovable build prompt. It includes the website, the design, the content structure and the simple tools you need to manage it yourself.',
    items: [
      { kind: 'summaryCard', title: 'Your Site', lines: buildSiteSummaryLines },
      { kind: 'ticks', title: 'Your website will include', items: websiteIncludes },
      { kind: 'heading', title: 'COPY THIS INTO LOVABLE' },
      { kind: 'note', text: FREE_PLAN_NOTE },
      ...stepItems,
      { kind: 'note', text: 'Your answers stay in this browser. Nothing is sent to us.' },
      { kind: 'checklist', title: 'Your first publish', items: firstPublishChecklist },
    ],
    support: null,
    privacy: '',
  },
};
