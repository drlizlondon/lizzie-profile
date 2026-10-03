import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions, STORAGE_KEY, guidanceFor, websiteConfig } from '../build-a-website-config.js';
import { buildWebsiteSteps, buildSiteSummaryLines, websiteIncludes, firstPublishChecklist, designTokens } from '../build-a-website-prompts.js';
import { questions as businessQuestions } from '../build-a-business-data.js';
import { createState, isValidEmail, normaliseEmail } from '../builder-state.js';

/** @param {string} name */
const read = (name) => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const html = await read('build-a-website.html');
const sources = await Promise.all(['build-a-website.js', 'build-a-website-config.js', 'build-a-website-prompts.js', 'build-a-website.css', 'build-a-website.html'].map(read));
const sitemap = await read('public/sitemap.xml');
const viteConfig = await read('vite.config.js');

/** @param {string} id */
const question = (id) => {
  const found = questions.find((item) => item.id === id);
  assert.ok(found, id);
  return found;
};
/** Result items, loosely typed: each kind has its own fields. */
const resultItems = /** @type {Array<Record<string, any>>} */ (websiteConfig.results.items);

/** @param {Record<string, any>} answers */
const allPrompts = (answers) => buildWebsiteSteps(answers).map(({ prompt }) => prompt).join('\n\n');
/** @param {string} text */
const words = (text) => text.trim().split(/\s+/).length;

const fixture = {
  siteName: 'Small Kitchen Notes', ownerName: 'Sam Rivera', topic: 'Simple weeknight cooking for one',
  audience: 'People cooking for themselves for the first time', contentTypes: ['Recipes', 'Guides and how-tos'],
  categories: 'Quick dinners, Batch cooking', cadence: 'Weekly', authors: 'Just me', primaryAction: 'Join my newsletter',
  websiteSections: ['Home', 'About', 'Articles', 'Contact', 'Newsletter signup'], traits: ['Warm', 'Simple', 'Friendly'],
  visualStyle: 'Warm and friendly', colours: 'Soft colours', brandColours: '', images: ['Photos of my work'],
  adminEmail: 'sam@example.com', story: '',
};

test('the tool has 16 questions in the specified order', () => {
  assert.deepEqual(questions.map(({ id }) => id), [
    'siteName', 'ownerName', 'topic', 'audience', 'contentTypes', 'categories', 'cadence', 'authors', 'primaryAction',
    'websiteSections', 'traits', 'visualStyle', 'colours', 'images', 'adminEmail', 'story',
  ]);
  assert.equal(questions.length, 16);
  assert.equal(question('adminEmail').type, 'email');
  assert.equal(question('categories').required, false);
  assert.deepEqual(question('websiteSections').defaults, ['Home', 'About', 'Articles', 'Contact']);
});

test('shared look-and-feel questions are the Build a Business objects, unchanged', () => {
  for (const id of ['visualStyle', 'colours', 'images', 'story']) {
    assert.strictEqual(question(id), businessQuestions.find((shared) => shared.id === id));
  }
  // traits reuses the Build a Business options, worded for a blog
  const sharedTraits = businessQuestions.find((shared) => shared.id === 'traits');
  assert.ok(sharedTraits);
  assert.deepEqual(question('traits').options, sharedTraits.options);
  assert.equal(question('traits').max, sharedTraits.max);
  assert.equal(question('traits').question, 'How should your blog feel?');
  assert.equal(websiteConfig.questions, questions);
  assert.equal(STORAGE_KEY, 'lizprofile.build-a-website.v1');
  assert.equal(websiteConfig.eventPrefix, 'baw_');
});

test('email validation accepts real addresses, rejects broken ones and normalises', () => {
  assert.equal(isValidEmail('sam@example.com'), true);
  for (const bad of ['sam@', '@x.com', 'sam example.com', '']) assert.equal(isValidEmail(bad), false, bad);
  assert.equal(normaliseEmail('  Sam@Example.COM '), 'sam@example.com');
  const { hasUsefulAnswer } = createState({ storageKey: 'x', questions });
  const emailQuestion = question('adminEmail');
  assert.equal(hasUsefulAnswer(emailQuestion, { adminEmail: 'sam@' }), false);
  assert.equal(hasUsefulAnswer(emailQuestion, { adminEmail: 'sam@example.com' }), true);
});

test('guidance nudges are the specified ones', () => {
  assert.equal(guidanceFor({ id: 'audience' }, 'everyone'), 'Writing for one clear type of reader often makes a blog easier to grow. You can always widen it later.');
  assert.equal(guidanceFor({ id: 'siteName' }, 'I need a working name'), 'A working name is enough to begin. You can change it in Lovable later.');
});

test('buildWebsiteSteps returns six steps, each opening "Step N of 6:" and ending with the closing line', () => {
  const steps = buildWebsiteSteps(fixture);
  assert.equal(steps.length, 6);
  steps.forEach(({ step, title, prompt, check }, index) => {
    assert.equal(step, index + 1);
    assert.ok(prompt.startsWith(`Step ${step} of 6: ${title}.\nThis project is being built one small step a day on Lovable's free plan. Do only this step, `), `step ${step} opening`);
    assert.equal(prompt.includes('keep everything already built working'), step !== 1, `step ${step} keep-working line`);
    assert.ok(prompt.includes('and stop when this step works. Do not start the next step.'));
    assert.ok(prompt.includes('Scope: build the smallest useful system for this step. No plugins, themes, comments, extra roles or settings screens.'));
    assert.ok(prompt.endsWith('When this step works, tell the owner in one or two plain sentences what changed and what to check.'));
    assert.ok(check.length >= 1 && check.length <= 4);
  });
});

// LP-02 CONFLICT: Step 1 must carry DESIGN DIRECTION and PUBLIC WEBSITE verbatim (about 1,100 words
// between them), so it cannot fit the 700-word cap. Steps 2-6 are held to the cap; Step 1 is held to
// its measured ceiling until the coordinator rules (see the LP-02 execution report).
const STEP_WORD_CAP = 700;
const STEP_ONE_CEILING = 1600;

test('every step stays within the word cap (Step 1 flagged: see LP-02 conflict note)', () => {
  const steps = buildWebsiteSteps(fixture);
  steps.slice(1).forEach(({ step, prompt }) => assert.ok(words(prompt) <= STEP_WORD_CAP, `step ${step}: ${words(prompt)} words`));
  assert.ok(words(steps[0].prompt) <= STEP_ONE_CEILING, `step 1: ${words(steps[0].prompt)} words`);
});

test('each layer holds only its own work', () => {
  const [one, two, three, four, five] = buildWebsiteSteps(fixture).map(({ prompt }) => prompt.toLowerCase());
  for (const word of ['lovable cloud', 'admin', 'sitemap', 'row-level']) assert.ok(!one.includes(word), `step 1 has ${word}`);
  for (const word of ['magic link', '/admin']) assert.ok(!two.includes(word), `step 2 has ${word}`);
  for (const text of [one, two]) assert.ok(!text.includes('initial admin email'));
  for (const text of [one, two, three, four]) assert.ok(!text.includes('sitemap'));
  for (const text of [one, two, three, four, five]) assert.ok(!text.includes('server-side rendering') && !text.includes('served html'));
  assert.ok(three.includes('initial admin email: sam@example.com'));
});

test('the six steps together carry every LP-01 technical requirement', () => {
  const all = allPrompts(fixture);
  for (const needle of ['Initial admin email: sam@example.com', 'Lovable Cloud', 'admins', "status = 'published'", 'magic link', 'JSON-LD', 'sitemap.xml', 'robots.txt', 'This area is private', 'Delete this article? This cannot be undone.', 'Row-level security', 'public bucket']) {
    assert.ok(all.includes(needle), `missing: ${needle}`);
  }
  assert.ok(!all.includes('password:'));
  assert.ok(!/modern and professional/i.test(all));
  const order = ['PROJECT OVERVIEW', 'DESIGN DIRECTION', 'PUBLIC WEBSITE', 'DATABASE AND STORAGE', 'CONTENT MANAGEMENT', 'ADMIN AUTHENTICATION', 'PRIVATE ADMIN AREA', 'WRITING EXPERIENCE', 'PUBLIC ARTICLE SYSTEM', 'SEARCH BASICS', 'SEO', 'LOVABLE EDITABILITY', 'DESIGN CHANGES AFTER LAUNCH']
    .map((heading) => all.indexOf(`\n${heading}\n`));
  assert.ok(order.every((position) => position > 0), 'every section heading is present');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections arrive in step order');
  for (const example of ['Make the article pages more editorial.', 'Change the homepage to have a larger hero image.', 'Add a newsletter signup underneath every article.']) assert.ok(all.includes(example));
  assert.ok(all.includes('Admin = managing content. Lovable = changing the website.'));
  assert.match(all, /Do not invent facts/);
  assert.match(all, /src\/lib\/content\.ts/);
  assert.match(all, /\[Sample post: replace me\]/);
  assert.match(all, /No posts yet\./);
});

test('the design direction is concrete for every visual style and supplied brand colours win', () => {
  const styles = /** @type {string[][]} */ (businessQuestions.find(({ id }) => id === 'visualStyle')?.options ?? []).map(([label]) => label);
  assert.deepEqual(Object.keys(designTokens).sort(), [...styles].sort());
  const fonts = new Set();
  for (const style of styles) {
    const prompt = allPrompts({ ...fixture, visualStyle: style });
    assert.ok(!/modern and professional/i.test(prompt), style);
    assert.ok(prompt.includes(designTokens[style].fonts), style);
    fonts.add(designTokens[style].fonts);
    for (const field of ['fonts', 'headings', 'body', 'palette', 'radius', 'buttons', 'cards', 'motion']) assert.ok(/** @type {Record<string, string>} */ (designTokens[style])[field], `${style}.${field}`);
  }
  assert.equal(fonts.size, styles.length, 'each style has its own font pairing');
  const branded = allPrompts({ ...fixture, colours: 'I have brand colours', brandColours: 'navy, cream and #D98B73' });
  assert.match(branded, /Use the owner's brand colours as the palette: navy, cream and #D98B73/);
});

test('page blocks follow the chosen pages only, plus the article page', () => {
  const prompt = allPrompts(fixture);
  for (const page of ['Home', 'About', 'Articles', 'Contact', 'Newsletter signup']) assert.match(prompt, new RegExp(`\\n${page}\\n- Purpose:`));
  assert.match(prompt, /\nIndividual article page \(\/articles\/<slug>\)\n- Purpose:/);
  for (const page of ['Shop', 'Resources', 'Search', 'Work with me']) assert.doesNotMatch(prompt, new RegExp(`\\n${page}\\n- Purpose:`));
  assert.match(prompt, /category \(text, one of: Quick dinners, Batch cooking/);
});

test('the Topics tick and the topics column appear only when categories are given', () => {
  assert.ok(websiteIncludes(fixture).includes('Topics'));
  const without = { ...fixture, categories: '' };
  assert.ok(!websiteIncludes(without).includes('Topics'));
  assert.ok(!websiteIncludes({ ...fixture, categories: 'No topics for now' }).includes('Topics'));
  assert.doesNotMatch(allPrompts(without), /category \(text/);
  assert.ok(!buildSiteSummaryLines(without).some(([label]) => label === 'Topics'));
  assert.ok(buildSiteSummaryLines(fixture).some(([label, value]) => label === 'Topics' && value === 'Quick dinners, Batch cooking'));
  assert.ok(websiteIncludes(fixture).includes('Newsletter signup'));
  assert.ok(!websiteIncludes({ ...fixture, websiteSections: ['Home', 'Articles'] }).includes('Newsletter signup'));
  assert.deepEqual(websiteIncludes(without), ['Bespoke design', 'Mobile-friendly website', 'Article publishing', 'Image uploads', 'Drafts', 'Preview', 'Publishing', 'Private admin area', 'SEO foundations', 'Lovable-editable design', 'Newsletter signup']);
});

test('the summary card has the specified lines and never leaves a blank', () => {
  assert.deepEqual(buildSiteSummaryLines(fixture).map(([label]) => label), ['Website', 'Owner', 'Purpose', 'Audience', 'Main action', 'Website pages', 'Content', 'Topics', 'Publishing', 'Admin', 'Admin email']);
  const empty = buildSiteSummaryLines({ siteName: 'I need a working name', audience: "I'm not sure yet", websiteSections: [] });
  assert.equal(empty.find(([label]) => label === 'Website')?.[1], 'To be confirmed.');
  assert.equal(empty.find(([label]) => label === 'Audience')?.[1], 'To be confirmed.');
  assert.equal(empty.find(([label]) => label === 'Admin')?.[1], 'Yes');
  assert.ok(empty.every(([, value]) => value.trim().length > 0));
});

test('first-publish checklist and results order are exact', () => {
  assert.deepEqual(firstPublishChecklist, [
    'Do Day 1 in Lovable today.',
    'Do one step a day until Day 5 (Day 6 is optional).',
    'Sign in to /admin with your email.',
    'Write and publish your first post.',
    'Test the site on your phone.',
    'Publish on your free yoursite.lovable.app address. Your own domain needs a paid Lovable plan, so add it later if you want one.',
    "Send your first post to one person who'd enjoy it.",
  ]);

  assert.deepEqual(resultItems.map(({ kind, title }) => [kind, title]), [
    ['summaryCard', 'Your Site'], ['ticks', 'Your website will include'], ['heading', 'COPY THIS INTO LOVABLE'], ['note', undefined],
    ['output', 'Day 1: Design and pages'], ['output', 'Day 2: Database'], ['output', 'Day 3: Private sign-in and dashboard'],
    ['output', 'Day 4: Writing and publishing'], ['output', 'Day 5: Search basics'], ['output', 'Day 6: Optional: search-engine-ready pages'],
    ['note', undefined], ['checklist', 'Your first publish'],
  ]);
  const outputs = resultItems.filter((entry) => entry.kind === 'output');
  outputs.forEach((entry, index) => {
    const n = index + 1;
    assert.equal(entry.copyLabel, `Copy step ${n}`);
    assert.equal(entry.event, `lovable_step_${n}_copied`);
    assert.equal(Boolean(entry.open), n === 1);
    assert.equal(Boolean(entry.openLovable), n === 1);
    assert.equal(entry.build(fixture), buildWebsiteSteps(fixture)[index].prompt);
    assert.ok(entry.intro.startsWith('Check it worked: '));
  });
  assert.match(String(resultItems.find((entry) => entry.kind === 'note')?.text), /^Built for Lovable's free plan\. Do one step a day: the free plan gives 5 credits a day \(up to 30 a month\)/);
  assert.equal(websiteConfig.welcome.features[2][1], 'Six short Lovable steps');
  assert.equal(resultItems.some((entry) => /refine|improve/i.test(String(entry.title ?? ''))), false);
});

test('the page is wired into the site and uses no network or AI integration', () => {
  assert.match(html, /<title>Build a Website — Dr Lizzie Soyode<\/title>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/drlizlondon\.com\/build-a-website" \/>/);
  assert.match(html, /<meta property="og:url" content="https:\/\/drlizlondon\.com\/build-a-website" \/>/);
  assert.match(html, /content="Answer a few simple questions about your blog and leave with a complete prompt for building a website you own, with a private place to write and publish\."/);
  assert.match(html, /"@type":"WebApplication","name":"Build a Website"/);
  assert.match(html, /class="is-active" href="\/#resources" aria-current="page">Free Resources/);
  assert.match(html, /data-builder/);
  assert.match(viteConfig, /buildAWebsite: resolve\(import\.meta\.dirname, 'build-a-website\.html'\)/);
  assert.match(sitemap, /<loc>https:\/\/drlizlondon\.com\/build-a-website<\/loc>/);
  assert.doesNotMatch(sources.join('\n'), /api\/chat|api\/plan|OpenAI|Anthropic|Gemini|Supabase|fetch\(|XMLHttpRequest|sendBeacon|WebSocket/);
});

test('analytics events carry no answer text and the email is never tracked', async () => {
  const engine = await read('builder-ui.js');
  const calls = [...engine.matchAll(/track\(([^)]*)\)/g)].map(([, args]) => args);
  assert.ok(calls.length > 0);
  for (const args of calls) assert.doesNotMatch(args, /answers|adminEmail|value|email/i);
  assert.match(engine, /event: `\$\{config\.eventPrefix\}\$\{event\}`/);
});
