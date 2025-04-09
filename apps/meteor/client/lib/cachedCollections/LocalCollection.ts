import { EJSON } from 'meteor/ejson';
import { Meteor } from 'meteor/meteor';

import { Cursor } from './Cursor';
import { DiffSequence } from './DiffSequence';
import { IdMap } from './IdMap';
import { Matcher } from './Matcher';
import { ObserveHandle } from './ObserveHandle';
import { OrderedDict } from './OrderedDict';
import { Sorter } from './Sorter';
import {
	hasOwn,
	isIndexable,
	isNumericKey,
	isOperatorObject,
	createMinimongoError,
	populateDocumentWithQueryFields,
	projectionDetails,
} from './common';

declare module 'meteor/meteor' {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace Meteor {
		function _isPromise(obj: any): obj is Promise<any>;
		function _runFresh(func: () => void): void;
		class _SynchronousQueue {
			queueTask(arg0: () => void): any;

			drain(): any;
		}
	}
}

// XXX type checking on selectors (graceful error if malformed)

// LocalCollection: a set of documents that supports queries and modifiers.
export class LocalCollection {
	_docs: InstanceType<typeof LocalCollection._IdMap>;

	_observeQueue: Meteor._SynchronousQueue;

	next_qid: number;

	queries: Record<string, any>;

	_savedOriginals: InstanceType<typeof LocalCollection._IdMap> | null;

	paused: boolean;

	constructor() {
		// _id -> document (also containing id)
		this._docs = new LocalCollection._IdMap();

		this._observeQueue = new Meteor._SynchronousQueue();

		this.next_qid = 1; // live query id generator

		// qid -> live query object. keys:
		//  ordered: bool. ordered queries have addedBefore/movedBefore callbacks.
		//  results: array (ordered) or object (unordered) of current results
		//    (aliased with this._docs!)
		//  resultsSnapshot: snapshot of results. null if not paused.
		//  cursor: Cursor object for the query.
		//  selector, sorter, (callbacks): functions
		this.queries = Object.create(null);

		// null if not saving originals; an IdMap from id to original document value
		// if saving originals. See comments before saveOriginals().
		this._savedOriginals = null;

		// True when observers are paused and we should not send callbacks.
		this.paused = false;
	}

	countDocuments(selector: any, options: any) {
		return this.find(selector ?? {}, options).countAsync();
	}

	estimatedDocumentCount(options: any) {
		return this.find({}, options).countAsync();
	}

	// options may include sort, skip, limit, reactive
	// sort may be any of these forms:
	//     {a: 1, b: -1}
	//     [["a", "asc"], ["b", "desc"]]
	//     ["a", ["b", "desc"]]
	//   (in the first form you're beholden to key enumeration order in
	//   your javascript VM)
	//
	// reactive: if given, and false, don't register with Tracker (default
	// is true)
	//
	// XXX possibly should support retrieving a subset of fields? and
	// have it be a hint (ignored on the client, when not copying the
	// doc?)
	//
	// XXX sort does not yet support subkeys ('a.b') .. fix that!
	// XXX add one more sort form: "key"
	// XXX tests
	find(selector: any, options: any) {
		// default syntax for everything is to omit the selector argument.
		// but if selector is explicitly passed in as false or undefined, we
		// want a selector that matches nothing.
		if (arguments.length === 0) {
			selector = {};
		}

		return new LocalCollection.Cursor(this, selector, options);
	}

	findOne(selector: any, options: any = {}) {
		if (arguments.length === 0) {
			selector = {};
		}

		// NOTE: by setting limit 1 here, we end up using very inefficient
		// code that recomputes the whole query on each update. The upside is
		// that when you reactively depend on a findOne you only get
		// invalidated when the found object changes, not any object in the
		// collection. Most findOne will be by id, which has a fast path, so
		// this might not be a big deal. In most cases, invalidation causes
		// the called to re-query anyway, so this should be a net performance
		// improvement.
		options.limit = 1;

		return this.find(selector, options).fetch()[0];
	}

	async findOneAsync(selector: any, options: any = {}) {
		if (arguments.length === 0) {
			selector = {};
		}
		options.limit = 1;
		return (await this.find(selector, options).fetchAsync())[0];
	}

	prepareInsert(doc: any) {
		assertHasValidFieldNames(doc);

		// if you really want to use ObjectIDs, set this global.
		// Mongo.Collection specifies its own ids and does not use this code.
		if (!hasOwn.call(doc, '_id')) {
			doc._id = Random.id();
		}

		const id = doc._id;

		if (this._docs.has(id)) {
			throw createMinimongoError(`Duplicate _id '${id}'`);
		}

		this._saveOriginal(id, undefined);
		this._docs.set(id, doc);

		return id;
	}

	// XXX possibly enforce that 'undefined' does not appear (we assume
	// this in our handling of null and $exists)
	insert(doc: any, callback?: any) {
		doc = EJSON.clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = [];

		// trigger live queries that match
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.distances && matchResult.distance !== undefined) {
					query.distances.set(id, matchResult.distance);
				}

				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.push(qid);
				} else {
					LocalCollection._insertInResultsSync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) {
				this._recomputeResults(this.queries[qid]);
			}
		});

		this._observeQueue.drain();
		if (callback) {
			Meteor.defer(() => {
				callback(null, id);
			});
		}

		return id;
	}

	async insertAsync(doc: any, callback?: any) {
		doc = EJSON.clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = [];

		// trigger live queries that match
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.distances && matchResult.distance !== undefined) {
					query.distances.set(id, matchResult.distance);
				}

				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.push(qid);
				} else {
					// eslint-disable-next-line no-await-in-loop
					await LocalCollection._insertInResultsAsync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) {
				this._recomputeResults(this.queries[qid]);
			}
		});

		await this._observeQueue.drain();
		if (callback) {
			Meteor.defer(() => {
				callback(null, id);
			});
		}

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
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			query.resultsSnapshot = EJSON.clone(query.results);
		});
	}

	clearResultQueries(callback: any) {
		const result = this._docs.size();

		this._docs.clear();

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if (query.ordered) {
				query.results = [];
			} else {
				query.results.clear();
			}
		});

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	prepareRemove(selector: any) {
		const matcher = new Matcher(selector);
		const remove: any[] = [];

		this._eachPossiblyMatchingDocSync(selector, (doc: any, id: any) => {
			if (matcher.documentMatches(doc).result) {
				remove.push(id);
			}
		});

		const queriesToRecompute: any[] = [];
		const queryRemove: any[] = [];

		for (let i = 0; i < remove.length; i++) {
			const removeId = remove[i];
			const removeDoc = this._docs.get(removeId);

			Object.keys(this.queries).forEach((qid) => {
				const query = this.queries[qid];

				if (query.dirty) {
					return;
				}

				if (query.matcher.documentMatches(removeDoc).result) {
					if (query.cursor.skip || query.cursor.limit) {
						queriesToRecompute.push(qid);
					} else {
						queryRemove.push({ qid, doc: removeDoc });
					}
				}
			});

			this._saveOriginal(removeId, removeDoc);
			this._docs.remove(removeId);
		}

		return { queriesToRecompute, queryRemove, remove };
	}

	remove(selector: any, callback: any) {
		// Easy special case: if we're not calling observeChanges callbacks and
		// we're not saving originals and we got asked to remove everything, then
		// just empty everything directly.
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);

		// run live query callbacks _after_ we've removed the documents.
		queryRemove.forEach((remove) => {
			const query = this.queries[remove.qid];

			if (query) {
				query.distances && query.distances.remove(remove.doc._id);
				LocalCollection._removeFromResultsSync(query, remove.doc);
			}
		});

		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query);
			}
		});

		this._observeQueue.drain();

		const result = remove.length;

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	async removeAsync(selector: any, callback: any) {
		// Easy special case: if we're not calling observeChanges callbacks and
		// we're not saving originals and we got asked to remove everything, then
		// just empty everything directly.
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);

		// run live query callbacks _after_ we've removed the documents.
		for (const remove of queryRemove) {
			const query = this.queries[remove.qid];

			if (query) {
				query.distances && query.distances.remove(remove.doc._id);
				// eslint-disable-next-line no-await-in-loop
				await LocalCollection._removeFromResultsAsync(query, remove.doc);
			}
		}
		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query);
			}
		});

		await this._observeQueue.drain();

		const result = remove.length;

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	// Resume the observers. Observers immediately receive change
	// notifications to bring them to the current state of the
	// database. Note that this is not just replaying all the changes that
	// happened during the pause, it is a smarter 'coalesced' diff.
	_resumeObservers() {
		// No-op if not paused.
		if (!this.paused) {
			return;
		}

		// Unset the 'paused' flag. Make sure to do this first, otherwise
		// observer methods won't actually fire when we trigger them.
		this.paused = false;

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if (query.dirty) {
				query.dirty = false;

				// re-compute results will perform `LocalCollection._diffQueryChanges`
				// automatically.
				this._recomputeResults(query, query.resultsSnapshot);
			} else {
				// Diff the current results against the snapshot and send to observers.
				// pass the query object for its observer callbacks.
				LocalCollection._diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, { projectionFn: query.projectionFn });
			}

			query.resultsSnapshot = null;
		});
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

		this._savedOriginals = new LocalCollection._IdMap();
	}

	prepareUpdate(selector: any) {
		// Save the original results of any query that we might need to
		// _recomputeResults on, because _modifyAndNotify will mutate the objects in
		// it. (We don't need to save the original results of paused queries because
		// they already have a resultsSnapshot and we won't be diffing in
		// _recomputeResults.)
		const qidToOriginalResults: Record<string, any> = {};

		// We should only clone each document once, even if it appears in multiple
		// queries
		const docMap = new LocalCollection._IdMap();
		const idsMatched = LocalCollection._idsMatchedBySelector(selector);

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
				// Catch the case of a reactive `count()` on a cursor with skip
				// or limit, which registers an unordered observe. This is a
				// pretty rare case, so we just clone the entire result set with
				// no optimizations for documents that appear in these result
				// sets and other queries.
				if (query.results instanceof LocalCollection._IdMap) {
					qidToOriginalResults[qid] = query.results.clone();
					return;
				}

				if (!(query.results instanceof Array)) {
					throw new Error('Assertion failed: query.results not an array');
				}

				// Clones a document to be stored in `qidToOriginalResults`
				// because it may be modified before the new and old result sets
				// are diffed. But if we know exactly which document IDs we're
				// going to modify, then we only need to clone those.
				const memoizedCloneIfNeeded = (doc: any) => {
					if (docMap.has(doc._id)) {
						return docMap.get(doc._id);
					}

					const docToMemoize = idsMatched && !idsMatched.some((id) => EJSON.equals(id, doc._id)) ? doc : EJSON.clone(doc);

					docMap.set(doc._id, docToMemoize);

					return docToMemoize;
				};

				qidToOriginalResults[qid] = query.results.map(memoizedCloneIfNeeded);
			}
		});

		return qidToOriginalResults;
	}

	finishUpdate({ options, updateCount, callback, insertedId }: any) {
		// Return the number of affected documents, or in the upsert case, an object
		// containing the number of affected docs and the id of the doc that was
		// inserted, if any.
		let result: any;
		if (options._returnObject) {
			result = { numberAffected: updateCount };

			if (insertedId !== undefined) {
				result.insertedId = insertedId;
			}
		} else {
			result = updateCount;
		}

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	// XXX atomicity: if multi is true, and one modification fails, do
	// we rollback the whole operation, or what?
	async updateAsync(selector: any, mod: any, options: any, callback: any) {
		if (!callback && options instanceof Function) {
			callback = options;
			options = null;
		}

		if (!options) {
			options = {};
		}

		const matcher = new Matcher(selector, true);

		const qidToOriginalResults = this.prepareUpdate(selector);

		let recomputeQids = {};

		let updateCount = 0;

		await this._eachPossiblyMatchingDocAsync(selector, async (doc: any, id: any) => {
			const queryResult: any = matcher.documentMatches(doc);

			if (queryResult.result) {
				// XXX Should we save the original even if mod ends up being a no-op?
				this._saveOriginal(id, doc);
				recomputeQids = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!options.multi) {
					return false; // break
				}
			}

			return true;
		});

		Object.keys(recomputeQids).forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query, qidToOriginalResults[qid]);
			}
		});

		await this._observeQueue.drain();

		// If we are doing an upsert, and we didn't modify any documents yet, then
		// it's time to do an insert. Figure out what document we are inserting, and
		// generate an id for it.
		let insertedId;
		if (updateCount === 0 && options.upsert) {
			const doc = LocalCollection._createUpsertDocument(selector, mod);
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

	// XXX atomicity: if multi is true, and one modification fails, do
	// we rollback the whole operation, or what?
	update(selector: any, mod: any, options: any, callback: any) {
		if (!callback && options instanceof Function) {
			callback = options;
			options = null;
		}

		if (!options) {
			options = {};
		}

		const matcher = new Matcher(selector, true);

		const qidToOriginalResults = this.prepareUpdate(selector);

		let recomputeQids = {};

		let updateCount = 0;

		this._eachPossiblyMatchingDocSync(selector, (doc: any, id: any) => {
			const queryResult: any = matcher.documentMatches(doc);

			if (queryResult.result) {
				// XXX Should we save the original even if mod ends up being a no-op?
				this._saveOriginal(id, doc);
				recomputeQids = this._modifyAndNotifySync(doc, mod, queryResult.arrayIndices);

				++updateCount;

				if (!options.multi) {
					return false; // break
				}
			}

			return true;
		});

		Object.keys(recomputeQids).forEach((qid) => {
			const query = this.queries[qid];
			if (query) {
				this._recomputeResults(query, qidToOriginalResults[qid]);
			}
		});

		this._observeQueue.drain();

		// If we are doing an upsert, and we didn't modify any documents yet, then
		// it's time to do an insert. Figure out what document we are inserting, and
		// generate an id for it.
		if (updateCount === 0 && options.upsert) {
			const doc = LocalCollection._createUpsertDocument(selector, mod);
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

	// A convenience wrapper on update. LocalCollection.upsert(sel, mod) is
	// equivalent to LocalCollection.update(sel, mod, {upsert: true,
	// _returnObject: true}).
	upsert(selector: any, mod: any, options: any, callback: any) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}

		return this.update(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	upsertAsync(selector: any, mod: any, options: any, callback: any) {
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
	async _eachPossiblyMatchingDocAsync(selector: any, fn: any) {
		const specificIds = LocalCollection._idsMatchedBySelector(selector);

		if (specificIds) {
			for (const id of specificIds) {
				const doc = this._docs.get(id);

				// eslint-disable-next-line no-await-in-loop
				if (doc && !(await fn(doc, id))) {
					break;
				}
			}
		} else {
			await this._docs.forEachAsync(fn);
		}
	}

	_eachPossiblyMatchingDocSync(selector: any, fn: any) {
		const specificIds = LocalCollection._idsMatchedBySelector(selector);

		if (specificIds) {
			for (const id of specificIds) {
				const doc = this._docs.get(id);

				if (doc && !fn(doc, id)) {
					break;
				}
			}
		} else {
			this._docs.forEach(fn);
		}
	}

	_getMatchedDocAndModify(doc: any, _mod: any, _arrayIndices: any) {
		const matchedBefore: any = {};

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if (query.dirty) {
				return;
			}

			if (query.ordered) {
				matchedBefore[qid] = query.matcher.documentMatches(doc).result;
			} else {
				// Because we don't support skip or limit (yet) in unordered queries, we
				// can just do a direct lookup.
				matchedBefore[qid] = query.results.has(doc._id);
			}
		});

		return matchedBefore;
	}

	_modifyAndNotifySync(doc: any, mod: any, arrayIndices: any) {
		const matchedBefore = this._getMatchedDocAndModify(doc, mod, arrayIndices);

		const oldDoc = EJSON.clone(doc);
		LocalCollection._modify(doc, mod, { arrayIndices });

		const recomputeQids: any = {};

		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matchedBefore[qid];

			if (after && query.distances && afterMatch.distance !== undefined) {
				query.distances.set(doc._id, afterMatch.distance);
			}

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
				LocalCollection._removeFromResultsSync(query, doc);
			} else if (!before && after) {
				LocalCollection._insertInResultsSync(query, doc);
			} else if (before && after) {
				LocalCollection._updateInResultsSync(query, doc, oldDoc);
			}
		}
		return recomputeQids;
	}

	async _modifyAndNotifyAsync(doc: any, mod: any, arrayIndices: any) {
		const matchedBefore = this._getMatchedDocAndModify(doc, mod, arrayIndices);

		const oldDoc = EJSON.clone(doc);
		LocalCollection._modify(doc, mod, { arrayIndices });

		const recomputeQids: any = {};
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matchedBefore[qid];

			if (after && query.distances && afterMatch.distance !== undefined) {
				query.distances.set(doc._id, afterMatch.distance);
			}

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
				await LocalCollection._removeFromResultsAsync(query, doc);
			} else if (!before && after) {
				// eslint-disable-next-line no-await-in-loop
				await LocalCollection._insertInResultsAsync(query, doc);
			} else if (before && after) {
				// eslint-disable-next-line no-await-in-loop
				await LocalCollection._updateInResultsAsync(query, doc, oldDoc);
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
	_recomputeResults(query: any, oldResults?: any) {
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

		if (query.distances) {
			query.distances.clear();
		}

		query.results = query.cursor._getRawObjects({
			distances: query.distances,
			ordered: query.ordered,
		});

		if (!this.paused) {
			LocalCollection._diffQueryChanges(query.ordered, oldResults, query.results, query, { projectionFn: query.projectionFn });
		}
	}

	_saveOriginal(id: any, doc: any) {
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

		this._savedOriginals.set(id, EJSON.clone(doc));
	}

	static Cursor = Cursor;

	static ObserveHandle = ObserveHandle;

	// XXX maybe move these into another ObserveHelpers package or something

	// _CachingChangeObserver is an object which receives observeChanges callbacks
	// and keeps a cache of the current cursor state up to date in this.docs. Users
	// of this class should read the docs field but not modify it. You should pass
	// the "applyChange" field as the callbacks to the underlying observeChanges
	// call. Optionally, you can specify your own observeChanges callbacks which are
	// invoked immediately before the docs field is updated; this object is made
	// available as `this` to those callbacks.
	static _CachingChangeObserver = class _CachingChangeObserver {
		ordered: any;

		docs: any;

		applyChange: any;

		constructor(options: any = {}) {
			const orderedFromCallbacks = options.callbacks && LocalCollection._observeChangesCallbacksAreOrdered(options.callbacks);

			if (hasOwn.call(options, 'ordered')) {
				this.ordered = options.ordered;

				if (options.callbacks && options.ordered !== orderedFromCallbacks) {
					throw Error("ordered option doesn't match callbacks");
				}
			} else if (options.callbacks) {
				this.ordered = orderedFromCallbacks;
			} else {
				throw Error('must provide ordered or callbacks');
			}

			const callbacks = options.callbacks || {};

			if (this.ordered) {
				this.docs = new OrderedDict();
				this.applyChange = {
					addedBefore: (id: any, fields: any, before: any) => {
						// Take a shallow copy since the top-level properties can be changed
						const doc = { ...fields };

						doc._id = id;

						if (callbacks.addedBefore) {
							callbacks.addedBefore.call(this, id, EJSON.clone(fields), before);
						}

						// This line triggers if we provide added with movedBefore.
						if (callbacks.added) {
							callbacks.added.call(this, id, EJSON.clone(fields));
						}

						// XXX could `before` be a falsy ID?  Technically
						// idStringify seems to allow for them -- though
						// OrderedDict won't call stringify on a falsy arg.
						this.docs.putBefore(id, doc, before || null);
					},
					movedBefore: (id: any, before: any) => {
						if (callbacks.movedBefore) {
							callbacks.movedBefore.call(this, id, before);
						}

						this.docs.moveBefore(id, before || null);
					},
				};
			} else {
				this.docs = new LocalCollection._IdMap();
				this.applyChange = {
					added: (id: any, fields: any) => {
						// Take a shallow copy since the top-level properties can be changed
						const doc = { ...fields };

						if (callbacks.added) {
							callbacks.added.call(this, id, EJSON.clone(fields));
						}

						doc._id = id;

						this.docs.set(id, doc);
					},
				};
			}

			// The methods in _IdMap and OrderedDict used by these callbacks are
			// identical.
			this.applyChange.changed = (id: any, fields: any) => {
				const doc = this.docs.get(id);

				if (!doc) {
					throw new Error(`Unknown id for changed: ${id}`);
				}

				if (callbacks.changed) {
					callbacks.changed.call(this, id, EJSON.clone(fields));
				}

				DiffSequence.applyChanges(doc, fields);
			};

			this.applyChange.removed = (id: any) => {
				if (callbacks.removed) {
					callbacks.removed.call(this, id);
				}

				this.docs.remove(id);
			};
		}
	};

	static _IdMap = class _IdMap extends IdMap<any> {};

	// Wrap a transform function to return objects that have the _id field
	// of the untransformed document. This ensures that subsystems such as
	// the observe-sequence package that call `observe` can keep track of
	// the documents identities.
	//
	// - Require that it returns objects
	// - If the return value has an _id field, verify that it matches the
	//   original _id field
	// - If the return value doesn't have an _id field, add it back.
	static wrapTransform = (transform: any) => {
		if (!transform) {
			return null;
		}

		// No need to doubly-wrap transforms.
		if (transform.__wrappedTransform__) {
			return transform;
		}

		const wrapped = (doc: any) => {
			if (!hasOwn.call(doc, '_id')) {
				// XXX do we ever have a transform on the oplog's collection? because that
				// collection has no _id.
				throw new Error('can only transform documents with _id');
			}

			const id = doc._id;

			// XXX consider making tracker a weak dependency and checking
			// Package.tracker here
			const transformed = Tracker.nonreactive(() => transform(doc));

			if (!LocalCollection._isPlainObject(transformed)) {
				throw new Error('transform must return object');
			}

			if (hasOwn.call(transformed, '_id')) {
				if (!EJSON.equals(transformed._id, id)) {
					throw new Error("transformed document can't have different _id");
				}
			} else {
				transformed._id = id;
			}

			return transformed;
		};

		wrapped.__wrappedTransform__ = true;

		return wrapped;
	};

	// XXX the sorted-query logic below is laughably inefficient. we'll
	// need to come up with a better datastructure for this.
	//
	// XXX the logic for observing with a skip or a limit is even more
	// laughably inefficient. we recompute the whole results every time!

	// This binary search puts a value between any equal values, and the first
	// lesser value.
	static _binarySearch = (cmp: any, array: any, value: any) => {
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
	};

	static _checkSupportedProjection = (fields: any) => {
		if (fields !== Object(fields) || Array.isArray(fields)) {
			throw createMinimongoError('fields option must be an object');
		}

		Object.keys(fields).forEach((keyPath) => {
			if (keyPath.split('.').includes('$')) {
				throw createMinimongoError("Minimongo doesn't support $ operator in projections yet.");
			}

			const value = fields[keyPath];

			if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some((key) => hasOwn.call(value, key))) {
				throw createMinimongoError("Minimongo doesn't support operators in projections yet.");
			}

			if (![1, 0, true, false].includes(value)) {
				throw createMinimongoError('Projection values should be one of 1, 0, true, or false');
			}
		});
	};

	// Knows how to compile a fields projection to a predicate function.
	// @returns - Function: a closure that filters out an object according to the
	//            fields projection rules:
	//            @param obj - Object: MongoDB-styled document
	//            @returns - Object: a document with the fields filtered out
	//                       according to projection rules. Doesn't retain subfields
	//                       of passed argument.
	static _compileProjection = (fields: any) => {
		LocalCollection._checkSupportedProjection(fields);

		const _idProjection = fields._id === undefined ? true : fields._id;
		const details = projectionDetails(fields);

		// returns transformed doc according to ruleTree
		const transform = (doc: any, ruleTree: any): any => {
			// Special case for "sets"
			if (Array.isArray(doc)) {
				return doc.map((subdoc) => transform(subdoc, ruleTree));
			}

			const result = details.including ? {} : EJSON.clone(doc);

			Object.keys(ruleTree).forEach((key) => {
				if (doc == null || !hasOwn.call(doc, key)) {
					return;
				}

				const rule = ruleTree[key];

				if (rule === Object(rule)) {
					// For sub-objects/subsets we branch
					if (doc[key] === Object(doc[key])) {
						result[key] = transform(doc[key], rule);
					}
				} else if (details.including) {
					// Otherwise we don't even touch this subfield
					result[key] = EJSON.clone(doc[key]);
				} else {
					delete result[key];
				}
			});

			return doc != null ? result : doc;
		};

		return (doc: any) => {
			const result = transform(doc, details.tree);

			if (_idProjection && hasOwn.call(doc, '_id')) {
				result._id = doc._id;
			}

			if (!_idProjection && hasOwn.call(result, '_id')) {
				delete result._id;
			}

			return result;
		};
	};

	// Calculates the document to insert in case we're doing an upsert and the
	// selector does not match any elements
	static _createUpsertDocument = (selector: any, modifier: any): any => {
		const selectorDocument = populateDocumentWithQueryFields(selector);
		const isModify = LocalCollection._isModificationMod(modifier);

		const newDoc: any = {};

		if (selectorDocument._id) {
			newDoc._id = selectorDocument._id;
			delete selectorDocument._id;
		}

		// This double _modify call is made to help with nested properties (see issue
		// #8631). We do this even if it's a replacement for validation purposes (e.g.
		// ambiguous id's)
		LocalCollection._modify(newDoc, { $set: selectorDocument });
		LocalCollection._modify(newDoc, modifier, { isInsert: true });

		if (isModify) {
			return newDoc;
		}

		// Replacement can take _id from query document
		const replacement = Object.assign({}, modifier);
		if (newDoc._id) {
			replacement._id = newDoc._id;
		}

		return replacement;
	};

	static _diffObjects = (left: any, right: any, callbacks: any): any => {
		return DiffSequence.diffObjects(left, right, callbacks);
	};

	// ordered: bool.
	// old_results and new_results: collections of documents.
	//    if ordered, they are arrays.
	//    if unordered, they are IdMaps
	static _diffQueryChanges = (ordered: any, oldResults: any, newResults: any, observer: any, options: any): any =>
		DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);

	static _diffQueryOrderedChanges = (oldResults: any, newResults: any, observer: any, options: any): any =>
		DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);

	static _diffQueryUnorderedChanges = (oldResults: any, newResults: any, observer: any, options: any): any =>
		DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);

	static _findInOrderedResults = (query: any, doc: any): number => {
		if (!query.ordered) {
			throw new Error("Can't call _findInOrderedResults on unordered query");
		}

		for (let i = 0; i < query.results.length; i++) {
			if (query.results[i] === doc) {
				return i;
			}
		}

		throw Error('object missing from query');
	};

	// If this is a selector which explicitly constrains the match by ID to a finite
	// number of documents, returns a list of their IDs.  Otherwise returns
	// null. Note that the selector may have other restrictions so it may not even
	// match those document!  We care about $in and $and since those are generated
	// access-controlled update and remove.
	static _idsMatchedBySelector = (selector: any): any[] | null => {
		// Is the selector just an ID?
		if (LocalCollection._selectorIsId(selector)) {
			return [selector];
		}

		if (!selector) {
			return null;
		}

		// Do we have an _id clause?
		if (hasOwn.call(selector, '_id')) {
			// Is the _id clause just an ID?
			if (LocalCollection._selectorIsId(selector._id)) {
				return [selector._id];
			}

			// Is the _id clause {_id: {$in: ["x", "y", "z"]}}?
			if (
				selector._id &&
				Array.isArray(selector._id.$in) &&
				selector._id.$in.length &&
				selector._id.$in.every(LocalCollection._selectorIsId)
			) {
				return selector._id.$in;
			}

			return null;
		}

		// If this is a top-level $and, and any of the clauses constrain their
		// documents, then the whole selector is constrained by any one clause's
		// constraint. (Well, by their intersection, but that seems unlikely.)
		if (Array.isArray(selector.$and)) {
			for (let i = 0; i < selector.$and.length; ++i) {
				const subIds = LocalCollection._idsMatchedBySelector(selector.$and[i]);

				if (subIds) {
					return subIds;
				}
			}
		}

		return null;
	};

	static _insertInResultsSync = (query: any, doc: any) => {
		const fields = EJSON.clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!query.sorter) {
				query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = LocalCollection._insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results, doc);

				let next = query.results[i + 1];
				if (next) {
					next = next._id;
				} else {
					next = null;
				}

				query.addedBefore(doc._id, query.projectionFn(fields), next);
			}

			query.added(doc._id, query.projectionFn(fields));
		} else {
			query.added(doc._id, query.projectionFn(fields));
			query.results.set(doc._id, doc);
		}
	};

	static _insertInResultsAsync = async (query: any, doc: any) => {
		const fields = EJSON.clone(doc);

		delete fields._id;

		if (query.ordered) {
			if (!query.sorter) {
				await query.addedBefore(doc._id, query.projectionFn(fields), null);
				query.results.push(doc);
			} else {
				const i = LocalCollection._insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results, doc);

				let next = query.results[i + 1];
				if (next) {
					next = next._id;
				} else {
					next = null;
				}

				await query.addedBefore(doc._id, query.projectionFn(fields), next);
			}

			await query.added(doc._id, query.projectionFn(fields));
		} else {
			await query.added(doc._id, query.projectionFn(fields));
			query.results.set(doc._id, doc);
		}
	};

	static _insertInSortedList = (cmp: any, array: any, value: any) => {
		if (array.length === 0) {
			array.push(value);
			return 0;
		}

		const i = LocalCollection._binarySearch(cmp, array, value);

		array.splice(i, 0, value);

		return i;
	};

	static _isModificationMod = (mod: any) => {
		let isModify = false;
		let isReplace = false;

		Object.keys(mod).forEach((key) => {
			if (key.substr(0, 1) === '$') {
				isModify = true;
			} else {
				isReplace = true;
			}
		});

		if (isModify && isReplace) {
			throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
		}

		return isModify;
	};

	// XXX maybe this should be EJSON.isObject, though EJSON doesn't know about
	// RegExp
	// XXX note that _type(undefined) === 3!!!!
	static _isPlainObject = (x: any) => {
		return x && LocalCollection._f._type(x) === 3;
	};

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
	static _modify = (doc: any, modifier: any, options: any = {}) => {
		if (!LocalCollection._isPlainObject(modifier)) {
			throw createMinimongoError('Modifier must be an object');
		}

		// Make sure the caller can't mutate our data structures.
		modifier = EJSON.clone(modifier);

		const isModifier = isOperatorObject(modifier);
		const newDoc = isModifier ? EJSON.clone(doc) : modifier;

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

			if (doc._id && !EJSON.equals(doc._id, newDoc._id)) {
				throw createMinimongoError(
					`After applying the update to the document {_id: "${doc._id}", ...},` +
						" the (immutable) field '_id' was found to have been altered to " +
						`_id: "${newDoc._id}"`,
				);
			}
		} else {
			if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) {
				throw createMinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${modifier._id}"}`);
			}

			// replace the whole document
			assertHasValidFieldNames(modifier);
		}

		// move new document into place.
		Object.keys(doc).forEach((key) => {
			// Note: this used to be for (var key in doc) however, this does not
			// work right in Opera. Deleting from a doc while iterating over it
			// would sometimes cause opera to skip some keys.
			if (key !== '_id') {
				delete doc[key];
			}
		});

		Object.keys(newDoc).forEach((key) => {
			doc[key] = newDoc[key];
		});
	};

	static _observeFromObserveChanges = (cursor: any, observeCallbacks: any) => {
		const transform = cursor.getTransform() || ((doc: any) => doc);
		let suppressed = !!observeCallbacks._suppress_initial;

		let observeChangesCallbacks;
		if (LocalCollection._observeCallbacksAreOrdered(observeCallbacks)) {
			// The "_no_indices" option sets all index arguments to -1 and skips the
			// linear scans required to generate them.  This lets observers that don't
			// need absolute indices benefit from the other features of this API --
			// relative order, transforms, and applyChanges -- without the speed hit.
			const indices = !observeCallbacks._no_indices;

			observeChangesCallbacks = {
				addedBefore(id: any, fields: any, before: any) {
					const check = suppressed || !(observeCallbacks.addedAt || observeCallbacks.added);
					if (check) {
						return;
					}

					const doc = transform(Object.assign(fields, { _id: id }));

					if (observeCallbacks.addedAt) {
						// eslint-disable-next-line no-nested-ternary
						observeCallbacks.addedAt(doc, indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1, before);
					} else {
						observeCallbacks.added(doc);
					}
				},
				changed(id: any, fields: any) {
					if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
						return;
					}

					const doc = EJSON.clone(this.docs.get(id));
					if (!doc) {
						throw new Error(`Unknown id for changed: ${id}`);
					}

					const oldDoc = transform(EJSON.clone(doc));

					DiffSequence.applyChanges(doc, fields);

					if (observeCallbacks.changedAt) {
						observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);
					} else {
						observeCallbacks.changed(transform(doc), oldDoc);
					}
				},
				movedBefore(id: any, before: any) {
					if (!observeCallbacks.movedTo) {
						return;
					}

					const from = indices ? this.docs.indexOf(id) : -1;
					// eslint-disable-next-line no-nested-ternary
					let to = indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1;

					// When not moving backwards, adjust for the fact that removing the
					// document slides everything back one slot.
					if (to > from) {
						--to;
					}

					observeCallbacks.movedTo(transform(EJSON.clone(this.docs.get(id))), from, to, before || null);
				},
				removed(id: any) {
					if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
						return;
					}

					// technically maybe there should be an EJSON.clone here, but it's about
					// to be removed from this.docs!
					const doc = transform(this.docs.get(id));

					if (observeCallbacks.removedAt) {
						observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);
					} else {
						observeCallbacks.removed(doc);
					}
				},
			};
		} else {
			observeChangesCallbacks = {
				added(id: any, fields: any) {
					if (!suppressed && observeCallbacks.added) {
						observeCallbacks.added(transform(Object.assign(fields, { _id: id })));
					}
				},
				changed(id: any, fields: any) {
					if (observeCallbacks.changed) {
						const oldDoc = this.docs.get(id);
						const doc = EJSON.clone(oldDoc);

						DiffSequence.applyChanges(doc, fields);

						observeCallbacks.changed(transform(doc), transform(EJSON.clone(oldDoc)));
					}
				},
				removed(id: any) {
					if (observeCallbacks.removed) {
						observeCallbacks.removed(transform(this.docs.get(id)));
					}
				},
			};
		}

		const changeObserver = new LocalCollection._CachingChangeObserver({
			callbacks: observeChangesCallbacks,
		});

		// CachingChangeObserver clones all received input on its callbacks
		// So we can mark it as safe to reduce the ejson clones.
		// This is tested by the `mongo-livedata - (extended) scribbling` tests
		changeObserver.applyChange._fromObserve = true;
		const handle = cursor.observeChanges(changeObserver.applyChange, { nonMutatingCallbacks: true });

		// If needed, re-enable callbacks as soon as the initial batch is ready.
		const setSuppressed = (h: any) => {
			if (h.isReady) suppressed = false;
			// eslint-disable-next-line no-return-assign
			else h.isReadyPromise?.then(() => (suppressed = false));
		};
		// When we call cursor.observeChanges() it can be the on from
		// the mongo package (instead of the minimongo one) and it doesn't have isReady and isReadyPromise
		if (Meteor._isPromise(handle)) {
			handle.then(setSuppressed);
		} else {
			setSuppressed(handle);
		}
		return handle;
	};

	static _observeCallbacksAreOrdered = (callbacks: any) => {
		if (callbacks.added && callbacks.addedAt) {
			throw new Error('Please specify only one of added() and addedAt()');
		}

		if (callbacks.changed && callbacks.changedAt) {
			throw new Error('Please specify only one of changed() and changedAt()');
		}

		if (callbacks.removed && callbacks.removedAt) {
			throw new Error('Please specify only one of removed() and removedAt()');
		}

		return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);
	};

	static _observeChangesCallbacksAreOrdered = (callbacks: any) => {
		if (callbacks.added && callbacks.addedBefore) {
			throw new Error('Please specify only one of added() and addedBefore()');
		}

		return !!(callbacks.addedBefore || callbacks.movedBefore);
	};

	static _removeFromResultsSync = (query: any, doc: any) => {
		if (query.ordered) {
			const i = LocalCollection._findInOrderedResults(query, doc);

			query.removed(doc._id);
			query.results.splice(i, 1);
		} else {
			const id = doc._id; // in case callback mutates doc

			query.removed(doc._id);
			query.results.remove(id);
		}
	};

	static _removeFromResultsAsync = async (query: any, doc: any) => {
		if (query.ordered) {
			const i = LocalCollection._findInOrderedResults(query, doc);

			await query.removed(doc._id);
			query.results.splice(i, 1);
		} else {
			const id = doc._id; // in case callback mutates doc

			await query.removed(doc._id);
			query.results.remove(id);
		}
	};

	// Is this selector just shorthand for lookup by _id?
	static _selectorIsId = (selector: any) => typeof selector === 'number' || typeof selector === 'string';

	// Is the selector just lookup by _id (shorthand or not)?
	static _selectorIsIdPerhapsAsObject = (selector: any) =>
		LocalCollection._selectorIsId(selector) ||
		(LocalCollection._selectorIsId(selector && selector._id) && Object.keys(selector).length === 1);

	static _updateInResultsSync = (query: any, doc: any, oldDoc: any) => {
		if (!EJSON.equals(doc._id, oldDoc._id)) {
			throw new Error("Can't change a doc's _id while updating");
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

		const oldIdx = LocalCollection._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			query.changed(doc._id, changedFields);
		}

		if (!query.sorter) {
			return;
		}

		// just take it out and put it back in again, and see if the index changes
		query.results.splice(oldIdx, 1);

		const newIdx = LocalCollection._insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results, doc);

		if (oldIdx !== newIdx) {
			let next = query.results[newIdx + 1];
			if (next) {
				next = next._id;
			} else {
				next = null;
			}

			query.movedBefore && query.movedBefore(doc._id, next);
		}
	};

	static _updateInResultsAsync = async (query: any, doc: any, oldDoc: any) => {
		if (!EJSON.equals(doc._id, oldDoc._id)) {
			throw new Error("Can't change a doc's _id while updating");
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

		const oldIdx = LocalCollection._findInOrderedResults(query, doc);

		if (Object.keys(changedFields).length) {
			await query.changed(doc._id, changedFields);
		}

		if (!query.sorter) {
			return;
		}

		// just take it out and put it back in again, and see if the index changes
		query.results.splice(oldIdx, 1);

		const newIdx = LocalCollection._insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results, doc);

		if (oldIdx !== newIdx) {
			let next = query.results[newIdx + 1];
			if (next) {
				next = next._id;
			} else {
				next = null;
			}

			query.movedBefore && (await query.movedBefore(doc._id, next));
		}
	};

	// helpers used by compiled selector code
	static _f = {
		// XXX for _all and _in, consider building 'inquery' at compile time..
		_type(v: any) {
			if (typeof v === 'number') {
				return 1;
			}

			if (typeof v === 'string') {
				return 2;
			}

			if (typeof v === 'boolean') {
				return 8;
			}

			if (Array.isArray(v)) {
				return 4;
			}

			if (v === null) {
				return 10;
			}

			// note that typeof(/x/) === "object"
			if (v instanceof RegExp) {
				return 11;
			}

			if (typeof v === 'function') {
				return 13;
			}

			if (v instanceof Date) {
				return 9;
			}

			if (EJSON.isBinary(v)) {
				return 5;
			}

			// object
			return 3;

			// XXX support some/all of these:
			// 14, symbol
			// 15, javascript code with scope
			// 16, 18: 32-bit/64-bit integer
			// 17, timestamp
			// 255, minkey
			// 127, maxkey
		},

		// deep equality test: use for literal document and array matches
		_equal(a: any, b: any) {
			return EJSON.equals(a, b, { keyOrderSensitive: true });
		},

		// maps a type code to a value that can be used to sort values of different
		// types
		_typeorder(t: number) {
			// http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
			// XXX what is the correct sort position for Javascript code?
			// ('100' in the matrix below)
			// XXX minkey/maxkey
			return [
				-1, // (not a type)
				1, // number
				2, // string
				3, // object
				4, // array
				5, // binary
				-1, // deprecated
				6, // ObjectID
				7, // bool
				8, // Date
				0, // null
				9, // RegExp
				-1, // deprecated
				100, // JS code
				2, // deprecated (symbol)
				100, // JS code
				1, // 32-bit int
				8, // Mongo timestamp
				1, // 64-bit int
			][t];
		},

		// compare two values of unknown type according to BSON ordering
		// semantics. (as an extension, consider 'undefined' to be less than
		// any other value.) return negative if a is less, positive if b is
		// less, or 0 if equal
		// eslint-disable-next-line complexity
		_cmp(a: any, b: any): any {
			if (a === undefined) {
				return b === undefined ? 0 : -1;
			}

			if (b === undefined) {
				return 1;
			}

			let ta = LocalCollection._f._type(a);
			let tb = LocalCollection._f._type(b);

			const oa = LocalCollection._f._typeorder(ta);
			const ob = LocalCollection._f._typeorder(tb);

			if (oa !== ob) {
				return oa < ob ? -1 : 1;
			}

			// XXX need to implement this if we implement Symbol or integers, or
			// Timestamp
			if (ta !== tb) {
				throw Error('Missing type coercion logic in _cmp');
			}

			if (ta === 7) {
				// ObjectID
				// Convert to string.
				// eslint-disable-next-line no-multi-assign
				ta = tb = 2;
				a = a.toHexString();
				b = b.toHexString();
			}

			if (ta === 9) {
				// Date
				// Convert to millis.
				// eslint-disable-next-line no-multi-assign
				ta = tb = 1;
				a = isNaN(a) ? 0 : a.getTime();
				b = isNaN(b) ? 0 : b.getTime();
			}

			if (ta === 1) {
				// double
				return a - b;
			}

			if (tb === 2)
				// string
				// eslint-disable-next-line no-nested-ternary
				return a < b ? -1 : a === b ? 0 : 1;

			if (ta === 3) {
				// Object
				// this could be much more efficient in the expected case ...
				const toArray = (object: any) => {
					const result: any[] = [];

					Object.keys(object).forEach((key) => {
						result.push(key, object[key]);
					});

					return result;
				};

				return LocalCollection._f._cmp(toArray(a), toArray(b));
			}

			if (ta === 4) {
				// Array
				for (let i = 0; ; i++) {
					if (i === a.length) {
						return i === b.length ? 0 : -1;
					}

					if (i === b.length) {
						return 1;
					}

					const s = LocalCollection._f._cmp(a[i], b[i]);
					if (s !== 0) {
						return s;
					}
				}
			}

			if (ta === 5) {
				// binary
				// Surprisingly, a small binary blob is always less than a large one in
				// Mongo.
				if (a.length !== b.length) {
					return a.length - b.length;
				}

				for (let i = 0; i < a.length; i++) {
					if (a[i] < b[i]) {
						return -1;
					}

					if (a[i] > b[i]) {
						return 1;
					}
				}

				return 0;
			}

			if (ta === 8) {
				// boolean
				if (a) {
					return b ? 0 : 1;
				}

				return b ? -1 : 0;
			}

			if (ta === 10)
				// null
				return 0;

			if (ta === 11)
				// regexp
				throw Error('Sorting not supported on regular expression'); // XXX

			// 13: javascript code
			// 14: symbol
			// 15: javascript code with scope
			// 16: 32-bit integer
			// 17: timestamp
			// 18: 64-bit integer
			// 255: minkey
			// 127: maxkey
			if (ta === 13)
				// javascript code
				throw Error('Sorting not supported on Javascript code'); // XXX

			throw Error('Unknown type to sort');
		},
	};
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

		target2[keyparts.pop()!] = object;
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
	$setOnInsert(_target: any, _field: any, _arg: any) {
		// converted to `$set` in `_modify`
	},
	$unset(target: any, field: any, _arg: any) {
		if (target !== undefined) {
			if (target instanceof Array) {
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

		if (!(target[field] instanceof Array)) {
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
		if (!(toPush instanceof Array)) {
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
				if (LocalCollection._f._type(element) !== 3) {
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
		if (!(typeof arg === 'object' && arg instanceof Array)) {
			throw createMinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
		}

		assertHasValidFieldNames(arg);

		const toPush = target[field];

		if (toPush === undefined) {
			target[field] = arg;
		} else if (!(toPush instanceof Array)) {
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
		} else if (!(toAdd instanceof Array)) {
			throw createMinimongoError('Cannot apply $addToSet modifier to non-array', { field });
		} else {
			values.forEach((value: any) => {
				if (toAdd.some((element) => LocalCollection._f._equal(value, element))) {
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

		if (!(toPop instanceof Array)) {
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

		if (!(toPull instanceof Array)) {
			throw createMinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		let out;
		if (arg != null && typeof arg === 'object' && !(arg instanceof Array)) {
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
			out = toPull.filter((element) => !LocalCollection._f._equal(element, arg));
		}

		target[field] = out;
	},
	$pullAll(target: any, field: any, arg: any) {
		if (!(typeof arg === 'object' && arg instanceof Array)) {
			throw createMinimongoError('Modifier $pushAll/pullAll allowed for arrays only', { field });
		}

		if (target === undefined) {
			return;
		}

		const toPull = target[field];

		if (toPull === undefined) {
			return;
		}

		if (!(toPull instanceof Array)) {
			throw createMinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		target[field] = toPull.filter((object) => !arg.some((element) => LocalCollection._f._equal(object, element)));
	},
	$bit(_target: any, field: any, _arg: any) {
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
function assertHasValidFieldNames(doc: any) {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key, value) => {
			assertIsValidFieldName(key);
			return value;
		});
	}
}

function assertIsValidFieldName(key: any) {
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
function findModTarget(doc: any, keyparts: any, options: any = {}) {
	let usedArrayIndex = false;

	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart = keyparts[i];

		if (!isIndexable(doc)) {
			if (options.noCreate) {
				return undefined;
			}

			const error: any = createMinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
			error.setPropertyError = true;
			throw error;
		}

		if (doc instanceof Array) {
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
			} else if (isNumericKey(keypart)) {
				keypart = parseInt(keypart);
			} else {
				if (options.noCreate) {
					return undefined;
				}

				throw createMinimongoError(`can't append to array using string field name [${keypart}]`);
			}

			if (last) {
				keyparts[i] = keypart; // handle 'a.01'
			}

			if (options.noCreate && keypart >= doc.length) {
				return undefined;
			}

			while (doc.length < keypart) {
				doc.push(null);
			}

			if (!last) {
				if (doc.length === keypart) {
					doc.push({});
				} else if (typeof doc[keypart] !== 'object') {
					throw createMinimongoError(`can't modify field '${keyparts[i + 1]}' of list value ${JSON.stringify(doc[keypart])}`);
				}
			}
		} else {
			assertIsValidFieldName(keypart);

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
			return doc;
		}

		doc = doc[keypart];
	}

	// notreached
}
