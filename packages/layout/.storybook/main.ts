import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-webpack5';

export default {
	addons: [
		getAbsolutePath('@rocket.chat/storybook-dark-mode'),
		getAbsolutePath('@storybook/addon-webpack5-compiler-swc'),
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-docs'),
	],
	logLevel: 'silent',

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
		// react-docgen-typescript needs the TypeScript compiler API, which the native TypeScript 7 package does not expose.
		reactDocgen: 'react-docgen',
	},
} satisfies StorybookConfig;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
