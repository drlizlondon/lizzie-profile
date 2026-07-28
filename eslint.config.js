import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['dist/**', 'fable-subscriber-service/**'] },
  {
    files: ['**/*.js'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: js.configs.recommended.rules,
  },
];
