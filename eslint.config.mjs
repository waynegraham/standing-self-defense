/**
 * @type {import("eslint").FlatConfig[]}
 */
export default [
  {
    ignores: ['**/node_modules/**', '**/_site/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
    },
    rules: {
      'no-console': 'warn',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
