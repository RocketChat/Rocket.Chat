export type ReloadOptions = {
	immediateMigration?: boolean;
	[key: string]: unknown;
};

export type MigrationResult = [boolean, unknown?] | void;

export type ProviderCallback = (
	tryReload: () => void,
	options: ReloadOptions
) => MigrationResult;

export type Provider = {
	name?: string | undefined;
	callback: ProviderCallback;
};

const KEY_NAME = 'Meteor_Reload';

// Allow external configuration of debug mode
let isDebugEnabled = false;

export function setDebug(enabled: boolean): void {
	isDebugEnabled = enabled;
}

function debug(message: string, context?: unknown): void {
	if (!isDebugEnabled) return;
	console.log(`[reload] ${message}`, context ? JSON.stringify(context) : '');
}

// Safely evaluate sessionStorage support
let safeSessionStorage: Storage | null = null;
try {
	safeSessionStorage = window.sessionStorage;
	if (safeSessionStorage) {
		safeSessionStorage.setItem('__dummy__', '1');
		safeSessionStorage.removeItem('__dummy__');
	} else {
		safeSessionStorage = null;
	}
} catch (e) {
	safeSessionStorage = null;
}

let old_data: Record<string, unknown> = {};
let providers: Provider[] = [];
let reloading = false;

// Initialization: Read in old data at startup.
let old_json: string | null = null;

if (safeSessionStorage) {
	old_json = safeSessionStorage.getItem(KEY_NAME);
	safeSessionStorage.removeItem(KEY_NAME);
}

if (!old_json) old_json = '{}';

try {
	const old_parsed = JSON.parse(old_json);
	if (typeof old_parsed !== 'object' || old_parsed === null) {
		console.warn('Got bad data on reload. Ignoring.');
	} else if (old_parsed.reload && typeof old_parsed.data === 'object') {
		old_data = old_parsed.data as Record<string, unknown>;
	}
} catch (err) {
	console.warn('Got invalid JSON on reload. Ignoring.');
}

export const _getData = (): string | null => {
	return safeSessionStorage && safeSessionStorage.getItem(KEY_NAME);
}

export const _migrationData = (name: string): unknown => {
	debug('_migrationData', { name });
	return old_data[name];
}

export const _onMigrate = (nameOrCallback: string | ProviderCallback, callback?: ProviderCallback): void => {
	let name: string | undefined;
	let cb: ProviderCallback;

	if (typeof nameOrCallback === 'function') {
		cb = nameOrCallback;
		debug('_onMigrate no callback');
	} else {
		name = nameOrCallback;
		cb = callback!;
		debug('_onMigrate', { name });
	}

	providers.push({ name, callback: cb });
}

export const _migrate = (tryReload: VoidFunction | null = null, options: ReloadOptions = {}): boolean => {
	debug('_migrate', { options });
	const tryReloadFn = tryReload || (() => { });
	const { immediateMigration } = options;

	const migrationData: Record<string, unknown> = {};
	let allReady = true;

	for (const p of providers) {
		const { callback, name } = p;
		const result = callback(tryReloadFn, options);
		const [ready, data] = result || [false, undefined];

		debug(`pollProviders provider ${name || 'unknown'} is ${ready ? 'ready' : 'NOT ready'}`, { options });

		if (!ready) {
			allReady = false;
		}

		if (data !== undefined && name) {
			migrationData[name] = data;
		}
	}

	if (!allReady && !immediateMigration) {
		return false;
	}

	let json: string;
	try {
		json = JSON.stringify({
			data: migrationData,
			reload: true,
		});
	} catch (err) {
		console.error("Couldn't serialize data for migration", migrationData);
		throw err;
	}

	if (safeSessionStorage) {
		try {
			safeSessionStorage.setItem(KEY_NAME, json);
		} catch (err) {
			console.error("Couldn't save data for migration to sessionStorage", err);
		}
	} else {
		console.warn('Browser does not support sessionStorage. Not saving migration state.');
	}

	return true;
}

export const _withFreshProvidersForTest = (f: VoidFunction): void => {
	const originalProviders = providers.slice();
	providers = [];
	try {
		f();
	} finally {
		providers = originalProviders;
	}
}

export const _reload = (options: ReloadOptions = {}): void => {
	debug('_reload', { options });

	if (reloading) {
		debug('reloading in progress already', { options });
		return;
	}
	reloading = true;

	function tryReload() {
		debug('tryReload');
		setTimeout(reload, 1);
	}

	function forceBrowserReload() {
		debug('forceBrowserReload');
		if (window.location.hash || window.location.href.endsWith('#')) {
			window.location.reload();
			return;
		}
		window.location.replace(window.location.href);
	}

	function reload() {
		debug('reload');
		if (!_migrate(tryReload, options)) {
			reloading = false;
			return;
		}

		forceBrowserReload();
	}

	tryReload();
}

