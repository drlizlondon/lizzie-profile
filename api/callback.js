/* api/callback.js — step 2 of the hosted editor's GitHub OAuth handshake.

   GitHub redirects here with `code` and the `state` from api/auth.js. This
   exchanges the code for an access token (server-side, using
   GITHUB_OAUTH_CLIENT_SECRET — never sent to the browser) and hands that
   token back to the opener window (the page that opened this popup, i.e.
   drlizlondon.com/?edit) via `postMessage`.

   targetOrigin is always this deployment's own origin — reconstructed from
   the request's own host, never `"*"` — so the token can only ever be
   delivered to a page already running on this site. editor/copy-editor.js
   only accepts the message if `event.origin` matches `window.location.origin`
   too, so the check holds on both sides of the handshake. */

const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

/** @param {{ headers?: Record<string, string> }} request */
function siteOrigin(request) {
  const proto = request.headers?.['x-forwarded-proto']?.split(',')[0]?.trim() || 'https';
  const host = request.headers?.host || 'drlizlondon.com';
  return `${proto}://${host}`;
}

/** @param {string} origin @param {{ ok: boolean, token?: string, message?: string }} payload */
function popupHtml(origin, payload) {
  return `<!doctype html><html><body><script>
(function() {
  var payload = ${JSON.stringify({ type: 'lp-editor-oauth', ...payload })};
  var targetOrigin = ${JSON.stringify(origin)};
  if (window.opener) {
    window.opener.postMessage(payload, targetOrigin);
  }
  window.close();
})();
</script></body></html>`;
}

/** @param {string | undefined} cookieHeader @param {string} name */
function readCookie(cookieHeader, name) {
  if (!cookieHeader) return undefined;
  const match = cookieHeader.split(';').map((part) => part.trim()).find((part) => part.startsWith(`${name}=`));
  return match ? match.slice(name.length + 1) : undefined;
}

/** @param {{ query?: Record<string, string>, headers?: Record<string, string> }} request @param {{ status: (code: number) => { send: (body: string) => unknown }, setHeader: (name: string, value: string) => void }} response */
export default async function handler(request, response) {
  const clientId = process.env.GITHUB_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GITHUB_OAUTH_CLIENT_SECRET;
  const code = request.query?.code;
  const state = request.query?.state;
  const expectedState = readCookie(request.headers?.cookie, 'lp_editor_oauth_state');
  const origin = siteOrigin(request);

  response.setHeader('Content-Type', 'text/html');
  response.setHeader('X-Robots-Tag', 'noindex, nofollow');

  if (!clientId || !clientSecret) {
    return response.status(500).send(popupHtml(origin, { ok: false, message: 'OAuth is not configured for this deployment.' }));
  }
  if (!code) {
    return response.status(400).send(popupHtml(origin, { ok: false, message: 'Missing authorization code.' }));
  }
  if (!expectedState || state !== expectedState) {
    return response.status(400).send(popupHtml(origin, { ok: false, message: 'Could not verify this sign-in request. Please try again.' }));
  }

  const tokenResponse = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });
  const tokenBody = await tokenResponse.json().catch(() => ({}));

  if (!tokenResponse.ok || tokenBody.error || !tokenBody.access_token) {
    const message = tokenBody.error_description || tokenBody.error || 'GitHub did not return an access token.';
    return response.status(400).send(popupHtml(origin, { ok: false, message }));
  }

  return response.status(200).send(popupHtml(origin, { ok: true, token: tokenBody.access_token }));
}
