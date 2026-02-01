import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config';

export function resolve(resolvedConfig: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:resolve',
		resolveId: {
			filter: {
				id: prefixRegex(resolvedConfig.prefix),
			},
			handler(source) {
				const meteorModule = source.slice(resolvedConfig.prefix.length).replaceAll(':', '_');
				return {
					id: getId(meteorModule),
				};
			},
		},
	};

	function getId(meteorModule: string): string {
		return `${resolvedConfig.programsDir}/web.browser/packages/${meteorModule}.js`;
	}
}
