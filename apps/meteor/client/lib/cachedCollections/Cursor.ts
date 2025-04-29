import { Tracker } from 'meteor/tracker';
import type { Filter } from 'mongodb';

import { DiffSequence } from './DiffSequence';
import { IdMap } from './IdMap';
import type { LocalCollection } from './LocalCollection';
import { Matcher } from './Matcher';
import type { FieldSpecifier, Options, Transform } from './MinimongoCollection';
import { ObserveHandle } from './ObserveHandle';
import { OrderedDict } from './OrderedDict';
import type { Query } from './Query';
import { Sorter } from './Sorter';
import { _isPlainObject, clone, createMinimongoError, hasOwn, isEqual, isPromiseLike } from './common';

export type DispatchTransform<TTransform, T, TProjection> = TTransform extends (...args: any) => any
	? ReturnType<TTransform>
	: TTransform extends null
		? T
		: TProjection;

interface ICursor<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T> {
	sorter: Sorter<T> | null;
	matcher: Matcher<T>;
	skip: number;
	limit: number | undefined;
	fields: FieldSpecifier | undefined;
	reactive: boolean;
	count(): number;
	fetch(): DispatchTransform<TOptions['transform'], T, TProjection>[];
	[Symbol.iterator](): Iterator<DispatchTransform<TOptions['transform'], T, TProjection>>;
	[Symbol.asyncIterator](): AsyncIterator<DispatchTransform<TOptions['transform'], T, TProjection>>;
	forEach<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => void>(
		callback: TIterationCallback,
		thisArg?: ThisParameterType<TIterationCallback>,
	): void;
	getTransform(): TOptions['transform'];
	map<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => unknown>(
		callback: TIterationCallback,
		thisArg?: ThisParameterType<TIterationCallback>,
	): ReturnType<TIterationCallback>[];
	observe(options: ObserveCallbacks<TProjection>): ObserveHandle;
	observeAsync(options: ObserveCallbacks<TProjection>): Promise<ObserveHandle>;
	observeChanges(options: ObserveChangesCallbacks<TProjection>): ObserveHandle;
	observeChangesAsync(options: ObserveChangesCallbacks<TProjection>): Promise<ObserveHandle>;
	countAsync(): Promise<number>;
	fetchAsync(): Promise<DispatchTransform<TOptions['transform'], T, TProjection>[]>;
	forEachAsync<
		TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => void,
	>(
		callback: TIterationCallback,
		thisArg: ThisParameterType<TIterationCallback>,
	): Promise<void>;
	mapAsync<
		TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => unknown,
	>(
		callback: TIterationCallback,
		thisArg: ThisParameterType<TIterationCallback>,
	): Promise<ReturnType<TIterationCallback>[]>;
}

/** a specification for a particular subset of documents, w/ a defined order, limit, and offset */
export class Cursor<T extends { _id: string }, TOptions extends Options<T>, TProjection extends T = T>
	implements ICursor<T, TOptions, TProjection>
{
	matcher: Matcher<T>;

	sorter: Sorter<T> | null = null;

	skip: number;

	limit: number | undefined;

	fields: FieldSpecifier | undefined;

	protected _projectionFn: (doc: T | Omit<T, '_id'>) => TProjection;

	protected _transform: TOptions['transform'];

	reactive: boolean;

	constructor(
		protected collection: LocalCollection<T>,
		selector: Filter<T> | T['_id'],
		options?: TOptions,
	) {
		this.matcher = new Matcher(selector);
		this.sorter = options?.sort ? new Sorter(options.sort) : null;
		this.skip = options?.skip ?? 0;
		this.limit = options?.limit;
		this.fields = options?.projection ?? options?.fields;
		this._projectionFn = this._compileProjection(this.fields || {});
		this._transform = this.wrapTransform(options?.transform);
		this.reactive = options?.reactive === undefined ? true : options.reactive;
	}

	private _compileProjection(fields: FieldSpecifier) {
		this._checkSupportedProjection(fields);

		const _idProjection = fields._id === undefined ? true : fields._id;
		const details = this.projectionDetails(fields);

		// returns transformed doc according to ruleTree
		const transform = (doc: any, ruleTree: any): any => {
			// Special case for "sets"
			if (Array.isArray(doc)) {
				return doc.map((subdoc) => transform(subdoc, ruleTree));
			}

			const result = details.including ? {} : clone(doc);

			Object.keys(ruleTree).forEach((key) => {
				if (doc == null || !hasOwn.call(doc, key)) {
					return;
				}

				const rule = ruleTree[key];

				if (rule === Object(rule)) {
					// For sub-objects/subsets we branch
					if (doc[key as keyof typeof doc] === Object(doc[key as keyof typeof doc])) {
						result[key as keyof typeof doc] = transform(doc[key as keyof typeof doc], rule);
					}
				} else if (details.including) {
					// Otherwise we don't even touch this subfield
					result[key as keyof typeof doc] = clone(doc[key as keyof typeof doc]);
				} else {
					delete result[key as keyof typeof doc];
				}
			});

			return doc != null ? result : doc;
		};

		return (doc: T | Omit<T, '_id'>) => {
			const result = transform(doc, details.tree);

			if (_idProjection && '_id' in doc) {
				result._id = doc._id;
			}

			if (!_idProjection && hasOwn.call(result, '_id')) {
				delete result._id;
			}

			return result;
		};
	}

	private _checkSupportedProjection(fields: FieldSpecifier) {
		if (fields !== Object(fields) || Array.isArray(fields)) {
			throw createMinimongoError('fields option must be an object');
		}

		Object.keys(fields).forEach((keyPath) => {
			if (keyPath.split('.').includes('$')) {
				throw createMinimongoError("Minimongo doesn't support $ operator in projections yet.");
			}

			const value = fields[keyPath];

			if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some((key) => key in value)) {
				throw createMinimongoError("Minimongo doesn't support operators in projections yet.");
			}

			if (![1, 0, true, false].includes(value)) {
				throw createMinimongoError('Projection values should be one of 1, 0, true, or false');
			}
		});
	}

	// Traverses the keys of passed projection and constructs a tree where all
	// leaves are either all True or all False
	// @returns Object:
	//  - tree - Object - tree representation of keys involved in projection
	//  (exception for '_id' as it is a special case handled separately)
	//  - including - Boolean - "take only certain fields" type of projection
	private projectionDetails(fields: FieldSpecifier) {
		// Find the non-_id keys (_id is handled specially because it is included
		// unless explicitly excluded). Sort the keys, so that our code to detect
		// overlaps like 'foo' and 'foo.bar' can assume that 'foo' comes first.
		let fieldsKeys = Object.keys(fields).sort();

		// If _id is the only field in the projection, do not remove it, since it is
		// required to determine if this is an exclusion or exclusion. Also keep an
		// inclusive _id, since inclusive _id follows the normal rules about mixing
		// inclusive and exclusive fields. If _id is not the only field in the
		// projection and is exclusive, remove it so it can be handled later by a
		// special case, since exclusive _id is always allowed.
		if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {
			fieldsKeys = fieldsKeys.filter((key) => key !== '_id');
		}

		let including: boolean | null = null; // Unknown

		for (const keyPath of fieldsKeys) {
			const rule = !!fields[keyPath];

			if (including === null) {
				including = rule;
			}

			// This error message is copied from MongoDB shell
			if (including !== rule) {
				throw createMinimongoError('You cannot currently mix including and excluding fields.');
			}
		}

		const projectionRulesTree = this.pathsToTree(
			fieldsKeys,
			(_path) => including,
			(_node, path, fullPath) => {
				// Check passed projection fields' keys: If you have two rules such as
				// 'foo.bar' and 'foo.bar.baz', then the result becomes ambiguous. If
				// that happens, there is a probability you are doing something wrong,
				// framework should notify you about such mistake earlier on cursor
				// compilation step than later during runtime.  Note, that real mongo
				// doesn't do anything about it and the later rule appears in projection
				// project, more priority it takes.
				//
				// Example, assume following in mongo shell:
				// > db.coll.insert({ a: { b: 23, c: 44 } })
				// > db.coll.find({}, { 'a': 1, 'a.b': 1 })
				// {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23}}
				// > db.coll.find({}, { 'a.b': 1, 'a': 1 })
				// {"_id": ObjectId("520bfe456024608e8ef24af3"), "a": {"b": 23, "c": 44}}
				//
				// Note, how second time the return set of keys is different.
				throw createMinimongoError(
					`both ${fullPath} and ${path} found in fields option, ` +
						'using both of them may trigger unexpected behavior. Did you mean to ' +
						'use only one of them?',
				);
			},
		);

		return { including, tree: projectionRulesTree };
	}

	private pathsToTree(
		paths: string[],
		newLeafFn: (path: string) => unknown,
		conflictFn: (node: unknown, path: string, fullPath: string) => unknown,
		root: Record<string, unknown> = {},
	) {
		for (const path of paths) {
			const pathArray = path.split('.');
			let tree = root;

			// use .every just for iteration with break
			const success = pathArray.slice(0, -1).every((key, i) => {
				if (!(key in tree)) {
					tree[key] = {};
				} else if (tree[key] !== Object(tree[key])) {
					tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path);

					// break out of loop if we are failing for this path
					if (tree[key] !== Object(tree[key])) {
						return false;
					}
				}

				tree = tree[key] as Record<string, unknown>;

				return true;
			});

			if (success) {
				const lastKey = pathArray[pathArray.length - 1];
				if (hasOwn.call(tree, lastKey)) {
					tree[lastKey] = conflictFn(tree[lastKey], path, path);
				} else {
					tree[lastKey] = newLeafFn(path);
				}
			}
		}

		return root;
	}

	// Wrap a transform function to return objects that have the _id field
	// of the untransformed document. This ensures that subsystems such as
	// the observe-sequence package that call `observe` can keep track of
	// the documents identities.
	//
	// - Require that it returns objects
	// - If the return value has an _id field, verify that it matches the
	//   original _id field
	// - If the return value doesn't have an _id field, add it back.
	private wrapTransform(transform: (Transform<T> & { __wrappedTransform__?: boolean }) | null | undefined) {
		if (!transform) {
			return null;
		}

		// No need to doubly-wrap transforms.
		if (transform.__wrappedTransform__) {
			return transform;
		}

		const wrapped = (doc: any) => {
			if (!('_id' in doc)) {
				// XXX do we ever have a transform on the oplog's collection? because that
				// collection has no _id.
				throw createMinimongoError('can only transform documents with _id');
			}

			const id = doc._id;

			// XXX consider making tracker a weak dependency and checking
			// Package.tracker here
			const transformed = Tracker.nonreactive(() => transform(doc));

			if (!_isPlainObject(transformed)) {
				throw new Error('transform must return object');
			}

			if (hasOwn.call(transformed, '_id')) {
				if (!isEqual(transformed._id, id)) {
					throw new Error("transformed document can't have different _id");
				}
			} else {
				transformed._id = id;
			}

			return transformed;
		};

		wrapped.__wrappedTransform__ = true;

		return wrapped;
	}

	/**
	 * @deprecated in 2.9
	 * @summary Returns the number of documents that match a query. This method is
	 *          [deprecated since MongoDB 4.0](https://www.mongodb.com/docs/v4.4/reference/command/count/);
	 *          see `Collection.countDocuments` and
	 *          `Collection.estimatedDocumentCount` for a replacement.
	 * @memberOf Mongo.Cursor
	 * @method  count
	 * @instance
	 * @locus Anywhere
	 * @returns {Number}
	 */
	count(): number {
		if (this.reactive) {
			// allow the observe to be unordered
			this._depend({ added: true, removed: true }, true);
		}

		return this._getRawObjects({ ordered: true }).length;
	}

	/**
	 * @summary Return all matching documents as an Array.
	 * @memberOf Mongo.Cursor
	 * @method  fetch
	 * @instance
	 * @locus Anywhere
	 * @returns {Object[]}
	 */
	fetch(): DispatchTransform<TOptions['transform'], T, TProjection>[] {
		const result: DispatchTransform<TOptions['transform'], T, TProjection>[] = [];

		this.forEach((doc) => {
			result.push(doc);
		});

		return result;
	}

	[Symbol.iterator](): Iterator<DispatchTransform<TOptions['transform'], T, TProjection>> {
		if (this.reactive) {
			this._depend({
				addedBefore: true,
				removed: true,
				changed: true,
				movedBefore: true,
			});
		}

		let index = 0;
		const objects = this._getRawObjects({ ordered: true });

		return {
			next: () => {
				if (index < objects.length) {
					// This doubles as a clone operation.
					const element = this._projectionFn(objects[index++]);

					if (this._transform) {
						return { value: this._transform(element) };
					}

					return { value: element };
				}

				return { value: undefined, done: true };
			},
		};
	}

	[Symbol.asyncIterator](): AsyncIterator<DispatchTransform<TOptions['transform'], T, TProjection>> {
		const syncResult = this[Symbol.iterator]();
		return {
			async next() {
				return Promise.resolve(syncResult.next());
			},
		};
	}

	/**
	 * @callback IterationCallback
	 * @param {Object} doc
	 * @param {Number} index
	 */
	/**
	 * @summary Call `callback` once for each matching document, sequentially and
	 *          synchronously.
	 * @locus Anywhere
	 * @method  forEach
	 * @instance
	 * @memberOf Mongo.Cursor
	 * @param {IterationCallback} callback Function to call. It will be called
	 *                                     with three arguments: the document, a
	 *                                     0-based index, and <em>cursor</em>
	 *                                     itself.
	 * @param {Any} [thisArg] An object which will be the value of `this` inside
	 *                        `callback`.
	 */
	forEach<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => void>(
		callback: TIterationCallback,
		thisArg?: ThisParameterType<TIterationCallback>,
	): void {
		if (this.reactive) {
			this._depend({
				addedBefore: true,
				removed: true,
				changed: true,
				movedBefore: true,
			});
		}

		this._getRawObjects({ ordered: true }).forEach((element: T, i: number) => {
			// This doubles as a clone operation.
			const projection = this._projectionFn(element);

			if (this._transform) {
				callback.call(thisArg, this._transform(projection), i, this);
				return;
			}

			callback.call(thisArg, projection as DispatchTransform<TOptions['transform'], T, TProjection>, i, this);
		});
	}

	getTransform() {
		return this._transform;
	}

	/**
	 * @summary Map callback over all matching documents.  Returns an Array.
	 * @locus Anywhere
	 * @method map
	 * @instance
	 * @memberOf Mongo.Cursor
	 * @param {IterationCallback} callback Function to call. It will be called
	 *                                     with three arguments: the document, a
	 *                                     0-based index, and <em>cursor</em>
	 *                                     itself.
	 * @param {Any} [thisArg] An object which will be the value of `this` inside
	 *                        `callback`.
	 */
	map<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => unknown>(
		callback: TIterationCallback,
		thisArg?: ThisParameterType<TIterationCallback>,
	): ReturnType<TIterationCallback>[] {
		const result: ReturnType<TIterationCallback>[] = [];

		this.forEach((doc, i) => {
			result.push(callback.call(thisArg, doc, i, this) as ReturnType<TIterationCallback>);
		});

		return result;
	}

	// options to contain:
	//  * callbacks for observe():
	//    - addedAt (document, atIndex)
	//    - added (document)
	//    - changedAt (newDocument, oldDocument, atIndex)
	//    - changed (newDocument, oldDocument)
	//    - removedAt (document, atIndex)
	//    - removed (document)
	//    - movedTo (document, oldIndex, newIndex)
	//
	// attributes available on returned query handle:
	//  * stop(): end updates
	//  * collection: the collection this query is querying
	//
	// iff x is a returned query handle, (x instanceof
	// LocalCollection.ObserveHandle) is true
	//
	// initial results delivered through added callback
	// XXX maybe callbacks should take a list of objects, to expose transactions?
	// XXX maybe support field limiting (to limit what you're notified on)

	/**
	 * @summary Watch a query.  Receive callbacks as the result set changes.
	 * @locus Anywhere
	 * @memberOf Mongo.Cursor
	 * @instance
	 * @param {Object} callbacks Functions to call to deliver the result set as it
	 *                           changes
	 */
	observe(options: ObserveCallbacks<TProjection>) {
		return this._observeFromObserveChanges(options);
	}

	/**
	 * @summary Watch a query.  Receive callbacks as the result set changes.
	 * @locus Anywhere
	 * @memberOf Mongo.Cursor
	 * @instance
	 */
	observeAsync(options: ObserveCallbacks<TProjection>) {
		return new Promise<ObserveHandle>((resolve) => resolve(this.observe(options)));
	}

	/**
	 * @summary Watch a query. Receive callbacks as the result set changes. Only
	 *          the differences between the old and new documents are passed to
	 *          the callbacks.
	 * @locus Anywhere
	 * @memberOf Mongo.Cursor
	 * @instance
	 * @param {Object} callbacks Functions to call to deliver the result set as it
	 *                           changes
	 */
	observeChanges(options: ObserveChangesCallbacks<TProjection>) {
		const ordered = Cursor._observeChangesCallbacksAreOrdered(options);

		// there are several places that assume you aren't combining skip/limit with
		// unordered observe.  eg, update's clone, and the "there are several"
		// comment in _modifyAndNotify
		// XXX allow skip/limit with unordered observe
		if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {
			throw new Error(
				"Must use an ordered observe with skip or limit (i.e. 'addedBefore' " +
					"for observeChanges or 'addedAt' for observe, instead of 'added').",
			);
		}

		if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {
			throw Error('You may not observe a cursor with {fields: {_id: 0}}');
		}

		const query: Query<T, TOptions, TProjection> = ordered
			? {
					cursor: this,
					dirty: false,
					matcher: this.matcher, // not fast pathed
					ordered,
					projectionFn: this._projectionFn,
					resultsSnapshot: null,
					sorter: this.sorter!,
				}
			: {
					cursor: this,
					dirty: false,
					matcher: this.matcher, // not fast pathed
					ordered,
					projectionFn: this._projectionFn,
					resultsSnapshot: null,
					sorter: null,
				};

		// Non-reactive queries call added[Before] and then never call anything
		// else.
		if (this.reactive) {
			this.collection.queries.add(query);
		}

		query.results = this._getRawObjects({ ordered });

		if (this.collection.paused) {
			query.resultsSnapshot = ordered ? [] : new IdMap<T['_id'], T>();
		}

		// wrap callbacks we were passed. callbacks only fire when not paused and
		// are never undefined
		// Filters out blacklisted fields according to cursor's projection.
		// XXX wrong place for this?

		// furthermore, callbacks enqueue until the operation we're working on is
		// done.
		const wrapCallback = <TFn extends (...args: any) => any>(fn: TFn | undefined) => {
			if (!fn) {
				// eslint-disable-next-line @typescript-eslint/no-empty-function
				return () => {};
			}

			// eslint-disable-next-line @typescript-eslint/no-this-alias
			const self = this;

			return function (this: ThisParameterType<TFn>, ...args: Parameters<TFn>) {
				if (self.collection.paused) {
					return;
				}

				self.collection._observeQueue.queueTask(() => {
					fn.apply(this, args);
				});
			};
		};

		query.added = wrapCallback(options.added);
		query.changed = wrapCallback(options.changed);
		query.removed = wrapCallback(options.removed);

		if (query.ordered) {
			query.addedBefore = wrapCallback(options.addedBefore);
			query.movedBefore = wrapCallback(options.movedBefore);
		}

		if (!options._suppress_initial && !this.collection.paused) {
			const handler = (doc: T) => {
				const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

				delete fields._id;

				if (query.ordered) {
					query.addedBefore!(doc._id, this._projectionFn(fields), null);
				}

				query.added!(doc._id, this._projectionFn(fields));
			};
			// it means it's just an array
			if ((query.results as T[]).length) {
				for (const doc of query.results as T[]) {
					handler(doc);
				}
			}
			// it means it's an id map
			if ((query.results as IdMap<T['_id'], T>).size?.()) {
				(query.results as IdMap<T['_id'], T>).forEach(handler);
			}
		}

		const handle = Object.assign(new ObserveHandle(), {
			collection: this.collection,
			stop: () => {
				if (this.reactive) {
					this.collection.queries.delete(query);
				}
			},
			isReady: false,
			isReadyPromise: null as unknown as Promise<void>,
		});

		if (this.reactive && Tracker.active) {
			// XXX in many cases, the same observe will be recreated when
			// the current autorun is rerun.  we could save work by
			// letting it linger across rerun and potentially get
			// repurposed if the same observe is performed, using logic
			// similar to that of Meteor.subscribe.
			Tracker.onInvalidate(() => {
				handle.stop();
			});
		}

		// run the observe callbacks resulting from the initial contents
		// before we leave the observe.
		this.collection._observeQueue.drain();

		handle.isReady = true;
		handle.isReadyPromise = Promise.resolve();

		return handle;
	}

	/**
	 * @summary Watch a query. Receive callbacks as the result set changes. Only
	 *          the differences between the old and new documents are passed to
	 *          the callbacks.
	 * @locus Anywhere
	 * @memberOf Mongo.Cursor
	 * @instance
	 * @param {Object} callbacks Functions to call to deliver the result set as it
	 *                           changes
	 */
	observeChangesAsync(options: ObserveChangesCallbacks<TProjection>) {
		return new Promise<ObserveHandle>((resolve) => {
			const handle = this.observeChanges(options);
			handle.isReadyPromise.then(() => resolve(handle));
		});
	}

	// XXX Maybe we need a version of observe that just calls a callback if
	// anything changed.
	private _depend(
		changers: Partial<Record<'added' | 'addedBefore' | 'changed' | 'movedBefore' | 'removed', boolean>>,
		_allowUnordered?: boolean,
	) {
		if (Tracker.active) {
			const dependency = new Tracker.Dependency();
			const notify = dependency.changed.bind(dependency);

			dependency.depend();

			const options: ObserveChangesCallbacks<TProjection> = {
				_allow_unordered: _allowUnordered,
				_suppress_initial: true,
			};

			(['added', 'addedBefore', 'changed', 'movedBefore', 'removed'] as const).forEach((fn) => {
				if (changers[fn]) {
					options[fn] = notify;
				}
			});

			// observeChanges will stop() when this computation is invalidated
			this.observeChanges(options);
		}
	}

	// Returns a collection of matching objects, but doesn't deep copy them.
	//
	// If ordered is set, returns a sorted array, respecting sorter, skip, and
	// limit properties of the query provided that options.applySkipLimit is
	// not set to false (#1201). If sorter is falsey, no sort -- you get the
	// natural order.
	//
	// If ordered is not set, returns an object mapping from ID to doc (sorter,
	// skip and limit should not be set).
	_getRawObjects(options: { ordered: true; applySkipLimit?: boolean }): T[];

	_getRawObjects(options: { ordered: false; applySkipLimit?: boolean }): IdMap<T['_id'], T>;

	_getRawObjects(options?: { ordered?: boolean; applySkipLimit?: boolean }): IdMap<T['_id'], T> | T[];

	_getRawObjects(options: { ordered?: boolean; applySkipLimit?: boolean } = {}): IdMap<T['_id'], T> | T[] {
		// By default this method will respect skip and limit because .fetch(),
		// .forEach() etc... expect this behaviour. It can be forced to ignore
		// skip and limit by setting applySkipLimit to false (.count() does this,
		// for example)
		const applySkipLimit = options.applySkipLimit !== false;

		// XXX use OrderedDict instead of array, and make IdMap and OrderedDict
		// compatible
		const results: T[] | IdMap<T['_id'], T> = options.ordered ? [] : new IdMap<T['_id'], T>();

		// slow path for arbitrary selector, sort, skip, limit

		for (const doc of this.collection.all()) {
			const matchResult = this.matcher.documentMatches(doc);
			if (matchResult.result) {
				if (options.ordered) {
					(results as T[]).push(doc);
				} else {
					(results as IdMap<T['_id'], T>).set(doc._id, doc);
				}
			}

			// Override to ensure all docs are matched if ignoring skip & limit
			if (!applySkipLimit) {
				continue;
			}

			if ((!this.limit || !!this.skip || !!this.sorter || (results as T[]).length !== this.limit) === false) break;
		}

		if (!options.ordered) {
			return results;
		}

		if (this.sorter) {
			(results as T[]).sort(this.sorter.getComparator());
		}

		// Return the full set of results if there is no skip or limit or if we're
		// ignoring them
		if (!applySkipLimit || (!this.limit && !this.skip)) {
			return results;
		}

		return (results as T[]).slice(this.skip, this.limit ? this.limit + this.skip : (results as T[]).length);
	}

	/**
	 * @deprecated in 2.9
	 * @summary Returns the number of documents that match a query. This method is
	 *          [deprecated since MongoDB 4.0](https://www.mongodb.com/docs/v4.4/reference/command/count/);
	 *          see `Collection.countDocuments` and
	 *          `Collection.estimatedDocumentCount` for a replacement.
	 * @memberOf Mongo.Cursor
	 * @method  countAsync
	 * @instance
	 * @locus Anywhere
	 * @returns {Promise}
	 */
	countAsync(): Promise<number> {
		try {
			return Promise.resolve(this.count());
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * @summary Return all matching documents as an Array.
	 * @memberOf Mongo.Cursor
	 * @method  fetchAsync
	 * @instance
	 * @locus Anywhere
	 * @returns {Promise}
	 */
	fetchAsync(): Promise<DispatchTransform<TOptions['transform'], T, TProjection>[]> {
		try {
			return Promise.resolve(this.fetch());
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * @summary Call `callback` once for each matching document, sequentially and
	 *          synchronously.
	 * @locus Anywhere
	 * @method  forEachAsync
	 * @instance
	 * @memberOf Mongo.Cursor
	 * @param {IterationCallback} callback Function to call. It will be called
	 *                                     with three arguments: the document, a
	 *                                     0-based index, and <em>cursor</em>
	 *                                     itself.
	 * @param {Any} [thisArg] An object which will be the value of `this` inside
	 *                        `callback`.
	 * @returns {Promise}
	 */
	forEachAsync<
		TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => void,
	>(callback: TIterationCallback, thisArg: ThisParameterType<TIterationCallback>): Promise<void> {
		try {
			return Promise.resolve(this.forEach(callback, thisArg));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	/**
	 * @summary Map callback over all matching documents.  Returns an Array.
	 * @locus Anywhere
	 * @method mapAsync
	 * @instance
	 * @memberOf Mongo.Cursor
	 * @param {IterationCallback} callback Function to call. It will be called
	 *                                     with three arguments: the document, a
	 *                                     0-based index, and <em>cursor</em>
	 *                                     itself.
	 * @param {Any} [thisArg] An object which will be the value of `this` inside
	 *                        `callback`.
	 * @returns {Promise}
	 */
	mapAsync<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T, TProjection>, index: number, cursor: this) => any>(
		callback: TIterationCallback,
		thisArg: ThisParameterType<TIterationCallback>,
	): Promise<ReturnType<TIterationCallback>[]> {
		try {
			return Promise.resolve(this.map(callback, thisArg));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	private _observeFromObserveChanges(observeCallbacks: ObserveCallbacks<TProjection>) {
		const transform = this.getTransform() || ((doc: T) => doc);
		let suppressed = !!observeCallbacks._suppress_initial;

		let observeChangesCallbacks: ObserveChangesCallbacks<T>;
		if (this._observeCallbacksAreOrdered(observeCallbacks)) {
			// The "_no_indices" option sets all index arguments to -1 and skips the
			// linear scans required to generate them.  This lets observers that don't
			// need absolute indices benefit from the other features of this API --
			// relative order, transforms, and applyChanges -- without the speed hit.
			const indices = !observeCallbacks._no_indices;

			observeChangesCallbacks = {
				addedBefore(id, fields, before) {
					const check = suppressed || !(observeCallbacks.addedAt || observeCallbacks.added);
					if (check) {
						return;
					}

					const doc = transform(Object.assign(fields, { _id: id }));

					if (observeCallbacks.addedAt) {
						observeCallbacks.addedAt(
							doc,
							// eslint-disable-next-line no-nested-ternary
							indices ? (before ? (this.docs as OrderedDict<T['_id'], T>).indexOf(before) : this.docs.size()) : -1,
							before,
						);
					} else {
						observeCallbacks.added!(doc);
					}
				},
				changed(id, fields) {
					if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
						return;
					}

					const doc = clone(this.docs.get(id));
					if (!doc) {
						throw new Error(`Unknown id for changed: ${id}`);
					}

					const oldDoc = transform(clone(doc));

					DiffSequence.applyChanges(doc, fields);

					if (observeCallbacks.changedAt) {
						observeCallbacks.changedAt(transform(doc), oldDoc, indices ? (this.docs as OrderedDict<T['_id'], T>).indexOf(id) : -1);
					} else {
						observeCallbacks.changed!(transform(doc), oldDoc);
					}
				},
				movedBefore(id, before) {
					if (!observeCallbacks.movedTo) {
						return;
					}

					const from = indices ? (this.docs as OrderedDict<T['_id'], T>).indexOf(id) : -1;
					// eslint-disable-next-line no-nested-ternary
					let to = indices ? (before ? (this.docs as OrderedDict<T['_id'], T>).indexOf(before) : this.docs.size()) : -1;

					// When not moving backwards, adjust for the fact that removing the
					// document slides everything back one slot.
					if (to > from) {
						--to;
					}

					observeCallbacks.movedTo(transform(clone(this.docs.get(id)!)), from, to, before || null);
				},
				removed(id) {
					if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
						return;
					}

					// technically maybe there should be an clone here, but it's about
					// to be removed from this.docs!
					const doc = transform(this.docs.get(id)!);

					if (observeCallbacks.removedAt) {
						observeCallbacks.removedAt(doc, indices ? (this.docs as OrderedDict<T['_id'], T>).indexOf(id) : -1);
					} else {
						observeCallbacks.removed!(doc);
					}
				},
			};
		} else {
			observeChangesCallbacks = {
				added(id, fields) {
					if (!suppressed && observeCallbacks.added) {
						observeCallbacks.added(transform(Object.assign(fields, { _id: id })));
					}
				},
				changed(id, fields) {
					if (observeCallbacks.changed) {
						const oldDoc = this.docs.get(id)!;
						const doc = clone(oldDoc);

						DiffSequence.applyChanges(doc!, fields);

						observeCallbacks.changed(transform(doc), transform(clone(oldDoc)));
					}
				},
				removed(id) {
					if (observeCallbacks.removed) {
						observeCallbacks.removed(transform(this.docs.get(id)!));
					}
				},
			};
		}

		const changeObserver = new _CachingChangeObserver({
			callbacks: observeChangesCallbacks,
		});

		// CachingChangeObserver clones all received input on its callbacks
		// So we can mark it as safe to reduce the ejson clones.
		// This is tested by the `mongo-livedata - (extended) scribbling` tests
		changeObserver.applyChange._fromObserve = true;
		const handle = this.observeChanges(changeObserver.applyChange);

		// If needed, re-enable callbacks as soon as the initial batch is ready.
		const setSuppressed = (h: any) => {
			if (h.isReady) suppressed = false;
			// eslint-disable-next-line no-return-assign
			else h.isReadyPromise?.then(() => (suppressed = false));
		};
		// When we call cursor.observeChanges() it can be the on from
		// the mongo package (instead of the minimongo one) and it doesn't have isReady and isReadyPromise
		if (isPromiseLike(handle)) {
			handle.then(setSuppressed);
		} else {
			setSuppressed(handle);
		}
		return handle;
	}

	private _observeCallbacksAreOrdered(callbacks: ObserveCallbacks<TProjection>) {
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
	}

	static _observeChangesCallbacksAreOrdered<T extends { _id: string }>(callbacks: ObserveChangesCallbacks<T>) {
		if (callbacks.added && callbacks.addedBefore) {
			throw new Error('Please specify only one of added() and addedBefore()');
		}

		return !!(callbacks.addedBefore || callbacks.movedBefore);
	}
}

// XXX maybe move these into another ObserveHelpers package or something

// _CachingChangeObserver is an object which receives observeChanges callbacks
// and keeps a cache of the current cursor state up to date in this.docs. Users
// of this class should read the docs field but not modify it. You should pass
// the "applyChange" field as the callbacks to the underlying observeChanges
// call. Optionally, you can specify your own observeChanges callbacks which are
// invoked immediately before the docs field is updated; this object is made
// available as `this` to those callbacks.
export class _CachingChangeObserver<T extends { _id: string }> {
	private ordered: boolean;

	docs: IdMap<T['_id'], T> | OrderedDict<T['_id'], T>;

	applyChange: any;

	constructor(options: any = {}) {
		const orderedFromCallbacks = options.callbacks && Cursor._observeChangesCallbacksAreOrdered(options.callbacks);

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
			this.docs = new OrderedDict<T['_id'], T>();
			this.applyChange = {
				addedBefore: (id: any, fields: any, before: any) => {
					// Take a shallow copy since the top-level properties can be changed
					const doc = { ...fields };

					doc._id = id;

					if (callbacks.addedBefore) {
						callbacks.addedBefore.call(this, id, clone(fields), before);
					}

					// This line triggers if we provide added with movedBefore.
					if (callbacks.added) {
						callbacks.added.call(this, id, clone(fields));
					}

					// XXX could `before` be a falsy ID?  Technically
					// idStringify seems to allow for them -- though
					// OrderedDict won't call stringify on a falsy arg.
					(this.docs as OrderedDict<T['_id'], T>).putBefore(id, doc, before || null);
				},
				movedBefore: (id: any, before: any) => {
					if (callbacks.movedBefore) {
						callbacks.movedBefore.call(this, id, before);
					}

					(this.docs as OrderedDict<T['_id'], T>).moveBefore(id, before || null);
				},
			};
		} else {
			this.docs = new IdMap<T['_id'], T>();
			this.applyChange = {
				added: (id: any, fields: any) => {
					// Take a shallow copy since the top-level properties can be changed
					const doc = { ...fields };

					if (callbacks.added) {
						callbacks.added.call(this, id, clone(fields));
					}

					doc._id = id;

					(this.docs as IdMap<T['_id'], T>).set(id, doc);
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
				callbacks.changed.call(this, id, clone(fields));
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
}

type ObserveCallbacks<T> = {
	addedAt?: (document: T, atIndex: number | null, before: unknown) => void;
	added?: (document: T) => void;
	changedAt?: (newDocument: T, oldDocument: T, atIndex: number) => void;
	changed?: (newDocument: T, oldDocument: T) => void;
	removedAt?: (document: T, atIndex: number) => void;
	removed?: (document: T) => void;
	movedTo?: (document: T, oldIndex: number, newIndex: number, before: unknown) => void;
	addedBefore?: (document: T, before: unknown) => void;
	movedBefore?: (document: T, before: unknown) => void;
	_suppress_initial?: boolean;
	_no_indices?: boolean;
	_allow_unordered?: boolean;
};

type ObserveChangesCallbacks<T extends { _id: string }> = {
	addedBefore?: (this: _CachingChangeObserver<T>, id: T['_id'], fields: T, before: T['_id'] | null) => void;
	changed?: (this: _CachingChangeObserver<T>, id: T['_id'], fields: T) => void;
	movedBefore?: (this: _CachingChangeObserver<T>, id: T['_id'], before: T['_id'] | null) => void;
	removed?: (this: _CachingChangeObserver<T>, id: T['_id']) => void;
	added?: (this: _CachingChangeObserver<T>, id: T['_id'], fields: T) => void;
	_allow_unordered?: boolean;
	_suppress_initial?: boolean;
};
