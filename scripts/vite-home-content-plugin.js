#!/usr/bin/env node
'use strict';

/* vite-home-content-plugin.js — reads content/home.json and injects it into
   index.html at build time (and in `npm run dev`), via Vite's
   transformIndexHtml hook.

   Why this exists: content/home.json is the single source of truth for the
   homepage's editable marketing copy (hero, who-I-help cards, the equity
   cards, the projects-section intro, the resources intro, and the contact
   heading/paragraph/helper). index.html carries `[[home:dot.path]]` tokens
   in place of that copy; this plugin resolves each token against
   content/home.json and substitutes the real text, HTML-escaping `&`, `<`
   and `>` since every token sits in text content (never inside an
   attribute).

   Every token is the sole content of the element that wraps it (`<h3>[[home:
   whoIHelp.cards.0.title]]</h3>`, never mixed with other text), so this also
   stamps that wrapping element with `data-copy="dot.path"` — the hook the
   hosted editor (editor/copy-editor.js, loaded only on `?edit`) uses to find
   every editable node and make it contentEditable. Visitors never load the
   editor module and the attribute has no visible effect, so this ships on
   every page load with no behaviour change for a normal visitor.

   The hosted editor (see api/auth.js, api/callback.js, editor/copy-editor.js)
   edits content/home.json directly — a save there is a git commit, so every
   edit goes through the repo's normal CI (lint/typecheck/build/test,
   including the copy-rule check in tests/copy-rules.test.js) before it ships.

   With no token present, the hook is a no-op — every other page (resources,
   privacy, projects/*, etc.) passes through untouched. */

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const TOKEN_TAG_PATTERN = /<([a-zA-Z][a-zA-Z0-9-]*)((?:\s+[^<>]*)?)>\[\[home:([a-zA-Z0-9_.]+)]]<\/\1>/g;
const TOKEN_PATTERN = /\[\[home:([a-zA-Z0-9_.]+)]]/g;

/** @param {string} value */
function escapeHtml(value) {
  return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * @param {Record<string, unknown>} data
 * @param {string} path
 */
export function resolvePath(data, path) {
  const segments = path.split('.');
  /** @type {unknown} */
  let current = data;
  for (const segment of segments) {
    if (current == null) return undefined;
    const key = /^\d+$/.test(segment) ? Number(segment) : segment;
    current = /** @type {Record<string, unknown>} */ (current)[/** @type {never} */ (key)];
  }
  return current;
}

/**
 * Renders `[[home:dot.path]]` tokens against `content`, stamping the
 * wrapping element of each token with `data-copy="dot.path"`.
 * @param {string} html
 * @param {Record<string, unknown>} content
 */
export function renderHomeContent(html, content) {
  const missing = [];
  const rendered = html.replace(TOKEN_TAG_PATTERN, (match, tag, attrs, path) => {
    const value = resolvePath(content, path);
    if (typeof value !== 'string') {
      missing.push(path);
      return match;
    }
    const hasDataCopy = /\sdata-copy=/.test(attrs);
    const newAttrs = hasDataCopy ? attrs : `${attrs} data-copy="${path}"`;
    return `<${tag}${newAttrs}>${escapeHtml(value)}</${tag}>`;
  });
  if (missing.length > 0) {
    throw new Error(`content/home.json is missing a string value for: ${missing.join(', ')}`);
  }
  return rendered;
}

/** @param {string} contentPath */
export function renderHomeHtml(html, contentPath) {
  const raw = readFileSync(contentPath, 'utf8');
  const content = JSON.parse(raw);
  return renderHomeContent(html, content);
}

/** Vite plugin: substitutes `[[home:dot.path]]` tokens in index.html using content/home.json. */
export function homeContentPlugin() {
  const here = dirname(fileURLToPath(import.meta.url));
  const contentPath = join(here, '..', 'content', 'home.json');

  return {
    name: 'lizprofile-home-content',
    transformIndexHtml(html, ctx) {
      const filename = ctx?.filename ?? '';
      if (!filename.endsWith('index.html') || filename.includes('/projects/')) return html;
      if (!TOKEN_PATTERN.test(html)) return html;
      TOKEN_PATTERN.lastIndex = 0;
      return renderHomeHtml(html, contentPath);
    },
  };
}
