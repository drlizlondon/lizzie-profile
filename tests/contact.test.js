import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import handler from '../api/contact.js';

const clientJs = await readFile(new URL('../contact.js', import.meta.url), 'utf8');

/** @param {Record<string, unknown>} body @param {string} [method] */
const invoke = async (body, method = 'POST') => {
  /** @type {{ statusCode: number, body: object | null, headers: Record<string, string> }} */
  const result = { statusCode: 0, body: null, headers: {} };
  const response = {
    /** @param {number} code */
    status(code) { result.statusCode = code; return this; },
    /** @param {object} value */
    json(value) { result.body = value; return this; },
    /** @param {string} name @param {string} value */
    setHeader(name, value) { result.headers[name] = value; },
  };
  await handler({ method, body }, response);
  return result;
};

test('contact endpoint rejects invalid submissions', async () => {
  assert.equal((await invoke({ name: '', email: 'bad', message: 'short' })).statusCode, 400);
  assert.equal((await invoke({}, 'GET')).statusCode, 405);
});

test('contact honeypot returns success without delivery', async () => {
  const result = await invoke({ name: 'Robot', email: 'bot@example.com', message: 'A long enough automated message.', website: 'spam.test' });
  assert.equal(result.statusCode, 200);
  assert.deepEqual(result.body, { ok: true });
});

test('contact endpoint fails safely when delivery is not configured', async () => {
  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const result = await invoke({ name: 'Person', email: 'person@example.com', message: 'I would like to discuss a strategy project.' });
  if (key) process.env.RESEND_API_KEY = key;
  assert.equal(result.statusCode, 503);
});

test('client-side handler fires the GA4 conversion event only after a confirmed success, never on failure or before', () => {
  assert.match(clientJs, /import \{ trackContactFormSuccess \} from '\.\/lp-analytics\.js';/);

  const submitHandler = clientJs.match(/form\.addEventListener\('submit'[\s\S]*?\n\}\);?\n?$/)?.[0]
    ?? clientJs.slice(clientJs.indexOf("form.addEventListener('submit'"));
  const tryBlock = submitHandler.slice(submitHandler.indexOf('try {'), submitHandler.indexOf('} catch'));
  const catchBlock = submitHandler.slice(submitHandler.indexOf('} catch'), submitHandler.indexOf('} finally'));

  // Fires exactly once, inside the try block.
  assert.equal((tryBlock.match(/trackContactFormSuccess\(\)/g) ?? []).length, 1);
  // Never fires from the catch block (a failed/thrown submission).
  assert.doesNotMatch(catchBlock, /trackContactFormSuccess/);
  // Comes strictly after the response.ok guard and before the success UI update.
  const okCheckIndex = tryBlock.indexOf('if (!response.ok) throw');
  const trackIndex = tryBlock.indexOf('trackContactFormSuccess()');
  const resetIndex = tryBlock.indexOf('form.reset()');
  assert.ok(okCheckIndex !== -1 && trackIndex !== -1 && resetIndex !== -1);
  assert.ok(okCheckIndex < trackIndex, 'must fire after the response.ok check, never before the server confirms success');
  assert.ok(trackIndex < resetIndex, 'must fire before the success UI reset, i.e. as part of the confirmed-success path');
});
