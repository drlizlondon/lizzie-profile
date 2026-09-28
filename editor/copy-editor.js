/* editor/copy-editor.js — the hosted, always-on copy editor.

   Loaded ONLY via a dynamic import that runs when the URL has `?edit` (see
   the small inline bootstrap at the end of index.html) — never statically
   imported by main.js, so a normal visitor's page never fetches this file.

   Sign-in: a popup to /api/auth -> GitHub -> /api/callback, which
   postMessages a token back to this window. This window only accepts that
   message when `event.origin === window.location.origin` (the callback
   itself also only ever targets that same origin — see api/callback.js —
   so the check holds on both ends). The token lives in sessionStorage only,
   so it is gone as soon as the tab closes.

   Editing: every element the vite plugin stamped with `data-copy="dot.path"`
   becomes `contentEditable="plaintext-only"` with a dashed outline. Paste is
   forced to plain text. Save runs the same em-dash/readability checks as CI
   (scripts/copy-rules.js) before ever calling GitHub. */

import { getHomeContent, saveChanges } from './github-contents.js';
import { checkField } from '../scripts/copy-rules.js';

const TOKEN_KEY = 'lp-editor-github-token';
const PANEL_ID = 'lp-editor-panel';

/** @param {string} html */
function el(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return /** @type {HTMLElement} */ (template.content.firstElementChild);
}

function injectStyles() {
  if (document.getElementById('lp-editor-styles')) return;
  const style = document.createElement('style');
  style.id = 'lp-editor-styles';
  style.textContent = `
    [data-copy][contenteditable="plaintext-only"]{outline:2px dashed #d97757;outline-offset:2px;border-radius:2px;cursor:text}
    [data-copy][contenteditable="plaintext-only"]:focus{outline-color:#8a3ffc}
    #${PANEL_ID}{position:fixed;bottom:16px;right:16px;z-index:2147483000;background:#1c1917;color:#fafaf9;font:14px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;border-radius:10px;box-shadow:0 8px 24px rgba(0,0,0,.35);padding:14px 16px;max-width:320px}
    #${PANEL_ID} p{margin:0 0 8px}
    #${PANEL_ID} .lp-editor-row{display:flex;gap:8px;flex-wrap:wrap}
    #${PANEL_ID} button{font:inherit;border:1px solid #57534e;background:#292524;color:#fafaf9;padding:6px 10px;border-radius:6px;cursor:pointer}
    #${PANEL_ID} button.lp-primary{background:#d97757;border-color:#d97757;color:#1c1917;font-weight:600}
    #${PANEL_ID} button:disabled{opacity:.5;cursor:not-allowed}
    #${PANEL_ID} .lp-editor-error{color:#fca5a5;margin-top:8px}
    #${PANEL_ID} .lp-editor-success{color:#86efac;margin-top:8px}
    #${PANEL_ID} a{color:#fdba74}
  `;
  document.head.appendChild(style);
}

function ensureNoindex() {
  if (document.querySelector('meta[name="robots"]')) return;
  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}

function getToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/** @param {string | null} token */
function setToken(token) {
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    // sessionStorage unavailable (private mode etc.) — sign-in simply won't persist.
  }
}

function removePanel() {
  document.getElementById(PANEL_ID)?.remove();
}

function renderSignedOutPanel() {
  removePanel();
  const panel = el(`
    <div id="${PANEL_ID}">
      <p>Edit this page</p>
      <div class="lp-editor-row">
        <button type="button" class="lp-primary" data-editor-sign-in>Sign in with GitHub</button>
      </div>
      <p class="lp-editor-error" data-editor-message hidden></p>
    </div>
  `);
  document.body.appendChild(panel);

  const message = /** @type {HTMLElement} */ (panel.querySelector('[data-editor-message]'));
  panel.querySelector('[data-editor-sign-in]')?.addEventListener('click', () => {
    const popup = window.open('/api/auth', 'lp-editor-oauth', 'width=560,height=680');
    if (!popup) {
      message.hidden = false;
      message.textContent = 'Could not open the sign-in popup. Please allow popups for this site.';
      return;
    }

    function onMessage(event) {
      if (event.origin !== window.location.origin) return;
      if (!event.data || event.data.type !== 'lp-editor-oauth') return;
      window.removeEventListener('message', onMessage);
      if (event.data.ok) {
        setToken(event.data.token);
        renderSignedInPanel();
      } else {
        message.hidden = false;
        message.textContent = event.data.message || 'Sign-in failed. Please try again.';
      }
    }
    window.addEventListener('message', onMessage);
  });
}

/** Forces paste to be plain text only. @param {ClipboardEvent} event */
function onPastePlainText(event) {
  event.preventDefault();
  const text = event.clipboardData?.getData('text/plain') ?? '';
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;
  const range = selection.getRangeAt(0);
  range.deleteContents();
  range.insertNode(document.createTextNode(text));
  range.collapse(false);
}

function renderSignedInPanel() {
  removePanel();
  const editableNodes = /** @type {HTMLElement[]} */ ([...document.querySelectorAll('[data-copy]')]);
  const originals = new Map(editableNodes.map((node) => [node, node.textContent ?? '']));

  editableNodes.forEach((node) => {
    node.setAttribute('contenteditable', 'plaintext-only');
    node.addEventListener('paste', onPastePlainText);
  });

  const panel = el(`
    <div id="${PANEL_ID}">
      <p><span data-editor-count>0 changes</span></p>
      <div class="lp-editor-row">
        <button type="button" class="lp-primary" data-editor-save>Save &amp; publish</button>
        <button type="button" data-editor-discard>Discard</button>
        <button type="button" data-editor-sign-out>Sign out</button>
      </div>
      <p class="lp-editor-error" data-editor-error hidden></p>
      <p class="lp-editor-success" data-editor-success hidden></p>
    </div>
  `);
  document.body.appendChild(panel);

  const countEl = /** @type {HTMLElement} */ (panel.querySelector('[data-editor-count]'));
  const errorEl = /** @type {HTMLElement} */ (panel.querySelector('[data-editor-error]'));
  const successEl = /** @type {HTMLElement} */ (panel.querySelector('[data-editor-success]'));
  const saveButton = /** @type {HTMLButtonElement} */ (panel.querySelector('[data-editor-save]'));

  function changedEntries() {
    return editableNodes
      .map((node) => ({ node, path: node.getAttribute('data-copy') ?? '', value: node.textContent ?? '' }))
      .filter(({ node, value }) => value !== originals.get(node));
  }

  /** Updates only the "N changes" count — never touches the error/success messages. */
  function updateCount() {
    const count = changedEntries().length;
    countEl.textContent = `${count} change${count === 1 ? '' : 's'}`;
  }

  /** Updates the count AND clears any prior error/success message (user is actively editing again). */
  function refreshCount() {
    updateCount();
    errorEl.hidden = true;
    successEl.hidden = true;
  }

  editableNodes.forEach((node) => node.addEventListener('input', refreshCount));
  updateCount();

  panel.querySelector('[data-editor-discard]')?.addEventListener('click', () => {
    editableNodes.forEach((node) => { node.textContent = originals.get(node) ?? ''; });
    refreshCount();
  });

  panel.querySelector('[data-editor-sign-out]')?.addEventListener('click', () => {
    setToken(null);
    editableNodes.forEach((node) => node.removeAttribute('contenteditable'));
    renderSignedOutPanel();
  });

  panel.querySelector('[data-editor-save]')?.addEventListener('click', async () => {
    errorEl.hidden = true;
    successEl.hidden = true;
    const changes = changedEntries().map(({ path, value }) => ({ path, value }));
    if (changes.length === 0) return;

    for (const change of changes) {
      const check = checkField(change.path, change.value);
      if (check.blocked) {
        errorEl.hidden = false;
        errorEl.textContent = check.message;
        return;
      }
    }

    const token = getToken();
    if (!token) {
      renderSignedOutPanel();
      return;
    }

    saveButton.disabled = true;
    try {
      const result = await saveChanges(token, changes);
      if (result.response.status === 403) {
        errorEl.hidden = false;
        errorEl.textContent = "This GitHub account can't edit this site.";
        return;
      }
      if (!result.response.ok) {
        errorEl.hidden = false;
        errorEl.textContent = result.response.status === 409
          ? 'Someone else changed this page; reload.'
          : `Save failed (${result.response.status}). Please try again.`;
        return;
      }
      changedEntries().forEach(({ node, value }) => originals.set(node, value));
      const commitUrl = result.body?.commit?.html_url;
      successEl.hidden = false;
      successEl.innerHTML = commitUrl
        ? `Saved. Live in about 2 minutes. <a href="${commitUrl}" target="_blank" rel="noopener noreferrer">View commit</a>`
        : 'Saved. Live in about 2 minutes.';
      updateCount();
    } catch {
      errorEl.hidden = false;
      errorEl.textContent = 'Save failed. Please check your connection and try again.';
    } finally {
      saveButton.disabled = false;
    }
  });
}

function init() {
  injectStyles();
  ensureNoindex();
  if (getToken()) {
    renderSignedInPanel();
  } else {
    renderSignedOutPanel();
  }
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Exported for tests only — the module still self-initialises above for the
// real browser (loaded only when the URL has `?edit`, never for a normal
// visitor).
export { init, getHomeContent };
