import type { Plugin } from 'vite';

import { loadInfo } from './lib/info';

export function rocketchatInfo(): Plugin {
	const rocketchatInfoId = 'rocketchat.info';
	const resolvedVirtualId = `\0${rocketchatInfoId}`;

	return {
		name: 'rocketchat-info',
		enforce: 'pre',
		resolveId: {
			handler(source) {
				if (source === rocketchatInfoId || source.endsWith('rocketchat.info')) {
					return resolvedVirtualId;
				}
			},
		},
		async load(id) {
			if (id === resolvedVirtualId) {
				const info = await loadInfo();
				return info;
			}
		},
	};
}
