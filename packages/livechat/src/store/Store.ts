import type { Emitter, EventHandlerMap, EventType, Handler, WildcardHandler } from 'mitt';
import mitt from 'mitt';

import type { StoreState, StoreStateKey } from '.';

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
export default class Store<T extends StoreState> implements Emitter {
	private _state: T;

	private localStorageKey: string;

	private dontPersist: StoreStateKey[];

	all: EventHandlerMap;

	on: {
		<T = any>(type: EventType, handler: Handler<T>): void;
		(type: '*', handler: WildcardHandler): void;
	};

	off: {
		<T = any>(type: EventType, handler: Handler<T>): void;
		(type: '*', handler: WildcardHandler): void;
	};

	emit: {
		<T = any>(type: EventType, event?: T): void;
		(type: '*', event?: any): void;
	};

	constructor(
		initialState: T,
		{
			localStorageKey = 'store',
			dontPersist = [],
		}: {
			localStorageKey?: string;
			dontPersist?: StoreStateKey[];
		} = {},
	) {
		const emitter = mitt();
		this.all = emitter.all;
		this.on = emitter.on;
		this.off = emitter.off;
		this.emit = emitter.emit;

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

	setState(partialState: Partial<T>) {
		const prevState = this._state;
		this._state = { ...prevState, ...partialState };
		this.persist();
		this.emit('change', [this._state, prevState, partialState]);
	}

	unsetSinglePropInStateByName(propName: StoreStateKey) {
		const prevState = this._state;
		delete prevState[propName];
		this._state = { ...prevState };
		this.persist();
		this.emit('change', [this._state, prevState]);
	}

	setStoredState(storedState: T) {
		const prevState = this._state;

		const nonPeristable: Record<string, unknown> = {};
		for (const ignoredKey of this.dontPersist) {
			nonPeristable[ignoredKey] = prevState[ignoredKey];
		}
		this._state = { ...storedState, ...nonPeristable };
		this.emit('change', [this._state, prevState]);
	}
}
