/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  'root': true,
  'extends': [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript/recommended',
  ],
  'rules': {
    'no-var': 'warn',
    'eqeqeq': 'warn',
    'keyword-spacing': 'error',
    'handle-callback-err': 'error',
    'no-console': 0,
    'linebreak-style': 0,
    'react/no-unescaped-entities': 0,
    'quotes': [ 'error', 'single', { avoidEscape: true, allowTemplateLiterals: true } ],
    'semi': ['error', 'always'],
    'semi-spacing': 'error',
    'spaced-comment': ['warn', 'always'],
    'vue/multi-word-component-names': 'off',
    'comma-dangle': ['warn', 'always-multiline'],
    'no-unused-vars': [
      'warn',
      { vars: 'all', args: 'all', argsIgnorePattern: '^_', ignoreRestSiblings: false },
    ],
  },
};
