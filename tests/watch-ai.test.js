import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { featuredResources } from '../resources-data.js';
import { buildWatchSetupPrompt, copyWatchSetupPrompt } from '../watch-ai-content.js';

const page = await readFile(new URL('../watch-ai.html', import.meta.url), 'utf8');
const pageScript = await readFile(new URL('../watch-ai.js', import.meta.url), 'utf8');
const resourceScript = await readFile(new URL('../resources.js', import.meta.url), 'utf8');
const skill = await readFile(new URL('../public/downloads/watch/SKILL.md', import.meta.url), 'utf8');
const metadata = await readFile(new URL('../public/downloads/watch/agents/openai.yaml', import.meta.url), 'utf8');
const preflightPath = new URL('../public/downloads/watch/scripts/watch_preflight.py', import.meta.url);
const preflightScript = await readFile(preflightPath, 'utf8');
const viteConfig = await readFile(new URL('../vite.config.js', import.meta.url), 'utf8');

test('Watch AI is the third featured resource with copy first and download second', () => {
  const watch = featuredResources()[2];
  assert.equal(watch.title, 'Watch Videos with AI');
  assert.equal(watch.description, 'Paste a public Instagram, TikTok, YouTube or X video into Codex. Watch AI will watch it, transcribe it and explain what matters.');
  assert.deepEqual(watch.facts, [
    'Free to use. Requires Codex. No separate subscription or per-video charge.',
    'Works best with videos under 20 minutes.',
  ]);
  assert.equal(watch.href, '/watch-ai.html');
  assert.deepEqual(watch.actions, [
    { type: 'copy', label: 'Copy setup prompt' },
    { type: 'download', label: 'Download skill', href: '/downloads/watch.zip', download: 'watch.zip' },
  ]);
});

test('the dedicated page is complete, accessible and keeps copy as the primary action', () => {
  assert.equal((page.match(/<h1/g) ?? []).length, 1);
  assert.match(page, /<h1 id="watch-title">Watch Videos with AI<\/h1>/);
  assert.match(page, /Paste a public Instagram, TikTok, YouTube or X video into Codex\./);
  assert.match(page, /Free to use\. Requires Codex\. No separate subscription or per-video charge\./);
  assert.match(page, /Works best with videos under 20 minutes\./);
  assert.match(page, /<a class="skip-link" href="#main">/);
  assert.match(page, /data-watch-copy-status/);
  assert.match(page, /role="status" aria-live="polite"/);

  const copyPosition = page.indexOf('data-copy-watch-setup');
  const downloadPosition = page.indexOf('data-watch-download');
  assert.ok(copyPosition >= 0 && copyPosition < downloadPosition);

  [
    'Copy the setup prompt.',
    'Paste it into Codex.',
    'Approve any requested installation.',
    'Wait until Codex confirms “$watch is ready”.',
    'Paste a public video link using the command below.',
  ].reduce((previous, step) => {
    const position = page.indexOf(step);
    assert.ok(position > previous, `${step} should appear in order`);
    return position;
  }, -1);

  assert.match(page, /\$watch &lt;video URL&gt;/);
  ['Instagram', 'TikTok', 'YouTube', 'X'].forEach((site) => assert.match(page, new RegExp(`<li>${site}<\\/li>`)));
  ['Is it free?', 'Does it install anything?', 'What video lengths are supported?', 'Does my video leave my computer?']
    .forEach((question) => assert.match(page, new RegExp(`<summary>${question.replace(/[?]/g, '\\?')}<\\/summary>`)));
});

test('the visible consumer experience contains no developer-tool language', () => {
  const watch = featuredResources()[2];
  const publicCopy = [page, watch.title, watch.description, ...(watch.facts ?? []), buildWatchSetupPrompt('https://watch.example')].join('\n');
  assert.doesNotMatch(publicCopy, /\bAPIs?\b|\bterminals?\b|Whisper|FFmpeg|yt-dlp/i);
  assert.doesNotMatch(publicCopy, /\$watch-videos-with-ai/);
});

test('the setup prompt is visible, portable and copies exactly', async () => {
  const expected = buildWatchSetupPrompt('https://watch.example/custom/path');
  assert.match(expected, /https:\/\/watch\.example\/downloads\/watch\.zip/);
  assert.match(expected, /ask for my approval/i);
  assert.match(expected, /"\$watch is ready"/);
  assert.match(expected, /\$watch <video URL>/);
  assert.match(pageScript, /buildWatchSetupPrompt\(origin\)/);
  assert.match(resourceScript, /copyWatchSetupPrompt/);

  let copied = '';
  assert.equal(await copyWatchSetupPrompt(async (value) => { copied = value; }, 'https://watch.example'), true);
  assert.equal(copied, buildWatchSetupPrompt('https://watch.example'));
  assert.equal(await copyWatchSetupPrompt(async () => { throw new Error('blocked'); }, 'https://watch.example'), false);
});

test('the public package exposes only $watch and includes safe setup checks', () => {
  assert.match(skill, /^name: watch$/m);
  assert.match(metadata, /default_prompt: "Use \$watch/);
  assert.doesNotMatch(`${skill}\n${metadata}`, /\$watch-videos-with-ai|\/Users\/|Claude Inbox|inbox\.txt/i);
  assert.match(skill, /python3 scripts\/watch_setup\.py/);
  assert.match(skill, /python3 scripts\/watch_smoke_test\.py/);
  assert.match(skill, /yt-dlp -f[\s\S]*--no-playlist/);
  assert.match(skill, /yt-dlp --no-playlist --skip-download --write-subs/);
  assert.match(preflightScript, /"yt-dlp", "--no-playlist"/);
});

test('long-video confirmations are friendly, exact and happen before the full download', () => {
  const preflight = skill.indexOf('## Check length before downloading');
  const processing = skill.indexOf('## Process each approved video');
  assert.ok(preflight >= 0 && preflight < processing);
  assert.match(skill, /Heads up, this is a longer video, so it'll take a little longer to watch\./);
  assert.match(skill, /Carry on\?/);
  assert.match(skill, /`Watch it`/);
  assert.match(skill, /That's quite a commitment\. 😄/);
  assert.match(skill, /Yes, watch everything/);
  assert.match(skill, /Analyse part of it instead/);
  assert.match(skill, /These are confirmations, not errors\./);
  assert.ok(skill.indexOf('Evaluate `very_long` before `long`') < skill.indexOf('### More than 20 minutes'));
});

test('partial analysis is clearly labelled as a future feature', () => {
  assert.match(skill, /Partial-video analysis is coming soon\./);
  assert.match(skill, /\$watch <url> first 20 minutes/);
  assert.match(skill, /\$watch <url> from 18:00 to 32:00/);
  assert.match(skill, /never silently analyse the whole video/i);
});

test('duration boundaries classify 20 and 60 minutes correctly', () => {
  /** @param {number} duration */
  const classify = (duration) => JSON.parse(execFileSync('python3', [preflightPath.pathname, '--duration', String(duration)], { encoding: 'utf8' })).state;
  assert.equal(classify(1200), 'normal');
  assert.equal(classify(1200.1), 'long');
  assert.equal(classify(3600), 'long');
  assert.equal(classify(3600.1), 'very_long');
});

test('the Vite build includes the Watch AI page and its downloadable skill', async () => {
  assert.match(viteConfig, /watchAi: resolve\(import\.meta\.dirname, 'watch-ai\.html'\)/);
  assert.ok((await stat(new URL('../public/downloads/watch.zip', import.meta.url))).size > 0);
});

test('the ZIP exactly matches the public watch source package', async () => {
  const zipPath = new URL('../public/downloads/watch.zip', import.meta.url).pathname;
  const archived = execFileSync('unzip', ['-Z1', zipPath], { encoding: 'utf8' }).trim().split('\n');
  assert.ok(archived.every((entry) => entry.startsWith('watch/')));
  assert.ok(archived.every((entry) => !entry.includes('__MACOSX') && !entry.endsWith('.DS_Store')));

  /** @type {Array<{ archivePath: string, source: URL }>} */
  const sourceFiles = [];
  /** @param {URL} directory @param {string} [prefix] */
  const walk = async (directory, prefix = 'watch') => {
    const entries = await readdir(directory, { withFileTypes: true });
    for (const entry of entries) {
      const path = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
      if (entry.isDirectory()) await walk(path, `${prefix}/${entry.name}`);
      else sourceFiles.push({ archivePath: `${prefix}/${entry.name}`, source: path });
    }
  };
  await walk(new URL('../public/downloads/watch/', import.meta.url));

  for (const file of sourceFiles) {
    assert.ok(archived.includes(file.archivePath), `${file.archivePath} should be archived`);
    const expected = await readFile(file.source);
    const actual = execFileSync('unzip', ['-p', zipPath, file.archivePath]);
    assert.deepEqual(actual, expected, `${file.archivePath} should match its source`);
  }
});
