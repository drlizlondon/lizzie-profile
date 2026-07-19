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
  assert.match(html, /class="intro-panel intro-panel-left"><span>Dr Lizzie<\/span>/);
  assert.match(html, /class="intro-panel intro-panel-right"><span>Soyode<\/span>/);
  assert.match(html, /sessionStorage\.getItem\('lizzie-home-intro'\)/);
  assert.match(html, /prefers-reduced-motion: reduce/);
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
  assert.match(js, /new IntersectionObserver\(scheduleActiveNavUpdate/);
  assert.doesNotMatch(js, /window\.scrollY \+ Math\.min/);
  assert.match(html, /data-nav-target="home"/);
  assert.match(html, /data-nav-target="contact" data-nav-neutral/);
  assert.match(css, /body\.menu-open \.nav-scrim/);
  assert.match(css, /\.nav-scrim\{[^}]*inset:0[^}]*rgba\(255,255,255,\.88\)[^}]*-webkit-backdrop-filter:blur\(8px\)/);
  assert.match(css, /body\.menu-closing \.nav-scrim/);
  assert.match(js, /navigationLockId/);
  assert.match(js, /if \(menuOpen \|\| menuClosing \|\| navigationLockId\) return/);
  assert.match(js, /document\.body\.style\.position = 'fixed'/);
  assert.match(js, /element\.setAttribute\('inert', ''\)/);
  assert.match(js, /navigateFromMobileMenu/);
  assert.match(js, /focusTarget\.focus\(\{ preventScroll: true \}\)/);
  assert.match(html, /href="https:\/\/instagram\.com\/drlizlondon"/);
  assert.match(html, /I also create public-facing content online as Dr Liz London\./);
});

test('styles include mobile and reduced motion treatments', () => {
  assert.match(css, /@media\(max-width:820px\)/);
  assert.match(css, /prefers-reduced-motion:reduce/);
  assert.match(css, /touch-action:pan-y/);
  assert.match(css, /min-height:100svh/);
  assert.match(css, /\.projects-section\{min-height:0;padding-top:calc\(3\.65rem/);
  assert.match(css, /max-height:34svh/);
  assert.match(css, /max-width:480px\) and \(max-height:780px/);
  assert.match(js, /Math\.abs\(distanceX\) >= 48/);
  assert.match(css, /@keyframes intro-door-left/);
  assert.match(css, /@keyframes intro-door-right/);
  assert.match(css, /\.intro-panel span\{[^}]*font-family:var\(--serif\)/);
  assert.match(css, /intro-door-left 1\.3s \.5s/);
  assert.match(js, /intro-complete/);
});
