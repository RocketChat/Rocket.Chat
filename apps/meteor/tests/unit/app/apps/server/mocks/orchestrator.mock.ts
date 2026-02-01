/* istanbul ignore file */

export class AppServerOrchestratorMock {
	private _marketplaceClient: Record<string, unknown>;

	private _model: Record<string, unknown>;

	private _persistModel: Record<string, unknown>;

	private _storage: Record<string, unknown>;

	private _logStorage: Record<string, unknown>;

	private _converters: Map<string, Record<string, unknown>>;

	private _bridges: Record<string, unknown>;

	private _manager: { areAppsLoaded?: () => boolean; load?: () => Promise<unknown[]>; unload?: () => Promise<void> };

	private _communicators: Map<string, Record<string, unknown>>;

	constructor() {
		this._marketplaceClient = {};

		this._model = {};
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

	getMarketplaceClient(): Record<string, unknown> {
		return this._marketplaceClient;
	}

	getModel(): Record<string, unknown> {
		return this._model;
	}

	getPersistenceModel(): Record<string, unknown> {
		return this._persistModel;
	}

	getStorage(): Record<string, unknown> {
		return this._storage;
	}

	getLogStorage(): Record<string, unknown> {
		return this._logStorage;
	}

	getConverters(): Map<string, Record<string, unknown>> {
		return this._converters;
	}

	getBridges(): Record<string, unknown> {
		return this._bridges;
	}

	getNotifier(): Record<string, unknown> | undefined {
		return this._communicators.get('notifier');
	}

	getManager(): { areAppsLoaded?: () => boolean; load?: () => Promise<unknown[]>; unload?: () => Promise<void> } {
		return this._manager;
	}

	isEnabled(): boolean {
		return true;
	}

	isLoaded(): boolean {
		return this.getManager().areAppsLoaded?.() ?? false;
	}

	isDebugging(): boolean {
		return true;
	}

	debugLog(...args: unknown[]): void {
		if (this.isDebugging()) {
			console.log(...args);
		}
	}

	load(): void {
		// Don't try to load it again if it has
		// already been loaded
		if (this.isLoaded()) {
			return;
		}

		this._manager
			.load?.()
			.then((affs) => console.log(`Loaded the Apps Framework and loaded a total of ${affs.length} Apps!`))
			.catch((err) => console.warn('Failed to load the Apps Framework and Apps!', err));
	}

	unload(): void {
		// Don't try to unload it if it's already been
		// unlaoded or wasn't unloaded to start with
		if (!this.isLoaded()) {
			return;
		}

		this._manager
			.unload?.()
			.then(() => console.log('Unloaded the Apps Framework.'))
			.catch((err) => console.warn('Failed to unload the Apps Framework!', err));
	}
}
