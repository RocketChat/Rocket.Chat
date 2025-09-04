import { createComparatorFromSort, createPredicateFromFilter } from '@rocket.chat/mongo-adapter';
import { Tracker } from 'meteor/tracker';
import type { Filter, Sort } from 'mongodb';

import { DiffSequence } from './DiffSequence';
import { IdMap } from './IdMap';
import type { LocalCollection } from './LocalCollection';
import { MinimongoError } from './MinimongoError';
import { ObserveHandle, ReactiveObserveHandle } from './ObserveHandle';
import { OrderedDict } from './OrderedDict';
import type { Query, OrderedQuery, UnorderedQuery } from './Query';
import { isPlainObject, clone, hasOwn } from './common';
import type { OrderedObserver, UnorderedObserver } from './observers';

type Transform<T> = ((doc: T) => any) | null | undefined;

type FieldSpecifier = {
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
	transform?: Transform<Partial<T>> | null | undefined;
};

type DispatchTransform<TTransform, T> = TTransform extends (...args: any) => any
	? ReturnType<TTransform>
	: TTransform extends null
		? T
		: Partial<T>;

type ObserveChangesOptions<T extends { _id: string }> = Partial<OrderedObserver<T, ICachingChangeObserver<T>>> & {
	_allow_unordered?: boolean;
	_suppress_initial?: boolean;
	_fromObserve?: boolean;
};

type ObserveOptions<T> = {
	addedAt?: (document: T, atIndex: number | null, before: unknown) => void;
	added?: (document: T) => void;
	changedAt?: (newDocument: T, oldDocument: T, atIndex: number) => void;
	changed?: (newDocument: T, oldDocument: T) => void;
	removedAt?: (document: T, atIndex: number) => void;
	removed?: (document: T) => void;
	movedTo?: (document: T, oldIndex: number, newIndex: number, before: unknown) => void;
	_suppress_initial?: boolean;
	_no_indices?: boolean;
};

export class Cursor<T extends { _id: string }, TOptions extends Options<T>> {
	private readonly predicate: (doc: T) => boolean;

	private readonly comparator: ((a: T, b: T) => number) | null;

	readonly skip: number;

	readonly limit: number | undefined;

	private readonly fields: FieldSpecifier | undefined;

	private readonly _projectionFn: (doc: T | Omit<T, '_id'>) => Partial<T>;

	private readonly _transform: Transform<Partial<T>> | null;

	private readonly reactive: boolean;

	constructor(
		protected collection: LocalCollection<T>,
		selector: Filter<T> | T['_id'],
		options?: TOptions,
	) {
		this.predicate = createPredicateFromFilter<T>(typeof selector === 'string' ? ({ _id: selector } as Filter<T>) : selector);
		this.comparator = options?.sort ? createComparatorFromSort(options.sort) : null;
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

		const transform = (doc: any, ruleTree: Record<string, unknown>): any => {
			if (Array.isArray(doc)) {
				return doc.map((subdoc) => transform(subdoc, ruleTree));
			}

			const result = details.including ? {} : clone(doc);

			Object.entries(ruleTree).forEach(([key, rule]) => {
				if (doc == null || !hasOwn.call(doc, key)) {
					return;
				}

				if (rule === Object(rule)) {
					if (doc[key as keyof typeof doc] === Object(doc[key as keyof typeof doc])) {
						result[key as keyof typeof doc] = transform(doc[key as keyof typeof doc], rule as Record<string, unknown>);
					}
				} else if (details.including) {
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
			throw new MinimongoError('fields option must be an object');
		}

		Object.entries(fields).forEach(([keyPath, value]) => {
			if (keyPath.split('.').includes('$')) {
				throw new MinimongoError("Minimongo doesn't support $ operator in projections yet.");
			}

			if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some((key) => key in value)) {
				throw new MinimongoError("Minimongo doesn't support operators in projections yet.");
			}

			if (![1, 0, true, false].includes(value)) {
				throw new MinimongoError('Projection values should be one of 1, 0, true, or false');
			}
		});
	}

	private projectionDetails(fields: FieldSpecifier) {
		let fieldsKeys = Object.keys(fields).sort();

		if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {
			fieldsKeys = fieldsKeys.filter((key) => key !== '_id');
		}

		let including: boolean | null = null;

		for (const keyPath of fieldsKeys) {
			const rule = !!fields[keyPath];

			if (including === null) {
				including = rule;
			}

			if (including !== rule) {
				throw new MinimongoError('You cannot currently mix including and excluding fields.');
			}
		}

		const projectionRulesTree = this.pathsToTree(
			fieldsKeys,
			(_path) => including,
			(_node, path, fullPath) => {
				throw new MinimongoError(
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

			const success = pathArray.slice(0, -1).every((key, i) => {
				if (!(key in tree)) {
					tree[key] = {};
				} else if (tree[key] !== Object(tree[key])) {
					tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path);

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

	private wrapTransform(transform: (Transform<Partial<T>> & { __wrappedTransform__?: boolean }) | null | undefined) {
		if (!transform) {
			return null;
		}

		if (transform.__wrappedTransform__) {
			return transform;
		}

		const wrapped = (doc: Partial<T>) => {
			if (!('_id' in doc)) {
				throw new MinimongoError('can only transform documents with _id');
			}

			const id = doc._id;

			const transformed = Tracker.nonreactive(() => transform(doc));

			if (!isPlainObject(transformed)) {
				throw new MinimongoError('transform must return object');
			}

			if (hasOwn.call(transformed, '_id')) {
				if (transformed._id !== id) {
					throw new MinimongoError("transformed document can't have different _id");
				}
			} else {
				transformed._id = id;
			}

			return transformed;
		};

		wrapped.__wrappedTransform__ = true;

		return wrapped;
	}

	count(): number {
		if (this.reactive) {
			this._depend({ added: true, removed: true }, true);
		}

		return this._getRawObjects({ ordered: true }).length;
	}

	fetch(): DispatchTransform<TOptions['transform'], T>[] {
		const result: DispatchTransform<TOptions['transform'], T>[] = [];

		this.forEach((doc) => {
			result.push(doc);
		});

		return result;
	}

	[Symbol.iterator](): Iterator<DispatchTransform<TOptions['transform'], T>> {
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

	[Symbol.asyncIterator](): AsyncIterator<DispatchTransform<TOptions['transform'], T>> {
		const syncResult = this[Symbol.iterator]();
		return {
			async next() {
				return Promise.resolve(syncResult.next());
			},
		};
	}

	forEach<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T>, index: number, cursor: this) => void>(
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
			const projection = this._projectionFn(element);

			if (this._transform) {
				callback.call(thisArg, this._transform(projection), i, this);
				return;
			}

			callback.call(thisArg, projection as DispatchTransform<TOptions['transform'], T>, i, this);
		});
	}

	getTransform() {
		return this._transform;
	}

	map<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T>, index: number, cursor: this) => unknown>(
		callback: TIterationCallback,
		thisArg?: ThisParameterType<TIterationCallback>,
	): ReturnType<TIterationCallback>[] {
		const result: ReturnType<TIterationCallback>[] = [];

		this.forEach((doc, i) => {
			result.push(callback.call(thisArg, doc, i, this) as ReturnType<TIterationCallback>);
		});

		return result;
	}

	observe(options: ObserveOptions<T>) {
		return this._observeFromObserveChanges(options);
	}

	observeAsync(options: ObserveOptions<T>) {
		return Promise.resolve(this.observe(options));
	}

	private _observeFromObserveChanges(observeCallbacks: ObserveOptions<T>) {
		const transform = this.getTransform() || ((doc: Partial<T>) => doc);
		let suppressed = !!observeCallbacks._suppress_initial;

		let changeObserver: ICachingChangeObserver<T>;

		if (this._observeCallbacksAreOrdered(observeCallbacks)) {
			const indices = !observeCallbacks._no_indices;

			changeObserver = new _CachingChangeOrderedObserver<T>({
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
							indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1,
							before,
						);
					} else {
						observeCallbacks.added?.(doc);
					}
				},
				changed(id, fields) {
					if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
						return;
					}

					const doc = clone(this.docs.get(id));
					if (!doc) {
						throw new MinimongoError(`Unknown id for changed: ${id}`);
					}

					const oldDoc = transform(clone(doc));

					DiffSequence.applyChanges(doc, fields);

					if (observeCallbacks.changedAt) {
						observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);
					} else {
						observeCallbacks.changed?.(transform(doc), oldDoc);
					}
				},
				movedBefore(id, before) {
					if (!observeCallbacks.movedTo) {
						return;
					}

					const from = indices ? this.docs.indexOf(id) : -1;
					// eslint-disable-next-line no-nested-ternary
					let to = indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1;

					if (to > from) {
						--to;
					}

					observeCallbacks.movedTo(transform(clone(this.docs.get(id)!)), from, to, before || null);
				},
				removed(id) {
					if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
						return;
					}

					const doc = transform(this.docs.get(id)!);

					if (observeCallbacks.removedAt) {
						observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);
					} else {
						observeCallbacks.removed?.(doc);
					}
				},
			});
		} else {
			changeObserver = new _CachingChangeUnorderedObserver<T>({
				added(id, fields) {
					if (!suppressed && observeCallbacks.added) {
						observeCallbacks.added(transform(Object.assign(fields, { _id: id })));
					}
				},
				changed(id, fields) {
					if (observeCallbacks.changed) {
						const oldDoc = this.docs.get(id)!;
						const doc = clone(oldDoc);

						DiffSequence.applyChanges(doc, fields);

						observeCallbacks.changed(transform(doc), transform(clone(oldDoc)));
					}
				},
				removed(id) {
					if (observeCallbacks.removed) {
						observeCallbacks.removed(transform(this.docs.get(id)!));
					}
				},
			});
		}

		changeObserver.applyChange._fromObserve = true;
		const handle = this.observeChanges(changeObserver.applyChange);

		const setSuppressed = (h: ObserveHandle<T>) => {
			if (h.isReady) suppressed = false;
			else
				h.isReadyPromise?.then(() => {
					suppressed = false;
				});
		};

		setSuppressed(handle);

		return handle;
	}

	observeChanges(options: ObserveChangesOptions<T>) {
		const ordered = Cursor._observeChangesCallbacksAreOrdered(options);

		if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {
			throw new MinimongoError(
				"Must use an ordered observe with skip or limit (i.e. 'addedBefore' " +
					"for observeChanges or 'addedAt' for observe, instead of 'added').",
			);
		}

		if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {
			throw new MinimongoError('You may not observe a cursor with {fields: {_id: 0}}');
		}

		const query: Partial<Query<T, TOptions>> = ordered
			? {
					cursor: this,
					dirty: false,
					ordered,
					projectionFn: this._projectionFn,
					resultsSnapshot: null,
					predicate: this.predicate,
					comparator: this.comparator,
				}
			: {
					cursor: this,
					dirty: false,
					ordered,
					projectionFn: this._projectionFn,
					resultsSnapshot: null,
					predicate: this.predicate,
					comparator: null,
				};

		query.results = this._getRawObjects({ ordered });

		if (this.collection.paused) {
			query.resultsSnapshot = ordered ? [] : new IdMap<T['_id'], T>();
		}

		const wrapCallback = <TFn extends (...args: any) => any>(fn: TFn | undefined) => {
			if (!fn) {
				return () => undefined;
			}

			const { collection } = this;

			return function (this: ThisParameterType<TFn>, ...args: Parameters<TFn>) {
				if (collection.paused) {
					return;
				}

				collection.observeQueue.queueTask(() => {
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

		if (this.reactive) {
			this.collection.queries.add(query as Query<T, TOptions>);
		}

		if (!options._suppress_initial && !this.collection.paused) {
			const handler = (doc: T) => {
				const fields: Omit<T, '_id'> & Partial<Pick<T, '_id'>> = clone(doc);

				delete fields._id;

				if (query.ordered) {
					(query as OrderedQuery<T, TOptions>).addedBefore(doc._id, this._projectionFn(fields), null);
				}

				(query as OrderedQuery<T, TOptions>).added(doc._id, this._projectionFn(fields));
			};

			if ((query as OrderedQuery<T, TOptions>).results.length) {
				for (const doc of (query as OrderedQuery<T, TOptions>).results) {
					handler(doc);
				}
			}

			if ((query as UnorderedQuery<T, TOptions>).results.size()) {
				(query as UnorderedQuery<T, TOptions>).results.forEach(handler);
			}
		}

		if (this.reactive) {
			return new ReactiveObserveHandle(query as Query<T>, this.collection);
		}

		return new ObserveHandle(this.collection);
	}

	async observeChangesAsync(options: ObserveChangesOptions<T>) {
		const handle = this.observeChanges(options);
		await handle.isReadyPromise;
		return handle;
	}

	private _depend(
		changers: Partial<Record<'added' | 'addedBefore' | 'changed' | 'movedBefore' | 'removed', boolean>>,
		_allowUnordered?: boolean,
	) {
		if (Tracker.active) {
			const dependency = new Tracker.Dependency();
			const notify = dependency.changed.bind(dependency);

			dependency.depend();

			const options: ObserveChangesOptions<T> = {
				_allow_unordered: _allowUnordered,
				_suppress_initial: true,
			};

			(['added', 'addedBefore', 'changed', 'movedBefore', 'removed'] as const).forEach((fn) => {
				if (changers[fn]) {
					options[fn] = notify;
				}
			});

			this.observeChanges(options);
		}
	}

	_getRawObjects(options: { ordered: true; applySkipLimit?: boolean }): T[];

	_getRawObjects(options: { ordered: false; applySkipLimit?: boolean }): IdMap<T['_id'], T>;

	_getRawObjects(options?: { ordered?: boolean; applySkipLimit?: boolean }): IdMap<T['_id'], T> | T[];

	_getRawObjects(options: { ordered?: boolean; applySkipLimit?: boolean } = {}): IdMap<T['_id'], T> | T[] {
		const applySkipLimit = options.applySkipLimit !== false;

		const results: T[] | IdMap<T['_id'], T> = options.ordered ? [] : new IdMap<T['_id'], T>();

		for (const doc of this.collection.store.getState().records.values()) {
			if (this.predicate(doc)) {
				if (options.ordered) {
					(results as T[]).push(doc);
				} else {
					(results as IdMap<T['_id'], T>).set(doc._id, doc);
				}
			}

			if (!applySkipLimit) {
				continue;
			}

			if ((!this.limit || !!this.skip || !!this.comparator || (results as T[]).length !== this.limit) === false) break;
		}

		if (!options.ordered) {
			return results;
		}

		if (this.comparator) {
			(results as T[]).sort(this.comparator);
		}

		if (!applySkipLimit || (!this.limit && !this.skip)) {
			return results;
		}

		return (results as T[]).slice(this.skip, this.limit ? this.limit + this.skip : (results as T[]).length);
	}

	countAsync(): Promise<number> {
		try {
			return Promise.resolve(this.count());
		} catch (error) {
			return Promise.reject(error);
		}
	}

	fetchAsync(): Promise<DispatchTransform<TOptions['transform'], T>[]> {
		try {
			return Promise.resolve(this.fetch());
		} catch (error) {
			return Promise.reject(error);
		}
	}

	forEachAsync<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T>, index: number, cursor: this) => void>(
		callback: TIterationCallback,
		thisArg: ThisParameterType<TIterationCallback>,
	): Promise<void> {
		try {
			return Promise.resolve(this.forEach(callback, thisArg));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	mapAsync<TIterationCallback extends (doc: DispatchTransform<TOptions['transform'], T>, index: number, cursor: this) => any>(
		callback: TIterationCallback,
		thisArg: ThisParameterType<TIterationCallback>,
	): Promise<ReturnType<TIterationCallback>[]> {
		try {
			return Promise.resolve(this.map(callback, thisArg));
		} catch (error) {
			return Promise.reject(error);
		}
	}

	private _observeCallbacksAreOrdered(callbacks: ObserveOptions<T>) {
		if (callbacks.added && callbacks.addedAt) {
			throw new MinimongoError('Please specify only one of added() and addedAt()');
		}

		if (callbacks.changed && callbacks.changedAt) {
			throw new MinimongoError('Please specify only one of changed() and changedAt()');
		}

		if (callbacks.removed && callbacks.removedAt) {
			throw new MinimongoError('Please specify only one of removed() and removedAt()');
		}

		return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);
	}

	static _observeChangesCallbacksAreOrdered<T extends { _id: string }>(callbacks: ObserveChangesOptions<T>) {
		if (callbacks.added && callbacks.addedBefore) {
			throw new MinimongoError('Please specify only one of added() and addedBefore()');
		}

		return !!(callbacks.addedBefore || callbacks.movedBefore);
	}
}

interface ICachingChangeObserver<T extends { _id: string }> {
	readonly applyChange: ObserveChangesOptions<T>;
}

class _CachingChangeOrderedObserver<T extends { _id: string }> implements ICachingChangeObserver<T> {
	readonly docs = new OrderedDict<T['_id'], Partial<T>>();

	readonly applyChange: ObserveChangesOptions<T>;

	constructor({ addedBefore, changed, movedBefore, removed }: Omit<OrderedObserver<T, _CachingChangeOrderedObserver<T>>, 'added'>) {
		this.docs = new OrderedDict<T['_id'], T>();

		this.applyChange = {
			addedBefore: (id, fields, before) => {
				const doc = { ...fields };

				doc._id = id;

				addedBefore.call(this, id, clone(fields), before);

				this.docs.putBefore(id, doc, before || null);
			},
			movedBefore: (id, before) => {
				movedBefore.call(this, id, before);

				this.docs.moveBefore(id, before || null);
			},
			changed: (id, fields) => {
				const doc = this.docs.get(id);

				if (!doc) {
					throw new MinimongoError(`Unknown id for changed: ${id}`);
				}

				changed.call(this, id, clone(fields));

				DiffSequence.applyChanges(doc, fields);
			},
			removed: (id) => {
				removed.call(this, id);

				this.docs.remove(id);
			},
		};
	}
}

class _CachingChangeUnorderedObserver<T extends { _id: string }> implements ICachingChangeObserver<T> {
	readonly docs = new IdMap<T['_id'], Partial<T>>();

	readonly applyChange: ObserveChangesOptions<T>;

	constructor({ added, changed, removed }: UnorderedObserver<T, _CachingChangeUnorderedObserver<T>>) {
		this.applyChange = {
			added: (id, fields) => {
				const doc = { ...fields };

				added.call(this, id, clone(fields));

				doc._id = id;

				this.docs.set(id, doc);
			},
			changed: (id, fields) => {
				const doc = this.docs.get(id);

				if (!doc) {
					throw new MinimongoError(`Unknown id for changed: ${id}`);
				}

				changed.call(this, id, clone(fields));

				DiffSequence.applyChanges(doc, fields);
			},
			removed: (id) => {
				removed.call(this, id);

				this.docs.remove(id);
			},
		};
	}
}
