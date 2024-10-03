import { type StorybookConfig } from '@storybook/core-common';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
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
};

module.exports = config;
