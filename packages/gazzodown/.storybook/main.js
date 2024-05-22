/** @type {import('@storybook/react/types').StorybookConfig} */
module.exports = {
	stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: ['@storybook/addon-essentials'],
	framework: '@storybook/react',
	features: {
		postcss: false,
	},
	typescript: {
		reactDocgen: 'react-docgen-typescript-plugin',
	},
	async webpackFinal(config) {
		config.module.rules.push({
			test: /(date-fns).*\.(ts|js|mjs)x?$/,
			include: /node_modules/,
			loader: 'babel-loader',
		});
		return config;
	},
};
