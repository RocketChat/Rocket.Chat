import fs from 'node:fs';
import path from 'node:path';

import { parse } from '@babel/parser';
import type { ParseResult } from '@babel/parser';
import type { CallExpression, Node } from '@babel/types';
import type { Plugin } from 'vite';

const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');
const meteorPackagesDir = path.join(meteorProgramDir, 'packages');
const meteorDynamicPackagesDir = path.join(meteorProgramDir, 'dynamic/node_modules/meteor');
const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
const meteorBundleBasePath = '/.meteor/local/build/programs/web.browser/';

const runtimeVirtualId = '\0meteor-runtime';
const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';
const debugExports = process.env.DEBUG_METEOR_VITE_EXPORTS === 'true';

export function meteor(
	config: {
		modules: Record<string, null | string>;
	} = { modules: {} },
): Plugin {
	if (!fs.existsSync(meteorManifestPath)) {
		console.warn(`[meteor-packages] Missing manifest at ${meteorManifestPath}. Meteor packages will not be available.`);
		return { name: 'meteor-packages' };
	}

	const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));
	const packageEntries = collectPackageEntries(manifest).filter((entry) => {
		const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
		return !Object.keys(config.modules).includes(pkgName);
	});
	const runtimeModuleSource = createRuntimeModuleSource(packageEntries, buildRuntimeConfig(manifest));

	const packagePathMap = new Map(packageEntries.map((entry) => [entry.path.replace(/^packages\//, '').replace(/\.js$/, ''), entry.path]));

	const exportCache = new Map();

	const meteorSpecifierPrefix = 'meteor/';

	return {
		name: 'meteor-packages',
		enforce: 'pre',
		resolveId(source) {
			if (source === runtimeImportId) {
				return runtimeVirtualId;
			}

			if (source.startsWith(meteorSpecifierPrefix)) {
				const pkgName = source.slice(meteorSpecifierPrefix.length).split('?')[0].split('#')[0];
				if (!packagePathMap.has(pkgName)) {
					throw new Error(`Unknown Meteor package: ${pkgName}`);
				}
				return packageVirtualPrefix + pkgName;
			}

			return null;
		},
		transform: {
			filter: {
				// Only transform files in the Meteor packages
				// Starting from .meteor/local/build/programs/web.browser/packages/
				id: new RegExp(`^${meteorPackagesDir.replace(/\\/g, '\\\\')}/`),
			},
			handler(code, id, options) {
				if (options?.ssr) {
					return null;
				}

				const basename = path.basename(id);
				this.info(`[meteor-packages] Transforming Meteor package module: ${basename}`);

				if (basename === 'modules.js') {
					// Remove `install("<name>")` and `install("<name>", "<mainModule>")` calls for packages being replaced
					for (const moduleName of Object.keys(config.modules)) {
						const installRegex = new RegExp(`install\\(\\s*['"]${moduleName}['"](?:\\s*,\\s*['"][^'"]+['"])?\\s*\\);?`, 'g');
						code = code.replace(installRegex, (_match) => {
							this.info(`[meteor-packages] Removing install() call for replaced package: ${moduleName}`);
							return '';
						});
					}
				}

				// Replace Package['core-runtime'].queue(moduleName, function () { ... }); with await Package['core-runtime'].queue(moduleName, async function () { ... });
				// const queueRegex = new RegExp(`Package\\[['"]core-runtime['"]\\]\\.queue\\(\\s*(['"][^'"]+['"])\\s*,\\s*function\\s*\\(\\)\\s*{`, 'g');
				// code = code.replace(queueRegex, (_match, p1) => {
				// 	console.log(`[meteor-packages] Making core-runtime queue function async for module: ${p1}`);
				// 	return `await Package['core-runtime'].queue(${p1}, async function () {`;
				// });

				// Replace modules according to the provided mapping
				for (const [moduleName, replacement] of Object.entries(config.modules)) {
					// Replace `var X = Package.moduleName.X;` with `var X = replacement;`
					// Replace `var Y = Package['moduleName'].Y;` with `var Y = replacement;`
					// If replacement is null, replace with `undefined`
					const packageAccessRegex = new RegExp(
						`var\\s+([A-Za-z_$][\\w$]*)\\s*=\\s*Package(?:\\.|\\[')${moduleName}(?:'\\])?\\.\\s*([A-Za-z_$][\\w$]*);`,
						'g',
					);
					code = code.replace(packageAccessRegex, (_match, varName, exportName) => {
						const replacementValue = replacement === null ? 'undefined' : replacement;
						if (exportName === varName) {
							this.info(`[meteor-packages] Replacing package access for ${moduleName} with ${replacementValue}`);
							return `var ${varName} = ${replacementValue};`;
						}
						this.info(`[meteor-packages] Replacing package access for ${moduleName}.${exportName} with ${replacementValue}.${exportName}`);
						return `var ${varName} = ${replacementValue}.${exportName};`;
					});

					const requireRegex = new RegExp(`require\\(\\s*['"]meteor/${moduleName}['"]\\s*\\)`, 'g');
					code = code.replace(requireRegex, (_match) => {
						const replacementValue = replacement === null ? 'undefined' : replacement;
						this.info(`[meteor-packages] Replacing require() for meteor/${moduleName} with ${replacementValue}`);
						return replacementValue;
					});
				}

				return { code, map: null };
			},
		},
		load(id) {
			if (id === runtimeVirtualId) {
				return runtimeModuleSource;
			}

			if (id.includes(packageVirtualPrefix)) {
				const pkgName = id.slice(packageVirtualPrefix.length);

				const exportNames = getExportNames(pkgName);
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

	function getExportNames(pkgName: string): string[] {
		if (exportCache.has(pkgName)) {
			return exportCache.get(pkgName);
		}

		const names = new Set<string>();
		const packageFile = path.join(meteorPackagesDir, `${pkgName}.js`);
		if (fs.existsSync(packageFile)) {
			const code = fs.readFileSync(packageFile, 'utf-8');
			collectConfigExports(code, names);
			collectModuleExports(code, names, pkgName);
		}

		const dynamicModuleFiles = getDynamicPackageModuleFiles(pkgName);
		for (const moduleFile of dynamicModuleFiles) {
			const moduleCode = fs.readFileSync(moduleFile, 'utf-8');
			collectModuleExports(moduleCode, names, pkgName);
		}

		const sanitized = Array.from(names).filter((name) => /^[A-Za-z_$][\w$]*$/.test(name));
		exportCache.set(pkgName, sanitized);

		console.log(`[meteor-packages] exports for ${pkgName}:`, sanitized);
		return sanitized;
	}

	function getDynamicPackageModuleFiles(pkgName: string): string[] {
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

	function collectConfigExports(code: string, names: Set<string>): void {
		const marker = '/* Exports */';
		const markerIndex = code.indexOf(marker);
		if (markerIndex === -1) {
			return;
		}

		const firstBrace = code.indexOf('{', markerIndex);
		if (firstBrace === -1) {
			return;
		}

		const innerReturnIndex = code.indexOf('return', firstBrace);
		if (innerReturnIndex === -1) {
			return;
		}

		const innerBrace = code.indexOf('{', innerReturnIndex);
		if (innerBrace === -1) {
			return;
		}

		const objectLiteral = extractObjectLiteral(code, innerBrace);
		if (!objectLiteral) {
			return;
		}

		collectKeysFromObjectLiteral(objectLiteral, names);
	}

	function collectModuleExports(code: string, names: Set<string>, pkgName: string): void {
		let ast;
		try {
			ast = parse(code, {
				sourceType: 'module',
				plugins: ['topLevelAwait', 'classProperties', 'optionalChaining', 'objectRestSpread', 'dynamicImport'],
			});
		} catch (error) {
			console.warn(`[meteor-packages] Failed to parse exports for ${pkgName}`, error);
			return;
		}

		walkAst(ast, (node) => {
			if (!isModuleExportCall(node)) {
				return;
			}

			const [arg] = node.arguments;
			if (!arg || arg.type !== 'ObjectExpression') {
				return;
			}

			const beforeSize = names.size;
			for (const prop of arg.properties) {
				if (!prop || prop.type !== 'ObjectProperty' || prop.computed) {
					continue;
				}
				const keyName = getPropertyName(prop.key);
				if (keyName) {
					names.add(keyName);
				}
			}
			logNewExports(pkgName, names, beforeSize);
		});
	}

	function walkAst(node: ParseResult, visitor: (node: Node) => void): void {
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

	function getPropertyName(key: Node | null | undefined): string | undefined {
		if (!key) {
			return undefined;
		}
		if (key.type === 'Identifier') {
			return key.name;
		}
		if (key.type === 'StringLiteral') {
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

	function collectKeysFromObjectLiteral(objectLiteral: string, names: Set<string>): void {
		let depth = 0;
		for (let i = 0; i < objectLiteral.length; i++) {
			const char = objectLiteral[i];
			const next = objectLiteral[i + 1];

			if (char === '/' && next === '*') {
				const end = objectLiteral.indexOf('*/', i + 2);
				i = end === -1 ? objectLiteral.length : end + 1;
				continue;
			}

			if (char === '/' && next === '/') {
				const end = objectLiteral.indexOf('\n', i + 2);
				i = end === -1 ? objectLiteral.length : end;
				continue;
			}

			if (char === '{') {
				depth++;
				continue;
			}

			if (char === '}') {
				depth--;
				continue;
			}

			if (depth !== 1) {
				continue;
			}

			if (char === '"' || char === "'" || char === '`') {
				const key = readString(objectLiteral, i);
				if (key.value !== null) {
					i = key.index;
					const colonIndex = skipWhitespace(objectLiteral, i + 1);
					if (objectLiteral[colonIndex] === ':') {
						names.add(key.value);
						i = colonIndex;
					}
				}
				continue;
			}

			if (/[A-Za-z_$]/.test(char)) {
				let key = char;
				let j = i + 1;
				while (j < objectLiteral.length && /[A-Za-z0-9_$]/.test(objectLiteral[j])) {
					key += objectLiteral[j];
					j++;
				}
				const colonIndex = skipWhitespace(objectLiteral, j);
				if (objectLiteral[colonIndex] === ':') {
					names.add(key);
					i = colonIndex;
				} else {
					i = j - 1;
				}
				continue;
			}
		}

		function skipWhitespace(text: string, start: number): number {
			let idx = start;
			while (idx < text.length && /\s/.test(text[idx])) {
				idx++;
			}
			return idx;
		}

		function readString(text: string, start: number): { value: string | null; index: number } {
			const quote = text[start];
			let value = '';
			let idx = start + 1;
			while (idx < text.length) {
				const current = text[idx];
				if (current === '\\') {
					idx += 2;
					continue;
				}
				if (current === quote) {
					return { value, index: idx };
				}
				value += current;
				idx++;
			}
			return { value: null, index: text.length };
		}
	}

	function extractObjectLiteral(code: string, startBraceIndex: number): string | null {
		let depth = 0;
		let inString = null;
		let i = startBraceIndex;

		while (i < code.length) {
			const char = code[i];
			const prev = code[i - 1];

			if (inString) {
				if (char === inString && prev !== '\\') {
					inString = null;
				}
				i++;
				continue;
			}

			if (char === '"' || char === "'" || char === '`') {
				inString = char;
				i++;
				continue;
			}

			if (char === '/' && code[i + 1] === '*') {
				const end = code.indexOf('*/', i + 2);
				i = end === -1 ? code.length : end + 2;
				continue;
			}

			if (char === '/' && code[i + 1] === '/') {
				const end = code.indexOf('\n', i + 2);
				i = end === -1 ? code.length : end + 1;
				continue;
			}

			if (char === '{') {
				if (depth === 0) {
					startBraceIndex = i;
				}
				depth++;
			} else if (char === '}') {
				depth--;
				if (depth === 0) {
					return code.slice(startBraceIndex, i + 1);
				}
			}

			i++;
		}

		return null;
	}

	function createRuntimeModuleSource(entries: { path: string }[], runtimeConfig: object): string {
		console.log(`[meteor-packages] Creating Meteor runtime module with ${entries.length} package entries.`);
		for (const entry of entries) {
			console.log(`[meteor-packages] - ${entry.path}`);
		}
		const loadStatements = entries.map((entry) => `    await __loadMeteorScript('${entry.path}');`).join('\n');

		const runtimeConfigLiteral = JSON.stringify(runtimeConfig, null, 2);

		return `const __meteorBundleBase = '${meteorBundleBasePath}';
const __meteorLoadedScripts = new Map();
    const __meteorRuntimeDefaults = ${runtimeConfigLiteral};

    function __mergeRuntimeConfig(existing) {
        const merged = Object.assign({}, __meteorRuntimeDefaults, existing || {});
        merged.meteorEnv = Object.assign({}, __meteorRuntimeDefaults.meteorEnv || {}, existing && existing.meteorEnv || {});
        merged.PUBLIC_SETTINGS = Object.assign({}, __meteorRuntimeDefaults.PUBLIC_SETTINGS || {}, existing && existing.PUBLIC_SETTINGS || {});
        merged.autoupdate = existing && existing.autoupdate ? existing.autoupdate : (__meteorRuntimeDefaults.autoupdate || { versions: {} });
        return merged;
    }

    if (typeof window !== 'undefined') {
        window.__meteor_runtime_config__ = __mergeRuntimeConfig(window.__meteor_runtime_config__);
    }

function __loadMeteorScript(relPath) {
    if (typeof document === 'undefined') {
        throw new Error('Meteor client runtime is only available in a browser environment.');
    }

    if (__meteorLoadedScripts.has(relPath)) {
        return __meteorLoadedScripts.get(relPath);
    }

    const promise = new Promise((resolve, reject) => {
        const existing = document.head.querySelector('script[data-meteor-script="' + relPath + '"]');
        if (existing && existing.dataset.loaded === 'true') {
            resolve();
            return;
        }

        const script = existing || document.createElement('script');
        script.type = 'text/javascript';
        script.defer = false;
        script.dataset.meteorScript = relPath;
        if (!existing) {
            script.src = __meteorBundleBase + relPath;
            document.head.appendChild(script);
        }

        script.onload = () => {
            script.dataset.loaded = 'true';
            resolve();
        };

        script.onerror = () => {
            reject(new Error('Failed to load Meteor bundle script: ' + relPath));
        };
    });

    __meteorLoadedScripts.set(relPath, promise);
    return promise;
}

await (async () => {
${loadStatements}
})();
`;
	}

	function buildRuntimeConfig(manifestData: { manifest: { path: string; hash: string }[] }) {
		const releaseVersion = readReleaseVersion();
		const appId = readAppId();
		const defaultRootUrl = process.env.VITE_METEOR_ROOT_URL || process.env.METEOR_ROOT_URL || 'http://localhost:3000/';
		const rootUrlPrefix = process.env.VITE_METEOR_ROOT_URL_PATH_PREFIX || '';
		const ddpUrl = process.env.VITE_METEOR_DDP_URL || defaultRootUrl;
		const publicSettings = loadPublicSettings();
		const clientArch = 'web.browser';
		const appEntry = manifestData.manifest.find((entry) => entry.path === 'app/app.js');
		const clientVersion = appEntry ? appEntry.hash : `dev-${Date.now().toString(16)}`;

		return {
			meteorRelease: releaseVersion,
			appId,
			clientArch,
			isModern: true,
			ROOT_URL: ensureTrailingSlash(defaultRootUrl),
			ROOT_URL_PATH_PREFIX: rootUrlPrefix,
			DDP_DEFAULT_CONNECTION_URL: ensureTrailingSlash(ddpUrl),
			PUBLIC_SETTINGS: publicSettings,
			meteorEnv: {
				NODE_ENV: process.env.NODE_ENV === 'production' ? 'production' : 'development',
			},
			autoupdate: {
				versions: {
					[clientArch]: {
						version: clientVersion,
						versionRefreshable: clientVersion,
						versionNonRefreshable: clientVersion,
						assets: [],
					},
				},
			},
			reactFastRefreshEnabled: process.env.VITE_METEOR_FAST_REFRESH !== 'false',
		};
	}

	function ensureTrailingSlash(url: string) {
		if (!url) {
			return url;
		}
		return url.endsWith('/') ? url : `${url}/`;
	}

	function readReleaseVersion() {
		const releaseFile = path.resolve('.meteor/release');
		if (!fs.existsSync(releaseFile)) {
			return undefined;
		}
		return fs.readFileSync(releaseFile, 'utf-8').toString().trim();
	}

	function readAppId() {
		const idFile = path.resolve('.meteor/.id');
		if (!fs.existsSync(idFile)) {
			return undefined;
		}
		const contents = fs.readFileSync(idFile, 'utf-8').split('\n');
		for (const line of contents) {
			const trimmed = line.trim();
			if (trimmed && !trimmed.startsWith('#')) {
				return trimmed;
			}
		}
		return undefined;
	}

	function loadPublicSettings() {
		const envSettings = process.env.METEOR_SETTINGS || process.env.VITE_METEOR_SETTINGS;
		if (envSettings) {
			try {
				const parsed = JSON.parse(envSettings);
				return parsed.public || {};
			} catch (error) {
				console.warn('[meteor-packages] Failed to parse METEOR_SETTINGS JSON', error);
			}
		}

		const fallbackPaths = [path.resolve('settings.json'), path.resolve('.meteor/settings.json')];

		for (const candidate of fallbackPaths) {
			if (fs.existsSync(candidate)) {
				try {
					const contents = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
					return contents.public || {};
				} catch (error) {
					console.warn(`[meteor-packages] Failed to parse settings file at ${candidate}`, error);
				}
			}
		}

		return {};
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
		default:
			return `export const ${name} = __meteorPackage['${name}'];`;
	}
}
