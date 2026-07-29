import { buildWatchSetupPrompt, copyWatchSetupPrompt } from './watch-ai-content.js';

const prompt = /** @type {HTMLElement | null} */ (document.querySelector('[data-watch-setup-prompt]'));
const status = document.querySelector('[data-watch-copy-status]');
const copyButton = /** @type {HTMLButtonElement | null} */ (document.querySelector('[data-copy-watch-setup]'));
const origin = window.location.origin;

if (prompt) prompt.textContent = buildWatchSetupPrompt(origin);

/** @returns {(value: string) => Promise<void>} */
const clipboardWriter = () => {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText.bind(navigator.clipboard);
  return async () => { throw new Error('Clipboard access is unavailable.'); };
};

copyButton?.addEventListener('click', async () => {
  const label = copyButton.querySelector('[data-action-label]');
  const copied = await copyWatchSetupPrompt(clipboardWriter(), origin);

  if (!copied) {
    if (status) status.textContent = 'Copy didn’t work automatically. Select the prompt above and copy it manually.';
    prompt?.focus();
    return;
  }

  if (label) label.textContent = 'Copied';
  if (status) status.textContent = 'The setup prompt has been copied. Paste it into Codex.';
  window.setTimeout(() => {
    if (label) label.textContent = 'Copy setup prompt';
    if (status) status.textContent = '';
  }, 2400);
});
