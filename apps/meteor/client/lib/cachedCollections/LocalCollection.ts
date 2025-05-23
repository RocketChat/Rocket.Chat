import { Meteor } from 'meteor/meteor';
import type { CountDocumentsOptions, Filter, UpdateFilter } from 'mongodb';
import type { StoreApi, UseBoundStore } from 'zustand';

import { Cursor } from './Cursor';
import { DiffSequence } from './DiffSequence';
import type { IDocumentMapStore } from './IDocumentMapStore';
import type { IdMap } from './IdMap';
import { Matcher } from './Matcher';
import type { Options } from './MinimongoCollection';
import { MinimongoError } from './MinimongoError';
import type { Query } from './Query';
import { Sorter } from './Sorter';
import { SynchronousQueue } from './SynchronousQueue';
import {
	hasOwn,
	isIndexable,
	isNumericKey,
	isOperatorObject,
	populateDocumentWithQueryFields,
	_f,
	_isPlainObject,
	_selectorIsId,
	clone,
} from './common';

/** @deprecated internal use only */
export class LocalCollection<T extends { _id: string }> {
	readonly observeQueue = new SynchronousQueue();

	readonly queries = new Set<Query<T>>();

	private savedOriginals: Map<T['_id'], T | undefined> | null = null;

	paused = false;

	constructor(public store: UseBoundStore<StoreApi<IDocumentMapStore<T>>>) {}

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

		if (this.store.getState().has(doc._id)) {
			throw new MinimongoError(`Duplicate _id '${doc._id}'`);
		}

		this._saveOriginal(doc._id, undefined);
		this.store.getState().store(doc, { recomputeQueries: false });

		return doc._id;
	}

	insert(doc: T, callback?: (error: Error | null, id: T['_id']) => void) {
		doc = clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = new Set<Query<T>>();

		for (const query of this.queries) {
			if (query.dirty) continue;

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
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

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
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
			if (!query.sorter) {
				query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = this._insertInSortedList(query.sorter.getComparator(), query.results, doc);

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
			if (!query.sorter) {
				await query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = this._insertInSortedList(query.sorter.getComparator(), query.results, doc);

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
		const result = this.store.getState().records.length;

		this.store.setState({ records: [] });

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
		const matcher = new Matcher(selector);
		const remove = new Set<T>();

		this._eachPossiblyMatchingDocSync(selector, (doc) => {
			if (matcher.documentMatches(doc).result) {
				remove.add(doc);
			}
		});

		const queriesToRecompute = new Set<Query<T>>();
		const queryRemove = new Set<{ doc: T; query: Query<T> }>();

		for (const removeDoc of remove) {
			for (const query of this.queries) {
				if (query.dirty) continue;

				if (query.matcher.documentMatches(removeDoc).result) {
					if (query.cursor.skip || query.cursor.limit) {
						queriesToRecompute.add(query);
					} else {
						queryRemove.add({ doc: removeDoc, query });
					}
				}
			}

			this._saveOriginal(removeDoc._id, removeDoc);
			this.store.getState().delete(removeDoc, { recomputeQueries: false });
		}

		return { queriesToRecompute, queryRemove, count: remove.size };
	}

	remove(selector: Filter<T>, callback?: (error: Error | null, result: number) => void) {
		if (this.paused && !this.savedOriginals && JSON.stringify(selector) === '{}') {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, count } = this.prepareRemove(selector);

		for (const remove of queryRemove) {
			this._removeFromResultsSync(remove.query, remove.doc);
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

		let recomputeQueries = new Set<Query<T>>();

		let updateCount = 0;

		await this._eachPossiblyMatchingDocAsync(selector, async (doc, id) => {
			const queryResult = matcher.documentMatches(doc);

			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQueries = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!(options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).multi) {
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
			callback,
		});
	}

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

		let recomputeQueries = new Set<Query<T>>();

		let updateCount = 0;

		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			const queryResult = matcher.documentMatches(doc);

			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQueries = this._modifyAndNotifySync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!(options as { multi?: boolean; upsert?: boolean; insertedId?: T['_id']; _returnObject?: boolean }).multi) {
					return false;
				}
			}

			return true;
		});

		for (const query of recomputeQueries) {
			this._recomputeResults(query, queriesToOriginalResults.get(query));
		}

		this.observeQueue.drain();

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
			callback,
			selector,
			mod,
		});
	}

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

	private async _eachPossiblyMatchingDocAsync(selector: Filter<T>, fn: (doc: T, id: T['_id']) => Promise<boolean>) {
		const specificIds = this._idsMatchedBySelector(selector);

		if (specificIds) {
			for await (const id of specificIds) {
				const doc = this.store.getState().get(id);

				if (doc && (await fn(doc, id)) === false) {
					break;
				}
			}
		} else {
			for await (const doc of this.store.getState().records) {
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
				const doc = this.store.getState().get(id);

				if (doc && fn(doc, id) === false) {
					break;
				}
			}
		} else {
			for (const doc of this.store.getState().records) {
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
				matchedBefore.set(query, query.matcher.documentMatches(doc).result);
			} else {
				matchedBefore.set(query, query.results.has(doc._id));
			}
		}

		return matchedBefore;
	}

	private _modifyAndNotifySync(doc: T, mod: UpdateFilter<T>, arrayIndices: (number | 'x')[] | undefined) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		doc = this._modify(doc, mod, { arrayIndices });
		this.store.getState().store(doc, { recomputeQueries: false });

		const recomputeQueries = new Set<Query<T>>();

		for (const query of this.queries) {
			if (query.dirty) continue;

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matchedBefore.get(query);

			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) {
					recomputeQueries.add(query);
				}
			} else if (before && !after) {
				this._removeFromResultsSync(query, doc);
			} else if (!before && after) {
				this._insertInResults(query, doc);
			} else if (before && after) {
				this._updateInResultsSync(query, doc, oldDoc);
			}
		}
		return recomputeQueries;
	}

	private async _modifyAndNotifyAsync(doc: T, mod: UpdateFilter<T>, arrayIndices: (number | 'x')[] | undefined) {
		const matchedBefore = this._getMatchedDocAndModify(doc);

		const oldDoc = clone(doc);
		doc = this._modify(doc, mod, { arrayIndices });
		this.store.getState().store(doc, { recomputeQueries: false });

		const recomputeQueries = new Set<Query<T>>();
		for await (const query of this.queries) {
			if (query.dirty) continue;

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
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

	recomputeAllResults() {
		for (const query of this.queries) {
			this._recomputeResults(query);
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

	private _createUpsertDocument(selector: Filter<T>, modifier: UpdateFilter<T>) {
		const selectorDocument = populateDocumentWithQueryFields(selector);
		const isModify = this._isModificationMod(modifier);

		let newDoc: Partial<T> = {};

		if (selectorDocument._id) {
			newDoc._id = selectorDocument._id;
			delete selectorDocument._id;
		}

		newDoc = this._modify(newDoc, { $set: selectorDocument });
		newDoc = this._modify(newDoc, modifier, { isInsert: true });

		if (isModify) {
			return newDoc as T;
		}

		const replacement = Object.assign({}, modifier);
		if (newDoc._id) {
			replacement._id = newDoc._id;
		}

		return replacement as T;
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

	private _idsMatchedBySelector(selector: Filter<T> | T['_id']): T['_id'][] | null {
		if (_selectorIsId(selector)) {
			return [selector];
		}

		if (!selector) {
			return null;
		}

		if (hasOwn.call(selector, '_id')) {
			if (_selectorIsId(selector._id)) {
				return [selector._id];
			}

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

	private _isModificationMod(mod: UpdateFilter<T> | T) {
		let isModify = false;
		let isReplace = false;

		for (const key of Object.keys(mod)) {
			if (key.slice(0, 1) === '$') {
				isModify = true;
			} else {
				isReplace = true;
			}
		}

		if (isModify && isReplace) {
			throw new MinimongoError('Update parameter cannot have both modifier and non-modifier fields.');
		}

		return isModify;
	}

	private _modify<U extends Partial<T>>(
		doc: U,
		modifier: UpdateFilter<T>,
		options: { isInsert?: boolean; arrayIndices?: (number | 'x')[] } = {},
	) {
		if (!_isPlainObject(modifier)) {
			throw new MinimongoError('Modifier must be an object');
		}

		modifier = clone(modifier);

		const isModifier = isOperatorObject(modifier);
		const newDoc = isModifier ? clone(doc) : (modifier as T);

		if (isModifier) {
			for (const operator of Object.keys(modifier)) {
				const setOnInsert = options.isInsert && operator === '$setOnInsert';
				const modFunc = MODIFIERS[(setOnInsert ? '$set' : operator) as keyof typeof MODIFIERS];
				const operand = modifier[operator];

				if (!modFunc) {
					throw new MinimongoError(`Invalid modifier specified ${operator}`);
				}

				for (const keypath of Object.keys(operand)) {
					const arg = operand[keypath];

					if (keypath === '') {
						throw new MinimongoError('An empty update path is not valid.');
					}

					const keyparts = keypath.split('.');

					if (!keyparts.every(Boolean)) {
						throw new MinimongoError(`The update path '${keypath}' contains an empty field name, which is not allowed.`);
					}

					const target = findModTarget(newDoc, keyparts, {
						arrayIndices: options.arrayIndices,
						forbidArray: operator === '$rename',
						noCreate: NO_CREATE_MODIFIERS[operator as keyof typeof NO_CREATE_MODIFIERS],
					});

					modFunc(target as any, keyparts.pop()!, arg, keypath, newDoc);
				}
			}

			if (doc._id && doc._id !== newDoc._id) {
				throw new MinimongoError(
					`After applying the update to the document {_id: "${doc._id}", ...},` +
						" the (immutable) field '_id' was found to have been altered to " +
						`_id: "${newDoc._id}"`,
				);
			}
		} else {
			if (doc._id && modifier._id && doc._id !== modifier._id) {
				throw new MinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${modifier._id}"}`);
			}

			assertHasValidFieldNames(modifier);
		}

		return Object.freeze(newDoc);
	}

	private _removeFromResultsSync(query: Query<T>, doc: T) {
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

	private _updateInResultsSync(query: Query<T>, doc: T, oldDoc: T) {
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

		if (!query.sorter) {
			return;
		}

		query.results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(query.sorter.getComparator(), query.results, doc);

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

		if (!query.sorter) {
			return;
		}

		query.results.splice(oldIdx, 1);

		const newIdx = this._insertInSortedList(query.sorter.getComparator(), query.results, doc);

		if (oldIdx !== newIdx) {
			const next = query.results[newIdx + 1]?._id ?? null;

			if (query.movedBefore) await query.movedBefore(doc._id, next);
		}
	}
}

const MODIFIERS = {
	$currentDate(target: Record<string, Date>, field: string, arg: any) {
		if (typeof arg === 'object' && hasOwn.call(arg, '$type')) {
			if (arg.$type !== 'date') {
				throw new MinimongoError('Minimongo does currently only support the date type in $currentDate modifiers', { field });
			}
		} else if (arg !== true) {
			throw new MinimongoError('Invalid $currentDate modifier', { field });
		}

		target[field] = new Date();
	},
	$inc(target: Record<string, number>, field: string, arg: any) {
		if (typeof arg !== 'number') {
			throw new MinimongoError('Modifier $inc allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw new MinimongoError('Cannot apply $inc modifier to non-number', { field });
			}

			target[field] += arg;
		} else {
			target[field] = arg;
		}
	},
	$min(target: Record<string, number>, field: string, arg: any) {
		if (typeof arg !== 'number') {
			throw new MinimongoError('Modifier $min allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw new MinimongoError('Cannot apply $min modifier to non-number', { field });
			}

			if (target[field] > arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},
	$max(target: Record<string, number>, field: string, arg: any) {
		if (typeof arg !== 'number') {
			throw new MinimongoError('Modifier $max allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw new MinimongoError('Cannot apply $max modifier to non-number', { field });
			}

			if (target[field] < arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},
	$mul(target: Record<string, number>, field: string, arg: any) {
		if (typeof arg !== 'number') {
			throw new MinimongoError('Modifier $mul allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw new MinimongoError('Cannot apply $mul modifier to non-number', { field });
			}

			target[field] *= arg;
		} else {
			target[field] = 0;
		}
	},
	$rename(target: Record<string, object>, field: string, arg: any, keypath: any, doc: any) {
		if (keypath === arg) {
			throw new MinimongoError('$rename source must differ from target', { field });
		}

		if (target === null) {
			throw new MinimongoError('$rename source field invalid', { field });
		}

		if (typeof arg !== 'string') {
			throw new MinimongoError('$rename target must be a string', { field });
		}

		if (arg.includes('\0')) {
			throw new MinimongoError("The 'to' field for $rename cannot contain an embedded null byte", { field });
		}

		if (target === undefined) {
			return;
		}

		const object = target[field];

		delete target[field];

		const keyparts = arg.split('.');
		const target2 = findModTarget(doc, keyparts, { forbidArray: true });

		if (!target2) {
			throw new MinimongoError('$rename target field invalid', { field });
		}

		target2[keyparts.pop() as string] = object;
	},
	$set(target: Record<string, unknown>, field: string, arg: any) {
		if (target !== Object(target)) {
			const error = new MinimongoError('Cannot set property on non-object field', { field });
			error.setPropertyError = true;
			throw error;
		}

		if (target === null) {
			const error = new MinimongoError('Cannot set property on null', { field });
			error.setPropertyError = true;
			throw error;
		}

		assertHasValidFieldNames(arg);

		target[field] = arg;
	},
	$setOnInsert() {
		throw new MinimongoError('It should have been converted to $set in _modify');
	},
	$unset(target: Record<string, unknown>, field: string) {
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
	$push(target: Record<string, { _id: string }[]>, field: string, arg: any) {
		if (target[field] === undefined) {
			target[field] = [];
		}

		if (!Array.isArray(target[field])) {
			throw new MinimongoError('Cannot apply $push modifier to non-array', { field });
		}

		if (!arg?.$each) {
			assertHasValidFieldNames(arg);

			target[field].push(arg);

			return;
		}

		const toPush = arg.$each;
		if (!Array.isArray(toPush)) {
			throw new MinimongoError('$each must be an array', { field });
		}

		assertHasValidFieldNames(toPush);

		let position = undefined;
		if ('$position' in arg) {
			if (typeof arg.$position !== 'number') {
				throw new MinimongoError('$position must be a numeric value', { field });
			}

			if (arg.$position < 0) {
				throw new MinimongoError('$position in $push must be zero or positive', { field });
			}

			position = arg.$position;
		}

		let slice = undefined;
		if ('$slice' in arg) {
			if (typeof arg.$slice !== 'number') {
				throw new MinimongoError('$slice must be a numeric value', { field });
			}

			slice = arg.$slice;
		}

		let sortFunction = undefined;
		if (arg.$sort) {
			if (slice === undefined) {
				throw new MinimongoError('$sort requires $slice to be present', { field });
			}

			sortFunction = new Sorter(arg.$sort).getComparator();

			for (const element of toPush) {
				if (_f._type(element) !== 3) {
					throw new MinimongoError('$push like modifiers using $sort require all elements to be objects', { field });
				}
			}
		}

		if (position === undefined) {
			for (const element of toPush) {
				target[field].push(element);
			}
		} else {
			const spliceArguments = [position, 0];

			for (const element of toPush) {
				spliceArguments.push(element);
			}

			target[field].splice(...(spliceArguments as Parameters<typeof Array.prototype.splice>));
		}

		if (sortFunction) {
			target[field].sort(sortFunction);
		}

		if (slice !== undefined) {
			if (slice === 0) {
				target[field] = [];
			} else if (slice < 0) {
				target[field] = target[field].slice(slice);
			} else {
				target[field] = target[field].slice(0, slice);
			}
		}
	},
	$pushAll(target: Record<string, unknown[]>, field: string, arg: any) {
		if (!(typeof arg === 'object' && Array.isArray(arg))) {
			throw new MinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
		}

		assertHasValidFieldNames(arg);

		const toPush = target[field];

		if (toPush === undefined) {
			target[field] = arg;
		} else if (!Array.isArray(toPush)) {
			throw new MinimongoError('Cannot apply $pushAll modifier to non-array', { field });
		} else {
			toPush.push(...arg);
		}
	},
	$addToSet(target: Record<string, unknown[]>, field: string, arg: any) {
		let isEach = false;

		if (typeof arg === 'object') {
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
			throw new MinimongoError('Cannot apply $addToSet modifier to non-array', { field });
		} else {
			for (const value of values) {
				if (toAdd.some((element) => _f._equal(value, element))) {
					continue;
				}

				toAdd.push(value);
			}
		}
	},
	$pop(target: Record<string, unknown[]>, field: string, arg: any) {
		if (target === undefined) {
			return;
		}

		const toPop = target[field];

		if (toPop === undefined) {
			return;
		}

		if (!Array.isArray(toPop)) {
			throw new MinimongoError('Cannot apply $pop modifier to non-array', { field });
		}

		if (typeof arg === 'number' && arg < 0) {
			toPop.splice(0, 1);
		} else {
			toPop.pop();
		}
	},
	$pull(target: Record<string, { _id: string }[]>, field: string, arg: any) {
		if (target === undefined) {
			return;
		}

		const toPull = target[field];
		if (toPull === undefined) {
			return;
		}

		if (!Array.isArray(toPull)) {
			throw new MinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		let out;
		if (arg != null && typeof arg === 'object' && !Array.isArray(arg)) {
			const matcher = new Matcher(arg);

			out = toPull.filter((element) => !matcher.documentMatches(element).result);
		} else {
			out = toPull.filter((element) => !_f._equal(element, arg));
		}

		target[field] = out;
	},
	$pullAll(target: Record<string, unknown[]>, field: string, arg: any) {
		if (!(typeof arg === 'object' && Array.isArray(arg))) {
			throw new MinimongoError('Modifier $pushAll/pullAll allowed for arrays only', { field });
		}

		if (target === undefined) {
			return;
		}

		const toPull = target[field];

		if (toPull === undefined) {
			return;
		}

		if (!Array.isArray(toPull)) {
			throw new MinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		target[field] = toPull.filter((object) => !arg.some((element) => _f._equal(object, element)));
	},
	$bit(_target: unknown, field: string) {
		throw new MinimongoError('$bit is not supported', { field });
	},
	$v(_target: unknown, field: string) {
		throw new MinimongoError('$v is not supported', { field });
	},
};

const NO_CREATE_MODIFIERS = {
	$pop: true,
	$pull: true,
	$pullAll: true,
	$rename: true,
	$unset: true,
};

const invalidCharMsg = {
	'$': "start with '$'",
	'.': "contain '.'",
	'\0': 'contain null bytes',
};

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
		throw new MinimongoError(`Key ${key} must not ${invalidCharMsg[match[0] as keyof typeof invalidCharMsg]}`);
	}
}

function findModTarget(
	doc: any,
	keyparts: (number | string)[],
	options: {
		noCreate?: boolean;
		forbidArray?: boolean;
		arrayIndices?: (number | 'x')[];
	} = {},
) {
	let usedArrayIndex = false;

	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart: string | number = keyparts[i];

		if (!isIndexable(doc)) {
			if (options.noCreate) {
				return undefined;
			}

			const error = new MinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
			error.setPropertyError = true;
			throw error;
		}

		if (Array.isArray(doc)) {
			if (options.forbidArray) {
				return null;
			}

			if (keypart === '$') {
				if (usedArrayIndex) {
					throw new MinimongoError("Too many positional (i.e. '$') elements");
				}

				if (!options.arrayIndices?.length) {
					throw new MinimongoError('The positional operator did not find the match needed from the query');
				}

				keypart = options.arrayIndices[0];
				usedArrayIndex = true;
			} else if (isNumericKey(keypart as string)) {
				keypart = parseInt(keypart as string);
			} else {
				if (options.noCreate) {
					return undefined;
				}

				throw new MinimongoError(`can't append to array using string field name [${keypart}]`);
			}

			if (last) {
				keyparts[i] = keypart;
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
					throw new MinimongoError(`can't modify field '${keyparts[i + 1]}' of list value ${JSON.stringify(doc[keypart as number])}`);
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

	throw new MinimongoError('Should not reach here');
}
