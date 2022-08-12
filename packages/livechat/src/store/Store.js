import mitt from 'mitt';

import { parentCall } from '../lib/parentCall';
import { createToken } from '../lib/random';

const { localStorage, sessionStorage } = window;

export default class Store {
	constructor(initialState = {}, { localStorageKey = 'store', dontPersist = [] } = {}) {
		Object.assign(this, mitt());

		this.localStorageKey = localStorageKey;
		this.dontPersist = dontPersist;

		let storedState;

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

		window.addEventListener('load', () => {
			const sessionId = createToken();
			sessionStorage.setItem('sessionId', sessionId);
			const { openSessionIds = [] } = this._state;
			this.setState({ openSessionIds: [sessionId, ...openSessionIds] });
		});

		window.addEventListener('visibilitychange', () => {
			!this._state.minimized && !this._state.triggered && parentCall('openWidget');
			this._state.iframe.visible ? parentCall('showWidget') : parentCall('hideWidget');
		});

		window.addEventListener('beforeunload', () => {
			const sessionId = sessionStorage.getItem('sessionId');
			const { openSessionIds = [] } = this._state;
			this.setState({ openSessionIds: openSessionIds.filter((session) => session !== sessionId) });
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

	setState(partialState) {
		const prevState = this._state;
		this._state = { ...prevState, ...partialState };
		this.persist();
		this.emit('change', [this._state, prevState, partialState]);
	}

	unsetSinglePropInStateByName(propName) {
		const prevState = this._state;
		delete prevState[propName];
		this._state = { ...prevState };
		this.persist();
		this.emit('change', [this._state, prevState]);
	}

	setStoredState(storedState) {
		const prevState = this._state;

		const nonPeristable = {};
		for (const ignoredKey of this.dontPersist) {
			nonPeristable[ignoredKey] = prevState[ignoredKey];
		}
		this._state = { ...storedState, ...nonPeristable };
		this.emit('change', [this._state, prevState]);
	}
}
