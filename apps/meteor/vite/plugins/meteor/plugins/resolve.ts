import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

export function resolve(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:resolve',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: prefixRegex(resolvedConfig.prefix),
			},
			handler(source) {
				if (source.startsWith(resolvedConfig.prefix)) {
					const meteorModule = source.slice(resolvedConfig.prefix.length).replaceAll(':', '_');
					return {
						id: `${resolvedConfig.programsDir}/web.browser/packages/${meteorModule}.js`,
					};
				}
				return null;
			},
		},
	};
}
