// @ts-nocheck -- direct port of Meteor's minimongo (untyped, prototype-based JS);
// typing it is tracked separately. New code in this package must be fully typed.
//
// Trimmed relative to Meteor upstream: this port only backs the `users` and
// login-service-configuration collections, so the ordered-observe machinery,
// Sorter (`sort` option), geo operators ($near) and $where are not supported
// and throw if reached. Reactive fetch via unordered observeChanges is kept.
import { DiffSequence } from './diff-sequence';
import { EJSON } from './ejson';
import { IdMap } from './id-map';
import { ObjectID } from './mongo-id';
import { Random } from './random';
import { Tracker } from './tracker';

type IdSelector = string | number | ObjectID;

export const _selectorIsId = (selector: unknown): selector is IdSelector =>
	typeof selector === 'number' || typeof selector === 'string' || selector instanceof ObjectID;

export const _selectorIsIdPerhapsAsObject = (selector: unknown) =>
	_selectorIsId(selector) || (_selectorIsId(selector && selector._id) && Object.keys(selector).length === 1);

function getAsyncMethodName(method) {
	return `${method.replace('_', '')}Async`;
}

const ASYNC_CURSOR_METHODS = ['count', 'fetch', 'forEach', 'map'];

class ObserveHandle {}

const hasOwn = Object.prototype.hasOwnProperty;

class MiniMongoQueryError extends Error {}

const MinimongoError = (message, options = {}) => {
	if (typeof message === 'string' && options.field) {
		message += ` for field '${options.field}'`;
	}
	const error = new Error(message);
	error.name = 'MinimongoError';
	return error;
};

function nothingMatcher(_docOrBranchedValues: unknown) {
	return { result: false };
}

function everythingMatcher(_docOrBranchedValues: unknown) {
	return { result: true };
}

const _modify = (doc, modifier, options = {}) => {
	if (!_isPlainObject(modifier)) throw MinimongoError('Modifier must be an object');
	modifier = EJSON.clone(modifier);
	const isModifier = isOperatorObject(modifier);
	const newDoc = isModifier ? EJSON.clone(doc) : modifier;
	if (isModifier) {
		Object.keys(modifier).forEach((operator) => {
			const setOnInsert = options.isInsert && operator === '$setOnInsert';
			const modFunc = MODIFIERS[setOnInsert ? '$set' : operator];
			const operand = modifier[operator];
			if (!modFunc) throw MinimongoError(`Invalid modifier specified ${operator}`);
			Object.keys(operand).forEach((keypath) => {
				const arg = operand[keypath];
				if (keypath === '') throw MinimongoError('An empty update path is not valid.');
				const keyparts = keypath.split('.');
				if (!keyparts.every(Boolean)) throw MinimongoError(`The update path '${keypath}' contains an empty field name`);
				const target = findModTarget(newDoc, keyparts, {
					arrayIndices: options.arrayIndices,
					forbidArray: operator === '$rename',
					noCreate: NO_CREATE_MODIFIERS[operator],
				});
				modFunc(target, keyparts.pop(), arg, keypath, newDoc);
			});
		});
		if (doc._id && !EJSON.equals(doc._id, newDoc._id))
			throw MinimongoError(
				`After applying the update to the document {_id: "${doc._id}", ...}, the (immutable) field '_id' was found to have been altered`,
			);
	} else {
		if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) throw MinimongoError(`The _id field cannot be changed`);
		assertHasValidFieldNames(modifier);
	}
	Object.keys(doc).forEach((key) => {
		if (key !== '_id') delete doc[key];
	});
	Object.keys(newDoc).forEach((key) => {
		doc[key] = newDoc[key];
	});
};

const _checkSupportedProjection = (fields) => {
	if (fields !== Object(fields) || Array.isArray(fields)) throw MinimongoError('fields option must be an object');
	Object.keys(fields).forEach((keyPath) => {
		if (keyPath.split('.').includes('$')) throw MinimongoError("Minimongo doesn't support $ operator in projections yet.");
		const value = fields[keyPath];
		if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some((key) => hasOwn.call(value, key)))
			throw MinimongoError("Minimongo doesn't support operators in projections yet.");
		if (![1, 0, true, false].includes(value)) throw MinimongoError('Projection values should be one of 1, 0, true, or false');
	});
};

const _compileProjection = (fields) => {
	_checkSupportedProjection(fields);
	const _idProjection = fields._id === undefined ? true : fields._id;
	const details = projectionDetails(fields);
	const transform = (doc, ruleTree) => {
		if (Array.isArray(doc)) return doc.map((subdoc) => transform(subdoc, ruleTree));
		const result = details.including ? {} : EJSON.clone(doc);
		Object.keys(ruleTree).forEach((key) => {
			if (doc == null || !hasOwn.call(doc, key)) return;
			const rule = ruleTree[key];
			if (rule === Object(rule)) {
				if (doc[key] === Object(doc[key])) result[key] = transform(doc[key], rule);
			} else if (details.including) result[key] = EJSON.clone(doc[key]);
			else delete result[key];
		});
		return doc != null ? result : doc;
	};
	return (doc) => {
		const result = transform(doc, details.tree);
		if (_idProjection && hasOwn.call(doc, '_id')) result._id = doc._id;
		if (!_idProjection && hasOwn.call(result, '_id')) delete result._id;
		return result;
	};
};

const _isModificationMod = (mod) => {
	let isModify = false;
	let isReplace = false;
	Object.keys(mod).forEach((key) => {
		if (key.substr(0, 1) === '$') isModify = true;
		else isReplace = true;
	});
	if (isModify && isReplace) throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
	return isModify;
};

const _createUpsertDocument = (selector, modifier) => {
	const selectorDocument = populateDocumentWithQueryFields(selector);
	const isModify = _isModificationMod(modifier);
	const newDoc = {};
	if (selectorDocument._id) {
		newDoc._id = selectorDocument._id;
		delete selectorDocument._id;
	}
	_modify(newDoc, { $set: selectorDocument });
	_modify(newDoc, modifier, { isInsert: true });
	if (isModify) return newDoc;
	const replacement = Object.assign({}, modifier);
	if (newDoc._id) replacement._id = newDoc._id;
	return replacement;
};

const _idsMatchedBySelector = (selector): (string | number | ObjectID)[] | null => {
	if (_selectorIsId(selector)) return [selector];
	if (!selector) return null;
	if (hasOwn.call(selector, '_id')) {
		if (_selectorIsId(selector._id)) return [selector._id];
		if (selector._id && Array.isArray(selector._id.$in) && selector._id.$in.length && selector._id.$in.every(_selectorIsId))
			return selector._id.$in;
		return null;
	}
	if (Array.isArray(selector.$and)) {
		for (let i = 0; i < selector.$and.length; ++i) {
			const subIds = _idsMatchedBySelector(selector.$and[i]);
			if (subIds) return subIds;
		}
	}
	return null;
};

const _insertInResultsSync = (query, doc) => {
	const fields = EJSON.clone(doc);
	delete fields._id;
	query.added(doc._id, query.projectionFn(fields));
	query.results.set(doc._id, doc);
};

const _insertInResultsAsync = async (query, doc) => {
	const fields = EJSON.clone(doc);
	delete fields._id;
	await query.added(doc._id, query.projectionFn(fields));
	query.results.set(doc._id, doc);
};

const _observeChangesCallbacksAreOrdered = (callbacks) => {
	if (callbacks.added && callbacks.addedBefore) throw new Error('Please specify only one of added() and addedBefore()');
	return !!(callbacks.addedBefore || callbacks.movedBefore);
};

const _removeFromResultsSync = (query, doc) => {
	const id = doc._id;
	query.removed(doc._id);
	query.results.remove(id);
};

const _removeFromResultsAsync = async (query, doc) => {
	const id = doc._id;
	await query.removed(doc._id);
	query.results.remove(id);
};

const _updateInResultsSync = (query, doc, old_doc) => {
	if (!EJSON.equals(doc._id, old_doc._id)) throw new Error("Can't change a doc's _id while updating");
	const { projectionFn } = query;
	const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));
	if (Object.keys(changedFields).length) {
		query.changed(doc._id, changedFields);
		query.results.set(doc._id, doc);
	}
};

const _updateInResultsAsync = async (query, doc, old_doc) => {
	if (!EJSON.equals(doc._id, old_doc._id)) throw new Error("Can't change a doc's _id while updating");
	const { projectionFn } = query;
	const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));
	if (Object.keys(changedFields).length) {
		await query.changed(doc._id, changedFields);
		query.results.set(doc._id, doc);
	}
};

const wrapTransform = (transform) => {
	if (!transform) {
		return null;
	}
	if (transform.__wrappedTransform__) {
		return transform;
	}
	const wrapped = (doc) => {
		if (!hasOwn.call(doc, '_id')) {
			throw new Error('can only transform documents with _id');
		}
		const id = doc._id;
		const transformed = Tracker.nonreactive(() => transform(doc));
		if (!_isPlainObject(transformed)) {
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

class Cursor {
	matcher: Matcher;

	skip: number;

	constructor(collection, selector, options = {}) {
		this.collection = collection;
		this.matcher = new Matcher(selector);
		if (_selectorIsIdPerhapsAsObject(selector)) {
			this._selectorId = hasOwn.call(selector, '_id') ? selector._id : selector;
		} else {
			this._selectorId = undefined;
			if (options.sort) {
				throw MinimongoError('the sort option is not supported by @rocket.chat/meteor-client');
			}
		}
		this.skip = options.skip || 0;
		this.limit = options.limit;
		this.fields = options.projection || options.fields;
		this._projectionFn = _compileProjection(this.fields || {});
		this._transform = wrapTransform(options.transform);
		if (typeof Tracker !== 'undefined') {
			this.reactive = options.reactive === undefined ? true : options.reactive;
		}
	}

	count() {
		if (this.reactive) this._depend({ added: true, removed: true }, true);
		return this._getRawObjects({ ordered: true }).length;
	}

	fetch() {
		const result = [];
		this.forEach((doc) => {
			result.push(doc);
		});
		return result;
	}

	[Symbol.iterator]() {
		if (this.reactive) this._depend({ added: true, removed: true, changed: true });
		let index = 0;
		const objects = this._getRawObjects({ ordered: true });
		return {
			next: () => {
				if (index < objects.length) {
					let element = this._projectionFn(objects[index++]);
					if (this._transform) element = this._transform(element);
					return { value: element };
				}
				return { done: true };
			},
		};
	}

	[Symbol.asyncIterator]() {
		const syncResult = this[Symbol.iterator]();
		return {
			async next() {
				return Promise.resolve(syncResult.next());
			},
		};
	}

	forEach(callback, thisArg?: unknown) {
		if (this.reactive) this._depend({ added: true, removed: true, changed: true });
		this._getRawObjects({ ordered: true }).forEach((element, i) => {
			element = this._projectionFn(element);
			if (this._transform) element = this._transform(element);
			callback.call(thisArg, element, i, this);
		});
	}

	getTransform() {
		return this._transform;
	}

	map(callback, thisArg) {
		const result = [];
		this.forEach((doc, i) => {
			result.push(callback.call(thisArg, doc, i, this));
		});
		return result;
	}

	observeChanges(options) {
		if (_observeChangesCallbacksAreOrdered(options)) {
			throw MinimongoError('ordered observeChanges is not supported by @rocket.chat/meteor-client');
		}
		if (this.fields && (this.fields._id === 0 || this.fields._id === false))
			throw Error('You may not observe a cursor with {fields: {_id: 0}}');
		const query = {
			cursor: this,
			dirty: false,
			matcher: this.matcher,
			ordered: false,
			projectionFn: this._projectionFn,
			resultsSnapshot: null,
		};
		let qid;
		if (this.reactive) {
			qid = this.collection.next_qid++;
			this.collection.queries[qid] = query;
		}
		query.results = this._getRawObjects({ ordered: false });
		if (this.collection.paused) query.resultsSnapshot = new _IdMap();
		const wrapCallback = (fn) => {
			if (!fn) return () => {};
			const self = this;
			return function () {
				if (self.collection.paused) return;
				const args = arguments;
				self.collection._observeQueue.queueTask(() => {
					fn.apply(this, args);
				});
			};
		};
		query.added = wrapCallback(options.added);
		query.changed = wrapCallback(options.changed);
		query.removed = wrapCallback(options.removed);
		if (!options._suppress_initial && !this.collection.paused) {
			const handler = (doc) => {
				const fields = EJSON.clone(doc);
				delete fields._id;
				query.added(doc._id, this._projectionFn(fields));
			};
			if (query.results?.size?.()) query.results.forEach(handler);
		}
		const handle = Object.assign(new ObserveHandle(), {
			collection: this.collection,
			stop: () => {
				if (this.reactive) delete this.collection.queries[qid];
			},
			isReady: false,
			isReadyPromise: null,
		});
		if (this.reactive && Tracker.active) Tracker.onInvalidate(() => handle.stop());
		const drainResult = this.collection._observeQueue.drain();
		if (drainResult instanceof Promise) {
			handle.isReadyPromise = drainResult;
			drainResult.then(() => (handle.isReady = true));
		} else {
			handle.isReady = true;
			handle.isReadyPromise = Promise.resolve();
		}
		return handle;
	}

	observeChangesAsync(options) {
		return new Promise((resolve) => {
			const handle = this.observeChanges(options);
			handle.isReadyPromise.then(() => resolve(handle));
		});
	}

	_depend(changers) {
		if (Tracker.active) {
			const dependency = new Tracker.Dependency();
			const notify = dependency.changed.bind(dependency);
			dependency.depend();
			const options = { _suppress_initial: true };
			['added', 'changed', 'removed'].forEach((fn) => {
				if (changers[fn]) options[fn] = notify;
			});
			this.observeChanges(options);
		}
	}

	_getRawObjects(options = {}) {
		const applySkipLimit = options.applySkipLimit !== false;
		const results = options.ordered ? [] : new _IdMap();
		if (this._selectorId !== undefined) {
			if (applySkipLimit && this.skip) return results;
			const selectedDoc = this.collection._docs.get(this._selectorId);
			if (selectedDoc) {
				if (options.ordered) results.push(selectedDoc);
				else results.set(this._selectorId, selectedDoc);
			}
			return results;
		}
		this.collection._docs.forEach((doc, id) => {
			const matchResult = this.matcher.documentMatches(doc);
			if (matchResult.result) {
				if (options.ordered) results.push(doc);
				else results.set(id, doc);
			}
			if (!applySkipLimit) return true;
			return !this.limit || this.skip || results.length !== this.limit;
		});
		if (!options.ordered) return results;
		if (!applySkipLimit || (!this.limit && !this.skip)) return results;
		return results.slice(this.skip, this.limit ? this.limit + this.skip : results.length);
	}
}
ASYNC_CURSOR_METHODS.forEach((method) => {
	const asyncName = getAsyncMethodName(method);
	Cursor.prototype[asyncName] = function (...args) {
		try {
			return Promise.resolve(this[method].apply(this, args));
		} catch (error) {
			return Promise.reject(error);
		}
	};
});
const _f = {
	_type(v) {
		if (typeof v === 'number') return 1;
		if (typeof v === 'string') return 2;
		if (typeof v === 'boolean') return 8;
		if (Array.isArray(v)) return 4;
		if (v === null) return 10;
		if (v instanceof RegExp) return 11;
		if (typeof v === 'function') return 13;
		if (v instanceof Date) return 9;
		if (EJSON.isBinary(v)) return 5;
		if (v instanceof ObjectID) return 7;
		return 3;
	},

	_equal(a, b) {
		return EJSON.equals(a, b, { keyOrderSensitive: true });
	},

	_typeorder(t) {
		return [-1, 1, 2, 3, 4, 5, -1, 6, 7, 8, 0, 9, -1, 100, 2, 100, 1, 8, 1][t];
	},

	_cmp(a, b) {
		if (a === undefined) return b === undefined ? 0 : -1;
		if (b === undefined) return 1;
		let ta = this._type(a);
		let tb = this._type(b);
		const oa = this._typeorder(ta);
		const ob = this._typeorder(tb);
		if (oa !== ob) return oa < ob ? -1 : 1;
		if (ta !== tb) throw Error('Missing type coercion logic in _cmp');
		if (ta === 7) {
			a = a.toHexString();
			b = b.toHexString();
			ta = tb = 2;
		}
		if (ta === 9) {
			a = isNaN(a) ? 0 : a.getTime();
			b = isNaN(b) ? 0 : b.getTime();
			ta = tb = 1;
		}
		if (ta === 1) return a - b;
		if (tb === 2) return a < b ? -1 : a === b ? 0 : 1;
		if (ta === 3) {
			const toArray = (object) => {
				const result = [];
				Object.keys(object).forEach((key) => {
					result.push(key, object[key]);
				});
				return result;
			};
			return this._cmp(toArray(a), toArray(b));
		}
		if (ta === 4) {
			for (let i = 0; ; i++) {
				if (i === a.length) return i === b.length ? 0 : -1;
				if (i === b.length) return 1;
				const s = this._cmp(a[i], b[i]);
				if (s !== 0) return s;
			}
		}
		if (ta === 5) {
			if (a.length !== b.length) return a.length - b.length;
			for (let i = 0; i < a.length; i++) {
				if (a[i] < b[i]) return -1;
				if (a[i] > b[i]) return 1;
			}
			return 0;
		}
		if (ta === 8) {
			if (a) return b ? 0 : 1;
			return b ? -1 : 0;
		}
		if (ta === 10) return 0;
		throw Error('Unknown type to sort');
	},
};

const _isPlainObject = (x) => {
	return x && _f._type(x) === 3;
};

class _IdMap extends IdMap<string | ObjectID | undefined> {
	constructor() {
		super(ObjectID.stringify, ObjectID.parse);
	}
}

const _useOID = false;
class LocalCollection {
	static _IdMap = _IdMap;

	static Cursor = Cursor;

	static ObserveHandle = ObserveHandle;

	static _f = _f;

	static _isPlainObject = _isPlainObject;

	static _modify = _modify;

	static _checkSupportedProjection = _checkSupportedProjection;

	static _compileProjection = _compileProjection;

	static _isModificationMod = _isModificationMod;

	static _createUpsertDocument = _createUpsertDocument;

	static wrapTransform = wrapTransform;

	static _diffObjects = DiffSequence.diffObjects;

	static _diffQueryChanges = DiffSequence.diffQueryChanges;

	static _diffQueryOrderedChanges = DiffSequence.diffQueryOrderedChanges;

	static _diffQueryUnorderedChanges = DiffSequence.diffQueryUnorderedChanges;

	static _idsMatchedBySelector = _idsMatchedBySelector;

	static _insertInResultsSync = _insertInResultsSync;

	static _insertInResultsAsync = _insertInResultsAsync;

	static _removeFromResultsSync = _removeFromResultsSync;

	static _removeFromResultsAsync = _removeFromResultsAsync;

	static _selectorIsId = _selectorIsId;

	static _updateInResultsSync = _updateInResultsSync;

	static _updateInResultsAsync = _updateInResultsAsync;

	static _observeChangesCallbacksAreOrdered = _observeChangesCallbacksAreOrdered;

	static _useOID = _useOID;

	constructor(name) {
		this.name = name;
		this._docs = new _IdMap();
		this._observeQueue = {
			queueTask: (task) => task(),
			drain: () => Promise.resolve(),
		};

		this.next_qid = 1;
		this.queries = Object.create(null);
		this._savedOriginals = null;
		this.paused = false;
	}

	countDocuments(selector, options) {
		return this.find(selector ?? {}, options).countAsync();
	}

	estimatedDocumentCount(options) {
		return this.find({}, options).countAsync();
	}

	find(selector, options) {
		if (arguments.length === 0) selector = {};
		return new Cursor(this, selector, options);
	}

	findOne(selector, options = {}) {
		if (arguments.length === 0) selector = {};
		options.limit = 1;
		return this.find(selector, options).fetch()[0];
	}

	async findOneAsync(selector, options = {}) {
		if (arguments.length === 0) selector = {};
		options.limit = 1;
		return (await this.find(selector, options).fetchAsync())[0];
	}

	prepareInsert(doc) {
		if (!hasOwn.call(doc, '_id')) doc._id = _useOID ? new ObjectID() : Random.id();
		const id = doc._id;
		if (this._docs.has(id)) throw MinimongoError(`Duplicate _id '${id}'`);
		this._saveOriginal(id, undefined);
		this._docs.set(id, doc);
		return id;
	}

	insert(doc, callback) {
		doc = EJSON.clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = [];
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];
			if (query.dirty) continue;
			const matchResult = query.matcher.documentMatches(doc);
			if (matchResult.result) {
				if (query.cursor.skip || query.cursor.limit) queriesToRecompute.push(qid);
				else _insertInResultsSync(query, doc);
			}
		}
		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) this._recomputeResults(this.queries[qid]);
		});
		this._observeQueue.drain();
		if (callback) {
			setTimeout(() => callback(null, id), 0);
		}
		return id;
	}

	async insertAsync(doc, callback) {
		doc = EJSON.clone(doc);
		const id = this.prepareInsert(doc);
		const queriesToRecompute = [];
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];
			if (query.dirty) continue;
			const matchResult = query.matcher.documentMatches(doc);
			if (matchResult.result) {
				if (query.cursor.skip || query.cursor.limit) queriesToRecompute.push(qid);
				else await _insertInResultsAsync(query, doc);
			}
		}
		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) this._recomputeResults(this.queries[qid]);
		});
		await this._observeQueue.drain();
		if (callback) {
			setTimeout(() => callback(null, id), 0);
		}
		return id;
	}

	pauseObservers() {
		if (this.paused) return;
		this.paused = true;
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			query.resultsSnapshot = EJSON.clone(query.results);
		});
	}

	clearResultQueries(callback) {
		const result = this._docs.size();
		this._docs.clear();
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			query.results.clear();
		});
		if (callback) {
			setTimeout(() => callback(null, result), 0);
		}
		return result;
	}

	prepareRemove(selector) {
		const matcher = new Matcher(selector);
		const remove = [];
		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			if (matcher.documentMatches(doc).result) remove.push(id);
		});
		const queriesToRecompute = [];
		const queryRemove = [];
		for (let i = 0; i < remove.length; i++) {
			const removeId = remove[i];
			const removeDoc = this._docs.get(removeId);
			Object.keys(this.queries).forEach((qid) => {
				const query = this.queries[qid];
				if (query.dirty) return;
				if (query.matcher.documentMatches(removeDoc).result) {
					if (query.cursor.skip || query.cursor.limit) queriesToRecompute.push(qid);
					else queryRemove.push({ qid, doc: removeDoc });
				}
			});
			this._saveOriginal(removeId, removeDoc);
			this._docs.remove(removeId);
		}
		return { queriesToRecompute, queryRemove, remove };
	}

	remove(selector, callback) {
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) return this.clearResultQueries(callback);
		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);
		queryRemove.forEach((remove) => {
			const query = this.queries[remove.qid];
			if (query) {
				_removeFromResultsSync(query, remove.doc);
			}
		});
		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];
			if (query) this._recomputeResults(query);
		});
		this._observeQueue.drain();
		const result = remove.length;
		if (callback) {
			setTimeout(() => callback(null, result), 0);
		}
		return result;
	}

	async removeAsync(selector, callback) {
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) return this.clearResultQueries(callback);
		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);
		for (const remove of queryRemove) {
			const query = this.queries[remove.qid];
			if (query) {
				await _removeFromResultsAsync(query, remove.doc);
			}
		}
		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];
			if (query) this._recomputeResults(query);
		});
		await this._observeQueue.drain();
		const result = remove.length;
		if (callback) {
			setTimeout(() => callback(null, result), 0);
		}
		return result;
	}

	_resumeObservers() {
		if (!this.paused) return;
		this.paused = false;
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			if (query.dirty) {
				query.dirty = false;
				this._recomputeResults(query, query.resultsSnapshot);
			} else {
				DiffSequence.diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, { projectionFn: query.projectionFn });
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
		if (!this._savedOriginals) throw new Error('Called retrieveOriginals without saveOriginals');
		const originals = this._savedOriginals;
		this._savedOriginals = null;
		return originals;
	}

	saveOriginals() {
		if (this._savedOriginals) throw new Error('Called saveOriginals twice without retrieveOriginals');
		this._savedOriginals = new _IdMap();
	}

	prepareUpdate(selector) {
		const qidToOriginalResults = {};
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
				if (!(query.results instanceof _IdMap)) throw new Error('Assertion failed: query.results not an _IdMap');
				qidToOriginalResults[qid] = query.results.clone();
			}
		});
		return qidToOriginalResults;
	}

	finishUpdate({ options, updateCount, callback, insertedId }) {
		let result;
		if (options._returnObject) {
			result = { numberAffected: updateCount };
			if (insertedId !== undefined) result.insertedId = insertedId;
		} else {
			result = updateCount;
		}
		if (callback) {
			setTimeout(() => callback(null, result), 0);
		}
		return result;
	}

	async updateAsync(selector, mod, options, callback) {
		if (!callback && options instanceof Function) {
			callback = options;
			options = null;
		}
		if (!options) options = {};
		const matcher = new Matcher(selector, true);
		const qidToOriginalResults = this.prepareUpdate(selector);
		let recomputeQids = {};
		let updateCount = 0;
		await this._eachPossiblyMatchingDocAsync(selector, async (doc, id) => {
			const queryResult = matcher.documentMatches(doc);
			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQids = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);
				++updateCount;
				if (!options.multi) return false;
			}
			return true;
		});
		Object.keys(recomputeQids).forEach((qid) => {
			const query = this.queries[qid];
			if (query) this._recomputeResults(query, qidToOriginalResults[qid]);
		});
		await this._observeQueue.drain();
		let insertedId;
		if (updateCount === 0 && options.upsert) {
			const doc = _createUpsertDocument(selector, mod);
			if (!doc._id && options.insertedId) doc._id = options.insertedId;
			insertedId = await this.insertAsync(doc);
			updateCount = 1;
		}
		return this.finishUpdate({ options, insertedId, updateCount, callback });
	}

	update(selector, mod, options, callback) {
		if (!callback && options instanceof Function) {
			callback = options;
			options = null;
		}
		if (!options) options = {};
		const matcher = new Matcher(selector, true);
		const qidToOriginalResults = this.prepareUpdate(selector);
		let recomputeQids = {};
		let updateCount = 0;
		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			const queryResult = matcher.documentMatches(doc);
			if (queryResult.result) {
				this._saveOriginal(id, doc);
				recomputeQids = this._modifyAndNotifySync(doc, mod, queryResult.arrayIndices);
				++updateCount;
				if (!options.multi) return false;
			}
			return true;
		});
		Object.keys(recomputeQids).forEach((qid) => {
			const query = this.queries[qid];
			if (query) this._recomputeResults(query, qidToOriginalResults[qid]);
		});
		this._observeQueue.drain();
		let insertedId;
		if (updateCount === 0 && options.upsert) {
			const doc = _createUpsertDocument(selector, mod);
			if (!doc._id && options.insertedId) doc._id = options.insertedId;
			insertedId = this.insert(doc);
			updateCount = 1;
		}
		return this.finishUpdate({ options, insertedId, updateCount, callback, selector, mod });
	}

	upsert(selector, mod, options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}
		return this.update(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	upsertAsync(selector, mod, options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}
		return this.updateAsync(selector, mod, Object.assign({}, options, { upsert: true, _returnObject: true }), callback);
	}

	async _eachPossiblyMatchingDocAsync(selector, fn) {
		const specificIds = _idsMatchedBySelector(selector);
		if (specificIds) {
			for (const id of specificIds) {
				const doc = this._docs.get(id);
				if (doc && !(await fn(doc, id))) break;
			}
		} else {
			await this._docs.forEachAsync(fn);
		}
	}

	_eachPossiblyMatchingDocSync(selector, fn) {
		const specificIds = _idsMatchedBySelector(selector);
		if (specificIds) {
			for (const id of specificIds) {
				const doc = this._docs.get(id);
				if (doc && fn(doc, id) === false) break;
			}
		} else {
			this._docs.forEach(fn);
		}
	}

	_getMatchedDocAndModify(doc, mod, arrayIndices) {
		const matched_before = {};
		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];
			if (query.dirty) return;
			matched_before[qid] = query.results.has(doc._id);
		});
		return matched_before;
	}

	_modifyAndNotifySync(doc, mod, arrayIndices) {
		const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
		const old_doc = EJSON.clone(doc);
		_modify(doc, mod, { arrayIndices });
		const recomputeQids = {};
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];
			if (query.dirty) continue;
			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matched_before[qid];
			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) recomputeQids[qid] = true;
			} else if (before && !after) _removeFromResultsSync(query, doc);
			else if (!before && after) _insertInResultsSync(query, doc);
			else if (before && after) _updateInResultsSync(query, doc, old_doc);
		}
		return recomputeQids;
	}

	async _modifyAndNotifyAsync(doc, mod, arrayIndices) {
		const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
		const old_doc = EJSON.clone(doc);
		_modify(doc, mod, { arrayIndices });
		const recomputeQids = {};
		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];
			if (query.dirty) continue;
			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matched_before[qid];
			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) recomputeQids[qid] = true;
			} else if (before && !after) await _removeFromResultsAsync(query, doc);
			else if (!before && after) await _insertInResultsAsync(query, doc);
			else if (before && after) await _updateInResultsAsync(query, doc, old_doc);
		}
		return recomputeQids;
	}

	_recomputeResults(query, oldResults) {
		if (this.paused) {
			query.dirty = true;
			return;
		}
		if (!this.paused && !oldResults) oldResults = query.results;
		query.results = query.cursor._getRawObjects({ ordered: query.ordered });
		if (!this.paused) {
			DiffSequence.diffQueryChanges(query.ordered, oldResults, query.results, query, { projectionFn: query.projectionFn });
		}
	}

	_saveOriginal(id, doc) {
		if (!this._savedOriginals) return;
		if (this._savedOriginals.has(id)) return;
		this._savedOriginals.set(id, EJSON.clone(doc));
	}
}

function isIndexable(obj) {
	return Array.isArray(obj) || _isPlainObject(obj);
}

function isNumericKey(s) {
	return /^[0-9]+$/.test(s);
}

function isOperatorObject(valueSelector, inconsistentOK) {
	if (!_isPlainObject(valueSelector)) {
		return false;
	}
	let theseAreOperators = undefined;
	Object.keys(valueSelector).forEach((selKey) => {
		const thisIsOperator = selKey.substr(0, 1) === '$' || selKey === 'diff';
		if (theseAreOperators === undefined) {
			theseAreOperators = thisIsOperator;
		} else if (theseAreOperators !== thisIsOperator) {
			if (!inconsistentOK) {
				throw new MiniMongoQueryError(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
			}
			theseAreOperators = false;
		}
	});
	return !!theseAreOperators;
}

function makeInequality(cmpValueComparator) {
	return {
		compileElementSelector(operand) {
			if (Array.isArray(operand)) return () => false;
			if (operand === undefined) operand = null;
			const operandType = _f._type(operand);
			return (value) => {
				if (value === undefined) value = null;
				if (_f._type(value) !== operandType) return false;
				return cmpValueComparator(_f._cmp(value, operand));
			};
		},
	};
}

const ELEMENT_OPERATORS = {
	$lt: makeInequality((cmpValue) => cmpValue < 0),
	$gt: makeInequality((cmpValue) => cmpValue > 0),
	$lte: makeInequality((cmpValue) => cmpValue <= 0),
	$gte: makeInequality((cmpValue) => cmpValue >= 0),
	$mod: {
		compileElementSelector(operand) {
			if (!(Array.isArray(operand) && operand.length === 2))
				throw new MiniMongoQueryError('argument to $mod must be an array of two numbers');
			const divisor = operand[0];
			const remainder = operand[1];
			return (value) => typeof value === 'number' && value % divisor === remainder;
		},
	},
	$in: {
		compileElementSelector(operand) {
			if (!Array.isArray(operand)) throw new MiniMongoQueryError('$in needs an array');
			const elementMatchers = operand.map((option) => {
				if (option instanceof RegExp) return regexpElementMatcher(option);
				if (isOperatorObject(option)) throw new MiniMongoQueryError('cannot nest $ under $in');
				return equalityElementMatcher(option);
			});
			return (value) => {
				if (value === undefined) value = null;
				return elementMatchers.some((matcher) => matcher(value));
			};
		},
	},
	$size: {
		dontExpandLeafArrays: true,
		compileElementSelector(operand) {
			if (typeof operand === 'string') operand = 0;
			else if (typeof operand !== 'number') throw new MiniMongoQueryError('$size needs a number');
			return (value) => Array.isArray(value) && value.length === operand;
		},
	},
	$type: {
		dontIncludeLeafArrays: true,
		compileElementSelector(operand) {
			if (typeof operand === 'string') {
				const operandAliasMap = {
					double: 1,
					string: 2,
					object: 3,
					array: 4,
					binData: 5,
					undefined: 6,
					objectId: 7,
					bool: 8,
					date: 9,
					null: 10,
					regex: 11,
					dbPointer: 12,
					javascript: 13,
					symbol: 14,
					javascriptWithScope: 15,
					int: 16,
					timestamp: 17,
					long: 18,
					decimal: 19,
					minKey: -1,
					maxKey: 127,
				};
				operand = operandAliasMap[operand];
			}
			return (value) => value !== undefined && _f._type(value) === operand;
		},
	},
	$regex: {
		compileElementSelector(operand, valueSelector) {
			if (!(typeof operand === 'string' || operand instanceof RegExp)) throw new MiniMongoQueryError('$regex has to be a string or RegExp');
			let regexp;
			if (valueSelector.$options !== undefined) {
				const source = operand instanceof RegExp ? operand.source : operand;
				regexp = new RegExp(source, valueSelector.$options);
			} else if (operand instanceof RegExp) {
				regexp = operand;
			} else {
				regexp = new RegExp(operand);
			}
			return regexpElementMatcher(regexp);
		},
	},
	$elemMatch: {
		dontExpandLeafArrays: true,
		compileElementSelector(operand, valueSelector, matcher) {
			if (!_isPlainObject(operand)) throw new MiniMongoQueryError('$elemMatch need an object');
			const isDocMatcher = !isOperatorObject(
				Object.keys(operand)
					.filter((key) => !hasOwn.call(LOGICAL_OPERATORS, key))
					.reduce((a, b) => Object.assign(a, { [b]: operand[b] }), {}),
				true,
			);
			let subMatcher;
			if (isDocMatcher) subMatcher = compileDocumentSelector(operand, matcher, { inElemMatch: true });
			else subMatcher = compileValueSelector(operand, matcher);
			return (value) => {
				if (!Array.isArray(value)) return false;
				for (let i = 0; i < value.length; ++i) {
					const arrayElement = value[i];
					let arg;
					if (isDocMatcher) {
						if (!isIndexable(arrayElement)) return false;
						arg = arrayElement;
					} else {
						arg = [{ value: arrayElement, dontIterate: true }];
					}
					if (subMatcher(arg).result) return i;
				}
				return false;
			};
		},
	},
};

const LOGICAL_OPERATORS = {
	$and(subSelector, matcher, inElemMatch) {
		return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
	},
	$or(subSelector, matcher, inElemMatch) {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
		if (matchers.length === 1) return matchers[0];
		return (doc) => {
			const result = matchers.some((fn) => fn(doc).result);
			return { result };
		};
	},
	$nor(subSelector, matcher, inElemMatch) {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
		return (doc) => {
			const result = matchers.every((fn) => !fn(doc).result);
			return { result };
		};
	},
	$where() {
		throw new MiniMongoQueryError('$where is not supported by @rocket.chat/meteor-client');
	},
	$comment() {
		return () => ({ result: true });
	},
};

const VALUE_OPERATORS = {
	$eq(operand) {
		return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));
	},
	$not(operand, valueSelector, matcher) {
		return invertBranchedMatcher(compileValueSelector(operand, matcher));
	},
	$ne(operand) {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));
	},
	$nin(operand) {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
	},
	$exists(operand) {
		const exists = convertElementMatcherToBranchedMatcher((value) => value !== undefined);
		return operand ? exists : invertBranchedMatcher(exists);
	},
	$options(operand, valueSelector) {
		return everythingMatcher;
	},
	$all(operand, valueSelector, matcher) {
		if (!Array.isArray(operand)) throw new MiniMongoQueryError('$all requires array');
		if (operand.length === 0) return nothingMatcher;
		const branchedMatchers = operand.map((criterion) => {
			if (isOperatorObject(criterion)) throw new MiniMongoQueryError('no $ expressions in $all');
			return compileValueSelector(criterion, matcher);
		});
		return andBranchedMatchers(branchedMatchers);
	},
	$near() {
		throw new MiniMongoQueryError('geo operators ($near) are not supported by @rocket.chat/meteor-client');
	},
	$maxDistance() {
		throw new MiniMongoQueryError('geo operators ($maxDistance) are not supported by @rocket.chat/meteor-client');
	},
};

function andSomeMatchers(subMatchers) {
	if (subMatchers.length === 0) return everythingMatcher;
	if (subMatchers.length === 1) return subMatchers[0];
	return (docOrBranches) => {
		const match = {};
		match.result = subMatchers.every((fn) => {
			const subResult = fn(docOrBranches);
			if (subResult.result && subResult.distance !== undefined && match.distance === undefined) match.distance = subResult.distance;
			if (subResult.result && subResult.arrayIndices) match.arrayIndices = subResult.arrayIndices;
			return subResult.result;
		});
		if (!match.result) {
			delete match.distance;
			delete match.arrayIndices;
		}
		return match;
	};
}

const andDocumentMatchers = andSomeMatchers;
const andBranchedMatchers = andSomeMatchers;

function compileArrayOfDocumentSelectors(selectors, matcher, inElemMatch) {
	if (!Array.isArray(selectors) || selectors.length === 0) throw new MiniMongoQueryError('$and/$or/$nor must be nonempty array');
	return selectors.map((subSelector) => {
		if (!_isPlainObject(subSelector)) throw new MiniMongoQueryError('$or/$and/$nor entries need to be full objects');
		return compileDocumentSelector(subSelector, matcher, { inElemMatch });
	});
}

function compileDocumentSelector(docSelector, matcher, options = {}) {
	const docMatchers = Object.keys(docSelector)
		.map((key) => {
			const subSelector = docSelector[key];
			if (key.substr(0, 1) === '$') {
				if (!hasOwn.call(LOGICAL_OPERATORS, key)) throw new MiniMongoQueryError(`Unrecognized logical operator: ${key}`);
				matcher._isSimple = false;
				return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);
			}
			if (!options.inElemMatch) matcher._recordPathUsed(key);
			if (typeof subSelector === 'function') return undefined;
			const lookUpByIndex = makeLookupFunction(key);
			const valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);
			return (doc) => valueMatcher(lookUpByIndex(doc));
		})
		.filter(Boolean);
	return andDocumentMatchers(docMatchers);
}

function compileValueSelector(valueSelector, matcher, isRoot) {
	if (valueSelector instanceof RegExp) {
		matcher._isSimple = false;
		return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
	}
	if (isOperatorObject(valueSelector)) return operatorBranchedMatcher(valueSelector, matcher, isRoot);
	return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
}

function convertElementMatcherToBranchedMatcher(elementMatcher, options = {}) {
	return (branches) => {
		const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);
		const match = {};
		match.result = expanded.some((element) => {
			let matched = elementMatcher(element.value);
			if (typeof matched === 'number') {
				if (!element.arrayIndices) element.arrayIndices = [matched];
				matched = true;
			}
			if (matched && element.arrayIndices) match.arrayIndices = element.arrayIndices;
			return matched;
		});
		return match;
	};
}

function equalityElementMatcher(elementSelector) {
	if (isOperatorObject(elementSelector)) throw new MiniMongoQueryError("Can't create equalityValueSelector for operator object");
	if (elementSelector == null) return (value) => value == null;
	return (value) => _f._equal(elementSelector, value);
}

function expandArraysInBranches(branches, skipTheArrays) {
	const branchesOut = [];
	branches.forEach((branch) => {
		const thisIsArray = Array.isArray(branch.value);
		if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {
			branchesOut.push({ arrayIndices: branch.arrayIndices, value: branch.value });
		}
		if (thisIsArray && !branch.dontIterate) {
			branch.value.forEach((value, i) => {
				branchesOut.push({
					arrayIndices: (branch.arrayIndices || []).concat(i),
					value,
				});
			});
		}
	});
	return branchesOut;
}

function insertIntoDocument(document, key, value) {
	Object.keys(document).forEach((existingKey) => {
		if (
			(existingKey.length > key.length && existingKey.indexOf(`${key}.`) === 0) ||
			(key.length > existingKey.length && key.indexOf(`${existingKey}.`) === 0)
		) {
			throw new MiniMongoQueryError(`cannot infer query fields to set, both paths '${existingKey}' and '${key}' are matched`);
		} else if (existingKey === key) {
			throw new MiniMongoQueryError(`cannot infer query fields to set, path '${key}' is matched twice`);
		}
	});
	document[key] = value;
}

function invertBranchedMatcher(branchedMatcher) {
	return (branchValues) => {
		return { result: !branchedMatcher(branchValues).result };
	};
}

function makeLookupFunction(key, options = {}) {
	const parts = key.split('.');
	const firstPart = parts.length ? parts[0] : '';
	const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'), options);
	function buildResult(arrayIndices, dontIterate, value) {
		return arrayIndices && arrayIndices.length
			? dontIterate
				? [{ arrayIndices, dontIterate, value }]
				: [{ arrayIndices, value }]
			: dontIterate
				? [{ dontIterate, value }]
				: [{ value }];
	}
	return (doc, arrayIndices) => {
		if (Array.isArray(doc)) {
			if (!(isNumericKey(firstPart) && firstPart < doc.length)) return [];
			arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
		}
		const firstLevel = doc[firstPart];
		if (!lookupRest) return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
		if (!isIndexable(firstLevel)) {
			if (Array.isArray(doc)) return [];
			return buildResult(arrayIndices, false, undefined);
		}
		const result = [];
		result.push(...lookupRest(firstLevel, arrayIndices));
		if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {
			firstLevel.forEach((branch, arrayIndex) => {
				if (_isPlainObject(branch)) {
					result.push(...lookupRest(branch, arrayIndices ? arrayIndices.concat(arrayIndex) : [arrayIndex]));
				}
			});
		}
		return result;
	};
}

function operatorBranchedMatcher(valueSelector, matcher, isRoot) {
	const operatorMatchers = Object.keys(valueSelector).map((operator) => {
		const operand = valueSelector[operator];
		if (hasOwn.call(VALUE_OPERATORS, operator)) return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);
		if (hasOwn.call(ELEMENT_OPERATORS, operator)) {
			const options = ELEMENT_OPERATORS[operator];
			return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
		}
		throw new MiniMongoQueryError(`Unrecognized operator: ${operator}`);
	});
	return andBranchedMatchers(operatorMatchers);
}

function pathsToTree(paths, newLeafFn, conflictFn, root = {}) {
	paths.forEach((path) => {
		const pathArray = path.split('.');
		let tree = root;
		const success = pathArray.slice(0, -1).every((key, i) => {
			if (!hasOwn.call(tree, key)) tree[key] = {};
			else if (tree[key] !== Object(tree[key])) {
				tree[key] = conflictFn(tree[key], pathArray.slice(0, i + 1).join('.'), path);
				if (tree[key] !== Object(tree[key])) return false;
			}
			tree = tree[key];
			return true;
		});
		if (success) {
			const lastKey = pathArray[pathArray.length - 1];
			if (hasOwn.call(tree, lastKey)) tree[lastKey] = conflictFn(tree[lastKey], path, path);
			else tree[lastKey] = newLeafFn(path);
		}
	});
	return root;
}

function populateDocumentWithKeyValue(document, key, value) {
	if (value && Object.getPrototypeOf(value) === Object.prototype) populateDocumentWithObject(document, key, value);
	else if (!(value instanceof RegExp)) insertIntoDocument(document, key, value);
}

function populateDocumentWithObject(document, key, value) {
	const keys = Object.keys(value);
	const unprefixedKeys = keys.filter((op) => op[0] !== '$');
	if (unprefixedKeys.length > 0 || !keys.length) {
		if (keys.length !== unprefixedKeys.length) throw new MiniMongoQueryError(`unknown operator: ${unprefixedKeys[0]}`);
		validateObject(value, key);
		insertIntoDocument(document, key, value);
	} else {
		Object.keys(value).forEach((op) => {
			const object = value[op];
			if (op === '$eq') populateDocumentWithKeyValue(document, key, object);
			else if (op === '$all') object.forEach((element) => populateDocumentWithKeyValue(document, key, element));
		});
	}
}

function populateDocumentWithQueryFields(query, document = {}) {
	if (Object.getPrototypeOf(query) === Object.prototype) {
		Object.keys(query).forEach((key) => {
			const value = query[key];
			if (key === '$and') value.forEach((element) => populateDocumentWithQueryFields(element, document));
			else if (key === '$or') {
				if (value.length === 1) populateDocumentWithQueryFields(value[0], document);
			} else if (key[0] !== '$') populateDocumentWithKeyValue(document, key, value);
		});
	} else if (_selectorIsId(query)) insertIntoDocument(document, '_id', query);
	return document;
}

function projectionDetails(fields) {
	let fieldsKeys = Object.keys(fields).sort();
	if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id))
		fieldsKeys = fieldsKeys.filter((key) => key !== '_id');
	let including = null;
	fieldsKeys.forEach((keyPath) => {
		const rule = !!fields[keyPath];
		if (including === null) including = rule;
		if (including !== rule) throw MinimongoError('You cannot currently mix including and excluding fields.');
	});
	const projectionRulesTree = pathsToTree(
		fieldsKeys,
		(path) => including,
		(node, path, fullPath) => {
			throw MinimongoError(`both ${fullPath} and ${path} found in fields option.`);
		},
	);
	return { including, tree: projectionRulesTree };
}

function regexpElementMatcher(regexp) {
	return (value) => {
		if (value instanceof RegExp) return value.toString() === regexp.toString();
		if (typeof value !== 'string') return false;
		regexp.lastIndex = 0;
		return regexp.test(value);
	};
}

function validateKeyInPath(key, path) {
	if (key.includes('.')) throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
	if (key[0] === '$') throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
}

function validateObject(object, path) {
	if (object && Object.getPrototypeOf(object) === Object.prototype) {
		Object.keys(object).forEach((key) => {
			validateKeyInPath(key, path);
			validateObject(object[key], `${path}.${key}`);
		});
	}
}

class Matcher {
	constructor(selector, isUpdate = false) {
		this._paths = {};
		this._hasGeoQuery = false;
		this._hasWhere = false;
		this._isSimple = true;
		this._matchingDocument = undefined;
		this._selector = null;
		this._docMatcher = this._compileSelector(selector);
		this._isUpdate = isUpdate;
	}

	documentMatches(doc) {
		if (doc !== Object(doc)) throw Error('documentMatches needs a document');
		return this._docMatcher(doc);
	}

	hasGeoQuery() {
		return this._hasGeoQuery;
	}

	hasWhere() {
		return this._hasWhere;
	}

	isSimple() {
		return this._isSimple;
	}

	_compileSelector(selector) {
		if (selector instanceof Function) {
			this._isSimple = false;
			this._selector = selector;
			this._recordPathUsed('');
			return (doc) => ({ result: !!selector.call(doc) });
		}
		if (_selectorIsId(selector)) {
			this._selector = { _id: selector };
			this._recordPathUsed('_id');
			return (doc) => ({ result: EJSON.equals(doc._id, selector) });
		}
		if (!selector || (hasOwn.call(selector, '_id') && !selector._id)) {
			this._isSimple = false;
			return nothingMatcher;
		}
		if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {
			throw new Error(`Invalid selector: ${selector}`);
		}
		this._selector = EJSON.clone(selector);
		return compileDocumentSelector(selector, this, { isRoot: true });
	}

	_getPaths() {
		return Object.keys(this._paths);
	}

	_recordPathUsed(path) {
		this._paths[path] = true;
	}
}

const MODIFIERS = {
	$currentDate(target, field, arg) {
		target[field] = new Date();
	},
	$inc(target, field, arg) {
		if (typeof arg !== 'number') throw MinimongoError('Modifier $inc allowed for numbers only');
		if (field in target && typeof target[field] !== 'number') throw MinimongoError('Cannot apply $inc modifier to non-number');
		if (field in target) target[field] += arg;
		else target[field] = arg;
	},
	$min(target, field, arg) {
		if (typeof arg !== 'number') throw MinimongoError('Modifier $min allowed for numbers only');
		if (field in target && typeof target[field] !== 'number') throw MinimongoError('Cannot apply $min modifier to non-number');
		if (!(field in target) || target[field] > arg) target[field] = arg;
	},
	$max(target, field, arg) {
		if (typeof arg !== 'number') throw MinimongoError('Modifier $max allowed for numbers only');
		if (field in target && typeof target[field] !== 'number') throw MinimongoError('Cannot apply $max modifier to non-number');
		if (!(field in target) || target[field] < arg) target[field] = arg;
	},
	$mul(target, field, arg) {
		if (typeof arg !== 'number') throw MinimongoError('Modifier $mul allowed for numbers only');
		if (field in target && typeof target[field] !== 'number') throw MinimongoError('Cannot apply $mul modifier to non-number');
		if (field in target) target[field] *= arg;
		else target[field] = 0;
	},
	$rename(target, field, arg, keypath, doc) {
		if (target !== undefined) {
			const object = target[field];
			delete target[field];
			const keyparts = arg.split('.');
			const target2 = findModTarget(doc, keyparts, { forbidArray: true });
			if (target2 === null) throw MinimongoError('$rename target field invalid');
			target2[keyparts.pop()] = object;
		}
	},
	$set(target, field, arg) {
		if (target !== Object(target)) {
			const err = MinimongoError('Cannot set property on non-object field');
			err.setPropertyError = true;
			throw err;
		}
		if (target === null) {
			const err = MinimongoError('Cannot set property on null');
			err.setPropertyError = true;
			throw err;
		}
		assertHasValidFieldNames(arg);
		target[field] = arg;
	},
	$setOnInsert(target, field, arg) {},
	$unset(target, field, arg) {
		if (target !== undefined) {
			if (target instanceof Array) {
				if (field in target) target[field] = null;
			} else delete target[field];
		}
	},
	$push(target, field, arg) {
		if (target[field] === undefined) target[field] = [];
		if (!(target[field] instanceof Array)) throw MinimongoError('Cannot apply $push modifier to non-array');
		if (!(arg && arg.$each)) {
			assertHasValidFieldNames(arg);
			target[field].push(arg);
			return;
		}
		const toPush = arg.$each;
		assertHasValidFieldNames(toPush);
		let position = undefined;
		if ('$position' in arg) position = arg.$position;
		let slice = undefined;
		if ('$slice' in arg) slice = arg.$slice;
		let sortFunction = undefined;
		if (arg.$sort) throw MinimongoError('$push with $sort is not supported by @rocket.chat/meteor-client');
		if (position === undefined) toPush.forEach((e) => target[field].push(e));
		else {
			const args = [position, 0].concat(toPush);
			target[field].splice(...args);
		}
		if (sortFunction) target[field].sort(sortFunction);
		if (slice !== undefined) {
			if (slice === 0) target[field] = [];
			else if (slice < 0) target[field] = target[field].slice(slice);
			else target[field] = target[field].slice(0, slice);
		}
	},
	$pushAll(target, field, arg) {
		if (!(typeof arg === 'object' && arg instanceof Array)) throw MinimongoError('$pushAll allowed for arrays only');
		assertHasValidFieldNames(arg);
		const toPush = target[field];
		if (toPush === undefined) target[field] = arg;
		else if (!(toPush instanceof Array)) throw MinimongoError('Cannot apply $pushAll to non-array');
		else toPush.push(...arg);
	},
	$addToSet(target, field, arg) {
		let isEach = false;
		if (typeof arg === 'object' && Object.keys(arg)[0] === '$each') isEach = true;
		const values = isEach ? arg.$each : [arg];
		assertHasValidFieldNames(values);
		const toAdd = target[field];
		if (toAdd === undefined) target[field] = values;
		else if (!(toAdd instanceof Array)) throw MinimongoError('Cannot apply $addToSet to non-array');
		else
			values.forEach((v) => {
				if (!toAdd.some((e) => _f._equal(v, e))) toAdd.push(v);
			});
	},
	$pop(target, field, arg) {
		if (target === undefined) return;
		const toPop = target[field];
		if (toPop === undefined) return;
		if (!(toPop instanceof Array)) throw MinimongoError('Cannot apply $pop to non-array');
		if (typeof arg === 'number' && arg < 0) toPop.splice(0, 1);
		else toPop.pop();
	},
	$pull(target, field, arg) {
		if (target === undefined) return;
		const toPull = target[field];
		if (toPull === undefined) return;
		if (!(toPull instanceof Array)) throw MinimongoError('Cannot apply $pull to non-array');
		let out;
		if (arg != null && typeof arg === 'object' && !(arg instanceof Array)) {
			const matcher = new Matcher(arg);
			out = toPull.filter((e) => !matcher.documentMatches(e).result);
		} else {
			out = toPull.filter((e) => !_f._equal(e, arg));
		}
		target[field] = out;
	},
	$pullAll(target, field, arg) {
		if (!(typeof arg === 'object' && arg instanceof Array)) throw MinimongoError('$pullAll allowed for arrays only');
		if (target === undefined) return;
		const toPull = target[field];
		if (toPull === undefined) return;
		if (!(toPull instanceof Array)) throw MinimongoError('Cannot apply $pullAll to non-array');
		target[field] = toPull.filter((o) => !arg.some((e) => _f._equal(o, e)));
	},
	$bit(target, field, arg) {
		throw MinimongoError('$bit is not supported');
	},
	$v() {},
};

const NO_CREATE_MODIFIERS = { $pop: true, $pull: true, $pullAll: true, $rename: true, $unset: true };
const invalidCharMsg = { '$': "start with '$'", '.': "contain '.'", '\0': 'contain null bytes' };
function assertHasValidFieldNames(doc) {
	if (doc && typeof doc === 'object')
		JSON.stringify(doc, (key, value) => {
			assertIsValidFieldName(key);
			return value;
		});
}
function assertIsValidFieldName(key) {
	let match;
	if (typeof key === 'string' && (match = key.match(/^\$|\.|\0/))) throw MinimongoError(`Key ${key} must not ${invalidCharMsg[match[0]]}`);
}
function findModTarget(doc, keyparts, options = {}) {
	let usedArrayIndex = false;
	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart = keyparts[i];
		if (!isIndexable(doc)) {
			if (options.noCreate) return undefined;
			const err = MinimongoError(`cannot use the part '${keypart}' to traverse ${doc}`);
			err.setPropertyError = true;
			throw err;
		}
		if (doc instanceof Array) {
			if (options.forbidArray) return null;
			if (keypart === '$') {
				if (usedArrayIndex) throw MinimongoError('Too many positional elements');
				if (!options.arrayIndices || !options.arrayIndices.length) throw MinimongoError('Positional operator did not find match');
				keypart = options.arrayIndices[0];
				usedArrayIndex = true;
			} else if (isNumericKey(keypart)) keypart = parseInt(keypart);
			else {
				if (options.noCreate) return undefined;
				throw MinimongoError(`can't append to array using string field name`);
			}
			if (last) keyparts[i] = keypart;
			if (options.noCreate && keypart >= doc.length) return undefined;
			while (doc.length < keypart) doc.push(null);
			if (!last) {
				if (doc.length === keypart) doc.push({});
				else if (typeof doc[keypart] !== 'object') throw MinimongoError(`can't modify field '${keyparts[i + 1]}' of list value`);
			}
		} else {
			assertIsValidFieldName(keypart);
			if (!(keypart in doc)) {
				if (options.noCreate) return undefined;
				if (!last) doc[keypart] = {};
			}
		}
		if (last) return doc;
		doc = doc[keypart];
	}
}

export { LocalCollection };
