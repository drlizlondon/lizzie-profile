import { apiUrl } from './fable-api.js';
import { trackSiteEvent } from './site-events.js';

trackSiteEvent('site_viewed');

const button = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-unsubscribe]'));
const ready = /** @type {HTMLElement | null} */ (document.querySelector('[data-unsubscribe-ready]'));
const success = /** @type {HTMLElement | null} */ (document.querySelector('[data-unsubscribe-success]'));
const status = /** @type {HTMLElement | null} */ (document.querySelector('[data-unsubscribe-status]'));
const token = new URLSearchParams(window.location.search).get('token');

if (!token && status) status.textContent = 'This unsubscribe link is incomplete. Please use the full link from your email.';
if (!token && button) button.disabled = true;

button?.addEventListener('click', async () => {
  if (!token || !status) return;
  button.disabled = true;
  button.textContent = 'Unsubscribing…';
  status.textContent = '';
  try {
    const response = await fetch(apiUrl('/api/fable-pro/unsubscribe'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result.ok) throw new Error(result.message || 'We could not process this request. Please try again.');
    if (ready) ready.hidden = true;
    if (success) {
      success.hidden = false;
      success.focus();
    }
    window.dispatchEvent(new CustomEvent('lizprofile:analytics', { detail: { name: 'fable_pro_unsubscribed' } }));
  } catch (error) {
    status.textContent = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
    button.disabled = false;
    button.textContent = 'Unsubscribe';
  }
});
