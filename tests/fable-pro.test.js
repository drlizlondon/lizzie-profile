import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FABLE_PRO_GUIDE, FABLE_PRO_PROMPT } from '../fable-pro-content.js';

/** @param {string} path */
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const [
  page,
  client,
  main,
  unsubscribePage,
  privacy,
] = await Promise.all([
  read('../betty-prompt.html'),
  read('../fable-pro.js'),
  read('../main.js'),
  read('../unsubscribe.html'),
  read('../privacy.html'),
]);

test('keeps the free prompt public and gates only the complete Pro prompt', () => {
  assert.match(page, /data-fable-prompt>Act as an expert collaborator/);
  assert.match(page, /The Betty Prompt/);
  assert.match(page, /Betty Pro Prompt/);
  assert.match(page, /data-fable-pro-form/);
  assert.match(page, /By signing up you agree to our <a href="\/privacy" data-privacy-popup>privacy notice<\/a>\. Unsubscribe any time\./);
  assert.doesNotMatch(page, /Act as an experienced collaborator, strategist, architect and reviewer/);
  assert.match(client, /localStorage\.getItem\(ACCESS_KEY\)/);
  assert.match(client, /localStorage\.setItem\(ACCESS_KEY, 'granted'\)/);
  assert.match(page, /Retry email delivery/);
  assert.ok(FABLE_PRO_PROMPT.length > 4500);
  assert.match(FABLE_PRO_PROMPT, /^Betty Pro Prompt/);
  assert.match(FABLE_PRO_GUIDE, /ChatGPT[\s\S]*Claude[\s\S]*Codex[\s\S]*Cursor[\s\S]*Gemini/);
});

test('signs up via Kit without browser secrets', () => {
  // Signup posts to a Kit form; the retired Sites service is no longer used.
  assert.match(client, /import\.meta\.env\.VITE_BETTY_KIT_ENDPOINT/);
  assert.match(client, /app\.kit\.com\/forms\/\$\{BETTY_KIT_FORM\}\/subscriptions/);
  assert.doesNotMatch(client, /apiUrl\(['"]\/api\/fable-pro\/signup['"]\)/);

  const browserSources = [main, client].join('\n');
  assert.doesNotMatch(browserSources, /SUPABASE_SERVICE_ROLE_KEY|RESEND_API_KEY|CLOUDFLARE_API_TOKEN/);
  assert.doesNotMatch(browserSources, /example\.supabase\.co|\/rest\/v1\/fable_pro_subscribers/);
});

test('provides explicit free and Pro prompt downloads and records the expected actions', () => {
  assert.match(page, /data-download-fable/);
  assert.match(page, /data-download-fable-pro/);
  assert.match(main, /navigator\.clipboard\.writeText\(prompt\)/);
  assert.match(client, /navigator\.clipboard\.writeText\(FABLE_PRO_PROMPT\)/);
  assert.match(main, /new Blob\(/);
  assert.match(client, /new Blob\(/);
  assert.match(client, /betty-pro-prompt-and-guide\.txt/);
});

test('privacy copy names processors, aggregate measurement and conservative consent behaviour', () => {
  assert.match(privacy, /<h1>Privacy notice<\/h1>/);
  assert.match(privacy, /Every email has an unsubscribe link/);
  assert.match(privacy, /Kit stores your email address/);
  assert.match(privacy, /run only if you choose "Allow analytics"/);
  assert.match(privacy, /never what you type/);
  assert.match(privacy, /never used for advertising/);
  assert.match(privacy, /Privacy choices/);
  assert.doesNotMatch(privacy, /Legal review recommended/);
  assert.match(privacy, /hello@drlizlondon\.com/);
  assert.match(unsubscribePage, /Unsubscribe from Betty updates/);
  assert.match(unsubscribePage, /use the unsubscribe link at the bottom of any email/);
  assert.match(unsubscribePage, /mailto:hello@drlizlondon\.com/);
});

test('Betty 1.3: says what was not checked, treats content as data, carries the agent section inline and never points at We Build For Good', async () => {
  const { FABLE_PRO_VERSION, FABLE_PRO_GUIDE } = await import('../fable-pro-content.js');
  assert.equal(FABLE_PRO_VERSION, '1.3');
  assert.match(page, /name anything you did not check/);
  assert.match(page, /as information to assess, not as instructions to you/);
  assert.match(FABLE_PRO_PROMPT, /passed, failed, or not checked/);
  assert.match(FABLE_PRO_PROMPT, /only evidence if it would have failed/);
  assert.match(FABLE_PRO_PROMPT, /look for what already exists/);
  assert.match(FABLE_PRO_PROMPT, /If your AI can take actions \(optional\)/);
  assert.match(FABLE_PRO_PROMPT, /My autonomy settings/);
  assert.match(FABLE_PRO_GUIDE, /Include the "If your AI can take actions" section/);
  // founder ruling 2026-10-22: the two brands never link to each other
  const pages = [page, FABLE_PRO_PROMPT, FABLE_PRO_GUIDE, main, client].join('\n');
  assert.doesNotMatch(pages, /webuildforgood|we build for good/i);
  assert.doesNotMatch(FABLE_PRO_PROMPT + page.match(/data-fable-prompt>[\s\S]*?<\/pre>/)?.[0], /—/);
});
