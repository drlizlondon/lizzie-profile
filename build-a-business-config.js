import { BOOKING_URL, STORAGE_KEY, guidanceFor, questions, sections } from './build-a-business-data.js';
import { buildBusinessSummary, buildLovablePrompt, buildRefinementPrompt, firstWeekChecklist } from './build-a-business-prompts.js';

/** Every Build a Business screen string lives here; the shared engine is builder-ui.js. */
export const businessConfig = {
  questions,
  sections,
  guidanceFor,
  storageKey: STORAGE_KEY,
  bookingUrl: BOOKING_URL,
  eventPrefix: '',
  sectionFallback: 'Build a Business',
  welcome: {
    eyebrow: 'Thinking with AI',
    titleLines: ['Build Your', 'Business'],
    lead: 'Every successful business begins with one clear idea.',
    body: [
      'This interactive demonstration shows how structured thinking and AI can turn an idea into a business plan, website copy and a build-ready prompt.',
      "You don't need all the answers. Just start with what you know.",
    ],
    startLabel: 'Start My Plan',
    continueLabel: 'Continue My Plan',
    meta: '◷  ~10 minutes',
    features: [
      ['strategy', 'Business Strategy', 'Clarify your idea, audience and first offer.'],
      ['copy', 'Website Copy', 'Create clear, conversion-focused website copy.'],
      ['prompt', 'AI Build Prompt', 'Generate a ready-to-use prompt for Lovable or another AI website builder.'],
    ],
  },
  question: {
    continueLabel: 'Continue',
    reviewLabel: 'Review My Answers',
    requiredError: 'Choose an answer, or use one of the “not sure” options so we can keep going.',
    privacy: 'Your answers stay in this browser unless you choose to copy them into another tool. We do not receive or store your business idea through this builder.',
  },
  review: {
    eyebrow: 'Nearly there',
    title: 'Review your choices',
    lead: 'Check what you have added. You can edit any answer before creating your website prompt.',
    createLabel: 'Create My Website Prompt',
    announce: 'Your business summary and website prompts are ready.',
  },
  results: {
    eyebrow: 'Your starting point',
    title: 'Your business and website plan',
    lead: 'You now have everything you need to create a strong first version of your website.',
    items: [
      { kind: 'output', title: 'Business summary', intro: 'A clear summary you can share or keep for reference.', build: buildBusinessSummary, copyLabel: 'Copy Business Summary', event: 'business_summary_copied', open: true },
      { kind: 'output', title: 'Your Lovable website prompt', intro: 'Fast route: copy this prompt, open Lovable, start a new project and paste it into the prompt box.', build: buildLovablePrompt, copyLabel: 'Copy Lovable Prompt', event: 'lovable_prompt_copied', open: true, openLovable: true },
      { kind: 'output', title: 'Improve My Business and Website Plan', intro: 'Refine first: paste this into ChatGPT, Claude or another LLM before building.', build: buildRefinementPrompt, copyLabel: 'Copy AI Refinement Prompt', event: 'ai_refinement_prompt_copied' },
      { kind: 'checklist', title: 'Your first week', items: firstWeekChecklist },
    ],
    support: {
      eyebrow: 'When you are ready for more',
      title: 'Build it with Liz',
      paragraphs: [
        'Want help turning this into a polished, live website?',
        'Book a one-hour session with Liz. Together, you will refine the idea, strengthen the offer and work through the website so you leave with something ready to publish.',
      ],
      price: '£150',
    },
    privacy: 'Your answers are stored only in this browser. Nothing from this builder is sent to LizProfile, a database or an AI provider.',
  },
};
