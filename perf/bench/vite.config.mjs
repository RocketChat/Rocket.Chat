// Builds the bench page against one Fuselage dist: FUSELAGE_DIST=<dir> OUT=<dir> vite build -c perf/bench/vite.config.mjs
import { resolve } from 'node:path';

import { defineConfig } from 'vite';

const dist = process.env.FUSELAGE_DIST;

export default defineConfig({
	root: import.meta.dirname,
	base: './',
	logLevel: 'warn',
	resolve: {
		alias: {
			'fuselage-under-test-css': resolve(dist, 'fuselage.css'),
			'fuselage-under-test': resolve(dist, 'fuselage.production.js'),
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
});
