import { defineConfig } from '@playwright/test';

// Local-only Playwright config for the hosted editor's end-to-end test.
// Never talks to the real GitHub API or a real OAuth flow — see
// tests/e2e/copy-editor.spec.js, which mocks every github.com/api.github.com
// route and injects a fake sessionStorage token instead of running the
// popup handshake. `npm run build` + `vite preview` serve the real built
// site so this exercises the shipped bundle, not a dev-only shortcut.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4319',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --port 4319 --strictPort',
    url: 'http://localhost:4319',
    reuseExistingServer: false,
    timeout: 30_000,
  },
});
