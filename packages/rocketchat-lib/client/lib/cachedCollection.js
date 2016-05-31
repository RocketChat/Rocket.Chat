/* globals localforage */

class CachedCollection {
	constructor({
		collection,
		name,
		methodName,
		eventName,
		eventType = 'onUser',
		sync = true,
		useCache = false,
		debug = true
	}) {
		this.collection = collection || new Meteor.Collection(null);

		this.ready = new ReactiveVar(false);
		this.name = name;
		this.methodName = methodName || name;
		this.eventName = eventName || name;
		this.eventType = eventType;
		this.sync = sync;
		this.useCache = useCache;
		this.debug = debug;
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
			if (data && data.records) {
				this.log(`CachedCollection ${this.name} => ${data.records.length} records loaded from cache`);
				data.records.forEach((item) => {
					item.__cache__ = true;
					this.collection.insert(item);
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
			});

			callback(data);
		});
	}

	loadFromServerAndPopulate(clearCache = false) {
		this.loadFromServer((loadedData) => {
			if (clearCache === true) {
				this.collection.remove({ __cache__: true });
			}
			this.ready.set(true);
			this.saveCache(loadedData);
		});
	}

	saveCache(data) {
		localforage.setItem(this.name, {
			updatedAt: new Date,
			records: data
		});
	}

	setupListener(eventType, eventName) {
		RocketChat.Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
			if (t === 'remove') {
				this.collection.remove(record._id);
			} else {
				const _id = record._id;
				delete record._id;
				this.collection.upsert({ _id: _id }, record);
			}
		});
	}

	init() {
		this.loadFromCache((cacheLoaded) => {
			this.ready.set(cacheLoaded);

			if (cacheLoaded === false) {
				// If there is no cache load data immediately
				this.loadFromServerAndPopulate();
			} else if (this.sync === true) {
				// If there is cache wait for an empty queue to load data again and sync
				const interval = Meteor.setInterval(() => {
					if (Meteor.connection._outstandingMethodBlocks.length === 0) {
						Meteor.clearInterval(interval);
						this.loadFromServerAndPopulate(true);
					}
				}, 500);
			}

			this.setupListener();
		});
	}
}

RocketChat.CachedCollection = CachedCollection;
