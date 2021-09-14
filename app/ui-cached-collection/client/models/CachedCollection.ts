import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';
import localforage from 'localforage';
import _ from 'underscore';
import { Emitter } from '@rocket.chat/emitter';

import { callbacks } from '../../../callbacks/client';
import { getConfig } from '../../../ui-utils/client/config';
import { callMethod } from '../../../ui-utils/client/lib/callMethod';
import { CachedCollectionManager } from './CachedCollectionManager';
import { isRoom } from '../../../../definition/IRoom';
import { isISubscription } from '../../../../definition/ISubscription';
import { isIRocketChatRecord, IRocketChatRecord } from '../../../../definition/IRocketChatRecord';
import type { Notifications } from '../../../notifications/client/lib/Notifications';

type LocalforageRecord<T> ={
	updatedAt: Date;
	version: number;
	token: string;
	records: T[];
}

const debug = (name: string): boolean => [getConfig(`debugCachedCollection-${ name }`), getConfig('debugCachedCollection'), getConfig('debug')].includes('true');

type EventType = keyof Notifications;

export class CachedCollection<T extends IRocketChatRecord> extends Emitter<{
	change: [T, T | undefined];
	remove: [T];
}> {
	ready = new ReactiveVar(false);

	public readonly name: string;

	public collection: Mongo.Collection<T> & { direct: Mongo.Collection<T>; _collection: any };

	private userRelated: boolean;

	public updatedAt: Date;

	public methodName: string;

	public version: number;

	private maxCacheTime: number;

	private syncMethodName: string;

	private tm: ReturnType<typeof setTimeout>;

	public eventName: string;

	public eventType: EventType;

	private useSync: boolean;

	private listenChangesForLoggedUsersOnly: boolean;

	public onSyncData: (action: string, record: IRocketChatRecord) => void;

	private debug: boolean;

	constructor({
		collection = new Mongo.Collection<T>(null),
		name,
		methodName = `${ name }/get`,
		syncMethodName = `${ name }/get`,
		eventName = `${ name }-changed`,
		eventType = 'onUser' as const,
		userRelated = true,
		listenChangesForLoggedUsersOnly = false,
		useSync = true,
		version = 16,
		maxCacheTime = 60 * 60 * 24 * 30,
		onSyncData = (/* action, record */) => undefined,
	}: {
		collection?: Mongo.Collection<T>;
		name: string;
		methodName?: string;
		syncMethodName?: string;
		eventName?: string;
		eventType?: EventType;
		userRelated?: boolean;
		listenChangesForLoggedUsersOnly?: boolean;
		useSync?: boolean;
		version?: number;
		maxCacheTime?: number;
		onSyncData?: (action: string, record: IRocketChatRecord) => void;
	}) {
		super();
		this.collection = collection as any;
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

		this.debug = debug(name);

		CachedCollectionManager.register(this);
		if (!userRelated) {
			this.init();
			return;
		}
		CachedCollectionManager.onLogin(() => {
			this.init();
		});
	}

	countQueries(): void {
		this.log(`${ Object.keys(this.collection._collection.queries).length } queries`);
	}

	getToken(): string | undefined {
		if (this.userRelated === false) {
			return undefined;
		}

		return Accounts._storedLoginToken();
	}

	private log = (...args: Parameters<typeof console.log>): void => {
		if (!this.debug) {
			return;
		}
		console.log(`CachedCollection ${ this.name } =>`, ...args);
	}

	async loadFromCache(): Promise<boolean> {
		const data: LocalforageRecord<T> = await localforage.getItem(this.name) as unknown as LocalforageRecord<T>;
		if (!data) {
			return false;
		}
		if (data.version < this.version || data.token !== this.getToken()) {
			return false;
		}
		if (data.records.length <= 0) {
			return false;
		}

		if (new Date().getTime() - data.updatedAt.getTime() >= 1000 * this.maxCacheTime) {
			return false;
		}

		this.log(`${ data.records.length } records loaded from cache`);

		data.records.forEach((record) => {
			callbacks.run(`cachedCollection-loadFromCache-${ this.name }`, record);
			// this.collection.direct.insert(record);

			if (!isIRocketChatRecord(record)) {
				return;
			}

			const _updatedAt = new Date(record._updatedAt);
			record._updatedAt = _updatedAt;

			if (isRoom(record) && record.lastMessage && typeof record.lastMessage._updatedAt === 'string') {
				record.lastMessage._updatedAt = new Date(record.lastMessage._updatedAt);
			}

			if (_updatedAt > this.updatedAt) {
				this.updatedAt = _updatedAt;
			}
		});

		this.collection._collection._docs._map = new Map(data.records.map((record) => [record._id, record]));

		this.updatedAt = data.updatedAt || this.updatedAt;

		Object.values(this.collection._collection.queries).forEach((query) => this.collection._collection._recomputeResults(query));

		return true;
	}

	async loadFromServer(): Promise<void> {
		const startTime = new Date();
		const lastTime = this.updatedAt;
		const data: T[] = await callMethod(this.methodName);
		this.log(`${ data.length } records loaded from server`);
		data.forEach((record) => {
			callbacks.run(`cachedCollection-loadFromServer-${ this.name }`, record, 'changed');
			this.collection.direct.upsert({ _id: record._id }, _.omit(record, '_id'));

			this.onSyncData('changed', record);

			if (record._updatedAt && record._updatedAt > this.updatedAt) { this.updatedAt = record._updatedAt; }
		});
		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;
	}

	async loadFromServerAndPopulate(): Promise<void> {
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

	clearCacheOnLogout(): void {
		if (this.userRelated === true) {
			this.clearCache();
		}
	}

	clearCache(): void {
		this.log('clearing cache');
		localforage.removeItem(this.name);
		this.collection.remove({});
	}

	async setupListener(): Promise<void> {
		const { RoomManager } = await import('../../../ui-utils/client');
		const { ChatRoom, CachedChatRoom } = await import('../../../models/client');
		const { Notifications } = await import('../../../notifications/client/lib/Notifications');

		(Notifications as any)[this.eventType](this.eventName, (t: 'changed' | 'removed' | 'added', record: T) => {
			this.log('record received', t, record);
			const oldRecord = { ...this.collection._collection._docs._map.get(record._id) as T | undefined };
			callbacks.run(`cachedCollection-received-${ this.name }`, record, t);
			if (t === 'removed') {
				let room;
				if (this.eventName === 'subscriptions-changed' && isISubscription(record)) {
					room = ChatRoom.findOne({ _id: record.rid });
					if (room) {
						ChatRoom.remove(room._id);
						CachedChatRoom.save();
					}
				} else {
					room = this.collection.findOne({ _id: record._id });
				}
				if (isRoom(room)) {
					room.name && RoomManager.close(room.t + room.name);
					!room.name && RoomManager.close(room.t + room._id);
				}
				this.collection.remove({ _id: record._id });
				oldRecord && this.emit('remove', [oldRecord]);
			} else {
				const { _id, ...recordData } = record;
				this.collection.direct.upsert({ _id }, recordData as T);
				this.emit('change', [record, oldRecord]);
			}

			this.save();
		});
	}

	private trySync(delay = 10): void {
		clearTimeout(this.tm);
		// Wait for an empty queue to load data again and sync
		this.tm = setTimeout(async () => {
			if (!await this.sync()) {
				return this.trySync(delay);
			}
			this.save();
		}, delay);
	}

	async sync(): Promise<boolean> {
		if (!this.updatedAt || this.updatedAt.valueOf() === 0 || (Meteor as any).connection._outstandingMethodBlocks.length !== 0) {
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

	async init(): Promise<void> {
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
