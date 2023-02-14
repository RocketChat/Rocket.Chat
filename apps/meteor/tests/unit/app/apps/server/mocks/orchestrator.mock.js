/* istanbul ignore file */

export class AppServerOrchestratorMock {
	constructor() {
		this._marketplaceUrl = 'https://marketplace.rocket.chat';

		this._model = {};
		this._logModel = {};
		this._persistModel = {};
		this._storage = {};
		this._logStorage = {};

		this._converters = new Map();
		this._converters.set('messages', {});
		this._converters.set('rooms', {});
		this._converters.set('settings', {});
		this._converters.set('users', {});

		this._bridges = {};

		this._manager = {};

		this._communicators = new Map();
		this._communicators.set('methods', {});
		this._communicators.set('notifier', {});
		this._communicators.set('restapi', {});
	}

	getModel() {
		return this._model;
	}

	getPersistenceModel() {
		return this._persistModel;
	}

	getStorage() {
		return this._storage;
	}

	getLogStorage() {
		return this._logStorage;
	}

	getConverters() {
		return this._converters;
	}

	getBridges() {
		return this._bridges;
	}

	getNotifier() {
		return this._communicators.get('notifier');
	}

	getManager() {
		return this._manager;
	}

	isEnabled() {
		return true;
	}

	isLoaded() {
		return this.getManager().areAppsLoaded();
	}

	isDebugging() {
		return true;
	}

	debugLog() {
		if (this.isDebugging()) {
			// eslint-disable-next-line
			console.log(...arguments);
		}
	}

	getMarketplaceUrl() {
		return this._marketplaceUrl;
	}

	load() {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return;
		}

		this._manager
			.load()
			.then((affs) => console.log(`Loaded the Apps Framework and loaded a total of ${affs.length} Apps!`))
			.catch((err) => console.warn('Failed to load the Apps Framework and Apps!', err));
	}

	unload() {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		this._manager
			.unload()
			.then(() => console.log('Unloaded the Apps Framework.'))
			.catch((err) => console.warn('Failed to unload the Apps Framework!', err));
	}
}
