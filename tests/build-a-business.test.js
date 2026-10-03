import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions } from '../build-a-business-data.js';
import { buildBusinessSummary, buildLovablePrompt, buildRefinementPrompt, firstWeekChecklist } from '../build-a-business-prompts.js';

const html = await readFile(new URL('../build-a-business.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../build-a-business.css', import.meta.url), 'utf8');
// The UI strings now live in the shared engine (builder-ui.js) and this tool's config.
const engine = await readFile(new URL('../builder-ui.js', import.meta.url), 'utf8');
const config = await readFile(new URL('../build-a-business-config.js', import.meta.url), 'utf8');
const ui = [engine, config].join('\n');

const answers = {
  idea: 'A calm planning service for returning mums', offerType: 'A service', audience: 'Mums returning to work',
  problem: 'They need a clear first plan', whyYou: 'Lived and professional experience', traits: ['Calm', 'Friendly', 'Clear'],
  purchaseAction: 'Book a service', firstOffer: 'A one-hour planning session', pricing: 'Yes, show the exact price', price: '£75',
  primaryAction: 'Book', websiteSections: ['Home', 'About', 'Services or products', 'Contact'], visualStyle: 'Calm and clear',
  colours: 'Soft colours', brandColours: '', images: ['Photos of me', 'Simple icons'], businessName: 'Fresh Start',
  locationType: 'Online', location: '', contactMethods: ['Contact form', 'Email'], story: 'Built from personal experience',
};

test('builder exposes all required questions and uses no AI integration', () => {
  assert.equal(questions.length, 18);
  assert.match(html, /data-builder/);
  assert.match(html, /Build a Business/);
  assert.match(ui, /Thinking with AI/);
  assert.match(config, /titleLines: \['Build Your', 'Business'\]/);
  assert.match(ui, /Start My Plan/);
  assert.match(ui, /~10 minutes/);
  assert.doesNotMatch(ui, /No sign up required/);
  assert.match(ui, /Business Strategy/);
  assert.match(ui, /Website Copy/);
  assert.match(ui, /AI Build Prompt/);
  assert.match(css, /grid-template-columns:\s*minmax\(0, 1\.22fr\)/);
  assert.match(css, /font-size:\s*clamp\(60px, 6\.4vw, 88px\)/);
  assert.match(css, /\.bab-frame:has\(\.bab-welcome\)/);
  assert.match(html, /aria-current="page"/);
  assert.doesNotMatch([html, css, ui].join('\n'), /api\/chat|api\/plan|OpenAI|Anthropic|Gemini|Supabase/);
  assert.match(ui, /localStorage|loadState/);
  assert.match(ui, /navigator\.clipboard\.writeText/);
  assert.match(ui, /https:\/\/lovable\.dev\//);
  assert.match(ui, /Open Lovable/);
  assert.match(ui, /start a new project and paste it into the prompt box/);
  assert.match(ui, /window\.print\(\)/);
  assert.match(ui, /Start again\? Your answers and generated prompts will be lost\./);
  assert.match(ui, /restartControl\(\)/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test('guided screens keep navigation controls visible without page scrolling', () => {
  assert.match(ui, /document\.body\.dataset\.builderView = state\.view/);
  assert.match(css, /data-builder-view="questions"[\s\S]*overflow: hidden/);
  assert.match(css, /data-question-content[\s\S]*overflow-y: auto/);
  assert.match(css, /data-builder-view="questions"[\s\S]*\.bab-controls[\s\S]*position: static/);
});

test('generated outputs contain real answers, safeguards and placeholders', () => {
  const summary = buildBusinessSummary(answers);
  const lovable = buildLovablePrompt(answers);
  const refinement = buildRefinementPrompt(answers);
  assert.match(summary, /Fresh Start/);
  assert.match(summary, /Mums returning to work/);
  assert.match(lovable, /A one-hour planning session/);
  assert.match(lovable, /Do not invent facts/);
  assert.match(lovable, /fake social proof|unsupported business claims/);
  assert.match(lovable, /mobile-first/);
  assert.match(lovable, /Build the full first version now/);
  assert.match(refinement, /Improve My Business and Website Plan/);
  assert.match(refinement, /## 1\. What I Understand/);
  assert.match(refinement, /## 7\. Your Lovable Website Prompt/);
  assert.match(refinement, /ONE markdown copy block/);
});

test('business summary never leaves an unanswered field blank', () => {
  const summary = buildBusinessSummary({
    businessName: '', idea: 'I only have a rough idea', audience: 'I’m not sure yet', problem: 'Help me work this out later',
    firstOffer: 'Help me keep this simple', offerType: 'I’m not sure yet', primaryAction: '', traits: [],
  });
  assert.doesNotMatch(summary, /Business\n\n|What it does\n\n|Who it is for\n\n|What it helps with\n\n|First offer\n\n|Main website action\n\n|Brand feel\n\n/);
  assert.equal((summary.match(/To be confirmed\./g) ?? []).length, 7);
});

test('first-week checklist is exact and the paid offer follows free outputs', () => {
  assert.deepEqual(firstWeekChecklist, [
    'Review your business summary.',
    'Paste your website prompt into Lovable.',
    'Replace any placeholder details.',
    'Add your real contact information.',
    'Test the website on your phone.',
    'Publish it using a domain you own.',
    'Send your website to one person who believes in you.',
  ]);
  // Results items render before the paid offer in the engine, and the prompt is a results item in the config.
  assert.ok(config.indexOf("title: 'Your Lovable website prompt'") < config.indexOf('support: {'));
  assert.ok(engine.indexOf('renderResultItems(copy.items)') < engine.indexOf("className: 'bab-support'"));
});

test('Build a Business generated texts are byte-identical to the pre-refactor capture', async () => {
  const before = JSON.parse(await readFile(new URL('./fixtures/bab-before.json', import.meta.url), 'utf8'));
  assert.deepEqual(before.answers, answers);
  assert.equal(buildBusinessSummary(before.answers), before.summary);
  assert.equal(buildLovablePrompt(before.answers), before.lovable);
  assert.equal(buildRefinementPrompt(before.answers), before.refinement);
});
