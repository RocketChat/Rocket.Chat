import type { Connection } from './ddp-client.ts';
import { DiffSequence } from './diff-sequence.ts';
import { EJSON } from './ejson.ts';
import { ObjectID } from './mongo-id.ts';
import { Tracker } from './tracker.ts';

type StoreDocument = { _id: string; [key: string]: unknown };

type DdpUpdateMessage = {
	msg: 'added' | 'changed' | 'removed';
	id: string;
	fields?: Record<string, unknown>;
};

/**
 * A minimal replacement for a Mongo.Collection-backed DDP client store: keeps the
 * documents of one DDP collection in a Map and exposes plain lookups.
 *
 * This client never runs method stubs, so the store skips the whole
 * saveOriginals/retrieveOriginals reconciliation — the connection treats missing
 * store methods as no-ops.
 */
export class DdpCollectionStore<T extends StoreDocument = StoreDocument> {
	private docs = new Map<string, T>();

	// Readers running inside a Tracker computation re-run when the store changes;
	// Accounts relies on this to wait for the user document after login
	private dependency = new Tracker.Dependency();

	constructor(name: string, connection: Connection) {
		connection.registerStoreClient(name, {
			beginUpdate: async (_batchSize: number, reset: boolean) => {
				if (reset && this.docs.size > 0) {
					this.docs.clear();
					this.dependency.changed();
				}
			},
			update: (msg: DdpUpdateMessage) => {
				const id = String(ObjectID.parse(msg.id));
				switch (msg.msg) {
					case 'added':
						this.docs.set(id, { ...(EJSON.clone(msg.fields) as Record<string, unknown>), _id: id } as T);
						break;
					case 'changed': {
						const doc = this.docs.get(id);
						if (!doc) return;
						// changed messages carry cleared fields as undefined values
						DiffSequence.applyChanges(doc, EJSON.clone(msg.fields) as Partial<T>);
						break;
					}
					case 'removed':
						this.docs.delete(id);
						break;
				}
				this.dependency.changed();
			},
		});
	}

	get(id: string): T | undefined {
		if (Tracker.active) this.dependency.depend();
		return this.docs.get(id);
	}

	findOne(predicate: (doc: T) => boolean): T | undefined {
		if (Tracker.active) this.dependency.depend();
		for (const doc of this.docs.values()) {
			if (predicate(doc)) return doc;
		}
		return undefined;
	}
}
