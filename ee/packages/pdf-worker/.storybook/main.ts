import { resolve } from 'node:path';

import baseConfig from '@rocket.chat/storybook-config/main';
import webpack from 'webpack';

export default baseConfig({
	staticDirs: ['../src/public'],

	webpackFinal: (config) => {
		// This is only needed because of Rocket.Chat's icon font.
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
});
