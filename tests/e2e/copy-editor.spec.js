import { test, expect } from '@playwright/test';
import homeContent from '../../content/home.json' with { type: 'json' };

/* copy-editor.spec.js — exercises the hosted editor end to end against the
   real built/served site, with the GitHub API and the OAuth popup fully
   mocked. No real GitHub token and no real network call to github.com or
   api.github.com is ever made — every request those hostnames would
   receive is intercepted by Playwright's router and answered locally. */

const FAKE_TOKEN = 'fake-test-token-not-a-real-github-token';
const FAKE_SHA = 'fake-sha-abc123';

function toBase64(text) {
  return Buffer.from(text, 'utf8').toString('base64');
}

/** Mocks GET/PUT for repos/drlizlondon/lizzie-profile/contents/content/home.json. */
async function mockGithubContents(page, { onPut } = {}) {
  await page.route('https://api.github.com/repos/drlizlondon/lizzie-profile/contents/content/home.json**', async (route) => {
    const request = route.request();
    if (request.method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ content: toBase64(JSON.stringify(homeContent, null, 2)), sha: FAKE_SHA }),
      });
    }
    if (request.method() === 'PUT') {
      const body = JSON.parse(request.postData() ?? '{}');
      onPut?.(body);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ commit: { html_url: 'https://github.com/drlizlondon/lizzie-profile/commit/fake' } }),
      });
    }
    return route.continue();
  });
}

/* Mocks the /api/auth popup so "sign in" never talks to github.com. Routed
   on the browser CONTEXT, not the page — window.open() creates a new Page
   object, and Playwright's page.route() only intercepts requests from the
   page it was registered on, not from popups it opens; context.route()
   covers every page in the context, present and future.

   The popup is left open (not self-closed) — in headless Chromium, a
   script-driven window.close() on this popup was observed to tear down the
   whole browser context, not just the popup, which is a test-harness quirk
   unrelated to the editor itself. The real api/callback.js still calls
   window.close() in production; only this test double skips it. */
async function mockOAuthPopup(context) {
  await context.route('**/api/auth', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: `<!doctype html><html><body><script>
        window.opener.postMessage({ type: 'lp-editor-oauth', ok: true, token: ${JSON.stringify(FAKE_TOKEN)} }, window.location.origin);
      </script></body></html>`,
    });
  });
}

test.describe('hosted copy editor (?edit)', () => {
  test('a visitor without ?edit never loads the editor module', async ({ page }) => {
    const requests = [];
    page.on('request', (request) => requests.push(request.url()));
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
    expect(requests.some((url) => url.includes('copy-editor'))).toBe(false);
  });

  test('?edit shows a sign-in panel with no session token', async ({ page }) => {
    await page.goto('/?edit');
    await expect(page.getByRole('button', { name: 'Sign in with GitHub' })).toBeVisible();
  });

  test('sign-in, edit hero.proofLine, and Save PUTs the edited JSON with the right sha', async ({ page, context }) => {
    await mockOAuthPopup(context);
    let putBody = null;
    await mockGithubContents(page, { onPut: (body) => { putBody = body; } });

    await page.goto('/?edit');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
    await popupPromise;
    await expect(page.getByRole('button', { name: 'Save & publish' })).toBeVisible();

    const proofLine = page.locator('[data-copy="hero.proofLine"]');
    await expect(proofLine).toBeVisible();
    const newText = 'I use AI to build real products. Now I help you build yours too.';
    await proofLine.click();
    // Set the full replacement text and fire the same 'input' event a real
    // edit would — Ctrl+A select-all inside contenteditable is flaky
    // headless, and this is deterministic while still exercising the
    // editor's real input-tracking listener.
    await proofLine.evaluate((el, text) => {
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, newText);

    await expect(page.getByText('1 change')).toBeVisible();
    await page.getByRole('button', { name: 'Save & publish' }).click();
    await expect(page.getByText('Saved. Live in about 2 minutes.')).toBeVisible();

    expect(putBody).not.toBeNull();
    expect(putBody.sha).toBe(FAKE_SHA);
    expect(putBody.message).toContain('hero.proofLine');
    const decoded = JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
    expect(decoded.hero.proofLine).toBe(newText);
    // Untouched fields must survive the PUT unchanged.
    expect(decoded.hero.leadBold).toBe(homeContent.hero.leadBold);
  });

  test('an em dash blocks Save with the copy-rules message, before any GitHub call', async ({ page, context }) => {
    await mockOAuthPopup(context);
    let putCalled = false;
    await mockGithubContents(page, { onPut: () => { putCalled = true; } });

    await page.goto('/?edit');
    const popupPromise = page.waitForEvent('popup');
    await page.getByRole('button', { name: 'Sign in with GitHub' }).click();
    await popupPromise;
    await expect(page.getByRole('button', { name: 'Save & publish' })).toBeVisible();

    const proofLine = page.locator('[data-copy="hero.proofLine"]');
    await proofLine.click();
    await proofLine.evaluate((el, text) => {
      el.textContent = text;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, 'This has an em dash — right there.');

    await page.getByRole('button', { name: 'Save & publish' }).click();
    await expect(page.getByText('Remove the long dash in: hero.proofLine')).toBeVisible();
    expect(putCalled).toBe(false);
  });
});
