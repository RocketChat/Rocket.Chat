import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

export function globals(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:globals',
		enforce: 'pre',
		config() {
			return {
				define: {
					__meteor_runtime_config__: {
						meteorEnv: {
							NODE_ENV: process.env.NODE_ENV || 'development',
						},
						PUBLIC_SETTINGS: {},
						DISABLE_SOCKJS: resolvedConfig.disableSockJS,
						isModern: true,
						isClient: true,
					},
				},
			};
		},
	};
}
