// @ts-check
import { base, react } from '@rocket.chat/eslint-config';

export default base(
  react({
    rules: {
      'react/no-children-prop': 'warn',
      'react/jsx-key': 'warn',
      'react/display-name': 'warn',
    },
  }),
  {
    rules: {
      'import-x/order': 'off',
      'import-x/export': 'off',
      '@stylistic/comma-dangle': 'off',
      '@stylistic/quotes': 'off',
      '@stylistic/eol-last': 'off',
      '@stylistic/space-infix-ops': 'off',
      '@stylistic/member-delimiter-style': 'off',
      '@stylistic/jsx-quotes': 'off',
      '@stylistic/jsx-indent-props': 'off',
      '@stylistic/jsx-curly-brace-presence': 'off',
      '@stylistic/key-spacing': 'off',
      '@stylistic/type-annotation-spacing': 'off',
      '@stylistic/object-curly-spacing': 'off',
      '@stylistic/jsx-curly-newline': 'off',
    },
  },
);
