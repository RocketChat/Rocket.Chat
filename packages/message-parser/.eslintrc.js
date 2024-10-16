module.exports = {
  extends: '@rocket.chat/eslint-config',
  env: {
    jest: true,
  },
  overrides: [
    {
      files: ['**/*.ts', '**/*.tsx'],
      extends: '@rocket.chat/eslint-config',
    },
  ],
};
