import test from 'node:test';
import assert from 'node:assert/strict';
import homeContent from '../content/home.json' with { type: 'json' };
import { checkContent, checkField } from '../scripts/copy-rules.js';

// Runs on every commit — including every save made through the hosted
// editor at /?edit, since a save to content/home.json is a git commit like
// any other, and this is part of `npm test`.
test('content/home.json has no em dashes, and reports readability grade', () => {
  const results = checkContent(homeContent);
  assert.ok(results.length > 0, 'content/home.json should contain editable strings');

  const withEmDash = results.filter((r) => r.hasEmDash);
  assert.deepEqual(
    withEmDash.map((r) => r.path),
    [],
    `No em dashes allowed in homepage copy. Found in: ${withEmDash.map((r) => r.path).join(', ')}`,
  );

  const aboveGrade7 = results.filter((r) => r.grade > 7);
  if (aboveGrade7.length > 0) {
    // Advisory only (not a failure) — some strings legitimately carry a
    // real organisation name or necessary service vocabulary.
    console.warn(
      `[copy-rules] ${aboveGrade7.length} string(s) above Flesch-Kincaid grade 7:\n` +
        aboveGrade7.map((r) => `  - ${r.path} (grade ${r.grade}): "${r.text}"`).join('\n'),
    );
  }
});

test('checkField blocks a single edited string that contains an em dash', () => {
  const blocked = checkField('hero.leadBold', 'This has an em dash — right there.');
  assert.equal(blocked.blocked, true);
  assert.equal(blocked.message, 'Remove the long dash in: hero.leadBold');

  const clean = checkField('hero.leadBold', 'This has no long dash at all.');
  assert.equal(clean.blocked, false);
  assert.equal(clean.message, undefined);
});

test('checkField warns (but does not block) on a high readability grade', () => {
  const hard = checkField(
    'hero.leadBody',
    'Notwithstanding heretofore unprecedented multidisciplinary organisational transformation methodologies.',
  );
  assert.equal(hard.blocked, false);
  assert.ok(hard.grade > 7, `expected a high grade, got ${hard.grade}`);
});
