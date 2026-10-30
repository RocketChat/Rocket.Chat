import { createHash } from 'node:crypto';
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { tamaguiPlugin } from '@tamagui/vite-plugin';
import type { Plugin, ResolvedConfig } from 'vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dateFnsRoot = dirname(require.resolve('date-fns/package.json'));
const fuselageRoot = join(here, '../fuselage');

// Imports an SVG as a Preact component that renders the file's markup inside an `<svg>` taking the file's attributes.
const svgComponent = (): Plugin => {
	const parseSvg: (this: unknown, source: string) => string = require('svg-loader');

	return {
		name: 'livechat-svg-component',
		enforce: 'pre',
		load(id) {
			if (!id.endsWith('.svg')) return null;

			const { attributes, content } = JSON.parse(parseSvg.call({}, readFileSync(id, 'utf8')).replace(/^module\.exports = /, ''));

			return `
import { h } from 'preact';
import { useEffect, useRef } from 'preact/hooks';

const attributes = ${JSON.stringify(attributes)};
const content = ${JSON.stringify(content)};

export default function SvgComponent(props) {
	const ref = useRef();

	useEffect(() => {
		const div = document.createElement('div');
		div.innerHTML = '<svg>' + content + '</svg>';

		const source = div.firstChild;
		const dest = ref.current;

		while (source.firstChild) {
			dest && dest.appendChild(source.firstChild);
		}
	}, []);

	return h('svg', Object.assign({ ref }, attributes, props));
}
`;
		},
	};
};

// The widget never loaded Fuselage's global stylesheet (fonts, normalize, every component's classes), and the
// widget's own styles are written without it.
const withoutFuselageGlobalStylesheet = (): Plugin => ({
	name: 'livechat-without-fuselage-global-stylesheet',
	enforce: 'pre',
	resolveId(source, importer) {
		return source === './index.scss' && importer === join(fuselageRoot, 'src/index.ts') ? '\0livechat-fuselage-index.scss' : null;
	},
	load(id) {
		return id === '\0livechat-fuselage-index.scss' ? '' : null;
	},
});

// Moves Tamagui's zero-runtime stylesheet next to the widget's other files under a content hash, linked from
// `index.html` the way its scripts are.
const zeroStylesheetWithWidget = (): Plugin => {
	let config: ResolvedConfig;

	return {
		name: 'livechat-zero-stylesheet-with-widget',
		apply: 'build',
		configResolved(resolved) {
			config = resolved;
		},
		// Tamagui writes the stylesheet when the bundle closes.
		closeBundle: {
			order: 'post',
			sequential: true,
			handler() {
				const { outDir } = config.build;
				const written = join(outDir, 'tamagui-zero.css');
				if (!existsSync(written)) {
					throw new Error(`Tamagui's zero-runtime stylesheet is missing from ${outDir}`);
				}

				const css = readFileSync(written);
				const file = `tamagui-zero-${createHash('sha256').update(css).digest('hex').slice(0, 8)}.css`;
				writeFileSync(join(outDir, file), css);
				rmSync(written);

				const indexHtml = join(outDir, 'index.html');
				const html = readFileSync(indexHtml, 'utf8');
				const href = `href="${config.base}tamagui-zero.css"`;
				if (!html.includes(href)) {
					throw new Error(`index.html does not link Tamagui's zero-runtime stylesheet as ${href}`);
				}
				writeFileSync(indexHtml, html.replace(href, `href="livechat/${file}"`));
			},
		},
	};
};

export default defineConfig(({ command }) => ({
	root: join(here, 'src'),
	publicDir: false,
	cacheDir: join(here, 'node_modules/.vite'),
	// Relative, so chunks and assets load from wherever the server mounts the widget.
	base: command === 'build' ? './' : '/',
	plugins: [
		svgComponent(),
		withoutFuselageGlobalStylesheet(),
		// Fuselage's `styled()` frames compile to static classes and CSS, so no Tamagui code ships to the browser.
		// `components` stays empty: warming up Fuselage evaluates its stylesheets outside this config and fails.
		tamaguiPlugin({
			config: join(fuselageRoot, 'src/tamagui.config.ts'),
			components: [],
			// The compiler only transforms the JSX under Vite's root; Fuselage's sources sit outside it.
			appSourceDirs: [join(fuselageRoot, 'src')],
			outputCSS: './.tamagui/zero/tamagui-zero.css',
			experimental: { zeroRuntime: true },
		}),
		zeroStylesheetWithWidget(),
	],
	resolve: {
		alias: [
			// Fuselage is compiled from its source, by the Tamagui compiler above.
			{ find: /^@rocket\.chat\/fuselage$/, replacement: join(fuselageRoot, 'src/index.ts') },
			{ find: 'react', replacement: 'preact/compat' },
			{ find: 'react-dom', replacement: 'preact/compat' },
			// date-fns' `exports` map hides the locale files from the dynamic import that picks one.
			{ find: /^date-fns\/locale\/(.*)$/, replacement: `${dateFnsRoot}/locale/$1` },
		],
	},
	css: {
		modules: {
			generateScopedName: '[local]__[hash:base64:5]',
		},
	},
	oxc: {
		jsx: { runtime: 'automatic', importSource: 'preact' },
	},
	experimental: {
		// The server renders `index.html` at `/livechat`, without a trailing slash, so the page reaches its files under `livechat/`.
		renderBuiltUrl: (filename, { hostType }) => (hostType === 'html' ? `livechat/${filename}` : { relative: true }),
	},
	optimizeDeps: {
		// Linked workspace packages shipping CommonJS, which the dev server only converts to ESM when listed here. The
		// ones reaching Fuselage ship ESM and stay out, so the Tamagui compiler sees Fuselage in dev too.
		include: [
			'@rocket.chat/core-typings',
			'@rocket.chat/ddp-client',
			'@rocket.chat/icons',
			'@rocket.chat/message-types',
			'@rocket.chat/random',
			'@rocket.chat/tools',
		],
		rolldownOptions: { shimMissingExports: true },
	},
	server: {
		port: 8080,
		host: '0.0.0.0',
		allowedHosts: true,
		open: true,
	},
	build: {
		outDir: join(here, 'dist'),
		emptyOutDir: true,
		assetsDir: '',
		sourcemap: true,
		// Keeps index.html free of inline scripts.
		modulePreload: { polyfill: false },
		rolldownOptions: {
			// Fuselage's sources import React 19 APIs Preact's compat layer lacks (`use`), from components the widget never
			// renders; they stay undefined, as they were when Fuselage came prebuilt.
			shimMissingExports: true,
		},
	},
}));
