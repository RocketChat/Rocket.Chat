import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Accounts } from 'meteor/accounts-base';
import { Tracker } from 'meteor/tracker';
import { Emitter } from '@rocket.chat/emitter';

import { IUser } from '../../../../definition/IUser';

class CachedCollectionManagerClass extends Emitter<{
	login: IUser['_id'];
	reconnect: undefined;
}> {
	private items: unknown[] = [];

	private _syncEnabled: boolean;

	public logged = false;

	public step = 0 | 1 | 2;

	constructor() {
		super();

		this._syncEnabled = false;
		this.logged = false;
		this.step = 0;
	}

	register(cachedCollection): void {
		this.items.push(cachedCollection);
	}

	clearAllCache(): void {
		for (const item of this.items) {
			item.clearCache();
		}
	}

	clearAllCacheOnLogout(): void {
		for (const item of this.items) {
			item.clearCacheOnLogout();
		}
	}

	countQueries(): void {
		for (const item of this.items) {
			item.countQueries();
		}
	}

	set syncEnabled(value) {
		check(value, Boolean);
		this._syncEnabled = value;
	}

	get syncEnabled(): boolean {
		return this._syncEnabled;
	}

	onReconnect(cb): void {
		this.on('reconnect', cb);
	}

	onLogin(cb): void {
		this.on('login', cb);
		if (this.logged) {
			cb();
		}
	}
}

export const CachedCollectionManager = new CachedCollectionManagerClass();

// Wait 1s to start or the code will run before the connection and
// on first connection the `reconnect` callbacks will run

Tracker.autorun(() => {
	const [WAITING_FIRST_CONNECTION, WAITING_FIRST_DISCONNECTION, LISTENING_RECONNECTIONS] = [0, 1, 2];
	CachedCollectionManager.step = CachedCollectionManager.step || WAITING_FIRST_CONNECTION;
	const { connected } = Meteor.status();
	switch (CachedCollectionManager.step) {
		case WAITING_FIRST_CONNECTION:
			return !connected || CachedCollectionManager.step++;
		case WAITING_FIRST_DISCONNECTION:
			return connected || CachedCollectionManager.step++;
		case LISTENING_RECONNECTIONS:
			return connected && CachedCollectionManager.emit('reconnect');
	}
});

Tracker.autorun(() => {
	const uid = Meteor.userId();
	CachedCollectionManager.logged = uid !== null;
	if (CachedCollectionManager.logged) {
		CachedCollectionManager.emit('login', uid);
	}
});

const { _unstoreLoginToken } = Accounts;
Accounts._unstoreLoginToken = (...args) => {
	_unstoreLoginToken.apply(Accounts, args);
	CachedCollectionManager.clearAllCacheOnLogout();
};
