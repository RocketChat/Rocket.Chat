import EventEmitter from 'events';

import { IRocketChatRecord } from '@rocket.chat/core-typings';
import { ChangeStreamDocument, Db } from 'mongodb';

type RealTimeData<T> = {
	id: string;
	action: 'insert' | 'update' | 'remove';
	clientAction: 'inserted' | 'updated' | 'removed';
	data?: T;
	diff?: Record<string, any>;
	unset?: Record<string, number>;
};

// oplog converter
// if (action === 'insert') {
// 	this.emit('change', {
// 		action,
// 		clientAction: 'inserted',
// 		id: op.o._id,
// 		data: op.o,
// 		oplog: true,
// 	});
// 	return;
// }

// if (action === 'update') {
// 	if (!op.o.$set && !op.o.$unset) {
// 		this.emit('change', {
// 			action,
// 			clientAction: 'updated',
// 			id,
// 			data: op.o,
// 			oplog: true,
// 		});
// 		return;
// 	}

// 	const diff = {};
// 	if (op.o.$set) {
// 		for (const key in op.o.$set) {
// 			if (op.o.$set.hasOwnProperty(key)) {
// 				diff[key] = op.o.$set[key];
// 			}
// 		}
// 	}
// 	const unset = {};
// 	if (op.o.$unset) {
// 		for (const key in op.o.$unset) {
// 			if (op.o.$unset.hasOwnProperty(key)) {
// 				diff[key] = undefined;
// 				unset[key] = 1;
// 			}
// 		}
// 	}

// 	this.emit('change', {
// 		action,
// 		clientAction: 'updated',
// 		id,
// 		diff,
// 		unset,
// 		oplog: true,
// 	});
// 	return;
// }

// if (action === 'remove') {
// 	this.emit('change', {
// 		action,
// 		clientAction: 'removed',
// 		id,
// 		oplog: true,
// 	});
// }
// }

function convertChangeStreamPayload(event: ChangeStreamDocument<IRocketChatRecord>): RealTimeData<IRocketChatRecord> | void {
	switch (event.operationType) {
		case 'insert':
			return {
				action: 'insert',
				clientAction: 'inserted',
				id: event.documentKey._id,
				data: event.fullDocument,
			};
		case 'update':
			const diff: Record<string, any> = {};

			if (event.updateDescription?.updatedFields) {
				for (const key in event.updateDescription.updatedFields) {
					if (event.updateDescription.updatedFields.hasOwnProperty(key)) {
						// TODO fix as any
						diff[key] = (event.updateDescription as any).updatedFields[key];
					}
				}
			}

			const unset: Record<string, number> = {};
			if (event.updateDescription.removedFields) {
				for (const key in event.updateDescription.removedFields) {
					if (event.updateDescription.removedFields.hasOwnProperty(key)) {
						diff[key] = undefined;
						unset[key] = 1;
					}
				}
			}

			return {
				action: 'update',
				clientAction: 'updated',
				id: event.documentKey._id,
				diff,
				unset,
			};
		case 'delete':
			return {
				action: 'remove',
				clientAction: 'removed',
				id: event.documentKey._id,
			};
	}
}

// TODO change to a typed event emitter
export class DatabaseWatcher extends EventEmitter {
	constructor(private db: Db, private watchCollections: string[]) {
		super();
	}

	watch(): void {
		// TODO add oplog support
		this.watchChangeStream();
	}

	private watchChangeStream(): void {
		const changeStream = this.db.watch<IRocketChatRecord>([{ $match: { 'ns.coll': { $in: this.watchCollections } } }]);
		changeStream.on('change', (event) => {
			// TODO add metrics
			// metrics.oplog.inc({
			// 	collection: this.collectionName,
			// 	op: action,
			// });

			// TODO fix as any
			this.emit((event as any).ns.coll, convertChangeStreamPayload(event));
		});
	}
}
