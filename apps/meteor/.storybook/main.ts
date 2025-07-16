import { dirname, join, resolve } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';
import webpack from 'webpack';

export default {
	stories: ['../client/**/*.stories.{js,tsx}', '../app/**/*.stories.{js,tsx}', '../ee/app/**/*.stories.{js,tsx}'],

	addons: [
		getAbsolutePath('@storybook/addon-essentials'),
		getAbsolutePath('@storybook/addon-interactions'),
		getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
		getAbsolutePath('@storybook/addon-styling-webpack'),
	],

	typescript: {
		reactDocgen: 'react-docgen',
	},

	webpackFinal: async (config) => {
		// Those aliases are needed because dependencies in the monorepo use another
		// dependencies that are not hoisted on this workspace
		config.resolve = {
			...config.resolve,
			alias: {
				...config.resolve?.alias,
				'react$': require.resolve('../../../node_modules/react'),
				// 'react/jsx-runtime': require.resolve('../../../node_modules/react/jsx-runtime'),
				'@tanstack/react-query': require.resolve('../../../node_modules/@tanstack/react-query'),
				'swiper/swiper.css$': 'swiper/css',
				'swiper/modules/navigation/navigation.min.css$': 'swiper/css/navigation',
				'swiper/modules/keyboard/keyboard.min.css$': 'swiper/css/keyboard',
				'swiper/modules/zoom/zoom.min.css$': 'swiper/css/zoom',
			},
			// This is only needed because of Fontello
			roots: [...(config.resolve?.roots ?? []), resolve(__dirname, '../../../apps/meteor/public')],
		};

		config.module?.rules?.push({
			test: /\.info$/,
			type: 'json',
		});

		config.plugins?.push(
			new webpack.NormalModuleReplacementPlugin(/^meteor/, require.resolve('./mocks/meteor.js')),
			new webpack.NormalModuleReplacementPlugin(/(app)\/*.*\/(server)\/*/, require.resolve('./mocks/empty.ts')),
			new webpack.NormalModuleReplacementPlugin(/^sip.js/, require.resolve('./mocks/empty.ts')),
		);

		return config;
	},

	framework: {
		name: getAbsolutePath('@storybook/react-webpack5'),
		options: {},
	},

	docs: {},
} satisfies StorybookConfig;

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}
