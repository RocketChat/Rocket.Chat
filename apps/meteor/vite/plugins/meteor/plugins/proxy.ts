import type { Plugin, ProxyOptions, ServerOptions } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

function buildMeteorProxyConfig(userProxy: ServerOptions['proxy'], meteorProxyTarget: string) {
	if (userProxy && typeof userProxy !== 'object') {
		console.warn(
			'[vite-plugin-meteor] Unable to inject Meteor proxy defaults because `server.proxy` is not an object. ' +
				'Please configure SockJS/_timesync proxying manually.',
		);
		return undefined;
	}

	const proxyConfig: Record<string, string | ProxyOptions> = userProxy ? { ...userProxy } : {};
	let modified = false;

	const baseProxyOptions: ProxyOptions = {
		target: meteorProxyTarget,
		changeOrigin: true,
		secure: false,
	};

	const ensureProxy = (path: string, proxyOptions: ProxyOptions) => {
		if (proxyConfig[path]) {
			return;
		}
		proxyConfig[path] = proxyOptions;
		modified = true;
	};

	ensureProxy('/sockjs', {
		...baseProxyOptions,
		ws: true,
	});

	ensureProxy('/_timesync', {
		...baseProxyOptions,
	});

	return {
		proxy: proxyConfig,
		modified,
	};
}

function resolveMeteorProxy(
	userProxy: ServerOptions['proxy'],
	meteorProxyTarget: string,
): Record<string, string | ProxyOptions> | undefined {
	const proxyResult = buildMeteorProxyConfig(userProxy, meteorProxyTarget);
	return proxyResult?.proxy;
}

export function proxy(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:proxy',
		enforce: 'post',
		config(userConfig) {

			const proxy = resolveMeteorProxy(userConfig.server?.proxy, `http://127.0.0.1:${resolvedConfig.meteorServerPort}`);

			if (proxy) {
				return {
					server: {
						proxy,
					},
					preview: {
						proxy,
					},
				};
			}
		},
	}
}