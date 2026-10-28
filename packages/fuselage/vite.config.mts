import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

import autoprefixer from 'autoprefixer';
import cssnanoPlugin from 'cssnano';
import { defineConfig, type Plugin } from 'vite';

import pkg from './package.json' with { type: 'json' };

const require = createRequire(import.meta.url);

/** `sass-loader` resolved `~pkg/file` through webpack; dart-sass needs help. */
const tildeImporter = {
	findFileUrl(url: string) {
		if (!url.startsWith('~')) {
			return null;
		}

		return pathToFileURL(require.resolve(url.slice(1)));
	},
};

/**
 * Library mode inlines every asset unconditionally -- `shouldInline` returns
 * true for `build.lib` before it ever looks at `assetsInlineLimit` -- and the
 * only escape hatch checked earlier is a `?no-inline` query. Tagging the url
 * here rather than in `inter.scss` keeps the sources usable by Storybook's
 * webpack sass chain.
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

const external = [...Object.keys(pkg.dependencies ?? {}), ...Object.keys(pkg.peerDependencies ?? {})].map(
	(dep) => new RegExp(`^${dep}(/.+)?$`),
);

export default defineConfig(({ mode }) => {
	const production = mode === 'production';

	return {
		plugins: [stripViteHashMarker()],
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
				entry: resolve(import.meta.dirname, 'src/index.runtime.ts'),
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
			preprocessorOptions: {
				scss: {
					importers: [tildeImporter],
					// `css-loader` used to drop this; a stray `@charset` is meaningless
					// in a stylesheet consumers concatenate.
					charset: false,
				},
			},
			postcss: {
				plugins: [markAssetsNoInline(), autoprefixer(), ...(production ? [cssnanoPlugin()] : [])],
			},
		},
	};
});
