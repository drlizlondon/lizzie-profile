/* lp-consent.js — consent-gated Google Analytics 4 for drlizlondon.com.

   This site has never carried analytics before. Installing it is governed
   by the portfolio consent-gate skill (~/.claude/skills/consent-gate),
   adapted to GA4-only (no Microsoft Clarity, per the install instruction).
   The guarantees this file enforces, in order:

     1. Zero requests to Google before a visitor chooses. The GA4 script
        tag is not even referenced until loadGoogleAnalytics() runs, and
        that only happens from a stored "granted" consent or a live
        "Allow analytics" click.
     2. A real decline path. "No thanks" writes the choice, never loads the
        tag, and (if a visitor is withdrawing consent mid-session) clears
        any GA cookies already set.
     3. GA4 carries anonymised, aggregate USAGE DATA ONLY — pages viewed,
        anonymised IP. It never receives your name, email address, or the
        content of anything you type into the contact form or the Betty
        Pro signup — this script has no access to those and never reads
        them.
     4. ad_storage stays denied, always — this is measurement only, never
        advertising.
     5. No Microsoft Clarity and no session-replay tooling of any kind
        runs on this site.
     6. The choice persists 13 months, then re-prompts, and can be changed
        at any time from the "Privacy choices" link this script adds next
        to every page's existing Privacy Policy link in the footer.
     7. The measurement id comes from window.__LIZPROFILE_GA4_MEASUREMENT_ID__,
        written at build time by scripts/generate-analytics-config.js from
        the LIZPROFILE_GA4_MEASUREMENT_ID environment variable — never
        hardcoded here. With no id configured, this script stays fully
        inert: no banner, no requests, nothing. */
(function () {
  'use strict';

  var GA4_MEASUREMENT_ID = window.__LIZPROFILE_GA4_MEASUREMENT_ID__ || '';
  var CONSENT_KEY = 'lp_analytics_consent_v1';
  var CONSENT_MAX_AGE_MS = 13 * 30 * 24 * 60 * 60 * 1000;
  var PRODUCTION_HOSTS = ['drlizlondon.com', 'www.drlizlondon.com'];
  var PRIVACY_URL = '/privacy.html';

  /* Not configured for this environment (no env var supplied at build
     time) — stay completely inert. */
  if (!GA4_MEASUREMENT_ID) return;

  /* Local dev, previews, and any host other than the live production
     domain never load analytics or show the prompt. */
  if (PRODUCTION_HOSTS.indexOf(window.location.hostname) === -1) return;

  function readConsent() {
    try {
      var stored = window.localStorage.getItem(CONSENT_KEY);
      if (!stored) return null;
      var choice = JSON.parse(stored);
      if (!choice || !choice.value || !choice.decidedAt) return null;
      if (Date.now() - choice.decidedAt > CONSENT_MAX_AGE_MS) return null;
      return choice.value;
    } catch {
      return null;
    }
  }

  function writeConsent(value) {
    try {
      window.localStorage.setItem(CONSENT_KEY, JSON.stringify({
        value: value,
        decidedAt: Date.now()
      }));
    } catch {
      /* The choice still applies for this page load even if it can't persist. */
    }
  }

  function loadGoogleAnalytics() {
    if (document.querySelector('script[data-lp-ga4]')) return;

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    /* Consent Mode defaults: denied until explicitly granted here. */
    window.gtag('consent', 'default', { ad_storage: 'denied', analytics_storage: 'denied' });
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    window.gtag('config', GA4_MEASUREMENT_ID, {
      anonymize_ip: true,
      cookie_flags: 'SameSite=None;Secure'
    });

    var script = document.createElement('script');
    script.async = true;
    script.dataset.lpGa4 = 'true';
    script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA4_MEASUREMENT_ID);
    document.head.appendChild(script);
  }

  function clearAnalyticsCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (name === '_ga' || name.indexOf('_ga_') === 0) {
        document.cookie = name + '=; Max-Age=0; path=/; SameSite=Lax';
        document.cookie = name + '=; Max-Age=0; path=/; domain=.' + window.location.hostname + '; SameSite=Lax';
      }
    });
  }

  function removePrompt() {
    var prompt = document.getElementById('lp-analytics-consent');
    if (prompt) prompt.remove();
  }

  function installPrivacyChoicesLink() {
    document.querySelectorAll('footer a[href$="privacy.html"]').forEach(function (privacyLink) {
      if (privacyLink.parentElement.querySelector('[data-lp-privacy-choices]')) return;
      var link = document.createElement('a');
      link.href = '#privacy-choices';
      link.textContent = 'Privacy choices';
      link.setAttribute('data-lp-privacy-choices', '');
      privacyLink.insertAdjacentElement('afterend', link);
    });

    document.querySelectorAll('[data-lp-privacy-choices]').forEach(function (control) {
      if (control.dataset.lpPrivacyReady === 'true') return;
      control.dataset.lpPrivacyReady = 'true';
      control.addEventListener('click', function (event) {
        event.preventDefault();
        showPrompt(true);
      });
    });
  }

  function choose(value) {
    writeConsent(value);
    removePrompt();
    if (value === 'granted') {
      loadGoogleAnalytics();
    } else {
      clearAnalyticsCookies();
    }
  }

  function showPrompt(isPreferences) {
    if (document.getElementById('lp-analytics-consent')) return;

    var prompt = document.createElement('section');
    prompt.id = 'lp-analytics-consent';
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-modal', 'false');
    prompt.setAttribute('aria-labelledby', 'lp-analytics-title');
    prompt.innerHTML =
      '<div>' +
        '<strong id="lp-analytics-title">' + (isPreferences ? 'Privacy choices' : 'Help improve this site') + '</strong>' +
        '<p>With your permission, Google Analytics measures anonymous usage — pages viewed, how visitors move around the site — so I can see what is useful. ' +
        '<strong>This never includes your name, email address, or anything you type into a form.</strong> No advertising, no Microsoft Clarity, no session recording.</p>' +
        '<a href="' + PRIVACY_URL + '">Read the privacy policy</a>' +
      '</div>' +
      '<div class="lp-consent-actions">' +
        '<button type="button" data-consent="denied">No thanks</button>' +
        '<button type="button" data-consent="granted">Allow analytics</button>' +
      '</div>';

    prompt.querySelector('[data-consent="denied"]').addEventListener('click', function () { choose('denied'); });
    prompt.querySelector('[data-consent="granted"]').addEventListener('click', function () { choose('granted'); });
    document.body.appendChild(prompt);
  }

  function addStyles() {
    var style = document.createElement('style');
    style.textContent =
      '#lp-analytics-consent{position:fixed;z-index:2147483646;left:16px;right:16px;bottom:16px;display:flex;align-items:center;justify-content:space-between;gap:20px;max-width:760px;margin:0 auto;padding:16px 18px;border:1px solid var(--line,rgba(15,15,15,.08));border-radius:14px;background:var(--surface,#fff);color:var(--ink,#151515);box-shadow:0 12px 40px rgba(15,15,15,.16);font:14px/1.45 var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif)}' +
      '#lp-analytics-consent strong{display:block;margin-bottom:4px;font-size:15px}' +
      '#lp-analytics-consent p{margin:0;color:var(--muted,#666)}' +
      '#lp-analytics-consent a{display:inline-block;margin-top:5px;color:var(--ink,#151515);font-weight:700}' +
      '.lp-consent-actions{display:flex;flex:0 0 auto;gap:8px}' +
      '.lp-consent-actions button{border:1px solid var(--line,rgba(15,15,15,.08));border-radius:9px;background:var(--surface,#fff);color:var(--ink,#151515);cursor:pointer;font:700 13px/1 var(--sans,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif);min-height:38px;padding:0 14px}' +
      '.lp-consent-actions [data-consent="granted"]{border-color:#684ba5;background:#684ba5;color:#fff}' +
      '[data-lp-privacy-choices]:focus-visible{outline:2px solid #684ba5;outline-offset:4px;border-radius:2px}' +
      '@media(max-width:620px){#lp-analytics-consent{align-items:stretch;flex-direction:column;gap:12px}.lp-consent-actions{justify-content:flex-end}}';
    document.head.appendChild(style);
  }

  function initialise() {
    addStyles();
    installPrivacyChoicesLink();
    var consent = readConsent();
    if (consent === 'granted') loadGoogleAnalytics();
    if (consent !== 'granted' && consent !== 'denied') showPrompt(false);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialise);
  else initialise();
})();
