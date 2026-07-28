import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { FABLE_PRO_GUIDE, FABLE_PRO_PROMPT } from '../fable-pro-content.js';

/** @param {string} path */
const read = (path) => readFile(new URL(path, import.meta.url), 'utf8');

const [
  page,
  client,
  apiClient,
  siteEvents,
  main,
  unsubscribe,
  unsubscribePage,
  privacy,
] = await Promise.all([
  read('../betty-prompt.html'),
  read('../fable-pro.js'),
  read('../fable-api.js'),
  read('../site-events.js'),
  read('../main.js'),
  read('../unsubscribe.js'),
  read('../unsubscribe.html'),
  read('../privacy.html'),
]);

test('keeps the free prompt public and gates only the complete Pro prompt', () => {
  assert.match(page, /data-fable-prompt>Act as an expert collaborator/);
  assert.match(page, /The Betty Prompt/);
  assert.match(page, /Betty Pro Prompt/);
  assert.match(page, /data-fable-pro-form/);
  assert.match(page, /By entering your email, you will receive the Betty Pro Prompt and occasional updates/);
  assert.doesNotMatch(page, /Act as an experienced collaborator, strategist, architect and reviewer/);
  assert.match(client, /localStorage\.getItem\(ACCESS_KEY\)/);
  assert.match(client, /localStorage\.setItem\(ACCESS_KEY, 'granted'\)/);
  assert.match(page, /Retry email delivery/);
  assert.ok(FABLE_PRO_PROMPT.length > 4500);
  assert.match(FABLE_PRO_PROMPT, /^Betty Pro Prompt/);
  assert.match(FABLE_PRO_GUIDE, /ChatGPT[\s\S]*Claude[\s\S]*Codex[\s\S]*Cursor[\s\S]*Gemini/);
});

test('uses the configured Sites origin for signup and unsubscribe without browser secrets', () => {
  assert.match(apiClient, /import\.meta\.env\.VITE_FABLE_SERVICE_URL/);
  assert.match(client, /apiUrl\(['"]\/api\/fable-pro\/signup['"]\)/);
  assert.match(unsubscribe, /apiUrl\(['"]\/api\/fable-pro\/unsubscribe['"]\)/);
  assert.doesNotMatch(client, /fetch\(['"]\/api\/fable-pro\/signup/);
  assert.doesNotMatch(unsubscribe, /fetch\(['"]\/api\/fable-pro\/unsubscribe/);

  const browserSources = [apiClient, siteEvents, main, client, unsubscribe].join('\n');
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
  assert.match(main, /fable_free_prompt_copied/);
  assert.match(main, /fable_free_prompt_downloaded/);
  assert.match(client, /fable_pro_prompt_copied/);
  assert.match(client, /fable_pro_prompt_downloaded/);
});

test('analytics uses a pseudonymous browser id and sends only allowlisted frontend events', () => {
  assert.match(siteEvents, /crypto\.randomUUID\(\)/);
  assert.match(siteEvents, /localStorage/);
  assert.match(siteEvents, /apiUrl\(['"]\/api\/events['"]\)/);
  assert.doesNotMatch(siteEvents, /JSON\.stringify\(\{[^}]*email|navigator\.userAgent/);
  assert.match(main, /trackSiteEvent\(['"]site_viewed['"]\)/);
  assert.match(main, /trackSiteEvent\(['"]fable_prompt_viewed['"]\)/);

  const frontendSources = [main, client].join('\n');
  for (const eventName of [
    'site_viewed',
    'fable_prompt_viewed',
    'fable_free_prompt_copied',
    'fable_free_prompt_downloaded',
    'fable_pro_prompt_copied',
    'fable_pro_prompt_downloaded',
  ]) {
    assert.match(frontendSources, new RegExp(`['"]${eventName}['"]`));
  }
});

test('privacy copy names processors, aggregate measurement and conservative consent behaviour', () => {
  assert.match(privacy, /How Betty Pro uses your information/);
  assert.match(privacy, /Every Betty email includes a secure unsubscribe link/);
  assert.match(privacy, /OpenAI Sites/);
  assert.match(privacy, /Cloudflare D1/);
  assert.match(privacy, /Resend processes delivery/);
  assert.match(privacy, /random identifier is stored in your browser and hashed by the server/);
  assert.match(privacy, /not linked to your email address/);
  assert.match(privacy, /does not store raw IP addresses or user-agent strings/);
  assert.match(privacy, /you will not be re-enrolled in future updates/);
  assert.match(privacy, /Required legal completion/);
  assert.match(privacy, /placeholder contact address/);
  assert.match(unsubscribePage, /Unsubscribe from Betty updates\?/);
  assert.match(unsubscribePage, /You will keep your Betty Pro Prompt/);
});
