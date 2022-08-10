import EventEmitter from 'events';

import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { Timestamp, Db, ChangeStreamDeleteDocument, ChangeStreamInsertDocument, ChangeStreamUpdateDocument } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { MongoClient } from 'mongodb';

import { convertChangeStreamPayload } from './convertChangeStreamPayload';
import { convertOplogPayload } from './convertOplogPayload';
import { watchCollections } from './watchCollections';

export type RealTimeData<T> = {
	id: string;
	action: 'insert' | 'update' | 'remove';
	clientAction: 'inserted' | 'updated' | 'removed';
	data?: T;
	diff?: Record<string, any>;
	unset?: Record<string, number>;
	oplog?: true;
};

const ignoreChangeStream = ['yes', 'true'].includes(String(process.env.IGNORE_CHANGE_STREAM).toLowerCase());

const useMeteorOplog = ['yes', 'true'].includes(String(process.env.USE_NATIVE_OPLOG).toLowerCase());

export class DatabaseWatcher extends EventEmitter {
	private db: Db;

	private _oplogHandle?: any;

	private metrics?: any;

	constructor({ db, _oplogHandle, metrics }: { db: Db; _oplogHandle?: any; metrics?: any }) {
		super();

		this.db = db;
		this._oplogHandle = _oplogHandle;
		this.metrics = metrics;
	}

	async watch(): Promise<void> {
		if (useMeteorOplog) {
			this.watchMeteorOplog();
			return;
		}

		if (await this.isChangeStreamAvailable()) {
			this.watchChangeStream();
			return;
		}

		this.watchOplog();
	}

	private async isChangeStreamAvailable(): Promise<boolean> {
		if (ignoreChangeStream) {
			return false;
		}

		try {
			const { storageEngine } = await this.db.command({ serverStatus: 1 });

			if (!storageEngine || storageEngine.name !== 'wiredTiger') {
				return false;
			}

			await this.db.admin().command({ replSetGetStatus: 1 });
		} catch (e) {
			if (e instanceof Error && e.message.startsWith('not authorized')) {
				console.info(
					'Change Stream is available for your installation, give admin permissions to your database user to use this improved version.',
				);
			}
			return false;
		}

		return true;
	}

	private async watchOplog(): Promise<void> {
		console.log('[DatabaseWatcher] Using oplog');

		const isMasterDoc = await this.db.admin().command({ ismaster: 1 });
		if (!isMasterDoc || !isMasterDoc.setName) {
			throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
		}

		if (!process.env.MONGO_OPLOG_URL) {
			throw Error('no-mongo-url');
		}
		const dbName = this.db.databaseName;

		const client = new MongoClient(process.env.MONGO_OPLOG_URL, {
			maxPoolSize: 1,
		});
		await client.connect();

		const db = client.db();

		const oplogCollection = db.collection('oplog.rs');

		const lastOplogEntry = await oplogCollection.findOne<{ ts: Timestamp }>({}, { sort: { $natural: -1 }, projection: { _id: 0, ts: 1 } });

		const oplogSelector = {
			ns: new RegExp(`^(?:${[escapeRegExp(`${dbName}.`)].join('|')})`),
			op: { $in: ['i', 'u', 'd'] },
			...(lastOplogEntry && { ts: { $gt: lastOplogEntry.ts } }),
		};

		const cursor = oplogCollection.find(oplogSelector);

		cursor.addCursorFlag('tailable', true);
		cursor.addCursorFlag('awaitData', true);
		cursor.addCursorFlag('oplogReplay', true);

		const stream = cursor.stream();

		stream.on('data', (doc) => {
			const doesMatter = watchCollections.some((collection) => doc.ns === `${dbName}.${collection}`);
			if (!doesMatter) {
				return;
			}

			this.emitDoc(
				doc.ns.slice(dbName.length + 1),
				convertOplogPayload({
					id: doc.op === 'u' ? doc.o2._id : doc.o._id,
					op: doc,
				}),
			);
		});
	}

	private watchMeteorOplog(): void {
		console.log('[DatabaseWatcher] Using Meteor oplog');

		if (!this._oplogHandle) {
			throw new Error('no-oplog-handle');
		}
		watchCollections.forEach((collection) => {
			this._oplogHandle.onOplogEntry({ collection }, (event: any) => {
				this.emitDoc(collection, convertOplogPayload(event));
			});
		});
	}

	private watchChangeStream(): void {
		console.log('[DatabaseWatcher] Using change streams');

		const changeStream = this.db.watch<
			IRocketChatRecord,
			| ChangeStreamInsertDocument<IRocketChatRecord>
			| ChangeStreamUpdateDocument<IRocketChatRecord>
			| ChangeStreamDeleteDocument<IRocketChatRecord>
		>([
			{
				$match: {
					'operationType': { $in: ['insert', 'update', 'delete'] },
					'ns.coll': { $in: watchCollections },
				},
			},
		]);
		changeStream.on('change', (event) => {
			this.emitDoc(event.ns.coll, convertChangeStreamPayload(event));
		});
	}

	private emitDoc(collection: string, doc: RealTimeData<IRocketChatRecord> | void): void {
		if (!doc) {
			return;
		}

		this.metrics?.oplog.inc({
			collection,
			op: doc.action,
		});

		this.emit(collection, doc);
	}

	on<T>(collection: string, callback: (event: RealTimeData<T>) => void): this {
		return super.on(collection, callback);
	}
}
