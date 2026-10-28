import { resolve } from 'node:path';

import { createTamaguiPlugins } from '@tamagui/vite-plugin';
import { defineConfig } from 'vite';

import { prevalStyled } from '../prevalStyled';

// `ZR=off` builds the same page on the Tamagui runtime, as the control
const zero = process.env.ZR !== 'off';

// Zero only transforms `.tsx` under Vite's `root`, so the root is the package and `src/` counts as app source
const root = resolve(import.meta.dirname, '..');

// Read by the config's `getCSS()` at build time: the base rules join the atomic ones in the `fuselage` layer, or the
// unlayered `:where(.is_View)` defaults would beat every frame style
process.env.TAMAGUI_CSS_LAYER = 'fuselage';

export default defineConfig({
	root,
	// The zero stylesheet is written at the output root, and a relative base would resolve it next to the nested HTML
	base: '/',
	plugins: [
		// Zero only reads literal `styled()` options; Fuselage builds them from token helpers
		prevalStyled(),
		...createTamaguiPlugins({
			config: './src/tamagui.config.ts',
			components: [],
			outputCSS: zero ? './zero-spike/.tamagui-zero.css' : undefined,
			experimental: zero ? { zeroRuntime: true } : undefined,
			wrapExtractedCSS: (css) => `@layer fuselage {\n${css}\n}`,
		}).plugins,
	],
	build: {
		outDir: resolve(import.meta.dirname, zero ? 'dist-zero' : 'dist-runtime'),
		emptyOutDir: true,
		minify: process.env.ZR_MINIFY !== 'off',
		rollupOptions: { input: resolve(import.meta.dirname, process.env.ZR_ENTRY ?? 'index.html') },
	},
});
