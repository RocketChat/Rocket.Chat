import { createDocumentMatcherFromFilter, createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import type { ArrayIndices } from '@rocket.chat/mongo-adapter';
import { Meteor } from 'meteor/meteor';
import type { CountDocumentsOptions, FilterOperators, Filter, UpdateFilter } from 'mongodb';
import type { StoreApi, UseBoundStore } from 'zustand';

import { Cursor } from './Cursor';
import type { Options } from './Cursor';
import { DiffSequence } from './DiffSequence';
import type { IdMap } from './IdMap';
import { MinimongoError } from './MinimongoError';
import type { Query } from './Query';
import { SynchronousQueue } from './SynchronousQueue';
import { Updater } from './Updater';
import { _selectorIsId, clone, assertHasValidFieldNames } from './common';

/**
 * Forked from Meteor's Mongo.Collection, this class implements a local collection over a Zustand store.
 *
 * Do not use this class directly.
 */
export class LocalCollection<T extends { _id: string }> {
	readonly observeQueue = new SynchronousQueue();

	readonly queries = new Set<Query<T>>();

	private savedOriginals: Map<T['_id'], T | undefined> | null = null;

	paused = false;

	constructor(public store: UseBoundStore<StoreApi<{ readonly records: ReadonlyMap<T['_id'], T> }>>) {}

	find(selector: Filter<T> | T['_id'] = {}, options?: Options<T>) {
		return new Cursor(this, selector, options);
	}

	countDocuments(selector: Filter<T> = {}, options?: CountDocumentsOptions) {
		return this.find(selector, options).countAsync();
	}

	estimatedDocumentCount(options?: CountDocumentsOptions) {
		return this.find({}, options).countAsync();
	}

	findOne(selector?: Filter<T> | T['_id'], options?: Options<T>) {
		return this.find(selector, { ...options, limit: 1 }).fetch()[0];
	}

	async findOneAsync(selector: Filter<T> | T['_id'] = {}, options: Options<T> = {}) {
		return (await this.find(selector, { ...options, limit: 1 }).fetchAsync())[0];
	}

	private prepareInsert(doc: T) {
		assertHasValidFieldNames(doc);

		if (!('_id' in doc)) {
			throw new MinimongoError('Document must have an _id field');
		}

		if (this.store.getState().records.has(doc._id)) {
			throw new MinimongoError(`Duplicate _id '${doc._id}'`);
		}

		this._saveOriginal(doc._id, undefined);
		this.store.setState((state) => {
			const records = new Map(state.records);
			records.set(doc._id, doc);
			return { records };
		});

		return doc._id;
	}

	insert(doc: T, callback?: (error: Error | null, id: T['_id']) => void) {
		doc = clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = new Set<Query<T>>();

		for (const query of this.queries) {
			if (query.dirty) continue;

			if (query.predicate(doc)) {
				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.add(query);
				} else {
					this._insertInResults(query, doc);
				}
			}
		}

		for (const query of queriesToRecompute) {
			this._recomputeResults(query);
		}

		this.observeQueue.drain();
		this.deferCallback(callback, null, id);

		return id;
	}

	async insertAsync(doc: T, callback?: (error: Error | null, id: T['_id']) => void) {
		doc = clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = new Set<Query<T>>();

		for await (const query of this.queries) {
			if (query.dirty) continue;

			if (query.predicate(doc)) {
				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.add(query);
				} else {
					await this._insertInResultsAsync(query, doc);
				}
			}
		}

		for (const query of queriesToRecompute) {
			this._recomputeResults(query);
		}

		this.observeQueue.drain();
		this.deferCallback(callback, null, id);

		return id;
	}

	private deferCallback<TFunction extends (...args: any) => void>(callback: TFunction | undefined | null, ...args: Parameters<TFunction>) {
		if (callback) Meteor.defer(() => callback(...args));
	}

	private _insertInResults(query: Query<T>, doc: T) {
		const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!query.comparator) {
				query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = this._insertInSortedList(query.comparator, query.results, doc);

				const next = query.results[i + 1]?._id ?? null;

				query.addedBefore(doc._id, query.projectionFn(fields), next);
			}

			query.added(doc._id, query.projectionFn(fields));
		} else {
			query.added(doc._id, query.projectionFn(fields));
			query.results.set(doc._id, doc);
		}
	}

	private async _insertInResultsAsync(query: Query<T>, doc: T) {
		const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!query.comparator) {
				await query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = this._insertInSortedList(query.comparator, query.results, doc);

				const next = query.results[i + 1]?._id ?? null;

				await query.addedBefore(doc._id, query.projectionFn(fields), next);
			}

			await query.added(doc._id, query.projectionFn(fields));
		} else {
			await query.added(doc._id, query.projectionFn(fields));
			query.results.set(doc._id, doc);
		}
	}

	pauseObservers() {
		if (this.paused) return;

		this.paused = true;

		for (const query of this.queries) {
			query.resultsSnapshot = clone(query.results);
		}
	}

	private clearResultQueries(callback?: (error: Error | null, result: number) => void) {
		const result = this.store.getState().records.size;

		this.store.setState({ records: new Map() });

		for (const query of this.queries) {
			if (query.ordered) {
				query.results = [];
			} else {
				query.results.clear();
			}
		}

		this.deferCallback(callback, null, result);

		return result;
	}

	private prepareRemove(selector: Filter<T>) {
		const predicate = createPredicateFromFilter<T>(selector);
		const remove = new Set<T>();

		this._eachPossiblyMatchingDoc(selector, (doc) => {
			if (predicate(doc)) {
				remove.add(doc);
			}
		});

		const queriesToRecompute = new Set<Query<T>>();
		const queryRemove = new Set<{ doc: T; query: Query<T> }>();

		for (const removeDoc of remove) {
			for (const query of this.queries) {
				if (query.dirty) continue;

				if (query.predicate(removeDoc)) {
					if (query.cursor.skip || query.cursor.limit) {
						queriesToRecompute.add(query);
					} else {
						queryRemove.add({ doc: removeDoc, query });
					}
				}
			}

			this._saveOriginal(removeDoc._id, removeDoc);
			this.store.setState((state) => {
				const records = new Map(state.records);
				records.delete(removeDoc._id);
				return { records };
			});
		}

		return { queriesToRecompute, queryRemove, count: remove.size };
	}

	remove(selector: Filter<T>, callback?: (error: Error | null, result: number) => void) {
		if (this.paused && !this.savedOriginals && JSON.stringify(selector) === '{}') {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, count } = this.prepareRemove(selector);

		for (const remove of queryRemove) {
			this._removeFromResults(remove.query, remove.doc);
		}

		for (const query of queriesToRecompute) {
			this._recomputeResults(query);
		}

		this.observeQueue.drain();

		this.deferCallback(callback, null, count);

		return count;
	}

	async removeAsync(selector: Filter<T>, callback?: (error: Error | null, result: number) => void) {
		if (this.paused && !this.savedOriginals && JSON.stringify(selector) === '{}') {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, count } = this.prepareRemove(selector);

		for await (const remove of queryRemove) {
			await this._removeFromResultsAsync(remove.query, remove.doc);
		}
		for (const query of queriesToRecompute) {
			this._recomputeResults(query);
		}

		this.observeQueue.drain();

		this.deferCallback(callback, null, count);

		return count;
	}

	private _resumeObservers() {
		if (!this.paused) return;

		this.paused = false;

		for (const query of this.queries) {
			if (query.dirty) {
				query.dirty = false;
				this._recomputeResults(query, query.resultsSnapshot);
			} else {
				DiffSequence.diffQueryChanges(query.ordered, query.resultsSnapshot!, query.results, query, {
					projectionFn: query.projectionFn,
				});
			}

			query.resultsSnapshot = null;
		}
	}

	async resumeObserversServer() {
		this._resumeObservers();
		await this.observeQueue.drain();
	}

	resumeObserversClient() {
		this._resumeObservers();
		this.observeQueue.drain();
	}

	retrieveOriginals() {
		if (!this.savedOriginals) {
			throw new MinimongoError('Called retrieveOriginals without saveOriginals');
		}

		const originals = this.savedOriginals;

		this.savedOriginals = null;

		return originals;
	}

	saveOriginals() {
		if (this.savedOriginals) {
			throw new MinimongoError('Called saveOriginals twice without retrieveOriginals');
		}

		this.savedOriginals = new Map<T['_id'], T>();
	}

	private prepareUpdate(selector: Filter<T>) {
		const queryToOriginalResults = new Map<Query<T>, IdMap<T['_id'], T> | T[]>();

		const docMap = new Map<T['_id'], T>();
		const idsMatched = this._idsMatchedBySelector(selector);

		for (const query of this.queries) {
			if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
				if (!!query.results && !Array.isArray(query.results)) {
					queryToOriginalResults.set(query, query.results.clone());
					continue;
				}

				if (!Array.isArray(query.results)) {
					throw new MinimongoError('Assertion failed: query.results not an array');
				}

				const memoizedCloneIfNeeded = (doc: T) => {
					if (docMap.has(doc._id)) {
						return docMap.get(doc._id) as T;
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
		callback?: (error: Error | null, result: number | { numberAffected: number; insertedId?: T['_id'] }) => void;
		insertedId?: T['_id'];
		selector?: unknown;
		mod?: unknown;
	}) {
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

	async updateAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		_options?:
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
		_callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		const callback = !_callback && typeof _options === 'function' ? _options : _callback;
		const options = typeof _options === 'object' && _options !== null ? _options : {};

		const matchDocument = createDocumentMatcherFromFilter<T>(selector);

		const queriesToOriginalResults = this.prepareUpdate(selector);

		let recomputeQueries = new Set<Query<T>>();

		let updateCount = 0;

		await this._eachPossiblyMatchingDocAsync(selector, async (doc, id) => {
			const queryResult = matchDocument(doc);

			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQueries = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!options.multi) {
					return false;
				}
			}

			return true;
		});

		for (const query of recomputeQueries.keys()) {
			this._recomputeResults(query, queriesToOriginalResults.get(query));
		}

		await this.observeQueue.drain();

		let insertedId;
		if (updateCount === 0 && options.upsert) {
			const doc = this._createUpsertDocument(selector, mod);
			if (!doc._id && options.insertedId) {
				doc._id = options.insertedId;
			}

			insertedId = await this.insertAsync(doc);
			updateCount = 1;
		}

		return this.finishUpdate({
			options,
			insertedId,
			updateCount,
			callback,
		});
	}

	update(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		_options?:
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
		_callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		const callback = !_callback && typeof _options === 'function' ? _options : _callback;
		const options = typeof _options === 'object' && _options !== null ? _options : {};

		const matchDocument = createDocumentMatcherFromFilter(selector);

		const queriesToOriginalResults = this.prepareUpdate(selector);

		let recomputeQueries = new Set<Query<T>>();

		let updateCount = 0;

		this._eachPossiblyMatchingDoc(selector, (doc, id) => {
			const queryResult = matchDocument(doc);

			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQueries = this._modifyAndNotify(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!options.multi) {
					return false;
				}
			}

			return true;
		});

		for (const query of recomputeQueries) {
			this._recomputeResults(query, queriesToOriginalResults.get(query));
		}

		this.observeQueue.drain();

		if (updateCount === 0 && options.upsert) {
			const doc = this._createUpsertDocument(selector, mod);
			if (!doc._id && options.insertedId) {
				doc._id = options.insertedId;
			}

			this.insert(doc);
			updateCount = 1;
		}

		return this.finishUpdate({
			options,
			updateCount,
			callback,
			selector,
			mod,
		});
	}

	upsert(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		_options?:
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
		_callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		const callback = !_callback && typeof _options === 'function' ? _options : _callback;
		const options = typeof _options === 'object' && _options !== null ? _options : {};

		return this.update(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	upsertAsync(
		selector: Filter<T>,
		mod: UpdateFilter<T>,
		_options?:
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
		_callback?: (
			error: Error | null,
			result:
				| number
				| {
						numberAffected: number;
						insertedId?: T['_id'];
				  },
		) => void,
	) {
		const callback = !_callback && typeof _options === 'function' ? _options : _callback;
		const options = typeof _options === 'object' && _options !== null ? _options : {};

		return this.updateAsync(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	private async _eachPossiblyMatchingDocAsync(selector: Filter<T>, fn: (doc: T, id: T['_id']) => Promise<boolean>) {
		const specificIds = this._idsMatchedBySelector(selector);

		if (specificIds) {
			for await (const id of specificIds) {
				const doc = this.store.getState().records.get(id);

				if (doc && (await fn(doc, id)) === false) {
					break;
				}
			}
		} else {
			for await (const doc of this.store.getState().records.values()) {
				if ((await fn(doc, doc._id)) === false) {
					break;
				}
			}
		}
	}

	private _eachPossiblyMatchingDoc(selector: Filter<T>, fn: (doc: T, id: T['_id']) => void | boolean) {
		const specificIds = this._idsMatchedBySelector(selector);

		if (specificIds) {
			for (const id of specificIds) {
				const doc = this.store.getState().records.get(id);

				if (doc && fn(doc, id) === false) {
					break;
				}
			}
		} else {
			for (const doc of this.store.getState().records.values()) {
				if (fn(doc, doc._id) === false) {
					break;
				}
			}
		}
	}

	private _getMatchedDocAndModify(doc: T) {
		const matchedBefore = new Map<Query<T>, boolean>();

		for (const query of this.queries) {
			if (query.dirty) continue;

			if (query.ordered) {
				matchedBefore.set(query, query.predicate(doc));
			} else {
				matchedBefore.set(query, query.results.has(doc._id));
			}
		}

		return matchedBefore;
	}

	private _modifyAndNotify(doc: T, mod: UpdateFilter<T>, arrayIndices: ArrayIndices | undefined) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		const updater = new Updater(clone(mod));
		doc = updater.modify(doc, { arrayIndices });
		this.store.setState((state) => {
			const records = new Map(state.records);
			records.set(doc._id, doc);
			return { records };
		});

		const recomputeQueries = new Set<Query<T>>();

		for (const query of this.queries) {
			if (query.dirty) continue;

			const after = query.predicate(doc);
			const before = matchedBefore.get(query);

			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) {
					recomputeQueries.add(query);
				}
			} else if (before && !after) {
				this._removeFromResults(query, doc);
			} else if (!before && after) {
				this._insertInResults(query, doc);
			} else if (before && after) {
				this._updateInResults(query, doc, oldDoc);
			}
		}
		return recomputeQueries;
	}

	private async _modifyAndNotifyAsync(doc: T, mod: UpdateFilter<T>, arrayIndices: ArrayIndices | undefined) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		const updater = new Updater(clone(mod));
		doc = updater.modify(doc, { arrayIndices });
		this.store.setState((state) => {
			const records = new Map(state.records);
			records.set(doc._id, doc);
			return { records };
		});

		const recomputeQueries = new Set<Query<T>>();
		for await (const query of this.queries) {
			if (query.dirty) continue;

			const after = query.predicate(doc);
			const before = matchedBefore.get(query);

			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) {
					recomputeQueries.add(query);
				}
			} else if (before && !after) {
				await this._removeFromResultsAsync(query, doc);
			} else if (!before && after) {
				await this._insertInResultsAsync(query, doc);
			} else if (before && after) {
				await this._updateInResultsAsync(query, doc, oldDoc);
			}
		}
		return recomputeQueries;
	}

	recomputeQuery(query: Query<T>) {
		this._recomputeResults(query);
	}

	private _recomputeResults(query: Query<T>, oldResults?: IdMap<T['_id'], T> | T[] | null) {
		if (this.paused) {
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

	private _saveOriginal(id: T['_id'], doc: T | undefined) {
		if (!this.savedOriginals) {
			return;
		}

		if (this.savedOriginals.has(id)) {
			return;
		}

		this.savedOriginals.set(id, clone(doc));
	}

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

	private _createUpsertDocument(selector: Filter<T>, modifier: UpdateFilter<T>): T {
		const updater = new Updater(modifier);
		return updater.createUpsertDocument(selector);
	}

	private _findInOrderedResults(query: Query<T>, doc: T): number {
		if (!query.ordered) {
			throw new MinimongoError("Can't call _findInOrderedResults on unordered query");
		}

		for (let i = 0; i < query.results.length; i++) {
			if (query.results[i]._id === doc._id) {
				return i;
			}
		}

		throw new MinimongoError('object missing from query');
	}

	private _idsMatchedBySelector(selector: Filter<T> | T['_id']): readonly T['_id'][] | null {
		if (_selectorIsId(selector)) {
			return [selector];
		}

		if (!selector) {
			return null;
		}

		if ('_id' in selector) {
			if (_selectorIsId(selector._id)) {
				return [selector._id];
			}

			if (
				selector._id &&
				Array.isArray((selector._id as FilterOperators<T['_id']>).$in) &&
				(selector._id as FilterOperators<T['_id']>).$in?.length &&
				(selector._id as FilterOperators<T['_id']>).$in?.every(_selectorIsId)
			) {
				return (selector._id as FilterOperators<T['_id']>).$in!;
			}

			return null;
		}

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

	private _insertInSortedList(cmp: (a: T, b: T) => number, array: T[], value: T) {
		if (array.length === 0) {
			array.push(value);
			return 0;
		}

		const i = this._binarySearch(cmp, array, value);

		array.splice(i, 0, value);

		return i;
	}

	private _removeFromResults(query: Query<T>, doc: T) {
		if (query.ordered) {
			const i = this._findInOrderedResults(query, doc);

			query.removed(doc._id);
			query.results.splice(i, 1);
		} else {
			const id = doc._id;

			query.removed(doc._id);
			query.results.remove(id);
		}
	}

	private async _removeFromResultsAsync(query: Query<T>, doc: T) {
		if (query.ordered) {
			const i = this._findInOrderedResults(query, doc);

			await query.removed(doc._id);
			query.results.splice(i, 1);
		} else {
			const id = doc._id;

			await query.removed(doc._id);
			query.results.remove(id);
		}
	}

	private _updateInResults(query: Query<T>, doc: T, oldDoc: T) {
		if (doc._id !== oldDoc._id) {
			throw new MinimongoError("Can't change a doc's _id while updating");
		}

		const { projectionFn } = query;
		const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(oldDoc));

		if (!query.ordered) {
			if (Object.keys(changedFields).length) {
				query.changed(doc._id, changedFields);
				query.results.set(doc._id, doc);
			}

			return;
		}

		const oldIdx = this._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			query.changed(doc._id, changedFields);
		}

		if (!query.comparator) {
			return;
		}

		query.results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(query.comparator, query.results, doc);

		if (oldIdx !== newIdx) {
			const next = query.results[newIdx + 1]?._id ?? null;

			if (query.movedBefore) query.movedBefore(doc._id, next);
		}
	}

	private async _updateInResultsAsync(query: Query<T>, doc: T, oldDoc: T) {
		if (doc._id !== oldDoc._id) {
			throw new MinimongoError("Can't change a doc's _id while updating");
		}

		const { projectionFn } = query;
		const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(oldDoc));

		if (!query.ordered) {
			if (Object.keys(changedFields).length) {
				await query.changed(doc._id, changedFields);
				query.results.set(doc._id, doc);
			}

			return;
		}

		const oldIdx = this._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			await query.changed(doc._id, changedFields);
		}

		if (!query.comparator) {
			return;
		}

		query.results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(query.comparator, query.results, doc);

		if (oldIdx !== newIdx) {
			const next = query.results[newIdx + 1]?._id ?? null;

			if (query.movedBefore) await query.movedBefore(doc._id, next);
		}
	}
}
