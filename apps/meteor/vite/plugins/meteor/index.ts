import type * as vite from 'vite';

import { packages } from './plugins/packages.ts';
import { resolveMeteorProxy } from './plugins/proxy.ts';
import { runtime } from './plugins/runtime.ts';
import { resolveConfig, type PluginOptions } from './plugins/shared/config.ts';
import { stubs } from './plugins/stubs.ts';

export default function meteorPlugin(pluginConfig: PluginOptions = {}): vite.Plugin {
	const plugins: vite.Plugin[] = [];

	return {
		name: 'vite-plugin-meteor',
		enforce: 'post',
		config(userConfig, viteEnv) {
			const resolvedConfig = resolveConfig(pluginConfig, userConfig, viteEnv);
			plugins.push(packages(resolvedConfig), runtime(resolvedConfig), stubs(resolvedConfig));

			const proxy = resolveMeteorProxy(userConfig.server?.proxy, `http://127.0.0.1:${resolvedConfig.meteorServerPort}`);

			if (proxy) {
				const proxyConfig: vite.UserConfig = {
					server: {
						proxy,
					},
					preview: {
						proxy,
					},
				};
				return proxyConfig;
			}
		},
		configResolved(config) {
			Object.assign(config.plugins, [...config.plugins, ...plugins]);
		},
	};
}
