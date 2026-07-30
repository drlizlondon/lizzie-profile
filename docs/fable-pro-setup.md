# Betty Pro production setup

Betty Pro is split into two deployable parts:

- The portfolio in the repository root is the public Vite site. It can remain on Vercel and later move to a custom domain.
- `fable-subscriber-service/` is the OpenAI Sites backend, Cloudflare D1 data store and restricted owner dashboard. It owns signup, email delivery, aggregate usage events, unsubscribe and subscriber export.

The frontend must call the deployed Sites service. The old root Vercel functions and Supabase migration have been removed so there is only one source of truth.

## Current production links

- Portfolio: `https://drlizlondon.com`
- Betty Prompt: `https://drlizlondon.com/betty-prompt`
- Sites service: `https://fable-subscriber-service.chris-ohiri.chatgpt.site`
- Private owner dashboard: `https://fable-subscriber-service.chris-ohiri.chatgpt.site/admin`
- Active-subscriber CSV: `https://fable-subscriber-service.chris-ohiri.chatgpt.site/api/admin/export`

The portfolio's Vercel `VITE_FABLE_SERVICE_URL` is set to the Sites service
origin for both Production and Preview. The dashboard and CSV routes still
require ChatGPT sign-in and an email present in `ADMIN_EMAIL`.

## 1. Publish and connect the Sites service

1. Build, commit and publish `fable-subscriber-service/` through its Sites project.
2. Copy the final public HTTPS service origin from the successful Sites deployment. Do not infer it from a preview or source-repository URL.
3. Set `VITE_FABLE_SERVICE_URL` on the Vercel project to that origin, without a trailing slash.
4. Rebuild and redeploy the Vite site. `VITE_` variables are embedded at build time, so changing the setting without a new frontend build will not reconnect the site.
5. Verify the deployed portfolio can call:
   - `POST <service-origin>/api/fable-pro/signup`
   - `POST <service-origin>/api/fable-pro/unsubscribe`
   - `POST <service-origin>/api/events`

The owner dashboard will be available at `<service-origin>/admin` after deployment. It requires ChatGPT sign-in and then checks the signed-in email against `ADMIN_EMAIL`; knowing the URL alone does not grant access.

`/betty-prompt.html` is the canonical public page. The former `/fable-prompt.html` route is retained only as a compatibility redirect for existing bookmarks and delivery emails.

The dashboard shows subscriber email addresses and status, delivery state, consent and unsubscribe timestamps, approximate unique browsers, prompt views, copies and downloads, and blocked signup attempts. No usernames are collected. “People” in the usage metrics means approximate unique browsers, not verified individuals.

## 2. Sites, D1 and owner access

The Sites project provisions the D1 binding used by the service. Keep its project identifier and D1 resource binding in `fable-subscriber-service/.openai/hosting.json`; do not put service credentials or short-lived source-repository credentials in source control.

Set `ADMIN_EMAIL` to the exact email address the owner uses to sign in to ChatGPT. Test both an authorised sign-in and a different signed-in address. The CSV link at `/api/admin/export` exports active subscribers only, which provides a portable list for later use with another email platform. Unsubscribed consent records remain in D1 and are not included in that marketing export.

The subscriber service is separately versioned and deployed from the local `fable-subscriber-service/` directory, which is intentionally excluded from the public portfolio repository. A Sites source remote is a deployment mechanism, not a substitute for an owner-controlled GitHub backup. Mirror the service to its own GitHub repository if independent source backup or future deployment portability is required. D1 subscriber data should also be exported on an agreed backup schedule.

## 3. Resend delivery

1. Verify the chosen sending domain in Resend.
2. Create a sending-only API key and set `RESEND_API_KEY` as a Sites secret. Never expose it through a `VITE_` or `NEXT_PUBLIC_` variable.
3. Set `EMAIL_FROM` to a sender Resend shows as authorised. The intended long-term identity is `Betty by Lizzie Soyode <hello@lizziesoyode.com>`, but that address must not be used until its domain and sender are verified.
4. Set `SITE_URL` to the canonical public portfolio origin, without a trailing slash. Email links return there, not to the backend dashboard.
5. Send real deliveries to Gmail and Outlook, check the HTML and plain-text versions, use the return link, click unsubscribe, and confirm the D1 subscriber status changes.

If storage succeeds but Resend fails, the frontend still reveals Betty Pro and offers an email retry. If storage fails, it does not claim success or reveal newly granted access.

## 4. Origins and a future custom domain

`ALLOWED_ORIGINS` is the backend CORS allowlist. Use comma-separated exact HTTPS origins; do not use `*` for the credential and subscriber endpoints.

When a custom domain is ready:

1. Attach the domain to the frontend host and verify HTTPS and DNS.
2. Add the new exact origin to `ALLOWED_ORIGINS`. Keep the current Vercel origin during the transition if both URLs should work.
3. Change `SITE_URL` to the canonical custom-domain origin so new email links return to it.
4. Re-publish the Sites configuration and smoke-test signup, event recording, email return and unsubscribe from the custom domain.
5. Set `VITE_FABLE_SERVICE_URL` on the frontend host to the Sites service origin and rebuild if that value changed.

Changing the public portfolio domain does not replace the Sites project or D1 database, so existing subscriber records and the owner dashboard remain available. Browser-level unique counts may treat the custom domain as a new browser because local storage is isolated by origin.

## 5. Security and consent behaviour

- Email addresses are normalised and validated on the server.
- The signup body is capped, event and page names are allowlisted, origins are checked, and a hidden honeypot absorbs basic bot submissions.
- D1-backed limits apply to both each normalised email address and total IP attempts, so rotating email addresses does not bypass the second limit. Current limits are five attempts per email address and ten total attempts per IP in ten minutes.
- Anonymous usage events have a separate limit of 120 events per IP in ten minutes.
- Rate-limit fingerprints and browser identifiers are hashed; the application does not store raw IP addresses, user-agent strings or email addresses in analytics rows.
- Responses do not disclose whether an email was already subscribed.
- Requesting the prompt again with an unsubscribed address may send the transactional prompt email, but it does not restore marketing consent. Future update exports and sends must include only `status = 'subscribed'` rows.
- Error logs redact email addresses. Monitor Sites, D1 and Resend for abuse before considering a higher-friction control such as CAPTCHA.

## 6. Required legal input

`privacy.html` still records a real setup blocker: the main site contact is a placeholder, and no verified privacy contact email, postal address, final retention schedule or fuller data-controller details have been provided. Supply and review those details and the deletion-request process before treating the notice as production-ready or marketing Betty updates. Do not remove the visible blocker until that work is complete.

## Environment variables and bindings

| Name | Location | Sensitivity | Purpose |
| --- | --- | --- | --- |
| `VITE_FABLE_SERVICE_URL` | Vercel/frontend build | Public | Deployed Sites service origin |
| `RESEND_API_KEY` | Sites secret | Secret | Resend email delivery |
| `EMAIL_FROM` | Sites environment | Non-secret | Verified sender identity |
| `SITE_URL` | Sites environment | Non-secret | Canonical public portfolio origin used in email links |
| `ALLOWED_ORIGINS` | Sites environment | Non-secret | Comma-separated exact frontend origins allowed by CORS |
| `ADMIN_EMAIL` | Sites environment | Personal configuration | Email allowed into the owner dashboard and CSV export |
| D1 binding | Sites project resource | Managed binding | Subscriber, consent, rate-limit and aggregate usage storage |
