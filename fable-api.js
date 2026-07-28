const serviceUrl = String(import.meta.env.VITE_FABLE_SERVICE_URL ?? '').trim().replace(/\/+$/, '');

/**
 * Build a URL for the separately hosted Betty service.
 *
 * @param {string} path
 * @returns {string}
 */
export function apiUrl(path) {
  if (!serviceUrl) {
    throw new Error('Betty Pro is temporarily unavailable. Please try again shortly.');
  }

  const normalisedPath = path.startsWith('/') ? path : `/${path}`;
  return `${serviceUrl}${normalisedPath}`;
}
