import { Mongo } from 'meteor/mongo';
import type { Hint, Sort } from 'mongodb';
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
	/** (Server only) Overrides MongoDB's default index selection and query optimization process. Specify an index to force its use, either by its name or index specification. */
	hint?: Hint | undefined;
	/** (Client only) Default `true`; pass `false` to disable reactivity */
	reactive?: boolean | undefined;
	/**  Overrides `transform` on the  [`Collection`](#collections) for this cursor.  Pass `null` to disable transformation. */
	transform?: Transform<T> | undefined;
};

export class MinimongoCollection<T extends { _id: string }> extends Mongo.Collection<T> {
	readonly use = create<IDocumentMapStore<T>>()((set, get) => ({
		records: [],
		has: (id: T['_id']) => get().records.some((record) => record._id === id),
		get: (id: T['_id']) => get().records.find((record) => record._id === id),
		find: (predicate: (record: T) => boolean) => get().records.find(predicate),
		filter: (predicate: (record: T) => boolean) => get().records.filter(predicate),
		replaceAll: (records: T[]) => {
			set({ records: records.map<T>(Object.freeze) });
			this._collection.recomputeAllResults();
		},
	}));

	protected _collection = new LocalCollection<T>(this.use);

	constructor() {
		super(null);
	}

	get state() {
		return this.use.getState();
	}

	async bulkMutate(fn: () => Promise<void>) {
		this._collection.pauseObservers();
		await fn();
		this._collection.resumeObserversClient();
	}

	replaceAll(records: T[]) {
		this.state.replaceAll(records);
	}
}
