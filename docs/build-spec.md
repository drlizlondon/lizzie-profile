# Build a Business V1 implementation specification

## Binding decision

Implement the supplied V1 PRD as a native LizProfile page at `/build-a-business.html`. V1 is a deterministic, fully browser-side guided builder. It uses no AI API, backend, database, account, authentication, iframe, React, Supabase, or new framework.

The Lovable export remains a reference for warmth and hierarchy, not an implementation dependency. The supplied PRD supersedes the earlier AI-chat concept.

## Architecture

- `build-a-business-data.js`: 18 questions, answer choices, defaults, conditional fields, and fixed guidance.
- `build-a-business-state.js`: validated state loading, `localStorage` persistence, restart, and answer completeness.
- `build-a-business-prompts.js`: deterministic business summary, Lovable prompt, optional LLM refinement prompt, placeholders, and fixed first-week checklist.
- `build-a-business-ui.js`: screen flow, validation, review/edit, rendering, copy, print, anonymous event hooks, and paid offer.
- `build-a-business.css`: isolated LizProfile-native builder presentation, responsive full-screen mobile treatment, print styles, focus states, and reduced motion.
- `build-a-business.html`: route shell, LizProfile navigation/footer, SEO metadata, and WebApplication JSON-LD.

## Package BAB-01 — Native shell and navigation

Status: implemented; verification required.

- Add `Build a Business` immediately before `Contact`.
- Add the route as a Vite input.
- Reuse LizProfile header, mobile navigation, footer, typography, and tokens.
- Keep the builder inset on desktop and visually full-screen on mobile.

## Package BAB-02 — Deterministic guided builder

Status: implemented; verification required.

- Render all 18 PRD questions one at a time.
- Support text, textarea, single choice, multi-choice, visual cards, limits, defaults, optional answers, conditional fields, and fixed guidance.
- Retain progress in `localStorage` and provide safe restart.
- Never transmit or log answers.

## Package BAB-03 — Review and generated outputs

Status: implemented; verification required.

- Allow every answer to be reviewed and edited.
- Generate the structured business summary, direct Lovable prompt, optional ChatGPT/Claude refinement prompt, and exact seven-item checklist deterministically.
- Provide copy controls, print/save, edit, and restart.
- Show the £150 `Build it with Liz` offer only after all free outputs.
- Keep the booking CTA disabled until `BOOKING_URL` is configured.

## Package BAB-04 — Acceptance and launch readiness

Status: in progress.

Required gates:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- Visual checks at 375 px and 1280 px for welcome, question, review, and results.
- Keyboard, mobile menu, focus, localStorage refresh, copy announcement, print, reduced-motion, and no-horizontal-overflow checks.
- Confirm no answer-bearing network requests and no free-text analytics payloads.

## Remaining configuration

The only optional missing product input is the paid-session booking URL. Its absence does not block the complete free V1 experience; the UI must show `Booking link coming soon` until configured.
