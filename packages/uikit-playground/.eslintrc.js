module.exports = {
  extends: ['@rocket.chat/eslint-config-alt/typescript'],
  rules: {
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-use-before-define': 'off',
    'react/display-name': 'off',
    'react/no-multi-comp': 'off',
  },
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ['*.mdx'],
      extends: [
        '@rocket.chat/eslint-config-alt/react',
        'plugin:mdx/recommended',
      ],
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      rules: {
        'new-cap': 'off',
        'prefer-arrow-callback': 'off',
        'semi': 'off',
      },
    },
  ],
};
