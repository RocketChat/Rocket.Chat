import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@storybook/addon-docs'),
		getAbsolutePath('storybook-addon-pseudo-states'),
	],

	stories: ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

	staticDirs: [{ from: '../src/fonts', to: '/fuselage-fonts' }],

	managerHead: (head) => `${head}
		<style>
			@font-face {
				font-family: 'Inter';
				font-weight: 100 900;
				font-style: normal;
				font-display: swap;
				src: url('./fuselage-fonts/InterVariable.woff2') format('woff2');
			}
		</style>`,

	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},

	viteFinal: (config) => ({
		...config,
		// Stories render the stylesheets as written, with no PostCSS plugin (autoprefixer included), as webpack's Storybook
		// did: the library build's plugins and the CSS minifier reorder and round declarations.
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
