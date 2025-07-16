import { dirname, join } from 'path';
import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
	stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
	addons: [
		getAbsolutePath('@storybook/addon-essentials'),
		getAbsolutePath('storybook-dark-mode'),
		getAbsolutePath('@storybook/addon-webpack5-compiler-babel'),
	],

	framework: {
		name: getAbsolutePath('@storybook/react-webpack5'),
		options: {},
	},

	docs: {},
} satisfies StorybookConfig;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
