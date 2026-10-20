// Builds the frame-cost microbench: OUT=<dir> vite build -c perf/micro/vite.config.mjs
import { defineConfig } from 'vite';

export default defineConfig({
	root: import.meta.dirname,
	base: './',
	logLevel: 'warn',
	define: {
		'process.env.NODE_ENV': JSON.stringify('production'),
		'process.env.TAMAGUI_CSS_LAYER': JSON.stringify('fuselage'),
	},
	oxc: { jsx: { runtime: 'automatic' } },
	build: { outDir: process.env.OUT, emptyOutDir: true },
});
