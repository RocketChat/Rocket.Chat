import { exactRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

const typiaId = 'typia';
const resolvedVirtualId = `\0${typiaId}`;

export default function typiaPlugin(): Plugin {
	

	return {
		name: 'rocketchat-info',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: exactRegex(typiaId),
			},
			handler(source) {
				if (source === typiaId) {
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
					return `export default { json: { schemas: () => {}}};`;
				}
			},
		},
	};
}
