import { Mongo } from 'meteor/mongo';
import { create } from 'zustand';

import type { IDocumentMapStore } from './DocumentMapStore';
import { LocalCollection } from './LocalCollection';

/**
 * Implements a minimal version of a MongoDB collection using Zustand for state management.
 *
 * It's a middle layer between the Mongo.Collection and Zustand aiming for complete migration to Zustand.
 */
export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	/**
	 * A Zustand store that holds the records of the collection.
	 *
	 * It should be used as a hook in React components to access the collection's records and methods.
	 */
	readonly use = create<IDocumentMapStore<T>>()((set, get) => ({
		records: [],
		has: (id: T['_id']) => get().records.some((record) => record._id === id),
		get: (id: T['_id']) => get().records.find((record) => record._id === id),
		find: (predicate: (record: T) => boolean) => get().records.find(predicate),
		filter: (predicate: (record: T) => boolean) => get().records.filter(predicate),
		replaceAll: (records: T[]) => {
			set({ records: records.map<T>(Object.freeze) });
			this.recomputeQueries();
		},
		store: (doc) => {
			set((state) => {
				const records = [...state.records];
				const index = records.findIndex((r) => r._id === doc._id);
				if (index !== -1) {
					records[index] = Object.freeze(doc);
				} else {
					records.push(Object.freeze(doc));
				}
				return { records };
			});
			this.recomputeQueries();
		},
		storeMany: (docs) => {
			const records = [...get().records];

			for (const doc of docs) {
				const index = records.findIndex((r) => r._id === doc._id);
				if (index !== -1) {
					records[index] = Object.freeze(doc);
				} else {
					records.push(Object.freeze(doc));
				}
			}
			set({ records });
			this.recomputeQueries();
		},
		delete: (_id) => {
			set((state) => {
				const records = state.records.filter((r) => r._id !== _id);
				return { records };
			});
			this.recomputeQueries();
		},
		update: (predicate: (record: T) => boolean, modifier: (record: T) => T) => {
			set({
				records: get().records.map((record) => (predicate(record) ? modifier(record) : record)),
			});
			this.recomputeQueries();
		},
		updateAsync: async (predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>) => {
			set({
				records: await Promise.all(get().records.map((record) => (predicate(record) ? modifier(record) : record))),
			});
			this.recomputeQueries();
		},
		remove: (predicate: (record: T) => boolean) => {
			set((state) => {
				const records = state.records.filter((record) => !predicate(record));
				return { records };
			});
			this.recomputeQueries();
		},
	}));

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
	 */
	get state() {
		return this.use.getState();
	}

	private recomputeQueries() {
		this._collection.recomputeAllResults();
	}
}
