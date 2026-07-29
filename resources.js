import { featuredResources, orderedResources } from './resources-data.js';
import { browserClipboardWriter, copyWatchSetupPrompt } from './watch-ai-content.js';

/**
 * @param {HTMLElement} status
 * @param {HTMLButtonElement} button
 */
const handleWatchCopy = async (status, button) => {
  const label = button.querySelector('[data-action-label]');
  const copied = await copyWatchSetupPrompt(browserClipboardWriter(), window.location.origin);

  if (!copied) {
    status.textContent = 'Copy didn’t work automatically. Open Watch AI to select and copy the setup prompt manually.';
    return;
  }

  if (label) label.textContent = 'Copied';
  status.textContent = 'The setup prompt has been copied. Paste it into Codex.';
  window.setTimeout(() => {
    if (label) label.textContent = 'Copy setup prompt';
    status.textContent = '';
  }, 2400);
};

/**
 * @param {(typeof import('./resources-data.js').freeResources)[number]} resource
 * @param {number} index
 * @param {boolean} animate
 */
const createResourceCard = (resource, index, animate) => {
  const card = document.createElement('article');
  card.className = `resource-card${animate ? ' reveal' : ''}`;

  const number = document.createElement('span');
  number.className = 'resource-number';
  number.textContent = String(index + 1).padStart(2, '0');

  const content = document.createElement('div');
  const category = document.createElement('p');
  category.className = 'eyebrow';
  category.textContent = resource.category;

  const title = document.createElement('h3');
  if (resource.actions) {
    const titleLink = document.createElement('a');
    titleLink.href = resource.href;
    titleLink.textContent = resource.title;
    titleLink.setAttribute('aria-label', `${resource.title}: learn how it works`);
    title.append(titleLink);
  } else {
    title.textContent = resource.title;
  }

  const description = document.createElement('p');
  description.textContent = resource.description;

  content.append(category, title, description);
  resource.facts?.forEach((fact) => {
    const detail = document.createElement('p');
    detail.className = 'resource-card-fact';
    detail.textContent = fact;
    content.append(detail);
  });

  if (!resource.actions) {
    const link = document.createElement('a');
    link.href = resource.href;
    link.append(document.createTextNode(`${resource.cta} `));

    const arrow = document.createElement('span');
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';
    link.append(arrow);
    card.append(number, content, link);
    return card;
  }

  const footer = document.createElement('div');
  footer.className = 'resource-card-footer';
  const actions = document.createElement('div');
  actions.className = 'resource-card-actions';
  const status = document.createElement('p');
  status.className = 'resource-card-status';
  status.setAttribute('role', 'status');
  status.setAttribute('aria-live', 'polite');

  resource.actions.forEach((action) => {
    if (action.type === 'copy') {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'resource-card-primary-action';
      button.setAttribute('data-copy-watch-setup', '');
      const label = document.createElement('span');
      label.setAttribute('data-action-label', '');
      label.textContent = action.label;
      button.append(label);
      button.addEventListener('click', () => { void handleWatchCopy(status, button); });
      actions.append(button);
      return;
    }

    const link = document.createElement('a');
    link.className = 'resource-card-secondary-action';
    link.href = action.href ?? '#';
    if (action.download) link.download = action.download;
    link.textContent = action.label;
    actions.append(link);
  });

  footer.append(actions, status);
  card.append(number, content, footer);
  return card;
};

document.querySelectorAll('[data-resource-view]').forEach((container) => {
  const resources = container.getAttribute('data-resource-view') === 'featured'
    ? featuredResources()
    : orderedResources();
  const animate = container.hasAttribute('data-resource-animate');
  container.replaceChildren(...resources.map((resource, index) => createResourceCard(resource, index, animate)));
});
