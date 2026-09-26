// GA4 conversion events — consent-gated, no personal data.
//
// This repo has one conversion event today: a successful contact-form
// submission, fired as GA4's recommended `generate_lead` event so it can be
// marked a key event in GA4. It mirrors the pattern shipped for myBishBash
// (commit 90d5b3b, src/lib/analytics.js) adapted to this repo's own setup:
// a static site with no build tool, no Vite `import.meta.env.PROD` flag,
// and analytics already gated end-to-end by public/lp-consent.js.
//
// public/lp-consent.js is a plain classic script (not a module — it has to
// run before the page's module bundle to show the banner ASAP), so its
// PRODUCTION_HOSTS constant can't be imported here; it is duplicated below
// with this comment as the pointer back to the source of truth. Keep the
// two arrays in sync.
//
// Four guards run, in order, before any window.gtag(...) call — matching
// lp-consent.js's own reasoning for staying inert with nothing configured:
//   1. A measurement id is actually configured (window.__LIZPROFILE_GA4_MEASUREMENT_ID__
//      is non-empty) — with none set, lp-consent.js never loads the base tag
//      at all, so an event call here must stay just as inert.
//   2. The hostname is on the production allowlist — never localhost, a
//      Vercel preview, or any other non-production host.
//   3. The visitor granted analytics consent — read directly from the same
//      `lp_analytics_consent_v1` localStorage key lp-consent.js writes,
//      rather than assuming window.gtag only ever exists post-consent.
//   4. window.gtag is actually a function — lp-consent.js installs it as
//      `window.gtag = window.gtag || function(){window.dataLayer.push(arguments);}`.
//      This module never redefines it; an arrow-function redefinition
//      elsewhere would push an array instead of an arguments-like list and
//      gtag.js would silently ignore every call — that exact bug once
//      zeroed GreatInternet's analytics.
//
// No personal data ever goes in event params — this file is critical here
// because the one event it fires is on the contact form: it must never
// carry the visitor's name, email address, or message contents.
const PRODUCTION_HOSTS = ['drlizlondon.com', 'www.drlizlondon.com']; // duplicated from public/lp-consent.js — see comment above
const CONSENT_KEY = 'lp_analytics_consent_v1';

function isMeasurementIdConfigured() {
  return typeof window !== 'undefined' && Boolean(window.__LIZPROFILE_GA4_MEASUREMENT_ID__);
}

function isProductionHost() {
  return typeof window !== 'undefined'
    && Boolean(window.location)
    && PRODUCTION_HOSTS.indexOf(window.location.hostname) !== -1;
}

function hasAnalyticsConsent() {
  if (typeof window === 'undefined' || !window.localStorage) return false;
  try {
    const stored = window.localStorage.getItem(CONSENT_KEY);
    if (!stored) return false;
    const choice = JSON.parse(stored);
    return Boolean(choice && choice.value === 'granted');
  } catch {
    return false;
  }
}

/**
 * @param {string} name
 * @param {Record<string, string>} params
 */
function trackEvent(name, params) {
  if (!isMeasurementIdConfigured()) return;
  if (!isProductionHost()) return;
  if (!hasAnalyticsConsent()) return;
  if (typeof window.gtag !== 'function') return;
  window.gtag('event', name, params);
}

/**
 * Fired once the contact form's POST resolves with an ok server response
 * (never on click, never before the server confirms delivery, never on a
 * failed submission). No form field contents are ever included.
 */
export function trackContactFormSuccess() {
  trackEvent('generate_lead', { method: 'contact_form' });
}

export const __testing__ = {
  isMeasurementIdConfigured,
  isProductionHost,
  hasAnalyticsConsent,
  trackEvent,
  CONSENT_KEY,
  PRODUCTION_HOSTS,
};
