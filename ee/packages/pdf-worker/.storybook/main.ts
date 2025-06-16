import { dirname, join, resolve } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [getAbsolutePath('@storybook/addon-essentials'), getAbsolutePath('@storybook/addon-webpack5-compiler-babel')],

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
			},
		};

		return config;
	},
} satisfies StorybookConfig;

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}
