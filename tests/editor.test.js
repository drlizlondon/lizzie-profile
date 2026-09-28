import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const mainJs = await readFile(new URL('../main.js', import.meta.url), 'utf8');
const callbackJs = await readFile(new URL('../api/callback.js', import.meta.url), 'utf8');
const editorJs = await readFile(new URL('../editor/copy-editor.js', import.meta.url), 'utf8');
const vercelConfig = JSON.parse(await readFile(new URL('../vercel.json', import.meta.url), 'utf8'));
const robotsTxt = await readFile(new URL('../public/robots.txt', import.meta.url), 'utf8');

test('the editor module is never statically imported — only conditionally, on ?edit', () => {
  // main.js (the page's main bundle) must never reference the editor module.
  assert.doesNotMatch(mainJs, /copy-editor/);

  // index.html must not carry an unconditional <script src> for it.
  assert.doesNotMatch(html, /<script[^>]+src="\/?editor\/copy-editor\.js"/);

  // The only path to it is a dynamic import(), guarded by an `?edit` check,
  // inside an inline module script.
  assert.match(html, /if\s*\(\s*new URLSearchParams\(window\.location\.search\)\.has\(['"]edit['"]\)\s*\)\s*\{\s*\n?\s*import\(['"]\/editor\/copy-editor\.js['"]\)/);
});

test('api/callback.js never postMessages with targetOrigin "*"', () => {
  assert.doesNotMatch(callbackJs, /postMessage\([^)]*,\s*['"]\*['"]\s*\)/);
  // It must derive the target origin from the request's own host, not hardcode one.
  assert.match(callbackJs, /function siteOrigin/);
  assert.match(callbackJs, /request\.headers\?\.host/);
  assert.match(callbackJs, /window\.opener\.postMessage\(payload, targetOrigin\)/);
});

test('the editor module forces paste to plain text using insertNode/createTextNode, not innerHTML', () => {
  const pasteHandler = editorJs.match(/function onPastePlainText\([\s\S]*?\n\}/)?.[0] ?? '';
  assert.ok(pasteHandler, 'expected an onPastePlainText function in editor/copy-editor.js');
  assert.match(pasteHandler, /event\.preventDefault\(\)/);
  assert.match(pasteHandler, /getData\(['"]text\/plain['"]\)/);
  assert.match(pasteHandler, /createTextNode/);
  assert.doesNotMatch(pasteHandler, /innerHTML/);
});

test('the editor module keeps the GitHub token in sessionStorage only', () => {
  assert.match(editorJs, /sessionStorage\.setItem/);
  assert.doesNotMatch(editorJs, /localStorage\.setItem/);
});

test('/admin redirects to /?edit and is disallowed for crawlers', () => {
  /** @type {{ source: string, destination: string }[]} */
  const redirects = vercelConfig.redirects;
  /** @type {{ source: string, headers: { key: string, value: string }[] }[]} */
  const headerRules = vercelConfig.headers;

  const adminRedirect = redirects.find((redirect) => redirect.source === '/admin');
  assert.ok(adminRedirect, 'expected a /admin redirect in vercel.json');
  assert.equal(adminRedirect.destination, '/?edit');

  const adminHeaders = headerRules.find((header) => header.source === '/admin');
  assert.ok(adminHeaders, 'expected noindex headers for /admin in vercel.json');
  assert.ok(adminHeaders.headers.some((h) => h.key === 'X-Robots-Tag' && /noindex/.test(h.value)));

  assert.match(robotsTxt, /Disallow: \/admin/);
});

test('the editor injects a noindex meta tag at runtime (query strings cannot be matched by Vercel headers)', () => {
  assert.match(editorJs, /function ensureNoindex/);
  assert.match(editorJs, /name\s*=\s*['"]robots['"]/);
  assert.match(editorJs, /noindex/);
});
