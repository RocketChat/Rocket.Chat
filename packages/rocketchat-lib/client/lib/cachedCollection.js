/* globals localforage */

class CachedCollectionManager {
	constructor() {
		this.items = [];

		const _unstoreLoginToken = Accounts._unstoreLoginToken;
		Accounts._unstoreLoginToken = (...args) => {
			_unstoreLoginToken.apply(Accounts, args);
			this.clearAllCache();
		};
	}

	register(cachedCollection) {
		this.items.push(cachedCollection);
	}

	clearAllCache() {
		for (const item of this.items) {
			item.clearCache();
		}
	}
}

RocketChat.CachedCollectionManager = new CachedCollectionManager;


class CachedCollection {
	constructor({
		collection,
		name,
		methodName,
		syncMethodName,
		eventName,
		eventType = 'onUser',
		useSync = true,
		useCache = true,
		debug = true,
		version = 0,
		maxCacheTime = 60*60*24*30
	}) {
		this.collection = collection || new Meteor.Collection(null);

		this.ready = new ReactiveVar(false);
		this.name = name;
		this.methodName = methodName || `${name}/get`;
		this.syncMethodName = syncMethodName || `${name}/sync`;
		this.eventName = eventName || `${name}-changed`;
		this.eventType = eventType;
		this.useSync = useSync;
		this.useCache = useCache;
		this.debug = debug;
		this.version = version;
		this.updatedAt = new Date(2000, 1, 1);
		this.maxCacheTime = maxCacheTime;

		RocketChat.CachedCollectionManager.register(this);
	}

	log(...args) {
		if (this.debug === true) {
			console.log(...args);
		}
	}

	loadFromCache(callback = () => {}) {
		if (this.useCache === false) {
			return callback(false);
		}

		localforage.getItem(this.name, (error, data) => {
			if (data && data.version < this.version) {
				this.clearCache();
				callback(false);
				return;
			}

			const now = new Date();
			if (data && now - data.updatedAt >= 1000*this.maxCacheTime) {
				this.clearCache();
				callback(false);
				return;
			}

			if (data && data.records && data.records.length > 0) {
				this.log(`CachedCollection ${this.name} => ${data.records.length} records loaded from cache`);
				data.records.forEach((item) => {
					item.__cache__ = true;
					const _id = item._id;
					delete item._id;
					this.collection.upsert({ _id: _id }, item);
					item._id = _id;

					if (item._updatedAt && item._updatedAt > this.updatedAt) {
						this.updatedAt = item._updatedAt;
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
			this.log(`CachedCollection ${this.name} => ${data.length} records loaded from server`);
			data.forEach((item) => {
				const _id = item._id;
				delete item._id;
				this.collection.upsert({ _id: _id }, item);
				item._id = _id;

				if (item._updatedAt && item._updatedAt > this.updatedAt) {
					this.updatedAt = item._updatedAt;
				}
			});

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
		this.log(`CachedCollection ${this.name} => syncing from ${this.updatedAt}`);

		Meteor.call(this.syncMethodName, this.updatedAt, (error, data) => {
			if (data.update && data.update.length > 0) {
				this.log(`CachedCollection ${this.name} => ${data.update.length} records updated in sync`);

				for (const record of data.update) {
					const _id = record._id;
					delete record._id;
					this.collection.upsert({ _id: _id }, record);
					record._id = _id;

					if (record._updatedAt && record._updatedAt > this.updatedAt) {
						this.updatedAt = record._updatedAt;
					}
				}
			}

			if (data.remove && data.remove.length > 0) {
				this.log(`CachedCollection ${this.name} => ${data.remove.length} records removed in sync`);

				for (const record of data.remove) {
					this.collection.remove({ _id: record._id });

					if (record._deletedAt && record._deletedAt > this.updatedAt) {
						this.updatedAt = record._deletedAt;
					}
				}
			}

			this.saveCache(this.collection.find().fetch());
		});
	}

	saveCache(data) {
		localforage.setItem(this.name, {
			updatedAt: new Date,
			version: this.version,
			records: data
		});
	}

	clearCache() {
		localforage.removeItem(this.name);
	}

	setupListener(eventType, eventName) {
		RocketChat.Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
			if (t === 'remove') {
				this.collection.remove(record._id);
			} else {
				const _id = record._id;
				delete record._id;
				this.collection.upsert({ _id: _id }, record);
				record._id = _id;
			}

			this.saveCache(this.collection.find().fetch());
		});
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
				// If there is cache wait for an empty queue to load data again and sync
				const interval = Meteor.setInterval(() => {
					if (Meteor.connection._outstandingMethodBlocks.length === 0) {
						Meteor.clearInterval(interval);
						this.sync();
					}
				}, 500);
			}

			if (this.useSync === true) {
				let connectionWasOnline = true;
				Tracker.autorun(() => {
					const connected = Meteor.connection.status().connected;

					if (connected === true && connectionWasOnline === false) {
						this.sync();
					}

					connectionWasOnline = connected;
				});
			}

			this.setupListener();
		});
	}
}

RocketChat.CachedCollection = CachedCollection;
