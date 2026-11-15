import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const dateFnsRoot = dirname(require.resolve('date-fns/package.json'));

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

export default defineConfig(({ command }) => ({
	root: join(here, 'src'),
	publicDir: false,
	// Relative, so chunks and assets load from wherever the server mounts the widget.
	base: command === 'build' ? './' : '/',
	plugins: [svgComponent()],
	resolve: {
		alias: [
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
		// Linked workspace packages ship CommonJS, which the dev server only converts to ESM when listed here.
		include: [
			'@rocket.chat/core-typings',
			'@rocket.chat/ddp-client',
			'@rocket.chat/emitter',
			'@rocket.chat/gazzodown/dist/Markup',
			'@rocket.chat/logo',
			'@rocket.chat/message-parser',
			'@rocket.chat/random',
			'@rocket.chat/ui-contexts',
			'@rocket.chat/ui-kit',
		],
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
	},
}));
