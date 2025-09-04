import { Mongo } from 'meteor/mongo';

import { createDocumentMapStore } from './DocumentMapStore';
import { LocalCollection } from './LocalCollection';
import type { Query } from './Query';

/**
 * Implements a minimal version of a MongoDB collection using Zustand for state management.
 *
 * It's a middle layer between the Mongo.Collection and Zustand aiming for complete migration to Zustand.
 */
export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	private pendingRecomputations = new Set<Query<T>>();

	private recomputeAll() {
		this.pendingRecomputations.clear();

		for (const query of this._collection.queries) {
			this._collection.recomputeQuery(query);
		}
	}

	private scheduleRecomputationsFor(docs: T[]) {
		for (const query of this._collection.queries) {
			if (this.pendingRecomputations.has(query)) continue;

			if (docs.some((doc) => query.predicate(doc))) {
				this.scheduleRecomputation(query);
			}
		}
	}

	private scheduleRecomputation(query: Query<T>) {
		this.pendingRecomputations.add(query);

		queueMicrotask(() => {
			if (this.pendingRecomputations.size === 0) return;

			this.pendingRecomputations.forEach((query) => {
				this._collection.recomputeQuery(query);
			});
			this.pendingRecomputations.clear();
		});
	}

	/**
	 * A Zustand store that holds the records of the collection.
	 *
	 * It should be used as a hook in React components to access the collection's records and methods.
	 *
	 * Beware mutating the store will **asynchronously** trigger recomputations of all Minimongo
	 * queries that depend on the changed documents.
	 */
	readonly use = createDocumentMapStore<T>({
		onInvalidateAll: () => {
			this.recomputeAll();
		},
		onInvalidate: (...docs) => {
			this.scheduleRecomputationsFor(docs);
		},
	});

	/**
	 * The internal collection that manages the queries and results.
	 *
	 * It overrides the default Mongo.Collection's methods to use Zustand for state management.
	 */
	protected _collection = new LocalCollection<T>(this.use);

	constructor() {
		super(null);
	}

	/**
	 * Returns the Zustand store state that holds the records of the collection.
	 *
	 * It's a convenience method to access the Zustand store directly i.e. outside of React components.
	 *
	 * Beware mutating the store will **asynchronously** trigger recomputations of all Minimongo
	 * queries that depend on the changed documents.
	 */
	get state() {
		return this.use.getState();
	}
}
