import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, stat } from 'node:fs/promises';
import { featuredResources, freeResources, orderedResources } from '../resources-data.js';

const resourcesPage = await readFile(new URL('../resources.html', import.meta.url), 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

const expectedResources = [
  {
    category: 'Guided Framework',
    title: 'Build a Business',
    description: 'Turn an early idea into a clear business, a focused first offer and a complete prompt for building your website.',
    cta: 'Start the framework',
    href: '/build-a-business.html',
  },
  {
    category: 'Planning Framework',
    title: 'The Betty Prompt',
    description: 'A practical prompt for better questions, stronger recommendations and a more honest working relationship with AI.',
    cta: 'Copy it now',
    href: '/betty-prompt.html',
  },
  {
    category: 'AI Skill',
    title: 'Watch Videos with AI',
    description: 'Paste a public Instagram, TikTok, YouTube or X video into Codex. Watch AI will watch it, transcribe it and explain what matters.',
    cta: 'Copy setup prompt',
    href: '/watch-ai.html',
  },
];

test('homepage resources are driven by exactly three ordered featured entries', () => {
  const featured = featuredResources();
  assert.equal(featured.length, 3);
  assert.deepEqual(featured.map(({ category, title, description, cta, href }) => ({
    category,
    title,
    description,
    cta,
    href,
  })), expectedResources);
  assert.deepEqual(featured.map(({ order }) => order), [1, 2, 3]);
  assert.equal(new Set(freeResources.map(({ order }) => order)).size, freeResources.length);
});

test('every free resource has the reusable fields and a real local destination', async () => {
  const requiredFields = ['title', 'category', 'description', 'cta', 'href', 'featured', 'order'];
  assert.deepEqual(orderedResources().map(({ order }) => order), [1, 2, 3]);

  for (const resource of freeResources) {
    requiredFields.forEach((field) => assert.ok(field in resource, `${resource.title} is missing ${field}`));
    assert.ok(resource.href.startsWith('/'));
    assert.notEqual(resource.href, '#');
    assert.doesNotMatch(resource.href, /placeholder|example\.com/i);

    const target = resource.href.startsWith('/downloads/')
      ? new URL(`../public${resource.href}`, import.meta.url)
      : new URL(`..${resource.href}`, import.meta.url);
    assert.ok((await stat(target)).size > 0, `${resource.href} should resolve to a non-empty file`);
  }
});

test('the downloadable video skill is public-safe and uses the $watch command', async () => {
  const skill = await readFile(new URL('../public/downloads/watch/SKILL.md', import.meta.url), 'utf8');
  assert.match(skill, /^name: watch$/m);
  assert.match(skill, /Instagram, TikTok, YouTube, (?:or )?X/);
  assert.match(skill, /Access browser cookies only after separate, contemporaneous permission/);
  assert.doesNotMatch(skill, /\/Users\/|Claude Inbox|inbox\.txt/i);
  assert.doesNotMatch(skill, /\$watch-videos-with-ai/);
});

test('the browse destination renders the complete resource collection', () => {
  assert.match(resourcesPage, /<h1 id="resources-page-title">Free Resources<\/h1>/);
  assert.equal((resourcesPage.match(/<h1/g) ?? []).length, 1);
  assert.match(resourcesPage, /data-resource-view="all"/);
  assert.match(viteConfig, /resources: resolve\(import\.meta\.dirname, 'resources\.html'\)/);
});
