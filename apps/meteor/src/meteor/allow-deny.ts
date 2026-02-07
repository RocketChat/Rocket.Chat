import { check, Match } from './check.ts';
import { DDP } from './ddp-client.ts';
import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { LocalCollection } from './minimongo.ts';
import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';

// Restrict default mutators on collection. allow() and deny() take the
// same options:
//
// options.insertAsync {Function(userId, doc)}
//   return true to allow/deny adding this document
//
// options.updateAsync {Function(userId, docs, fields, modifier)}
//   return true to allow/deny updating these documents.
//   `fields` is passed as an array of fields that are to be modified
//
// options.removeAsync {Function(userId, docs)}
//   return true to allow/deny removing these documents
//
// options.fetch {Array}
//   Fields to fetch for these validators. If any call to allow or deny
//   does not have this option then all fields are loaded.
//
// allow and deny can be called multiple times. The validators are
// evaluated as follows:
// - If neither deny() nor allow() has been called on the collection,
//   then the request is allowed if and only if the "insecure" smart
//   package is in use.
// - Otherwise, if any deny() function returns true, the request is denied.
// - Otherwise, if any allow() function returns true, the request is allowed.
// - Otherwise, the request is denied.
//
// Meteor may call your deny() and allow() functions in any order, and may not
// call all of them if it is able to make a decision without calling them all
// (so don't include side effects).

const AllowDeny = {
	CollectionPrototype: {},
};

// In the `mongo` package, we will extend Mongo.Collection.prototype with these
// methods
const { CollectionPrototype } = AllowDeny;

/**
 * @summary Allow users to write directly to this collection from client code, subject to limitations you define.
 * @locus Server
 * @method allow
 * @memberOf Mongo.Collection
 * @instance
 * @param {Object} options
 * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be allowed.
 * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
 * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
 */
CollectionPrototype.allow = function (options) {
	addValidator(this, 'allow', options);
};

/**
 * @summary Override `allow` rules.
 * @locus Server
 * @method deny
 * @memberOf Mongo.Collection
 * @instance
 * @param {Object} options
 * @param {Function} options.insert,update,remove Functions that look at a proposed modification to the database and return true if it should be denied, even if an [allow](#allow) rule says otherwise.
 * @param {String[]} options.fetch Optional performance enhancement. Limits the fields that will be fetched from the database for inspection by your `update` and `remove` functions.
 * @param {Function} options.transform Overrides `transform` on the  [`Collection`](#collections).  Pass `null` to disable transformation.
 */
CollectionPrototype.deny = function (options) {
	addValidator(this, 'deny', options);
};

CollectionPrototype._defineMutationMethods = function (options) {
	const self = this;
	options = options || {};

	// set to true once we call any allow or deny methods. If true, use
	// allow/deny semantics. If false, use insecure mode semantics.
	self._restricted = false;

	// Insecure mode (default to allowing writes). Defaults to 'undefined' which
	// means insecure iff the insecure package is loaded. This property can be
	// overriden by tests or packages wishing to change insecure mode behavior of
	// their collections.
	self._insecure = undefined;

	self._validators = {
		insert: { allow: [], deny: [] },
		update: { allow: [], deny: [] },
		remove: { allow: [], deny: [] },
		insertAsync: { allow: [], deny: [] },
		updateAsync: { allow: [], deny: [] },
		removeAsync: { allow: [], deny: [] },
		upsertAsync: { allow: [], deny: [] }, // dummy arrays; can't set these!
		fetch: [],
		fetchAllFields: false,
	};

	if (!self._name) return; // anonymous collection

	// XXX Think about method namespacing. Maybe methods should be
	// "Meteor:Mongo:insertAsync/NAME"?
	self._prefix = `/${self._name}/`;

	// Mutation Methods
	// Minimongo on the server gets no stubs; instead, by default
	// it wait()s until its result is ready, yielding.
	// This matches the behavior of macromongo on the server better.
	// XXX see #MeteorServerNull
	if (self._connection && (self._connection === Meteor.server || Meteor.isClient)) {
		const m = {};

		['insertAsync', 'updateAsync', 'removeAsync', 'insert', 'update', 'remove'].forEach((method) => {
			const methodName = self._prefix + method;

			if (options.useExisting) {
				const handlerPropName = Meteor.isClient ? '_methodHandlers' : 'method_handlers';
				// Do not try to create additional methods if this has already been called.
				// (Otherwise the .methods() call below will throw an error.)
				if (self._connection[handlerPropName] && typeof self._connection[handlerPropName][methodName] === 'function') return;
			}

			const isInsert = (name) => name.includes('insert');

			m[methodName] = function (/* ... */) {
				// All the methods do their own validation, instead of using check().
				check(arguments, [Match.Any]);
				const args = Array.from(arguments);
				try {
					// For an insert/insertAsync, if the client didn't specify an _id, generate one
					// now; because this uses DDP.randomStream, it will be consistent with
					// what the client generated. We generate it now rather than later so
					// that if (eg) an allow/deny rule does an insert/insertAsync to the same
					// collection (not that it really should), the generated _id will
					// still be the first use of the stream and will be consistent.
					//
					// However, we don't actually stick the _id onto the document yet,
					// because we want allow/deny rules to be able to differentiate
					// between arbitrary client-specified _id fields and merely
					// client-controlled-via-randomSeed fields.
					let generatedId = null;
					if (isInsert(method) && !hasOwn.call(args[0], '_id')) {
						generatedId = self._makeNewID();
					}

					if (this.isSimulation) {
						// In a client simulation, you can do any mutation (even with a
						// complex selector).
						if (generatedId !== null) {
							args[0]._id = generatedId;
						}
						return self._collection[method].apply(self._collection, args);
					}

					// This is the server receiving a method call from the client.

					// We don't allow arbitrary selectors in mutations from the client: only
					// single-ID selectors.
					if (!isInsert(method)) throwIfSelectorIsNotId(args[0], method);

					const syncMethodName = method.replace('Async', '');
					const syncValidatedMethodName = `_validated${method.charAt(0).toUpperCase()}${syncMethodName.slice(1)}`;
					// it forces to use async validated behavior
					const validatedMethodName = `${syncValidatedMethodName}Async`;

					if (self._restricted) {
						// short circuit if there is no way it will pass.
						if (self._validators[syncMethodName].allow.length === 0) {
							throw new Meteor.Error(403, `Access denied. No allow validators set on restricted ` + `collection for method '${method}'.`);
						}

						args.unshift(this.userId);
						isInsert(method) && args.push(generatedId);
						return self[validatedMethodName].apply(self, args);
					}
					if (self._isInsecure()) {
						if (generatedId !== null) args[0]._id = generatedId;
						// In insecure mode we use the server _collection methods, and these sync methods
						// do not exist in the server anymore, so we have this mapper to call the async methods
						// instead.
						const syncMethodsMapper = {
							insert: 'insertAsync',
							update: 'updateAsync',
							remove: 'removeAsync',
						};

						// In insecure mode, allow any mutation (with a simple selector).
						// XXX This is kind of bogus.  Instead of blindly passing whatever
						//     we get from the network to this function, we should actually
						//     know the correct arguments for the function and pass just
						//     them.  For example, if you have an extraneous extra null
						//     argument and this is Mongo on the server, the .wrapAsync'd
						//     functions like update will get confused and pass the
						//     "fut.resolver()" in the wrong slot, where _update will never
						//     invoke it. Bam, broken DDP connection.  Probably should just
						//     take this whole method and write it three times, invoking
						//     helpers for the common code.
						return self._collection[syncMethodsMapper[method] || method].apply(self._collection, args);
					}
					// In secure mode, if we haven't called allow or deny, then nothing
					// is permitted.
					throw new Meteor.Error(403, 'Access denied');
				} catch (e) {
					if (
						e.name === 'MongoError' ||
						// for old versions of MongoDB (probably not necessary but it's here just in case)
						e.name === 'BulkWriteError' ||
						// for newer versions of MongoDB (https://docs.mongodb.com/drivers/node/current/whats-new/#bulkwriteerror---mongobulkwriteerror)
						e.name === 'MongoBulkWriteError' ||
						e.name === 'MinimongoError'
					) {
						throw new Meteor.Error(409, e.toString());
					} else {
						throw e;
					}
				}
			};
		});

		self._connection.methods(m);
	}
};

CollectionPrototype._updateFetch = function (fields) {
	const self = this;

	if (!self._validators.fetchAllFields) {
		if (fields) {
			const union = Object.create(null);
			const add = (names) => names && names.forEach((name) => (union[name] = 1));
			add(self._validators.fetch);
			add(fields);
			self._validators.fetch = Object.keys(union);
		} else {
			self._validators.fetchAllFields = true;
			// clear fetch just to make sure we don't accidentally read it
			self._validators.fetch = null;
		}
	}
};

CollectionPrototype._isInsecure = function () {
	const self = this;
	if (self._insecure === undefined) return !!Package.insecure;
	return self._insecure;
};

async function asyncSome(array, predicate) {
	for (const item of array) {
		if (await predicate(item)) {
			return true;
		}
	}
	return false;
}

async function asyncEvery(array, predicate) {
	for (const item of array) {
		if (!(await predicate(item))) {
			return false;
		}
	}
	return true;
}

CollectionPrototype._validatedInsertAsync = async function (userId, doc, generatedId) {
	const self = this;
	// call user validators.
	// Any deny returns true means denied.
	if (
		await asyncSome(self._validators.insert.deny, async (validator) => {
			const result = validator(userId, docToValidate(validator, doc, generatedId));
			return Meteor._isPromise(result) ? await result : result;
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}
	// Any allow returns true means proceed. Throw error if they all fail.

	if (
		await asyncEvery(self._validators.insert.allow, async (validator) => {
			const result = validator(userId, docToValidate(validator, doc, generatedId));
			return !(Meteor._isPromise(result) ? await result : result);
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}

	// If we generated an ID above, insertAsync it now: after the validation, but
	// before actually inserting.
	if (generatedId !== null) doc._id = generatedId;

	return self._collection.insertAsync.call(self._collection, doc);
};

// Simulate a mongo `update` operation while validating that the access
// control rules set by calls to `allow/deny` are satisfied. If all
// pass, rewrite the mongo operation to use $in to set the list of
// document ids to change ##ValidatedChange
CollectionPrototype._validatedUpdateAsync = async function (userId, selector, mutator, options) {
	const self = this;

	check(mutator, Object);

	options = Object.assign(Object.create(null), options);

	if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) throw new Error('validated update should be of a single ID');

	// We don't support upserts because they don't fit nicely into allow/deny
	// rules.
	if (options.upsert) throw new Meteor.Error(403, 'Access denied. Upserts not ' + 'allowed in a restricted collection.');

	const noReplaceError =
		'Access denied. In a restricted collection you can only' +
		' update documents, not replace them. Use a Mongo update operator, such ' +
		"as '$set'.";

	const mutatorKeys = Object.keys(mutator);

	// compute modified fields
	const modifiedFields = {};

	if (mutatorKeys.length === 0) {
		throw new Meteor.Error(403, noReplaceError);
	}
	mutatorKeys.forEach((op) => {
		const params = mutator[op];
		if (op.charAt(0) !== '$') {
			throw new Meteor.Error(403, noReplaceError);
		} else if (!hasOwn.call(ALLOWED_UPDATE_OPERATIONS, op)) {
			throw new Meteor.Error(403, `Access denied. Operator ${op} not allowed in a restricted collection.`);
		} else {
			Object.keys(params).forEach((field) => {
				// treat dotted fields as if they are replacing their
				// top-level part
				if (field.indexOf('.') !== -1) field = field.substring(0, field.indexOf('.'));

				// record the field we are trying to change
				modifiedFields[field] = true;
			});
		}
	});

	const fields = Object.keys(modifiedFields);

	const findOptions = { transform: null };
	if (!self._validators.fetchAllFields) {
		findOptions.fields = {};
		self._validators.fetch.forEach((fieldName) => {
			findOptions.fields[fieldName] = 1;
		});
	}

	const doc = await self._collection.findOneAsync(selector, findOptions);
	if (!doc)
		// none satisfied!
		return 0;

	// call user validators.
	// Any deny returns true means denied.
	if (
		await asyncSome(self._validators.update.deny, async (validator) => {
			const factoriedDoc = transformDoc(validator, doc);
			const result = validator(userId, factoriedDoc, fields, mutator);
			return Meteor._isPromise(result) ? await result : result;
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}

	// Any allow returns true means proceed. Throw error if they all fail.
	if (
		await asyncEvery(self._validators.update.allow, async (validator) => {
			const factoriedDoc = transformDoc(validator, doc);
			const result = validator(userId, factoriedDoc, fields, mutator);
			return !(Meteor._isPromise(result) ? await result : result);
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}

	options._forbidReplace = true;

	// Back when we supported arbitrary client-provided selectors, we actually
	// rewrote the selector to include an _id clause before passing to Mongo to
	// avoid races, but since selector is guaranteed to already just be an ID, we
	// don't have to any more.

	return self._collection.updateAsync.call(self._collection, selector, mutator, options);
};

// Only allow these operations in validated updates. Specifically
// whitelist operations, rather than blacklist, so new complex
// operations that are added aren't automatically allowed. A complex
// operation is one that does more than just modify its target
// field. For now this contains all update operations except '$rename'.
// http://docs.mongodb.org/manual/reference/operators/#update
const ALLOWED_UPDATE_OPERATIONS = {
	$inc: 1,
	$set: 1,
	$unset: 1,
	$addToSet: 1,
	$pop: 1,
	$pullAll: 1,
	$pull: 1,
	$pushAll: 1,
	$push: 1,
	$bit: 1,
};

// Simulate a mongo `remove` operation while validating access control
// rules. See #ValidatedChange
CollectionPrototype._validatedRemoveAsync = async function (userId, selector) {
	const self = this;

	const findOptions = { transform: null };
	if (!self._validators.fetchAllFields) {
		findOptions.fields = {};
		self._validators.fetch.forEach((fieldName) => {
			findOptions.fields[fieldName] = 1;
		});
	}

	const doc = await self._collection.findOneAsync(selector, findOptions);
	if (!doc) return 0;

	// call user validators.
	// Any deny returns true means denied.
	if (
		await asyncSome(self._validators.remove.deny, async (validator) => {
			const result = validator(userId, transformDoc(validator, doc));
			return Meteor._isPromise(result) ? await result : result;
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}
	// Any allow returns true means proceed. Throw error if they all fail.
	if (
		await asyncEvery(self._validators.remove.allow, async (validator) => {
			const result = validator(userId, transformDoc(validator, doc));
			return !(Meteor._isPromise(result) ? await result : result);
		})
	) {
		throw new Meteor.Error(403, 'Access denied');
	}

	// Back when we supported arbitrary client-provided selectors, we actually
	// rewrote the selector to {_id: {$in: [ids that we found]}} before passing to
	// Mongo to avoid races, but since selector is guaranteed to already just be
	// an ID, we don't have to any more.

	return self._collection.removeAsync.call(self._collection, selector);
};

CollectionPrototype._callMutatorMethodAsync = function _callMutatorMethodAsync(name, args, options = {}) {
	// For two out of three mutator methods, the first argument is a selector
	const firstArgIsSelector = name === 'updateAsync' || name === 'removeAsync';
	if (firstArgIsSelector && !alreadyInSimulation()) {
		// If we're about to actually send an RPC, we should throw an error if
		// this is a non-ID selector, because the mutation methods only allow
		// single-ID selectors. (If we don't throw here, we'll see flicker.)
		throwIfSelectorIsNotId(args[0], name);
	}

	const mutatorMethodName = this._prefix + name;
	return this._connection.applyAsync(mutatorMethodName, args, {
		returnStubValue: this.resolverType === 'stub' || this.resolverType == null,
		// StubStream is only used for testing where you don't care about the server
		returnServerResultPromise: !this._connection._stream._isStub && this.resolverType !== 'stub',
		...options,
	});
};

CollectionPrototype._callMutatorMethod = function _callMutatorMethod(name, args, callback) {
	if (Meteor.isClient && !callback && !alreadyInSimulation()) {
		// Client can't block, so it can't report errors by exception,
		// only by callback. If they forget the callback, give them a
		// default one that logs the error, so they aren't totally
		// baffled if their writes don't work because their database is
		// down.
		// Don't give a default callback in simulation, because inside stubs we
		// want to return the results from the local collection immediately and
		// not force a callback.
		callback = function (err) {
			if (err) Meteor._debug(`${name} failed`, err);
		};
	}

	// For two out of three mutator methods, the first argument is a selector
	const firstArgIsSelector = name === 'update' || name === 'remove';
	if (firstArgIsSelector && !alreadyInSimulation()) {
		// If we're about to actually send an RPC, we should throw an error if
		// this is a non-ID selector, because the mutation methods only allow
		// single-ID selectors. (If we don't throw here, we'll see flicker.)
		throwIfSelectorIsNotId(args[0], name);
	}

	const mutatorMethodName = this._prefix + name;
	return this._connection.apply(mutatorMethodName, args, { returnStubValue: true }, callback);
};

function transformDoc(validator, doc) {
	if (validator.transform) return validator.transform(doc);
	return doc;
}

function docToValidate(validator, doc, generatedId) {
	let ret = doc;
	if (validator.transform) {
		ret = EJSON.clone(doc);
		// If you set a server-side transform on your collection, then you don't get
		// to tell the difference between "client specified the ID" and "server
		// generated the ID", because transforms expect to get _id.  If you want to
		// do that check, you can do it with a specific
		// `C.allow({insertAsync: f, transform: null})` validator.
		if (generatedId !== null) {
			ret._id = generatedId;
		}
		ret = validator.transform(ret);
	}
	return ret;
}

function addValidator(collection, allowOrDeny, options) {
	// validate keys
	const validKeysRegEx = /^(?:insertAsync|updateAsync|removeAsync|insert|update|remove|fetch|transform)$/;
	Object.keys(options).forEach((key) => {
		if (!validKeysRegEx.test(key)) throw new Error(`${allowOrDeny}: Invalid key: ${key}`);

		// TODO deprecated async config on future versions
		const isAsyncKey = key.includes('Async');
		if (isAsyncKey) {
			const syncKey = key.replace('Async', '');
			Meteor.deprecate(`${allowOrDeny}: The "${key}" key is deprecated. Use "${syncKey}" instead.`);
		}
	});

	collection._restricted = true;

	['insertAsync', 'updateAsync', 'removeAsync', 'insert', 'update', 'remove'].forEach((name) => {
		if (hasOwn.call(options, name)) {
			if (!(options[name] instanceof Function)) {
				throw new Error(`${allowOrDeny}: Value for \`${name}\` must be a function`);
			}

			// If the transform is specified at all (including as 'null') in this
			// call, then take that; otherwise, take the transform from the
			// collection.
			if (options.transform === undefined) {
				options[name].transform = collection._transform; // already wrapped
			} else {
				options[name].transform = LocalCollection.wrapTransform(options.transform);
			}
			const isAsyncName = name.includes('Async');
			const validatorSyncName = isAsyncName ? name.replace('Async', '') : name;
			collection._validators[validatorSyncName][allowOrDeny].push(options[name]);
		}
	});

	// Only updateAsync the fetch fields if we're passed things that affect
	// fetching. This way allow({}) and allow({insertAsync: f}) don't result in
	// setting fetchAllFields
	if (options.updateAsync || options.removeAsync || options.fetch) {
		if (options.fetch && !(options.fetch instanceof Array)) {
			throw new Error(`${allowOrDeny}: Value for \`fetch\` must be an array`);
		}
		collection._updateFetch(options.fetch);
	}
}

function throwIfSelectorIsNotId(selector, methodName) {
	if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
		throw new Meteor.Error(403, `Not permitted. Untrusted code may only ${methodName} documents by ID.`);
	}
}

// Determine if we are in a DDP method simulation
function alreadyInSimulation() {
	const CurrentInvocation =
		DDP._CurrentMethodInvocation ||
		// For backwards compatibility, as explained in this issue:
		// https://github.com/meteor/meteor/issues/8947
		DDP._CurrentInvocation;

	const enclosing = CurrentInvocation.get();
	return enclosing?.isSimulation;
}

export { AllowDeny };

Package['allow-deny'] = {
	AllowDeny,
};
