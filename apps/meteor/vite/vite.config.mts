import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssEasyImport from 'postcss-easy-import';
import postcssMediaMinmax from 'postcss-media-minmax';
import postcssNested from 'postcss-nested';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

import { distOnlyWorkspacePackages } from './workspacePackages.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const require = createRequire(import.meta.url);
const swiperRoot = dirname(require.resolve('swiper/package.json'));

// Replaces the rocketchat:version Meteor compiler plugin for `app/utils/rocketchat.info`.
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
				...JSON.parse(readFileSync(join(appRoot, 'app/utils/rocketchat.info'), 'utf8')),
				marketplaceApiVersion: require('@rocket.chat/apps-engine/package.json').version.replace(/^[^0-9]/g, ''),
				build: { date: new Date().toISOString() },
				commit: { hash: git('rev-parse HEAD'), branch: git('rev-parse --abbrev-ref HEAD') },
			};

			return `export const Info = ${JSON.stringify(info)};`;
		},
	};
};

// Swaps the modules that wrap Meteor's client runtime for their implementations in vite/native.
const nativeModules = (): Plugin => {
	const replacements = new Map(
		Object.entries({
			'client/meteor/accounts.ts': 'accounts.ts',
			'client/meteor/connection.ts': 'connection.ts',
			'client/meteor/overrides/index.ts': 'overrides.ts',
			'client/meteor/login/index.ts': 'login.ts',
			'client/lib/sdk/meteorBackedSdk.ts': 'meteorBackedSdk.ts',
			'client/lib/sdk/sdkTransportEnabled.ts': 'sdkTransportEnabled.ts',
			'client/lib/sdk/ddpProtocol.ts': 'ddpProtocol.ts',
			'client/lib/customOAuth/CustomOAuth.ts': 'CustomOAuth.ts',
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

// In dev the page is served by Vite instead of the Meteor server, which would otherwise inject this global.
const devRuntimeConfig = (): Plugin => ({
	name: 'rocketchat-dev-runtime-config',
	apply: 'serve',
	transformIndexHtml: () => [
		{
			tag: 'script',
			children: `window.__meteor_runtime_config__ = { ROOT_URL: window.location.origin + '/', ROOT_URL_PATH_PREFIX: '' };`,
			injectTo: 'head-prepend',
		},
	],
});

// Routes the running Rocket.Chat server answers; everything else is served by Vite.
const serverUrl = process.env.RC_SERVER_URL || 'http://localhost:3100';
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
];

// Cookies the server sets (rc_token for avatars and downloads) are scoped to its own domain; rewrite them to the dev origin.
const proxyTo = (options: { ws?: boolean } = {}) => ({
	target: serverUrl,
	changeOrigin: true,
	secure: true,
	cookieDomainRewrite: '',
	...options,
});

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

			const { name } = JSON.parse(readFileSync(manifest, 'utf8'));
			if (distOnly.has(name)) return [];

			const entry = ['src/index.ts', 'src/index.tsx'].map((file) => join(root, file)).find((file) => existsSync(file));
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
	'@rocket.chat/layout',
	'@rocket.chat/message-parser',
	'@rocket.chat/message-types',
	'@rocket.chat/mongo-adapter',
	'@rocket.chat/random',
	'@rocket.chat/rest-typings',
	'@rocket.chat/sha256',
	'@rocket.chat/styled',
	'@rocket.chat/tools',
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
	plugins: [
		react(),
		// React Compiler in the dev server only; the production bundle stays as Meteor builds it.
		babel({ presets: [reactCompilerPreset()] }).then((plugin) => ({ ...plugin, apply: 'serve' as const })),
		rocketchatInfo(),
		nativeModules(),
		devRuntimeConfig(),
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
		sourcemap: true,
	},
});
