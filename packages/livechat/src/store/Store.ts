import mitt from 'mitt';

const { localStorage } = window;

export default class Store<TState extends Record<string, unknown>> {
	private emitter;
	private localStorageKey;
	private doNotPersistList;
	private _state: TState;

	constructor(initialState: TState, { localStorageKey = 'store', doNotPersistList = [] }: {localStorageKey?: string, doNotPersistList?: (keyof TState)[]} = {}) {
		this.emitter = mitt();
		this.localStorageKey = localStorageKey;
		this.doNotPersistList = doNotPersistList;

		let storedState: Partial<TState>;

		try {
			storedState = JSON.parse(localStorage.getItem(this.localStorageKey));
		} catch (e) {
			storedState = {};
		} finally {
			storedState = typeof storedState === 'object' ? storedState : {};
		}

		this._state = { ...initialState, ...storedState };

		window.addEventListener('storage', (e) => {
			// Cross-tab communication
			if (e.key !== this.localStorageKey) {
				return;
			}

			if (!e.newValue) {
				// The localStorage has been removed
				return location.reload();
			}

			const storedState = JSON.parse(e.newValue);
			this.setStoredState(storedState);
			this.emit('storageSynced');
		});
	}

	get state() {
		return this._state;
	}

	persist() {
		const persistable = { ...this._state };
		for (const ignoredKey of this.doNotPersistList) {
			delete persistable[ignoredKey];
		}
		localStorage.setItem(this.localStorageKey, JSON.stringify(persistable));
	}

	setState(partialState: Partial<TState>) {
		const prevState = this._state;
		this._state = { ...prevState, ...partialState };
		this.persist();
		this.emit('change', [this._state, prevState, partialState]);
	}

	unsetSinglePropInStateByName(propName: string) {
		const prevState = this._state;
		delete prevState[propName];
		this._state = { ...prevState };
		this.persist();
		this.emit('change', [this._state, prevState]);
	}

	private setStoredState(storedState: Partial<TState>) {
		const prevState = this._state;

		const nonPersistable: Partial<TState> = {};
		for (const ignoredKey of this.doNotPersistList) {
			nonPersistable[ignoredKey] = prevState[ignoredKey];
		}
		this._state = { ...this._state, ...storedState, ...nonPersistable };
		this.emit('change', [this._state, prevState]);
	}

	on(event: string, callback: () => void) {
		this.emitter.on(event, callback);
	}

	off(event: string, callback: () => void) {
		this.emitter.off(event, callback);
	}

	emit(event: string, args?: any[]) {
		this.emitter.emit(event, args);
	}
}
