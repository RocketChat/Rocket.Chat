import fs from 'node:fs';
import path from 'node:path';

import type { Plugin } from 'vite';

const meteorProgramDir = path.resolve('.meteor/local/build/programs/web.browser');
const meteorManifestPath = path.join(meteorProgramDir, 'program.json');
const meteorBundleBasePath = '/.meteor/local/build/programs/web.browser/';
const runtimeVirtualId = '\0meteor-runtime';
const runtimeImportId = 'virtual:meteor-runtime';

export function meteorRuntime(
	config: {
		modules: Record<string, null | string>;
	} = { modules: {} },
): Plugin {
	if (!fs.existsSync(meteorManifestPath)) {
		return { name: 'meteor-runtime' };
	}

	const manifest = JSON.parse(fs.readFileSync(meteorManifestPath, 'utf-8'));
	
	// Collect packages that are not replaced by config.modules
	const packageEntries = collectPackageEntries(manifest).filter((entry) => {
		const pkgName = entry.path.replace(/^packages\//, '').replace(/\.js$/, '');
		return !Object.keys(config.modules).includes(pkgName);
	});
	
	const runtimeModuleSource = createRuntimeModuleSource(packageEntries, buildRuntimeConfig(manifest));

	return {
		name: 'meteor-runtime',
		enforce: 'pre',
		resolveId(source) {
			if (source === runtimeImportId) {
				return runtimeVirtualId;
			}
			return null;
		},
		load(id) {
			if (id === runtimeVirtualId) {
				return runtimeModuleSource;
			}
			return null;
		},
	};
}

function collectPackageEntries(manifestData: { manifest: { where: string; type: string; path: string }[] }) {
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

function createRuntimeModuleSource(entries: { path: string }[], runtimeConfig: object): string {
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
