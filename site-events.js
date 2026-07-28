import { apiUrl } from './fable-api.js';

const VISITOR_KEY = 'lizprofile-visitor-v1';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

let inMemoryVisitorId = '';

const createVisitorId = () => {
  if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const visitorId = () => {
  if (inMemoryVisitorId) return inMemoryVisitorId;

  try {
    const storedId = window.localStorage.getItem(VISITOR_KEY) ?? '';
    if (UUID_PATTERN.test(storedId)) {
      inMemoryVisitorId = storedId;
      return inMemoryVisitorId;
    }
  } catch {
    // Aggregate measurement still works for this page when storage is unavailable.
  }

  inMemoryVisitorId = createVisitorId();
  try {
    window.localStorage.setItem(VISITOR_KEY, inMemoryVisitorId);
  } catch {
    // The random identifier is kept in memory only for this page view.
  }
  return inMemoryVisitorId;
};

const pageCategory = () => {
  const path = window.location.pathname.replace(/\/+$/, '') || '/';
  if (path === '/' || path.endsWith('/index.html')) return 'home';
  if (
    path.endsWith('/betty-prompt')
    || path.endsWith('/betty-prompt.html')
    || path.endsWith('/fable-prompt')
    || path.endsWith('/fable-prompt.html')
  ) return 'fable-prompt';
  if (path.endsWith('/build-a-business') || path.endsWith('/build-a-business.html')) return 'build-a-business';
  if (path.endsWith('/privacy') || path.endsWith('/privacy.html')) return 'privacy';
  if (path.endsWith('/unsubscribe') || path.endsWith('/unsubscribe.html')) return 'unsubscribe';
  if (path.includes('/projects/')) return 'project';
  return 'other';
};

/**
 * Record one anonymous, aggregate site event. The backend receives no email,
 * query string, user agent, or raw browsing history from this module.
 *
 * @param {string} event
 */
export function trackSiteEvent(event) {
  window.dispatchEvent(new CustomEvent('lizprofile:analytics', { detail: { name: event } }));

  try {
    void fetch(apiUrl('/api/events'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, visitorId: visitorId(), page: pageCategory() }),
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // Analytics must never interrupt reading, copying, downloading, or signing up.
  }
}
