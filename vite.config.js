import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectPages = [
  'bumpnotes',
  'aurelle',
  'result-doctor',
  'mission-control',
  'common-ground',
  'big-picture-planner',
  'mybishbash',
];

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(import.meta.dirname, 'index.html'),
        resources: resolve(import.meta.dirname, 'resources.html'),
        watchAi: resolve(import.meta.dirname, 'watch-ai.html'),
        buildABusiness: resolve(import.meta.dirname, 'build-a-business.html'),
        bettyPrompt: resolve(import.meta.dirname, 'betty-prompt.html'),
        fablePromptRedirect: resolve(import.meta.dirname, 'fable-prompt.html'),
        privacy: resolve(import.meta.dirname, 'privacy.html'),
        unsubscribe: resolve(import.meta.dirname, 'unsubscribe.html'),
        ...Object.fromEntries(
          projectPages.map((name) => [name, resolve(import.meta.dirname, `projects/${name}.html`)]),
        ),
      },
    },
  },
});
