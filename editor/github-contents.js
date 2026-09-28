/* editor/github-contents.js — talks to the GitHub Contents API for
   content/home.json. Pure functions (no DOM), so tests can call them with a
   mocked `fetch` and never touch the real GitHub API — per the hard rule
   that no real GitHub token or live API call is ever used in tests.

   Save flow (spec item 4): GET the file (content + sha) → apply only the
   changed paths → PUT with that sha and a commit message naming the changed
   paths. On a 409 (sha changed under us), re-GET once, re-apply the same
   changes on top of the fresh content, and PUT once more. */

import { applyChanges } from '../scripts/content-paths.js';

const REPO = 'drlizlondon/lizzie-profile';
const FILE_PATH = 'content/home.json';
const BRANCH = 'main';
const API_ROOT = 'https://api.github.com';

/** @param {string} text */
export function encodeUtf8Base64(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

/** @param {string} base64 */
export function decodeUtf8Base64(base64) {
  const binary = atob(base64.replace(/\n/g, ''));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

/** @param {string} token */
function authHeaders(token) {
  return {
    Authorization: `token ${token}`,
    Accept: 'application/vnd.github+json',
  };
}

/**
 * Fetches content/home.json from the repo's default branch (or wherever
 * `ref` points), returning the parsed content and its blob sha.
 * @param {string} token
 * @param {typeof fetch} fetchImpl
 */
export async function getHomeContent(token, fetchImpl = fetch) {
  const url = `${API_ROOT}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const response = await fetchImpl(url, { headers: authHeaders(token) });
  if (!response.ok) {
    const error = new Error(`GitHub GET failed with ${response.status}`);
    /** @type {any} */ (error).status = response.status;
    throw error;
  }
  const body = await response.json();
  const content = JSON.parse(decodeUtf8Base64(body.content));
  return { content, sha: body.sha };
}

/**
 * PUTs an updated content/home.json.
 * @param {string} token
 * @param {{ content: unknown, sha: string, message: string }} params
 * @param {typeof fetch} fetchImpl
 */
export async function putHomeContent(token, { content, sha, message }, fetchImpl = fetch) {
  const url = `${API_ROOT}/repos/${REPO}/contents/${FILE_PATH}`;
  const body = {
    message,
    content: encodeUtf8Base64(`${JSON.stringify(content, null, 2)}\n`),
    sha,
    branch: BRANCH,
  };
  const response = await fetchImpl(url, {
    method: 'PUT',
    headers: { ...authHeaders(token), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { response, body };
}

/** @param {{ path: string, value: string }[]} changes */
export function commitMessageFor(changes) {
  const paths = [...new Set(changes.map((change) => change.path))];
  return `Copy edit (site editor): ${paths.join(', ')}`;
}

/**
 * Saves a set of { path, value } changes to content/home.json, retrying once
 * on a 409 (someone else's commit changed the sha under us).
 * @param {string} token
 * @param {{ path: string, value: string }[]} changes
 * @param {typeof fetch} fetchImpl
 */
export async function saveChanges(token, changes, fetchImpl = fetch) {
  const message = commitMessageFor(changes);
  const first = await getHomeContent(token, fetchImpl);
  const firstAttempt = await putHomeContent(
    token,
    { content: applyChanges(first.content, changes), sha: first.sha, message },
    fetchImpl,
  );

  if (firstAttempt.response.status !== 409) return firstAttempt;

  const second = await getHomeContent(token, fetchImpl);
  return putHomeContent(
    token,
    { content: applyChanges(second.content, changes), sha: second.sha, message },
    fetchImpl,
  );
}
