/**
 * @typedef {Object} ResourceAction
 * @property {'copy' | 'download'} type
 * @property {string} label
 * @property {string} [href]
 * @property {string} [download]
 */

/**
 * @typedef {Object} FreeResource
 * @property {string} title
 * @property {string} category
 * @property {string} description
 * @property {string} cta
 * @property {string} href
 * @property {boolean} featured
 * @property {number} order
 * @property {readonly string[]} [facts]
 * @property {readonly ResourceAction[]} [actions]
 */

/** @type {readonly FreeResource[]} */
export const freeResources = Object.freeze([
  Object.freeze({
    title: 'Build a Business',
    category: 'Guided Framework',
    description: 'Turn an early idea into a clear business, a focused first offer and a complete prompt for building your website.',
    cta: 'Start the framework',
    href: '/build-a-business.html',
    featured: true,
    order: 1,
  }),
  Object.freeze({
    title: 'The Betty Prompt',
    category: 'Planning Framework',
    description: 'A practical prompt for better questions, stronger recommendations and a more honest working relationship with AI.',
    cta: 'Copy it now',
    href: '/betty-prompt.html',
    featured: true,
    order: 2,
  }),
  Object.freeze({
    title: 'Watch Videos with AI',
    category: 'AI Skill',
    description: 'Paste a public Instagram, TikTok, YouTube or X video into Codex. Watch AI will watch it, transcribe it and explain what matters.',
    cta: 'Copy setup prompt',
    href: '/watch-ai.html',
    facts: Object.freeze([
      'Free to use. Requires Codex. No separate subscription or per-video charge.',
      'Works best with videos under 20 minutes.',
    ]),
    actions: Object.freeze([
      Object.freeze({ type: 'copy', label: 'Copy setup prompt' }),
      Object.freeze({ type: 'download', label: 'Download skill', href: '/downloads/watch.zip', download: 'watch.zip' }),
    ]),
    featured: true,
    order: 3,
  }),
]);

export const orderedResources = () => [...freeResources].sort((first, second) => first.order - second.order);

export const featuredResources = () => orderedResources()
  .filter((resource) => resource.featured)
  .slice(0, 3);
