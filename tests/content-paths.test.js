import test from 'node:test';
import assert from 'node:assert/strict';
import { getPath, setPath, applyChanges } from '../scripts/content-paths.js';

test('getPath reads a nested object path', () => {
  const data = { hero: { leadBold: 'Hello' } };
  assert.equal(getPath(data, 'hero.leadBold'), 'Hello');
});

test('getPath reads a nested array path', () => {
  const data = { whoIHelp: { cards: [{ title: 'Ambitious people' }, { title: 'Organisations' }] } };
  assert.equal(getPath(data, 'whoIHelp.cards.1.title'), 'Organisations');
});

test('getPath returns undefined for a missing path without throwing', () => {
  const data = { hero: { leadBold: 'Hello' } };
  assert.equal(getPath(data, 'hero.missing.deeper'), undefined);
});

test('setPath writes a nested object path without mutating the input', () => {
  const data = { hero: { leadBold: 'Hello' } };
  const updated = setPath(data, 'hero.leadBold', 'Goodbye');
  assert.equal(updated.hero.leadBold, 'Goodbye');
  assert.equal(data.hero.leadBold, 'Hello', 'original object must not be mutated');
});

test('setPath writes a nested array path without mutating the input', () => {
  const data = { whoIHelp: { cards: [{ title: 'Ambitious people' }, { title: 'Organisations' }] } };
  const updated = setPath(data, 'whoIHelp.cards.0.title', 'Ambitious founders');
  assert.equal(updated.whoIHelp.cards[0].title, 'Ambitious founders');
  assert.equal(updated.whoIHelp.cards[1].title, 'Organisations');
  assert.equal(data.whoIHelp.cards[0].title, 'Ambitious people', 'original array must not be mutated');
});

test('applyChanges applies several nested and array-path changes in one pass', () => {
  const data = {
    hero: { leadBold: 'Old bold', leadBody: 'Old body' },
    projects: { bumpnotes: { problem: 'Old problem' } },
  };
  const updated = applyChanges(data, [
    { path: 'hero.leadBold', value: 'New bold' },
    { path: 'projects.bumpnotes.problem', value: 'New problem' },
  ]);
  assert.equal(updated.hero.leadBold, 'New bold');
  assert.equal(updated.hero.leadBody, 'Old body');
  assert.equal(updated.projects.bumpnotes.problem, 'New problem');
});

test('applyChanges lets a later change to the same path win', () => {
  const data = { hero: { leadBold: 'Old' } };
  const updated = applyChanges(data, [
    { path: 'hero.leadBold', value: 'First' },
    { path: 'hero.leadBold', value: 'Second' },
  ]);
  assert.equal(updated.hero.leadBold, 'Second');
});
