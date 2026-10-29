// The App Store version of the Tab Cleaner page can't ship half-finished:
// the real App Store link and Apple's official badge file must both be in place.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../tab-cleaner.html', import.meta.url), 'utf8');

test('the App Store link is the real listing, not the placeholder', () => {
  assert.ok(!html.includes('__APP_STORE_URL__'), 'Replace __APP_STORE_URL__ with the apps.apple.com link once Apple approves the app');
  const m = html.match(/class="stc-appstore" href="([^"]+)"/);
  assert.ok(m && /^https:\/\/apps\.apple\.com\/[a-z]{2}\/app\/[^"]+\/id\d+/.test(m[1]), 'App Store link must be an apps.apple.com/<country>/app/.../id<number> URL');
});

test("Apple's official badge file is present", () => {
  assert.ok(existsSync(new URL('../assets/images/app-store-badge.svg', import.meta.url)) || existsSync(new URL('../public/assets/images/app-store-badge.svg', import.meta.url)),
    "Download the official 'Download on the App Store' badge from Apple's Marketing Tools and save it as assets/images/app-store-badge.svg");
});
