import { FABLE_PRO_GUIDE, FABLE_PRO_PROMPT } from './fable-pro-content.js';
import { trackSiteEvent } from './site-events.js';

// TODO(Lizzie): replace with the real Betty Kit form id once the Betty form
// is created in Kit (drlizlondon.kit.com) — a separate form from the Safari
// one (UID 042a6f98ec, numeric id 9870031) so signups segment `betty` vs
// `safari` by list membership. Derive the numeric id the same way Safari's
// did: fetch the account's embed script at
// https://drlizlondon.kit.com/<new-uid>/index.js and read the rendered
// <form action="..."> — do not hand-guess it. See
// ~/safari-tab-tidy-kit/src/components/waitlist-form.tsx for the proven
// pattern this mirrors.
const BETTY_KIT_FORM = '9872350';
const DEFAULT_KIT_ENDPOINT = `https://app.kit.com/forms/${BETTY_KIT_FORM}/subscriptions`;
const KIT_EMAIL_FIELD = 'email_address';

const ACCESS_KEY = 'fable-pro-access-v1';
const form = /** @type {HTMLFormElement | null} */ (document.querySelector('[data-fable-pro-form]'));
const emailInput = /** @type {HTMLInputElement | null} */ (document.querySelector('[data-fable-pro-email]'));
const submitButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-fable-pro-submit]'));
const formStatus = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-form-status]'));
const success = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-success]'));
const deliveryStatus = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-delivery-status]'));
const proPrompt = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-prompt]'));
const proGuide = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-guide]'));
const copyButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-copy-fable-pro]'));
const downloadButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-download-fable-pro]'));
const copyStatus = /** @type {HTMLElement | null} */ (document.querySelector('[data-fable-pro-copy-status]'));
const retryButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-fable-pro-retry]'));

if (proPrompt) proPrompt.textContent = FABLE_PRO_PROMPT;
if (proGuide) proGuide.textContent = FABLE_PRO_GUIDE;

const reveal = ({ emailSent = true, persisted = false } = {}) => {
  if (form) form.hidden = true;
  if (success) success.hidden = false;
  if (deliveryStatus) {
    deliveryStatus.textContent = persisted
      ? 'Your access has been restored on this device.'
      : emailSent
        ? 'We have also sent a copy and installation guide to your email address.'
        : 'Your prompt is ready below, but the email could not be sent. You can retry the email delivery.';
  }
  if (retryButton) retryButton.hidden = emailSent || persisted;
  if (!persisted) success?.focus({ preventScroll: true });
};

try {
  if (window.localStorage.getItem(ACCESS_KEY) === 'granted') reveal({ persisted: true });
} catch {
  // Access persistence is a convenience; private browsing may disable storage.
}

const submit = async () => {
  if (!form || !emailInput || !submitButton || !formStatus) return;
  formStatus.textContent = '';
  if (!emailInput.checkValidity()) {
    formStatus.textContent = 'Enter a valid email address.';
    emailInput.focus();
    return;
  }

  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  submitButton.textContent = 'Getting your prompt…';

  try {
    const companyInput = form.elements.namedItem('company');
    if (companyInput instanceof HTMLInputElement && companyInput.value.trim()) {
      // Honeypot tripped — behave as if it succeeded, no Kit round-trip needed for bots.
      try { window.localStorage.setItem(ACCESS_KEY, 'granted'); } catch { /* optional */ }
      reveal({ emailSent: true });
      return;
    }

    const endpoint = import.meta.env.VITE_BETTY_KIT_ENDPOINT || DEFAULT_KIT_ENDPOINT;
    const formBody = new FormData();
    formBody.append(KIT_EMAIL_FIELD, emailInput.value);
    const response = await fetch(endpoint, {
      method: 'POST',
      body: formBody,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error('We could not save your signup. Please try again.');
    const result = await response.json().catch(() => ({}));
    if (result.status !== 'success' && result.status !== 'quarantined') {
      throw new Error(result.errors?.join(', ') || 'We could not save your signup. Please try again.');
    }
    try { window.localStorage.setItem(ACCESS_KEY, 'granted'); } catch { /* optional */ }
    // Kit's response carries no "we emailed a copy" flag — the prompt still
    // reveals inline regardless (bundled client-side), so this just skips the
    // "we also emailed you a copy" line. See scope doc for the alternative
    // (a Kit automation + hardcoded emailSent: true).
    reveal({ emailSent: false });
  } catch (error) {
    formStatus.textContent = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  } finally {
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
    submitButton.textContent = 'Get the Betty Pro Prompt';
  }
};

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  submit();
});
retryButton?.addEventListener('click', submit);
copyButton?.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(FABLE_PRO_PROMPT);
    copyButton.textContent = 'Copied';
    if (copyStatus) copyStatus.textContent = 'The Betty Pro Prompt has been copied to your clipboard.';
    trackSiteEvent('fable_pro_prompt_copied');
    window.setTimeout(() => {
      copyButton.textContent = 'Copy the Betty Pro Prompt';
      if (copyStatus) copyStatus.textContent = '';
    }, 2400);
  } catch {
    if (copyStatus) copyStatus.textContent = 'Copy failed. Select the prompt and copy it manually.';
  }
});

downloadButton?.addEventListener('click', () => {
  try {
    const fileContent = `${FABLE_PRO_PROMPT}\n\n⸻\n\n${FABLE_PRO_GUIDE}\n`;
    const downloadUrl = URL.createObjectURL(new Blob([fileContent], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'betty-pro-prompt-and-guide.txt';
    link.hidden = true;
    document.body.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
    if (copyStatus) copyStatus.textContent = 'The Betty Pro Prompt and installation guide have been downloaded.';
    trackSiteEvent('fable_pro_prompt_downloaded');
    window.setTimeout(() => {
      if (copyStatus) copyStatus.textContent = '';
    }, 2400);
  } catch {
    if (copyStatus) copyStatus.textContent = 'Download failed. Select the prompt and copy it manually.';
  }
});
