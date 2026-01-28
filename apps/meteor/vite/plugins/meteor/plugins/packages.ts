import path from 'node:path';

import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import { MeteorResolver } from '../lib/meteor.ts';
import type { ResolvedPluginOptions } from './shared/config.ts';

const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';

export function packages(config: ResolvedPluginOptions): Plugin {
	const resolver = new MeteorResolver(path.resolve(config.programsDir, 'web.browser'));

	const packages = new Map(
		resolver.collectPackageEntries().map((entry) => {
			const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
			return [pkgName, entry.path];
		}),
	);

	const meteorSpecifierPrefix = 'meteor/';

	return {
		name: 'meteor:packages',
		enforce: 'post',
		resolveId: {
			filter: {
				id: prefixRegex(meteorSpecifierPrefix),
			},
			handler(source) {
				if (source.startsWith(meteorSpecifierPrefix)) {
					const pkgName = source.slice(meteorSpecifierPrefix.length).split('?')[0].split('#')[0];
					if (!packages.has(pkgName)) {
						throw new Error(`Unknown Meteor package: ${pkgName}`);
					}
					return {
						id: `${packageVirtualPrefix}${pkgName}`,
					};
				}

				return null;
			},
		},
		load: {
			filter: {
				id: prefixRegex(packageVirtualPrefix),
			},
			async handler(id) {
				if (!id.startsWith(packageVirtualPrefix)) {
					return null;
				}

				const pkgName = id.slice(packageVirtualPrefix.length);

				const exportNames = await resolver.getExportNames(pkgName);

				return `import { require } from '${runtimeImportId}';
export const { ${exportNames.join(', ')} } = require('meteor/${pkgName}.js');
`;
			},
		},
	};
}
