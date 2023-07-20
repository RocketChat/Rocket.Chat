import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { Accounts } from 'meteor/accounts-base';
import { ReactiveVar } from 'meteor/reactive-var';
import { Emitter } from '@rocket.chat/emitter';
import localforage from 'localforage';

import Notifications from '../../../notifications/client/lib/Notifications';
import { getConfig } from '../../../../client/lib/utils/getConfig';
import { CachedCollectionManager } from './CachedCollectionManager';
import { withDebouncing } from '../../../../lib/utils/highOrderFunctions';
import { isTruthy } from '../../../../lib/isTruthy';
import type { MinimongoCollection } from '../../../../client/definitions/MinimongoCollection';
import { sdk } from '../../../utils/client/lib/SDKClient';

export type EventType = Extract<keyof typeof Notifications, `on${string}`>;

type Name = 'rooms' | 'subscriptions' | 'permissions' | 'public-settings' | 'private-settings';

const hasId = <T>(record: T): record is T & { _id: string } => typeof record === 'object' && record !== null && '_id' in record;
const hasUpdatedAt = <T>(record: T): record is T & { _updatedAt: Date } =>
	typeof record === 'object' &&
	record !== null &&
	'_updatedAt' in record &&
	(record as unknown as { _updatedAt: unknown })._updatedAt instanceof Date;
const hasDeletedAt = <T>(record: T): record is T & { _deletedAt: Date } =>
	typeof record === 'object' &&
	record !== null &&
	'_deletedAt' in record &&
	(record as unknown as { _deletedAt: unknown })._deletedAt instanceof Date;
const hasUnserializedUpdatedAt = <T>(record: T): record is T & { _updatedAt: ConstructorParameters<typeof Date>[0] } =>
	typeof record === 'object' &&
	record !== null &&
	'_updatedAt' in record &&
	!((record as unknown as { _updatedAt: unknown })._updatedAt instanceof Date);

export class CachedCollection<T extends { _id: string }, U = T> extends Emitter<{ changed: T; removed: T }> {
	private static MAX_CACHE_TIME = 60 * 60 * 24 * 30;

	public collection: MinimongoCollection<T>;

	public ready = new ReactiveVar(false);

	public name: Name;

	public eventType: EventType;

	public version = 18;

	public userRelated: boolean;

	public updatedAt = new Date(0);

	public log: (...args: any[]) => void;

	public timer: ReturnType<typeof setTimeout>;

	constructor({
		name,
		eventType = 'onUser',
		userRelated = true,
		noInit,
	}: {
		name: Name;
		eventType?: EventType;
		userRelated?: boolean;
		noInit?: boolean;
	}) {
		super();

		this.collection = new Mongo.Collection(null) as MinimongoCollection<T>;

		this.name = name;
		this.eventType = eventType;
		this.userRelated = userRelated;

		this.log = [getConfig(`debugCachedCollection-${this.name}`), getConfig('debugCachedCollection'), getConfig('debug')].includes('true')
			? console.log.bind(console, `%cCachedCollection ${this.name}`, `color: navy; font-weight: bold;`)
			: () => undefined;

		CachedCollectionManager.register(this);

		if (noInit) {
			this.ready.set(true);
			return;
		}

		if (!userRelated) {
			void this.init();
			return;
		}

		CachedCollectionManager.onLogin(() => {
			void this.init();
		});
	}

	protected get eventName(): `${Name}-changed` {
		return `${this.name}-changed`;
	}

	getToken() {
		if (this.userRelated === false) {
			return undefined;
		}

		return Accounts._storedLoginToken();
	}

	private async loadFromCache() {
		const data = await localforage.getItem<{ version: number; token: unknown; records: unknown[]; updatedAt: Date | string }>(this.name);

		if (!data) {
			return false;
		}

		if (data.version < this.version || data.token !== this.getToken()) {
			return false;
		}

		if (data.records.length <= 0) {
			return false;
		}

		// updatedAt may be a Date or a string depending on the used localForage backend
		if (!(data.updatedAt instanceof Date)) {
			data.updatedAt = new Date(data.updatedAt);
		}

		if (Date.now() - data.updatedAt.getTime() >= 1000 * CachedCollection.MAX_CACHE_TIME) {
			return false;
		}

		this.log(`${data.records.length} records loaded from cache`);

		const deserializedRecords = data.records.map((record) => this.deserializeFromCache(record)).filter(isTruthy);

		const updatedAt = Math.max(...deserializedRecords.filter(hasUpdatedAt).map((record) => record?._updatedAt.getTime() ?? 0));

		if (updatedAt > this.updatedAt.getTime()) {
			this.updatedAt = new Date(updatedAt);
		}

		this.collection._collection._docs._map = new Map(
			deserializedRecords.filter(hasId).map((record) => [this.collection._collection._docs._idStringify(record._id), record]),
		);

		this.updatedAt = data.updatedAt || this.updatedAt;

		Object.values(this.collection._collection.queries).forEach((query) => this.collection._collection._recomputeResults(query));

		return true;
	}

	protected deserializeFromCache(record: unknown): T | undefined {
		if (typeof record !== 'object' || record === null) {
			return undefined;
		}

		return {
			...(record as unknown as T),
			...(hasUnserializedUpdatedAt(record) && {
				_updatedAt: new Date(record._updatedAt),
			}),
		};
	}

	private async callLoad() {
		// TODO: workaround for bad function overload
		const data = await sdk.call(`${this.name}/get`);
		return data as unknown as U[];
	}

	private async callSync(updatedSince: Date) {
		// TODO: workaround for bad function overload
		const data = await sdk.call(`${this.name}/get`, updatedSince);
		return data as unknown as { update: U[]; remove: U[] };
	}

	private async loadFromServer() {
		const data = await this.callLoad();
		this.log(`${data.length} records loaded from server`);

		return this.applyFromServer(data);
	}

	applyFromServer(data: U[]) {
		const startTime = new Date();
		const lastTime = this.updatedAt;
		this.log(`${data.length} records loaded from server`);

		data.forEach((record) => {
			const newRecord = this.handleLoadFromServer(record);
			if (!hasId(newRecord)) {
				return;
			}

			const { _id } = newRecord;
			this.collection.upsert({ _id } as Mongo.Selector<T>, newRecord);
			this.emit('changed', newRecord as any); // TODO: investigate why this is needed

			if (hasUpdatedAt(newRecord) && newRecord._updatedAt > this.updatedAt) {
				this.updatedAt = newRecord._updatedAt;
			}
		});
		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;
	}

	protected handleLoadFromServer(record: U): T {
		return record as unknown as T;
	}

	protected handleReceived(record: U, _action: 'removed' | 'changed'): T {
		return record as unknown as T;
	}

	protected handleSync(record: U, _action: 'removed' | 'changed'): T {
		return record as unknown as T;
	}

	private async loadFromServerAndPopulate() {
		await this.loadFromServer();
		await this.save();
	}

	save = withDebouncing({ wait: 1000 })(async () => {
		this.log('saving cache');
		const data = this.collection.find().fetch();
		await localforage.setItem(this.name, {
			updatedAt: this.updatedAt,
			version: this.version,
			token: this.getToken(),
			records: data,
		});
		this.log('saving cache (done)');
	});

	clearCacheOnLogout() {
		if (this.userRelated === true) {
			void this.clearCache();
		}
	}

	async clearCache() {
		this.log('clearing cache');
		await localforage.removeItem(this.name);
		this.collection.remove({});
	}

	async setupListener() {
		(Notifications[this.eventType] as any)(this.eventName, async (action: 'removed' | 'changed', record: any) =>
			this.handleEvent(action, record),
		);
	}

	async handleEvent(action: 'removed' | 'changed', record: U) {
		this.log('record received', action, record);
		const newRecord = this.handleReceived(record, action);

		if (!hasId(newRecord)) {
			return;
		}

		if (action === 'removed') {
			this.collection.remove(newRecord._id);
		} else {
			const { _id } = newRecord;
			if (!_id) {
				return;
			}
			this.collection.upsert({ _id } as any, newRecord);
		}
		await this.save();
	}

	trySync(delay = 10) {
		clearTimeout(this.timer);
		// Wait for an empty queue to load data again and sync
		this.timer = setTimeout(async () => {
			if (!(await this.sync())) {
				return this.trySync(delay);
			}
			await this.save();
		}, delay);
	}

	async sync() {
		if (!this.updatedAt || this.updatedAt.getTime() === 0 || Meteor.connection._outstandingMethodBlocks.length !== 0) {
			return false;
		}

		const startTime = new Date();
		const lastTime = this.updatedAt;

		this.log(`syncing from ${this.updatedAt}`);

		const data = await this.callSync(this.updatedAt);
		const changes = [];

		if (data.update && data.update.length > 0) {
			this.log(`${data.update.length} records updated in sync`);
			for (const record of data.update) {
				const action = 'changed';
				const newRecord = this.handleSync(record, action);

				if (!hasId(newRecord)) {
					continue;
				}

				const actionTime = hasUpdatedAt(newRecord) ? newRecord._updatedAt : startTime;
				changes.push({
					action: () => {
						const { _id } = newRecord;
						this.collection.upsert({ _id } as Mongo.Selector<T>, newRecord);
						if (actionTime > this.updatedAt) {
							this.updatedAt = actionTime;
						}
						this.emit(action, newRecord as any); // TODO: investigate why this is needed
					},
					timestamp: actionTime.getTime(),
				});
			}
		}

		if (data.remove && data.remove.length > 0) {
			this.log(`${data.remove.length} records removed in sync`);
			for (const record of data.remove) {
				const action = 'removed';
				const newRecord = this.handleSync(record, action);

				if (!hasId(newRecord) || !hasDeletedAt(newRecord)) {
					continue;
				}

				const actionTime = newRecord._deletedAt;
				changes.push({
					action: () => {
						const { _id } = newRecord;
						this.collection.remove({ _id } as Mongo.Selector<T>);
						if (actionTime > this.updatedAt) {
							this.updatedAt = actionTime;
						}
						this.emit(action, newRecord as any); // TODO: investigate why this is needed
					},
					timestamp: actionTime.getTime(),
				});
			}
		}

		changes
			.sort((a, b) => a.timestamp - b.timestamp)
			.forEach((c) => {
				c.action();
			});

		this.updatedAt = this.updatedAt === lastTime ? startTime : this.updatedAt;

		return true;
	}

	async init() {
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
			await this.setupListener();
		});
	}
}
