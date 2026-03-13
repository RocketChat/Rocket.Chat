import { exactRegex, makeIdFiltersToMatchWithQuery } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import { loadInfo } from './lib/generate';

export default function infoPlugin(): Plugin {
	const rocketchatInfoId = 'rocketchat.info';
	const resolvedVirtualId = `\0${rocketchatInfoId}`;

	return {
		name: 'rocketchat-info',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: makeIdFiltersToMatchWithQuery(/\.info$/),
			},
			handler(source) {
				if (source === rocketchatInfoId || source.endsWith('rocketchat.info')) {
					return resolvedVirtualId;
				}
			},
		},
		load: {
			filter: {
				id: exactRegex(resolvedVirtualId),
			},
			async handler(id) {
				if (id === resolvedVirtualId) {
					const info = await loadInfo();
					return info;
				}
			},
		},
	};
}
