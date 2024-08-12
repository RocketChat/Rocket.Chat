/** @type {import('@storybook/react/types').StorybookConfig} */
module.exports = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-essentials', '@storybook/addon-a11y'],
	framework: '@storybook/react',
	features: {
		postcss: false,
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript-plugin',
	},
};
