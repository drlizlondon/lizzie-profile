import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../api/contact.js';

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
