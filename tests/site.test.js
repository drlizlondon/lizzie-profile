import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');
const js = await readFile(new URL('../main.js', import.meta.url), 'utf8');

test('homepage contains the required positioning and project links', () => {
  assert.match(html, /Ideas\./);
  assert.match(html, /Impact\./);
  assert.match(html, /In real life\./);
  assert.match(html, /data-project-carousel/);
  assert.equal((js.match(/caseStudy: '\/projects\//g) ?? []).length, 6);
});

test('homepage exposes semantic navigation and a single h1', () => {
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /class="skip-link"/);
  const primaryNav = html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.match(primaryNav, />About</);
  assert.match(primaryNav, />Projects</);
  assert.match(primaryNav, />Public Voice</);
  assert.match(primaryNav, />Contact</);
  assert.doesNotMatch(primaryNav, />Work<|>Portfolio<|>Media</);
  assert.match(js, /aria-current/);
  assert.match(html, /href="https:\/\/instagram\.com\/drlizlondon"/);
});

test('styles include mobile and reduced motion treatments', () => {
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
