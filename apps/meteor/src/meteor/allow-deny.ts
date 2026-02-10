import { check, Match } from './check.ts';
import { EJSON } from './ejson.ts';
import { Meteor } from './meteor.ts';
import { LocalCollection } from './minimongo.ts';
import { Package } from './package-registry.ts';
import { hasOwn } from './utils/hasOwn.ts';
import { isKey } from './utils/isKey.ts';

// --- Types ---

type MongoDoc = Record<string, unknown>;
type ValidatorFn = (userId: string | null, doc: MongoDoc, fields?: string[], modifier?: MongoDoc) => boolean | Promise<boolean>;

type ValidatorSet = {
	allow: ValidatorFn[];
	deny: ValidatorFn[];
};

type CollectionValidators = {
	insert: ValidatorSet;
	update: ValidatorSet;
	remove: ValidatorSet;
	fetch: string[];
	fetchAllFields: boolean;
};

type AllowDenyOptions = {
	insert?: ValidatorFn;
	update?: ValidatorFn;
	remove?: ValidatorFn;
	fetch?: string[];
	transform?: ((doc: MongoDoc) => unknown) | undefined;
	[key: string]: unknown;
};

type MethodContext = {
	userId: string | null;
	isSimulation: boolean;
	connection: any;
};

// --- Constants ---

const ALLOWED_UPDATE_OPERATIONS = new Set([
	'$inc',
	'$set',
	'$unset',
	'$addToSet',
	'$pop',
	'$pullAll',
	'$pull',
	'$pushAll',
	'$push',
	'$bit',
]);

// --- Helper Functions ---

const asyncSome = async <T>(array: T[], predicate: (item: T) => boolean | Promise<boolean>): Promise<boolean> => {
	for (const item of array) {
		// eslint-disable-next-line no-await-in-loop
		if (await predicate(item)) return true;
	}
	return false;
};

const asyncEvery = async <T>(array: T[], predicate: (item: T) => boolean | Promise<boolean>): Promise<boolean> => {
	for (const item of array) {
		// eslint-disable-next-line no-await-in-loop
		if (!(await predicate(item))) return false;
	}
	return true;
};

const transformDoc = (validator: { transform?: ((doc: MongoDoc) => unknown) | null }, doc: MongoDoc): unknown => {
	if (validator.transform) return validator.transform(doc);
	return doc;
};

const docToValidate = (
	validator: { transform?: ((doc: MongoDoc) => unknown) | null },
	doc: MongoDoc,
	generatedId: string | null,
): unknown => {
	let ret = doc;
	if (validator.transform) {
		ret = EJSON.clone(doc);
		if (generatedId !== null) {
			ret._id = generatedId;
		}
		ret = validator.transform(ret) as MongoDoc;
	}
	return ret;
};

const throwIfSelectorIsNotId = (selector: unknown, methodName: string): void => {
	if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
		throw new Meteor.Error(403, `Not permitted. Untrusted code may only ${methodName} documents by ID.`);
	}
};

const validateUpdateMutator = (mutator: MongoDoc): string[] => {
	const keys = Object.keys(mutator);
	if (keys.length === 0) {
		throw new Meteor.Error(
			403,
			"Access denied. In a restricted collection you can only update documents, not replace them. Use a Mongo update operator, such as '$set'.",
		);
	}

	const modifiedFields: Record<string, boolean> = {};

	for (const op of keys) {
		if (op.charAt(0) !== '$') {
			throw new Meteor.Error(
				403,
				"Access denied. In a restricted collection you can only update documents, not replace them. Use a Mongo update operator, such as '$set'.",
			);
		}
		if (!ALLOWED_UPDATE_OPERATIONS.has(op)) {
			throw new Meteor.Error(403, `Access denied. Operator ${op} not allowed in a restricted collection.`);
		}

		const params = mutator[op] as Record<string, unknown>;
		for (const field of Object.keys(params)) {
			const rootField = field.indexOf('.') !== -1 ? field.substring(0, field.indexOf('.')) : field;
			modifiedFields[rootField] = true;
		}
	}

	return Object.keys(modifiedFields);
};

// --- Main Class Definition ---

/**
 * A class containing the logic for Allow/Deny security.
 * NOTE: Methods here are copied to CollectionPrototype below to ensure enumerability.
 */
class RestrictedCollectionMixin {
	// These properties are expected to exist on the instance mixing this class in.
	// We declare them for TypeScript, but they are initialized by the host Collection.
	public _name?: string;

	public _connection?: any;

	public _collection: any;

	public _prefix = '';

	public _validators: CollectionValidators = {
		insert: { allow: [], deny: [] },
		update: { allow: [], deny: [] },
		remove: { allow: [], deny: [] },
		fetch: [],
		fetchAllFields: false,
	};

	public _restricted = false;

	public _insecure?: boolean | undefined;

	public _transform?: (doc: MongoDoc) => unknown;

	// Stub for TS: Implemented by Mongo.Collection
	public _makeNewID(): string {
		throw new Error('Mixin requirement: _makeNewID not implemented');
	}

	/**
	 * @summary Allow users to write directly to this collection from client code.
	 */
	public allow(options: AllowDenyOptions): void {
		this._addValidator('allow', options);
	}

	/**
	 * @summary Override `allow` rules.
	 */
	public deny(options: AllowDenyOptions): void {
		this._addValidator('deny', options);
	}

	public _isInsecure(): boolean {
		if (this._insecure === undefined) return !!Package.insecure;
		return this._insecure;
	}

	public _updateFetch(fields?: string[]): void {
		if (!this._validators.fetchAllFields) {
			if (fields) {
				const union = new Set(this._validators.fetch);
				fields.forEach((f) => union.add(f));
				this._validators.fetch = Array.from(union);
			} else {
				this._validators.fetchAllFields = true;
				this._validators.fetch = [];
			}
		}
	}

	public _defineMutationMethods(options: { useExisting?: boolean } = {}): void {
		this._restricted = false;
		this._insecure = undefined;
		this._validators = {
			insert: { allow: [], deny: [] },
			update: { allow: [], deny: [] },
			remove: { allow: [], deny: [] },
			fetch: [],
			fetchAllFields: false,
		};

		if (!this._name) return; // anonymous collection

		this._prefix = `/${this._name}/`;

		// Setup mutation methods on the connection (Server or Simulation)
		if (this._connection) {
			const methods: Record<string, (...args: any[]) => any> = {};
			const methodNames = ['insertAsync', 'updateAsync', 'removeAsync', 'insert', 'update', 'remove'];

			for (const method of methodNames) {
				const fullMethodName = this._prefix + method;

				if (options.useExisting) {
					const handlerProp = Meteor.isClient ? '_methodHandlers' : 'method_handlers';
					if (this._connection[handlerProp] && typeof this._connection[handlerProp][fullMethodName] === 'function') {
						continue;
					}
				}

				methods[fullMethodName] = this._createMutationMethod(method);
			}

			this._connection.methods(methods);
		}
	}

	protected async _validatedInsertAsync(userId: string | null, doc: MongoDoc, generatedId: string | null): Promise<string> {
		// Deny Checks
		if (
			await asyncSome(this._validators.insert.deny, (validator) =>
				validator(userId, docToValidate(validator as any, doc, generatedId) as MongoDoc),
			)
		) {
			throw new Meteor.Error(403, 'Access denied');
		}

		// Allow Checks
		if (
			await asyncEvery(
				this._validators.insert.allow,
				(validator) => !validator(userId, docToValidate(validator as any, doc, generatedId) as MongoDoc),
			)
		) {
			throw new Meteor.Error(403, 'Access denied');
		}

		if (generatedId !== null) doc._id = generatedId;
		return this._collection.insertAsync(doc);
	}

	protected async _validatedUpdateAsync(userId: string | null, selector: unknown, mutator: MongoDoc, options: any): Promise<number> {
		check(mutator, Object);
		const safeOptions = Object.assign(Object.create(null), options);

		if (!LocalCollection._selectorIsIdPerhapsAsObject(selector)) {
			throw new Error('validated update should be of a single ID');
		}
		if (safeOptions.upsert) {
			throw new Meteor.Error(403, 'Access denied. Upserts not allowed in a restricted collection.');
		}

		const fields = validateUpdateMutator(mutator);
		const findOptions = this._getFindOptions();

		const doc = await this._collection.findOneAsync(selector, findOptions);
		if (!doc) return 0;

		// Deny Checks
		if (
			await asyncSome(this._validators.update.deny, (validator) =>
				validator(userId, transformDoc(validator as any, doc) as MongoDoc, fields, mutator),
			)
		) {
			throw new Meteor.Error(403, 'Access denied');
		}

		// Allow Checks
		if (
			await asyncEvery(
				this._validators.update.allow,
				(validator) => !validator(userId, transformDoc(validator as any, doc) as MongoDoc, fields, mutator),
			)
		) {
			throw new Meteor.Error(403, 'Access denied');
		}

		safeOptions._forbidReplace = true;
		return this._collection.updateAsync(selector, mutator, safeOptions);
	}

	protected async _validatedRemoveAsync(userId: string | null, selector: unknown): Promise<number> {
		const findOptions = this._getFindOptions();
		const doc = await this._collection.findOneAsync(selector, findOptions);
		if (!doc) return 0;

		// Deny Checks
		if (await asyncSome(this._validators.remove.deny, (validator) => validator(userId, transformDoc(validator as any, doc) as MongoDoc))) {
			throw new Meteor.Error(403, 'Access denied');
		}

		// Allow Checks
		if (
			await asyncEvery(this._validators.remove.allow, (validator) => !validator(userId, transformDoc(validator as any, doc) as MongoDoc))
		) {
			throw new Meteor.Error(403, 'Access denied');
		}

		return this._collection.removeAsync(selector);
	}

	private _getFindOptions() {
		const findOptions: Record<string, any> = { transform: null };
		if (!this._validators.fetchAllFields) {
			findOptions.fields = {};
			this._validators.fetch.forEach((fieldName) => {
				findOptions.fields[fieldName] = 1;
			});
		}
		return findOptions;
	}

	private _addValidator(allowOrDeny: 'allow' | 'deny', options: AllowDenyOptions) {
		const validKeys = new Set(['insert', 'update', 'remove', 'fetch', 'transform', 'insertAsync', 'updateAsync', 'removeAsync']);

		for (const key of Object.keys(options)) {
			if (!validKeys.has(key)) throw new Error(`${allowOrDeny}: Invalid key: ${key}`);
			if (key.includes('Async')) {
				const syncKey = key.replace('Async', '');
				Meteor.deprecate(`${allowOrDeny}: The "${key}" key is deprecated. Use "${syncKey}" instead.`);
			}
		}

		this._restricted = true;

		const operations = ['insert', 'update', 'remove'] as const;

		for (const name of operations) {
			// eslint-disable-next-line no-nested-ternary
			const providedName = hasOwn(options, `${name}Async`) ? `${name}Async` : hasOwn(options, name) ? name : null;

			if (providedName) {
				const validator = options[providedName];
				if (typeof validator !== 'function') {
					throw new Error(`${allowOrDeny}: Value for \`${providedName}\` must be a function`);
				}

				const validatorWithTransform: any = validator;
				if (options.transform === undefined) {
					validatorWithTransform.transform = this._transform;
				} else {
					validatorWithTransform.transform = LocalCollection.wrapTransform(options.transform);
				}

				this._validators[name][allowOrDeny].push(validatorWithTransform);
			}
		}

		if (options.update || options.remove || options.updateAsync || options.removeAsync || options.fetch) {
			if (options.fetch && !Array.isArray(options.fetch)) {
				throw new Error(`${allowOrDeny}: Value for \`fetch\` must be an array`);
			}
			this._updateFetch(options.fetch);
		}
	}

	private _createMutationMethod(methodName: string) {
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		return function (this: MethodContext, ...args: unknown[]) {
			check(args, [Match.Any]);
			const argArray = Array.from(args);
			try {
				return self._executeMutation(this, methodName, argArray);
			} catch (e: any) {
				if (e.name === 'MongoError' || e.name === 'BulkWriteError' || e.name === 'MongoBulkWriteError' || e.name === 'MinimongoError') {
					throw new Meteor.Error(409, e.toString());
				}
				throw e;
			}
		};
	}

	private async _executeMutation(methodContext: MethodContext, methodName: string, args: any[]): Promise<unknown> {
		const isInsert = methodName.includes('insert');
		const [firstArg] = args;

		// 1. ID Generation for Insert
		let generatedId: string | null = null;
		if (isInsert && !isKey(firstArg, '_id')) {
			generatedId = this._makeNewID();
		}

		// 2. Simulation Handling
		if (methodContext.isSimulation) {
			if (generatedId !== null && typeof firstArg === 'object' && firstArg !== null) {
				firstArg._id = generatedId;
			}
			return this._collection[methodName](...args);
		}

		// 3. Server Validation
		if (!isInsert) {
			throwIfSelectorIsNotId(firstArg, methodName);
		}

		const syncMethodName = methodName.replace('Async', '');
		const validatedMethodName =
			`_validated${syncMethodName.charAt(0).toUpperCase()}${syncMethodName.slice(1)}Async` as keyof RestrictedCollectionMixin;

		// 4. Restricted Mode (Allow/Deny)
		if (this._restricted) {
			if (this._validators[syncMethodName as 'insert' | 'update' | 'remove'].allow.length === 0) {
				throw new Meteor.Error(403, `Access denied. No allow validators set on restricted collection for method '${methodName}'.`);
			}

			const methodArgs = [methodContext.userId, ...args];
			if (isInsert) methodArgs.push(generatedId);

			return this[validatedMethodName](...methodArgs);
		}

		// 5. Insecure Mode
		if (this._isInsecure()) {
			if (generatedId !== null && typeof firstArg === 'object' && firstArg !== null) {
				(firstArg as MongoDoc)._id = generatedId;
			}
			const syncMethodsMapper = {
				insert: 'insertAsync',
				update: 'updateAsync',
				remove: 'removeAsync',
			} as const;
			const targetMethod = syncMethodsMapper[methodName as keyof typeof syncMethodsMapper] || methodName;
			return this._collection[targetMethod](...args);
		}

		// 6. Default Deny
		throw new Meteor.Error(403, 'Access denied');
	}
}

// --- MIXIN EXPORT LOGIC ---
// To support standard Object.assign/_.extend mixin patterns used by Meteor legacy packages,
// we must extract the class methods into a plain, enumerable object.
const CollectionPrototype: Record<string, any> = {};
const propertyNames = Object.getOwnPropertyNames(RestrictedCollectionMixin.prototype);

for (const name of propertyNames) {
	if (name === 'constructor') continue;
	const descriptor = Object.getOwnPropertyDescriptor(RestrictedCollectionMixin.prototype, name);
	if (descriptor) {
		Object.defineProperty(CollectionPrototype, name, { ...descriptor, enumerable: true });
	}
}

const AllowDeny = {
	CollectionPrototype,
};

export { AllowDeny, RestrictedCollectionMixin };

Package['allow-deny'] = {
	AllowDeny,
};
