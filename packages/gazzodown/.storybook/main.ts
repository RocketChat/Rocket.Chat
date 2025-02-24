import { dirname, join, resolve } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [getAbsolutePath('@storybook/addon-essentials'), './webpackAddon', getAbsolutePath('@storybook/addon-styling-webpack')],

	framework: {
		name: getAbsolutePath('@storybook/react-webpack5'),
		options: {},
	},

	typescript: {
		reactDocgen: 'react-docgen',
	},

	webpackFinal: (config) => {
		// This is only needed because of Fontello
		config.resolve = {
			...config.resolve,
			roots: [...(config.resolve?.roots ?? []), resolve(__dirname, '../../../apps/meteor/public')],
		};

		return config;
	},

	docs: {},
};

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

export default config;
