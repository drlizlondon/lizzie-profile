import test from 'node:test';
import assert from 'node:assert/strict';
import { renderAnalyticsConfig } from '../scripts/generate-analytics-config.js';

test('renders the real measurement id when LIZPROFILE_GA4_MEASUREMENT_ID is set', () => {
  const out = renderAnalyticsConfig('G-ABC1234567');
  assert.match(out, /window\.__LIZPROFILE_GA4_MEASUREMENT_ID__ = "G-ABC1234567";/);
});

test('renders an empty id when unset, so lp-consent.js stays inert', () => {
  assert.match(renderAnalyticsConfig(''), /window\.__LIZPROFILE_GA4_MEASUREMENT_ID__ = "";/);
  assert.match(renderAnalyticsConfig(undefined), /window\.__LIZPROFILE_GA4_MEASUREMENT_ID__ = "";/);
});

test('never wraps the id in anything beyond a JSON string literal (no accidental script injection)', () => {
  const out = renderAnalyticsConfig('"; alert(1); //');
  assert.match(out, /window\.__LIZPROFILE_GA4_MEASUREMENT_ID__ = "\\"; alert\(1\); \/\/";/);
});
