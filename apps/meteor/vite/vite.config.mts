import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import postcssCustomProperties from 'postcss-custom-properties';
import postcssEasyImport from 'postcss-easy-import';
import postcssMediaMinmax from 'postcss-media-minmax';
import postcssNested from 'postcss-nested';
import type { Plugin } from 'vite';
import { defineConfig } from 'vite';

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
const serverUrl = process.env.RC_SERVER_URL || 'http://localhost:3000';
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

// Workspace packages are linked, so the dev server serves them as source and does not convert their CommonJS
// dist to ESM unless they are listed here. The production build handles the interop on its own.
const prebundledWorkspaceDeps = [
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
	'@rocket.chat/ui-contexts',
	'@rocket.chat/ui-kit',
	'@rocket.chat/ui-video-conf',
	'@rocket.chat/ui-voip',
	'@rocket.chat/web-ui-registration',
];

export default defineConfig({
	root: here,
	publicDir: join(appRoot, 'public'),
	plugins: [react(), rocketchatInfo(), devRuntimeConfig()],
	resolve: {
		alias: [
			{ find: /^meteor\/.*$/, replacement: join(here, 'shims/meteor.ts') },
			// Source reaches into swiper's internals through deep paths its `exports` field does not list.
			{ find: /^swiper\/swiper-react\.mjs$/, replacement: join(swiperRoot, 'swiper-react.mjs') },
			{ find: /^swiper\/modules\/index\.mjs$/, replacement: join(swiperRoot, 'modules/index.mjs') },
			{ find: /^swiper\/swiper\.css$/, replacement: join(swiperRoot, 'swiper.css') },
			{ find: /^swiper\/modules\/zoom\.css$/, replacement: join(swiperRoot, 'modules/zoom.css') },
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
		include: prebundledWorkspaceDeps,
	},
	server: {
		port: Number(process.env.PORT) || 4000,
		strictPort: true,
		proxy: {
			...Object.fromEntries(serverRoutes.map((route) => [route, { target: serverUrl, changeOrigin: true }])),
			'/websocket': { target: serverUrl, changeOrigin: true, ws: true },
			'/sockjs': { target: serverUrl, changeOrigin: true, ws: true },
		},
	},
	build: {
		outDir: join(here, 'dist'),
		emptyOutDir: true,
		sourcemap: true,
	},
});
