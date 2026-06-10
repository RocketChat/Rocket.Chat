import { dirname, join, resolve } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import webpack from 'webpack';

export default {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [getAbsolutePath('@storybook/addon-docs'), getAbsolutePath('@storybook/addon-webpack5-compiler-swc')],

	framework: {
		name: getAbsolutePath('@storybook/react-webpack5'),
		options: {},
	},

	staticDirs: ['../src/public'],

	typescript: {
		reactDocgen: 'react-docgen',
	},

	docs: {},

	webpackFinal: (config) => {
		// This is only needed because of Fontello
		config.resolve = {
			...config.resolve,
			roots: [...(config.resolve?.roots ?? []), resolve(__dirname, '../../../../apps/meteor/public')],
			fallback: {
				...config.resolve?.fallback,
				buffer: require.resolve('buffer/'),
				path: require.resolve('path-browserify'),
			},
		};

		// Webpack 5 does not handle `node:` URI imports out of the box. Strip the
		// prefix so the corresponding `resolve.fallback` entries (above) kick in.
		config.plugins = [
			...(config.plugins ?? []),
			new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
				resource.request = resource.request.replace(/^node:/, '');
			}),
		];

		return config;
	},
} satisfies StorybookConfig;

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}
