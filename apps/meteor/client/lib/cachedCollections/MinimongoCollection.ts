import { Mongo } from 'meteor/mongo';
import { create } from 'zustand';

import type { IDocumentMapStore } from './DocumentMapStore';
import { LocalCollection } from './LocalCollection';

export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
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
		delete: (doc) => {
			set((state) => {
				const records = state.records.filter((r) => r._id !== doc._id);
				return { records };
			});
			this.recomputeQueries();
		},
		update: (predicate: (record: T) => boolean, modifier: (record: T) => T) => {
			set({
				records: get().records.map((record) => (predicate(record) ? modifier(record) : record)),
			});
			this._collection.recomputeAllResults();
		},
		updateAsync: async (predicate: (record: T) => boolean, modifier: (record: T) => Promise<T>) => {
			set({
				records: await Promise.all(get().records.map((record) => (predicate(record) ? modifier(record) : record))),
			});
			this._collection.recomputeAllResults();
		},
	}));

	protected _collection = new LocalCollection<T>(this.use);

	constructor() {
		super(null);
	}

	get store() {
		return this.use.getState();
	}

	private recomputeQueries() {
		this._collection.recomputeAllResults();
	}
}
