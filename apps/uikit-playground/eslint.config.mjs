// module.exports = {
//   env: { browser: true, es2020: true },
//   extends: [
//     'eslint:recommended',
//     'plugin:@typescript-eslint/recommended',
//     'plugin:react-hooks/recommended',
//   ],
//   parser: '@typescript-eslint/parser',
//   parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
//   plugins: ['react-refresh'],
//   rules: {
//     'react-refresh/only-export-components': 'warn',
//   },
// }
import { config } from '@rocket.chat/eslint-config/react';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...config,
  reactRefresh.configs.vite,
  {
    rules: {
      'react/jsx-key': 'off',
    }
  }
  
];
