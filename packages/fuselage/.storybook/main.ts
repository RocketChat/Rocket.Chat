import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import { DefinePlugin } from 'webpack';

const config: StorybookConfig = {
	webpackFinal: async (config) => {
		config.module?.rules?.push({
			test: /\.woff2$/,
			type: 'asset/resource',
		});

		// The same lowering of allowlisted frames as the library build
		config.module?.rules?.push({
			test: /\/src\/components\/.+\.tsx$/,
			exclude: /\.stories\./,
			enforce: 'pre',
			use: [{ loader: join(__dirname, 'lowerStyledLoader.mjs') }],
		});

		// Matches the cascade layer the published bundle pins in `vite.config.mts`
		config.plugins?.push(new DefinePlugin({ 'process.env.TAMAGUI_CSS_LAYER': JSON.stringify('fuselage') }));

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
									// Inlines normalize's `@import … layer(reset)` keeping the layer, which css-loader drops
									postcssOptions: {
										plugins: [[require.resolve('postcss-import'), { filter: (path: string) => path.startsWith('normalize.css/') }]],
									},
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
