import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import localforage from 'localforage';
import _ from 'underscore';
import EventEmitter from 'wolfy87-eventemitter';

import { callbacks } from '../../../callbacks';
import Notifications from '../../../notifications/client/lib/Notifications';
import { getConfig } from '../../../ui-utils/client/config';

const call = (method, ...params) =>
	new Promise((resolve, reject) => {
		Meteor.call(method, ...params, (err, result) => {
			if (err) {
				return reject(err);
			}
			return resolve(result);
		});
	});
class CachedCollectionManagerClass extends EventEmitter {
	constructor() {
		super();
		this.items = [];
		this._syncEnabled = false;
		this.reconnectCb = [];
		this.loginCb = [];
		this.logged = false;

		const { _unstoreLoginToken } = Accounts;
		Accounts._unstoreLoginToken = (...args) => {
			_unstoreLoginToken.apply(Accounts, args);
			this.clearAllCacheOnLogout();
		};

		// Wait 1s to start or the code will run before the connection and
		// on first connection the `reconnect` callbacks will run
		Meteor.setTimeout(() => {
			let connectionWasOnline = true;
			Tracker.autorun(() => {
				const { connected } = Meteor.connection.status();

				if (connected === true && connectionWasOnline === false) {
					for (const cb of this.reconnectCb) {
						cb();
					}
				}

				connectionWasOnline = connected;
			});
		}, 1000);

		Tracker.autorun(() => {
			const uid = Meteor.userId();
			this.logged = uid !== null;
			if (this.logged) {
				for (const cb of this.loginCb) {
					cb();
				}
				this.emit('login', uid);
			}
		});
	}

	register(cachedCollection) {
		this.items.push(cachedCollection);
	}

	clearAllCache() {
		for (const item of this.items) {
			item.clearCache();
		}
	}

	clearAllCacheOnLogout() {
		for (const item of this.items) {
			item.clearCacheOnLogout();
		}
	}

	countQueries() {
		for (const item of this.items) {
			item.countQueries();
		}
	}

	set syncEnabled(value) {
		check(value, Boolean);
		this._syncEnabled = value;
	}

	get syncEnabled() {
		return this._syncEnabled;
	}

	onReconnect(cb) {
		this.reconnectCb.push(cb);
	}

	onLogin(cb) {
		this.loginCb.push(cb);
		if (this.logged) {
			cb();
		}
	}
}

export const CachedCollectionManager = new CachedCollectionManagerClass();

const debug = (name) => [getConfig(`debugCachedCollection-${ name }`), getConfig('debugCachedCollection'), getConfig('debug')].includes('true');

const nullLog = function() {};

const log = function(...args) {
	console.log(`CachedCollection ${ this.name } =>`, ...args);
};

const localforageGetItem = (name) => new Promise((resolve, reject) => {
	localforage.getItem(name, (error, data) => {
		if (error) {
			return reject(error);
		}
		resolve(data);
	});
});
export class CachedCollection extends EventEmitter {
	constructor({
		collection,
		name,
		methodName,
		syncMethodName,
		eventName,
		eventType = 'onUser',
		userRelated = true,
		listenChangesForLoggedUsersOnly = false,
		useSync = true,
		useCache = true,
		version = 8,
		maxCacheTime = 60 * 60 * 24 * 30,
		onSyncData = (/* action, record */) => {},
	}) {
		super();
		this.collection = collection || new Mongo.Collection(null);

		this.ready = new ReactiveVar(false);
		this.name = name;
		this.methodName = methodName || `${ name }/get`;
		this.syncMethodName = syncMethodName || `${ name }/get`;
		this.eventName = eventName || `${ name }-changed`;
		this.eventType = eventType;
		this.useSync = useSync;
		this.useCache = useCache;
		this.listenChangesForLoggedUsersOnly = listenChangesForLoggedUsersOnly;
		this.version = version;
		this.userRelated = userRelated;
		this.updatedAt = new Date(0);
		this.maxCacheTime = maxCacheTime;
		this.onSyncData = onSyncData;
		this.log = debug(name) ? log : nullLog;

		CachedCollectionManager.register(this);

		CachedCollectionManager.once('login', console.log);
		if (userRelated === true) {
			CachedCollectionManager.onLogin(() => {
				this.init();
			});
		}
	}

	countQueries() {
		this.log(
			`${
				Object.keys(this.collection._collection.queries).length
			} queries`
		);
	}

	getToken() {
		if (this.userRelated === false) {
			return undefined;
		}

		return Accounts._storedLoginToken();
	}

	async loadFromCache() {
		const data = await localforageGetItem(this.name);
		if (!data) {
			return Promise.reject('empty');
		}
		if (data.version < this.version || data.token !== this.getToken()) {
			return Promise.reject('version changed');
		}
		if (data.records.length <= 0) {
			return Promise.reject('no records found');
		}

		if (
			new Date() - data.updatedAt
							>= 1000 * this.maxCacheTime
		) {
			return Promise.reject('cache too old');
		}

		this.log(`${ data.records.length } records loaded from cache`);
		data.records.forEach((record) => {
			callbacks.run(
				`cachedCollection-loadFromCache-${ this.name }`,
				record
			);
			// this.collection.direct.insert(record);

			if (record._updatedAt) {
				return;
			}
			const _updatedAt = new Date(record._updatedAt);
			if (_updatedAt > this.updatedAt) {
				this.updatedAt = _updatedAt;
			}
		});
		const entries = data.records.map((record) => [record._id, record]);
		this.collection._collection._docs._map = Object.fromEntries(entries);
		this.updatedAt = data.updatedAt;
		_.each(this.collection._collection.queries, (query) => {
			this.collection._collection._recomputeResults(query);
		});
	}

	async loadFromServer() {
		const startTime = new Date();
		const lastTime = this.updatedAt;
		const data = await call(this.methodName);
		this.log(`${ data.length } records loaded from server`);
		data.forEach((record) => {
			callbacks.run(
				`cachedCollection-loadFromServer-${ this.name }`,
				record,
				'changed'
			);
			this.collection.direct.upsert(
				{ _id: record._id },
				_.omit(record, '_id')
			);

			this.onSyncData('changed', record);

			if (
				record._updatedAt
								&& record._updatedAt > this.updatedAt
			) {
				this.updatedAt = record._updatedAt;
			}
		});
		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;
	}

	async loadFromServerAndPopulate() {
		await this.loadFromServer();
		this.save();
	}

	save = _.debounce(() => {
		this.log('saving cache');
		const data = this.collection.find().fetch();
		localforage.setItem(this.name, {
			updatedAt: this.updatedAt,
			version: this.version,
			token: this.getToken(),
			records: data,
		});
		this.log('saving cache (done)');
	}, 1000)

	clearCacheOnLogout() {
		if (this.userRelated === true) {
			this.clearCache();
		}
	}

	clearCache() {
		this.log('clearing cache');
		localforage.removeItem(this.name);
		this.collection.remove({});
	}

	removeRoomFromCacheWhenUserLeaves(
		roomId,
		ChatRoom,
		CachedChatRoom
	) {
		ChatRoom.remove(roomId);
		CachedChatRoom.save();
	}

	async setupListener(eventType, eventName) {
		const { RoomManager } = await import('../../../ui-utils');
		const { ChatRoom, CachedChatRoom } = await import(
			'../../../models'
		);
		Notifications[eventType || this.eventType](
			eventName || this.eventName,
			(t, record) => {
				this.log('record received', t, record);
				callbacks.run(
					`cachedCollection-received-${ this.name }`,
					record,
					t
				);
				if (t === 'removed') {
					let room;
					if (this.eventName === 'subscriptions-changed') {
						room = ChatRoom.findOne(record.rid);
						this.removeRoomFromCacheWhenUserLeaves(
							room._id,
							ChatRoom,
							CachedChatRoom
						);
					} else {
						room = this.collection.findOne({
							_id: record._id,
						});
					}
					if (room) {
						RoomManager.close(room.t + room.name);
					}
					this.collection.remove(record._id);
				} else {
					this.collection.direct.upsert(
						{ _id: record._id },
						_.omit(record, '_id')
					);
				}
				this.save();
			}
		);
	}

	trySync(delay = 10) {
		clearTimeout(this.tm);
		// Wait for an empty queue to load data again and sync
		this.tm = setTimeout(async () => {
			if (!await this.sync()) {
				return this.trySync(delay + delay);
			}
			this.save();
		}, delay);
	}

	async sync() {
		if (Meteor.connection._outstandingMethodBlocks.length !== 0) {
			return false;
		}

		const startTime = new Date();
		const lastTime = this.updatedAt;

		this.log(`syncing from ${ this.updatedAt }`);

		const data = await call(this.syncMethodName, this.updatedAt);
		let changes = [];

		if (data.update && data.update.length > 0) {
			this.log(`${ data.update.length } records updated in sync`);
			changes.push(...data.update);
		}

		if (data.remove && data.remove.length > 0) {
			this.log(`${ data.remove.length } records removed in sync`);
			changes.push(...data.remove);
		}

		changes = changes.sort((a, b) => {
			const valueA = a._updatedAt || a._deletedAt;
			const valueB = b._updatedAt || b._deletedAt;

			if (valueA < valueB) {
				return -1;
			}

			if (valueA > valueB) {
				return 1;
			}

			return 0;
		});

		for (const { _id, ...record } of changes) {
			const action = record._deletedAt ? 'removed' : 'changed';
			callbacks.run(
				`cachedCollection-sync-${ this.name }`,
				record,
				action
			);
			const actionTime = record._deletedAt || record._updatedAt;
			if (record._deletedAt) {
				this.collection.direct.remove({ _id });
			} else {
				this.collection.direct.upsert({ _id }, record);
			}
			if (actionTime > this.updatedAt) {
				this.updatedAt = record._updatedAt;
			}
			this.onSyncData(action, { _id, ...record });
		}
		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;
		return true;
	}

	async init() {
		try {
			this.ready.set(false);
			await this.loadFromCache();
			this.trySync();
		} catch (error) {
			await this.loadFromServerAndPopulate();
		} finally {
			this.ready.set(true);
		}

		if (!this.listenChangesForLoggedUsersOnly) {
			CachedCollectionManager.onReconnect(() => {
				this.trySync();
			});
			return this.setupListener();
		}

		CachedCollectionManager.on('login', async () => {
			await this.setupListener();
			this.trySync();
		});
	}
}
