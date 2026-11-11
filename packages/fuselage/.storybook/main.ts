import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

import type { StorybookConfig } from '@storybook/react-vite';
import { tamaguiPlugin } from '@tamagui/vite-plugin';

// With FUSELAGE_ZERO_RUNTIME=1 the stories render Fuselage compiled as the web client compiles it; without it, on the
// Tamagui runtime, as npm consumers and Jest run it.
const zeroRuntime = process.env.FUSELAGE_ZERO_RUNTIME === '1';

const require = createRequire(import.meta.url);

const config: StorybookConfig = {
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		// The docs addon aliases `react` to a path, which the Tamagui compiler then cannot load when it evaluates the config.
		...(zeroRuntime ? [] : [getAbsolutePath('@storybook/addon-docs')]),
		getAbsolutePath('storybook-addon-pseudo-states'),
	],

	// MDX documentation pages render through the docs addon, so the zero build has only the TSX stories to compare.
	stories: zeroRuntime ? ['../src/**/*.stories.tsx'] : ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

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

	viteFinal: (config, { configType }) => ({
		...config,
		// Tamagui links its zero-runtime stylesheet at `<base>tamagui-zero.css`, which its dev server answers only at an absolute base.
		...(zeroRuntime && configType === 'DEVELOPMENT' && { base: '/' }),
		// Stories render the stylesheets as written, with no PostCSS plugin (autoprefixer included), as webpack's Storybook
		// did: the library build's plugins and the CSS minifier reorder and round declarations.
		css: { ...config.css, postcss: { plugins: [] } },
		build: { ...config.build, cssMinify: false },
		plugins: [
			...(config.plugins ?? []),
			...(zeroRuntime
				? [
						tamaguiPlugin({
							config: './src/tamagui.config.ts',
							components: [],
							outputCSS: './.tamagui/zero/tamagui-zero.css',
							experimental: { zeroRuntime: true },
						}),
					]
				: []),
		],
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
