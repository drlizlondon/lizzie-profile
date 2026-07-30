/** @param {{ status: (code: number) => { json: (body: object) => unknown } }} response @param {number} status @param {object} body */
const json = (response, status, body) => response.status(status).json(body);
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** @param {{ method?: string, body?: Record<string, unknown> }} request @param {{ status: (code: number) => { json: (body: object) => unknown }, setHeader: (name: string, value: string) => void }} response */
export default async function handler(request, response) {
  if (request.method !== 'POST') return json(response, 405, { message: 'Method not allowed.' });
  const { name = '', email = '', message = '', website = '' } = request.body || {};
  if (website) return json(response, 200, { ok: true });
  if (typeof name !== 'string' || name.trim().length < 2 || name.length > 100) return json(response, 400, { message: 'Please enter your name.' });
  if (typeof email !== 'string' || !emailPattern.test(email) || email.length > 254) return json(response, 400, { message: 'Please enter a valid email address.' });
  if (typeof message !== 'string' || message.trim().length < 20 || message.length > 3000) return json(response, 400, { message: 'Please add a little more detail to your message.' });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || 'hello@drlizlondon.com';
  const from = process.env.CONTACT_FROM_EMAIL || 'Dr Liz London website <contact@drlizlondon.com>';
  if (!apiKey) return json(response, 503, { message: 'Online delivery is temporarily unavailable.' });

  const delivery = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to: [to],
      reply_to: email.trim(),
      subject: `Website enquiry from ${name.trim()}`,
      text: `Name: ${name.trim()}\nEmail: ${email.trim()}\n\n${message.trim()}`,
    }),
  });
  if (!delivery.ok) return json(response, 502, { message: 'Online delivery is temporarily unavailable.' });
  response.setHeader('Cache-Control', 'no-store');
  return json(response, 200, { ok: true });
}
