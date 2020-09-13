import { Meteor } from 'meteor/meteor';
// import s from 'underscore.string';
import { MongoClient, Cursor, /* , Timestamp */
	Db } from 'mongodb';
// import urlParser from 'mongodb/lib/url_parser';

class OplogHandle {
	client: MongoClient;

	// stream: Cursor;
	db: Db;

	constructor(oplogUrl: string, private dbName: string) {
		this.client = new MongoClient(oplogUrl, {
			useUnifiedTopology: true,
			useNewUrlParser: true,
			// poolSize: 1,
		});
	}

	async start(): Promise<OplogHandle> {
		await this.client.connect();
		this.db = this.client.db();

		// const isMasterDoc = await db.admin().command({ ismaster: 1 });
		// if (!isMasterDoc || !isMasterDoc.setName) {
		// 	throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
		// }

		// const oplogCollection = db.collection('oplog.rs');

		// const lastOplogEntry = await oplogCollection.findOne<{ts: Timestamp}>({}, { sort: { $natural: -1 }, projection: { _id: 0, ts: 1 } });

		// const oplogSelector = {
		// 	ns: new RegExp(`^(?:${ [
		// 		s.escapeRegExp(`${ this.dbName }.`),
		// 		s.escapeRegExp('admin.$cmd'),
		// 	].join('|') })`),

		// 	op: { $in: ['i', 'u', 'd'] },
		// 	...lastOplogEntry && { ts: { $gt: lastOplogEntry.ts } },
		// };

		// console.log(oplogSelector);
		// this.stream = oplogCollection.find(oplogSelector, {
		// 	tailable: true,
		// 	// awaitData: true,
		// }).stream();

		return this;
	}

	onOplogEntry(query: {collection: string}, callback: Function): void {
		// this.stream.on('data', Meteor.bindEnvironment((buffer) => {
		// 	const doc = buffer as any;
		// 	if (doc.ns === `${ this.dbName }.${ query.collection }`) {
		// 		// console.log('doc', doc);
		// 		callback({
		// 			id: doc.op === 'u' ? doc.o2._id : doc.o._id,
		// 			op: doc,
		// 		});
		// 	}
		// }));
		this.db.collection(query.collection).watch([], { /* fullDocument: 'updateLookup' */ }).on('change', Meteor.bindEnvironment((event) => {
			console.log(event);
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
								$unset: event.updateDescription.removedFields,
							},
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
		}));
	}

	_defineTooFarBehind(): void {
		//
	}
}

// TODO: Extract from connection string;
const _dbName = 'rocketchat';
// if (!process.env.MONGO_OPLOG_URL) {
// 	throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
// }

// TODO:
// if (urlParser(process.env.MONGO_OPLOG_URL).database !== 'local') {
// 	throw Error("$MONGO_OPLOG_URL must be set to the 'local' database of a Mongo replica set");
// }


export const oplog = new OplogHandle(process.env.MONGO_URL, _dbName).start();
