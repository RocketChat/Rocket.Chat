import type { Document, Filter, FilterOperators, Sort, UpdateFilter } from 'mongodb';

import { getBSONType } from './bson';
import { assertHasValidFieldNames, assertIsValidFieldName, clone, isIndexable, isNumericKey, isPlainObject, equals } from './common';
import { createPredicateFromFilter } from './filter';
import { createComparatorFromSort } from './sort';
import { BSONType, type ArrayIndices } from './types';

const isUpdateModifiers = <T>(mod: UpdateFilter<T>): boolean => {
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
		throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
	}

	return isModify;
};

const $currentDate = <TField extends string>(target: Record<TField, Date>, field: TField, arg: { $type: 'date' } | true) => {
	if (typeof arg === 'object' && '$type' in arg) {
		if (arg.$type !== 'date') {
			throw new Error('Minimongo does currently only support the date type in $currentDate modifiers');
		}
	} else if (arg !== true) {
		throw new Error('Invalid $currentDate modifier');
	}

	target[field] = new Date();
};

const $inc = <TField extends string>(target: Record<TField, number>, field: TField, arg: number) => {
	if (typeof arg !== 'number') {
		throw new Error('Modifier $inc allowed for numbers only');
	}

	if (field in target) {
		if (typeof target[field] !== 'number') {
			throw new Error('Cannot apply $inc modifier to non-number');
		}

		target[field] += arg;
	} else {
		target[field] = arg;
	}
};

const $min = <TField extends string>(target: Record<TField, number>, field: TField, arg: number) => {
	if (typeof arg !== 'number') {
		throw new Error('Modifier $min allowed for numbers only');
	}

	if (field in target) {
		if (typeof target[field] !== 'number') {
			throw new Error('Cannot apply $min modifier to non-number');
		}

		if (target[field] > arg) {
			target[field] = arg;
		}
	} else {
		target[field] = arg;
	}
};

const $max = <TField extends string>(target: Record<TField, number>, field: TField, arg: number) => {
	if (typeof arg !== 'number') {
		throw new Error('Modifier $max allowed for numbers only');
	}

	if (field in target) {
		if (typeof target[field] !== 'number') {
			throw new Error('Cannot apply $max modifier to non-number');
		}

		if (target[field] < arg) {
			target[field] = arg;
		}
	} else {
		target[field] = arg;
	}
};

const $mul = <TField extends string>(target: Record<TField, number>, field: TField, arg: number) => {
	if (typeof arg !== 'number') {
		throw new Error('Modifier $mul allowed for numbers only');
	}

	if (field in target) {
		if (typeof target[field] !== 'number') {
			throw new Error('Cannot apply $mul modifier to non-number');
		}

		target[field] *= arg;
	} else {
		target[field] = 0;
	}
};

const $rename = <TField extends string>(
	target: Record<TField, object>,
	field: TField,
	arg: string,
	keypath: string,
	doc: Record<string, any>,
) => {
	if (keypath === arg) {
		throw new Error('$rename source must differ from target');
	}

	if (target === null) {
		throw new Error('$rename source field invalid');
	}

	if (typeof arg !== 'string') {
		throw new Error('$rename target must be a string');
	}

	if (arg.includes('\0')) {
		throw new Error("The 'to' field for $rename cannot contain an embedded null byte");
	}

	if (target === undefined) {
		return;
	}

	const object = target[field];

	delete target[field];

	const keyparts = arg.split('.');
	const target2 = findModTarget(doc, keyparts, { forbidArray: true });

	if (!target2) {
		throw new Error('$rename target field invalid');
	}

	target2[keyparts.pop() as keyof typeof target2] = object;
};

const $set = <TField extends string>(target: Record<TField, object>, field: TField, arg: object) => {
	if (target !== Object(target)) {
		throw new Error('Cannot set property on non-object field');
	}

	if (target === null) {
		throw new Error('Cannot set property on null');
	}

	assertHasValidFieldNames(arg);

	target[field] = arg;
};

const $unset = <TField extends number | string>(target: Record<TField, object> | (object | null)[], field: TField) => {
	if (target !== undefined) {
		if (Array.isArray(target)) {
			if (field in target) {
				target[field as number] = null;
			}
		} else {
			delete target[field];
		}
	}
};

const $push = <TField extends string, TItem>(
	target: Record<TField, TItem[]>,
	field: TField,
	arg: TItem | { $each?: TItem; $position?: number; $slice?: number; $sort?: Sort },
) => {
	if (target[field] === undefined) {
		target[field] = [];
	}

	if (!Array.isArray(target[field])) {
		throw new Error('Cannot apply $push modifier to non-array');
	}

	const isEachArgument = (arg: unknown): arg is { $each?: TItem[]; $position?: number; $slice?: number; $sort?: Sort } =>
		typeof arg === 'object' && arg !== null && '$each' in arg;

	if (!isEachArgument(arg)) {
		assertHasValidFieldNames(arg);

		target[field].push(arg as TItem);

		return;
	}

	const toPush = (arg as { $each: TItem[] }).$each;
	if (!Array.isArray(toPush)) {
		throw new Error('$each must be an array');
	}

	assertHasValidFieldNames(toPush);

	let position = undefined;
	if ('$position' in arg) {
		if (typeof arg.$position !== 'number') {
			throw new Error('$position must be a numeric value');
		}

		if (arg.$position < 0) {
			throw new Error('$position in $push must be zero or positive');
		}

		position = arg.$position;
	}

	let slice = undefined;
	if ('$slice' in arg) {
		if (typeof arg.$slice !== 'number') {
			throw new Error('$slice must be a numeric value');
		}

		slice = arg.$slice;
	}

	let sortFunction = undefined;
	if (arg.$sort) {
		if (slice === undefined) {
			throw new Error('$sort requires $slice to be present');
		}

		sortFunction = createComparatorFromSort(arg.$sort);

		for (const element of toPush) {
			if (getBSONType(element) !== BSONType.Object) {
				throw new Error('$push like modifiers using $sort require all elements to be objects');
			}
		}
	}

	if (position === undefined) {
		for (const element of toPush) {
			target[field].push(element);
		}
	} else {
		const spliceArguments: Parameters<typeof Array.prototype.splice> = [position, 0];

		for (const element of toPush) {
			spliceArguments.push(element);
		}

		target[field].splice(...spliceArguments);
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
};

const $addToSet = <TField extends string, TItem>(target: Record<TField, TItem[]>, field: TField, arg: TItem | { $each: TItem[] }) => {
	const isEachArgument = (arg: unknown): arg is { $each?: TItem[] } => {
		return typeof arg === 'object' && arg !== null && '$each' in arg && Array.isArray((arg as { $each: TItem[] }).$each);
	};

	const values = isEachArgument(arg) ? arg.$each : [arg];

	assertHasValidFieldNames(values);

	const toAdd = target[field];
	if (toAdd === undefined) {
		target[field] = values;
	} else if (!Array.isArray(toAdd)) {
		throw new Error('Cannot apply $addToSet modifier to non-array');
	} else {
		for (const value of values) {
			if (toAdd.some((element) => equals(value, element))) {
				continue;
			}

			toAdd.push(value);
		}
	}
};

const $pop = <TField extends string>(target: Record<TField, unknown[]>, field: TField, arg: number | undefined) => {
	if (target === undefined) {
		return;
	}

	const toPop = target[field];

	if (toPop === undefined) {
		return;
	}

	if (!Array.isArray(toPop)) {
		throw new Error('Cannot apply $pop modifier to non-array');
	}

	if (typeof arg === 'number' && arg < 0) {
		toPop.splice(0, 1);
	} else {
		toPop.pop();
	}
};

const $pull = <TField extends string, TDocument extends object>(
	target: Record<TField, TDocument[]>,
	field: TField,
	arg: Filter<TDocument> | undefined,
) => {
	if (target === undefined) {
		return;
	}

	const toPull = target[field];
	if (toPull === undefined) {
		return;
	}

	if (!Array.isArray(toPull)) {
		throw new Error('Cannot apply $pull/pullAll modifier to non-array');
	}

	let out;
	if (arg != null && typeof arg === 'object' && !Array.isArray(arg)) {
		const predicate = createPredicateFromFilter(arg);

		out = toPull.filter((element) => !predicate(element));
	} else {
		out = toPull.filter((element) => !equals(element, arg as any));
	}

	target[field] = out;
};

const $pullAll = <TField extends string, TDocument extends object>(
	target: Record<TField, TDocument[]>,
	field: TField,
	arg: TDocument[],
) => {
	if (!(typeof arg === 'object' && Array.isArray(arg))) {
		throw new Error('Modifier $pushAll/pullAll allowed for arrays only');
	}

	if (target === undefined) {
		return;
	}

	const toPull = target[field];

	if (toPull === undefined) {
		return;
	}

	if (!Array.isArray(toPull)) {
		throw new Error('Cannot apply $pull/pullAll modifier to non-array');
	}

	target[field] = toPull.filter((object) => !arg.some((element) => equals(object, element)));
};

const $bit = () => {
	throw new Error('$bit is not supported');
};

const modifiers = {
	$currentDate,
	$inc,
	$min,
	$max,
	$mul,
	$rename,
	$set,
	$unset,
	$push,
	$addToSet,
	$pop,
	$pull,
	$pullAll,
	$bit,
} as const;

const findModTarget = (
	doc: Record<string, any> | unknown[],
	keyparts: (number | string)[],
	options: {
		noCreate?: boolean;
		forbidArray?: boolean;
		arrayIndices?: ArrayIndices;
	} = {},
) => {
	let arrayIdx = 0;

	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart: string | number = keyparts[i];

		if (!isIndexable(doc)) {
			if (options.noCreate) {
				return undefined;
			}

			throw new Error(`Cannot use the part '${keypart}' to traverse ${doc}`);
		}

		if (Array.isArray(doc)) {
			if (options.forbidArray) {
				return null;
			}

			if (keypart === '$') {
				if (!options.arrayIndices?.length) {
					throw new Error('The positional operator did not find the match needed from the query');
				}

				keypart = options.arrayIndices[arrayIdx++];
			} else if (isNumericKey(keypart as string)) {
				keypart = parseInt(keypart as string);
			} else {
				if (options.noCreate) {
					return undefined;
				}

				throw new Error(`can't append to array using string field name [${keypart}]`);
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
					throw new Error(`can't modify field '${keyparts[i + 1]}' of list value ${JSON.stringify(doc[keypart as number])}`);
				}
			}
		} else {
			if (keypart === '$') {
				if (!options.arrayIndices?.length) {
					throw new Error('The positional operator did not find the match needed from the query');
				}

				keypart = options.arrayIndices[arrayIdx++];

				if (keypart === undefined) {
					throw new Error('Too many positional');
				}
			}

			assertIsValidFieldName(keypart as string);

			if (!(keypart in doc)) {
				if (options.noCreate) {
					return undefined;
				}

				if (!last) {
					const nextpart = keyparts[i + 1];
					doc[keypart] = typeof nextpart === 'number' || /\d+/.test(nextpart) ? [] : {};
				}
			}
		}

		if (last) return doc;

		doc = doc[keypart as keyof typeof doc];
	}

	throw new Error('Should not reach here');
};

export const createTransformFromUpdateFilter = <T extends { _id: string }>(modifier: UpdateFilter<T>) => {
	if (!isPlainObject(modifier)) {
		throw new Error('Modifier must be an object');
	}

	if (!isUpdateModifiers(modifier)) {
		assertHasValidFieldNames(modifier);

		return (doc: T): T => {
			if (doc._id && modifier._id && doc._id !== modifier._id) {
				throw new Error(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${modifier._id}"}`);
			}

			return Object.assign({ _id: doc._id } as T, modifier);
		};
	}

	return (doc: T, { isInsert = false, arrayIndices }: { isInsert?: boolean; arrayIndices?: ArrayIndices } = {}): T => {
		const newDoc = clone(doc);

		for (const [operator, operand] of Object.entries(modifier)) {
			const modFunc = modifiers[isInsert && operator === '$setOnInsert' ? '$set' : (operator as keyof typeof modifiers)] as (
				target: Record<string, any> | Array<object | null> | null | undefined,
				field: string,
				arg: unknown,
				keypath?: string,
				doc?: Record<string, any>,
			) => void;

			if (!modFunc) {
				throw new Error(`Invalid modifier specified ${operator}`);
			}

			for (const [keypath, arg] of Object.entries(operand as any)) {
				if (keypath === '') {
					throw new Error('An empty update path is not valid.');
				}

				const keyparts = keypath.split('.');

				if (!keyparts.every(Boolean)) {
					throw new Error(`The update path '${keypath}' contains an empty field name, which is not allowed.`);
				}

				const target = findModTarget(newDoc, keyparts, {
					arrayIndices,
					forbidArray: operator === '$rename',
					noCreate: ['$pop', '$pull', '$pullAll', '$rename', '$unset'].includes(operator as keyof typeof modifiers),
				});

				const key = keyparts.pop();

				if (key === undefined) {
					throw new Error(`The update path '${keypath}' ends with an empty field name, which is not allowed.`);
				}

				modFunc(target, key, arg, keypath, newDoc);
			}
		}

		if (doc._id && doc._id !== newDoc._id) {
			throw new Error(
				`After applying the update to the document {_id: "${doc._id}", ...},` +
					" the (immutable) field '_id' was found to have been altered to " +
					`_id: "${newDoc._id}"`,
			);
		}

		return newDoc;
	};
};

export const createUpsertDocument = <T extends { _id: string }>(selector: Filter<T>, modifier: UpdateFilter<T>): T => {
	let newDoc: Partial<T> = {};

	const selectorDocument = populateDocumentWithQueryFields(selector);

	if (selectorDocument._id) {
		newDoc._id = selectorDocument._id;
		delete selectorDocument._id;
	}

	newDoc = createTransformFromUpdateFilter({ $set: selectorDocument })(newDoc as T) as T;
	newDoc = createTransformFromUpdateFilter(modifier)(newDoc as T, { isInsert: true });

	if (isUpdateModifiers(modifier)) {
		return newDoc as T;
	}

	const replacement = Object.assign({}, modifier);
	if (newDoc._id) {
		replacement._id = newDoc._id;
	}

	return replacement as T;
};

const insertIntoDocument = (document: Document, key: any, value: any) => {
	Object.keys(document).forEach((existingKey) => {
		if (
			(existingKey.length > key.length && existingKey.indexOf(`${key}.`) === 0) ||
			(key.length > existingKey.length && key.indexOf(`${existingKey}.`) === 0)
		) {
			throw new Error(`cannot infer query fields to set, both paths '${existingKey}' and '${key}' are matched`);
		} else if (existingKey === key) {
			throw new Error(`cannot infer query fields to set, path '${key}' is matched twice`);
		}
	});

	document[key] = value;
};

const populateDocumentWithKeyValue = <T extends { _id: string }>(document: Partial<T>, key: string, value: unknown) => {
	if (value && Object.getPrototypeOf(value) === Object.prototype) {
		populateDocumentWithObject(document, key, value);
	} else if (!(value instanceof RegExp)) {
		insertIntoDocument(document, key, value);
	}
};

const populateDocumentWithObject = <T extends { _id: string }>(document: Partial<T>, key: string, value: FilterOperators<T>) => {
	const keys = Object.keys(value);
	const unprefixedKeys = keys.filter((op) => op[0] !== '$');

	if (unprefixedKeys.length > 0 || !keys.length) {
		if (keys.length !== unprefixedKeys.length) {
			throw new Error(`unknown operator: ${unprefixedKeys[0]}`);
		}

		validateObject(value, key);
		insertIntoDocument(document, key, value);
	} else {
		Object.entries(value).forEach(([op, object]) => {
			if (op === '$eq') {
				populateDocumentWithKeyValue(document, key, object as NonNullable<FilterOperators<T>['$eq']>);
			} else if (op === '$all') {
				(object as NonNullable<FilterOperators<T>['$all']>).forEach((element: any) => populateDocumentWithKeyValue(document, key, element));
			}
		});
	}
};

const populateDocumentWithQueryFields = <T extends { _id: string }>(query: T['_id'] | Filter<T>, document: Partial<T> = {}) => {
	if (typeof query === 'string') {
		insertIntoDocument(document, '_id', query);
		return document;
	}

	Object.entries(query).forEach(([key, value]) => {
		if (key === '$and') {
			(value as NonNullable<Filter<T>['$and']>).forEach((element) => populateDocumentWithQueryFields<T>(element as Filter<T>, document));
		} else if (key === '$or') {
			if ((value as NonNullable<Filter<T>['$or']>).length === 1) {
				populateDocumentWithQueryFields<T>(value[0], document);
			}
		} else if (typeof key === 'string' && key[0] !== '$') {
			populateDocumentWithKeyValue(document, key, value);
		}
	});

	return document;
};

const validateKeyInPath = (key: string, path: string) => {
	if (key.includes('.')) {
		throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
	}

	if (key[0] === '$') {
		throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
	}
};

const validateObject = (object: Record<string, unknown>, path: string) => {
	if (object && Object.getPrototypeOf(object) === Object.prototype) {
		Object.keys(object).forEach((key) => {
			validateKeyInPath(key, path);
			validateObject(object[key] as Record<string, unknown>, `${path}.${key}`);
		});
	}
};
