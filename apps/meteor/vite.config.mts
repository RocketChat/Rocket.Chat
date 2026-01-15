import fs from 'node:fs';
import path from 'node:path';

import { parse } from '@babel/parser';
import type { ParseResult } from '@babel/parser';
import type { CallExpression, Node } from '@babel/types';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { esmExternalRequirePlugin, } from 'vite';

const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');
const meteorPackagesDir = path.join(meteorProgramDir, 'packages');
const meteorDynamicPackagesDir = path.join(meteorProgramDir, 'dynamic/node_modules/meteor');
const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
const meteorBundleBasePath = '/.meteor/local/build/programs/web.browser/';

const runtimeVirtualId = '\0meteor-runtime';
const runtimeImportId = 'virtual:meteor-runtime';
const packageVirtualPrefix = '\0meteor-package:';
const debugExports = process.env.DEBUG_METEOR_VITE_EXPORTS === 'true';
const rocketchatInfoAlias = 'rocketchat.info';

function meteor(): Plugin {
	if (!fs.existsSync(meteorManifestPath)) {
		console.warn(`[meteor-packages] Missing manifest at ${meteorManifestPath}. Meteor packages will not be available.`);
		return { name: 'meteor-packages' };
	}

	const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));
	const packageEntries = collectPackageEntries(manifest);
	if (packageEntries.length === 0) {
		throw new Error(
			"[meteor-packages] Unable to locate any Meteor client package bundles. Run 'npm run start -- --once' to regenerate .meteor/local build artifacts.",
		);
	}
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

			if (source.startsWith(rocketchatInfoAlias)) {
				const pkgName = source.split('?')[0];
				return packageVirtualPrefix + pkgName;
			}

			return null;
		},
		load(id) {
			if (id === runtimeVirtualId) {
				return runtimeModuleSource;
			}

			if (id.includes(rocketchatInfoAlias)) {
				return `export const Info = {
    "version": "8.1.0-develop",
    "build": {
        "date": "2026-01-15T15:58:39.159Z",
        "nodeVersion": "v22.18.0",
        "arch": "arm64",
        "platform": "darwin",
        "osRelease": "24.6.0",
        "totalMemory": 38654705664,
        "freeMemory": 261406720,
        "cpus": 14
    },
    "marketplaceApiVersion": "1.59.0",
    "commit": {
        "hash": "e62836584b5ab204fe4091fa3362869fd6351264",
        "date": "Wed Jan 14 17:04:03 2026 -0300",
        "author": "Matheus Cardoso",
        "subject": "vite-meteor [skip ci]",
        "tag": "8.0.0",
        "branch": "vite-meteor"
    }
};
				export const minimumClientVersions = {
    "desktop": "3.9.6",
    "mobile": "4.39.0"
};`;
			}

			if (id.includes(packageVirtualPrefix)) {
				const pkgName = id.slice(packageVirtualPrefix.length);

				const exportNames = getExportNames(pkgName);
				const exportLines = exportNames
					.map(generateExportStatement)
					.join('\n');

				return `import '${runtimeImportId}';
const __meteorRegistry = globalThis.Package;
if (!__meteorRegistry || typeof __meteorRegistry._promise !== 'function') {
  throw new Error('Meteor runtime failed to initialize before loading package "${pkgName}".');
}
const __meteorPackage = await __meteorRegistry._promise('${pkgName}');
// export default __meteorPackage;
${exportLines}
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
		if (debugExports) {
			console.log(`[meteor-packages] exports for ${pkgName}:`, sanitized);
		}
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

	function collectPackageEntries(manifestData: { manifest: {where: string, type: string, path: string}[] }) {
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

export default defineConfig({
	appType: 'spa',
	plugins: [
		esmExternalRequirePlugin({
			external: ['react', 'react-dom'],
		}),
		meteor(),
		react({
			exclude: [/\.meteor\/local\/build\/programs\/web\.browser\/packages\/.*/],
			
		}),
	],
	resolve: {
		dedupe: ['react', 'react-dom'],
		// preserveSymlinks: true,
		alias: {
			// Rocket.Chat packages used in the Meteor app
			// 'child_process': path.resolve('client/emptyModule.ts'),
			// 'crypto': path.resolve('client/emptyModule.ts'),
			'@rocket.chat/core-typings': path.resolve('../../packages/core-typings/src/index.ts'),
			'@rocket.chat/random': path.resolve('../../packages/random/src/main.client.ts'),
			'@rocket.chat/sha256': path.resolve('../../packages/sha256/src/sha256.ts'),
			'@rocket.chat/api-client': path.resolve('../../packages/api-client/src/index.ts'),
			'@rocket.chat/tools': path.resolve('../../packages/tools/src/index.ts'),
			'@rocket.chat/apps-engine': path.resolve('../../packages/apps-engine/src'),
			'@rocket.chat/ui-theming': path.resolve('../../ee/packages/ui-theming/src/index.ts'),
			'@rocket.chat/ui-client': path.resolve('../../packages/ui-client/src/index.ts'),
			'@rocket.chat/gazzodown': path.resolve('../../packages/gazzodown/src/index.ts'),
			'@rocket.chat/favicon': path.resolve('../../packages/favicon/src/index.ts'),
			'@rocket.chat/message-types': path.resolve('../../packages/message-types/src/index.ts'),
			'@rocket.chat/ui-contexts': path.resolve('../../packages/ui-contexts/src/index.ts'),
			
			// Fuselage packages used in the Meteor app
			// '@rocket.chat/fuselage-hooks': path.resolve('../../../fuselage/packages/fuselage-hooks/src/index.ts'),
			// '@rocket.chat/layout': path.resolve('../../../fuselage/packages/layout/src/index.ts'),
			// '@rocket.chat/logo': path.resolve('../../../fuselage/packages/logo/src/index.ts'),
			// '@rocket.chat/onboarding-ui': path.resolve('../../../fuselage/packages/onboarding-ui/src/index.ts'),
			// '@rocket.chat/styled': path.resolve('../../../fuselage/packages/styled/src/index.ts'),
			// '@rocket.chat/fuselage': path.resolve('../../../fuselage/packages/fuselage/src/index.ts'),
			// '@rocket.chat/fuselage-tokens': path.resolve('../../../fuselage/packages/fuselage-tokens/src/index.ts'),
			// '@rocket.chat/fuselage-tokens/breakpoints.mjs': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.mjs'),
			// '@rocket.chat/fuselage-tokens/breakpoints.scss': path.resolve('../../../fuselage/packages/fuselage-tokens/breakpoints.scss'),
			// React and React DOM
			// 'react': path.resolve('../../node_modules/react'),
			// 'react-dom': path.resolve('../../node_modules/react-dom'),
		},
	},
	server: {
		cors: true,
		allowedHosts: ['localhost', '127.0.0.1'],
		proxy: {
			'/api': { target: 'http://localhost:3000', changeOrigin: true },
			'/avatar': { target: 'http://localhost:3000', changeOrigin: true },
			'/assets': { target: 'http://localhost:3000', changeOrigin: true },
			'/sockjs': { target: 'ws://localhost:3000', ws: true, rewriteWsOrigin: true },
			'/sockjs/info': { target: 'http://localhost:3000', changeOrigin: true },
		},
	},
});
function generateExportStatement(name: string): string {
	switch (name) {
		case 'default':
			return `export default __meteorPackage['${name}'];`;
		case '__esModule':
			return '';
		case 'hasOwn':
			return `export const hasOwn = Object.prototype.hasOwnProperty;`;
		default:
			return `export const ${name} = __meteorPackage['${name}'];`;
	}
}

