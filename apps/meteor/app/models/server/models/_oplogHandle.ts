import { Readable } from 'stream';

import { Meteor } from 'meteor/meteor';
import { MongoInternals, OplogHandle } from 'meteor/mongo';
import semver from 'semver';
import { MongoClient } from 'mongodb';
import type { Timestamp, Db } from 'mongodb';
import { escapeRegExp } from '@rocket.chat/string-helpers';

import { isRunningMs } from '../../../../server/lib/isRunningMs';

const ignoreChangeStream = ['yes', 'true'].includes(String(process.env.IGNORE_CHANGE_STREAM).toLowerCase());

class CustomOplogHandle {
	dbName: string;

	client: MongoClient;

	stream: Readable;

	db: Db;

	usingChangeStream: boolean;

	async isChangeStreamAvailable(): Promise<boolean> {
		if (ignoreChangeStream) {
			return false;
		}

		const { mongo } = MongoInternals.defaultRemoteCollectionDriver();

		try {
			const { version, storageEngine } = await mongo.db.command({ serverStatus: 1 });

			if (!storageEngine || storageEngine.name !== 'wiredTiger' || !semver.satisfies(semver.coerce(version) || '', '>=3.6.0')) {
				return false;
			}

			await mongo.db.admin().command({ replSetGetStatus: 1 });
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

	async start(): Promise<CustomOplogHandle> {
		this.usingChangeStream = await this.isChangeStreamAvailable();

		const oplogUrl = this.usingChangeStream ? process.env.MONGO_URL : process.env.MONGO_OPLOG_URL;
		if (!oplogUrl || !process.env.MONGO_URL) {
			throw Error('$MONGO_URL must be set');
		}

		const mongoOptions = process.env.MONGO_OPTIONS ? JSON.parse(process.env.MONGO_OPTIONS) : null;

		this.client = new MongoClient(oplogUrl, {
			...mongoOptions,
			minPoolSize: this.usingChangeStream ? 15 : 1,
		});

		if (!this.usingChangeStream && this.client.options.dbName !== 'local') {
			throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
		}

		const mongoClient = new MongoClient(process.env.MONGO_URL);
		this.dbName = mongoClient.options.dbName;

		await this.client.connect();
		this.db = this.client.db();

		if (!this.usingChangeStream) {
			await this.startOplog();
		}

		return this;
	}

	async stop(): Promise<void> {
		return this.client?.close();
	}

	async startOplog(): Promise<void> {
		const isMasterDoc = await this.db.admin().command({ ismaster: 1 });
		if (!isMasterDoc || !isMasterDoc.setName) {
			throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
		}

		const oplogCollection = this.db.collection('oplog.rs');

		const lastOplogEntry = await oplogCollection.findOne<{ ts: Timestamp }>({}, { sort: { $natural: -1 }, projection: { _id: 0, ts: 1 } });

		const oplogSelector = {
			ns: new RegExp(`^(?:${[escapeRegExp(`${this.dbName}.`), escapeRegExp('admin.$cmd')].join('|')})`),

			op: { $in: ['i', 'u', 'd'] },
			...(lastOplogEntry && { ts: { $gt: lastOplogEntry.ts } }),
		};

		this.stream = oplogCollection
			.find(oplogSelector, {
				tailable: true,
				awaitData: true,
			})
			.stream();

		// Prevent warning about many listeners, we add 11
		this.stream.setMaxListeners(20);
	}

	onOplogEntry(query: { collection: string }, callback: Function): void {
		if (this.usingChangeStream) {
			return this._onOplogEntryChangeStream(query, callback);
		}

		return this._onOplogEntryOplog(query, callback);
	}

	_onOplogEntryOplog(query: { collection: string }, callback: Function): void {
		this.stream?.on(
			'data',
			Meteor.bindEnvironment((buffer) => {
				const doc = buffer as any;
				if (doc.ns === `${this.dbName}.${query.collection}`) {
					callback({
						id: doc.op === 'u' ? doc.o2._id : doc.o._id,
						op: doc,
					});
				}
			}),
		);
	}

	_onOplogEntryChangeStream(query: { collection: string }, callback: Function): void {
		this.db
			.collection(query.collection)
			.watch([], {
				/* fullDocument: 'updateLookup' */
			})
			.on(
				'change',
				Meteor.bindEnvironment((event) => {
					switch (event.operationType) {
						case 'insert':
							callback({
								id: event.documentKey._id,
								op: {
									op: 'i',
									o: event.fullDocument,
								},
							});
							break;
						case 'update':
							callback({
								id: event.documentKey._id,
								op: {
									op: 'u',
									// o: event.fullDocument,
									o: {
										$set: event.updateDescription.updatedFields,
										$unset: event.updateDescription.removedFields?.reduce((obj, field) => {
											obj[field as string] = true;
											return obj;
										}, {} as Record<string, true>),
									},
								},
							});
							break;
						case 'replace':
							callback({
								id: event.documentKey._id,
								op: {
									op: 'u',
									o: event.fullDocument,
								},
							});
							break;
						case 'delete':
							callback({
								id: event.documentKey._id,
								op: {
									op: 'd',
								},
							});
							break;
					}
				}),
			);
	}

	_defineTooFarBehind(): void {
		//
	}
}

let oplogHandle: CustomOplogHandle;

if (!isRunningMs()) {
	const disableOplog = !!(global.Package as any)['disable-oplog'];

	if (disableOplog) {
		try {
			oplogHandle = Promise.await(new CustomOplogHandle().start());
		} catch (e) {
			console.error(e instanceof Error ? e.message : e);
		}
	}
}

export const getOplogHandle = async (): Promise<OplogHandle | CustomOplogHandle | undefined> => {
	if (oplogHandle) {
		return oplogHandle;
	}

	const { mongo } = MongoInternals.defaultRemoteCollectionDriver();
	if (!mongo._oplogHandle?.onOplogEntry) {
		return;
	}
	return mongo._oplogHandle;
};
