function debug(message: string, context?: any) {
	console.debug(`[reload] ${message}`, JSON.stringify(context));
}

const KEY_NAME = 'Meteor_Reload';

let oldData: any = {};
let oldJson: string | null = null;
let safeSessionStorage: any = null;
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
function _getData() {
	return safeSessionStorage?.getItem(KEY_NAME);
}

if (safeSessionStorage) {
	oldJson = _getData();
	safeSessionStorage.removeItem(KEY_NAME);
} else {
	console.debug('Browser does not support sessionStorage. Not retrieving migration state.');
}

if (!oldJson) {
	oldJson = '{}';
}
let oldParsed: any = {};
try {
	oldParsed = JSON.parse(oldJson);
	if (typeof oldParsed !== 'object') {
		console.debug('Got bad data on reload. Ignoring.');
		oldParsed = {};
	}
} catch (err) {
	console.debug('Got invalid JSON on reload. Ignoring.');
}

if (oldParsed.reload && typeof oldParsed.data === 'object') {
	oldData = oldParsed.data;
}

let providers: any[] = [];
function _onMigrate(...args: [string, (...args: any[]) => any] | [(...args: any[]) => any]) {
	let name: string | undefined;
	let callback: ((...args: any[]) => any) | undefined;

	if (args.length === 1) {
		callback = args[0];
	} else if (args.length === 2) {
		name = args[0] as string;
		callback = args[1];
	}

	debug('_onMigrate', { name });
	if (!callback) {
		callback = name as unknown as (...args: any[]) => any;
		name = undefined as unknown as string;
		debug('_onMigrate no callback');
	}

	providers.push({ name, callback });
}
function _migrationData(name: string) {
	debug('_migrationData', { name });
	return oldData[name];
}
const pollProviders = function (tryReload: ((...args: any[]) => any) | null, options: any) {
	debug('pollProviders', { options });
	tryReload =
		tryReload ||
		function () {
			// noop
		};
	options = options || {};

	const { immediateMigration } = options;
	debug(`pollProviders is ${immediateMigration ? '' : 'NOT '}immediateMigration`, { options });
	const migrationData: any = {};
	let allReady = true;
	providers.forEach((p) => {
		const { callback, name } = p || {};
		const [ready, data] = callback(tryReload, options) || [];

		debug(`pollProviders provider ${name || 'unknown'} is ${ready ? 'ready' : 'NOT ready'}`, { options });
		if (!ready) {
			allReady = false;
		}

		if (data !== undefined && name) {
			migrationData[name] = data;
		}
	});

	if (allReady) {
		debug('pollProviders allReady', { options, migrationData });
		return migrationData;
	}

	if (immediateMigration) {
		debug('pollProviders immediateMigration', { options, migrationData });
		return migrationData;
	}

	return null;
};
function _migrate(tryReload: ((...args: any[]) => any) | null, options: any) {
	debug('_migrate', { options });
	const migrationData = pollProviders(tryReload, options);
	if (migrationData === null) {
		return false; // not ready yet..
	}

	let json;
	try {
		json = JSON.stringify({
			data: migrationData,
			reload: true,
		});
	} catch (err) {
		console.debug("Couldn't serialize data for migration", migrationData);
		throw err;
	}

	if (safeSessionStorage) {
		try {
			safeSessionStorage.setItem(KEY_NAME, json);
		} catch (err) {
			console.debug("Couldn't save data for migration to sessionStorage", err);
		}
	} else {
		console.debug('Browser does not support sessionStorage. Not saving migration state.');
	}

	return true;
}
function _withFreshProvidersForTest(f: () => void) {
	const originalProviders = providers.slice(0);
	providers = [];
	try {
		f();
	} finally {
		providers = originalProviders;
	}
}
let reloading = false;
function _reload(options: any) {
	debug('_reload', { options });
	options = options || {};

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
			return;
		}

		forceBrowserReload();
	}

	tryReload();
}

export const Reload = { _getData, _onMigrate, _migrationData, _migrate, _withFreshProvidersForTest, _reload };
