/* api/auth.js — step 1 of the hosted editor's GitHub OAuth handshake.

   The editor panel (editor/copy-editor.js, loaded only at /?edit) opens this
   in a popup when the founder clicks "Sign in with GitHub". It redirects the
   browser to GitHub's OAuth authorize screen; GitHub then redirects back to
   /api/callback with a short-lived `code`. Reads GITHUB_OAUTH_CLIENT_ID from
   env — never committed. A `state` value round-trips through GitHub
   unchanged and is checked again in api/callback.js as a basic CSRF guard.

   Scope is `repo` only — the repo is private and the editor's one job is
   reading and writing content/home.json via the Contents API. */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';

function randomState() {
  return Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join('');
}

/** @param {{ headers?: Record<string, string> }} request @param {{ status: (code: number) => { send: (body: string) => unknown, json: (body: object) => unknown }, setHeader: (name: string, value: string) => void, redirect: (url: string) => unknown }} response */
export default async function handler(request, response) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  if (!clientId) {
    return response.status(500).json({ message: 'GITHUB_OAUTH_CLIENT_ID is not configured for this deployment.' });
  }

  const state = randomState();
  response.setHeader('Set-Cookie', `lp_editor_oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);

  const authorizeUrl = new URL(GITHUB_AUTHORIZE_URL);
  authorizeUrl.searchParams.set('client_id', clientId);
  authorizeUrl.searchParams.set('scope', 'repo');
  authorizeUrl.searchParams.set('state', state);

  return response.redirect(authorizeUrl.toString());
}
