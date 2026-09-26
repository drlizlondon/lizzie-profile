import test from 'node:test';
import assert from 'node:assert/strict';
import { trackContactFormSuccess, __testing__ } from '../lp-analytics.js';

const { PRODUCTION_HOSTS, CONSENT_KEY } = __testing__;
const PROD_HOST = PRODUCTION_HOSTS[0];

/** A minimal in-memory localStorage, since this test runs with Node's own
 * `node --test` runner and no DOM. */
function memoryLocalStorage() {
  const store = new Map();
  return {
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
  };
}

/** @param {{ value?: string }} [opts] */
function makeWindow({ measurementId = 'G-TEST1234', hostname = PROD_HOST, gtag = () => {} } = {}) {
  return {
    __LIZPROFILE_GA4_MEASUREMENT_ID__: measurementId,
    location: { hostname },
    localStorage: memoryLocalStorage(),
    gtag,
  };
}

function grantConsent(win) {
  win.localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: 'granted', decidedAt: Date.now() }));
}

function denyConsent(win) {
  win.localStorage.setItem(CONSENT_KEY, JSON.stringify({ value: 'denied', decidedAt: Date.now() }));
}

/** Runs `fn` with `global.window` set to `win`, always restoring afterwards. */
function withWindow(win, fn) {
  const original = globalThis.window;
  globalThis.window = win;
  try {
    return fn();
  } finally {
    globalThis.window = original;
  }
}

test('trackContactFormSuccess fires generate_lead/contact_form exactly once when everything is allowed', () => {
  const calls = [];
  const win = makeWindow({ gtag: (...args) => calls.push(args) });
  grantConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0], ['event', 'generate_lead', { method: 'contact_form' }]);
});

test('does not fire when consent is undecided', () => {
  const calls = [];
  const win = makeWindow({ gtag: (...args) => calls.push(args) });
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 0);
});

test('does not fire when consent was denied', () => {
  const calls = [];
  const win = makeWindow({ gtag: (...args) => calls.push(args) });
  denyConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 0);
});

test('does not fire on a non-production hostname (localhost)', () => {
  const calls = [];
  const win = makeWindow({ hostname: 'localhost', gtag: (...args) => calls.push(args) });
  grantConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 0);
});

test('does not fire on a preview deploy hostname', () => {
  const calls = [];
  const win = makeWindow({ hostname: 'lizprofile-git-feature.vercel.app', gtag: (...args) => calls.push(args) });
  grantConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 0);
});

test('does not fire when no measurement id is configured', () => {
  const calls = [];
  const win = makeWindow({ measurementId: '', gtag: (...args) => calls.push(args) });
  grantConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 0);
});

test('does not fire when window.gtag was never installed', () => {
  const win = makeWindow();
  delete win.gtag;
  grantConsent(win);
  assert.doesNotThrow(() => withWindow(win, () => trackContactFormSuccess()));
});

test('does not fire when window.gtag exists but is not a function', () => {
  const win = makeWindow();
  win.gtag = 'not-a-function';
  grantConsent(win);
  assert.doesNotThrow(() => withWindow(win, () => trackContactFormSuccess()));
});

test('does not throw if localStorage is unavailable (private mode / storage disabled)', () => {
  const calls = [];
  const win = makeWindow({ gtag: (...args) => calls.push(args) });
  win.localStorage.getItem = () => {
    throw new Error('storage disabled');
  };
  assert.doesNotThrow(() => withWindow(win, () => trackContactFormSuccess()));
  assert.equal(calls.length, 0);
});

test('never includes form field contents (name/email/message) in the event params', () => {
  const calls = [];
  const win = makeWindow({ gtag: (...args) => calls.push(args) });
  grantConsent(win);
  withWindow(win, () => trackContactFormSuccess());
  assert.equal(calls.length, 1);
  const params = calls[0][2];
  assert.deepEqual(params, { method: 'contact_form' });
  assert.equal(Object.keys(params).length, 1);
});

test('production hostname allowlist matches lp-consent.js exactly', () => {
  assert.deepEqual(PRODUCTION_HOSTS, ['drlizlondon.com', 'www.drlizlondon.com']);
});
