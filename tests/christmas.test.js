import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const real = read('christmas.html');
const alias = read('ohchristmasinvite.html');
const demo = read('christmasdemo.html');
const OLD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwjES4UvPjIkB2P9DfiUpJIkxNPcCI4qGU3jynteX6btFTy9JdDmYnc-AcBlCHs6yNT2g/exec';

// Static detector: does this page contain any way to send data off-page?
export function sendsData(html) {
  const script = html.split('<script>').slice(1).join('\n');
  return /fetch\s*\(|XMLHttpRequest|sendBeacon|script\.google\.com|new\s+Image|WebSocket/.test(script);
}

test('real invite and alias show London, the text-Lizzie line, and no Enfield', () => {
  for (const html of [real, alias]) {
    assert.ok(!/enfield/i.test(html));
    assert.ok(html.includes('London'));
    assert.ok(html.includes("Text Lizzie if you don't have the address."));
    assert.ok(!/maps\.(google|apple)|goo\.gl\/maps|text\/calendar|\.ics/i.test(html));
  }
});

test('real invite RSVP still posts to the unchanged Apps Script', () => {
  for (const html of [real, alias]) assert.ok(html.includes(`const RSVP_ENDPOINT='${OLD_ENDPOINT}'`));
});

test('alias differs only by og:url', () => {
  assert.equal(alias.replace('/ohchristmasinvite"', '/christmas"'), real);
});

test('no public file mentions Enfield', () => {
  const walk = (d) => readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
  for (const p of walk(new URL('../public', import.meta.url).pathname).filter((p) => /\.(html|txt|xml|json|js|css|svg|ics)$/.test(p))) {
    assert.ok(!/enfield/i.test(readFileSync(p, 'utf8')), p);
  }
});

test('demo is labelled, noindex, address-free and generic', () => {
  assert.ok(demo.includes('Demo: an invite I built with AI. Details are made up.'));
  assert.ok(/<meta name="robots" content="noindex, nofollow">/.test(demo));
  assert.ok(demo.includes('A Saturday in December'));
  assert.ok(!/enfield|15:00|19th|Chris'|Text Lizzie/i.test(demo));
  assert.ok(demo.includes('og:title" content="Demo:'));
  assert.ok(demo.includes('christmas-card-demo.png'));
});

test('demo sends nothing; a mutant that re-enables the POST fails the detector', () => {
  assert.equal(sendsData(demo), false);
  const mutant = demo.replace("e.preventDefault();", `e.preventDefault();fetch('${OLD_ENDPOINT}',{method:'POST',body:'x'});`);
  assert.notEqual(mutant, demo);
  assert.equal(sendsData(mutant), true);
});

test('vercel.json noindexes all three paths and sitemap lists none', () => {
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const p of ['/christmas', '/christmasdemo', '/ohchristmasinvite']) {
    assert.ok(v.headers.some((h) => h.source === p && h.headers.some((x) => x.key === 'X-Robots-Tag' && /noindex/.test(x.value))), p);
  }
  assert.ok(!/christmas/i.test(read('sitemap.xml')));
});
