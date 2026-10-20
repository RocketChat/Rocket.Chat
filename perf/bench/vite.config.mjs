// Builds the bench page against one Fuselage dist: FUSELAGE_DIST=<dir> OUT=<dir> vite build -c perf/bench/vite.config.mjs
// TAMAGUI_EXTRACT=1 also runs the Tamagui compiler over the page, as an app consuming Fuselage would.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const dist = process.env.FUSELAGE_DIST;
const fuselageModules = resolve(import.meta.dirname, '../../packages/fuselage/node_modules');

const tamagui = async () => {
	if (!process.env.TAMAGUI_EXTRACT) {
		return [];
	}
	const { tamaguiPlugin } = await import(resolve(fuselageModules, '@tamagui/vite-plugin/dist/esm/index.mjs'));
	return [
		tamaguiPlugin({
			config: resolve(import.meta.dirname, '../../packages/fuselage/src/tamagui.config.ts'),
			components: ['fuselage-under-test'],
			optimize: true,
			...(process.env.TAMAGUI_ZERO ? { experimental: { zeroRuntime: 'report' } } : {}),
		}),
	];
};

export default defineConfig(async () => ({
	root: import.meta.dirname,
	base: './',
	logLevel: 'warn',
	plugins: await tamagui(),
	resolve: {
		alias: {
			'fuselage-under-test-css': resolve(dist, 'fuselage.css'),
			'fuselage-under-test': resolve(dist, existsSync(resolve(dist, 'fuselage.production.mjs')) ? 'fuselage.production.mjs' : 'fuselage.production.js'),
		},
		dedupe: ['react', 'react-dom'],
	},
	define: { 'process.env.NODE_ENV': JSON.stringify('production') },
	esbuild: { jsx: 'automatic' },
	oxc: { jsx: { runtime: 'automatic' } },
	build: {
		outDir: process.env.OUT,
		emptyOutDir: true,
		minify: process.env.MINIFY !== 'false',
		sourcemap: process.env.MINIFY === 'false',
		commonjsOptions: { include: [/node_modules/, /perf\//] },
	},
}));
