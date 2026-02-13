import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig, esmExternalRequirePlugin, type BuildEnvironmentOptions } from 'vite';

import info from './vite/plugins/info';
import meteor from './vite/plugins/meteor';
import typia from './vite/plugins/typia';

const build = {
	emptyOutDir: true,
	assetsDir: 'static',
	manifest: true,
	target: 'esnext',
	rolldownOptions: {
		optimization: {
			inlineConst: true,
			pifeForModuleWrappers: true,
		},
		context: 'globalThis',
		checks: {
			circularDependency: true,
		},
		output: {
			format: 'esm',
			minify: true,
			cleanDir: true,
			externalLiveBindings: false,

			generatedCode: {
				preset: 'es2015',
			},
		},
	},
} as const satisfies BuildEnvironmentOptions;

export default defineConfig(async () => {
	const ROOT_URL = await getDefaultHostUrl();

	console.log(`Using ROOT_URL: ${ROOT_URL.toString()}`);

	return defineConfig({
		appType: 'spa',
		plugins: [
			info(),
			esmExternalRequirePlugin({
				external: ['react', 'react-dom'],
			}),
			meteor({
				rootUrl: ROOT_URL.toString(),
				treeshake: true,
			}),
			react({
				exclude: [/\.meteor\/local\/build\/programs\/web\.browser\/packages\/.*/],
			}),
			typia(),
			process.env.VITE_INSPECT === 'true' ? await import('vite-plugin-inspect').then(({ default: inspect }) => inspect()) : null,
		],
		build,
		resolve: {
			dedupe: ['react', 'react-dom', 'react-i18next', '@tanstack/react-query'],
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
				// '@rocket.chat/css-in-js': path.resolve('../../../fuselage/packages/css-in-js/src/index.ts'),
				// '@rocket.chat/fuselage': path.resolve('../../../fuselage/packages/fuselage/src/index.ts'),
				// '@rocket.chat/fuselage-tokens': path.resolve('../../../fuselage/packages/fuselage-tokens'),
				// '@rocket.chat/fuselage-tokens/breakpoints.mjs': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.mjs'),
				// '@rocket.chat/fuselage-tokens/breakpoints.scss': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.scss'),
			},
		},
		server: {
			cors: true,
			origin: ROOT_URL.origin,
			allowedHosts: [ROOT_URL.hostname, 's3.amazonaws.com'],
			proxy: {
				'/api': { target: ROOT_URL.origin, changeOrigin: true },
				'/avatar': { target: ROOT_URL.origin, changeOrigin: true },
				'/assets': { target: ROOT_URL.origin, changeOrigin: true },
				'/images': { target: ROOT_URL.origin, changeOrigin: true },
				'/emoji-custom': { target: ROOT_URL.origin, changeOrigin: true },
				'/sockjs': { target: ROOT_URL.origin, ws: true, rewriteWsOrigin: true, changeOrigin: true, autoRewrite: true },
				'/websocket': { target: ROOT_URL.origin, ws: true, rewriteWsOrigin: true, changeOrigin: true, autoRewrite: true },
				'/packages': { target: ROOT_URL.origin, changeOrigin: true },
				'/_oauth': { target: ROOT_URL.origin, changeOrigin: true, followRedirects: true },
				'/custom-sounds': { target: ROOT_URL.origin, changeOrigin: true },
				'/i18n': { target: ROOT_URL.origin, changeOrigin: true },
				'/file-decrypt': { target: ROOT_URL.origin, changeOrigin: true },
				'/robots.txt': { target: ROOT_URL.origin, changeOrigin: true },
				'/livechat': { target: ROOT_URL.origin, changeOrigin: true },
				'/health': { target: ROOT_URL.origin, changeOrigin: true },
				'/livez': { target: ROOT_URL.origin, changeOrigin: true },
				'/readyz': { target: ROOT_URL.origin, changeOrigin: true },
				'/requestSeats': { target: ROOT_URL.origin, changeOrigin: true },
				'/data-export': { target: ROOT_URL.origin, changeOrigin: true },

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
});

async function checkUrl(url: string | Request | URL): Promise<boolean> {
	try {
		const response = await fetch(url, { method: 'HEAD' });
		return response.ok;
	} catch {
		return false;
	}
}

async function getDefaultHostUrl() {
	if (process.env.ROOT_URL) {
		return new URL(process.env.ROOT_URL);
	}

	// Check if http://localhost:3000 is reachable
	if (await checkUrl('http://localhost:3000/api/info')) {
		return new URL('http://localhost:3000');
	}

	if (await checkUrl('https://unstable.qa.rocket.chat/api/info')) {
		return new URL('https://unstable.qa.rocket.chat');
	}

	if (await checkUrl('https://candidate.qa.rocket.chat/api/info')) {
		return new URL('https://candidate.qa.rocket.chat');
	}

	if (await checkUrl('https://open.rocket.chat/api/info')) {
		return new URL('https://open.rocket.chat');
	}

	throw new Error('Unable to determine ROOT_URL. Please set the ROOT_URL environment variable.');
}
