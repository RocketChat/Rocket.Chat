import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
	webpackFinal: async (config) => {
		config.module?.rules?.push({
			test: /\.woff2$/,
			type: 'asset/resource',
		});

		return config;
	},
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@rocket.chat/storybook-dark-mode'),
		getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
		{
			name: getAbsolutePath('@storybook/addon-styling-webpack'),

			options: {
				rules: [
					{
						test: /\.css$/,
						sideEffects: true,
						use: [
							require.resolve('style-loader'),
							{
								loader: require.resolve('css-loader'),
								options: {
									importLoaders: 1,
								},
							},
							{
								loader: require.resolve('postcss-loader'),
								options: {
									implementation: require.resolve('postcss'),
								},
							},
						],
					},
					{
						test: /\.s[ac]ss$/,
						sideEffects: true,
						use: [
							require.resolve('style-loader'),
							{
								loader: require.resolve('css-loader'),
								options: {
									importLoaders: 3,
								},
							},
							{
								loader: require.resolve('postcss-loader'),
								options: {
									implementation: require.resolve('postcss'),
								},
							},
							require.resolve('resolve-url-loader'),
							{
								loader: require.resolve('sass-loader'),
								options: {
									// Want to add more Sass options? Read more here: https://webpack.js.org/loaders/sass-loader/#options
									sourceMap: true,
									sassOptions: {},
								},
							},
						],
					},
				],
			},
		},
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('storybook-addon-pseudo-states'),
	],

	stories: ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

	framework: {
		name: getAbsolutePath('@storybook/react-webpack5'),
		options: {},
	},
	swc: () => ({
		jsc: {
			transform: {
				react: {
					runtime: 'automatic',
				},
			},
		},
	}),

	docs: {},

	typescript: {
		reactDocgen: 'react-docgen-typescript',
	},
};

export default config;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
