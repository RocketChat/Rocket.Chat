// import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

import { MeteorResolver } from './lib/meteor';

const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');


const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';

export function meteorPackages(): Plugin {

	// const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));
	// All packages are considered as being available to be loaded not just the ones that are not in config.modules
	// const packageEntries = collectPackageEntries(manifest);

	// const packagePathMap = new Map(packageEntries.map((entry) => [entry.path.replace(/^packages\//, '').replace(/\.js$/, ''), entry.path]));
	const resolver = new MeteorResolver(meteorProgramDir);
	
	const packagePathMap = new Map(resolver.collectPackageEntries().map((entry) => {
		const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
		return [pkgName, entry.path];
	}));
	

	const meteorSpecifierPrefix = 'meteor/';

	return {
		name: 'meteor-packages',
		enforce: 'pre',
		resolveId(source) {
			if (source.startsWith(meteorSpecifierPrefix)) {
				const pkgName = source.slice(meteorSpecifierPrefix.length).split('?')[0].split('#')[0];
				if (!packagePathMap.has(pkgName)) {
					throw new Error(`Unknown Meteor package: ${pkgName}`);
				}
				return packageVirtualPrefix + pkgName;
			}

			return null;
		},
		async load(id) {
			if (id.includes(packageVirtualPrefix)) {
				const pkgName = id.slice(packageVirtualPrefix.length);

				const exportNames = await resolver.getExportNames(pkgName);
				const exportLines = exportNames.map(generateExportStatement);

				return `import '${runtimeImportId}';
const __meteorRegistry = globalThis.Package;
if (!__meteorRegistry || typeof __meteorRegistry._promise !== 'function') {
  throw new Error('Meteor runtime failed to initialize before loading package "${pkgName}".');
}
const __meteorPackage = await __meteorRegistry._promise('${pkgName}');
${exportLines.join('\n')}
`;
			}

			return null;
		},
	};

	

	

	

	function generateExportStatement(name: string): string {
		switch (name) {
			case 'default':
				return `export default __meteorPackage['${name}'];`;
			case '__esModule':
				return '';
			case 'hasOwn':
				return `export const hasOwn = Object.hasOwn;`;
			case 'global':
				return `export const global = globalThis;`;
			case 'export':
				return '';
			default:
				return `export const ${name} = __meteorPackage['${name}'];`;
		}
	}
}
