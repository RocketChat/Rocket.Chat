import { Emitter } from '@rocket.chat/emitter';

import type { StoreState } from '.';

function getLocalStorage() {
	try {
		return window.localStorage;
	} catch (_) {
		const store: Record<string, string | null> = {};
		return {
			getItem(name: string): string | null {
				return store[name] ?? null;
			},
			setItem(name: string, val: string) {
				store[name] = val;
			},
		};
	}
}
const localStorage = getLocalStorage();

type StoreStateType = StoreState;

export default class Store extends Emitter {
	private _state: StoreStateType;

	private localStorageKey: string;

	private dontPersist: Array<keyof StoreStateType>;

	constructor(
		initialState: StoreStateType,
		{
			localStorageKey = 'store',
			dontPersist = [],
		}: {
			localStorageKey?: string;
			dontPersist?: Array<keyof StoreStateType>;
		} = {},
	) {
		super();
		this.localStorageKey = localStorageKey;
		this.dontPersist = dontPersist;

		let storedState;

		try {
			const stored = localStorage.getItem(this.localStorageKey);
			storedState = stored ? JSON.parse(stored) : {};
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
		for (const ignoredKey of this.dontPersist) {
			delete persistable[ignoredKey];
		}
		localStorage.setItem(this.localStorageKey, JSON.stringify(persistable));
	}

	setState(partialState: Partial<StoreStateType>) {
		const prevState = this._state;
		this._state = { ...prevState, ...partialState };
		this.persist();
		this.emit('change', [this._state, prevState, partialState]);
	}

	unsetSinglePropInStateByName(propName: keyof StoreStateType) {
		const prevState = this._state;
		delete prevState[propName];
		this._state = { ...prevState };
		this.persist();
		this.emit('change', [this._state, prevState]);
	}

	setStoredState(storedState: StoreStateType) {
		const prevState = this._state;

		const nonPeristable: Record<string, unknown> = {};

		for (const ignoredKey of this.dontPersist) {
			nonPeristable[ignoredKey] = prevState[ignoredKey];
		}

		this._state = { ...storedState, ...nonPeristable };
		this.emit('change', [this._state, prevState]);
	}
}
