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
        ...Object.fromEntries(
          projectPages.map((name) => [name, resolve(import.meta.dirname, `projects/${name}.html`)]),
        ),
      },
    },
  },
});
