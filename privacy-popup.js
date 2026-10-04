// Shared privacy-notice pop-up. Any [data-privacy-popup] link opens the
// privacy notice in a native <dialog>; if the fetch fails the link navigates.
let dialog;

function build(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const source = doc.querySelector('main') || doc.querySelector('article');
  if (!source) return null;
  const el = document.createElement('dialog');
  el.className = 'privacy-dialog';
  el.setAttribute('aria-label', 'Privacy notice');
  const close = document.createElement('button');
  close.type = 'button';
  close.className = 'privacy-dialog-close';
  close.setAttribute('aria-label', 'Close privacy notice');
  close.textContent = '×';
  close.addEventListener('click', () => el.close());
  const body = document.createElement('div');
  body.className = 'privacy-dialog-body';
  const clone = source.cloneNode(true);
  clone.removeAttribute('id');
  clone.querySelectorAll('script').forEach((s) => s.remove());
  body.append(clone);
  el.append(close, body);
  el.addEventListener('click', (event) => {
    if (event.target === el) el.close();
  });
  return el;
}

document.addEventListener('click', async (event) => {
  const link = event.target instanceof Element && event.target.closest('[data-privacy-popup]');
  if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  try {
    if (!dialog) {
      const response = await fetch(link.getAttribute('href') || '/privacy', { headers: { Accept: 'text/html' } });
      if (!response.ok) throw new Error(`status ${response.status}`);
      dialog = build(await response.text());
      if (!dialog) throw new Error('no content');
      document.body.append(dialog);
      dialog.addEventListener('close', () => link.focus());
    }
    dialog.showModal();
  } catch {
    window.location.href = link.href;
  }
});
