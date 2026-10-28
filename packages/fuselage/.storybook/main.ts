import { dirname, join } from 'path';

import type { StorybookConfig } from '@storybook/react-vite';
import { tamaguiPlugin } from '@tamagui/vite-plugin';

// With FUSELAGE_ZERO_RUNTIME=1 the stories render Fuselage compiled as the web client compiles it; without it, on the
// Tamagui runtime, as npm consumers and Jest run it.
const zeroRuntime = process.env.FUSELAGE_ZERO_RUNTIME === '1';

const config: StorybookConfig = {
	addons: [
		getAbsolutePath('@storybook/addon-a11y'),
		getAbsolutePath('@rocket.chat/storybook-dark-mode'),
		// The docs addon aliases `react` to a path, which the Tamagui compiler then cannot load when it evaluates the config.
		...(zeroRuntime ? [] : [getAbsolutePath('@storybook/addon-docs')]),
	],

	stories: zeroRuntime ? ['../src/**/*.stories.tsx'] : ['../src/**/*.stories.{mdx,js,tsx}', '../src/**/*.mdx'],

	framework: {
		name: getAbsolutePath('@storybook/react-vite'),
		options: {},
	},

	viteFinal: (config, { configType }) => ({
		...config,
		// Tamagui links its zero-runtime stylesheet at `<base>tamagui-zero.css`, which its dev server answers only at an absolute base.
		...(zeroRuntime && configType === 'DEVELOPMENT' && { base: '/' }),
		// Stories render the stylesheets as written: the library build's PostCSS plugins and the CSS minifier reorder and
		// round declarations.
		// The stories import the Tamagui config through this name: the runtime needs it, the compiled stories must not reach it
		resolve: {
			...config.resolve,
			alias: [
				...(Array.isArray(config.resolve?.alias)
					? config.resolve.alias
					: Object.entries(config.resolve?.alias ?? {}).map(([find, replacement]) => ({ find, replacement }))),
				{ find: 'fuselage-tamagui-config', replacement: join(__dirname, zeroRuntime ? 'empty.ts' : '../src/tamagui.config.ts') },
			],
		},
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
