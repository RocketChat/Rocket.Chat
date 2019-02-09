import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import localforage from 'localforage';
import { callbacks } from 'meteor/rocketchat:callbacks';
import _ from 'underscore';

class CachedCollectionManagerClass {
	constructor() {
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
			if (Meteor.userId() !== null) {
				if (this.logged === false) {
					for (const cb of this.loginCb) {
						cb();
					}
				}
			}

			this.logged = Meteor.userId() !== null;
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

export const CachedCollectionManager = new CachedCollectionManagerClass;

const debug = false;

const nullLog = function() {};

const log = function(...args) {
	console.log(`CachedCollection ${ this.name } =>`, ...args);
};

export class CachedCollection {
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
		this.debug = debug;
		this.version = version;
		this.userRelated = userRelated;
		this.updatedAt = new Date(0);
		this.maxCacheTime = maxCacheTime;
		this.onSyncData = onSyncData;
		this.log = debug ? log : nullLog;
		CachedCollectionManager.register(this);

		if (userRelated === true) {
			CachedCollectionManager.onLogin(() => {
				this.log('Init on login');
				this.ready.set(false);
				this.updatedAt = new Date(0);
				this.initiated = false;
				this.init();
			});
		}

		if (this.useCache === false) {
			return this.clearCache();
		}
	}

	countQueries() {
		this.log(`${ Object.keys(this.collection._collection.queries).length } queries`);
	}

	recomputeCollectionQueries() {
		this.log(`recomputing ${ Object.keys(this.collection._collection.queries).length } queries`);
		_.each(this.collection._collection.queries, (query) => {
			this.collection._collection._recomputeResults(query);
		});
	}

	getToken() {
		if (this.userRelated === false) {
			return undefined;
		}

		return Accounts._storedLoginToken();
	}

	loadFromCache(callback = () => {}) {
		if (this.useCache === false) {
			return callback(false);
		}

		localforage.getItem(this.name, (error, data) => {
			if (data && (data.version < this.version || data.token !== this.getToken() || this.getToken() === undefined)) {
				this.clearCache();
				callback(false);
				return;
			}

			const now = new Date();
			if (data && now - data.updatedAt >= 1000 * this.maxCacheTime) {
				this.clearCache();
				callback(false);
				return;
			}

			if (data && data.records && data.records.length > 0) {
				this.log(`${ data.records.length } records loaded from cache`);
				data.records.forEach((record) => {
					callbacks.run(`cachedCollection-loadFromCache-${ this.name }`, record);
					record.__cache__ = true;
					this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));

					if (record._updatedAt) {
						const _updatedAt = new Date(record._updatedAt);
						if (_updatedAt > this.updatedAt) {
							this.updatedAt = _updatedAt;
						}
					}
				});

				callback(true);
			} else {
				callback(false);
			}
		});
	}

	loadFromServer(callback = () => {}) {
		Meteor.call(this.methodName, (error, data) => {
			this.log(`${ data.length } records loaded from server`);
			data.forEach((record) => {
				callbacks.run(`cachedCollection-loadFromServer-${ this.name }`, record, 'changed');
				this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));

				this.onSyncData('changed', record);

				if (record._updatedAt && record._updatedAt > this.updatedAt) {
					this.updatedAt = record._updatedAt;
				}
			});
			this.recomputeCollectionQueries();

			if (this.updatedAt < new Date) {
				this.updatedAt = new Date;
			}

			callback(data);
		});
	}

	loadFromServerAndPopulate() {
		this.loadFromServer((loadedData) => {
			this.ready.set(true);
			this.saveCache(loadedData);
		});
	}

	sync() {
		if (CachedCollectionManager.syncEnabled === false || Meteor.connection._outstandingMethodBlocks.length !== 0) {
			return false;
		}

		this.log(`syncing from ${ this.updatedAt }`);

		Meteor.call(this.syncMethodName, this.updatedAt, (error, data) => {
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

			for (const record of changes) {
				callbacks.run(`cachedCollection-sync-${ this.name }`, record, record._deletedAt ? 'removed' : 'changed');
				if (record._deletedAt) {
					this.collection.remove({ _id: record._id });

					this.onSyncData('removed', record);

					if (record._deletedAt && record._deletedAt > this.updatedAt) {
						this.updatedAt = record._deletedAt;
					}
				} else {
					this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));

					this.onSyncData('changed', record);

					if (record._updatedAt && record._updatedAt > this.updatedAt) {
						this.updatedAt = record._updatedAt;
					}
				}
			}

			this.saveCache();
		});

		return true;
	}

	saveCache(data) {
		if (this.useCache === false) {
			return;
		}

		this.log('saving cache');
		if (!data) {
			data = this.collection.find().fetch();
		}

		localforage.setItem(this.name, {
			updatedAt: new Date,
			version: this.version,
			token: this.getToken(),
			records: data,
		});
		this.log('saving cache (done)');
	}

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

	removeRoomFromCacheWhenUserLeaves(roomId, ChatRoom, CachedChatRoom) {
		ChatRoom.remove(roomId);
		CachedChatRoom.saveCache();
	}

	async setupListener(eventType, eventName) {
		Meteor.startup(async() => {
			const { Notifications } = await import('meteor/rocketchat:notifications');
			const { RoomManager } = await import('meteor/rocketchat:ui');
			const { ChatRoom } = await import('meteor/rocketchat:models');
			const { CachedChatRoom } = await import('meteor/rocketchat:models');
			Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
				this.log('record received', t, record);
				callbacks.run(`cachedCollection-received-${ this.name }`, record, t);
				if (t === 'removed') {
					let room;
					if (this.eventName === 'subscriptions-changed') {
						room = ChatRoom.findOne(record.rid);
						this.removeRoomFromCacheWhenUserLeaves(room._id, ChatRoom, CachedChatRoom);
					} else {
						room = this.collection.findOne({ _id: record._id });
					}
					if (room) {
						RoomManager.close(room.t + room.name);
					}
					this.collection.remove(record._id);
				} else {
					this.collection.upsert({ _id: record._id }, _.omit(record, '_id'));
				}
				this.saveCache();
			});
		});
	}

	trySync() {
		// Wait for an empty queue to load data again and sync
		const interval = Meteor.setInterval(() => {
			if (this.sync()) {
				Meteor.clearInterval(interval);
			}
		}, 200);
	}

	init() {
		if (this.initiated === true) {
			return;
		}

		this.initiated = true;
		this.loadFromCache((cacheLoaded) => {
			this.ready.set(cacheLoaded);

			if (cacheLoaded === false) {
				// If there is no cache load data immediately
				this.loadFromServerAndPopulate();
			} else if (this.useSync === true) {
				this.trySync();
			}

			if (this.useSync === true) {
				CachedCollectionManager.onReconnect(() => {
					this.trySync();
				});
			}

			if (this.listenChangesForLoggedUsersOnly) {
				CachedCollectionManager.onLogin(() => {
					this.setupListener();
				});
			} else {
				this.setupListener();
			}
		});
	}
}
