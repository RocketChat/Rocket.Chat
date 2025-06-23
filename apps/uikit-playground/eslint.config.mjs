import { config } from '@rocket.chat/eslint-config/react';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  ...config,
  reactRefresh.configs.vite,
  {
    rules: {
      'react/jsx-key': 'warn',
    },
  },
];
