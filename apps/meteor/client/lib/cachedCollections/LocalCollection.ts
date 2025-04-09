import { Meteor } from 'meteor/meteor';
import type { CountDocumentsOptions, Filter, UpdateFilter } from 'mongodb';
import type { StoreApi, UseBoundStore } from 'zustand';

import { Cursor, type DispatchTransform } from './Cursor';
import { DiffSequence } from './DiffSequence';
import type { IDocumentMapStore } from './IDocumentMapStore';
import { IdMap } from './IdMap';
import { Matcher } from './Matcher';
import type { Options } from './MinimongoCollection';
import type { OrderedQuery, Query, UnorderedQuery } from './Query';
import { Sorter } from './Sorter';
import { SynchronousQueue } from './SynchronousQueue';
import {
	hasOwn,
	isIndexable,
	isNumericKey,
	isOperatorObject,
	createMinimongoError,
	populateDocumentWithQueryFields,
	_f,
	_isPlainObject,
	_selectorIsId,
	clone,
} from './common';

export type QueryId = `${number}` & { __brand: 'QueryId' };

interface ILocalCollection<T extends { _id: string }> {
	paused: boolean;
	find(selector?: Filter<T> | T['_id']): Cursor<T, Options<T>, T>;
	find<O extends Options<T>>(selector?: Filter<T> | T['_id'], options?: O): Cursor<T, O, DispatchTransform<O['transform'], T, T>>;
	findOne(selector?: Filter<T> | T['_id']): T | undefined;
	findOne<O extends Omit<Options<T>, 'limit'>>(
		selector?: Filter<T> | T['_id'],
		options?: O,
	): DispatchTransform<O['transform'], T, T> | undefined;
	insert(doc: T, callback?: (error: Error | null, id: T['_id']) => void): T['_id'];
	pauseObservers(): void;
	remove(selector: Filter<T>, callback?: (error: Error | null, result: number) => void): number;
	resumeObserversClient(): void;
	retrieveOriginals(): IdMap<T['_id'], T | undefined>;
	saveOriginals(): void;
	update(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): { numberAffected: number; insertedId?: T['_id'] } | number;
	update(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options: { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean } | null,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): { numberAffected: number; insertedId?: T['_id'] } | number;
	upsert(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): { numberAffected: number; insertedId?: T['_id'] } | number;
	upsert(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options: { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean } | null,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): { numberAffected: number; insertedId?: T['_id'] } | number;
	countDocuments(selector?: Filter<T>, options?: CountDocumentsOptions): Promise<number>;
	estimatedDocumentCount(options: CountDocumentsOptions): Promise<number>;
	findOneAsync(selector?: Filter<T> | T['_id']): Promise<T | undefined>;
	findOneAsync<O extends Omit<Options<T>, 'limit'>>(
		selector?: Filter<T> | T['_id'],
		options?: O,
	): Promise<DispatchTransform<O['transform'], T, T> | undefined>;
	insertAsync(doc: T, callback?: (error: Error | null, id: T['_id']) => void): Promise<T['_id']>;
	resumeObserversServer(): Promise<void>;
	updateAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): Promise<{ numberAffected: number; insertedId?: T['_id'] } | number>;
	updateAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options: { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean } | null,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): Promise<{ numberAffected: number; insertedId?: T['_id'] } | number>;
	upsertAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): Promise<{ numberAffected: number; insertedId?: T['_id'] } | number>;
	upsertAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options: { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean } | null,
		callback: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	): Promise<{ numberAffected: number; insertedId?: T['_id'] } | number>;
}

export class LocalCollection<T extends { _id: string }> implements ILocalCollection<T> {
	readonly _observeQueue = new SynchronousQueue();

	private nextQueryIdCounter = 1;

	readonly queries = new Map<QueryId, Query<T, Options<T>, any>>();

	// null if not saving originals; an IdMap from id to original document value
	// if saving originals. See comments before saveOriginals().
	private _savedOriginals: IdMap<T['_id'], T | undefined> | null = null;

	paused = false;

	constructor(protected store: UseBoundStore<StoreApi<IDocumentMapStore<T>>>) {}

	private has(id: T['_id']) {
		return this.store.getState().has(id);
	}

	private get(id: T['_id']) {
		return this.store.getState().get(id);
	}

	all() {
		return this.store.getState().records;
	}

	private count() {
		return this.store.getState().records.length;
	}

	private set(doc: T) {
		this.store.setState((state) => {
			const records = [...state.records];
			const index = records.findIndex((r) => r._id === doc._id);
			if (index !== -1) {
				records[index] = doc;
			} else {
				records.push(doc);
			}
			return { records };
		});
	}

	private delete(id: T['_id']) {
		this.store.setState((state) => ({
			records: state.records.filter((record) => record._id !== id),
		}));
	}

	private clear() {
		this.store.setState({ records: [] });
	}

	claimNextQueryId() {
		return `${this.nextQueryIdCounter++}` as QueryId;
	}

	find(selector: Filter<T> | T['_id'] = {}, options?: Options<T>) {
		return new Cursor(this, selector, options);
	}

	countDocuments(selector: Filter<T> = {}, options?: CountDocumentsOptions) {
		return this.find(selector, options).countAsync();
	}

	estimatedDocumentCount(options?: CountDocumentsOptions) {
		return this.find({}, options).countAsync();
	}

	findOne(selector?: Filter<T> | T['_id'], options: Options<T> = {}) {
		return this.find(selector, { ...options, limit: 1 }).fetch()[0];
	}

	async findOneAsync(selector: Filter<T> | T['_id'] = {}, options: Options<T> = {}) {
		return (await this.find(selector, { ...options, limit: 1 }).fetchAsync())[0];
	}

	private prepareInsert(doc: T) {
		assertHasValidFieldNames(doc);

		if (!('_id' in doc)) {
			throw createMinimongoError('Document must have an _id field');
		}

		if (this.has(doc._id)) {
			throw createMinimongoError(`Duplicate _id '${doc._id}'`);
		}

		this._saveOriginal(doc._id, undefined);
		this.set(doc);

		return doc._id;
	}

	private deferCallback<TFunction extends (...args: any) => void>(callback: TFunction | undefined | null, ...args: Parameters<TFunction>) {
		if (callback) Meteor.defer(() => callback(...args));
	}

	// XXX possibly enforce that 'undefined' does not appear (we assume
	// this in our handling of null and $exists)
	insert(doc: T, callback?: (error: Error | null, id: T['_id']) => void) {
		doc = clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = new Set<Query<T, Options<T>, any>>();

		// trigger live queries that match
		for (const query of this.queries.values()) {
			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.add(query);
				} else {
					this._insertInResultsSync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((query) => {
			this._recomputeResults(query);
		});

		this._observeQueue.drain();
		this.deferCallback(callback, null, id);

		return id;
	}

	async insertAsync(doc: T, callback?: (error: Error | null, id: T['_id']) => void) {
		doc = clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = new Set<Query<T, Options<T>, any>>();

		// trigger live queries that match
		for (const query of this.queries.values()) {
			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.add(query);
				} else {
					// eslint-disable-next-line no-await-in-loop
					await this._insertInResultsAsync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((query) => {
			this._recomputeResults(query);
		});

		await this._observeQueue.drain();
		this.deferCallback(callback, null, id);

		return id;
	}

	// Pause the observers. No callbacks from observers will fire until
	// 'resumeObservers' is called.
	pauseObservers() {
		// No-op if already paused.
		if (this.paused) {
			return;
		}

		// Set the 'paused' flag such that new observer messages don't fire.
		this.paused = true;

		// Take a snapshot of the query results for each query.
		for (const query of this.queries.values()) {
			query.resultsSnapshot = clone(query.results);
		}
	}

	private clearResultQueries(callback?: (error: Error | null, result: number) => void) {
		const result = this.count();

		this.clear();

		for (const query of this.queries.values()) {
			if (query.ordered) {
				query.results = [];
			} else {
				(query.results as IdMap<T['_id'], T>).clear();
			}
		}

		this.deferCallback(callback, null, result);

		return result;
	}

	private prepareRemove(selector: Filter<T>) {
		const matcher = new Matcher(selector);
		const remove = new Set<T['_id']>();

		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			if (matcher.documentMatches(doc).result) {
				remove.add(id);
			}
		});

		const queriesToRecompute = new Set<Query<T, Options<T>, any>>();
		const queryRemove = new Set<{ doc: T; query: Query<T, Options<T>, any> }>();

		for (const removeId of remove) {
			const removeDoc = this.get(removeId)!;

			for (const query of this.queries.values()) {
				if (query.dirty) {
					continue;
				}

				if (query.matcher.documentMatches(removeDoc).result) {
					if (query.cursor.skip || query.cursor.limit) {
						queriesToRecompute.add(query);
					} else {
						queryRemove.add({ doc: removeDoc, query });
					}
				}
			}

			this._saveOriginal(removeId, removeDoc);
			this.delete(removeId);
		}

		return { queriesToRecompute, queryRemove, count: remove.size };
	}

	remove(selector: Filter<T>, callback?: (error: Error | null, result: number) => void) {
		// Easy special case: if we're not calling observeChanges callbacks and
		// we're not saving originals and we got asked to remove everything, then
		// just empty everything directly.
		if (this.paused && !this._savedOriginals && JSON.stringify(selector) === '{}') {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, count } = this.prepareRemove(selector);

		// run live query callbacks _after_ we've removed the documents.
		queryRemove.forEach((remove) => {
			this._removeFromResultsSync(remove.query, remove.doc);
		});

		queriesToRecompute.forEach((query) => {
			this._recomputeResults(query);
		});

		this._observeQueue.drain();

		this.deferCallback(callback, null, count);

		return count;
	}

	async removeAsync(selector: Filter<T>, callback?: (error: Error | null, result: number) => void) {
		// Easy special case: if we're not calling observeChanges callbacks and
		// we're not saving originals and we got asked to remove everything, then
		// just empty everything directly.
		if (this.paused && !this._savedOriginals && JSON.stringify(selector) === '{}') {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, count } = this.prepareRemove(selector);

		// run live query callbacks _after_ we've removed the documents.
		for await (const remove of queryRemove) {
			await this._removeFromResultsAsync(remove.query, remove.doc);
		}
		queriesToRecompute.forEach((query) => {
			this._recomputeResults(query);
		});

		await this._observeQueue.drain();

		this.deferCallback(callback, null, count);

		return count;
	}

	// Resume the observers. Observers immediately receive change
	// notifications to bring them to the current state of the
	// database. Note that this is not just replaying all the changes that
	// happened during the pause, it is a smarter 'coalesced' diff.
	private _resumeObservers() {
		// No-op if not paused.
		if (!this.paused) {
			return;
		}

		// Unset the 'paused' flag. Make sure to do this first, otherwise
		// observer methods won't actually fire when we trigger them.
		this.paused = false;

		for (const query of this.queries.values()) {
			if (query.dirty) {
				query.dirty = false;

				// re-compute results will perform `DiffSequence.diffQueryChanges`
				// automatically.
				this._recomputeResults(query, query.resultsSnapshot!);
			} else {
				// Diff the current results against the snapshot and send to observers.
				// pass the query object for its observer callbacks.
				DiffSequence.diffQueryChanges(query.ordered, query.resultsSnapshot!, query.results!, query, {
					projectionFn: query.projectionFn,
				});
			}

			query.resultsSnapshot = null;
		}
	}

	async resumeObserversServer() {
		this._resumeObservers();
		await this._observeQueue.drain();
	}

	resumeObserversClient() {
		this._resumeObservers();
		this._observeQueue.drain();
	}

	retrieveOriginals() {
		if (!this._savedOriginals) {
			throw new Error('Called retrieveOriginals without saveOriginals');
		}

		const originals = this._savedOriginals;

		this._savedOriginals = null;

		return originals;
	}

	// To track what documents are affected by a piece of code, call
	// saveOriginals() before it and retrieveOriginals() after it.
	// retrieveOriginals returns an object whose keys are the ids of the documents
	// that were affected since the call to saveOriginals(), and the values are
	// equal to the document's contents at the time of saveOriginals. (In the case
	// of an inserted document, undefined is the value.) You must alternate
	// between calls to saveOriginals() and retrieveOriginals().
	saveOriginals() {
		if (this._savedOriginals) {
			throw new Error('Called saveOriginals twice without retrieveOriginals');
		}

		this._savedOriginals = new IdMap<T['_id'], T>();
	}

	private prepareUpdate(selector: Filter<T>) {
		// Save the original results of any query that we might need to
		// _recomputeResults on, because _modifyAndNotify will mutate the objects in
		// it. (We don't need to save the original results of paused queries because
		// they already have a resultsSnapshot and we won't be diffing in
		// _recomputeResults.)
		const queryToOriginalResults = new Map<Query<T, Options<T>, any>, IdMap<T['_id'], T> | T[]>();

		// We should only clone each document once, even if it appears in multiple
		// queries
		const docMap = new Map<T['_id'], T>();
		const idsMatched = this._idsMatchedBySelector(selector);

		for (const query of this.queries.values()) {
			if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
				// Catch the case of a reactive `count()` on a cursor with skip
				// or limit, which registers an unordered observe. This is a
				// pretty rare case, so we just clone the entire result set with
				// no optimizations for documents that appear in these result
				// sets and other queries.
				if (!!query.results && !Array.isArray(query.results)) {
					queryToOriginalResults.set(query, query.results.clone());
					continue;
				}

				if (!Array.isArray(query.results)) {
					throw new Error('Assertion failed: query.results not an array');
				}

				// Clones a document to be stored in `qidToOriginalResults`
				// because it may be modified before the new and old result sets
				// are diffed. But if we know exactly which document IDs we're
				// going to modify, then we only need to clone those.
				const memoizedCloneIfNeeded = (doc: T) => {
					if (docMap.has(doc._id)) {
						return docMap.get(doc._id)!;
					}

					const docToMemoize = idsMatched && !idsMatched.some((id) => id === doc._id) ? doc : clone(doc);

					docMap.set(doc._id, docToMemoize);

					return docToMemoize;
				};

				queryToOriginalResults.set(query, query.results.map(memoizedCloneIfNeeded));
			}
		}

		return queryToOriginalResults;
	}

	private finishUpdate({
		options,
		updateCount,
		callback,
		insertedId,
	}: {
		options: { _returnObject?: boolean };
		updateCount: number;
		callback: (error: Error | null, result: number | { numberAffected: number; insertedId?: T['_id'] }) => void;
		insertedId?: T['_id'];
		selector?: unknown;
		mod?: unknown;
	}) {
		// Return the number of affected documents, or in the upsert case, an object
		// containing the number of affected docs and the id of the doc that was
		// inserted, if any.
		let result: { numberAffected: number; insertedId?: T['_id'] } | number;
		if (options._returnObject) {
			result = { numberAffected: updateCount };

			if (insertedId !== undefined) {
				result.insertedId = insertedId;
			}
		} else {
			result = updateCount;
		}

		this.deferCallback(callback, null, result);

		return result;
	}

	// XXX atomicity: if multi is true, and one modification fails, do
	// we rollback the whole operation, or what?
	async updateAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options:
			| { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }
			| null
			| ((
					error: Error | null,
					result:
						| number
						| {
								numberAffected: number;
								insertedId?: T['_id'];
						  },
			  ) => void),
		callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		if (!callback && typeof options === 'function') {
			callback = options as unknown as typeof callback;
			options = null;
		}

		if (!options) {
			options = {};
		}

		const matcher = new Matcher(selector);

		const queriesToOriginalResults = this.prepareUpdate(selector);

		let recomputeQids: Record<QueryId, boolean> = {};

		let updateCount = 0;

		await this._eachPossiblyMatchingDocAsync(selector, async (doc, id) => {
			const queryResult = matcher.documentMatches(doc);

			if (queryResult.result) {
				// XXX Should we save the original even if mod ends up being a no-op?
				this._saveOriginal(id, doc);
				recomputeQids = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!(options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).multi) {
					return false; // break
				}
			}

			return true;
		});

		(Object.keys(recomputeQids) as QueryId[]).forEach((qid) => {
			const query = this.queries.get(qid);

			if (query) {
				this._recomputeResults(query, queriesToOriginalResults.get(query));
			}
		});

		await this._observeQueue.drain();

		// If we are doing an upsert, and we didn't modify any documents yet, then
		// it's time to do an insert. Figure out what document we are inserting, and
		// generate an id for it.
		let insertedId;
		if (updateCount === 0 && (options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).upsert) {
			const doc = this._createUpsertDocument(selector, mod);
			if (!doc._id && (options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).insertedId) {
				doc._id = (options as { multi?: boolean; upsert?: boolean; insertedId: T['_id']; _returnObject?: boolean }).insertedId;
			}

			insertedId = await this.insertAsync(doc);
			updateCount = 1;
		}

		return this.finishUpdate({
			options: options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean },
			insertedId,
			updateCount,
			callback: callback!,
		});
	}

	// XXX atomicity: if multi is true, and one modification fails, do
	// we rollback the whole operation, or what?
	update(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options:
			| { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }
			| null
			| ((
					error: Error | null,
					result:
						| number
						| {
								numberAffected: number;
								insertedId?: T['_id'];
						  },
			  ) => void),
		callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		if (!callback && typeof options === 'function') {
			callback = options as (
				error: Error | null,
				result:
					| number
					| {
							numberAffected: number;
							insertedId?: T['_id'];
					  },
			) => void;
			options = null;
		}

		if (!options) {
			options = {};
		}

		const matcher = new Matcher(selector);

		const queriesToOriginalResults = this.prepareUpdate(selector);

		let recomputeQids = new Set<QueryId>();

		let updateCount = 0;

		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			const queryResult = matcher.documentMatches(doc);

			if (queryResult.result) {
				// XXX Should we save the original even if mod ends up being a no-op?
				this._saveOriginal(id, doc);
				recomputeQids = this._modifyAndNotifySync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!(options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).multi) {
					return false; // break
				}
			}

			return true;
		});

		recomputeQids.forEach((qid) => {
			const query = this.queries.get(qid);
			if (query) {
				this._recomputeResults(query, queriesToOriginalResults.get(query));
			}
		});

		this._observeQueue.drain();

		// If we are doing an upsert, and we didn't modify any documents yet, then
		// it's time to do an insert. Figure out what document we are inserting, and
		// generate an id for it.
		if (updateCount === 0 && (options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).upsert) {
			const doc = this._createUpsertDocument(selector, mod);
			if (!doc._id && (options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).insertedId) {
				doc._id = (options as { multi?: boolean; upsert?: boolean; insertedId: T['_id']; _returnObject?: boolean }).insertedId;
			}

			this.insert(doc);
			updateCount = 1;
		}

		return this.finishUpdate({
			options: options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean },
			updateCount,
			callback: callback!,
			selector,
			mod,
		});
	}

	// A convenience wrapper on update. LocalCollection.upsert(sel, mod) is
	// equivalent to LocalCollection.update(sel, mod, {upsert: true,
	// _returnObject: true}).
	upsert(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options:
			| { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }
			| null
			| ((
					error: Error | null,
					result:
						| number
						| {
								numberAffected: number;
								insertedId?: T['_id'];
						  },
			  ) => void),
		callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}

		return this.update(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	upsertAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		options:
			| { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }
			| null
			| ((
					error: Error | null,
					result:
						| number
						| {
								numberAffected: number;
								insertedId?: T['_id'];
						  },
			  ) => void),
		callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}

		return this.updateAsync(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	// Iterates over a subset of documents that could match selector; calls
	// fn(doc, id) on each of them.  Specifically, if selector specifies
	// specific _id's, it only looks at those.  doc is *not* cloned: it is the
	// same object that is in _docs.
	private async _eachPossiblyMatchingDocAsync(selector: Filter<T>, fn: (doc: T, id: T['_id']) => Promise<boolean>) {
		const specificIds = this._idsMatchedBySelector(selector);

		if (specificIds) {
			for (const id of specificIds) {
				const doc = this.get(id);

				// eslint-disable-next-line no-await-in-loop
				if (doc && !(await fn(doc, id))) {
					break;
				}
			}
		} else {
			for await (const doc of this.all()) {
				if ((await fn(doc, doc._id)) === false) {
					break;
				}
			}
		}
	}

	private _eachPossiblyMatchingDocSync(selector: Filter<T>, fn: (doc: T, id: T['_id']) => void | boolean) {
		const specificIds = this._idsMatchedBySelector(selector);

		if (specificIds) {
			for (const id of specificIds) {
				const doc = this.get(id);

				if (doc && !fn(doc, id)) {
					break;
				}
			}
		} else {
			for (const doc of this.all()) {
				if (fn(doc, doc._id) === false) {
					break;
				}
			}
		}
	}

	private _getMatchedDocAndModify(doc: T) {
		const matchedBefore = new Map<QueryId, boolean>();

		for (const [qid, query] of this.queries.entries()) {
			if (query.dirty) {
				continue;
			}

			if (query.ordered) {
				matchedBefore.set(qid, query.matcher.documentMatches(doc).result);
			} else {
				// Because we don't support skip or limit (yet) in unordered queries, we
				// can just do a direct lookup.
				matchedBefore.set(qid, (query.results as IdMap<T['_id'], T>).has(doc._id));
			}
		}

		return matchedBefore;
	}

	private _modifyAndNotifySync(doc: T, mod: UpdateFilter<T>, arrayIndices: unknown) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		doc = this._modify(doc, mod, { arrayIndices });
		this.set(doc);

		const recomputeQids = new Set<QueryId>();

		for (const [qid, query] of this.queries.entries()) {
			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matchedBefore.get(qid);

			if (query.cursor.skip || query.cursor.limit) {
				// We need to recompute any query where the doc may have been in the
				// cursor's window either before or after the update. (Note that if skip
				// or limit is set, "before" and "after" being true do not necessarily
				// mean that the document is in the cursor's output after skip/limit is
				// applied... but if they are false, then the document definitely is NOT
				// in the output. So it's safe to skip recompute if neither before or
				// after are true.)
				if (before || after) {
					recomputeQids.add(qid);
				}
			} else if (before && !after) {
				this._removeFromResultsSync(query, doc);
			} else if (!before && after) {
				this._insertInResultsSync(query, doc);
			} else if (before && after) {
				this._updateInResultsSync(query, doc, oldDoc);
			}
		}
		return recomputeQids;
	}

	private async _modifyAndNotifyAsync(doc: T, mod: UpdateFilter<T>, arrayIndices: unknown) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		doc = this._modify(doc, mod, { arrayIndices });
		this.set(doc);

		const recomputeQids: Record<QueryId, boolean> = {};
		for (const [qid, query] of this.queries.entries()) {
			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matchedBefore.get(qid);

			if (query.cursor.skip || query.cursor.limit) {
				// We need to recompute any query where the doc may have been in the
				// cursor's window either before or after the update. (Note that if skip
				// or limit is set, "before" and "after" being true do not necessarily
				// mean that the document is in the cursor's output after skip/limit is
				// applied... but if they are false, then the document definitely is NOT
				// in the output. So it's safe to skip recompute if neither before or
				// after are true.)
				if (before || after) {
					recomputeQids[qid] = true;
				}
			} else if (before && !after) {
				// eslint-disable-next-line no-await-in-loop
				await this._removeFromResultsAsync(query, doc);
			} else if (!before && after) {
				// eslint-disable-next-line no-await-in-loop
				await this._insertInResultsAsync(query, doc);
			} else if (before && after) {
				// eslint-disable-next-line no-await-in-loop
				await this._updateInResultsAsync(query, doc, oldDoc);
			}
		}
		return recomputeQids;
	}

	// Recomputes the results of a query and runs observe callbacks for the
	// difference between the previous results and the current results (unless
	// paused). Used for skip/limit queries.
	//
	// When this is used by insert or remove, it can just use query.results for
	// the old results (and there's no need to pass in oldResults), because these
	// operations don't mutate the documents in the collection. Update needs to
	// pass in an oldResults which was deep-copied before the modifier was
	// applied.
	//
	// oldResults is guaranteed to be ignored if the query is not paused.
	private _recomputeResults(query: Query<T, Options<T>, any>, oldResults?: IdMap<T['_id'], T> | T[]) {
		if (this.paused) {
			// There's no reason to recompute the results now as we're still paused.
			// By flagging the query as "dirty", the recompute will be performed
			// when resumeObservers is called.
			query.dirty = true;
			return;
		}

		if (!this.paused && !oldResults) {
			oldResults = query.results;
		}

		query.results = query.cursor._getRawObjects({ ordered: query.ordered });

		if (!this.paused) {
			DiffSequence.diffQueryChanges(query.ordered, oldResults!, query.results, query, { projectionFn: query.projectionFn });
		}
	}

	recomputeAllResults() {
		for (const query of this.queries.values()) {
			this._recomputeResults(query);
		}
	}

	private _saveOriginal(id: T['_id'], doc: T | undefined) {
		// Are we even trying to save originals?
		if (!this._savedOriginals) {
			return;
		}

		// Have we previously mutated the original (and so 'doc' is not actually
		// original)?  (Note the 'has' check rather than truth: we store undefined
		// here for inserted docs!)
		if (this._savedOriginals.has(id)) {
			return;
		}

		this._savedOriginals.set(id, clone(doc));
	}

	// XXX the sorted-query logic below is laughably inefficient. we'll
	// need to come up with a better datastructure for this.
	//
	// XXX the logic for observing with a skip or a limit is even more
	// laughably inefficient. we recompute the whole results every time!

	// This binary search puts a value between any equal values, and the first
	// lesser value.
	private _binarySearch(cmp: (a: T, b: T) => number, array: T[], value: T) {
		let first = 0;
		let range = array.length;

		while (range > 0) {
			const halfRange = Math.floor(range / 2);

			if (cmp(value, array[first + halfRange]) >= 0) {
				first += halfRange + 1;
				range -= halfRange + 1;
			} else {
				range = halfRange;
			}
		}

		return first;
	}

	// Calculates the document to insert in case we're doing an upsert and the
	// selector does not match any elements
	private _createUpsertDocument(selector: Filter<T>, modifier: UpdateFilter<T>) {
		const selectorDocument = populateDocumentWithQueryFields(selector);
		const isModify = this._isModificationMod(modifier);

		let newDoc: Partial<T> = {};

		if (selectorDocument._id) {
			newDoc._id = selectorDocument._id;
			delete selectorDocument._id;
		}

		// This double _modify call is made to help with nested properties (see issue
		// #8631). We do this even if it's a replacement for validation purposes (e.g.
		// ambiguous id's)
		newDoc = this._modify(newDoc, { $set: selectorDocument });
		newDoc = this._modify(newDoc, modifier, { isInsert: true });

		if (isModify) {
			return newDoc as T;
		}

		// Replacement can take _id from query document
		const replacement = Object.assign({}, modifier);
		if (newDoc._id) {
			replacement._id = newDoc._id;
		}

		return replacement as T;
	}

	private _findInOrderedResults(query: Query<T, Options<T>, any>, doc: T): number {
		if (!query.ordered) {
			throw createMinimongoError("Can't call _findInOrderedResults on unordered query");
		}

		for (let i = 0; i < (query as OrderedQuery<T, Options<T>, T>).results.length; i++) {
			if ((query as OrderedQuery<T, Options<T>, T>).results[i]._id === doc._id) {
				return i;
			}
		}

		throw createMinimongoError('object missing from query');
	}

	// If this is a selector which explicitly constrains the match by ID to a finite
	// number of documents, returns a list of their IDs.  Otherwise returns
	// null. Note that the selector may have other restrictions so it may not even
	// match those document!  We care about $in and $and since those are generated
	// access-controlled update and remove.
	private _idsMatchedBySelector(selector: Filter<T> | T['_id']): T['_id'][] | null {
		// Is the selector just an ID?
		if (_selectorIsId(selector)) {
			return [selector];
		}

		if (!selector) {
			return null;
		}

		// Do we have an _id clause?
		if (hasOwn.call(selector, '_id')) {
			// Is the _id clause just an ID?
			if (_selectorIsId(selector._id)) {
				return [selector._id];
			}

			// Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
			if (
				selector._id &&
				Array.isArray((selector._id as any).$in) &&
				(selector._id as any).$in.length &&
				(selector._id as any).$in.every(_selectorIsId)
			) {
				return (selector._id as any).$in;
			}

			return null;
		}

		// If this is a top-level $and, and any of the clauses constrain their
		// documents, then the whole selector is constrained by any one clause's
		// constraint. (Well, by their intersection, but that seems unlikely.)
		if (Array.isArray(selector.$and)) {
			for (let i = 0; i < selector.$and.length; ++i) {
				const subIds = this._idsMatchedBySelector(selector.$and[i] as Filter<T> | T['_id']);

				if (subIds) {
					return subIds;
				}
			}
		}

		return null;
	}

	private _insertInResultsSync(query: Query<T, Options<T>, T>, doc: T) {
		const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!(query as OrderedQuery<T, Options<T>, T>).sorter) {
				(query as OrderedQuery<T, Options<T>, T>).addedBefore(
					doc._id,
					(query as OrderedQuery<T, Options<T>, T>).projectionFn(fields),
					null,
				);
				(query as OrderedQuery<T, Options<T>, T>).results.push(doc);
			} else {
				const i = this._insertInSortedList(
					(query as OrderedQuery<T, Options<T>, T>).sorter.getComparator(),
					(query as OrderedQuery<T, Options<T>, T>).results,
					doc,
				);

				const next = (query as OrderedQuery<T, Options<T>, T>).results[i + 1]?._id ?? null;

				(query as OrderedQuery<T, Options<T>, T>).addedBefore(
					doc._id,
					(query as OrderedQuery<T, Options<T>, T>).projectionFn(fields),
					next,
				);
			}

			(query as OrderedQuery<T, Options<T>, T>).added(doc._id, query.projectionFn(fields));
		} else {
			(query as UnorderedQuery<T, Options<T>, T>).added(doc._id, (query as UnorderedQuery<T, Options<T>, T>).projectionFn(fields));
			(query as UnorderedQuery<T, Options<T>, T>).results.set(doc._id, doc);
		}
	}

	private async _insertInResultsAsync(query: Query<T, Options<T>, T>, doc: T) {
		const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!(query as OrderedQuery<T, Options<T>, T>).sorter) {
				await (query as OrderedQuery<T, Options<T>, T>).addedBefore(
					doc._id,
					(query as OrderedQuery<T, Options<T>, T>).projectionFn(fields),
					null,
				);
				(query as OrderedQuery<T, Options<T>, T>).results.push(doc);
			} else {
				const i = this._insertInSortedList(
					(query as OrderedQuery<T, Options<T>, T>).sorter.getComparator(),
					(query as OrderedQuery<T, Options<T>, T>).results,
					doc,
				);

				const next = (query as OrderedQuery<T, Options<T>, T>).results[i + 1]?._id ?? null;

				await (query as OrderedQuery<T, Options<T>, T>).addedBefore(
					doc._id,
					(query as OrderedQuery<T, Options<T>, T>).projectionFn(fields),
					next,
				);
			}

			await (query as OrderedQuery<T, Options<T>, T>).added(doc._id, (query as OrderedQuery<T, Options<T>, T>).projectionFn(fields));
		} else {
			await (query as UnorderedQuery<T, Options<T>, T>).added(doc._id, (query as UnorderedQuery<T, Options<T>, T>).projectionFn(fields));
			(query as UnorderedQuery<T, Options<T>, T>).results.set(doc._id, doc);
		}
	}

	private _insertInSortedList(cmp: (a: T, b: T) => number, array: T[], value: T) {
		if (array.length === 0) {
			array.push(value);
			return 0;
		}

		const i = this._binarySearch(cmp, array, value);

		array.splice(i, 0, value);

		return i;
	}

	private _isModificationMod(mod: UpdateFilter<T> | T) {
		let isModify = false;
		let isReplace = false;

		Object.keys(mod).forEach((key) => {
			if (key.slice(0, 1) === '$') {
				isModify = true;
			} else {
				isReplace = true;
			}
		});

		if (isModify && isReplace) {
			throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
		}

		return isModify;
	}

	// XXX need a strategy for passing the binding of $ into this
	// function, from the compiled selector
	//
	// maybe just {key.up.to.just.before.dollarsign: array_index}
	//
	// XXX atomicity: if one modification fails, do we roll back the whole
	// change?
	//
	// options:
	//   - isInsert is set when _modify is being called to compute the document to
	//     insert as part of an upsert operation. We use this primarily to figure
	//     out when to set the fields in $setOnInsert, if present.
	private _modify<U extends Partial<T>>(doc: U, modifier: UpdateFilter<T>, options: { isInsert?: boolean; arrayIndices?: unknown } = {}) {
		if (!_isPlainObject(modifier)) {
			throw createMinimongoError('Modifier must be an object');
		}

		// Make sure the caller can't mutate our data structures.
		modifier = clone(modifier);

		const isModifier = isOperatorObject(modifier);
		const newDoc = isModifier ? clone(doc) : (modifier as T);

		if (isModifier) {
			// apply modifiers to the doc.
			Object.keys(modifier).forEach((operator) => {
				// Treat $setOnInsert as $set if this is an insert.
				const setOnInsert = options.isInsert && operator === '$setOnInsert';
				const modFunc = MODIFIERS[(setOnInsert ? '$set' : operator) as keyof typeof MODIFIERS];
				const operand = modifier[operator];

				if (!modFunc) {
					throw createMinimongoError(`Invalid modifier specified ${operator}`);
				}

				Object.keys(operand).forEach((keypath) => {
					const arg = operand[keypath];

					if (keypath === '') {
						throw createMinimongoError('An empty update path is not valid.');
					}

					const keyparts = keypath.split('.');

					if (!keyparts.every(Boolean)) {
						throw createMinimongoError(`The update path '${keypath}' contains an empty field name, which is not allowed.`);
					}

					const target = findModTarget(newDoc, keyparts, {
						arrayIndices: options.arrayIndices,
						forbidArray: operator === '$rename',
						noCreate: NO_CREATE_MODIFIERS[operator as keyof typeof NO_CREATE_MODIFIERS],
					});

					modFunc(target, keyparts.pop(), arg, keypath, newDoc);
				});
			});

			if (doc._id && doc._id !== newDoc._id) {
				throw createMinimongoError(
					`After applying the update to the document {_id: "${doc._id}", ...},` +
						" the (immutable) field '_id' was found to have been altered to " +
						`_id: "${newDoc._id}"`,
				);
			}
		} else {
			if (doc._id && modifier._id && doc._id !== modifier._id) {
				throw createMinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${modifier._id}"}`);
			}

			// replace the whole document
			assertHasValidFieldNames(modifier);
		}

		return Object.freeze(newDoc);
	}

	private _removeFromResultsSync(query: Query<T, Options<T>, T>, doc: T) {
		if (query.ordered) {
			const i = this._findInOrderedResults(query, doc);

			(query as OrderedQuery<T, Options<T>, any>).removed(doc._id);
			(query as OrderedQuery<T, Options<T>, any>).results.splice(i, 1);
		} else {
			const id = doc._id; // in case callback mutates doc

			(query as UnorderedQuery<T, Options<T>, any>).removed(doc._id);
			(query as UnorderedQuery<T, Options<T>, any>).results.remove(id);
		}
	}

	private async _removeFromResultsAsync(query: Query<T, Options<T>, T>, doc: T) {
		if (query.ordered) {
			const i = this._findInOrderedResults(query, doc);

			await (query as OrderedQuery<T, Options<T>, any>).removed(doc._id);
			(query as OrderedQuery<T, Options<T>, any>).results.splice(i, 1);
		} else {
			const id = doc._id; // in case callback mutates doc

			await (query as UnorderedQuery<T, Options<T>, any>).removed(doc._id);
			(query as UnorderedQuery<T, Options<T>, any>).results.remove(id);
		}
	}

	private _updateInResultsSync(query: Query<T, Options<T>, T>, doc: T, oldDoc: T) {
		if (doc._id !== oldDoc._id) {
			throw new Error("Can't change a doc's _id while updating");
		}

		const { projectionFn } = query;
		const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(oldDoc));

		if (!query.ordered) {
			if (Object.keys(changedFields).length) {
				(query as UnorderedQuery<T, Options<T>, any>).changed(doc._id, changedFields);
				(query as UnorderedQuery<T, Options<T>, any>).results.set(doc._id, doc);
			}

			return;
		}

		const oldIdx = this._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			(query as OrderedQuery<T, Options<T>, any>).changed(doc._id, changedFields);
		}

		if (!query.sorter) {
			return;
		}

		// just take it out and put it back in again, and see if the index changes
		(query as OrderedQuery<T, Options<T>, any>).results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(
			(query as OrderedQuery<T, Options<T>, any>).sorter.getComparator(),
			(query as OrderedQuery<T, Options<T>, any>).results,
			doc,
		);

		if (oldIdx !== newIdx) {
			const next = (query as OrderedQuery<T, Options<T>, any>).results[newIdx + 1]?._id ?? null;

			query.movedBefore && query.movedBefore(doc._id, next);
		}
	}

	private async _updateInResultsAsync(query: Query<T, Options<T>, T>, doc: T, oldDoc: T) {
		if (doc._id !== oldDoc._id) {
			throw new Error("Can't change a doc's _id while updating");
		}

		const { projectionFn } = query;
		const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(oldDoc));

		if (!query.ordered) {
			if (Object.keys(changedFields).length) {
				await (query as UnorderedQuery<T, Options<T>, any>).changed(doc._id, changedFields);
				(query as UnorderedQuery<T, Options<T>, any>).results.set(doc._id, doc);
			}

			return;
		}

		const oldIdx = this._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			await (query as OrderedQuery<T, Options<T>, any>).changed(doc._id, changedFields);
		}

		if (!query.sorter) {
			return;
		}

		// just take it out and put it back in again, and see if the index changes
		(query as OrderedQuery<T, Options<T>, any>).results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(
			(query as OrderedQuery<T, Options<T>, any>).sorter.getComparator(),
			(query as OrderedQuery<T, Options<T>, any>).results,
			doc,
		);

		if (oldIdx !== newIdx) {
			const next = (query as OrderedQuery<T, Options<T>, any>).results[newIdx + 1]?._id ?? null;

			query.movedBefore && (await query.movedBefore(doc._id, next));
		}
	}
}

const MODIFIERS = {
	$currentDate(target: any, field: any, arg: any) {
		if (typeof arg === 'object' && hasOwn.call(arg, '$type')) {
			if (arg.$type !== 'date') {
				throw createMinimongoError('Minimongo does currently only support the date type in $currentDate modifiers', { field });
			}
		} else if (arg !== true) {
			throw createMinimongoError('Invalid $currentDate modifier', { field });
		}

		target[field] = new Date();
	},
	$inc(target: any, field: any, arg: any) {
		if (typeof arg !== 'number') {
			throw createMinimongoError('Modifier $inc allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw createMinimongoError('Cannot apply $inc modifier to non-number', { field });
			}

			target[field] += arg;
		} else {
			target[field] = arg;
		}
	},
	$min(target: any, field: any, arg: any) {
		if (typeof arg !== 'number') {
			throw createMinimongoError('Modifier $min allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw createMinimongoError('Cannot apply $min modifier to non-number', { field });
			}

			if (target[field] > arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},
	$max(target: any, field: any, arg: any) {
		if (typeof arg !== 'number') {
			throw createMinimongoError('Modifier $max allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw createMinimongoError('Cannot apply $max modifier to non-number', { field });
			}

			if (target[field] < arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},
	$mul(target: any, field: any, arg: any) {
		if (typeof arg !== 'number') {
			throw createMinimongoError('Modifier $mul allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw createMinimongoError('Cannot apply $mul modifier to non-number', { field });
			}

			target[field] *= arg;
		} else {
			target[field] = 0;
		}
	},
	$rename(target: any, field: any, arg: any, keypath: any, doc: any) {
		// no idea why mongo has this restriction..
		if (keypath === arg) {
			throw createMinimongoError('$rename source must differ from target', { field });
		}

		if (target === null) {
			throw createMinimongoError('$rename source field invalid', { field });
		}

		if (typeof arg !== 'string') {
			throw createMinimongoError('$rename target must be a string', { field });
		}

		if (arg.includes('\0')) {
			// Null bytes are not allowed in Mongo field names
			// https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
			throw createMinimongoError("The 'to' field for $rename cannot contain an embedded null byte", { field });
		}

		if (target === undefined) {
			return;
		}

		const object = target[field];

		delete target[field];

		const keyparts = arg.split('.');
		const target2 = findModTarget(doc, keyparts, { forbidArray: true });

		if (target2 === null) {
			throw createMinimongoError('$rename target field invalid', { field });
		}

		target2![keyparts.pop()!] = object;
	},
	$set(target: any, field: any, arg: any) {
		if (target !== Object(target)) {
			// not an array or an object
			const error: any = createMinimongoError('Cannot set property on non-object field', { field });
			error.setPropertyError = true;
			throw error;
		}

		if (target === null) {
			const error: any = createMinimongoError('Cannot set property on null', { field });
			error.setPropertyError = true;
			throw error;
		}

		assertHasValidFieldNames(arg);

		target[field] = arg;
	},
	$setOnInsert() {
		// converted to `$set` in `_modify`
	},
	$unset(target: any, field: any) {
		if (target !== undefined) {
			if (Array.isArray(target)) {
				if (field in target) {
					target[field] = null;
				}
			} else {
				delete target[field];
			}
		}
	},
	$push(target: any, field: any, arg: any) {
		if (target[field] === undefined) {
			target[field] = [];
		}

		if (!Array.isArray(target[field])) {
			throw createMinimongoError('Cannot apply $push modifier to non-array', { field });
		}

		if (!(arg && arg.$each)) {
			// Simple mode: not $each
			assertHasValidFieldNames(arg);

			target[field].push(arg);

			return;
		}

		// Fancy mode: $each (and maybe $slice and $sort and $position)
		const toPush = arg.$each;
		if (!Array.isArray(toPush)) {
			throw createMinimongoError('$each must be an array', { field });
		}

		assertHasValidFieldNames(toPush);

		// Parse $position
		let position = undefined;
		if ('$position' in arg) {
			if (typeof arg.$position !== 'number') {
				throw createMinimongoError('$position must be a numeric value', { field });
			}

			// XXX should check to make sure integer
			if (arg.$position < 0) {
				throw createMinimongoError('$position in $push must be zero or positive', { field });
			}

			position = arg.$position;
		}

		// Parse $slice.
		let slice = undefined;
		if ('$slice' in arg) {
			if (typeof arg.$slice !== 'number') {
				throw createMinimongoError('$slice must be a numeric value', { field });
			}

			// XXX should check to make sure integer
			slice = arg.$slice;
		}

		// Parse $sort.
		let sortFunction = undefined;
		if (arg.$sort) {
			if (slice === undefined) {
				throw createMinimongoError('$sort requires $slice to be present', { field });
			}

			// XXX this allows us to use a $sort whose value is an array, but that's
			// actually an extension of the Node driver, so it won't work
			// server-side. Could be confusing!
			// XXX is it correct that we don't do geo-stuff here?
			sortFunction = new Sorter(arg.$sort).getComparator();

			toPush.forEach((element) => {
				if (_f._type(element) !== 3) {
					throw createMinimongoError('$push like modifiers using $sort require all elements to be objects', { field });
				}
			});
		}

		// Actually push.
		if (position === undefined) {
			toPush.forEach((element) => {
				target[field].push(element);
			});
		} else {
			const spliceArguments = [position, 0];

			toPush.forEach((element) => {
				spliceArguments.push(element);
			});

			target[field].splice(...(spliceArguments as Parameters<typeof Array.prototype.splice>));
		}

		// Actually sort.
		if (sortFunction) {
			target[field].sort(sortFunction);
		}

		// Actually slice.
		if (slice !== undefined) {
			if (slice === 0) {
				target[field] = []; // differs from Array.slice!
			} else if (slice < 0) {
				target[field] = target[field].slice(slice);
			} else {
				target[field] = target[field].slice(0, slice);
			}
		}
	},
	$pushAll(target: any, field: any, arg: any) {
		if (!(typeof arg === 'object' && Array.isArray(arg))) {
			throw createMinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
		}

		assertHasValidFieldNames(arg);

		const toPush = target[field];

		if (toPush === undefined) {
			target[field] = arg;
		} else if (!Array.isArray(toPush)) {
			throw createMinimongoError('Cannot apply $pushAll modifier to non-array', { field });
		} else {
			toPush.push(...arg);
		}
	},
	$addToSet(target: any, field: any, arg: any) {
		let isEach = false;

		if (typeof arg === 'object') {
			// check if first key is '$each'
			const keys = Object.keys(arg);
			if (keys[0] === '$each') {
				isEach = true;
			}
		}

		const values = isEach ? arg.$each : [arg];

		assertHasValidFieldNames(values);

		const toAdd = target[field];
		if (toAdd === undefined) {
			target[field] = values;
		} else if (!Array.isArray(toAdd)) {
			throw createMinimongoError('Cannot apply $addToSet modifier to non-array', { field });
		} else {
			values.forEach((value: any) => {
				if (toAdd.some((element) => _f._equal(value, element))) {
					return;
				}

				toAdd.push(value);
			});
		}
	},
	$pop(target: any, field: any, arg: any) {
		if (target === undefined) {
			return;
		}

		const toPop = target[field];

		if (toPop === undefined) {
			return;
		}

		if (!Array.isArray(toPop)) {
			throw createMinimongoError('Cannot apply $pop modifier to non-array', { field });
		}

		if (typeof arg === 'number' && arg < 0) {
			toPop.splice(0, 1);
		} else {
			toPop.pop();
		}
	},
	$pull(target: any, field: any, arg: any) {
		if (target === undefined) {
			return;
		}

		const toPull = target[field];
		if (toPull === undefined) {
			return;
		}

		if (!Array.isArray(toPull)) {
			throw createMinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		let out;
		if (arg != null && typeof arg === 'object' && !Array.isArray(arg)) {
			// XXX would be much nicer to compile this once, rather than
			// for each document we modify.. but usually we're not
			// modifying that many documents, so we'll let it slide for
			// now

			// XXX Minimongo.Matcher isn't up for the job, because we need
			// to permit stuff like {$pull: {a: {$gt: 4}}}.. something
			// like {$gt: 4} is not normally a complete selector.
			// same issue as $elemMatch possibly?
			const matcher = new Matcher(arg);

			out = toPull.filter((element) => !matcher.documentMatches(element).result);
		} else {
			out = toPull.filter((element) => !_f._equal(element, arg));
		}

		target[field] = out;
	},
	$pullAll(target: any, field: any, arg: any) {
		if (!(typeof arg === 'object' && Array.isArray(arg))) {
			throw createMinimongoError('Modifier $pushAll/pullAll allowed for arrays only', { field });
		}

		if (target === undefined) {
			return;
		}

		const toPull = target[field];

		if (toPull === undefined) {
			return;
		}

		if (!Array.isArray(toPull)) {
			throw createMinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		target[field] = toPull.filter((object) => !arg.some((element) => _f._equal(object, element)));
	},
	$bit(_target: any, field: any) {
		// XXX mongo only supports $bit on integers, and we only support
		// native javascript numbers (doubles) so far, so we can't support $bit
		throw createMinimongoError('$bit is not supported', { field });
	},
	$v() {
		// As discussed in https://github.com/meteor/meteor/issues/9623,
		// the `$v` operator is not needed by Meteor, but problems can occur if
		// it's not at least callable (as of Mongo >= 3.6). It's defined here as
		// a no-op to work around these problems.
	},
};

const NO_CREATE_MODIFIERS = {
	$pop: true,
	$pull: true,
	$pullAll: true,
	$rename: true,
	$unset: true,
};

// Make sure field names do not contain Mongo restricted
// characters ('.', '$', '\0').
// https://docs.mongodb.com/manual/reference/limits/#Restrictions-on-Field-Names
const invalidCharMsg = {
	'$': "start with '$'",
	'.': "contain '.'",
	'\0': 'contain null bytes',
};

// checks if all field names in an object are valid
function assertHasValidFieldNames(doc: unknown) {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key, value) => {
			assertIsValidFieldName(key);
			return value;
		});
	}
}

function assertIsValidFieldName(key: string) {
	let match;
	if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) {
		throw createMinimongoError(`Key ${key} must not ${invalidCharMsg[match[0] as keyof typeof invalidCharMsg]}`);
	}
}

// for a.b.c.2.d.e, keyparts should be ['a', 'b', 'c', '2', 'd', 'e'],
// and then you would operate on the 'e' property of the returned
// object.
//
// if options.noCreate is falsey, creates intermediate levels of
// structure as necessary, like mkdir -p (and raises an exception if
// that would mean giving a non-numeric property to an array.) if
// options.noCreate is true, return undefined instead.
//
// may modify the last element of keyparts to signal to the caller that it needs
// to use a different value to index into the returned object (for example,
// ['a', '01'] -> ['a', 1]).
//
// if forbidArray is true, return null if the keypath goes through an array.
//
// if options.arrayIndices is set, use its first element for the (first) '$' in
// the path.
function findModTarget(doc: any, keyparts: (string | number)[], options: any = {}) {
	let usedArrayIndex = false;

	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart: string | number = keyparts[i];

		if (!isIndexable(doc)) {
			if (options.noCreate) {
				return undefined;
			}

			const error: any = createMinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
			error.setPropertyError = true;
			throw error;
		}

		if (Array.isArray(doc)) {
			if (options.forbidArray) {
				return null;
			}

			if (keypart === '$') {
				if (usedArrayIndex) {
					throw createMinimongoError("Too many positional (i.e. '$') elements");
				}

				if (!options.arrayIndices || !options.arrayIndices.length) {
					throw createMinimongoError('The positional operator did not find the match needed from the query');
				}

				keypart = options.arrayIndices[0];
				usedArrayIndex = true;
			} else if (isNumericKey(keypart as string)) {
				keypart = parseInt(keypart as string);
			} else {
				if (options.noCreate) {
					return undefined;
				}

				throw createMinimongoError(`can't append to array using string field name [${keypart}]`);
			}

			if (last) {
				keyparts[i] = keypart; // handle 'a.01'
			}

			if (options.noCreate && (keypart as number) >= doc.length) {
				return undefined;
			}

			while (doc.length < (keypart as number)) {
				doc.push(null);
			}

			if (!last) {
				if (doc.length === keypart) {
					doc.push({});
				} else if (typeof doc[keypart as number] !== 'object') {
					throw createMinimongoError(`can't modify field '${keyparts[i + 1]}' of list value ${JSON.stringify(doc[keypart as number])}`);
				}
			}
		} else {
			assertIsValidFieldName(keypart as string);

			if (!(keypart in doc)) {
				if (options.noCreate) {
					return undefined;
				}

				if (!last) {
					doc[keypart] = {};
				}
			}
		}

		if (last) {
			return doc as { [index: string | number]: any };
		}

		doc = doc[keypart as keyof typeof doc];
	}

	// notreached
	throw new Error('Should not reach here');
}
