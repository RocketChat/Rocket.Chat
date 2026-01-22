import path from 'node:path';

import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import { MeteorResolver } from '../lib/meteor.ts';
import type { ResolvedPluginOptions } from './shared/config.ts';

const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';

export function packages(config: ResolvedPluginOptions): Plugin {
	const browser = new MeteorResolver(path.resolve(config.programsDir, 'web.browser'));
	const server = new MeteorResolver(path.resolve(config.programsDir, 'server'));

	const browserPackages = new Map(
		browser.collectPackageEntries().map((entry) => {
			const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
			return [pkgName, entry.path];
		}),
	);

	const serverPackages = new Map(
		server.collectPackageEntries().map((entry) => {
			const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
			return [pkgName, entry.path];
		}),
	);

	const meteorSpecifierPrefix = 'meteor/';

	return {
		name: 'meteor:packages',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: prefixRegex(meteorSpecifierPrefix),
			},
			handler(source) {
				const packagePathMap = this.environment.name === 'client' ? browserPackages : serverPackages;
				if (source.startsWith(meteorSpecifierPrefix)) {
					const pkgName = source.slice(meteorSpecifierPrefix.length).split('?')[0].split('#')[0];
					if (!packagePathMap.has(pkgName)) {
						throw new Error(`Unknown Meteor package: ${pkgName}`);
					}
					return packageVirtualPrefix + pkgName;
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

				const resolver = this.environment.name === 'client' ? browser : server;

				if (this.environment.mode === 'build') {
					const pkgSource = await resolver.getPackageSource(pkgName);
					this.emitFile({
						type: 'prebuilt-chunk',
						fileName: `build_assets/${pkgName}.js`,
						code: pkgSource,
					});
				}

				const exportNames = await resolver.getExportNames(pkgName);
				const exportLines = exportNames.map(generateExportStatement);

				return `import '${runtimeImportId}';
import * as __meteorHostReactNamespace from 'react';
const __meteorHostReact = __meteorHostReactNamespace && __meteorHostReactNamespace.default ? __meteorHostReactNamespace.default : __meteorHostReactNamespace;
const __meteorRuntime = globalThis.Package;
if (!__meteorRuntime || typeof __meteorRuntime._promise !== 'function') {
	throw new Error('Meteor runtime failed to initialize before loading package "${pkgName}".');
}
await __meteorRuntime._promise('${pkgName}');
const __meteorModules = __meteorRuntime.modules;
const __meteorInstall = __meteorModules && __meteorModules.meteorInstall;
if (typeof __meteorInstall !== 'function') {
	throw new Error('Meteor modules runtime failed to initialize before loading package "${pkgName}".');
}
const __meteorReactShimKey = '__meteorHostReactShimInstalled';
if (!globalThis[__meteorReactShimKey]) {
	const __meteorReactFactory = (require, exports, module) => {
		module.exports = __meteorHostReact;
		module.exports.default = __meteorHostReact;
	};
	__meteorInstall({
		node_modules: {
			react: {
				'index.js': __meteorReactFactory,
			},
			'react.js': __meteorReactFactory,
		},
	});
	globalThis[__meteorReactShimKey] = true;
}
const __meteorRequire = __meteorInstall();
const __meteorModuleIds = ['meteor/${pkgName}.js', 'meteor/${pkgName}'];
let __meteorModuleNamespace;
let __meteorRequireError;
for (const candidateId of __meteorModuleIds) {
	try {
		__meteorModuleNamespace = __meteorRequire(candidateId);
		if (__meteorModuleNamespace) {
			break;
		}
	} catch (error) {
		__meteorRequireError = error;
	}
}
if (!__meteorModuleNamespace) {
	throw __meteorRequireError || new Error('Meteor package "${pkgName}" could not be required.');
}
const __meteorDefaultExport = __meteorModuleNamespace && __meteorModuleNamespace.__esModule && 'default' in __meteorModuleNamespace
	? __meteorModuleNamespace.default
	: __meteorModuleNamespace;
${exportLines.join('\n')}
`;
			},
		},
	};

	function generateExportStatement(name: string): string {
		switch (name) {
			case 'default':
				return 'export default __meteorDefaultExport;';
			case '__esModule':
				return '';
			case 'hasOwn':
				return `export const hasOwn = Object.hasOwn;`;
			case 'global':
				return `export const global = globalThis;`;
			case 'export':
				return '';
			default:
				return `export const ${name} = __meteorModuleNamespace['${name}'];`;
		}
	}
}
