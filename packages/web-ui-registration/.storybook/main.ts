import { type StorybookConfig } from '@storybook/core-common';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-essentials', 'storybook-dark-mode'],
	features: {
		postcss: false,
	},
	framework: '@storybook/react',
};

module.exports = config;
