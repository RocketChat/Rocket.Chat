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
import { callMethod } from '../../../ui-utils/client/lib/callMethod';
import webSocketHandler from '/app/ws/client';

const fromEntries = Object.fromEntries || function fromEntries(iterable) {
	return [...iterable].reduce((obj, { 0: key, 1: val }) => Object.assign(obj, { [key]: val }), {});
};

const wrap = (fn) => (...args) => new Promise((resolve, reject) => {
	fn(...args, (err, result) => {
		if (err) {
			return reject(err);
		}
		return resolve(result);
	});
});

const localforageGetItem = wrap(localforage.getItem);

class CachedCollectionManagerClass extends EventEmitter {
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

		// Wait 1s to start or the code will run before the connection and
		// on first connection the `reconnect` callbacks will run

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

		Tracker.autorun(() => {
			const uid = Meteor.userId();
			this.logged = uid !== null;
			if (this.logged) {
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
		this.on('reconnect', cb);
	}

	onLogin(cb) {
		this.on('login', cb);
		if (this.logged) {
			cb();
		}
	}
}

export const CachedCollectionManager = new CachedCollectionManagerClass();

const debug = (name) => [getConfig(`debugCachedCollection-${ name }`), getConfig('debugCachedCollection'), getConfig('debug')].includes('true');

const nullLog = function() {};

const log = (...args) => console.log(`CachedCollection ${ this.name } =>`, ...args);

export class CachedCollection extends EventEmitter {
	constructor({
		collection = new Mongo.Collection(null),
		name,
		methodName = `${ name }/get`,
		syncMethodName = `${ name }/get`,
		eventName = `${ name }-changed`,
		eventType = 'onUser',
		userRelated = true,
		listenChangesForLoggedUsersOnly = false,
		useSync = true,
		version = 12,
		maxCacheTime = 60 * 60 * 24 * 30,
		onSyncData = (/* action, record */) => {},
	}) {
		super();
		this.collection = collection;

		this.ready = new ReactiveVar(false);
		this.name = name;
		this.methodName = methodName;
		this.syncMethodName = syncMethodName;
		this.eventName = eventName;
		this.eventType = eventType;
		this.useSync = useSync;
		this.listenChangesForLoggedUsersOnly = listenChangesForLoggedUsersOnly;
		this.version = version;
		this.userRelated = userRelated;
		this.updatedAt = new Date(0);
		this.maxCacheTime = maxCacheTime;
		this.onSyncData = onSyncData;
		this.log = debug(name) ? log : nullLog;

		CachedCollectionManager.register(this);
		if (!userRelated) {
			this.init();
			return;
		}
		CachedCollectionManager.onLogin(() => {
			this.init();
		});
	}

	countQueries() {
		this.log(`${ Object.keys(this.collection._collection.queries).length } queries`);
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
			return false;
		}
		if (data.version < this.version || data.token !== this.getToken()) {
			return false;
		}
		if (data.records.length <= 0) {
			return false;
		}

		if (new Date() - data.updatedAt >= 1000 * this.maxCacheTime) {
			return false;
		}

		this.log(`${ data.records.length } records loaded from cache`);

		data.records.forEach((record) => {
			callbacks.run(`cachedCollection-loadFromCache-${ this.name }`, record);
			// this.collection.direct.insert(record);

			if (!record._updatedAt) {
				return;
			}
			const _updatedAt = new Date(record._updatedAt);
			record._updatedAt = _updatedAt;

			if (_updatedAt > this.updatedAt) {
				this.updatedAt = _updatedAt;
			}
		});

		this.collection._collection._docs._map = fromEntries(data.records.map((record) => [record._id, record]));
		this.updatedAt = data.updatedAt || this.updatedAt;

		Object.values(this.collection._collection.queries).forEach((query) => this.collection._collection._recomputeResults(query));

		return true;
	}

	async loadFromServer() {
		const startTime = new Date();
		const lastTime = this.updatedAt;
		const data = await callMethod(this.methodName);
		this.log(`${ data.length } records loaded from server`);
		data.forEach((record) => {
			callbacks.run(`cachedCollection-loadFromServer-${ this.name }`, record, 'changed');

			this.collection.direct.upsert({ _id: record._id }, _.omit(record, '_id'));

			this.onSyncData('changed', record);

			if (record._updatedAt && record._updatedAt > this.updatedAt) { this.updatedAt = record._updatedAt; }
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
	}, 1000);

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
		CachedChatRoom.save();
	}

	async setupListener(eventType, eventName) {

		console.log(this.eventName);
		
		const { RoomManager } = await import('../../../ui-utils');
		const { ChatRoom, CachedChatRoom } = await import('../../../models');
		webSocketHandler.registerListener(eventName || this.eventName, ({clientAction, data}) => {
			console.log('got room changed');
			
			
		// Notifications[eventType || this.eventType](eventName || this.eventName, (t, record) => {
			console.log(clientAction);
				console.log(data);
			this.log('record received', clientAction, data);
			callbacks.run(`cachedCollection-received-${ this.name }`, data, clientAction);
			if (clientAction === 'removed') {
				let room;
				if (this.eventName === 'subscriptions-changed') {
					room = ChatRoom.findOne(data.rid);
					this.removeRoomFromCacheWhenUserLeaves(room._id, ChatRoom, CachedChatRoom);
				} else {
					room = this.collection.findOne({
						_id: data._id,
					});
				}
				if (room) {
					RoomManager.close(room.t + room.name);
				}
				this.collection.remove(data._id);
			} else {
				const { _id, ...recordData } = data;
				this.collection.direct.upsert({ _id }, recordData);
			}
			this.save();
		});
	}

	trySync(delay = 10) {
		clearTimeout(this.tm);
		// Wait for an empty queue to load data again and sync
		this.tm = setTimeout(async () => {
			if (!await this.sync()) {
				return this.trySync(delay);
			}
			this.save();
		}, delay);
	}

	async sync() {
		if (!this.updatedAt || this.updatedAt.valueOf() === 0 || Meteor.connection._outstandingMethodBlocks.length !== 0) {
			return false;
		}

		const startTime = new Date();
		const lastTime = this.updatedAt;

		this.log(`syncing from ${ this.updatedAt }`);

		const data = await callMethod(this.syncMethodName, this.updatedAt);
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
			const action = record._deletedAt ? 'removed' : 'changed';
			callbacks.run(`cachedCollection-sync-${ this.name }`, record, action);
			const actionTime = record._deletedAt || record._updatedAt;
			const { _id, ...recordData } = record;
			if (record._deletedAt) {
				this.collection.direct.remove({ _id });
			} else {
				this.collection.direct.upsert({ _id }, recordData);
			}
			if (actionTime > this.updatedAt) {
				this.updatedAt = actionTime;
			}
			this.onSyncData(action, record);
		}
		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;

		return true;
	}

	async init() {
		this.ready.set(false);

		if (await this.loadFromCache()) {
			this.trySync();
		} else {
			await this.loadFromServerAndPopulate();
		}

		this.ready.set(true);

		CachedCollectionManager.onReconnect(() => {
			this.trySync();
		});

		if (!this.userRelated) {
			return this.setupListener();
		}

		CachedCollectionManager.onLogin(async () => {
			this.setupListener();
		});
	}
}
