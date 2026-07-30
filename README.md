# Lizzie Profile

Source for Dr Lizzie Soyode's portfolio, free resources, and Betty Prompt experience.

Production: https://drlizlondon.com

The contact form is delivered by the Vercel function at `/api/contact`. Production requires `RESEND_API_KEY`; `CONTACT_TO_EMAIL` and `CONTACT_FROM_EMAIL` can override the domain defaults.

## Local development

```bash
npm ci
npm run dev
```

The Betty subscriber API is hosted separately. Set `VITE_FABLE_SERVICE_URL` in a local `.env` file when testing signup, analytics, or unsubscribe requests. Never commit service credentials or provider API keys.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The separately versioned subscriber service has its own lint, test, and build chain. Frontend integration and production setup are documented in `docs/fable-pro-setup.md`.
