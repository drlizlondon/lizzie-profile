# Lizzie Profile

Source for Dr Lizzie Soyode's portfolio, free resources, and Betty Prompt experience.

Production: https://drlizlondon.com

The contact form is delivered by the Vercel function at `/api/contact`. Production requires `RESEND_API_KEY`; `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` can override the domain defaults.

## Local development

```bash
npm ci
npm run dev
```

Betty signup posts to Kit and unsubscribe is handled by the link in each Kit email, so no separate subscriber API is needed. Never commit service credentials or provider API keys.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The separately versioned subscriber service has its own lint, test, and build chain. Frontend integration and production setup are documented in `docs/fable-pro-setup.md`.
