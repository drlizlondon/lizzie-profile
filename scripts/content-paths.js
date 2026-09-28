#!/usr/bin/env node
'use strict';

/* content-paths.js — pure helpers for reading and writing dot-paths (the
   same "a.b.0.c" paths carried by `data-copy` attributes and content/home.json
   keys) against a plain JSON object. Shared by the hosted editor
   (editor/copy-editor.js, applying an edited element's new text back into
   the fetched home.json before the GitHub PUT) and its unit tests
   (tests/content-paths.test.js) — never duplicated between the two. */

/** @param {string} path @returns {(string|number)[]} */
export function parsePath(path) {
  return path.split('.').map((segment) => (/^\d+$/.test(segment) ? Number(segment) : segment));
}

/**
 * Reads the value at `path` in `data`, or `undefined` if any segment is missing.
 * @param {unknown} data
 * @param {string} path
 */
export function getPath(data, path) {
  let current = data;
  for (const segment of parsePath(path)) {
    if (current == null) return undefined;
    current = /** @type {Record<string | number, unknown>} */ (current)[segment];
  }
  return current;
}

/**
 * Returns a deep-cloned copy of `data` with `value` written at `path`.
 * Creates intermediate objects/arrays as needed, matching the segment type
 * (a numeric segment creates/extends an array). Never mutates `data`.
 * @template T
 * @param {T} data
 * @param {string} path
 * @param {unknown} value
 * @returns {T}
 */
export function setPath(data, path, value) {
  const segments = parsePath(path);
  const root = /** @type {Record<string | number, any>} */ (structuredClone(data ?? {}));
  let node = root;
  for (let i = 0; i < segments.length - 1; i += 1) {
    const segment = segments[i];
    const nextSegment = segments[i + 1];
    if (node[segment] == null || typeof node[segment] !== 'object') {
      node[segment] = typeof nextSegment === 'number' ? [] : {};
    }
    node = node[segment];
  }
  node[segments[segments.length - 1]] = value;
  return /** @type {T} */ (root);
}

/**
 * Applies a set of { path, value } changes on top of `data`, returning a new
 * object. Later entries for the same path win.
 * @template T
 * @param {T} data
 * @param {{ path: string, value: string }[]} changes
 * @returns {T}
 */
export function applyChanges(data, changes) {
  return changes.reduce((acc, { path, value }) => setPath(acc, path, value), data);
}
