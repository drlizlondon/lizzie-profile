import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const css = await readFile(new URL('../styles.css', import.meta.url), 'utf8');

test('homepage contains the required positioning and project links', () => {
  assert.match(html, /Ideas\./);
  assert.match(html, /Impact\./);
  assert.match(html, /In real life\./);
  assert.equal((html.match(/class="project-card/g) ?? []).length, 6);
  assert.match(html, /data-projects-toggle/);
});

test('homepage exposes semantic navigation and a single h1', () => {
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /class="skip-link"/);
});

test('styles include mobile and reduced motion treatments', () => {
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
});
