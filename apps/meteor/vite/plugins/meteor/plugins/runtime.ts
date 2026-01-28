import path from 'node:path';

import { prefixRegex } from '@rolldown/pluginutils';
import type { Plugin } from 'vite';

import type { ResolvedPluginOptions } from './shared/config.ts';

const runtimeVirtualId = '\0meteor-runtime';
const runtimeImportId = 'virtual:meteor-runtime';

export function runtime(config: ResolvedPluginOptions): Plugin {
	return {
		name: 'meteor:runtime',
		enforce: 'post',
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
			async handler(id) {
				if (id !== runtimeVirtualId) {
					return null;
				}

				const meteorProgramDir = path.resolve(config.programsDir, 'web.browser');
				const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
				const relativeProgramDir = path.relative(process.cwd(), meteorProgramDir).split(path.sep).join('/');
				const browserVisiblePath = relativeProgramDir.startsWith('/') ? relativeProgramDir : `/${relativeProgramDir}`;
				const meteorClientBundleBasePath = ensureTrailingSlash(browserVisiblePath);

				const manifestRaw = await this.fs.readFile(meteorManifestPath, { encoding: 'utf8' });
				const manifest = JSON.parse(manifestRaw);

				const meteorRelease = await this.fs.readFile('.meteor/release', { encoding: 'utf8' });

				const runtimeConfig = await buildRuntimeConfig.call(this, { manifest, meteorRelease });

				const rawEntries = await collectClientPackageEntries.call(this, manifest, meteorProgramDir);
				const moduleOverrides = Object.keys(config.modules);
				// Collect packages that are not replaced by config.modules
				const packageEntries = rawEntries.filter((entry) => {
					const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
					return !moduleOverrides.includes(pkgName);
				});

				this.info(`Including ${packageEntries.length} Meteor client packages in runtime loader.`);

				const runtimeModuleSource = createClientRuntimeModuleSource(
					packageEntries,
					runtimeConfig,
					meteorClientBundleBasePath, // ensured above when client
				);

				return runtimeModuleSource;
			},
		},
	};

	async function buildRuntimeConfig(
		this: ThisParameterType<Extract<Plugin['load'], { handler: unknown }>['handler']>,

		{
			meteorRelease,
			...manifestData
		}: {
			manifest?: { path: string; hash: string }[];
			meteorRelease: string;
		},
	) {
		const appId = await readAppId.call(this);
		const defaultRootUrl = config.rootUrl;
		const rootUrlPrefix = process.env.VITE_METEOR_ROOT_URL_PATH_PREFIX || '';
		const ddpUrl = config.rootUrl;
		const clientArch = 'web.browser';
		const manifestEntries = Array.isArray(manifestData.manifest) ? manifestData.manifest : [];
		const appEntry = manifestEntries.find((entry) => entry.path === 'app/app.js');
		const clientVersion = appEntry ? appEntry.hash : `dev-${Date.now().toString(16)}`;

		return {
			meteorRelease,
			appId,
			clientArch,
			isModern: true,
			ROOT_URL: defaultRootUrl.href,
			ROOT_URL_PATH_PREFIX: rootUrlPrefix,
			DDP_DEFAULT_CONNECTION_URL: ddpUrl.href,
			DISABLE_SOCKJS: true,
			PUBLIC_SETTINGS: {},
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

async function collectClientPackageEntries(
	this: ThisParameterType<Extract<Plugin['load'], { handler: unknown }>['handler']>,
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

	const files = [];
	const dirEntries = await this.fs.readdir(meteorPackagesDir, { withFileTypes: true });

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

function createClientRuntimeModuleSource(entries: { path: string }[], runtimeConfig: object, meteorBundleBasePath: string): string {
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

function ensureTrailingSlash(url: string) {
	if (!url) {
		return url;
	}
	return url.endsWith('/') ? url : `${url}/`;
}

async function readAppId(this: ThisParameterType<Extract<Plugin['load'], { handler: unknown }>['handler']>): Promise<string | undefined> {
	const idFile = path.resolve('.meteor/.id');
	const contents = await this.fs.readFile(idFile, { encoding: 'utf8' });
	// Remove empty lines and lines starting with #
	return contents
		.split('\n')
		.map((line) => line.trim())
		.find((line) => line && !line.startsWith('#'));
}
