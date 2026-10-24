import { resolve } from 'node:path';

import { createTamaguiPlugins } from '@tamagui/vite-plugin';
import autoprefixer from 'autoprefixer';
import cssnanoPlugin from 'cssnano';
import { defineConfig, type Plugin } from 'vite';

import pkg from './package.json' with { type: 'json' };
import { prevalStyled } from './prevalStyled';

/**
 * Library mode inlines every asset unconditionally -- `shouldInline` returns
 * true for `build.lib` before it ever looks at `assetsInlineLimit` -- and the
 * only escape hatch checked earlier is a `?no-inline` query. Tagging the url
 * here rather than in `inter.css` keeps the sources usable by Storybook's
 * webpack css chain.
 */
const markAssetsNoInline = () => ({
	postcssPlugin: 'fuselage-no-inline-assets',
	Declaration(decl: { value: string }) {
		if (!decl.value.includes('url(')) {
			return;
		}

		decl.value = decl.value.replace(
			/url\((\s*['"]?)([^'")?]+\.woff2)(['"]?\s*)\)/g,
			(_match: string, open: string, url: string, close: string) => `url(${open}${url}?no-inline${close})`,
		);
	},
});

/**
 * `finalizeCss` unconditionally appends a `/*$vite$:1*\/` hash marker and a
 * later hook is supposed to strip it from every `.css` bundle asset. In this
 * library build it survives into the output, so it gets removed here.
 * Reproduces with `cssMinify` both on and off -- worth reporting upstream.
 */
const stripViteHashMarker = (): Plugin => ({
	name: 'fuselage-strip-vite-hash-marker',
	// Vite appends the marker from its own `generateBundle`, so this has to run
	// after every core plugin.
	enforce: 'post',
	generateBundle(_options, bundle) {
		for (const asset of Object.values(bundle)) {
			if (asset.type === 'asset' && asset.fileName.endsWith('.css')) {
				asset.source = String(asset.source).replace(/\/\*\$vite\$:\d+\*\//g, '');
			}
		}
	},
});

/**
 * `@tamagui/web` is bundled and reads its settings from `process.env` at
 * runtime, which consumers' bundlers don't define. Pinning them here also puts
 * every Tamagui rule in the `fuselage` cascade layer, below the unlayered
 * stylesheets -- `fuselage.css`, css-in-js, app and admin custom CSS -- that
 * used to override component styles by source order.
 */
const pinTamaguiEnv = (): Plugin => ({
	name: 'fuselage-pin-tamagui-env',
	transform(code, id) {
		if (!id.includes('/node_modules/@tamagui/')) {
			return null;
		}

		return {
			code: code.replace(/process\.env\.(?!NODE_ENV\b)(\w+)/g, (_match, name: string) =>
				name === 'TAMAGUI_CSS_LAYER' ? '"fuselage"' : 'undefined',
			),
			map: null,
		};
	},
});

const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})].map(
	(dep) => new RegExp(`^${dep}(/.+)?$`),
);

export default defineConfig(({ mode }) => {
	const production = mode === 'production';

	return {
		plugins: [
			// Turns each frame's options into literals first, since the compiler only reads literals in a module's own definitions
			prevalStyled(),
			// Flattens every frame use-site it can into a plain element with static classes; its CSS joins the runtime's in the
			// `fuselage` layer, below app CSS
			...createTamaguiPlugins({
				config: './src/tamagui.config.ts',
				components: [],
				wrapExtractedCSS: (css) => `@layer fuselage {\n${css}\n}`,
			}).plugins,
			pinTamaguiEnv(),
			stripViteHashMarker(),
		],
		// `index.js` only loads the production bundle under `NODE_ENV=production`,
		// so pinning it drops the development-only branches from that bundle.
		define: production ? { 'process.env.NODE_ENV': JSON.stringify('production') } : {},
		// Without this the emitted url is root-absolute (`/fonts/...`), which only
		// resolves for consumers serving the stylesheet from the domain root.
		base: './',
		build: {
			outDir: 'dist',
			emptyOutDir: false,
			// Library mode inlines every asset by default; the published stylesheet
			// has to reference `fonts/InterVariable.woff2` like webpack's did.
			assetsInlineLimit: 0,
			sourcemap: !production,
			minify: production ? 'terser' : false,
			// cssnano does the minifying, to match what webpack emitted.
			cssMinify: false,
			lib: {
				entry: resolve(import.meta.dirname, 'src/index.ts'),
				formats: ['cjs'],
				fileName: () => `fuselage.${mode}.js`,
			},
			rollupOptions: {
				external,
				output: {
					// Rollup's default (`if-default-prop`) omits `exports.__esModule`
					// for a module with no default export; webpack always set it, and
					// transpiled default imports interop off it.
					esModule: true,
					assetFileNames: (info) => {
						if (!info.names?.[0]?.endsWith('.css')) {
							return 'fonts/[name][extname]';
						}

						// Production keeps the published `fuselage.css` name consumers
						// import; development is suffixed like the bundles are.
						return production ? 'fuselage.css' : `fuselage.${mode}.css`;
					},
					...(production
						? {}
						: {
								banner: `'use strict';\n\nif (process.env.NODE_ENV !== "production") {\n(function() {\n`,
								footer: `\n})();\n}`,
							}),
				},
			},
		},
		css: {
			postcss: {
				plugins: [markAssetsNoInline(), autoprefixer(), ...(production ? [cssnanoPlugin()] : [])],
			},
		},
	};
});
