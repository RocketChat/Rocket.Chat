import EventEmitter from 'events';

import type { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { Timestamp, Db, ChangeStreamDeleteDocument, ChangeStreamInsertDocument, ChangeStreamUpdateDocument } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { MongoClient } from 'mongodb';

import type { Logger } from '../lib/logger/Logger';
import { convertChangeStreamPayload } from './convertChangeStreamPayload';
import { convertOplogPayload } from './convertOplogPayload';
import { watchCollections } from './watchCollections';

const instancePing = parseInt(String(process.env.MULTIPLE_INSTANCES_PING_INTERVAL)) || 10000;

const maxDocMs = instancePing * 4; // 4 times the ping interval

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

	private logger: Logger;

	/**
	 * Last doc timestamp received from a real time event
	 */
	private lastDocTS: Date;

	// eslint-disable-next-line @typescript-eslint/naming-convention
	constructor({ db, _oplogHandle, metrics, logger: LoggerClass }: { db: Db; _oplogHandle?: any; metrics?: any; logger: typeof Logger }) {
		super();

		this.db = db;
		this._oplogHandle = _oplogHandle;
		this.metrics = metrics;
		this.logger = new LoggerClass('DatabaseWatcher');
	}

	async watch(): Promise<void> {
		if (useMeteorOplog) {
			// TODO remove this when updating to Meteor 2.8
			this.logger.warn(
				'Using USE_NATIVE_OPLOG=true is currently discouraged due to known performance issues. Please use IGNORE_CHANGE_STREAM=true instead.',
			);
			this.watchMeteorOplog();
			return;
		}

		if (ignoreChangeStream) {
			await this.watchOplog();
			return;
		}

		try {
			this.watchChangeStream();
		} catch (err: unknown) {
			await this.watchOplog();
		}
	}

	private async watchOplog(): Promise<void> {
		if (!process.env.MONGO_OPLOG_URL) {
			throw Error('No $MONGO_OPLOG_URL provided');
		}

		const isMasterDoc = await this.db.admin().command({ ismaster: 1 });
		if (!isMasterDoc || !isMasterDoc.setName) {
			throw Error("$MONGO_URL should be a replica set's URL");
		}

		const dbName = this.db.databaseName;

		const client = new MongoClient(process.env.MONGO_OPLOG_URL, {
			maxPoolSize: 1,
		});

		if (client.db().databaseName !== 'local') {
			throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
		}

		await client.connect();

		this.logger.startup('Using oplog');

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
		if (!this._oplogHandle) {
			throw new Error('no-oplog-handle');
		}

		this.logger.startup('Using Meteor oplog');

		watchCollections.forEach((collection) => {
			this._oplogHandle.onOplogEntry({ collection }, (event: any) => {
				this.emitDoc(collection, convertOplogPayload(event));
			});
		});
	}

	private watchChangeStream(): void {
		try {
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

			changeStream.on('error', (err) => {
				throw err;
			});

			this.logger.startup('Using change streams');
		} catch (err: unknown) {
			this.logger.error(err, 'Change stream error');

			throw err;
		}
	}

	private emitDoc(collection: string, doc: RealTimeData<IRocketChatRecord> | void): void {
		if (!doc) {
			return;
		}

		this.lastDocTS = new Date();

		this.metrics?.oplog.inc({
			collection,
			op: doc.action,
		});

		this.emit(collection, doc);
	}

	on<T>(collection: string, callback: (event: RealTimeData<T>) => void): this {
		return super.on(collection, callback);
	}

	/**
	 * @returns the last timestamp delta in miliseconds received from a real time event
	 */
	getLastDocDelta(): number {
		return this.lastDocTS ? Date.now() - this.lastDocTS.getTime() : Infinity;
	}

	/**
	 * @returns Indicates if the last document received is older than it should be. If that happens, it means that the oplog is not working properly
	 */
	isLastDocDelayed(): boolean {
		return this.getLastDocDelta() > maxDocMs;
	}
}
