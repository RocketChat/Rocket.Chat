import EventEmitter from 'events';

import { IRocketChatRecord } from '@rocket.chat/core-typings';
import type { Timestamp, Db } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { MongoClient } from 'mongodb';

import { convertChangeStreamPayload } from './convertChangeStreamPayload';
import { convertOplogPayload } from './convertOplogPayload';

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

const useCustomOplog = !!(global.Package as any)['disable-oplog'];

// TODO change to a typed event emitter
export class DatabaseWatcher extends EventEmitter {
	constructor(private db: Db, private watchCollections: string[], private _oplogHandle?: any) {
		super();
	}

	async watch(): Promise<void> {
		if (await this.isChangeStreamAvailable()) {
			this.watchChangeStream();
			return;
		}

		if (useCustomOplog) {
			this.watchCustomOplog();
			return;
		}

		this.watchMeteorOplog();
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

	private async watchCustomOplog(): Promise<void> {
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
			ns: new RegExp(
				`^(?:${[
					escapeRegExp(`${dbName}.`),
					// escapeRegExp('admin.$cmd'),
				].join('|')})`,
			),
			op: { $in: ['i', 'u', 'd'] },
			...(lastOplogEntry && { ts: { $gt: lastOplogEntry.ts } }),
		};

		const stream = oplogCollection
			.find(oplogSelector, {
				tailable: true,
				awaitData: true,
			})
			.stream();

		stream.on('data', (doc) => {
			const doesMatter = this.watchCollections.some((collection) => doc.ns === `${dbName}.${collection}`);
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
		this.watchCollections.forEach((collection) => {
			// TODO fix any
			this._oplogHandle.onOplogEntry({ collection }, (event: any) => {
				this.emitDoc(collection, convertOplogPayload(event));
			});
		});
	}

	private watchChangeStream(): void {
		const changeStream = this.db.watch<IRocketChatRecord>([{ $match: { 'ns.coll': { $in: this.watchCollections } } }]);
		changeStream.on('change', (event) => {
			// TODO fix as any
			this.emitDoc((event as any).ns.coll, convertChangeStreamPayload(event));
		});
	}

	private emitDoc(collection: string, doc: RealTimeData<IRocketChatRecord> | void): void {
		if (!doc) {
			return;
		}
		// TODO add metrics
		// metrics.oplog.inc({
		// 	collection: this.collectionName,
		// 	op: action,
		// });

		this.emit(collection, doc);
	}
}
