#!/usr/bin/env node
'use strict';

/* copy-rules.js — the mechanical copy checks every homepage content edit
   runs through, per ~/NightMode/standards/MARKETING-CONVERSION-STANDARD-2026-09-19.md:
   no em dashes, and a Flesch-Kincaid grade-level read on every string (warn
   above grade 7 — this is advisory, not a hard fail, since a few strings
   legitimately carry necessary terms).

   This is imported both from tests/copy-rules.test.js (part of `npm test`,
   so every save made through the hosted editor at /?edit is checked by this
   repo's normal CI before it can deploy — the editor cannot bypass the gate
   because the edit IS a commit, and the commit triggers this test like any
   other change) and from editor/copy-editor.js (the browser bundle), so the
   editor blocks an em dash before the founder even clicks Save. */

const EM_DASH = '—';

/** @param {string} text @returns {boolean} */
export function hasEmDash(text) {
  return text.includes(EM_DASH);
}

/** Very small heuristic syllable counter (no dependency needed for a pilot check). @param {string} word */
export function countSyllables(word) {
  const normalised = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!normalised) return 0;
  const groups = normalised.match(/[aeiouy]+/g) ?? [];
  let count = groups.length;
  if (normalised.endsWith('e') && !normalised.endsWith('le') && count > 1) count -= 1;
  return Math.max(1, count);
}

/**
 * Flesch-Kincaid grade level for a plain-text string.
 * @param {string} text
 * @returns {number}
 */
export function fleschKincaidGrade(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return 0;
  const sentences = (clean.match(/[^.!?]+[.!?]*/g) ?? [clean]).filter((s) => s.trim().length > 0);
  const words = (clean.match(/[A-Za-z']+/g) ?? []).filter(Boolean);
  if (words.length === 0) return 0;
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const sentenceCount = Math.max(1, sentences.length);
  const grade = 0.39 * (words.length / sentenceCount) + 11.8 * (syllables / words.length) - 15.59;
  return Math.round(grade * 100) / 100;
}

/**
 * Walks a JSON-like value and yields every string leaf with its dot-path.
 * @param {unknown} value
 * @param {string} path
 * @returns {Generator<{ path: string, text: string }>}
 */
export function* stringLeaves(value, path = '') {
  if (typeof value === 'string') {
    yield { path, text: value };
    return;
  }
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i += 1) yield* stringLeaves(value[i], path ? `${path}.${i}` : String(i));
    return;
  }
  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) yield* stringLeaves(child, path ? `${path}.${key}` : key);
  }
}

/**
 * @param {Record<string, unknown>} content
 * @returns {{ path: string, text: string, grade: number, hasEmDash: boolean }[]}
 */
export function checkContent(content) {
  return [...stringLeaves(content)].map(({ path, text }) => ({
    path,
    text,
    grade: fleschKincaidGrade(text),
    hasEmDash: hasEmDash(text),
  }));
}

/**
 * Checks a single edited string (what the editor runs on Save, per field).
 * @param {string} path
 * @param {string} text
 * @returns {{ path: string, text: string, grade: number, hasEmDash: boolean, blocked: boolean, message?: string }}
 */
export function checkField(path, text) {
  const hasDash = hasEmDash(text);
  return {
    path,
    text,
    grade: fleschKincaidGrade(text),
    hasEmDash: hasDash,
    blocked: hasDash,
    ...(hasDash ? { message: `Remove the long dash in: ${path}` } : {}),
  };
}
