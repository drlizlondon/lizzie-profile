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
  assert.match(html, /A selection of products built to solve real-world problems\./);
  assert.match(js, /Helping women capture what matters during pregnancy\./);
  assert.match(js, /Built from my own pregnancy\./);
  assert.match(js, /websiteLabel: 'View BumpNotes'/);
  assert.match(html, /aria-label="Previous project"/);
  assert.match(html, /aria-label="Next project"/);
});

test('homepage exposes semantic navigation and a single h1', () => {
  assert.match(html, /<nav[^>]+aria-label="Primary navigation"/);
  assert.equal((html.match(/<h1/g) ?? []).length, 1);
  assert.match(html, /class="skip-link"/);
  const primaryNav = html.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] ?? '';
  assert.match(primaryNav, />Home</);
  assert.match(primaryNav, />About</);
  assert.match(primaryNav, />Projects</);
  assert.match(primaryNav, />Public Voice</);
  assert.match(primaryNav, />Contact</);
  assert.ok(primaryNav.indexOf('>Projects<') < primaryNav.indexOf('>About<'));
  assert.doesNotMatch(primaryNav, />Work<|>Portfolio<|>Media</);
  assert.match(js, /aria-current/);
  assert.match(html, /data-nav-target="home"/);
  assert.match(css, /body\.menu-open \.nav-scrim/);
  assert.match(html, /href="https:\/\/instagram\.com\/drlizlondon"/);
  assert.match(html, /I also create public-facing content online as Dr Liz London\./);
});

test('styles include mobile and reduced motion treatments', () => {
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /touch-action:pan-y/);
  assert.match(css, /min-height:100svh/);
  assert.match(css, /max-height:34svh/);
  assert.match(css, /max-width:480px\) and \(max-height:780px/);
  assert.match(js, /Math\.abs\(distanceX\) >= 48/);
});
