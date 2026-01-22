import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { meteorPackages } from './vite-plugins/meteor-packages';
import { meteorRuntime } from './vite-plugins/meteor-runtime';
import { meteorStubs } from './vite-plugins/meteor-stubs';
import { rocketchatInfo } from './vite-plugins/rocketchat-info';

const ROOT_URL = await getDefaultHostUrl();

console.log(`Using ROOT_URL: ${ROOT_URL.toString()}`);

const meteorModules = {
	'babel-compiler': null,
	'babel-runtime': null,
	'ddp-server': null,
	'ecmascript-runtime-client': null,
	'ecmascript-runtime': null,
	'ecmascript': null,
	'es5-shim': null,
	'fetch': 'window.fetch',
	'hot-code-push': null,
	'minifier-css': null,
	'modern-browsers': null,
	'mongo-dev-server': null,
	'promise': 'window.Promise',
	'react-fast-refresh': null,
	'shell-server': null,
	'standard-minifier-css': null,
	'typescript': null,
	'webapp-hashing': null,
	'webapp': null,
	'zodern_standard-minifier-js': null,
	'zodern_types': null,
	'ddp-rate-limiter': null,
	'url': 'globalThis',
	'email': null,
	'routepolicy': null,
	'oauth1': null,
	'oauth2': null,
	'rocketchat_version': null,
	'ddp': 'Package["ddp-client"].DDP',
	'meteor-base': null,
	'meteorhacks_inject-initial': null,
	'rocketchat_livechat': null,
	'rocketchat_mongo-config': null,
	'session': null,
	'ostrio_cookies': null,
};

export default defineConfig({
	appType: 'spa',
	plugins: [
		rocketchatInfo(),
		meteorRuntime({ modules: meteorModules, rootUrl: 'http://localhost:5173' }),
		meteorStubs({ modules: meteorModules }),
		meteorPackages(),
		react({
			exclude: [/\.meteor\/local\/build\/programs\/web\.browser\/packages\/.*/],
		}),
	],
	resolve: {
		dedupe: ['react', 'react-dom'],
		// preserveSymlinks: true,
		alias: {
			// Rocket.Chat Packages
			'@rocket.chat/api-client': path.resolve('../../packages/api-client/src/index.ts'),
			'@rocket.chat/apps-engine': path.resolve('../../packages/apps-engine/src'),
			'@rocket.chat/base64': path.resolve('../../packages/base64/src/base64.ts'),
			'@rocket.chat/core-typings': path.resolve('../../packages/core-typings/src/index.ts'),
			'@rocket.chat/favicon': path.resolve('../../packages/favicon/src/index.ts'),
			'@rocket.chat/fuselage-ui-kit': path.resolve('../../packages/fuselage-ui-kit/src/index.ts'),
			'@rocket.chat/gazzodown': path.resolve('../../packages/gazzodown/src/index.ts'),
			'@rocket.chat/message-types': path.resolve('../../packages/message-types/src/index.ts'),
			'@rocket.chat/password-policies': path.resolve('../../packages/password-policies/src/index.ts'),
			'@rocket.chat/random': path.resolve('../../packages/random/src/main.client.ts'),
			'@rocket.chat/sha256': path.resolve('../../packages/sha256/src/sha256.ts'),
			'@rocket.chat/tools': path.resolve('../../packages/tools/src/index.ts'),
			'@rocket.chat/ui-avatar': path.resolve('../../packages/ui-avatar/src/index.ts'),
			'@rocket.chat/ui-client': path.resolve('../../packages/ui-client/src/index.ts'),
			'@rocket.chat/ui-composer': path.resolve('../../packages/ui-composer/src/index.ts'),
			'@rocket.chat/ui-contexts': path.resolve('../../packages/ui-contexts/src/index.ts'),
			'@rocket.chat/ui-video-conf': path.resolve('../../packages/ui-video-conf/src/index.ts'),
			'@rocket.chat/ui-voip': path.resolve('../../packages/ui-voip/src/index.ts'),
			'@rocket.chat/web-ui-registration': path.resolve('../../packages/web-ui-registration/src/index.ts'),
			'@rocket.chat/mongo-adapter': path.resolve('../../packages/mongo-adapter/src/index.ts'),
			'@rocket.chat/media-signaling': path.resolve('../../packages/media-signaling/src/index.ts'),
			// Rocket.Chat Enterprise Packages
			'@rocket.chat/ui-theming': path.resolve('../../ee/packages/ui-theming/src/index.ts'),
			// Fuselage packages used in the Meteor app
			// '@rocket.chat/fuselage-hooks': path.resolve('../../../fuselage/packages/fuselage-hooks/src/index.ts'),
			// '@rocket.chat/layout': path.resolve('../../../fuselage/packages/layout/src/index.ts'),
			// '@rocket.chat/logo': path.resolve('../../../fuselage/packages/logo/src/index.ts'),
			// '@rocket.chat/onboarding-ui': path.resolve('../../../fuselage/packages/onboarding-ui/src/index.ts'),
			// '@rocket.chat/styled': path.resolve('../../../fuselage/packages/styled/src/index.ts'),
			// '@rocket.chat/fuselage': path.resolve('../../../fuselage/packages/fuselage/src/index.ts'),
			// '@rocket.chat/fuselage-tokens': path.resolve('../../../fuselage/packages/fuselage-tokens/src/index.ts'),
			// '@rocket.chat/fuselage-tokens/breakpoints.mjs': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.mjs'),
			// '@rocket.chat/fuselage-tokens/breakpoints.scss': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.scss'),
		},
	},
	build: {
		assetsDir: 'build_assets',
		sourcemap: true,
		minify: false
	},preview: {
		
	},
	server: {
		cors: true,
		origin: ROOT_URL.origin,
		allowedHosts: true,
		proxy: {
			'/api': { target: ROOT_URL.origin, changeOrigin: true },
			'/avatar': { target: ROOT_URL.origin, changeOrigin: true },
			'/assets': { target: ROOT_URL.origin, changeOrigin: true },
			'/images': { target: ROOT_URL.origin, changeOrigin: true },
			'/sockjs': { target: ROOT_URL.origin, ws: true, rewriteWsOrigin: true, changeOrigin: true, autoRewrite: true },
			'/file-upload': {
				target: ROOT_URL.origin,
				changeOrigin: true,
				// cookieDomainRewrite: '',
				configure: (proxy) => {
					proxy.on('proxyReq', (proxyReq) => {
						proxyReq.setHeader('Host', ROOT_URL.hostname);
						proxyReq.setHeader('Origin', ROOT_URL.origin);
						proxyReq.setHeader('Referer', `${ROOT_URL.origin}/`);
					});

					proxy.on('proxyRes', (proxyRes) => {
						if (proxyRes.headers.location) {
							try {
								const locationUrl = new URL(proxyRes.headers.location);
								if (locationUrl.hostname === ROOT_URL.hostname) {
									proxyRes.headers.location = locationUrl.pathname + locationUrl.search;
								}
							} catch (e) {
								// location is relative or invalid, ignore
							}
						}
					});
				},
			},
		},
	},
});

async function getDefaultHostUrl() {
	if (process.env.ROOT_URL) {
		return new URL(process.env.ROOT_URL);
	}

	// Check if http://localhost:3000 is reachable
	try {
		const response = await fetch('http://localhost:3000/api/info');
		if (response.ok) {
			return new URL('http://localhost:3000');
		}
	} catch {
		// Ignore errors
	}

	return new URL('https://unstable.qa.rocket.chat');
}
