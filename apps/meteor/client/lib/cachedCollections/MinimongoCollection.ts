import { Mongo } from 'meteor/mongo';
import type { Sort } from 'mongodb';
import { create } from 'zustand';

import type { IDocumentMapStore } from './IDocumentMapStore';
import { LocalCollection } from './LocalCollection';

export type Transform<T> = ((doc: T) => any) | null | undefined;

export type FieldSpecifier = {
	[id: string]: number | boolean;
};

export type Options<T> = {
	/** Sort order (default: natural order) */
	sort?: Sort | undefined;
	/** Number of results to skip at the beginning */
	skip?: number | undefined;
	/** Maximum number of results to return */
	limit?: number | undefined;
	/**
	 * Dictionary of fields to return or exclude.
	 * @deprecated use projection instead
	 */
	fields?: FieldSpecifier | undefined;
	/** Dictionary of fields to return or exclude. */
	projection?: FieldSpecifier | undefined;
	/** Default `true`; pass `false` to disable reactivity */
	reactive?: boolean | undefined;
	/**  Overrides `transform` on the  [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation. */
	transform?: Transform<T> | null | undefined;
};

export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	readonly use = create<IDocumentMapStore<T>>()((set, get) => ({
		records: [],
		has: (id: T['_id']) => get().records.some((record) => record._id === id),
		get: (id: T['_id']) => get().records.find((record) => record._id === id),
		find: (predicate: (record: T) => boolean) => get().records.find(predicate),
		filter: (predicate: (record: T) => boolean) => get().records.filter(predicate),
		replaceAll: (records: T[], { recomputeQueries }) => {
			set({ records: records.map<T>(Object.freeze) });
			if (recomputeQueries) this._collection.recomputeAllResults();
		},
		store: (doc, { recomputeQueries }) => {
			set((state) => {
				const records = [...state.records];
				const index = records.findIndex((r) => r._id === doc._id);
				if (index !== -1) {
					records[index] = doc;
				} else {
					records.push(doc);
				}
				return { records };
			});
			if (recomputeQueries) this._collection.recomputeAllResults();
		},
		remove: (doc, { recomputeQueries }) => {
			set((state) => {
				const records = state.records.filter((r) => r._id !== doc._id);
				return { records };
			});
			if (recomputeQueries) this._collection.recomputeAllResults();
		},
	}));

	protected _collection = new LocalCollection<T>(this.use);

	constructor() {
		super(null);
	}

	get state() {
		return this.use.getState();
	}

	getCollection(): Mongo.Collection<T> {
		return this;
	}

	async bulkMutate(fn: () => Promise<void>) {
		this._collection.pauseObservers();
		await fn();
		this._collection.resumeObserversClient();
	}
}
