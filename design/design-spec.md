# Build a Business design specification

## Scope and acceptance reference

Source: `/Users/lizzie/Documents/your-business-blueprint` at commit `4139bb6`.

Target: this LizProfile site. The product behavior and content are the faithful reference; the surrounding visual language must be adapted to LizProfile. This is an explicitly requested adaptation, so the source screenshots are not pixel-for-pixel acceptance targets for color or typography. They are acceptance references for hierarchy, density, responsive behavior, and product states.

Captured references:

- `design/reference/build-a-business-source-landing-mobile-375.png`
- `design/reference/build-a-business-source-landing-desktop-1280.png`
- `design/reference/build-a-business-source-chat-mobile-375.png`
- `design/reference/build-a-business-source-chat-desktop-1280.png`

The source has one route and no dark mode. Its landing and conversational warmth are visual references only. The binding V1 PRD replaces AI chat and AI-generated plan states with a deterministic 18-question builder, review, and generated prompt results.

## Tokens

### Source tokens

- Background: warm off-white, `oklch(0.985 0.008 85)`.
- Paper: `oklch(0.978 0.012 80)`.
- Ink: `oklch(0.24 0.02 55)` with softer secondary ink at `oklch(0.48 0.02 60)`.
- Primary: warm earth, `oklch(0.42 0.08 40)`.
- Accent: soft peach, `oklch(0.88 0.06 60)`.
- Border: `oklch(0.90 0.015 75)`.
- Serif: Fraunces; sans: Inter.
- Base radius: `0.875rem`; used as 10, 12, 14, 18, 22, and 26 px derived radii.
- Main content widths: 36 rem chat/generating, 42 rem chat, and 48 rem landing/plan.
- Responsive changes: 640 px and 768 px Tailwind breakpoints.
- Motion: standard opacity transitions, bouncing generating dots with 150 ms offsets, and 2.2 s copied confirmation.

### LizProfile adaptation tokens

Use LizProfile's existing identity rather than importing the source palette or fonts:

```css
:root {
  --bab-ink: var(--ink, #151515);
  --bab-muted: var(--muted, #666);
  --bab-paper: var(--paper, #fff);
  --bab-surface: var(--surface, #fff);
  --bab-surface-soft: var(--surface-soft, #fafafa);
  --bab-line: var(--line, rgba(15, 15, 15, 0.08));
  --bab-lavender: var(--lavender, #d9d2ed);
  --bab-coral: var(--coral, #e7a08d);
  --bab-focus: #684ba5;
  --bab-error: #9f2f38;
  --bab-serif: var(--serif, "Instrument Serif", Georgia, serif);
  --bab-sans: var(--sans, "DM Sans", Arial, sans-serif);
  --bab-space-1: 0.5rem;
  --bab-space-2: 1rem;
  --bab-space-3: 1.5rem;
  --bab-space-4: 2rem;
  --bab-space-5: 3rem;
  --bab-radius-control: 999px;
  --bab-radius-panel: 18px;
  --bab-shadow-panel: 0 18px 50px rgba(20, 20, 20, 0.06);
  --bab-content: 48rem;
  --bab-chat: 42rem;
  --bab-fast: 200ms;
  --bab-standard: 320ms;
}
```

Typography:

- Product title and major plan headings: Instrument Serif, weight 400, compact line height.
- Labels, controls, body, and navigation: DM Sans, weights 400–600.
- Eyebrows: uppercase, 0.15 em tracking, 0.73–0.8 rem.
- Body: 1 rem mobile, 1.0625 rem desktop, approximately 1.6 line height.

Breakpoints:

- Compact mobile: up to 420 px.
- Mobile/tablet navigation: up to 820 px, matching LizProfile.
- Wide layout cap: 1280 px.

## Component inventory

- **LizProfile header**: same masthead, responsive menu, focus management, scroll locking, and styling as the homepage; `Build a Business` appears immediately before `Contact`.
- **Product shell**: inset workspace below a short page introduction; does not leak styles globally and never uses an iframe.
- **Landing state**: eyebrow, H1, two supporting paragraphs, primary pill CTA, reassurance line.
- **Chat header**: compact product label and destructive `Start over` text action with confirmation.
- **Conversation panel**: assistant messages as editorial text; user messages as a tinted, right-aligned bubble; scrolls internally only when necessary.
- **Typing indicator**: three animated dots with 150 ms offsets; static under reduced motion.
- **Composer**: multiline textarea, Enter to submit, Shift+Enter for newline, 4,000-character limit, disabled while sending.
- **Ready banner**: appears after the guide emits the readiness token and offers plan generation.
- **Early-build action**: available after three user turns; opens the confirmation dialog.
- **Confirmation dialog**: focus-trapped modal with cancel and confirm actions, Escape support, backdrop dismissal, and restored focus.
- **Generating state**: dots, `Shaping your plan…`, and reassurance copy.
- **Error banner**: friendly retry message; never reveals provider or stack errors.
- **Plan header**: business name and one-line description.
- **Refinement callout**: `Use this plan` or `Improve my plan`.
- **Plan section card**: repeated semantic section with heading and readable body; print styling removes decoration.
- **Brand chips**: wrapped compact pills.
- **Plan actions**: copy website prompt, print/save, and start again.
- **Build it with Liz card**: offer details, £150 price, and booking CTA; disabled `Booking calendar coming soon` when no URL is configured.
- **Prompt preview**: collapsed native details/summary.
- **Footer/home return**: LizProfile identity and an obvious route back to the main site.

Every interactive component needs visible hover, focus-visible, disabled, loading, and reduced-motion behavior where applicable.

## Layout map

### Homepage `/`

- Keep existing sections and order.
- Add `Build a Business` to the primary navigation immediately before `Contact`.
- The link targets `/build-a-business.html`, not a homepage hash.

### Build a Business `/build-a-business.html`

1. LizProfile header and primary navigation.
2. Compact editorial introduction identifying this as a guided experience by Dr Lizzie Soyode.
3. Inset product workspace containing exactly one of four states: landing, chat, generating, or plan.
4. Minimal LizProfile footer.

Desktop at 1280 px: center the workspace at a maximum of 48 rem, retain generous white space, and keep the page background visually continuous with LizProfile. Mobile at 375 px: use edge padding of 1.1 rem, allow the workspace to fill the available width, preserve 44 px minimum controls, avoid viewport-height traps, and keep the composer reachable above the browser chrome.

## Content and behavior

The binding V1 product requirements supplied on 2026-07-20 define the content and behavior. Implement one welcome screen, 18 one-question screens, an editable review, and results containing a business summary, deterministic Lovable prompt, optional LLM refinement prompt, fixed first-week checklist, copy/print/edit/restart actions, and the `Build it with Liz` offer.

Store progress in `localStorage`. Make no network request with an answer and never place free-text content in analytics. The approved privacy statement is: `Your answers stay in this browser unless you choose to copy them into another tool. We do not receive or store your business idea through this builder.`

## Licence and asset notes

- No product image assets are required beyond the existing favicon.
- Source fonts Fraunces and Inter are Google Fonts, but the adaptation does not need them; use LizProfile's existing Instrument Serif and DM Sans imports.
- Verify the Google Fonts licence/hosting choice if fonts are later self-hosted.
