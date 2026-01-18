import fs from 'node:fs';
import path from 'node:path';

import type { CallExpression, Node, ObjectExpression, Program, PropertyKey } from '@oxc-project/types';
import { parseAst } from 'rolldown/parseAst';
import type { Plugin } from 'vite';

const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');
const meteorPackagesDir = path.join(meteorProgramDir, 'packages');
const meteorDynamicPackagesDir = path.join(meteorProgramDir, 'dynamic/node_modules/meteor');
const meteorManifestPath = path.join(meteorProgramDir, 'program.json');

const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';
const debugExports = process.env.DEBUG_METEOR_VITE_EXPORTS === 'true';

export function meteor(): Plugin {
	if (!fs.existsSync(meteorManifestPath)) {
		console.warn(`[meteor-packages] Missing manifest at ${meteorManifestPath}. Meteor packages will not be available.`);
		return { name: 'meteor-packages' };
	}

	const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));
	// All packages are considered as being available to be loaded not just the ones that are not in config.modules
	const packageEntries = collectPackageEntries(manifest);

	const packagePathMap = new Map(packageEntries.map((entry) => [entry.path.replace(/^packages\//, '').replace(/\.js$/, ''), entry.path]));
	const exportCache = new Map<string, Promise<string[]>>();

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

				const exportNames = await getExportNames(pkgName);
				const exportLines = exportNames.map(generateExportStatement);

				return `import '${runtimeImportId}';
const __meteorRegistry = globalThis.Package;
if (!__meteorRegistry || typeof __meteorRegistry._promise !== 'function') {
  throw new Error('Meteor runtime failed to initialize before loading package "${pkgName}".');
}
const __meteorPackage = await __meteorRegistry._promise('${pkgName}');
// export default __meteorPackage;
${exportLines.join('\n')}
`;
			}

			return null;
		},
	};

	function getExportNames(pkgName: string): Promise<string[]> {
		const exportCacheEntry = exportCache.get(pkgName);
		if (exportCacheEntry) {
			return exportCacheEntry;
		}

		const promise = (async () => {
			const names = new Set<string>();
			const packageFile = path.join(meteorPackagesDir, `${pkgName}.js`);
			if (fs.existsSync(packageFile)) {
				const code = fs.readFileSync(packageFile, 'utf-8');
				const ast = parse(code);
				collectConfigExports(ast, code, names);
				collectModuleExports(ast, names, pkgName);
			}

			const dynamicModuleFiles = await getDynamicPackageModuleFiles(pkgName);
			for (const moduleFile of dynamicModuleFiles) {
				const moduleCode = fs.readFileSync(moduleFile, 'utf-8');
				const moduleAst = parse(moduleCode);
				collectModuleExports(moduleAst, names, pkgName);
			}

			const sanitized = Array.from(names).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
			console.log(`[meteor-packages] exports for ${pkgName}:`, sanitized);
			return sanitized;
		})();

		exportCache.set(pkgName, promise);
		return promise;
	}

	async function getDynamicPackageModuleFiles(pkgName: string): Promise<string[]> {
		const dynamicRoot = path.join(meteorDynamicPackagesDir, pkgName);
		if (!fs.existsSync(dynamicRoot)) {
			return [];
		}

		const files: string[] = [];
		const stack = [dynamicRoot];
		while (stack.length > 0) {
			const current = stack.pop();
			if (!current) {
				continue;
			}
			let entries: fs.Dirent[] = [];
			try {
				entries = fs.readdirSync(current, { withFileTypes: true });
			} catch {
				continue;
			}

			for (const entry of entries) {
				const entryPath = path.join(current, entry.name);
				if (entry.isDirectory()) {
					stack.push(entryPath);
					continue;
				}

				if (!entry.isFile() || entry.name.endsWith('.map')) {
					continue;
				}

				const ext = path.extname(entry.name);
				if (ext === '.js' || ext === '.ts' || ext === '.tsx') {
					files.push(entryPath);
				}
			}
		}

		return files;
	}

	function collectPackageEntries(manifestData: { manifest: { where: string; type: string; path: string }[] }) {
		const manifestEntries = manifestData && Array.isArray(manifestData.manifest) ? manifestData.manifest : [];
		const fromManifest = manifestEntries.filter(
			(entry) => entry.where === 'client' && entry.type === 'js' && entry.path.startsWith('packages/'),
		);
		if (fromManifest.length > 0) {
			return fromManifest;
		}

		if (!fs.existsSync(meteorPackagesDir)) {
			console.warn(`[meteor-packages] Meteor client packages directory missing at ${meteorPackagesDir}`);
			return [];
		}

		const files = [];
		let dirEntries = [];
		try {
			dirEntries = fs.readdirSync(meteorPackagesDir, { withFileTypes: true });
		} catch (error) {
			console.warn(`[meteor-packages] Unable to read ${meteorPackagesDir}`, error);
			return [];
		}

		for (const entry of dirEntries) {
			if (!entry.isFile() || !entry.name.endsWith('.js')) {
				continue;
			}
			files.push({
				path: `packages/${entry.name}`,
				where: 'client',
				type: 'js',
			});
		}

		if (files.length === 0) {
			console.warn(
				`[meteor-packages] No individual package bundles found under ${meteorPackagesDir}. Run 'meteor run' once to regenerate development bundles before starting Vite.`,
			);
		}

		return files;
	}

	function collectConfigExports(ast: Program, code: string, names: Set<string>): void {
		const marker = '/* Exports */';
		const markerIndex = code.indexOf(marker);
		if (markerIndex === -1) {
			return;
		}

		let foundExport = false;

		walkAst(ast, (node) => {
			if (foundExport) {
				return;
			}

			// @ts-expect-error - node.start is not on the type definition but it is on the object
			const start = node.start ?? node.span?.start;

			if (typeof start === 'number' && start < markerIndex) {
				return;
			}

			if (node.type === 'ReturnStatement') {
				const arg = node.argument;
				if (arg && arg.type === 'ObjectExpression') {
					collectExportsFromObjectExpression(arg, names);
					foundExport = true;
				}
			}
		});
	}

	function collectExportsFromObjectExpression(node: ObjectExpression, names: Set<string>): void {
		for (const prop of node.properties) {
			if (!prop || prop.type !== 'Property' || prop.computed) {
				continue;
			}
			const keyName = getPropertyName(prop.key);

			if (keyName === 'export') {
				const { value } = prop;
				if (value.type === 'FunctionExpression' || value.type === 'ArrowFunctionExpression') {
					if (value.body?.type === 'BlockStatement') {
						for (const stmt of value.body.body) {
							if (stmt.type === 'ReturnStatement' && stmt.argument?.type === 'ObjectExpression') {
								collectExportsFromObjectExpression(stmt.argument, names);
							}
						}
					}
				}
				continue;
			}

			// If we handled 'export' above, we might not want to include other internal keys like 'require'
			// identifying if we are in the top-level config object vs the inner export object is tricky with this recursion
			// but typically 'export' is only present at the top level
			if (keyName && keyName !== 'require' && keyName !== 'eagerModulePaths') {
				names.add(keyName);
			}
		}
	}

	function parse(code: string): Program {
		try {
			return parseAst(code);
		} catch (error) {
			console.warn(`[meteor-packages] Failed to parse code for exports`, error);
			throw error;
		}
	}

	function collectModuleExports(ast: Program, names: Set<string>, pkgName: string): void {
		walkAst(ast, (node) => {
			if (!isModuleExportCall(node)) {
				return;
			}

			const [arg] = node.arguments;
			if (!arg || arg.type !== 'ObjectExpression') {
				return;
			}

			const beforeSize = names.size;
			collectExportsFromObjectExpression(arg, names);
			logNewExports(pkgName, names, beforeSize);
		});
	}

	function walkAst(node: Program, visitor: (node: Node) => void): void {
		if (!node || typeof node.type !== 'string') {
			return;
		}
		visitor(node);
		for (const value of Object.values(node)) {
			if (!value) {
				continue;
			}
			if (Array.isArray(value)) {
				for (const child of value) {
					if (child && typeof child.type === 'string') {
						walkAst(child, visitor);
					}
				}
			} else if (typeof value.type === 'string') {
				walkAst(value, visitor);
			}
		}
	}

	function isModuleExportCall(node: Node): node is CallExpression {
		if (!node || node.type !== 'CallExpression') {
			return false;
		}
		const { callee } = node;
		return (
			callee &&
			callee.type === 'MemberExpression' &&
			!callee.computed &&
			callee.object &&
			callee.object.type === 'Identifier' &&
			callee.object.name === 'module' &&
			callee.property &&
			callee.property.type === 'Identifier' &&
			callee.property.name === 'export'
		);
	}

	function getPropertyName(key: PropertyKey): string | undefined {
		if (key.type === 'Identifier') {
			return key.name;
		}
		if (key.type === 'Literal' && typeof key.value === 'string') {
			return key.value;
		}
		return undefined;
	}

	function logNewExports(pkgName: string, names: Set<string>, previousSize: number): void {
		if (!debugExports || names.size <= previousSize) {
			return;
		}
		const added = Array.from(names).slice(previousSize);
		if (added.length > 0) {
			console.log(`[meteor-packages] parsed exports for ${pkgName}:`, added);
		}
	}
}


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
