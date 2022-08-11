module.exports = {
  addons: ['@storybook/addon-essentials', 'storybook-dark-mode/register'],
  stories: ['../src/**/*.stories.tsx', '../src/**/stories.tsx'],
  features: {
    postcss: false,
  },
};
