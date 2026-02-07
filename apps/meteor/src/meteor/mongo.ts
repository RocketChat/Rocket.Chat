import { Random } from '@rocket.chat/random';
import EJSON from 'ejson';
import { AllowDeny } from 'meteor/allow-deny';
import { Meteor } from 'meteor/meteor';
import { LocalCollection } from 'meteor/minimongo';

import { check, Match } from './check.ts';
import { Log } from './logging.ts';
import { meteorInstall } from './modules-runtime.ts';
import { Package } from './package-registry.ts';

Package['core-runtime'].queue('mongo', () => {
	const { DDP } = Package['ddp-client'];
	const { MongoID } = Package['mongo-id'];
	let Mongo;

	const require = meteorInstall(
		{
			node_modules: {
				meteor: {
					mongo: {
						'local_collection_driver.js'(require, exports, module) {
							module.export({ LocalCollectionDriver: () => LocalCollectionDriver });

							const LocalCollectionDriver = new (class LocalCollectionDriver {
								constructor() {
									this.noConnCollections = Object.create(null);
								}

								open(name, conn) {
									if (!name) {
										return new LocalCollection();
									}

									if (!conn) {
										return ensureCollection(name, this.noConnCollections);
									}

									if (!conn._mongo_livedata_collections) {
										conn._mongo_livedata_collections = Object.create(null);
									}

									return ensureCollection(name, conn._mongo_livedata_collections);
								}
							})();

							function ensureCollection(name, collections) {
								return name in collections ? collections[name] : (collections[name] = new LocalCollection(name));
							}
						},

						'collection': {
							'collection.js'(require, exports, module) {
								!function (module1) {
									let _objectSpread;

									module1.link(
										'@babel/runtime/helpers/objectSpread2',
										{
											default(v) {
												_objectSpread = v;
											},
										},
										0,
									);

									let normalizeProjection;

									module1.link(
										'../mongo_utils',
										{
											normalizeProjection(v) {
												normalizeProjection = v;
											},
										},
										0,
									);

									let AsyncMethods;

									module1.link(
										'./methods_async',
										{
											AsyncMethods(v) {
												AsyncMethods = v;
											},
										},
										1,
									);

									let SyncMethods;

									module1.link(
										'./methods_sync',
										{
											SyncMethods(v) {
												SyncMethods = v;
											},
										},
										2,
									);

									let IndexMethods;

									module1.link(
										'./methods_index',
										{
											IndexMethods(v) {
												IndexMethods = v;
											},
										},
										3,
									);

									let ID_GENERATORS;
									let normalizeOptions;
									let setupAutopublish;
									let setupConnection;
									let setupDriver;
									let setupMutationMethods;
									let validateCollectionName;

									module1.link(
										'./collection_utils',
										{
											ID_GENERATORS(v) {
												ID_GENERATORS = v;
											},

											normalizeOptions(v) {
												normalizeOptions = v;
											},

											setupAutopublish(v) {
												setupAutopublish = v;
											},

											setupConnection(v) {
												setupConnection = v;
											},

											setupDriver(v) {
												setupDriver = v;
											},

											setupMutationMethods(v) {
												setupMutationMethods = v;
											},

											validateCollectionName(v) {
												validateCollectionName = v;
											},
										},
										4,
									);

									let ReplicationMethods;

									module1.link(
										'./methods_replication',
										{
											ReplicationMethods(v) {
												ReplicationMethods = v;
											},
										},
										5,
									);

									Mongo = {};

									Mongo.Collection = function Collection(name, options) {
										let _ID_GENERATORS$option;
										let _ID_GENERATORS;

										name = validateCollectionName(name);
										options = normalizeOptions(options);

										this._makeNewID =
											(_ID_GENERATORS$option = (_ID_GENERATORS = ID_GENERATORS)[options.idGeneration]) === null ||
											_ID_GENERATORS$option === void 0
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
									};

									Object.assign(Mongo.Collection.prototype, {
										_getFindSelector(args) {
											if (args.length == 0) return {};
											return args[0];
										},

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

											return _objectSpread({ transform: self._transform }, newOptions);
										},
									});

									Object.assign(Mongo.Collection, {
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
										},

										_rewriteSelector(selector) {
											const { fallbackId } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

											if (LocalCollection._selectorIsId(selector)) selector = { _id: selector };

											if (Array.isArray(selector)) {
												throw new Error("Mongo selector can't be an array.");
											}

											if (!selector || ('_id' in selector && !selector._id)) {
												return { _id: fallbackId || Random.id() };
											}

											return selector;
										},
									});

									Object.assign(Mongo.Collection.prototype, ReplicationMethods, SyncMethods, AsyncMethods, IndexMethods);

									Object.assign(Mongo.Collection.prototype, {
										_isRemoteCollection() {
											return this._connection && this._connection !== Meteor.server;
										},

										async dropCollectionAsync() {
											const self = this;

											if (!self._collection.dropCollectionAsync) throw new Error('Can only call dropCollectionAsync on server collections');

											await self._collection.dropCollectionAsync();
										},

										async createCappedCollectionAsync(byteSize, maxDocuments) {
											const self = this;

											if (!(await self._collection.createCappedCollectionAsync))
												throw new Error('Can only call createCappedCollectionAsync on server collections');

											await self._collection.createCappedCollectionAsync(byteSize, maxDocuments);
										},

										rawCollection() {
											const self = this;

											if (!self._collection.rawCollection) {
												throw new Error('Can only call rawCollection on server collections');
											}

											return self._collection.rawCollection();
										},

										rawDatabase() {
											const self = this;

											if (!(self._driver.mongo && self._driver.mongo.db)) {
												throw new Error('Can only call rawDatabase on server collections');
											}

											return self._driver.mongo.db;
										},
									});

									Object.assign(Mongo, {
										getCollection(name) {
											return this._collections.get(name);
										},
										_collections: new Map(),
									});

									Mongo.ObjectID = MongoID.ObjectID;
									Mongo.Cursor = LocalCollection.Cursor;
									Mongo.Collection.Cursor = Mongo.Cursor;
									Mongo.Collection.ObjectID = Mongo.ObjectID;
									Meteor.Collection = Mongo.Collection;
									Object.assign(Mongo.Collection.prototype, AllowDeny.CollectionPrototype);
								}.call(this, module);
							},

							'collection_utils.js'(require, exports, module) {
								let _objectSpread;

								module.link(
									'@babel/runtime/helpers/objectSpread2',
									{
										default(v) {
											_objectSpread = v;
										},
									},
									0,
								);

								module.export({
									ID_GENERATORS: () => ID_GENERATORS,
									setupConnection: () => setupConnection,
									setupDriver: () => setupDriver,
									setupAutopublish: () => setupAutopublish,
									setupMutationMethods: () => setupMutationMethods,
									validateCollectionName: () => validateCollectionName,
									normalizeOptions: () => normalizeOptions,
								});

								const ID_GENERATORS = {
									MONGO(name) {
										return function () {
											const src = name ? DDP.randomStream(`/collection/${name}`) : Random.insecure;

											return new Mongo.ObjectID(src.hexString(24));
										};
									},

									STRING(name) {
										return function () {
											const src = name ? DDP.randomStream(`/collection/${name}`) : Random.insecure;

											return src.id();
										};
									},
								};

								function setupConnection(name, options) {
									if (!name || options.connection === null) return null;
									if (options.connection) return options.connection;

									return true ? Meteor.connection : Meteor.server;
								}

								function setupDriver(name, connection, options) {
									if (options._driver) return options._driver;

									if (
										name &&
										connection === Meteor.server &&
										typeof MongoInternals !== 'undefined' &&
										MongoInternals.defaultRemoteCollectionDriver
									) {
										return MongoInternals.defaultRemoteCollectionDriver();
									}

									const { LocalCollectionDriver } = require('../local_collection_driver.js');

									return LocalCollectionDriver;
								}

								function setupAutopublish(collection, name, options) {
									if (Package.autopublish && !options._preventAutopublish && collection._connection && collection._connection.publish) {
										collection._connection.publish(null, () => collection.find(), { is_auto: true });
									}
								}

								function setupMutationMethods(collection, name, options) {
									if (options.defineMutationMethods === false) return;

									try {
										collection._defineMutationMethods({ useExisting: options._suppressSameNameError === true });
									} catch (error) {
										if (error.message === "A method named '/".concat(name, "/insertAsync' is already defined")) {
											throw new Error('There is already a collection named "'.concat(name, '"'));
										}

										throw error;
									}
								}

								function validateCollectionName(name) {
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

								function normalizeOptions(options) {
									if (options && options.methods) {
										options = { connection: options };
									}

									if (options && options.manager && !options.connection) {
										options.connection = options.manager;
									}

									const cleanedOptions = Object.fromEntries(
										Object.entries(options || {}).filter((_ref) => {
											const [_, v] = _ref;

											return v !== undefined;
										}),
									);

									return _objectSpread(
										{
											connection: undefined,
											idGeneration: 'STRING',
											transform: null,
											_driver: undefined,
											_preventAutopublish: false,
										},
										cleanedOptions,
									);
								}
							},

							'methods_async.js'(require, exports, module) {
								let _objectSpread;

								module.link(
									'@babel/runtime/helpers/objectSpread2',
									{
										default(v) {
											_objectSpread = v;
										},
									},
									0,
								);

								module.export({ AsyncMethods: () => AsyncMethods });

								const AsyncMethods = {
									findOneAsync() {
										for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
											args[_key] = arguments[_key];
										}

										return this._collection.findOneAsync(this._getFindSelector(args), this._getFindOptions(args));
									},

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
									},

									insertAsync(doc, options) {
										return this._insertAsync(doc, options);
									},

									updateAsync(selector, modifier) {
										const options = _objectSpread({}, (arguments.length <= 2 ? undefined : arguments[2]) || null);
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
									},

									removeAsync(selector) {
										const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

										selector = Mongo.Collection._rewriteSelector(selector);

										if (this._isRemoteCollection()) {
											return this._callMutatorMethodAsync('removeAsync', [selector], options);
										}

										return this._collection.removeAsync(selector);
									},

									async upsertAsync(selector, modifier, options) {
										return this.updateAsync(
											selector,
											modifier,
											_objectSpread(_objectSpread({}, options), {}, { _returnObject: true, upsert: true }),
										);
									},

									countDocuments() {
										return this._collection.countDocuments(...arguments);
									},

									estimatedDocumentCount() {
										return this._collection.estimatedDocumentCount(...arguments);
									},
								};
							},

							'methods_index.js'(require, exports, module) {
								module.export({ IndexMethods: () => IndexMethods });

								const IndexMethods = {
									async ensureIndexAsync(index, options) {
										const self = this;

										if (!self._collection.ensureIndexAsync || !self._collection.createIndexAsync)
											throw new Error('Can only call createIndexAsync on server collections');

										if (self._collection.createIndexAsync) {
											await self._collection.createIndexAsync(index, options);
										} else {
											Log.debug(
												"ensureIndexAsync has been deprecated, please use the new 'createIndexAsync' instead".concat(
													options !== null && options !== void 0 && options.name
														? ', index name: '.concat(options.name)
														: ', index: '.concat(JSON.stringify(index)),
												),
											);

											await self._collection.ensureIndexAsync(index, options);
										}
									},

									async createIndexAsync(index, options) {
										const self = this;

										if (!self._collection.createIndexAsync) throw new Error('Can only call createIndexAsync on server collections');

										try {
											await self._collection.createIndexAsync(index, options);
										} catch (e) {
											let _Meteor$settings;
											let _Meteor$settings$pack;
											let _Meteor$settings$pack2;

											if (
												e.message.includes('An equivalent index already exists with the same name but different options.') &&
												(_Meteor$settings = Meteor.settings) !== null &&
												_Meteor$settings !== void 0 &&
												(_Meteor$settings$pack = _Meteor$settings.packages) !== null &&
												_Meteor$settings$pack !== void 0 &&
												(_Meteor$settings$pack2 = _Meteor$settings$pack.mongo) !== null &&
												_Meteor$settings$pack2 !== void 0 &&
												_Meteor$settings$pack2.reCreateIndexOnOptionMismatch
											) {
												Log.info('Re-creating index '.concat(index, ' for ').concat(self._name, ' due to options mismatch.'));
												await self._collection.dropIndexAsync(index);
												await self._collection.createIndexAsync(index, options);
											} else {
												console.error(e);

												throw new Meteor.Error(
													'An error occurred when creating an index for collection "'.concat(self._name, ': ').concat(e.message),
												);
											}
										}
									},

									createIndex(index, options) {
										return this.createIndexAsync(index, options);
									},

									async dropIndexAsync(index) {
										const self = this;

										if (!self._collection.dropIndexAsync) throw new Error('Can only call dropIndexAsync on server collections');

										await self._collection.dropIndexAsync(index);
									},
								};
							},

							'methods_replication.js'(require, exports, module) {
								let _objectSpread;

								module.link(
									'@babel/runtime/helpers/objectSpread2',
									{
										default(v) {
											_objectSpread = v;
										},
									},
									0,
								);

								module.export({ ReplicationMethods: () => ReplicationMethods });

								const ReplicationMethods = {
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

										const wrappedStoreClient = _objectSpread(
											{
												async beginUpdate(batchSize, reset) {
													if (batchSize > 1 || reset) self._collection.pauseObservers();
													if (reset) await self._collection.remove({});
												},

												update(msg) {
													const mongoId = MongoID.idParse(msg.id);
													const doc = self._collection._docs.get(mongoId);

													if (true) {
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

														self._collection.insert(_objectSpread({ _id: mongoId }, msg.fields));
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
											wrappedStoreCommon,
										);

										const wrappedStoreServer = _objectSpread(
											{
												async beginUpdate(batchSize, reset) {
													if (batchSize > 1 || reset) self._collection.pauseObservers();
													if (reset) await self._collection.removeAsync({});
												},

												async update(msg) {
													const mongoId = MongoID.idParse(msg.id);
													const doc = self._collection._docs.get(mongoId);

													if (msg.msg === 'replace') {
														const { replace } = msg;

														if (!replace) {
															if (doc) await self._collection.removeAsync(mongoId);
														} else if (!doc) {
															await self._collection.insertAsync(replace);
														} else {
															await self._collection.updateAsync(mongoId, replace);
														}
													} else if (msg.msg === 'added') {
														if (doc) {
															throw new Error('Expected not to find a document already present for an add');
														}

														await self._collection.insertAsync(_objectSpread({ _id: mongoId }, msg.fields));
													} else if (msg.msg === 'removed') {
														if (!doc) throw new Error('Expected to find a document already present for removed');

														await self._collection.removeAsync(mongoId);
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
																await self._collection.updateAsync(mongoId, modifier);
															}
														}
													} else {
														throw new Error("I don't know how to deal with this message");
													}
												},

												async endUpdate() {
													await self._collection.resumeObserversServer();
												},

												async getDoc(id) {
													return self.findOneAsync(id);
												},
											},
											wrappedStoreCommon,
										);

										let registerStoreResult;

										if (true) {
											registerStoreResult = self._connection.registerStoreClient(name, wrappedStoreClient);
										} else {
											registerStoreResult = self._connection.registerStoreServer(name, wrappedStoreServer);
										}

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
									},
								};
							},

							'methods_sync.js'(require, exports, module) {
								let _objectSpread;

								module.link(
									'@babel/runtime/helpers/objectSpread2',
									{
										default(v) {
											_objectSpread = v;
										},
									},
									0,
								);

								module.export({ SyncMethods: () => SyncMethods });

								const SyncMethods = {
									find() {
										for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
											args[_key] = arguments[_key];
										}

										return this._collection.find(this._getFindSelector(args), this._getFindOptions(args));
									},

									findOne() {
										for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
											args[_key2] = arguments[_key2];
										}

										return this._collection.findOne(this._getFindSelector(args), this._getFindOptions(args));
									},

									_insert(doc, callback) {
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
									},

									insert(doc, callback) {
										return this._insert(doc, callback);
									},

									update(selector, modifier) {
										for (
											var _len3 = arguments.length, optionsAndCallback = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2;
											_key3 < _len3;
											_key3++
										) {
											optionsAndCallback[_key3 - 2] = arguments[_key3];
										}

										const callback = popCallbackFromArgs(optionsAndCallback);
										const options = _objectSpread({}, optionsAndCallback[0] || null);
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
									},

									remove(selector, callback) {
										selector = Mongo.Collection._rewriteSelector(selector);

										if (this._isRemoteCollection()) {
											return this._callMutatorMethod('remove', [selector], callback);
										}

										return this._collection.remove(selector);
									},

									upsert(selector, modifier, options, callback) {
										if (!callback && typeof options === 'function') {
											callback = options;
											options = {};
										}

										return this.update(
											selector,
											modifier,
											_objectSpread(_objectSpread({}, options), {}, { _returnObject: true, upsert: true }),
										);
									},
								};

								function wrapCallback(callback, convertResult) {
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

								function popCallbackFromArgs(args) {
									if (args.length && (args[args.length - 1] === undefined || args[args.length - 1] instanceof Function)) {
										return args.pop();
									}
								}
							},
						},

						'mongo_utils.js'(require, exports, module) {
							const _excluded = ['fields', 'projection'];
							let _objectSpread;

							module.link(
								'@babel/runtime/helpers/objectSpread2',
								{
									default(v) {
										_objectSpread = v;
									},
								},
								0,
							);

							let _objectWithoutProperties;

							module.link(
								'@babel/runtime/helpers/objectWithoutProperties',
								{
									default(v) {
										_objectWithoutProperties = v;
									},
								},
								1,
							);

							module.export({ normalizeProjection: () => normalizeProjection });

							const normalizeProjection = (options) => {
								const _ref = options || {};
								const { fields, projection } = _ref;
								const otherOptions = _objectWithoutProperties(_ref, _excluded);

								return _objectSpread(_objectSpread({}, otherOptions), projection || fields ? { projection: fields || projection } : {});
							};
						},
					},
				},
			},
		},
		{ extensions: ['.js', '.json', '.ts'] },
	);

	return {
		export() {
			return { Mongo };
		},
		require,
		eagerModulePaths: ['/node_modules/meteor/mongo/local_collection_driver.js', '/node_modules/meteor/mongo/collection/collection.js'],
	};
});
export const { Mongo } = Package.mongo;
