import type { StorybookConfig } from '@storybook/react/types';

export default {
  stories: ['../src/**/*.stories.tsx', '../src/**/stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    'storybook-dark-mode',
    {
      name: '@newhighsco/storybook-addon-transpile-modules',
      options: {
        transpileModules: ['date-fns', 'typia', 'react-i18next'],
      },
    },
  ],
  features: {
    postcss: false,
  },
  framework: '@storybook/react',
  typescript: {
    reactDocgen: 'react-docgen',
  },
} satisfies StorybookConfig;
