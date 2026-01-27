import fs from 'node:fs';
import path from 'node:path';

import { prefixRegex } from '@rolldown/pluginutils';
import type { EmittedFile } from 'rolldown';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config.ts';

// const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');
// const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
// const meteorBundleBasePath = '/.meteor/local/build/programs/web.browser/';
const runtimeVirtualId = '\0meteor-runtime';
const runtimeImportId = 'virtual:meteor-runtime';

export function runtime(config: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:runtime',
		enforce: 'pre',
		resolveId: {
			filter: {
				id: prefixRegex(runtimeImportId),
			},
			handler(source) {
				if (source === runtimeImportId) {
					return runtimeVirtualId;
				}
				return null;
			},
		},
		load: {
			filter: {
				id: prefixRegex(runtimeVirtualId),
			},
			handler(id) {
				if (id !== runtimeVirtualId) {
					return null;
				}

				const isBuild = this.environment.mode === 'build';
				const isClientEnvironment = this.environment.name === 'client';

				const meteorProgramDir = path.resolve(config.programsDir, isClientEnvironment ? 'web.browser' : 'server');
				const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
				let meteorClientBundleBasePath: string | undefined;
				if (isClientEnvironment) {
					const relativeProgramDir = path.relative(process.cwd(), meteorProgramDir).split(path.sep).join('/');
					const browserVisiblePath = relativeProgramDir.startsWith('/') ? relativeProgramDir : `/${relativeProgramDir}`;
					meteorClientBundleBasePath = ensureTrailingSlash(browserVisiblePath);
				}

				const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));

				const rawEntries = isClientEnvironment
					? collectClientPackageEntries(manifest, meteorProgramDir)
					: collectServerProgramEntries(manifest);
				const moduleOverrides = Object.keys(config.modules);
				// Collect packages that are not replaced by config.modules
				const packageEntries = rawEntries
					.filter((entry) => {
						if (!isClientEnvironment) {
							return true;
						}
						const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
						return !moduleOverrides.includes(pkgName);
					})
					.map((entry) => {
						return {
							path: isClientEnvironment && isBuild ? entry.path.replace('packages/', '') : entry.path,
						};
					});
				const serverNodeModuleRoots = isClientEnvironment ? [] : collectServerNodeModuleRoots(manifest, meteorProgramDir);

				if (isBuild && isClientEnvironment) {
					for (const entry of packageEntries) {
						this.emitFile({
							type: 'asset',
							fileName: entry.path,
							source: fs.readFileSync(path.join(meteorProgramDir, 'packages', entry.path), 'utf-8'),
						});
					}
				}

				const runtimeModuleSource = isClientEnvironment
					? createClientRuntimeModuleSource(
							packageEntries,
							buildRuntimeConfig(manifest),
							meteorClientBundleBasePath ?? '/', // ensured above when client
						)
					: createServerRuntimeModuleSource(
							packageEntries,
							buildRuntimeConfig(manifest),
							meteorProgramDir,
							serverNodeModuleRoots,
							path.resolve(config.projectRoot, '.meteor', 'local', 'vite-mongo'),
							path.resolve(config.projectRoot, '.meteor', 'local', 'db'),
							!isBuild,
							config.meteorServerPort,
						);

				if (this.environment.mode === 'build' && isClientEnvironment) {
					const file: EmittedFile = {
						type: 'prebuilt-chunk',
						fileName: 'meteor-runtime.js',
						code: runtimeModuleSource,
					};

					this.emitFile(file);
				}

				return runtimeModuleSource;
			},
		},
	};

	function buildRuntimeConfig(manifestData: { manifest?: { path: string; hash: string }[] }) {
		const releaseVersion = readReleaseVersion();
		const appId = readAppId();
		const defaultRootUrl = config.rootUrl;
		const rootUrlPrefix = process.env.VITE_METEOR_ROOT_URL_PATH_PREFIX || '';
		const ddpUrl = config.rootUrl;
		const publicSettings = loadPublicSettings();
		const clientArch = 'web.browser';
		const manifestEntries = Array.isArray(manifestData.manifest) ? manifestData.manifest : [];
		const appEntry = manifestEntries.find((entry) => entry.path === 'app/app.js');
		const clientVersion = appEntry ? appEntry.hash : `dev-${Date.now().toString(16)}`;

		return {
			meteorRelease: releaseVersion,
			appId,
			clientArch,
			isModern: true,
			ROOT_URL: defaultRootUrl.href,
			ROOT_URL_PATH_PREFIX: rootUrlPrefix,
			DDP_DEFAULT_CONNECTION_URL: ddpUrl.href,
			DISABLE_SOCKJS: true,
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
			reactFastRefreshEnabled: false,
		};
	}
}

function collectClientPackageEntries(
	manifestData: { manifest: { where: string; type: string; path: string }[] },
	meteorProgramDir: string,
) {
	const manifestEntries = manifestData && Array.isArray(manifestData.manifest) ? manifestData.manifest : [];
	const fromManifest = manifestEntries.filter(
		(entry) => entry.where === 'client' && entry.type === 'js' && entry.path.startsWith('packages/'),
	);
	if (fromManifest.length > 0) {
		return fromManifest;
	}

	const meteorPackagesDir = path.join(meteorProgramDir, 'packages');
	if (!fs.existsSync(meteorPackagesDir)) {
		console.warn(`[meteor-runtime] Meteor client packages directory missing at ${meteorPackagesDir}`);
		return [];
	}

	const files = [];
	let dirEntries = [];
	try {
		dirEntries = fs.readdirSync(meteorPackagesDir, { withFileTypes: true });
	} catch (error) {
		console.warn(`[meteor-runtime] Unable to read ${meteorPackagesDir}`, error);
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

	return files;
}

type ServerLoadEntry = {
	path?: string;
	node_modules?: string | Record<string, { local?: boolean }>;
};

function collectServerProgramEntries(manifestData: { load?: ServerLoadEntry[] }) {
	const loadEntries = Array.isArray(manifestData.load) ? manifestData.load : [];
	return loadEntries.filter((entry) => typeof entry.path === 'string') as Required<Pick<ServerLoadEntry, 'path'>>[];
}

function collectServerNodeModuleRoots(manifestData: { load?: ServerLoadEntry[] }, meteorProgramDir: string): string[] {
	const loadEntries = Array.isArray(manifestData.load) ? manifestData.load : [];
	const roots = new Set<string>();
	for (const entry of loadEntries) {
		if (!entry.node_modules) continue;
		if (typeof entry.node_modules === 'string') {
			const abs = path.resolve(meteorProgramDir, entry.node_modules);
			if (fs.existsSync(abs)) {
				roots.add(abs);
			}
			continue;
		}
		for (const [modulePath, info] of Object.entries(entry.node_modules)) {
			if (info.local) {
				continue;
			}
			const abs = path.resolve(meteorProgramDir, modulePath);
			if (fs.existsSync(abs)) {
				roots.add(abs);
			}
		}
	}
	const defaultRoot = path.join(meteorProgramDir, 'node_modules');
	if (fs.existsSync(defaultRoot)) {
		roots.add(defaultRoot);
	}
	const npmRoot = path.join(meteorProgramDir, 'npm', 'node_modules');
	if (fs.existsSync(npmRoot)) {
		roots.add(npmRoot);
	}
	return Array.from(roots);
}

function createClientRuntimeModuleSource(entries: { path: string }[], runtimeConfig: object, meteorBundleBasePath: string): string {
	console.log(`[meteor-runtime] Creating Meteor runtime module with ${entries.length} package entries.`);
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


globalThis.__meteor_runtime_config__ = __mergeRuntimeConfig(globalThis.__meteor_runtime_config__);

function __loadMeteorScript(relPath) {
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

import * as __meteorHostReactNamespace from 'react';
const __meteorHostReact = __meteorHostReactNamespace && __meteorHostReactNamespace.default ? __meteorHostReactNamespace.default : __meteorHostReactNamespace;
const __meteorReactShimKey = '__meteorHostReactShimInstalled';
const __meteorRuntime = globalThis.Package;
const __meteorModules = __meteorRuntime.modules;
const __meteorInstall = __meteorModules && __meteorModules.meteorInstall;
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

export const Package = __meteorRuntime;
export const require = Package.modules.meteorInstall();
`;
}

function createServerRuntimeModuleSource(
	entries: { path: string }[],
	runtimeConfig: object,
	meteorProgramDir: string,
	nodeModuleRoots: string[],
	meteorDbPath: string,
	legacyMongoDbPath: string,
	shouldProvisionMongo: boolean,
	meteorServerPort: number,
): string {
	console.log(`[meteor-runtime] Creating Meteor server runtime module with ${entries.length} package entries.`);
	const loadStatements = entries.map((entry) => `await __loadMeteorServerModule('${entry.path}');`).join('\n');
	const runtimeConfigLiteral = JSON.stringify(runtimeConfig, null, 2);
	const nodeModuleRootsLiteral = JSON.stringify(nodeModuleRoots);
	return `import Module, { createRequire as __createRequire } from 'node:module';
	import path from 'node:path';
	import fs from 'node:fs';
	const __meteorBundleBase = ${JSON.stringify(meteorProgramDir)};
	const __meteorRequire = __createRequire(path.join(__meteorBundleBase, 'app', 'app.js'));
	const __meteorProgramJsonPath = path.join(__meteorBundleBase, 'program.json');
	const __meteorShouldProvisionMongo = ${shouldProvisionMongo ? 'true' : 'false'};
	const __meteorMongoDbPath = ${JSON.stringify(meteorDbPath)};
	const __meteorLegacyMongoDbPath = ${JSON.stringify(legacyMongoDbPath)};
	const __meteorMongoHydratedMarker = __meteorMongoDbPath ? path.join(__meteorMongoDbPath, '.vite-mongo-initialized') : null;
	const __meteorDevServerPort = ${meteorServerPort};
	const __meteorMongoPort = (() => {
		const candidates = [process.env.VITE_METEOR_MONGO_PORT, process.env.METEOR_MONGO_PORT];
		for (const value of candidates) {
			const parsed = Number(value);
			if (Number.isFinite(parsed) && parsed > 0) {
				return parsed;
			}
		}
		return 3001;
	})();
	const __meteorDefaultMongoUrl = 'mongodb://127.0.0.1:3001/meteor';
	const __meteorDefaultOplogUrl = 'mongodb://127.0.0.1:3001/local';
	if (process.argv.length < 3) {
		process.argv.push(__meteorProgramJsonPath);
	} else {
		process.argv[2] = __meteorProgramJsonPath;
	}
	if (!process.env.PORT) {
		process.env.PORT = String(__meteorDevServerPort);
	}
	if (!process.env.BIND_IP) {
		process.env.BIND_IP = '127.0.0.1';
	}
	const __meteorEnableRuntime = __meteorRequire(path.join(__meteorBundleBase, 'runtime.js'));
	if (typeof __meteorEnableRuntime === 'function') {
		__meteorEnableRuntime({ cachePath: process.env.METEOR_REIFY_CACHE_DIR });
	}

	function __meteorRewriteMongoUri(baseUri, dbName) {
		if (!baseUri) {
			return '';
		}
		try {
			const parsed = new URL(baseUri);
			parsed.pathname = '/' + dbName;
			return parsed.toString();
		} catch (error) {
			const [prefix, query] = baseUri.split('?');
			const trimmed = prefix.endsWith('/') ? prefix.slice(0, -1) : prefix;
			const slashIndex = trimmed.lastIndexOf('/');
			const base = slashIndex === -1 || trimmed.startsWith('mongodb+srv://') ? trimmed : trimmed.slice(0, slashIndex);
			return base + '/' + dbName + (query ? '?' + query : '');
		}
	}

	function __meteorDirectoryIsEmpty(dirPath) {
		try {
			const entries = fs.readdirSync(dirPath);
			return entries.length === 0;
		} catch {
			return true;
		}
	}

	function __meteorCopyDirectory(src, dest) {
		const entries = fs.readdirSync(src, { withFileTypes: true });
		for (const entry of entries) {
			const sourcePath = path.join(src, entry.name);
			const targetPath = path.join(dest, entry.name);
			if (entry.isDirectory()) {
				fs.mkdirSync(targetPath, { recursive: true });
				__meteorCopyDirectory(sourcePath, targetPath);
			} else if (entry.isFile()) {
				fs.copyFileSync(sourcePath, targetPath);
			}
		}
	}

	function __meteorMarkMongoHydrated() {
		if (__meteorMongoHydratedMarker) {
			try {
				fs.mkdirSync(path.dirname(__meteorMongoHydratedMarker), { recursive: true });
				fs.writeFileSync(__meteorMongoHydratedMarker, String(Date.now()));
			} catch {
				// ignore marker failures
			}
		}
	}

	function __meteorMaybeHydrateMongoDirectory() {
		if (!__meteorMongoDbPath || !__meteorLegacyMongoDbPath || __meteorMongoDbPath === __meteorLegacyMongoDbPath) {
			return;
		}
		if (__meteorMongoHydratedMarker && fs.existsSync(__meteorMongoHydratedMarker)) {
			return;
		}
		if (!fs.existsSync(__meteorLegacyMongoDbPath)) {
			__meteorMarkMongoHydrated();
			return;
		}
		const targetExists = fs.existsSync(__meteorMongoDbPath);
		const targetIsEmpty = !targetExists || __meteorDirectoryIsEmpty(__meteorMongoDbPath);
		if (!targetIsEmpty) {
			__meteorMarkMongoHydrated();
			return;
		}
		try {
			fs.mkdirSync(__meteorMongoDbPath, { recursive: true });
			if (typeof fs.cpSync === 'function') {
				fs.cpSync(__meteorLegacyMongoDbPath, __meteorMongoDbPath, { recursive: true });
			} else {
				__meteorCopyDirectory(__meteorLegacyMongoDbPath, __meteorMongoDbPath);
			}
			console.log('[meteor-runtime] Copied existing Meteor dev database into vite-managed Mongo directory to preserve data.');
		} catch (copyError) {
			console.warn('[meteor-runtime] Failed to copy legacy Meteor database into vite Mongo directory.', copyError);
		}
		__meteorMarkMongoHydrated();
	}

	function __meteorEnsureMongoDirectoryReady() {
		if (!__meteorMongoDbPath) {
			return;
		}
		__meteorMaybeHydrateMongoDirectory();
		try {
			fs.mkdirSync(__meteorMongoDbPath, { recursive: true });
		} catch (mkdirError) {
			console.warn('[meteor-runtime] Failed to prepare Meteor DB directory', mkdirError);
		}
	}

	function __meteorShouldResetMongoData(error) {
		if (!error) {
			return false;
		}
		if (error.codeName === 'NodeNotFound' || error.code === 74) {
			return true;
		}
		const message = typeof error.message === 'string' ? error.message : '';
		return message.includes('No host described in new configuration');
	}

	function __meteorResetMongoDirectory() {
		if (!__meteorMongoDbPath) {
			return;
		}
		try {
			fs.rmSync(__meteorMongoDbPath, { recursive: true, force: true });
		} catch (resetError) {
			console.warn('[meteor-runtime] Failed to reset Meteor DB directory', resetError);
		}
	}

	async function __meteorEnsureMongoMemoryServer() {
		if (!__meteorShouldProvisionMongo) {
			return null;
		}
		if (process.env.MONGO_URL || process.env.MONGO_OPLOG_URL) {
			return null;
		}
		if (globalThis.__meteorMongoReplSetPromise) {
			return globalThis.__meteorMongoReplSetPromise;
		}
		globalThis.__meteorMongoReplSetPromise = (async () => {
			let MongoMemoryReplSet;
			try {
				({ MongoMemoryReplSet } = await import('mongodb-memory-server'));
			} catch (error) {
				console.warn('[meteor-runtime] mongodb-memory-server is unavailable; falling back to default Mongo URLs.', error);
				return null;
			}
			if (!MongoMemoryReplSet) {
				console.warn('[meteor-runtime] mongodb-memory-server did not expose MongoMemoryReplSet.');
				return null;
			}

			const __meteorCreateMongoReplSet = async (allowReset) => {
				__meteorEnsureMongoDirectoryReady();
				try {
					return await MongoMemoryReplSet.create({
						replSet: {
							name: process.env.METEOR_MONGO_REPLSET || 'meteor',
							count: 1,
							storageEngine: process.env.METEOR_MONGO_STORAGE_ENGINE || 'wiredTiger',
						},
						instanceOpts: [{
							dbName: 'meteor',
							dbPath: __meteorMongoDbPath || undefined,
							ip: '127.0.0.1',
							port: __meteorMongoPort,
						}],
					});
				} catch (error) {
					if (allowReset && __meteorShouldResetMongoData(error)) {
						console.warn('[meteor-runtime] Mongo memory server config mismatch detected; clearing data directory and retrying.');
						__meteorResetMongoDirectory();
						return __meteorCreateMongoReplSet(false);
					}
					throw error;
				}
			};

			console.log('[meteor-runtime] Starting Mongo memory replica set for Meteor (port ' + __meteorMongoPort + ').');
			try {
				const replSet = await __meteorCreateMongoReplSet(true);
				if (!replSet) {
					return null;
				}
				if (typeof replSet.waitUntilRunning === 'function') {
					await replSet.waitUntilRunning();
				}
				const cleanup = async () => {
					try {
						await replSet.stop();
					} catch (cleanupError) {
						console.warn('[meteor-runtime] Failed to stop Mongo memory server', cleanupError);
					}
				};
				if (!globalThis.__meteorMongoCleanupRegistered) {
					globalThis.__meteorMongoCleanupRegistered = true;
					process.once('exit', () => {
						cleanup().catch(() => {});
					});
					for (const signal of ['SIGINT', 'SIGTERM']) {
						process.once(signal, () => {
							cleanup().finally(() => process.exit(0));
						});
					}
				}
				return replSet;
			} catch (mongoError) {
				console.warn('[meteor-runtime] Failed to launch Mongo memory server. Falling back to defaults.', mongoError);
				return null;
			}
		})();
		return globalThis.__meteorMongoReplSetPromise;
	}

	async function __meteorSetupMongoEnv() {
		if (process.env.MONGO_URL && process.env.MONGO_OPLOG_URL) {
			return;
		}
		const replSet = await __meteorEnsureMongoMemoryServer();
		if (replSet) {
			let baseUri = '';
			try {
				baseUri = replSet.getUri();
			} catch (error) {
				console.warn('[meteor-runtime] Failed to read Mongo memory server URI.', error);
			}
			if (baseUri) {
				const mongoUrl = __meteorRewriteMongoUri(baseUri, 'meteor');
				const oplogUrl = __meteorRewriteMongoUri(baseUri, 'local');
				if (!process.env.MONGO_URL) {
					process.env.MONGO_URL = mongoUrl;
				}
				if (!process.env.MONGO_OPLOG_URL) {
					process.env.MONGO_OPLOG_URL = oplogUrl;
				}
				console.log('[meteor-runtime] Using in-memory Mongo at', process.env.MONGO_URL);
				return;
			}
		}
		if (!process.env.MONGO_URL) {
			process.env.MONGO_URL = __meteorDefaultMongoUrl;
		}
		if (!process.env.MONGO_OPLOG_URL) {
			process.env.MONGO_OPLOG_URL = __meteorDefaultOplogUrl;
		}
	}

	await __meteorSetupMongoEnv();
	let __meteorConfigJson = {};
	try {
		__meteorConfigJson = JSON.parse(fs.readFileSync(path.join(__meteorBundleBase, 'config.json'), 'utf-8'));
	} catch (error) {
		console.warn('[meteor-runtime] Unable to read Meteor config.json', error);
	}
	if (!globalThis.__meteor_bootstrap__) {
		globalThis.__meteor_bootstrap__ = {
			startupHooks: [],
			serverDir: __meteorBundleBase,
			configJson: __meteorConfigJson,
			isFibersDisabled: true,
		};
	} else {
		globalThis.__meteor_bootstrap__.startupHooks = globalThis.__meteor_bootstrap__.startupHooks || [];
		globalThis.__meteor_bootstrap__.serverDir = globalThis.__meteor_bootstrap__.serverDir || __meteorBundleBase;
		globalThis.__meteor_bootstrap__.configJson = globalThis.__meteor_bootstrap__.configJson || __meteorConfigJson;
		globalThis.__meteor_bootstrap__.isFibersDisabled = true;
	}
	const { require: __meteorServerNpmRequire } = __meteorRequire(path.join(__meteorBundleBase, 'npm-require.js'));
	const __meteorLoadedModules = new Map();
	const __meteorRuntimeDefaults = ${runtimeConfigLiteral};
	const __meteorNodeModuleRoots = ${nodeModuleRootsLiteral};
	const __meteorNodeModuleNotFound = Symbol('meteor-node-module-not-found');
	const __meteorSpecialModulePreludes = new Map([
		['packages/modules-runtime.js', 'const npmRequire = globalThis.__meteorServerNpmRequire;'],
	]);

	globalThis.__meteorServerNpmRequire = __meteorServerNpmRequire;

	function __meteorStatMaybe(filePath) {
		try {
			return fs.statSync(filePath);
		} catch {
			return null;
		}
	}

	function __meteorLoadFromNodeModuleRoots(moduleId) {
		if (!Array.isArray(__meteorNodeModuleRoots) || __meteorNodeModuleRoots.length === 0) {
			return __meteorNodeModuleNotFound;
		}
		const normalizedId = moduleId.split('\\\\').join('/');
		const parts = normalizedId.split('/');
		const topSegment = parts[0];
		for (const base of __meteorNodeModuleRoots) {
			const packageBase = path.join(base, topSegment);
			if (!__meteorStatMaybe(packageBase)) {
				continue;
			}
			const candidate = path.join(base, ...parts);
			try {
				return __meteorRequire(candidate);
			} catch (error) {
				// Try next root if this candidate fails to load.
			}
		}
		return __meteorNodeModuleNotFound;
	}

	function __meteorRequireWithPrelude(filename, preludeSource) {
		const originalLoader = Module._extensions['.js'];
		Module._extensions['.js'] = function (module, currentFilename) {
			if (currentFilename === filename) {
				const source = fs.readFileSync(currentFilename, 'utf-8');
				module._compile(preludeSource + '\\n' + source, currentFilename);
				return;
			}
			return originalLoader(module, currentFilename);
		};
		try {
			return __meteorRequire(filename);
		} finally {
			Module._extensions['.js'] = originalLoader;
		}
	}

for (const dir of __meteorNodeModuleRoots) {
	if (!Module.globalPaths.includes(dir)) {
		Module.globalPaths.push(dir);
	}
}

if (!globalThis.Npm) {
	globalThis.Npm = {
		require(id) {
			const candidate = __meteorLoadFromNodeModuleRoots(id);
			if (candidate !== __meteorNodeModuleNotFound) {
				return candidate;
			}
			try {
				return __meteorRequire(id);
			} catch (error) {
				if (error && error.code === 'MODULE_NOT_FOUND') {
					error.message = '[meteor-runtime] Cannot find npm module ' + id + '. Searched roots: ' + __meteorNodeModuleRoots.join(', ');
				}
				throw error;
			}
		},
		Module: { createRequire: __createRequire },
	};
}

if (!globalThis.Meteor) {
	const __meteorStartupCallbacks = [];
	const meteorStub = {
		isServer: true,
		isClient: false,
		isCordova: false,
		isModern: true,
		startup(callback) {
			if (typeof callback === 'function') {
				try {
					callback();
				} catch (error) {
					console.error('[meteor-runtime] Meteor.startup stub callback threw', error);
				}
			}
		},
	};
	globalThis.Meteor = meteorStub;
	globalThis.__meteorStartupCallbacks = __meteorStartupCallbacks;
}

function __mergeRuntimeConfig(existing) {
	const merged = Object.assign({}, __meteorRuntimeDefaults, existing || {});
	merged.meteorEnv = Object.assign({}, __meteorRuntimeDefaults.meteorEnv || {}, existing && existing.meteorEnv || {});
	merged.PUBLIC_SETTINGS = Object.assign({}, __meteorRuntimeDefaults.PUBLIC_SETTINGS || {}, existing && existing.PUBLIC_SETTINGS || {});
	merged.autoupdate = existing && existing.autoupdate ? existing.autoupdate : (__meteorRuntimeDefaults.autoupdate || { versions: {} });
	return merged;
}

globalThis.__meteor_runtime_config__ = __mergeRuntimeConfig(globalThis.__meteor_runtime_config__);

async function __loadMeteorServerModule(relPath) {
	if (__meteorLoadedModules.has(relPath)) {
		return __meteorLoadedModules.get(relPath);
	}
	const absPath = path.join(__meteorBundleBase, relPath);
	let mod;
	const prelude = __meteorSpecialModulePreludes.get(relPath);
	if (prelude) {
		mod = __meteorRequireWithPrelude(absPath, prelude);
	} else {
		mod = __meteorRequire(absPath);
	}
	__meteorLoadedModules.set(relPath, mod);
	return mod;
}

${loadStatements}
const __waitForPackages = globalThis.Package && globalThis.Package['core-runtime'] && globalThis.Package['core-runtime'].waitUntilAllLoaded;
if (typeof __waitForPackages === 'function') {
	const maybePromise = __waitForPackages();
	if (maybePromise && typeof maybePromise.then === 'function') {
		await maybePromise;
	}
}
if (globalThis.Package && globalThis.Package.meteor && globalThis.Package.meteor.Meteor) {
	globalThis.Meteor = globalThis.Package.meteor.Meteor;
}

if (globalThis.Package && globalThis.Package.webapp && typeof globalThis.Package.webapp.main === 'function') {
	if (!globalThis.__meteorWebAppStarted) {
		globalThis.__meteorWebAppStarted = true;
		await globalThis.Package.webapp.main();
	}
} else {
	console.warn('[meteor-runtime] WebApp package missing; DDP/SockJS endpoints will be unavailable.');
}
`;
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
			console.warn('[meteor-runtime] Failed to parse METEOR_SETTINGS JSON', error);
		}
	}

	const fallbackPaths = [path.resolve('settings.json'), path.resolve('.meteor/settings.json')];

	for (const candidate of fallbackPaths) {
		if (fs.existsSync(candidate)) {
			try {
				const contents = JSON.parse(fs.readFileSync(candidate, 'utf-8'));
				return contents.public || {};
			} catch (error) {
				console.warn(`[meteor-runtime] Failed to parse settings file at ${candidate}`, error);
			}
		}
	}

	return {};
}
