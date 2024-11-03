import { Emitter } from '@rocket.chat/emitter';
import { Accounts } from 'meteor/accounts-base';
import { check } from 'meteor/check';
import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

import type { CachedCollection } from './CachedCollection';

class CachedCollectionManager extends Emitter<{ reconnect: void; login: string | null }> {
	private items: CachedCollection<any>[];

	private _syncEnabled: boolean;

	private logged: boolean;

	private step: number;

	constructor() {
		super();
		this.items = [];
		this._syncEnabled = false;
		this.logged = false;

		const { _unstoreLoginToken } = Accounts;
		Accounts._unstoreLoginToken = (...args) => {
			_unstoreLoginToken.apply(Accounts, args);
			this.clearAllCacheOnLogout();
		};

		Tracker.autorun(() => {
			const [WAITING_FIRST_CONNECTION, WAITING_FIRST_DISCONNECTION, LISTENING_RECONNECTIONS] = [0, 1, 2];
			this.step = this.step || WAITING_FIRST_CONNECTION;
			const { connected } = Meteor.status();
			switch (this.step) {
				case WAITING_FIRST_CONNECTION:
					return !connected || this.step++;
				case WAITING_FIRST_DISCONNECTION:
					return connected || this.step++;
				case LISTENING_RECONNECTIONS:
					return connected && this.emit('reconnect');
			}
		});

		Accounts.onLogin(() => {
			this.emit('login', Meteor.userId());
		});
		Tracker.autorun(() => {
			const uid = Meteor.userId();
			this.logged = uid !== null;
		});
	}

	register(cachedCollection: CachedCollection<any>) {
		this.items.push(cachedCollection);
	}

	clearAllCache() {
		for (const item of this.items) {
			void item.clearCache();
		}
	}

	clearAllCacheOnLogout() {
		for (const item of this.items) {
			item.clearCacheOnLogout();
		}
	}

	set syncEnabled(value) {
		check(value, Boolean);
		this._syncEnabled = value;
	}

	get syncEnabled() {
		return this._syncEnabled;
	}

	onReconnect(cb: () => void) {
		this.on('reconnect', cb);
	}

	onLogin(cb: () => void) {
		this.on('login', cb);
		if (this.logged) {
			cb();
		}
	}
}

const instance = new CachedCollectionManager();

export {
	/** @deprecated */
	instance as CachedCollectionManager,
};
