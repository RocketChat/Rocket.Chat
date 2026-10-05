import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@rocket.chat/storybook-dark-mode'),
		getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
		getAbsolutePath('@storybook/addon-docs'),
	],

	stories: ['../src/**/*.stories.tsx', '../src/**/stories.tsx'],

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
} satisfies StorybookConfig;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
