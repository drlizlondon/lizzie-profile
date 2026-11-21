import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

// The demo must send nothing. Intercept EVERY request; after the form is
// submitted, assert none was a POST or went to script.google.com / any external host.
// CHRISTMAS_DEMO_MUTANT=1 serves a demo that re-enables the POST: this spec must then FAIL.
const demoHtml = () => {
  let h = readFileSync(new URL('../../public/christmasdemo.html', import.meta.url), 'utf8');
  if (process.env.CHRISTMAS_DEMO_MUTANT) {
    h = h.replace('e.preventDefault();', "e.preventDefault();fetch('https://script.google.com/macros/s/x/exec',{method:'POST',body:'x'});");
  }
  return h;
};

test('demo RSVP submit makes no network request', async ({ page }) => {
  const seen = [];
  await page.route('**/*', (route) => {
    const r = route.request();
    seen.push({ url: r.url(), method: r.method() });
    if (r.url().endsWith('/christmasdemo.html')) return route.fulfill({ contentType: 'text/html', body: demoHtml() });
    return route.continue();
  });
  await page.goto('/christmasdemo.html');
  await page.evaluate(() => { document.getElementById('invite').style.pointerEvents = 'auto'; });
  await page.locator('#yesBtn').click({ force: true });
  await page.fill('#guest1', 'Test Guest');
  const before = seen.length;
  await page.click('#submitRsvp');
  await expect(page.locator('#confirmationMessage')).toHaveText('This is a demo, so your reply wasn’t sent.');
  await page.waitForTimeout(500);
  const after = seen.slice(before);
  expect(after.filter((x) => x.method !== 'GET' && x.method !== 'HEAD')).toEqual([]);
  expect(seen.filter((x) => /script\.google\.com|googleusercontent/.test(x.url))).toEqual([]);
  const origin = new URL(page.url()).origin;
  expect(seen.filter((x) => !x.url.startsWith(origin) && !x.url.startsWith('data:'))).toEqual([]);
});
