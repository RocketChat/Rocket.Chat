import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { tamaguiPlugin } from '@tamagui/vite-plugin';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssEasyImport from 'postcss-easy-import';
import postcssMediaMinmax from 'postcss-media-minmax';
import postcssNested from 'postcss-nested';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import { staticBox } from './staticBox/plugin';
import { distOnlyWorkspacePackages } from './workspacePackages.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const require = createRequire(import.meta.url);
const swiperRoot = dirname(require.resolve('swiper/package.json'));

// Replaces the rocketchat:version Meteor compiler plugin for `rocketchat.info`.
const rocketchatInfo = (): Plugin => {
	const virtualId = '\0rocketchat-info';

	const git = (command: string) => {
		try {
			return execSync(`git ${command}`, { cwd: appRoot, encoding: 'utf8' }).trim();
		} catch {
			return undefined;
		}
	};

	return {
		name: 'rocketchat-info',
		enforce: 'pre',
		resolveId: (id) => (id.endsWith('rocketchat.info') ? virtualId : undefined),
		load: (id) => {
			if (id !== virtualId) return undefined;

			const info = {
				...JSON.parse(readFileSync(join(appRoot, 'rocketchat.info'), 'utf8')),
				marketplaceApiVersion: require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, ''),
				build: { date: new Date().toISOString() },
				commit: { hash: git('rev-parse HEAD'), branch: git('rev-parse --abbrev-ref HEAD') },
			};

			return `export const Info = ${JSON.stringify(info)};`;
		},
	};
};

// The Rocket.Chat server serves the client itself (`RC_CLIENT_TARGET=server`), or another host serves it in front of
// a proxy to the server (the default, used by the dev server and ui-preview).
const servedByServer = process.env.RC_CLIENT_TARGET === 'server';

type Instrumenter = {
	instrumentSync(code: string, filename: string, inputSourceMap?: unknown): string;
	lastSourceMap(): unknown;
};

// Coverage builds (`BABEL_ENV=coverage`, as CI sets it) count which app code the e2e tests run, which they read from
// `window.__coverage__`. Files are named by their absolute path, the form the coverage reports expect.
const coverage = (): Plugin => {
	const { createInstrumenter } = require('istanbul-lib-instrument') as {
		createInstrumenter: (options: Record<string, unknown>) => Instrumenter;
	};
	const instrumenter = createInstrumenter({ esModules: true, compact: false, produceSourceMap: true });

	return {
		name: 'rocketchat-coverage',
		apply: 'build',
		enforce: 'post',
		transform(code, id) {
			const file = id.split('?')[0];
			if (!file.startsWith(appRoot) || file.includes('/node_modules/') || !/\.[cm]?[jt]sx?$/.test(file)) {
				return null;
			}

			return { code: instrumenter.instrumentSync(code, file, this.getCombinedSourcemap()), map: instrumenter.lastSourceMap() as never };
		},
	};
};

// A production install has the peer and dev dependencies of workspace packages only in the app, so an import a
// package compiled from source cannot resolve from its own folder is resolved from the app, as Meteor's build does.
const appFallbackResolve = (): Plugin => ({
	name: 'rocketchat-app-fallback-resolve',
	enforce: 'pre',
	async resolveId(source, importer, options) {
		if (!importer || source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) return null;

		const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
		return resolved ?? this.resolve(source, join(appRoot, 'package.json'), { ...options, skipSelf: true });
	},
});

// A package reached through both `import` and `require` (Fuselage ships CommonJS only) would otherwise be bundled
// twice, once per format, and the two copies don't share React contexts (react-aria's overlays, for one). Resolving
// `require` like `import` loads each package once, as Meteor's build does.
const singlePackageFormat = (): Plugin => ({
	name: 'rocketchat-single-package-format',
	apply: 'build',
	enforce: 'pre',
	async resolveId(source, importer, options) {
		const { kind } = options as { kind?: string };
		if (kind !== 'require-call' || !importer || source.startsWith('.') || source.startsWith('/') || source.startsWith('\0')) {
			return null;
		}

		return this.resolve(source, importer, { ...options, kind: 'import-statement', skipSelf: true } as typeof options);
	},
});

// Swaps the modules whose behaviour behind a proxy differs for their implementations in vite/native.
const nativeModules = (): Plugin => {
	const replacements = new Map(
		Object.entries({
			'client/lib/getURL.ts': 'getURL.ts',
		}).map(([original, native]) => [join(appRoot, original), join(here, 'native', native)]),
	);

	return {
		name: 'rocketchat-native-modules',
		enforce: 'pre',
		async resolveId(source, importer, options) {
			if (!importer || !(source.startsWith('.') || source.startsWith('/'))) return null;

			const resolved = await this.resolve(source, importer, { ...options, skipSelf: true });
			return (resolved && replacements.get(resolved.id.split('?')[0])) ?? null;
		},
	};
};

const fuselageRoot = resolve(appRoot, '../../packages/fuselage');

// Routes the running Rocket.Chat server answers; everything else is served by Vite.
const serverUrl = process.env.RC_SERVER_URL || 'http://localhost:3100';

// In dev the page is the one the local server renders, as in production, with Vite's entry in place of the built one.
// A remote server renders its own built client, so against one (or while the local server is still starting) the page
// is `index.html` with the runtime config the server would otherwise inject.
const devPage = (): Plugin => ({
	name: 'rocketchat-dev-page',
	apply: 'serve',
	transformIndexHtml: {
		order: 'pre',
		handler: async (html, { originalUrl }) => {
			if (process.env.RC_DEV_SERVER_PAGE === '1') {
				try {
					const response = await fetch(new URL(originalUrl ?? '/', serverUrl), { headers: { accept: 'text/html' } });
					if (response.ok) {
						return (await response.text()).replace('</head>', '<script type="module" src="/entry.ts"></script>\n</head>');
					}
				} catch {
					// The local server is not up yet.
				}
			}

			return html.replace(
				'<head>',
				`<head>\n<script>window.__meteor_runtime_config__ = { ROOT_URL: window.location.origin + '/', ROOT_URL_PATH_PREFIX: '' };</script>`,
			);
		},
	},
});
const serverRoutes = [
	'/api',
	'/_oauth',
	'/_saml',
	'/_cas',
	'/_accounts',
	'/_timesync',
	'/i18n',
	'/avatar',
	'/emoji-custom',
	'/custom-sounds',
	'/file-upload',
	'/file-decrypt',
	'/ufs',
	'/data-export',
	'/assets',
	'/livechat',
	'/theme.css',
	'/robots.txt',
	'^/css-theme',
	'^/scripts_',
	// What the page the server renders loads from Meteor itself: the runtime config and the files of its (empty)
	// client program, all versioned by a query parameter, and the source maps of those files.
	'^/[^?]*\\?(hash|meteor_js_resource|meteor_css_resource)=',
	'^/(packages|app)/[0-9a-f]+\\.map$',
	'/__meteor__',
];

// Cookies the server sets (rc_token for avatars and downloads) are scoped to its own domain; rewrite them to the dev origin.
const proxyTo = (options: { ws?: boolean } = {}) => ({
	target: serverUrl,
	changeOrigin: true,
	secure: true,
	cookieDomainRewrite: '',
	...options,
});

// Lazy modules every page loads as it starts, whatever the route: the routes the client imports on startup and the
// layout the root renders. They ship together, and each keeps its own initialization.
const bootModules = new Set(
	[
		'client/meteor/login/index.ts',
		'client/startup/index.ts',
		'client/views/omnichannel/index.ts',
		'client/views/admin/index.ts',
		'client/views/marketplace/index.ts',
		'client/views/account/index.ts',
		'client/providers/MeteorProvider.tsx',
		'client/views/root/AppLayout.tsx',
		'client/views/root/MainLayout/MainLayout.tsx',
		'client/views/banners/BannerRegion.tsx',
		'client/views/cloud/CloudAnnouncementsRegion.tsx',
		'client/components/connectionStatus/ConnectionStatusBar.tsx',
		'client/components/AppLayoutThemeWrapper.tsx',
		'client/components/ActionManagerBusyState.tsx',
	].map((file) => join(appRoot, file)),
);

const distOnly = new Set(distOnlyWorkspacePackages);

// Every other workspace package is compiled from its source, so the client needs no package build and edits to
// them hot-reload like app code. RC_WORKSPACE_DIST=1 reads them from dist instead.
const findWorkspaceSources = (): { name: string; root: string; entry: string | undefined }[] => {
	if (process.env.RC_WORKSPACE_DIST === '1') {
		return [];
	}

	const workspaceRoot = resolve(appRoot, '../..');
	return ['packages', 'ee/packages'].flatMap((dir) =>
		readdirSync(join(workspaceRoot, dir)).flatMap((folder) => {
			const root = join(workspaceRoot, dir, folder);
			const manifest = join(root, 'package.json');
			if (!existsSync(manifest) || !existsSync(join(root, 'src'))) return [];

			const { name, main, browser } = JSON.parse(readFileSync(manifest, 'utf8'));
			if (distOnly.has(name)) return [];

			// The declared client entry pointed back at its source (`./dist/main.client.js` → `src/main.client.ts`).
			const declared: string | undefined = typeof browser === 'string' ? browser : main;
			const declaredSource = declared?.replace(/^(\.\/)?dist\//, 'src/').replace(/\.js$/, '');
			const entry = [...(declaredSource ? [`${declaredSource}.ts`, `${declaredSource}.tsx`] : []), 'src/index.ts', 'src/index.tsx']
				.map((file) => join(root, file))
				.find((file) => existsSync(file));
			return [{ name, root, entry }];
		}),
	);
};

const workspaceSources = findWorkspaceSources();

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// A package's own entry, and deep imports into its dist (`@rocket.chat/x/dist/y`), both land on its source.
const workspaceSourceAliases = workspaceSources.flatMap(({ name, root, entry }) => [
	...(entry ? [{ find: new RegExp(`^${escapeRegExp(name)}$`), replacement: entry }] : []),
	{ find: new RegExp(`^${escapeRegExp(name)}/dist/(.+)$`), replacement: `${join(root, 'src')}/$1` },
]);

const isServedFromSource = (dep: string) =>
	workspaceSources.some(({ name, entry }) => (dep === name && entry) || dep.startsWith(`${name}/dist/`));

// Linked workspace packages read from dist are CommonJS, which the dev server does not convert to ESM unless they
// are listed here. The production build handles the interop on its own.
const prebundledWorkspaceDeps = [
	'@rocket.chat/ai-search',
	'@rocket.chat/api-client',
	'@rocket.chat/apps-engine/definition/AppStatus',
	'@rocket.chat/apps-engine/definition/ui',
	'@rocket.chat/apps/dist/client/AppClientManager',
	'@rocket.chat/apps/dist/client/AppsEngineUIHost',
	'@rocket.chat/authorization/dist/AuthorizationUtils',
	'@rocket.chat/base64',
	'@rocket.chat/core-typings',
	'@rocket.chat/css-in-js',
	'@rocket.chat/ddp-client',
	'@rocket.chat/emitter',
	'@rocket.chat/favicon',
	'@rocket.chat/fuselage',
	'@rocket.chat/fuselage-forms',
	'@rocket.chat/fuselage-hooks',
	'@rocket.chat/fuselage-toastbar',
	'@rocket.chat/fuselage-ui-kit',
	'@rocket.chat/gazzodown',
	'@rocket.chat/gazzodown-alt',
	'@rocket.chat/i18n',
	'@rocket.chat/icons',
	'@rocket.chat/layout',
	'@rocket.chat/message-parser',
	'@rocket.chat/message-types',
	'@rocket.chat/mongo-adapter',
	'@rocket.chat/random',
	'@rocket.chat/rest-typings',
	'@rocket.chat/sha256',
	'@rocket.chat/styled',
	'@rocket.chat/tools',
	'@rocket.chat/ui-account',
	'@rocket.chat/ui-avatar',
	'@rocket.chat/ui-client',
	'@rocket.chat/ui-composer',
	'@rocket.chat/ui-conference',
	'@rocket.chat/ui-contexts',
	'@rocket.chat/ui-kit',
	'@rocket.chat/ui-video-conf',
	'@rocket.chat/ui-voip',
	'@rocket.chat/web-ui-registration',
];

export default defineConfig({
	root: here,
	publicDir: join(appRoot, 'public'),
	// Relative, so chunks, fonts and images resolve from wherever the entry is loaded: a CDN, a path prefix or the root.
	base: './',
	plugins: [
		staticBox(),
		react(),
		appFallbackResolve(),
		singlePackageFormat(),
		rocketchatInfo(),
		...(servedByServer ? [] : [nativeModules()]),
		...(servedByServer && process.env.BABEL_ENV === 'coverage' ? [coverage()] : []),
		devPage(),
		// Fuselage's `styled()` frames compile to static classes and CSS, so no Tamagui code ships to the browser.
		// `components` stays empty: warming up Fuselage evaluates its stylesheets outside this config and fails.
		tamaguiPlugin({
			config: join(fuselageRoot, 'src/tamagui.config.ts'),
			components: [],
			outputCSS: './.tamagui/zero/tamagui-zero.css',
			experimental: { zeroRuntime: true },
		}),
	],
	resolve: {
		alias: [
			{ find: /^meteor\/.*$/, replacement: join(here, 'shims/meteor.ts') },
			// Source reaches into swiper's internals through deep paths its `exports` field does not list.
			{ find: /^swiper\/swiper-react\.mjs$/, replacement: join(swiperRoot, 'swiper-react.mjs') },
			{ find: /^swiper\/modules\/index\.mjs$/, replacement: join(swiperRoot, 'modules/index.mjs') },
			{ find: /^swiper\/swiper\.css$/, replacement: join(swiperRoot, 'swiper.css') },
			{ find: /^swiper\/modules\/zoom\.css$/, replacement: join(swiperRoot, 'modules/zoom.css') },
			...workspaceSourceAliases,
		],
		dedupe: ['react', 'react-dom', 'i18next', 'react-i18next', '@tanstack/react-query', '@rocket.chat/fuselage'],
	},
	define: {
		'process.env.TEST_MODE': JSON.stringify(process.env.TEST_MODE),
		'process.env.MESSAGE_MAX_PARSE_LENGTH': JSON.stringify(process.env.MESSAGE_MAX_PARSE_LENGTH),
	},
	css: {
		preprocessorOptions: {
			scss: {
				// Fuselage's stylesheets import the tokens as `~@rocket.chat/fuselage-tokens/...`, the webpack form.
				importers: [
					{
						findFileUrl: (url: string) => (url.startsWith('~') ? pathToFileURL(require.resolve(url.slice(1))) : null),
					},
				],
				charset: false,
			},
		},
		postcss: {
			plugins: [postcssEasyImport(), postcssCustomProperties({ preserve: true }), postcssMediaMinmax(), postcssNested(), autoprefixer()],
		},
	},
	optimizeDeps: {
		include: prebundledWorkspaceDeps.filter((dep) => !isServedFromSource(dep)),
	},
	server: {
		port: Number(process.env.PORT) || 3000,
		// Same default as the Meteor server this replaces in dev.
		host: process.env.BIND_IP || '0.0.0.0',
		strictPort: true,
		proxy: {
			...Object.fromEntries(serverRoutes.map((route) => [route, proxyTo()])),
			'/websocket': proxyTo({ ws: true }),
			'/sockjs': proxyTo({ ws: true }),
		},
	},
	build: {
		outDir: join(here, 'dist'),
		// `/assets` is a server route (logos, favicons), proxied in dev and preview.
		assetsDir: 'bundle',
		emptyOutDir: true,
		// Minify stylesheets without rewriting their values, so they render as the Meteor build ships them.
		cssMinify: 'esbuild',
		// The server's images ship without the maps, so its chunks must not point browsers at them; the build tarball
		// keeps them for loading by hand (see docs/features/web-client-hosting.md).
		sourcemap: servedByServer ? 'hidden' : true,
		// The server reads it to inject the entry and its preloads into the page it renders.
		manifest: true,
		// The polyfill is an inline script, which the server's Content-Security-Policy blocks.
		modulePreload: { polyfill: false },
		rolldownOptions: {
			// Required by experimentalInlineCommonChunks.
			preserveEntrySignatures: false,
			output: {
				strictExecutionOrder: true,
				// What every page loads up front ships as a few chunks instead of dozens: the libraries apart, so their
				// chunk stays cached across releases, then the app code, then the routes the client imports as it starts.
				codeSplitting: {
					// A small chunk shared by lazy screens ships inside each screen that uses it instead of as its own file,
					// so opening a screen takes one request without downloading code it does not use.
					experimentalInlineCommonChunks: { maxSize: 20_000, exclude: /\.(css|scss|sass|less|styl|stylus|pcss|postcss|sss)(\?|$)/ },
					groups: [
						// Its direct eval keeps the minifier from renaming anything in the chunk that holds it.
						{ name: 'libphonenumber', test: /[\\/]google-libphonenumber[\\/]/, priority: 4 },
						{ name: 'vendor', test: /node_modules/, tags: ['$initial'], priority: 3 },
						{ name: 'app', tags: ['$initial'], priority: 2 },
						{ name: 'boot', test: (id: string) => bootModules.has(id.split('?')[0]), priority: 1 },
					],
				},
			},
		},
	},
});
