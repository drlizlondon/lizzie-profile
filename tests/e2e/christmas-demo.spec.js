import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// Intercept EVERY request on the demo page. Nothing real is ever contacted: Kit is stubbed.
//  - RSVP submit must send nothing.
//  - Waiting-list sign-up: exactly one POST, only to the existing Kit endpoint, only email_address + fields[source].
//  - GA4 events fire only when consent is granted.
// CHRISTMAS_MUTANT = rsvp | payload | endpoint | consent serves a broken demo: the matching test must then FAIL.
const KIT = 'https://app.kit.com/forms/9872350/subscriptions';
const MUTANT = process.env.CHRISTMAS_MUTANT;

function demoHtml() {
  let h = readFileSync(new URL('../../public/christmasdemo.html', import.meta.url), 'utf8');
  const sub = (a, b) => { expect(h).toContain(a); h = h.replace(a, b); };
  // let the production-only analytics guard run on localhost for the test
  sub("const ANALYTICS_HOSTS=['drlizlondon.com','www.drlizlondon.com'];", "const ANALYTICS_HOSTS=['drlizlondon.com','localhost'];");
  if (MUTANT === 'rsvp') sub("e.preventDefault();\n  if(!form.reportValidity()) return;", `e.preventDefault();fetch('${KIT}',{method:'POST',body:'x'});`);
  if (MUTANT === 'payload') sub("body.append('fields[source]',SIGNUP_SOURCE);", "body.append('fields[source]',SIGNUP_SOURCE);body.append('first_name','x');");
  if (MUTANT === 'endpoint') sub("https://app.kit.com/forms/9872350/subscriptions", "https://example.com/collect");
  if (MUTANT === 'consent') sub("if(!c||c.value!=='granted') return;", "");
  return h;
}

async function open(page, { consent }) {
  const seen = [];
  await page.addInitScript(({ consent }) => {
    window.__LIZPROFILE_GA4_MEASUREMENT_ID__ = 'G-TEST';
    window.__events = [];
    window.gtag = (...a) => window.__events.push(a);
    try { if (consent) localStorage.setItem('lp_analytics_consent_v1', JSON.stringify({ value: 'granted', at: Date.now() })); } catch { /* storage unavailable */ }
  }, { consent });
  await page.route('**/*', (route) => {
    const r = route.request();
    seen.push({ url: r.url(), method: r.method(), body: r.postData() || '' });
    if (r.url().endsWith('/analytics-config.js') || r.url().endsWith('/lp-consent.js')) return route.fulfill({ contentType: 'text/javascript', body: '' });
    if (r.url().endsWith('/christmasdemo.html')) return route.fulfill({ contentType: 'text/html', body: demoHtml() });
    if (r.method() === 'POST') return route.fulfill({ contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: '{"status":"success"}' });
    return route.continue();
  });
  await page.goto('/christmasdemo.html');
  return { seen, events: () => page.evaluate(() => window.__events) };
}
const posts = (seen) => seen.filter((x) => x.method !== 'GET' && x.method !== 'HEAD');

test('RSVP submit sends nothing', async ({ page }) => {
  const { seen } = await open(page, { consent: false });
  const before = seen.length;
  await page.evaluate(() => { document.getElementById('invite').style.pointerEvents = 'auto'; });
  await page.locator('#yesBtn').click({ force: true });
  await page.fill('#guest1', 'Test Guest');
  await page.click('#submitRsvp');
  await expect(page.locator('#confirmationMessage')).toHaveText('This is a demo, so your reply wasn’t sent.');
  await page.waitForTimeout(400);
  expect(posts(seen.slice(before))).toEqual([]);
});

test('sign-up posts once, only to the existing Kit endpoint, only email_address + fields[source]', async ({ page }) => {
  const { seen } = await open(page, { consent: false });
  await page.click('#lessonBtn');
  await page.fill('#leadEmail', 'guest@example.com');
  await page.click('#leadSubmit');
  await expect(page.locator('#leadDone')).toBeVisible();
  const p = posts(seen);
  expect(p).toHaveLength(1);
  expect(p[0].url).toBe(KIT);
  const names = [...p[0].body.matchAll(/name="([^"]+)"/g)].map((m) => m[1]).sort();
  expect(names).toEqual(['email_address', 'fields[source]']);
  expect(p[0].body).toContain('christmasdemo');
  expect(p[0].body).toContain('guest@example.com');
});

test('honeypot filled sends nothing', async ({ page }) => {
  const { seen } = await open(page, { consent: false });
  await page.click('#lessonBtn');
  await page.fill('#leadEmail', 'bot@example.com');
  await page.evaluate(() => { document.getElementById('leadWebsite').value = 'x'; });
  await page.click('#leadSubmit');
  await expect(page.locator('#leadDone')).toBeVisible();
  expect(posts(seen)).toEqual([]);
});

test('analytics events fire only after consent', async ({ page }) => {
  const a = await open(page, { consent: false });
  await page.click('#lessonBtn');
  await page.fill('#leadEmail', 'guest@example.com');
  await page.click('#leadSubmit');
  await expect(page.locator('#leadDone')).toBeVisible();
  expect(await a.events()).toEqual([]);
});

test('analytics events fire with consent: click then signup, no data', async ({ page }) => {
  const a = await open(page, { consent: true });
  await page.click('#lessonBtn');
  await page.fill('#leadEmail', 'guest@example.com');
  await page.click('#leadSubmit');
  await expect(page.locator('#leadDone')).toBeVisible();
  expect(await a.events()).toEqual([['event', 'christmasdemo_lesson_click', {}], ['event', 'christmasdemo_lesson_signup', {}]]);
});
