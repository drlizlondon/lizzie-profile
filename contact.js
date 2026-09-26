import { trackContactFormSuccess } from './lp-analytics.js';

const form = document.querySelector('[data-contact-form]');
const status = document.querySelector('[data-contact-status]');

if (form instanceof HTMLFormElement && status instanceof HTMLElement) {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const button = form.querySelector('button[type="submit"]');
    if (button instanceof HTMLButtonElement) button.disabled = true;
    status.textContent = 'Sending…';
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form))),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Your message could not be sent.');
      trackContactFormSuccess();
      form.reset();
      status.textContent = 'Thank you — your message has been sent.';
    } catch (error) {
      status.textContent = `${error instanceof Error ? error.message : 'Your message could not be sent.'} Please email hello@drlizlondon.com.`;
    } finally {
      if (button instanceof HTMLButtonElement) button.disabled = false;
    }
  });
}
