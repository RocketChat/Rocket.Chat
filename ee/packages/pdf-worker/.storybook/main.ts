import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import baseConfig from '@rocket.chat/storybook-config/main';
import webpack from 'webpack';

const require = createRequire(import.meta.url);

export default baseConfig({
	staticDirs: ['../src/public'],

	webpackFinal: (config) => {
		// This is only needed because of Rocket.Chat's icon font.
		config.resolve = {
			...config.resolve,
			roots: [...(config.resolve?.roots ?? []), resolve(import.meta.dirname, '../../../../apps/meteor/public')],
			alias: {
				...config.resolve?.alias,
				// The npm `path` package installed in the monorepo needs Node's `process`, so the browser build
				// must get `path-browserify` even though `path` resolves.
				path$: require.resolve('path-browserify'),
			},
			fallback: {
				...config.resolve?.fallback,
				buffer: require.resolve('buffer/'),
			},
		};

		// Webpack 5 does not handle `node:` URI imports out of the box. Strip the
		// prefix so the `resolve.alias` and `resolve.fallback` entries (above) kick in.
		config.plugins = [
			...(config.plugins ?? []),
			new webpack.NormalModuleReplacementPlugin(/^node:/, (resource: { request: string }) => {
				resource.request = resource.request.replace(/^node:/, '');
			}),
		];

		return config;
	},
});
