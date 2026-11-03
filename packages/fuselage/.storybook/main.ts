import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-webpack5';

const require = createRequire(import.meta.url);

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
	],

	stories: ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

	staticDirs: [{ from: '../src/fonts', to: '/fuselage-fonts' }],

	managerHead: (head) => `${head}
		<style>
			@font-face {
				font-family: 'Inter';
				font-weight: 100 900;
				font-style: normal;
				font-display: swap;
				src: url('./fuselage-fonts/InterVariable.woff2') format('woff2');
			}
		</style>`,

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
