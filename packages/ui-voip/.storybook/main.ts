import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		getAbsolutePath('@storybook/addon-essentials'),
		getAbsolutePath('@storybook/addon-a11y'),
		// getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
		getAbsolutePath('@storybook/addon-interactions'),
	],

	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},

	typescript: {
		reactDocgen: 'react-docgen',
	},

	docs: {},

	viteFinal: (config) => {
		// This is only needed because of Fontello

		return config;
	},
};

function getAbsolutePath(value: any): string {
	return dirname(require.resolve(join(value, 'package.json')));
}

export default config;
