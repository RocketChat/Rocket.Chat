import { createComparatorFromSort, createPredicateFromFilter, type Filter, type Sort } from '@rocket.chat/mongo-adapter';

import { MinimongoError } from './MinimongoError';
import type { ArrayIndices } from './common';
import {
	_f,
	_isPlainObject,
	assertHasValidFieldNames,
	assertIsValidFieldName,
	clone,
	entriesOf,
	isIndexable,
	isNumericKey,
	populateDocumentWithQueryFields,
} from './common';

export type UpdateModifiers = {
	[K in keyof typeof Updater.MODIFIERS]?: Parameters<(typeof Updater.MODIFIERS)[K]>[2];
};

export type UpdateFilter<T> = UpdateModifiers | Partial<T>;

export class Updater<T extends { _id: string }> {
	constructor(private readonly modifier: UpdateFilter<T>) {}

	modify(doc: T, { isInsert = false, arrayIndices }: { isInsert?: boolean; arrayIndices?: ArrayIndices } = {}): T {
		if (!_isPlainObject(this.modifier)) {
			throw new MinimongoError('Modifier must be an object');
		}

		if (this.isUpdateModifiers(this.modifier)) {
			const newDoc = clone(doc);

			for (const [operator, operand] of entriesOf(this.modifier)) {
				const modFunc = Updater.MODIFIERS[isInsert && operator === '$setOnInsert' ? '$set' : operator] as (
					target: Record<string, any> | Array<object | null> | null | undefined,
					field: string,
					arg: unknown,
					keypath?: string,
					doc?: Record<string, any>,
				) => void;

				if (!modFunc) {
					throw new MinimongoError(`Invalid modifier specified ${operator}`);
				}

				for (const [keypath, arg] of Object.entries(operand as any)) {
					if (keypath === '') {
						throw new MinimongoError('An empty update path is not valid.');
					}

					const keyparts = keypath.split('.');

					if (!keyparts.every(Boolean)) {
						throw new MinimongoError(`The update path '${keypath}' contains an empty field name, which is not allowed.`);
					}

					const target = Updater.findModTarget(newDoc, keyparts, {
						arrayIndices,
						forbidArray: operator === '$rename',
						noCreate: Updater.NO_CREATE_MODIFIERS[operator as keyof typeof Updater.NO_CREATE_MODIFIERS],
					});

					const key = keyparts.pop();

					if (!key) {
						throw new MinimongoError(`The update path '${keypath}' ends with an empty field name, which is not allowed.`);
					}

					modFunc(target, key, arg, keypath, newDoc);
				}
			}

			if (doc._id && doc._id !== newDoc._id) {
				throw new MinimongoError(
					`After applying the update to the document {_id: "${doc._id}", ...},` +
						" the (immutable) field '_id' was found to have been altered to " +
						`_id: "${newDoc._id}"`,
				);
			}

			return newDoc;
		}

		if (doc._id && this.modifier._id && doc._id !== this.modifier._id) {
			throw new MinimongoError(`The _id field cannot be changed from {_id: "${doc._id}"} to {_id: "${this.modifier._id}"}`);
		}

		assertHasValidFieldNames(this.modifier);

		return Object.assign({ _id: doc._id } as T, this.modifier);
	}

	private isUpdateModifiers(mod: UpdateFilter<T>): mod is UpdateModifiers {
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

	createUpsertDocument(selector: Filter<T>): T {
		const selectorDocument = populateDocumentWithQueryFields(selector);

		let newDoc: Partial<T> = {};

		if (selectorDocument._id) {
			newDoc._id = selectorDocument._id;
			delete selectorDocument._id;
		}

		newDoc = new Updater({ $set: selectorDocument }).modify(newDoc as T) as T;
		newDoc = this.modify(newDoc as T, { isInsert: true });

		if (this.isUpdateModifiers(this.modifier)) {
			return newDoc as T;
		}

		const replacement = Object.assign({}, this.modifier);
		if (newDoc._id) {
			replacement._id = newDoc._id;
		}

		return replacement as T;
	}

	static readonly MODIFIERS = {
		$currentDate<TField extends string>(target: Record<TField, Date>, field: TField, arg: { $type: 'date' } | true) {
			if (typeof arg === 'object' && '$type' in arg) {
				if (arg.$type !== 'date') {
					throw new MinimongoError('Minimongo does currently only support the date type in $currentDate modifiers', { field });
				}
			} else if (arg !== true) {
				throw new MinimongoError('Invalid $currentDate modifier', { field });
			}

			target[field] = new Date();
		},
		$inc<TField extends string>(target: Record<TField, number>, field: TField, arg: number) {
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
		$minc<TField extends string>(target: Record<TField, number>, field: TField, arg: number) {
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
		$maxc<TField extends string>(target: Record<TField, number>, field: TField, arg: number) {
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
		$mul<TField extends string>(target: Record<TField, number>, field: TField, arg: number) {
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
		$rename<TField extends string>(target: Record<TField, object>, field: TField, arg: string, keypath: string, doc: Record<string, any>) {
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
			const target2 = Updater.findModTarget(doc, keyparts, { forbidArray: true });

			if (!target2) {
				throw new MinimongoError('$rename target field invalid', { field });
			}

			target2[keyparts.pop() as keyof typeof target2] = object;
		},
		$set<TField extends string>(target: Record<TField, object>, field: TField, arg: object) {
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
		$unset<TField extends number | string>(target: Record<TField, object> | (object | null)[], field: TField) {
			if (target !== undefined) {
				if (Array.isArray(target)) {
					if (field in target) {
						target[field as number] = null;
					}
				} else {
					delete target[field];
				}
			}
		},
		$push<TField extends string, TItem>(
			target: Record<TField, TItem[]>,
			field: TField,
			arg: TItem | { $each?: TItem; $position?: number; $slice?: number; $sort?: Sort },
		) {
			if (target[field] === undefined) {
				target[field] = [];
			}

			if (!Array.isArray(target[field])) {
				throw new MinimongoError('Cannot apply $push modifier to non-array', { field });
			}

			const isEachArgument = (arg: unknown): arg is { $each?: TItem[]; $position?: number; $slice?: number; $sort?: Sort } => {
				return typeof arg === 'object' && arg !== null && '$each' in arg && Array.isArray((arg as { $each: TItem[] }).$each);
			};

			if (!isEachArgument(arg)) {
				assertHasValidFieldNames(arg);

				target[field].push(arg as TItem);

				return;
			}

			const toPush = (arg as { $each: TItem[] }).$each;
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

				sortFunction = createComparatorFromSort(arg.$sort);

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
		},
		$pushAll<TField extends string>(target: Record<TField, unknown[]>, field: TField, arg: unknown[]) {
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
		$addToSet<TField extends string, TItem>(target: Record<TField, TItem[]>, field: TField, arg: TItem | { $each: TItem[] }) {
			const isEachArgument = (arg: unknown): arg is { $each?: TItem[] } => {
				return typeof arg === 'object' && arg !== null && '$each' in arg && Array.isArray((arg as { $each: TItem[] }).$each);
			};

			const values = isEachArgument(arg) ? arg.$each : [arg];

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
		$pop<TField extends string>(target: Record<TField, unknown[]>, field: TField, arg: number | undefined) {
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
		$pull<TField extends string, TDocument extends object>(
			target: Record<TField, TDocument[]>,
			field: TField,
			arg: Filter<TDocument> | undefined,
		) {
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
				const predicate = createPredicateFromFilter(arg);

				out = toPull.filter((element) => !predicate(element));
			} else {
				out = toPull.filter((element) => !_f._equal(element, arg));
			}

			target[field] = out;
		},
		$pullAll<TField extends string, TDocument extends object>(target: Record<TField, TDocument[]>, field: TField, arg: TDocument[]) {
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

	private static readonly NO_CREATE_MODIFIERS = {
		$pop: true,
		$pull: true,
		$pullAll: true,
		$rename: true,
		$unset: true,
	};

	private static findModTarget(
		doc: Record<string, any> | unknown[],
		keyparts: (number | string)[],
		options: {
			noCreate?: boolean;
			forbidArray?: boolean;
			arrayIndices?: ArrayIndices;
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

			if (last) return doc;

			doc = doc[keypart as keyof typeof doc];
		}

		throw new MinimongoError('Should not reach here');
	}
}
