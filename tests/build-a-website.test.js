import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { questions, STORAGE_KEY, guidanceFor, websiteConfig } from '../build-a-website-config.js';
import { buildWebsitePrompt, buildSiteSummaryLines, websiteIncludes, firstPublishChecklist, designTokens } from '../build-a-website-prompts.js';
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
/** @param {string} kind */
const item = (kind) => {
  const found = websiteConfig.results.items.find((entry) => entry.kind === kind);
  assert.ok(found, kind);
  return /** @type {Record<string, any>} */ (found);
};

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

test('the generated prompt carries the required technical contract', () => {
  const prompt = buildWebsitePrompt(fixture);
  for (const needle of ['Initial admin email: sam@example.com', 'Lovable Cloud', 'admins', "status = 'published'", 'magic link', 'JSON-LD', 'sitemap.xml', 'COMPLETION']) {
    assert.ok(prompt.includes(needle), `missing: ${needle}`);
  }
  assert.ok(!prompt.includes('password:'));
  assert.ok(!/modern and professional/i.test(prompt));
  const order = ['PROJECT OVERVIEW', 'DESIGN DIRECTION', 'PUBLIC WEBSITE', 'CONTENT MANAGEMENT', 'PRIVATE ADMIN AREA', 'ADMIN AUTHENTICATION', 'WRITING EXPERIENCE', 'PUBLIC ARTICLE SYSTEM', 'SEO', 'LOVABLE EDITABILITY', 'DESIGN CHANGES AFTER LAUNCH', 'DATABASE AND STORAGE', 'SCOPE', 'COMPLETION']
    .map((heading) => prompt.indexOf(`\n${heading}\n`));
  assert.ok(order.every((position) => position > 0), 'every section heading is present');
  assert.deepEqual([...order].sort((a, b) => a - b), order, 'sections are in the specified order');
  for (const example of ['Make the article pages more editorial.', 'Change the homepage to have a larger hero image.', 'Add a newsletter signup underneath every article.']) assert.ok(prompt.includes(example));
  assert.match(prompt, /Do not invent facts/);
  assert.match(prompt, /not a WordPress clone/);
  assert.match(prompt, /Build the full working first version now/);
});

test('the design direction is concrete for every visual style and supplied brand colours win', () => {
  const styles = /** @type {string[][]} */ (businessQuestions.find(({ id }) => id === 'visualStyle')?.options ?? []).map(([label]) => label);
  assert.deepEqual(Object.keys(designTokens).sort(), [...styles].sort());
  const fonts = new Set();
  for (const style of styles) {
    const prompt = buildWebsitePrompt({ ...fixture, visualStyle: style });
    assert.ok(!/modern and professional/i.test(prompt), style);
    assert.ok(prompt.includes(designTokens[style].fonts), style);
    fonts.add(designTokens[style].fonts);
    for (const field of ['fonts', 'headings', 'body', 'palette', 'radius', 'buttons', 'cards', 'motion']) assert.ok(/** @type {Record<string, string>} */ (designTokens[style])[field], `${style}.${field}`);
  }
  assert.equal(fonts.size, styles.length, 'each style has its own font pairing');
  const branded = buildWebsitePrompt({ ...fixture, colours: 'I have brand colours', brandColours: 'navy, cream and #D98B73' });
  assert.match(branded, /Use the owner's brand colours as the palette: navy, cream and #D98B73/);
});

test('page blocks follow the chosen pages only, plus the article page', () => {
  const prompt = buildWebsitePrompt(fixture);
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
  assert.doesNotMatch(buildWebsitePrompt(without), /category \(text/);
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
    'Paste your prompt into Lovable.',
    'When Lovable asks, turn on Lovable Cloud.',
    'Sign in to /admin with your email.',
    'Write and publish your first post.',
    'Test the site on your phone.',
    'Connect a domain you own.',
    "Send your first post to one person who'd enjoy it.",
  ]);
  assert.deepEqual(websiteConfig.results.items.map(({ kind, title }) => [kind, title]), [
    ['summaryCard', 'Your Site'], ['ticks', 'Your website will include'], ['output', 'COPY THIS INTO LOVABLE'], ['note', undefined], ['checklist', 'Your first publish'],
  ]);
  assert.equal(item('output').copyLabel, 'Copy your Lovable prompt');
  assert.equal(item('note').text, 'Your answers stay in this browser. Nothing is sent to us.');
  assert.equal(websiteConfig.results.items.some((entry) => /refine|improve/i.test(String(entry.title ?? ''))), false);
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
