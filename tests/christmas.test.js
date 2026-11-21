import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const read = (f) => readFileSync(new URL(`../public/${f}`, import.meta.url), 'utf8');
const real = read('christmas.html');
const alias = read('ohchristmasinvite.html');
const demo = read('christmasdemo.html');
const OLD_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwjES4UvPjIkB2P9DfiUpJIkxNPcCI4qGU3jynteX6btFTy9JdDmYnc-AcBlCHs6yNT2g/exec';

// Static detector: does this chunk of script contain any way to send data off-page?
export function sendsData(script) {
  return /fetch\s*\(|XMLHttpRequest|sendBeacon|script\.google\.com|new\s+Image|WebSocket/.test(script);
}
const rsvpHandler = (html) => html.slice(html.indexOf("form.addEventListener('submit'"), html.indexOf("document.getElementById('changeRsvp')"));

test('real invite and alias show London, the text-Lizzie line, and no Enfield', () => {
  for (const html of [real, alias]) {
    assert.ok(!/enfield/i.test(html));
    assert.ok(html.includes('London'));
    assert.ok(html.includes("Message Lizzie if you don't have the address."));
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
  assert.ok(!/enfield|15:00|19th|Chris'|Text Lizzie|Message Lizzie/i.test(demo));
  assert.ok(demo.includes('og:title" content="Demo:'));
  assert.ok(demo.includes('christmas-card-demo.png'));
});

test('demo RSVP handler sends nothing; a mutant that re-enables the POST fails the detector', () => {
  assert.ok(rsvpHandler(demo).length > 100);
  assert.equal(sendsData(rsvpHandler(demo)), false);
  const mutant = demo.replace("e.preventDefault();\n  if(!form.reportValidity()) return;", `e.preventDefault();fetch('${OLD_ENDPOINT}',{method:'POST',body:'x'});`);
  assert.notEqual(mutant, demo);
  assert.equal(sendsData(rsvpHandler(mutant)), true);
});

test('demo sign-up reuses the existing Kit form from fable-pro.js and tags source=christmasdemo', () => {
  const fable = readFileSync(new URL('../fable-pro.js', import.meta.url), 'utf8');
  const id = fable.match(/BETTY_KIT_FORM = '(\d+)'/)[1];
  assert.ok(demo.includes(`const SIGNUP_ENDPOINT='https://app.kit.com/forms/${id}/subscriptions';`));
  assert.ok(fable.includes("KIT_EMAIL_FIELD = 'email_address'") && demo.includes("append('email_address'"));
  assert.ok(demo.includes("append('fields[source]',SIGNUP_SOURCE)") && demo.includes("SIGNUP_SOURCE='christmasdemo'"));
  assert.equal((demo.match(/fetch\s*\(/g) || []).length, 1);
  assert.ok(!/script\.google\.com/.test(demo));
});

test('demo lesson section: prompt under 120 words and generic, honest waiting-list copy, honeypot, privacy link', () => {
  const prompt = demo.match(/id="promptText"[^>]*>([\s\S]*?)<\/textarea>/)[1];
  assert.ok(prompt.trim().split(/\s+/).length < 120);
  assert.ok(!/christmas|enfield|chris|19th/i.test(prompt));
  assert.ok(demo.includes('Want to build one yourself?'));
  assert.ok(demo.includes('Yes please, I want the lesson'));
  assert.ok(demo.includes("I'm making a short lesson on building this with AI. Leave your email and you'll be first to get it."));
  assert.ok(demo.includes('href="/privacy"') && demo.includes('name="company"'));
  for (const html of [real, alias]) assert.ok(!/Want to build one|SIGNUP_|leadForm|lp-consent/.test(html));
});

test('demo analytics: events go only through the consent guard', () => {
  assert.ok(demo.includes("track('christmasdemo_lesson_click')") && demo.includes("track('christmasdemo_lesson_signup')"));
  assert.ok(!/gtag\s*\(/.test(demo.replace(/window\.gtag\('event',name,\{\}\)/, '')));
  assert.ok(demo.includes("c.value!=='granted'"));
});

test('vercel.json noindexes all three paths and sitemap lists none', () => {
  const v = JSON.parse(readFileSync(new URL('../vercel.json', import.meta.url), 'utf8'));
  for (const p of ['/christmas', '/christmasdemo', '/ohchristmasinvite']) {
    assert.ok(v.headers.some((h) => h.source === p && h.headers.some((x) => x.key === 'X-Robots-Tag' && /noindex/.test(x.value))), p);
  }
  assert.ok(!/christmas/i.test(read('sitemap.xml')));
});
