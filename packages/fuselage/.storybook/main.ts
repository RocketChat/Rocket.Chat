import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@rocket.chat/storybook-dark-mode'),
		getAbsolutePath('@storybook/addon-docs'),
	],

	stories: ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},

	viteFinal: (config) => ({
		...config,
		// Stories render the stylesheets as written: the library build's PostCSS plugins and the CSS minifier reorder and
		// round declarations.
		css: { ...config.css, postcss: { plugins: [] } },
		build: { ...config.build, cssMinify: false },
	}),

	docs: {},

	typescript: {
		// react-docgen-typescript needs the TypeScript compiler API, which TypeScript 7 no longer ships.
		reactDocgen: 'react-docgen',
	},
};

export default config;

function getAbsolutePath(value: string): any {
	return dirname(require.resolve(join(value, 'package.json')));
}
