/** Deterministic Build a Website outputs. No network, no AI: answers in, text out. */

const PLACEHOLDER_ANSWER = /^(I['’]m not sure|I have not decided|Not decided|No topics|Skip this|Help me|I only have|I need a working name)/i;

/** @param {any} value @param {string} placeholder */
export const missing = (value, placeholder) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : `[${placeholder}]`;
  if (!value || PLACEHOLDER_ANSWER.test(value)) return `[${placeholder}]`;
  return String(value).trim();
};

/** @param {any} value */
const summaryValue = (value) => {
  if (Array.isArray(value)) return value.length ? value.join(', ') : 'To be confirmed.';
  if (!value || PLACEHOLDER_ANSWER.test(value)) return 'To be confirmed.';
  return String(value).trim();
};

/** Topic names from the free-text categories answer, or an empty list. @param {Record<string, any>} answers @returns {string[]} */
export const topicList = (answers) => {
  const raw = typeof answers.categories === 'string' ? answers.categories : '';
  if (!raw || PLACEHOLDER_ANSWER.test(raw)) return [];
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
};

const PAGE_ORDER = ['Home', 'About', 'Articles', 'Topics', 'Newsletter signup', 'Search', 'Resources', 'Work with me', 'Shop', 'Contact'];

/** Chosen pages in a stable, sensible order. @param {Record<string, any>} answers @returns {string[]} */
const chosenPages = (answers) => {
  const chosen = Array.isArray(answers.websiteSections) ? answers.websiteSections : [];
  return PAGE_ORDER.filter((page) => chosen.includes(page));
};

/** One row per BaB visualStyle option. Concrete tokens, never a mood word on its own. */
/** @type {Record<string, { fonts: string, headings: string, body: string, palette: string, radius: string, buttons: string, cards: string, motion: string, tone: string }>} */
export const designTokens = {
  'Cool and modern': {
    fonts: 'Space Grotesk (headings) and Inter (body), both from Google Fonts',
    headings: 'weight 600, tight tracking (-0.01em), type scale ratio 1.25, h1 clamp(2.25rem, 5vw, 3.5rem)',
    body: '17px with 1.6 line-height, maximum line length 68 characters',
    palette: 'cool near-white background (#F7F8FA), deep ink text (#0F172A), one confident blue-teal accent used for buttons, links and focus rings, and a hairline grey (#E2E8F0) for dividers',
    radius: '8px',
    buttons: 'solid accent fill, white text, 8px radius, no shadow, 44px minimum height, slightly darker on hover',
    cards: '1px hairline border, no shadow, 24px padding, content aligned to a tight 12-column grid',
    motion: 'subtle: 150ms opacity and colour transitions only, no parallax or large movement',
    tone: 'clear, direct and efficient, with short sentences',
  },
  'Calm and clear': {
    fonts: 'Source Serif 4 (headings) and Nunito Sans (body), both from Google Fonts',
    headings: 'weight 500, type scale ratio 1.2, h1 clamp(2rem, 4.5vw, 3rem)',
    body: '18px with 1.7 line-height, maximum line length 66 characters',
    palette: 'warm white background (#FBFAF7), soft charcoal text (#2B2F33), muted sage (#7C9A8E) and mist blue (#A9C1D1) as supporting tints, with a deeper sage (#3F6B5C) for buttons and links so contrast stays at 4.5:1 or better',
    radius: '12px',
    buttons: 'deep sage fill, white text, 12px radius, no shadow, 46px minimum height',
    cards: 'no border, a very light tinted background (#F1F4F1), 28px padding, generous gaps of 32px between cards',
    motion: 'gentle: 200ms fades only, nothing that slides or bounces',
    tone: 'unhurried, reassuring and plain-spoken',
  },
  'Pretty and elegant': {
    fonts: 'Cormorant Garamond (headings) and Jost (body), both from Google Fonts',
    headings: 'weight 500, type scale ratio 1.333, h1 clamp(2.5rem, 6vw, 4rem), small caps for section labels with 0.08em letter-spacing',
    body: '17px with 1.7 line-height, maximum line length 64 characters',
    palette: 'cream background (#FFFBF7), deep plum text (#3A2538), blush (#E9CFCB) and antique rose (#B8707D) accents, with a thin gold-tone line (#C9A66B) for dividers only',
    radius: '4px',
    buttons: 'thin 1px outline in plum that fills plum with cream text on hover, uppercase 13px label with 0.1em letter-spacing, 46px minimum height',
    cards: '1px blush border, 32px padding, a decorative hairline above each card title',
    motion: 'slow and soft: 300ms fades, no movement',
    tone: 'refined, warm and carefully written',
  },
  'Warm and friendly': {
    fonts: 'Fraunces (headings) and Nunito (body), both from Google Fonts',
    headings: 'weight 600, soft optical size, type scale ratio 1.25, h1 clamp(2.25rem, 5vw, 3.5rem)',
    body: '18px with 1.65 line-height, maximum line length 66 characters',
    palette: 'warm cream background (#FFF8F0), deep brown text (#3B2A20), terracotta (#C8643C) as the main accent, honey (#E8B04A) as a secondary highlight, and a pale peach (#FBE5D3) for tinted sections; check that terracotta on cream stays at 4.5:1 or better for text and use a darker shade (#A94E2B) if it does not',
    radius: '16px',
    buttons: 'terracotta fill, white text, 999px pill radius, 48px minimum height, lifts 2px on hover',
    cards: 'peach-tinted or white background, 16px radius, soft shadow (0 4px 16px rgba(59,42,32,0.08)), 24px padding',
    motion: 'friendly but small: 200ms hover lifts of 2px and fades, nothing that loops',
    tone: 'welcoming, human and encouraging, as if talking to a friend',
  },
  'Bold and confident': {
    fonts: 'Archivo (headings, weight 800) and Inter (body), both from Google Fonts',
    headings: 'weight 800, tight tracking (-0.02em), type scale ratio 1.5, h1 clamp(2.75rem, 8vw, 5rem), uppercase optional for section labels only',
    body: '17px with 1.55 line-height, maximum line length 68 characters',
    palette: 'high contrast: white background, near-black text (#0A0A0A), and one saturated accent (#FF3D2E) used sparingly for buttons and key highlights; a pure black section may be used for emphasis',
    radius: '2px',
    buttons: 'solid black or accent fill, 2px border, uppercase 14px label with 0.04em letter-spacing, 50px minimum height',
    cards: '2px solid black border, hard offset shadow (6px 6px 0 #0A0A0A), 24px padding',
    motion: 'snappy: 120ms transitions, shadows shift on hover, no slow fades',
    tone: 'confident, direct and unapologetic, with short punchy lines',
  },
  'Fun and playful': {
    fonts: 'Fredoka (headings) and Nunito (body), both from Google Fonts',
    headings: 'weight 600, type scale ratio 1.333, h1 clamp(2.5rem, 6vw, 4rem)',
    body: '18px with 1.65 line-height, maximum line length 64 characters',
    palette: 'white background, ink text (#1F2340), and three bright accents used in rotation: coral (#FF6B57), sunshine (#FFC93C) and sky (#3DB8F5), with a pale tint of each for card backgrounds; keep text on tinted backgrounds at 4.5:1 or better',
    radius: '20px',
    buttons: 'coral fill, dark ink text or white text (whichever passes 4.5:1), 999px pill radius, 48px minimum height, small bounce on hover',
    cards: 'tinted backgrounds in rotating accent tints, 20px radius, no border, 24px padding',
    motion: 'lively: 250ms springy hover bounces; replace all of it with plain fades when the visitor prefers reduced motion',
    tone: 'light-hearted, informal and a little cheeky, but never hard to read',
  },
  'Premium and minimal': {
    fonts: 'DM Serif Display (headings) and DM Sans (body), both from Google Fonts',
    headings: 'weight 400, type scale ratio 1.333, h1 clamp(2.5rem, 6vw, 4.25rem), generous space above and below every heading',
    body: '17px with 1.7 line-height, maximum line length 62 characters',
    palette: 'off-white background (#FAFAF8), charcoal text (#1C1C1C), warm grey (#8A8680) for secondary text, and one muted bronze accent (#9C7A4E) used only for links and thin rules',
    radius: '0px',
    buttons: 'square 1px charcoal outline with charcoal text, filling charcoal on hover, 48px minimum height, sentence-case label',
    cards: 'no border and no background; cards are separated by whitespace (48px) and a single hairline rule',
    motion: 'very restrained: 400ms opacity transitions only',
    tone: 'quiet, precise and understated, with no exclamation marks',
  },
  'Professional and trustworthy': {
    fonts: 'Merriweather (headings) and Source Sans 3 (body), both from Google Fonts',
    headings: 'weight 700, type scale ratio 1.25, h1 clamp(2rem, 4.5vw, 3rem)',
    body: '17px with 1.6 line-height, maximum line length 70 characters',
    palette: 'white background, navy text and headings (#14274E), slate (#5B6B82) for secondary text, light grey-blue (#EEF2F7) for section backgrounds, and a single teal accent (#0F766E) for buttons and links',
    radius: '6px',
    buttons: 'solid navy fill, white text, 6px radius, 46px minimum height, darker navy on hover',
    cards: 'white background, 1px border (#D8E0EA), a very light shadow (0 1px 3px rgba(20,39,78,0.08)), 24px padding',
    motion: 'minimal: 150ms colour transitions only',
    tone: 'credible, measured and helpful, with plain facts and no hype',
  },
};

/** Used when the style answer is unusable. */
const fallbackStyle = 'Calm and clear';

/** @param {Record<string, any>} answers */
const tokensFor = (answers) => designTokens[answers.visualStyle] ?? designTokens[fallbackStyle];

/** @param {Record<string, any>} answers */
const styleLabel = (answers) => (answers.visualStyle in designTokens ? answers.visualStyle : `${fallbackStyle} (default, because no style was chosen)`);

/** @param {Record<string, any>} answers @param {ReturnType<typeof tokensFor>} tokens */
const paletteInstruction = (answers, tokens) => {
  switch (answers.colours) {
    case 'I have brand colours':
      return answers.brandColours
        ? `Use the owner's brand colours as the palette: ${answers.brandColours}. These override the style's default palette. Derive any supporting tints and a text colour from them, and check every text and button colour for 4.5:1 contrast.`
        : `The owner has brand colours but has not supplied them yet. Use the style's default palette (${tokens.palette}) and keep every colour in one editable theme file, so the brand colours can be dropped in later. [brand colours to be added]`;
    case 'Neutral colours':
      return `Keep the palette neutral: ${tokens.palette}. Reduce the accent to a single, restrained tone and let whites, greys and the text colour carry the page.`;
    case 'Soft colours':
      return `Use soft, low-saturation colours: ${tokens.palette}. Where an accent is bold, soften it and use it only for buttons and links.`;
    case 'Bright colours':
      return `Use brighter, more saturated colours: ${tokens.palette}. Raise the saturation of the accent colours, but keep text contrast at 4.5:1 or better.`;
    case 'Dark and sophisticated':
      return `Use a dark theme as the default: a near-black background (#111214), off-white text (#F2F0EB), and the accent from this palette lifted for contrast: ${tokens.palette}. All text must still meet 4.5:1 contrast on the dark background.`;
    default:
      return `Choose colours to suit the style: ${tokens.palette}.`;
  }
};

/** @param {Record<string, any>} answers */
const imageTreatment = (answers) => {
  const images = Array.isArray(answers.images) ? answers.images : [];
  const lines = [];
  if (images.includes('Photos of me')) lines.push('Use real photographs of the owner, cropped consistently (for example 4:5 portrait on the About page). Use labelled placeholder images until the owner uploads their own.');
  if (images.includes('Photos of my work')) lines.push('Use photographs of the owner’s work as the main imagery, in a consistent aspect ratio (for example 3:2). Use labelled placeholder images until real ones are uploaded.');
  if (images.includes('Product photography')) lines.push('Use clean product photography on simple backgrounds, in a consistent square or 4:5 crop.');
  if (images.includes('Lifestyle images')) lines.push('Use natural lifestyle photography, with space around the subject so text can sit alongside it.');
  if (images.includes('Illustrations')) lines.push('Use illustration in the same style throughout, drawn from the palette.');
  if (images.includes('Simple icons')) lines.push('Use a single consistent line-icon set at one stroke width.');
  if (images.includes('Minimal or no images')) lines.push('Keep images to a minimum and let typography and spacing do the work; do not add decorative stock imagery.');
  if (!lines.length) lines.push('Use restrained, relevant image placeholders, clearly labelled so the owner can replace them.');
  return lines.join(' ');
};

/** @param {Record<string, any>} answers */
const wantsTopics = (answers) => topicList(answers).length > 0;

/** @param {string[]} items */
const bullets = (items) => items.map((item) => `- ${item}`).join('\n');

/** @param {Record<string, any>} answers @param {string} cta @returns {Record<string, { purpose: string, sections: string, cta: string, layout: string, interactions: string }>} */
const pageSpecs = (answers, cta) => {
  const owner = missing(answers.ownerName, 'owner name to be added');
  const topic = missing(answers.topic, 'blog topic to be confirmed');
  const audience = missing(answers.audience, 'one clear type of reader');
  return {
    Home: {
      purpose: `Tell a first-time visitor in one glance what the site is about (${topic}) and who it is for (${audience}), and move them towards the main action.`,
      sections: 'a hero with a one-line promise and the main call to action; the three most recent published articles as cards; a short "about the author" teaser linking to About (if that page exists); a closing call to action',
      cta,
      layout: 'single column on mobile; on desktop the hero is split or centred with the article cards in a three-column grid',
      interactions: 'article cards link to the article page; the hero call to action is the most prominent control on the page',
    },
    About: {
      purpose: `Introduce ${owner} and why they write about ${topic}, so readers trust the blog.`,
      sections: 'a short introduction with a portrait or image; the author’s story; what readers will find here; a call to action',
      cta,
      layout: 'two columns on desktop (image beside text), stacked on mobile',
      interactions: 'none beyond the call to action. Use only the facts the owner supplied; mark the rest as placeholders',
    },
    Articles: {
      purpose: 'List every published article, newest first, so readers can find something to read.',
      sections: wantsTopics(answers)
        ? 'a page heading; a topic filter row; a grid of article cards (featured image, title, excerpt, date, topic)'
        : 'a page heading; a grid of article cards (featured image, title, excerpt, date)',
      cta: 'Read the article (each card links to its article page)',
      layout: 'single column list on mobile; two or three column card grid on desktop; pagination or "load more" after 12 articles',
      interactions: 'cards link to /articles/<slug>; show a friendly empty state ("The first article is on its way.") while nothing is published',
    },
    Topics: {
      purpose: `Let readers browse by topic: ${topicList(answers).join(', ') || '[topics to be added]'}.`,
      sections: 'a list of topics, each with a short description and the number of published articles',
      cta: 'Browse a topic',
      layout: 'a simple grid of topic cards',
      interactions: 'each topic links to the articles filtered by that topic',
    },
    'Newsletter signup': {
      purpose: 'Let readers ask to hear about new articles by email.',
      sections: 'a short promise of what subscribers will get and how often; an email field and a Subscribe button; a one-line privacy note',
      cta: 'Subscribe',
      layout: 'a single centred column',
      interactions: 'validate the email format; show a clear success and error state. Do not store subscriber emails in the articles tables. Send the form to a newsletter provider endpoint, using the placeholder [newsletter provider form URL to be added] until the owner chooses one',
    },
    Search: {
      purpose: 'Help readers find an article by keyword.',
      sections: 'a search field and a results list',
      cta: 'Read the article',
      layout: 'a single column with the field at the top',
      interactions: 'search published articles only (title, excerpt and body); show a friendly "nothing found" message',
    },
    Resources: {
      purpose: 'Collect a small set of useful links or downloads for readers.',
      sections: 'a short intro; a list of resources each with a title and one-line description',
      cta: 'Open the resource',
      layout: 'a simple list or card grid',
      interactions: 'links open in the same tab for internal pages and a new tab for external ones. Use clearly labelled placeholder resources until the owner adds real ones',
    },
    'Work with me': {
      purpose: `Explain how readers can work with ${owner} and how to start.`,
      sections: 'what the owner offers; who it is for; how to get in touch; a call to action',
      cta: 'Get in touch',
      layout: 'single column with a prominent call to action',
      interactions: 'the call to action goes to the Contact page or a placeholder link. Do not invent services, prices or testimonials; use clearly labelled placeholders',
    },
    Shop: {
      purpose: 'Show anything the owner sells and send readers to buy it.',
      sections: 'a short intro; a grid of items each with an image, name, short description and price',
      cta: 'Buy now',
      layout: 'card grid, two columns on mobile and three or four on desktop',
      interactions: 'each item links out to an external checkout using the placeholder [checkout link to be added]. Do not build a cart or take payments inside this site. Use clearly labelled placeholder items',
    },
    Contact: {
      purpose: 'Give readers an easy way to reach the owner.',
      sections: 'a short welcome; a simple message form (name, email, message); an alternative contact line',
      cta: 'Send message',
      layout: 'single column; the form is narrow and centred',
      interactions: 'validate the fields and show success and error states. Send the form to the placeholder [contact destination to be added]. Do not display the administrator email address publicly',
    },
  };
};

/** @param {Record<string, any>} answers */
const pageBlocks = (answers) => {
  const pages = chosenPages(answers);
  const cta = missing(answers.primaryAction, 'main call to action to be confirmed');
  const specs = pageSpecs(answers, cta);
  const blocks = pages.map((page) => {
    const spec = specs[page];
    return `${page}
- Purpose: ${spec.purpose}
- Key sections: ${spec.sections}
- Content: use the owner’s answers above; where information is missing, use clearly labelled placeholders
- Call to action: ${spec.cta}
- Layout: ${spec.layout}
- Important interactions: ${spec.interactions}`;
  });
  blocks.push(`Individual article page (/articles/<slug>)
- Purpose: present one published article for comfortable reading.
- Key sections: featured image; title; author name and published date${wantsTopics(answers) ? '; topic' : ''}; the article body; a closing call to action (${cta}); links to the previous and next article
- Content: loaded from the articles table by slug
- Call to action: ${cta}
- Layout: a single reading column about 680px wide, centred, with the design system's body and heading styles
- Important interactions: share-friendly URL; images in the body are responsive; unknown slugs, drafts and unpublished articles show a proper 404 page`);
  return blocks.join('\n\n');
};

/** @param {Record<string, any>} answers */
const routeNote = (answers) => {
  const pages = chosenPages(answers);
  const notes = [];
  if (!pages.includes('Home')) notes.push('The owner did not choose a Home page, so make the Articles list the root route "/".');
  if (!pages.includes('Articles')) notes.push('The owner did not choose an Articles page, so show the latest published articles on the Home page, with a "More articles" link to /articles that works.');
  return notes.length ? `\n${notes.join(' ')}` : '';
};

/**
 * Builds the complete Lovable prompt for a blog.
 * @param {Record<string, any>} answers
 */
export const buildWebsitePrompt = (answers) => {
  const tokens = tokensFor(answers);
  const topics = topicList(answers);
  const email = missing(answers.adminEmail, 'admin email to be added');
  const owner = missing(answers.ownerName, 'owner name to be added');
  const pages = chosenPages(answers);
  const cta = missing(answers.primaryAction, 'main call to action to be confirmed');
  const traits = missing(answers.traits, 'Clear, friendly and trustworthy');
  const articleColumns = [
    'id (uuid, primary key, default gen_random_uuid())',
    'title (text, required)',
    'slug (text, unique, required)',
    'excerpt (text)',
    'body (text; rich text stored as sanitised HTML, produced by the editor described below)',
    'featured_image_url (text)',
    `author_name (text, default '${owner.startsWith('[') ? 'Author' : owner.replace(/'/g, "''")}')`,
    ...(topics.length ? [`category (text, one of: ${topics.join(', ')}; the admin picks it from a dropdown, and the dropdown values are stored in code in one constant so they can be edited)`] : []),
    "status (enum: draft | published, default draft)",
    'published_at (timestamptz, set when first published)',
    'seo_title (text, optional)',
    'seo_description (text, optional)',
    'created_at (timestamptz, default now())',
    'updated_at (timestamptz, default now(), updated on every save)',
  ];

  return `Role

You are the lead product designer, front-end architect and full-stack engineer for a small publishing website.

Objective

Build a complete, working blog website that its owner can publish to themselves and later change through Lovable. It must function, not merely look good: real pages, a real database, a private admin area, and real publishing. Build the full working first version now. Do not return only a plan or explanation, and do not ask unnecessary follow-up questions.

Principle: You create the website. The owner owns it. They can publish to it. They can change it with AI if they want to.

PROJECT OVERVIEW

Website name: ${missing(answers.siteName, 'Use a clear temporary working title that is easy to replace later')}
Owner / author name: ${owner}
Website purpose: ${missing(answers.topic, 'Blog topic to be confirmed')}
Target audience: ${missing(answers.audience, 'Define one clear type of reader')}
Types of post: ${missing(answers.contentTypes, 'Articles')}
${topics.length ? `Topics: ${topics.join(', ')}\n` : ''}Publishing rhythm: ${missing(answers.cadence, 'Publishing rhythm to be confirmed')}
Writers: ${missing(answers.authors, 'Writers to be confirmed')}
Primary goal: get each reader to take one action.
Primary call to action: ${cta}
Brand personality: ${traits}
Content tone: ${tokens.tone}
Personal story to mention: ${missing(answers.story, 'No additional personal story supplied')}
Admin email address: ${email}

DESIGN DIRECTION

Visual direction: ${styleLabel(answers)}. Apply the specific choices below rather than a general mood.
- Typography: ${tokens.fonts}.
- Heading style: ${tokens.headings}.
- Body text style: ${tokens.body}.
- Colour palette: ${paletteInstruction(answers, tokens)}
- Buttons: ${tokens.buttons}.
- Cards: ${tokens.cards}.
- Borders and corners: base radius ${tokens.radius}; use the same radius token everywhere.
- Spacing: use an 8px spacing scale (8, 16, 24, 32, 48, 64, 96); sections are separated by 64px on mobile and 96px on desktop.
- Layout principles: one clear column of attention per section; a maximum content width of 1120px; the article reading column about 680px.
- Image treatment: ${imageTreatment(answers)}
- Navigation: a simple header with the site name on the left and ${pages.length ? `the chosen pages (${pages.join(', ')})` : 'the main pages'} as links, collapsing to an accessible menu button on mobile. Highlight the current page.
- Footer: the site name, the same page links, a copyright line with the owner’s name, and nothing that was not asked for.
- Mobile behaviour: design mobile-first at 375px; touch targets at least 44px; no horizontal scrolling at any width.
- Desktop behaviour: widen the grid and use the extra space for whitespace and larger images, not extra clutter.
- Motion: ${tokens.motion}. Respect prefers-reduced-motion by removing all non-essential motion.
- Accessibility: semantic HTML, visible focus states, labelled form controls, alt text on every image, a skip-to-content link, and text contrast of at least 4.5:1.
Define all of the above as design tokens (CSS variables and the Tailwind theme) in one place, and build everything from reusable components.

PUBLIC WEBSITE

Build only the pages below. Do not add pages that the owner did not ask for just to make the site look more complete.${routeNote(answers)}

${pageBlocks(answers)}

CONTENT MANAGEMENT

Separate content and data from presentation and design. Content must never be hard-coded into page components. Store articles in a proper database, not in the frontend code. Pages read content from the database through a small data layer, so the design can be changed later without touching or losing a single article.

PRIVATE ADMIN AREA

Use Lovable Cloud for the database, authentication and file storage.

Create a private administrator area at /admin. Keep it deliberately simple for a non-technical person. Do not show technical settings, database terminology, code, or deployment settings.
- Dashboard: the heading "Your Site", the line "Welcome back.", and a "+ New article" button. Below that show three lists: Drafts, Published and Recently edited.
- Articles: view all articles; create; edit; save as draft; preview; publish; unpublish; and delete with a confirmation step ("Delete this article? This cannot be undone.").
- Images: upload images, choose an uploaded image as an article's featured image, and insert images into the article body.
Make the admin responsive and usable on a phone.

ADMIN AUTHENTICATION

Initial admin email: ${email}
- Sign in at /admin with an email magic link (passwordless): the owner enters their email, receives a link, and is signed in.
- The /admin routes redirect unauthenticated visitors to the sign-in screen, and visitors who are signed in but not listed in the admins table see a polite "This area is private" message.
- Seed the admins table with exactly one row, the initial admin email above. No other person is an administrator.
- Never put a password or any credential in the code, the repository or the page.
- The public must not be able to reach the admin area, and only administrators can create, edit, publish or delete content.

WRITING EXPERIENCE

The editor should feel like writing an article, not managing a database. Use these, in this order on the screen:
- a large title field
- a featured image upload
- a clean writing area with simple formatting controls only (bold, italic, headings, bulleted and numbered lists, quote, link, image)
- Preview, Save draft and Publish / Unpublish buttons
- a small collapsed "Search appearance" section for the SEO title and description, optional and pre-filled automatically
Do not overwhelm the writer with extra controls.

PUBLIC ARTICLE SYSTEM

Published articles appear on the public website automatically. The Articles page uses the design above, shows each article's metadata and featured image, and links to the individual article page. Drafts and unpublished articles must never appear publicly; a draft's public URL returns a 404.

SEO

Render the article list and article pages on the server so that the served HTML already contains each article's title, meta description, canonical URL, Open Graph tags and Article JSON-LD, generated from the article when the SEO fields are empty. Use server-side rendering or an equivalent server-generated HTML response (for example a Lovable Cloud edge function); client-side-only rendering does not satisfy this.
- Unique page titles, clean slugs and canonical URLs.
- Generate /sitemap.xml from published articles only.
- Add robots.txt that allows crawling and points to the sitemap.
- Drafts are never in the sitemap and return 404 publicly.
- The administrator never needs to understand SEO: titles and descriptions are generated from the article unless the admin edits them.

LOVABLE EDITABILITY

Build the site with a clear separation between presentation, application logic and content/data.
- Do not hard-code articles, uploaded images or other user-managed content into frontend components.
- Existing content must stay intact when the site's design, layouts or components are changed later.
- The owner will return to Lovable to change the design, layout, pages or functionality, and the architecture must support that without anyone recreating articles by hand.
- Admin = managing content. Lovable = changing the website. Both must work together.

DESIGN CHANGES AFTER LAUNCH

Use reusable components and one coherent design system, and avoid one-off hard-coded styling. The owner should be able to ask Lovable for changes like these without rebuilding the content system:
- Make the article pages more editorial.
- Change the homepage to have a larger hero image.
- Add a newsletter signup underneath every article.

DATABASE AND STORAGE

Use Lovable Cloud for the database, authentication and file storage. Create these tables and no others.
- articles:
${bullets(articleColumns).replace(/^/gm, '  ')}
- media: id (uuid, primary key), file_path (text), alt_text (text), created_at (timestamptz, default now())
- admins: email (text, primary key), seeded with exactly one row: ${email}

Row-level security (enable it on every table):
- Anyone, signed in or not, can SELECT from articles where status = 'published'.
- Only signed-in users whose email is in admins can SELECT unpublished articles, and can INSERT, UPDATE and DELETE articles and media.
- The admins table is readable only by signed-in users checking their own row, and writable by no one through the app.
Storage: create a public bucket for images, so published pages can show them, writable only by admins.

SCOPE

Build the smallest useful system for this site: an article publishing system, not a WordPress clone. Do not add plugins, themes, comments, user roles beyond the single admin list, or settings screens. If the owner needs more later, they will ask Lovable.

Honesty and placeholders

Use the supplied information to write clear, editable copy. Do not invent facts, testimonials, customer numbers, qualifications, awards, prices or contact details, and do not publish fake articles as if they were real. Where information is missing, use clearly labelled placeholders in square brackets, and never present a placeholder as real information.

COMPLETION

Build the full working first version now: the public website, the private admin area, sign-in, the database with its security rules, image storage and the SEO output described above. Then tell the owner, in two or three plain sentences, how to sign in to /admin and publish their first article.`;
};

/** @param {Record<string, any>} answers @returns {Array<[string, string]>} */
export const buildSiteSummaryLines = (answers) => {
  const topics = topicList(answers);
  /** @type {Array<[string, string]>} */
  const lines = [
    ['Website', summaryValue(answers.siteName)],
    ['Owner', summaryValue(answers.ownerName)],
    ['Purpose', summaryValue(answers.topic)],
    ['Audience', summaryValue(answers.audience)],
    ['Main action', summaryValue(answers.primaryAction)],
    ['Website pages', summaryValue(chosenPages(answers))],
    ['Content', summaryValue(answers.contentTypes)],
  ];
  if (topics.length) lines.push(['Topics', topics.join(', ')]);
  lines.push(['Publishing', summaryValue(answers.cadence)], ['Admin', 'Yes'], ['Admin email', summaryValue(answers.adminEmail)]);
  return lines;
};

/** The "Your website will include" list, without the tick glyph. @param {Record<string, any>} answers */
export const websiteIncludes = (answers) => {
  const items = ['Bespoke design', 'Mobile-friendly website', 'Article publishing', 'Image uploads', 'Drafts', 'Preview', 'Publishing', 'Private admin area', 'SEO foundations', 'Lovable-editable design'];
  if (wantsTopics(answers)) items.push('Topics');
  if (chosenPages(answers).includes('Newsletter signup')) items.push('Newsletter signup');
  return items;
};

export const firstPublishChecklist = [
  'Paste your prompt into Lovable.',
  'When Lovable asks, turn on Lovable Cloud.',
  'Sign in to /admin with your email.',
  'Write and publish your first post.',
  'Test the site on your phone.',
  'Connect a domain you own.',
  "Send your first post to one person who'd enjoy it.",
];
