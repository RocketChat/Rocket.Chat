import { AllowDeny } from './allow-deny.ts';
import { check, Match } from './check.ts';
import { DDP, type Connection } from './ddp-client.ts';
import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { LocalCollection } from './minimongo.ts';
import { ObjectID } from './mongo-id.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';

class LocalCollectionDriver {
	noConnCollections: Map<string, LocalCollection> = new Map();

	open(name?: string, conn?: { _mongo_livedata_collections?: Map<string, LocalCollection> }): LocalCollection {
		if (!name) {
			return new LocalCollection();
		}

		if (!conn) {
			return ensureCollection(name, this.noConnCollections);
		}

		if (!conn._mongo_livedata_collections) {
			conn._mongo_livedata_collections = new Map();
		}

		return ensureCollection(name, conn._mongo_livedata_collections);
	}
}

const driver = new LocalCollectionDriver();

function ensureCollection(name: string, collections: Map<string, LocalCollection>): LocalCollection {
	const collection = collections.get(name);
	if (collection) {
		return collection;
	}

	const newCollection = new LocalCollection(name);
	collections.set(name, newCollection);

	return newCollection;
}

// -----------------------------------------------------------------------------
// mongo/collection/collection_utils.js
// -----------------------------------------------------------------------------
export const ID_GENERATORS = {
	MONGO(name: string) {
		return function () {
			const src = name ? DDP.randomStream(`/collection/${name}`) : Random.insecure;
			return new ObjectID(src.hexString(24));
		};
	},
	STRING(name: string) {
		return function () {
			const src = name ? DDP.randomStream(`/collection/${name}`) : Random.insecure;
			return src.id();
		};
	},
};

export function setupConnection(name: string, options: { connection?: Connection | null }): Connection | null {
	if (!name || options.connection === null) return null;
	if (options.connection) return options.connection;
	return Meteor.connection;
}

export function setupDriver(_name: string, _connection: Connection | null, options: { _driver?: any }): LocalCollectionDriver {
	if (options._driver) return options._driver;
	return driver;
}

export function setupAutopublish(collection: LocalCollection, _name: string, options: { _preventAutopublish?: boolean }): void {
	if (Package.autopublish && !options._preventAutopublish && collection._connection && collection._connection.publish) {
		collection._connection.publish(null, () => collection.find(), {
			is_auto: true,
		});
	}
}

export function setupMutationMethods(collection, name, options) {
	if (options.defineMutationMethods === false) return;

	try {
		collection._defineMutationMethods({
			useExisting: options._suppressSameNameError === true,
		});
	} catch (error: any) {
		if (error.message === `A method named '/${name}/insertAsync' is already defined`) {
			throw new Error(`There is already a collection named "${name}"`);
		}
		throw error;
	}
}

export function validateCollectionName(name) {
	if (!name && name !== null) {
		Meteor._debug(
			'Warning: creating anonymous collection. It will not be ' +
				'saved or synchronized over the network. (Pass null for ' +
				'the collection name to turn off this warning.)',
		);
		name = null;
	}

	if (name !== null && typeof name !== 'string') {
		throw new Error('First argument to new Mongo.Collection must be a string or null');
	}

	return name;
}

export function normalizeOptions(options) {
	if (options && options.methods) {
		// Backwards compatibility hack with original signature
		options = { connection: options };
	}
	// Backwards compatibility: "connection" used to be called "manager".
	if (options && options.manager && !options.connection) {
		options.connection = options.manager;
	}

	const cleanedOptions = Object.fromEntries(Object.entries(options || {}).filter(([_, v]) => v !== undefined));

	// 2) Spread defaults first, then only the defined overrides
	return {
		connection: undefined,
		idGeneration: 'STRING',
		transform: null,
		_driver: undefined,
		_preventAutopublish: false,
		...cleanedOptions,
	};
}

// -----------------------------------------------------------------------------
// mongo/mongo_utils.js
// -----------------------------------------------------------------------------
export const normalizeProjection = (options?: { fields?: any; projection?: any }) => {
	// transform fields key in projection
	const { fields, projection, ...otherOptions } = options || {};
	// TODO: enable this comment when deprecating the fields option
	// Log.debug(`fields option has been deprecated, please use the new 'projection' instead`)

	return {
		...otherOptions,
		...(projection || fields ? { projection: fields || projection } : {}),
	};
};

export class Collection {
	constructor(name, options) {
		let _ID_GENERATORS$option;
		let _ID_GENERATORS;

		name = validateCollectionName(name);
		options = normalizeOptions(options);

		this._makeNewID =
			(_ID_GENERATORS$option = (_ID_GENERATORS = ID_GENERATORS)[options.idGeneration]) === null || _ID_GENERATORS$option === void 0
				? void 0
				: _ID_GENERATORS$option.call(_ID_GENERATORS, name);

		this._transform = options.transform;
		this.resolverType = options.resolverType;
		this._connection = setupConnection(name, options);

		const driver = setupDriver(name, this._connection, options);

		this._driver = driver;
		this._collection = driver.open(name, this._connection);
		this._name = name;
		this._settingUpReplicationPromise = this._maybeSetUpReplication(name, options);
		setupMutationMethods(this, name, options);
		setupAutopublish(this, name, options);
		Mongo._collections.set(name, this);
	}

	//-----------------------------------------------------------------------------
	// Internal API
	//-----------------------------------------------------------------------------

	async _publishCursor(cursor, sub, collection) {
		const observeHandle = await cursor.observeChanges(
			{
				added(id, fields) {
					sub.added(collection, id, fields);
				},

				changed(id, fields) {
					sub.changed(collection, id, fields);
				},

				removed(id) {
					sub.removed(collection, id);
				},
			},
			{ nonMutatingCallbacks: true },
		);

		sub.onStop(async () => {
			return await observeHandle.stop();
		});

		return observeHandle;
	}

	_rewriteSelector(selector) {
		const { fallbackId } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (_selectorIsId(selector)) selector = { _id: selector };

		if (Array.isArray(selector)) {
			throw new Error("Mongo selector can't be an array.");
		}

		if (!selector || ('_id' in selector && !selector._id)) {
			return { _id: fallbackId || Random.id() };
		}

		return selector;
	}

	_isRemoteCollection() {
		return this._connection && this._connection !== Meteor.server;
	}

	_getFindSelector(args) {
		if (args.length == 0) return {};
		return args[0];
	}

	_getFindOptions(args) {
		const [, options] = args || [];
		const newOptions = normalizeProjection(options);
		const self = this;

		if (args.length < 2) {
			return { transform: self._transform };
		}
		check(
			newOptions,
			Match.Optional(
				Match.ObjectIncluding({
					projection: Match.Optional(Match.OneOf(Object, undefined)),
					sort: Match.Optional(Match.OneOf(Object, Array, Function, undefined)),
					limit: Match.Optional(Match.OneOf(Number, undefined)),
					skip: Match.Optional(Match.OneOf(Number, undefined)),
				}),
			),
		);

		return { transform: self._transform, ...newOptions };
	}

	// -----------------------------------------------------------------------------
	//Replication
	// -----------------------------------------------------------------------------
	async _maybeSetUpReplication(name) {
		let _registerStoreResult;
		let _registerStoreResult$;
		const self = this;

		if (!(self._connection && self._connection.registerStoreClient && self._connection.registerStoreServer)) {
			return;
		}

		const wrappedStoreCommon = {
			saveOriginals() {
				self._collection.saveOriginals();
			},

			retrieveOriginals() {
				return self._collection.retrieveOriginals();
			},

			_getCollection() {
				return self;
			},
		};

		const wrappedStoreClient = {
			...{
				async beginUpdate(batchSize, reset) {
					if (batchSize > 1 || reset) self._collection.pauseObservers();
					if (reset) await self._collection.remove({});
				},

				update(msg) {
					const mongoId = ObjectID.parse(msg.id);
					const doc = self._collection._docs.get(mongoId);

					if (msg.msg === 'added' && doc) {
						msg.msg = 'changed';
					} else if (msg.msg === 'removed' && !doc) {
						return;
					} else if (msg.msg === 'changed' && !doc) {
						msg.msg = 'added';

						const _ref = msg.fields;

						for (const field in _ref) {
							const value = _ref[field];

							if (value === void 0) {
								delete msg.fields[field];
							}
						}
					}

					if (msg.msg === 'replace') {
						const { replace } = msg;

						if (!replace) {
							if (doc) self._collection.remove(mongoId);
						} else if (!doc) {
							self._collection.insert(replace);
						} else {
							self._collection.update(mongoId, replace);
						}
					} else if (msg.msg === 'added') {
						if (doc) {
							throw new Error('Expected not to find a document already present for an add');
						}

						self._collection.insert({ _id: mongoId, ...msg.fields });
					} else if (msg.msg === 'removed') {
						if (!doc) throw new Error('Expected to find a document already present for removed');

						self._collection.remove(mongoId);
					} else if (msg.msg === 'changed') {
						if (!doc) throw new Error('Expected to find a document to change');

						const keys = Object.keys(msg.fields);

						if (keys.length > 0) {
							const modifier = {};

							keys.forEach((key) => {
								const value = msg.fields[key];

								if (EJSON.equals(doc[key], value)) {
									return;
								}

								if (typeof value === 'undefined') {
									if (!modifier.$unset) {
										modifier.$unset = {};
									}

									modifier.$unset[key] = 1;
								} else {
									if (!modifier.$set) {
										modifier.$set = {};
									}

									modifier.$set[key] = value;
								}
							});

							if (Object.keys(modifier).length > 0) {
								self._collection.update(mongoId, modifier);
							}
						}
					} else {
						throw new Error("I don't know how to deal with this message");
					}
				},

				endUpdate() {
					self._collection.resumeObserversClient();
				},

				getDoc(id) {
					return self.findOne(id);
				},
			},
			...wrappedStoreCommon,
		};

		const registerStoreResult = self._connection.registerStoreClient(name, wrappedStoreClient);

		const message = 'There is already a collection named "'.concat(name, '"');

		const logWarn = () => {
			console.warn ? console.warn(message) : console.log(message);
		};

		if (!registerStoreResult) {
			return logWarn();
		}

		return (_registerStoreResult = registerStoreResult) === null || _registerStoreResult === void 0
			? void 0
			: (_registerStoreResult$ = _registerStoreResult.then) === null || _registerStoreResult$ === void 0
				? void 0
				: _registerStoreResult$.call(_registerStoreResult, (ok) => {
						if (!ok) {
							logWarn();
						}
					});
	}

	//-----------------------------------------------------------------------------
	// Synchronous CRUD operations
	//-----------------------------------------------------------------------------
	find() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return this._collection.find(this._getFindSelector(args), this._getFindOptions(args));
	}

	findOne(...args) {
		return this._collection.findOne(this._getFindSelector(args), this._getFindOptions(args));
	}

	_insert(doc, callback) {
		if (!doc) {
			throw new Error('insert requires an argument');
		}

		doc = Object.create(Object.getPrototypeOf(doc), Object.getOwnPropertyDescriptors(doc));

		if ('_id' in doc) {
			if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof ObjectID)) {
				throw new Error('Meteor requires document _id fields to be non-empty strings or ObjectIDs');
			}
		} else {
			let generateId = true;

			if (this._isRemoteCollection()) {
				const enclosing = DDP._CurrentMethodInvocation.get();

				if (!enclosing) {
					generateId = false;
				}
			}

			if (generateId) {
				doc._id = this._makeNewID();
			}
		}

		const chooseReturnValueFromCollectionResult = function (result) {
			if (Meteor._isPromise(result)) return result;

			if (doc._id) {
				return doc._id;
			}

			doc._id = result;

			return result;
		};

		const wrappedCallback = wrapCallback(callback, chooseReturnValueFromCollectionResult);

		if (this._isRemoteCollection()) {
			const result = this._callMutatorMethod('insert', [doc], wrappedCallback);

			return chooseReturnValueFromCollectionResult(result);
		}

		try {
			let result;

			if (wrappedCallback) {
				this._collection.insert(doc, wrappedCallback);
			} else {
				result = this._collection.insert(doc);
			}

			return chooseReturnValueFromCollectionResult(result);
		} catch (e) {
			if (callback) {
				callback(e);

				return null;
			}

			throw e;
		}
	}

	insert(doc, callback) {
		return this._insert(doc, callback);
	}

	update(selector, modifier) {
		for (var _len3 = arguments.length, optionsAndCallback = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
			optionsAndCallback[_key3 - 2] = arguments[_key3];
		}

		const callback = popCallbackFromArgs(optionsAndCallback);
		const options = { ...(optionsAndCallback[0] || null) };
		let insertedId;

		if (options && options.upsert) {
			if (options.insertedId) {
				if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID))
					throw new Error('insertedId must be string or ObjectID');

				insertedId = options.insertedId;
			} else if (!selector || !selector._id) {
				insertedId = this._makeNewID();
				options.generatedId = true;
				options.insertedId = insertedId;
			}
		}

		selector = Mongo.Collection._rewriteSelector(selector, { fallbackId: insertedId });

		const wrappedCallback = wrapCallback(callback);

		if (this._isRemoteCollection()) {
			const args = [selector, modifier, options];

			return this._callMutatorMethod('update', args, callback);
		}

		try {
			return this._collection.update(selector, modifier, options, wrappedCallback);
		} catch (e) {
			if (callback) {
				callback(e);

				return null;
			}

			throw e;
		}
	}

	remove(selector, callback) {
		selector = Mongo.Collection._rewriteSelector(selector);

		if (this._isRemoteCollection()) {
			return this._callMutatorMethod('remove', [selector], callback);
		}

		return this._collection.remove(selector);
	}

	upsert(selector, modifier, options, callback) {
		if (!callback && typeof options === 'function') {
			callback = options;
			options = {};
		}

		return this.update(selector, modifier, { ...options, _returnObject: true, upsert: true });
	}

	//-----------------------------------------------------------------------------
	// Asynchronous CRUD operations
	//-----------------------------------------------------------------------------

	findOneAsync() {
		for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
			args[_key] = arguments[_key];
		}

		return this._collection.findOneAsync(this._getFindSelector(args), this._getFindOptions(args));
	}

	_insertAsync(doc) {
		const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (!doc) {
			throw new Error('insert requires an argument');
		}

		doc = Object.create(Object.getPrototypeOf(doc), Object.getOwnPropertyDescriptors(doc));

		if ('_id' in doc) {
			if (!doc._id || !(typeof doc._id === 'string' || doc._id instanceof Mongo.ObjectID)) {
				throw new Error('Meteor requires document _id fields to be non-empty strings or ObjectIDs');
			}
		} else {
			let generateId = true;

			if (this._isRemoteCollection()) {
				const enclosing = DDP._CurrentMethodInvocation.get();

				if (!enclosing) {
					generateId = false;
				}
			}

			if (generateId) {
				doc._id = this._makeNewID();
			}
		}

		const chooseReturnValueFromCollectionResult = function (result) {
			if (Meteor._isPromise(result)) return result;

			if (doc._id) {
				return doc._id;
			}

			doc._id = result;

			return result;
		};

		if (this._isRemoteCollection()) {
			const promise = this._callMutatorMethodAsync('insertAsync', [doc], options);

			promise.then(chooseReturnValueFromCollectionResult);
			promise.stubPromise = promise.stubPromise.then(chooseReturnValueFromCollectionResult);
			promise.serverPromise = promise.serverPromise.then(chooseReturnValueFromCollectionResult);

			return promise;
		}

		return this._collection.insertAsync(doc).then(chooseReturnValueFromCollectionResult);
	}

	insertAsync(doc, options) {
		return this._insertAsync(doc, options);
	}

	updateAsync(selector, modifier) {
		const options = { ...((arguments.length <= 2 ? undefined : arguments[2]) || null) };
		let insertedId;

		if (options && options.upsert) {
			if (options.insertedId) {
				if (!(typeof options.insertedId === 'string' || options.insertedId instanceof Mongo.ObjectID))
					throw new Error('insertedId must be string or ObjectID');

				insertedId = options.insertedId;
			} else if (!selector || !selector._id) {
				insertedId = this._makeNewID();
				options.generatedId = true;
				options.insertedId = insertedId;
			}
		}

		selector = Mongo.Collection._rewriteSelector(selector, { fallbackId: insertedId });

		if (this._isRemoteCollection()) {
			const args = [selector, modifier, options];

			return this._callMutatorMethodAsync('updateAsync', args, options);
		}

		return this._collection.updateAsync(selector, modifier, options);
	}

	removeAsync(selector) {
		const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		selector = Mongo.Collection._rewriteSelector(selector);

		if (this._isRemoteCollection()) {
			return this._callMutatorMethodAsync('removeAsync', [selector], options);
		}

		return this._collection.removeAsync(selector);
	}

	async upsertAsync(selector, modifier, options) {
		return this.updateAsync(selector, modifier, { ...options, _returnObject: true, upsert: true });
	}

	countDocuments() {
		return this._collection.countDocuments(...arguments);
	}

	estimatedDocumentCount() {
		return this._collection.estimatedDocumentCount(...arguments);
	}
}

export const _collections = new Map<string, Collection>();

export const getCollection = (name: string) => {
	return _collections.get(name);
};

export const Mongo = {
	_collections,
	getCollection,
	Collection,
};

function wrapCallback(callback: Function | undefined, convertResult: Function | undefined = undefined): Function | undefined {
	return (
		callback &&
		function (error, result) {
			if (error) {
				callback(error);
			} else if (typeof convertResult === 'function') {
				callback(error, convertResult(result));
			} else {
				callback(error, result);
			}
		}
	);
}

function popCallbackFromArgs(args: unknown[]): ((error: any, result?: any) => void) | undefined {
	const last: unknown = args.at(-1);
	if (typeof last === 'function') {
		args.pop();
		return function (error, result) {
			last(error, result);
		};
	}

	if (last !== undefined) {
		return;
	}

	args.pop();
	return undefined;
}

Object.assign(Mongo.Collection.prototype, AllowDeny.CollectionPrototype);
