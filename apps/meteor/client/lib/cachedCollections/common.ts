import { EJSON } from 'meteor/ejson';

import type { Matcher } from './Matcher';
import { MinimongoError } from './MinimongoError';

export const hasOwn = Object.prototype.hasOwnProperty;

const ELEMENT_OPERATORS = {
	$lt: makeInequality((cmpValue: number) => cmpValue < 0),
	$gt: makeInequality((cmpValue: number) => cmpValue > 0),
	$lte: makeInequality((cmpValue: number) => cmpValue <= 0),
	$gte: makeInequality((cmpValue: number) => cmpValue >= 0),
	$mod: {
		compileElementSelector(operand) {
			if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
				throw new MinimongoError('argument to $mod must be an array of two numbers');
			}

			const divisor = operand[0];
			const remainder = operand[1];
			return (value: number) => typeof value === 'number' && value % divisor === remainder;
		},
	},
	$in: {
		compileElementSelector(operand) {
			if (!Array.isArray(operand)) {
				throw new MinimongoError('$in needs an array');
			}

			const elementMatchers = operand.map((option) => {
				if (option instanceof RegExp) {
					return regexpElementMatcher(option);
				}

				if (isOperatorObject(option)) {
					throw new MinimongoError('cannot nest $ under $in');
				}

				return equalityElementMatcher(option);
			});

			return (value: any) => {
				if (value === undefined) {
					value = null;
				}

				return elementMatchers.some((matcher) => matcher(value));
			};
		},
	},
	$size: {
		dontExpandLeafArrays: true,
		compileElementSelector(operand) {
			if (typeof operand === 'string') {
				operand = 0;
			} else if (typeof operand !== 'number') {
				throw new MinimongoError('$size needs a number');
			}

			return (value: any) => Array.isArray(value) && value.length === operand;
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
				if (!hasOwn.call(operandAliasMap, operand)) {
					throw new MinimongoError(`unknown string alias for $type: ${operand}`);
				}
				operand = operandAliasMap[operand as keyof typeof operandAliasMap];
			} else if (typeof operand === 'number') {
				if (operand === 0 || operand < -1 || (operand > 19 && operand !== 127)) {
					throw new MinimongoError(`Invalid numerical $type code: ${operand}`);
				}
			} else {
				throw new MinimongoError('argument to $type is not a number or a string');
			}

			return (value: any) => value !== undefined && _f._type(value) === operand;
		},
	},
	$bitsAllSet: {
		compileElementSelector(operand) {
			const mask = getOperandBitmask(operand, '$bitsAllSet');
			return (value: any) => {
				const bitmask = getValueBitmask(value, mask.length);
				return bitmask && mask.every((byte, i) => (bitmask[i] & byte) === byte);
			};
		},
	},
	$bitsAnySet: {
		compileElementSelector(operand) {
			const mask = getOperandBitmask(operand, '$bitsAnySet');
			return (value: any) => {
				const bitmask = getValueBitmask(value, mask.length);
				return bitmask && mask.some((byte, i) => (~bitmask[i] & byte) !== byte);
			};
		},
	},
	$bitsAllClear: {
		compileElementSelector(operand) {
			const mask = getOperandBitmask(operand, '$bitsAllClear');
			return (value: any) => {
				const bitmask = getValueBitmask(value, mask.length);
				return bitmask && mask.every((byte, i) => !(bitmask[i] & byte));
			};
		},
	},
	$bitsAnyClear: {
		compileElementSelector(operand) {
			const mask = getOperandBitmask(operand, '$bitsAnyClear');
			return (value: any) => {
				const bitmask = getValueBitmask(value, mask.length);
				return bitmask && mask.some((byte, i) => (bitmask[i] & byte) !== byte);
			};
		},
	},
	$regex: {
		compileElementSelector(operand, valueSelector: any) {
			if (!(typeof operand === 'string' || operand instanceof RegExp)) {
				throw new MinimongoError('$regex has to be a string or RegExp');
			}

			let regexp;
			if (valueSelector.$options !== undefined) {
				if (/[^gim]/.test(valueSelector.$options)) {
					throw new Error('Only the i, m, and g regexp options are supported');
				}

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
		compileElementSelector(operand, _valueSelector: any, matcher: Matcher<{ _id: string }>) {
			if (!_isPlainObject(operand)) {
				throw new MinimongoError('$elemMatch need an object');
			}

			const isDocMatcher = !isOperatorObject(
				Object.keys(operand)
					.filter((key) => !hasOwn.call(LOGICAL_OPERATORS, key))
					.reduce((a, b) => Object.assign(a, { [b]: operand[b] }), {}),
				true,
			);

			let subMatcher;
			if (isDocMatcher) {
				subMatcher = compileDocumentSelector(operand, matcher, { inElemMatch: true });
			} else {
				subMatcher = compileValueSelector(operand, matcher);
			}

			return (value: any) => {
				if (!Array.isArray(value)) {
					return false;
				}

				for (let i = 0; i < value.length; ++i) {
					const arrayElement = value[i];
					let arg;
					if (isDocMatcher) {
						if (!isIndexable(arrayElement)) {
							return false;
						}

						arg = arrayElement;
					} else {
						arg = [{ value: arrayElement, dontIterate: true }];
					}

					if (subMatcher(arg).result) {
						return i;
					}
				}

				return false;
			};
		},
	},
} satisfies Record<
	`$${string}`,
	{
		compileElementSelector(operand: unknown, _valueSelector: any, matcher: Matcher<{ _id: string }>): (value: any) => any;
		dontIncludeLeafArrays?: boolean;
		dontExpandLeafArrays?: boolean;
	}
>;

const LOGICAL_OPERATORS = {
	$and(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
	},

	$or(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);

		if (matchers.length === 1) {
			return matchers[0];
		}

		return (doc: any) => {
			const result = matchers.some((fn: any) => fn(doc).result);
			return { result };
		};
	},

	$nor(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
		return (doc: any): any => {
			const result = matchers.every((fn) => !fn(doc).result);
			return { result };
		};
	},

	$where(selectorValue: any, matcher: Matcher<{ _id: string }>): any {
		matcher._recordPathUsed('');
		matcher._hasWhere = true;

		if (!(selectorValue instanceof Function)) {
			selectorValue = Function('obj', `return ${selectorValue}`);
		}

		return (doc: any) => ({ result: selectorValue.call(doc, doc) });
	},

	$comment(): any {
		return () => ({ result: true });
	},
} as const;

const VALUE_OPERATORS = {
	$eq(operand: any) {
		return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));
	},
	$not(operand: any, _valueSelector: any, matcher: Matcher<{ _id: string }>): any {
		return invertBranchedMatcher(compileValueSelector(operand, matcher));
	},
	$ne(operand: any) {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));
	},
	$nin(operand: any) {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
	},
	$exists(operand: any) {
		const exists = convertElementMatcherToBranchedMatcher((value: any) => value !== undefined);
		return operand ? exists : invertBranchedMatcher(exists);
	},
	$options(_operand: any, valueSelector: any) {
		if (!hasOwn.call(valueSelector, '$regex')) {
			throw new MinimongoError('$options needs a $regex');
		}

		return everythingMatcher;
	},
	$maxDistance(_operand: any, valueSelector: any) {
		if (!valueSelector.$near) {
			throw new MinimongoError('$maxDistance needs a $near');
		}

		return everythingMatcher;
	},
	$all(operand: any, _valueSelector: any, matcher: Matcher<{ _id: string }>): any {
		if (!Array.isArray(operand)) {
			throw new MinimongoError('$all requires array');
		}

		if (operand.length === 0) {
			return nothingMatcher;
		}

		const branchedMatchers = operand.map((criterion) => {
			if (isOperatorObject(criterion)) {
				throw new MinimongoError('no $ expressions in $all');
			}

			return compileValueSelector(criterion, matcher);
		});

		return andBranchedMatchers(branchedMatchers);
	},
	$near() {
		throw new Error('$near is not supported in this context');
	},
} as const;

function andSomeMatchers(subMatchers: ((docOrBranches: any) => any)[]): any {
	if (subMatchers.length === 0) {
		return everythingMatcher;
	}

	if (subMatchers.length === 1) {
		return subMatchers[0];
	}

	return (docOrBranches: any) => {
		const match: {
			result?: boolean;
			arrayIndices?: number[];
		} = {};
		match.result = subMatchers.every((fn) => {
			const subResult = fn(docOrBranches);

			if (subResult.result && subResult.arrayIndices) {
				match.arrayIndices = subResult.arrayIndices;
			}

			return subResult.result;
		});

		if (!match.result) {
			delete match.arrayIndices;
		}

		return match;
	};
}

const andDocumentMatchers = andSomeMatchers;
const andBranchedMatchers = andSomeMatchers;

function compileArrayOfDocumentSelectors(selectors: any, matcher: Matcher<{ _id: string }>, inElemMatch: any) {
	if (!Array.isArray(selectors) || selectors.length === 0) {
		throw new MinimongoError('$and/$or/$nor must be nonempty array');
	}

	return selectors.map((subSelector) => {
		if (!_isPlainObject(subSelector)) {
			throw new MinimongoError('$or/$and/$nor entries need to be full objects');
		}

		return compileDocumentSelector(subSelector, matcher, { inElemMatch });
	});
}

export function compileDocumentSelector<TMatcher extends Matcher<any>>(
	docSelector: object,
	matcher: TMatcher,
	options: {
		inElemMatch?: boolean;
	} = {},
) {
	const docMatchers = Object.keys(docSelector)
		.map((key) => {
			const subSelector = (docSelector as Record<string, object>)[key];

			if (key.slice(0, 1) === '$') {
				if (!hasOwn.call(LOGICAL_OPERATORS, key)) {
					throw new Error(`Unrecognized logical operator: ${key}`);
				}

				matcher._isSimple = false;
				return LOGICAL_OPERATORS[key as keyof typeof LOGICAL_OPERATORS](subSelector, matcher, options.inElemMatch);
			}

			if (!options.inElemMatch) {
				matcher._recordPathUsed(key);
			}

			if (typeof subSelector === 'function') {
				return undefined;
			}

			const lookUpByIndex = makeLookupFunction(key);
			const valueMatcher = compileValueSelector(subSelector, matcher);

			return (doc: any) => valueMatcher(lookUpByIndex(doc));
		})
		.filter(Boolean);

	return andDocumentMatchers(docMatchers);
}

function compileValueSelector(valueSelector: any, matcher: Matcher<{ _id: string }>) {
	if (valueSelector instanceof RegExp) {
		matcher._isSimple = false;
		return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
	}

	if (isOperatorObject(valueSelector)) {
		return operatorBranchedMatcher(valueSelector, matcher);
	}

	return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
}

function convertElementMatcherToBranchedMatcher(elementMatcher: any, options: any = {}) {
	return (branches: any) => {
		const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);

		const match: any = {};
		match.result = expanded.some((element: any) => {
			let matched = elementMatcher(element.value);

			if (typeof matched === 'number') {
				if (!element.arrayIndices) {
					element.arrayIndices = [matched];
				}

				matched = true;
			}

			if (matched && element.arrayIndices) {
				match.arrayIndices = element.arrayIndices;
			}

			return matched;
		});

		return match;
	};
}

function equalityElementMatcher(elementSelector: any) {
	if (isOperatorObject(elementSelector)) {
		throw new MinimongoError("Can't create equalityValueSelector for operator object");
	}

	if (elementSelector == null) {
		return (value: any) => value == null;
	}

	return (value: any) => _f._equal(elementSelector, value);
}

function everythingMatcher(_docOrBranchedValues: any) {
	return { result: true };
}

function expandArraysInBranches<T>(
	branches: { value: T | T[]; dontIterate?: boolean; arrayIndices?: (number | 'x')[] }[],
	skipTheArrays?: boolean,
) {
	const branchesOut: { value: T | T[]; dontIterate?: boolean; arrayIndices?: (number | 'x')[] }[] = [];

	branches.forEach((branch) => {
		if (!(skipTheArrays && Array.isArray(branch.value) && !branch.dontIterate)) {
			branchesOut.push({ arrayIndices: branch.arrayIndices, value: branch.value });
		}

		if (Array.isArray(branch.value) && !branch.dontIterate) {
			branch.value.forEach((value: any, i: any) => {
				branchesOut.push({
					arrayIndices: (branch.arrayIndices || []).concat(i),
					value,
				});
			});
		}
	});

	return branchesOut;
}

export function isBinary(x: unknown): x is Uint8Array {
	return typeof x === 'object' && x !== null && x instanceof Uint8Array;
}

export function clone<T>(obj: T): T {
	return EJSON.clone(obj);
}

export function isEqual<T>(
	a: T,
	b: T,
	options?: {
		keyOrderSensitive?: boolean | undefined;
	},
): boolean {
	return EJSON.equals(a as any, b as any, options);
}

export function isPromiseLike(p: unknown): p is PromiseLike<unknown> {
	return typeof p === 'object' && p !== null && typeof (p as PromiseLike<unknown>).then === 'function';
}

function getOperandBitmask(operand: any, selector: any) {
	if (Number.isInteger(operand) && operand >= 0) {
		return new Uint8Array(new Int32Array([operand]).buffer);
	}

	if (isBinary(operand)) {
		return new Uint8Array(operand.buffer);
	}

	if (Array.isArray(operand) && operand.every((x) => Number.isInteger(x) && x >= 0)) {
		const buffer = new ArrayBuffer((Math.max(...operand) >> 3) + 1);
		const view = new Uint8Array(buffer);

		operand.forEach((x) => {
			view[x >> 3] |= 1 << (x & 0x7);
		});

		return view;
	}

	throw new MinimongoError(
		`operand to ${selector} must be a numeric bitmask (representable as a ` +
			'non-negative 32-bit signed integer), a bindata bitmask or an array with ' +
			'bit positions (non-negative integers)',
	);
}

function getValueBitmask(value: any, length: any) {
	if (Number.isSafeInteger(value)) {
		const buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));

		let view: any = new Uint32Array(buffer, 0, 2);
		view[0] = value % ((1 << 16) * (1 << 16)) | 0;
		view[1] = (value / ((1 << 16) * (1 << 16))) | 0;

		if (value < 0) {
			view = new Uint8Array(buffer, 2);
			view.forEach((_byte: any, i: any) => {
				view[i] = 0xff;
			});
		}

		return new Uint8Array(buffer);
	}

	if (isBinary(value)) {
		return new Uint8Array(value.buffer);
	}

	return false;
}

function insertIntoDocument(document: any, key: any, value: any) {
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
}

function invertBranchedMatcher(branchedMatcher: any) {
	return (branchValues: any) => {
		return { result: !branchedMatcher(branchValues).result };
	};
}

export function isIndexable(obj: any): obj is { [index: string | number]: any } {
	return Array.isArray(obj) || _isPlainObject(obj);
}

export function isNumericKey(s: string) {
	return /^[0-9]+$/.test(s);
}

export function isOperatorObject(valueSelector: any, inconsistentOK = false) {
	if (!_isPlainObject(valueSelector)) {
		return false;
	}

	let theseAreOperators: any = undefined;
	Object.keys(valueSelector).forEach((selKey) => {
		const thisIsOperator = selKey.substr(0, 1) === '$' || selKey === 'diff';

		if (theseAreOperators === undefined) {
			theseAreOperators = thisIsOperator;
		} else if (theseAreOperators !== thisIsOperator) {
			if (!inconsistentOK) {
				throw new Error(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
			}

			theseAreOperators = false;
		}
	});

	return !!theseAreOperators;
}

function makeInequality(cmpValueComparator: any) {
	return {
		compileElementSelector(operand: any) {
			if (Array.isArray(operand)) {
				return () => false;
			}

			if (operand === undefined) {
				operand = null;
			}

			const operandType = _f._type(operand);

			return (value: any) => {
				if (value === undefined) {
					value = null;
				}

				if (_f._type(value) !== operandType) {
					return false;
				}

				return cmpValueComparator(_f._cmp(value, operand));
			};
		},
	};
}

function makeLookupFunction<T>(key: string, options: any = {}) {
	const parts = key.split('.');
	const firstPart = parts.length ? parts[0] : '';
	const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'), options);

	function buildResult(arrayIndices: any, dontIterate: any, value: any) {
		if (arrayIndices?.length) {
			if (dontIterate) {
				return [{ arrayIndices, dontIterate, value }];
			}
			return [{ arrayIndices, value }];
		}
		if (dontIterate) {
			return [{ dontIterate, value }];
		}
		return [{ value }];
	}

	return (doc: T, arrayIndices?: (number | 'x')[]) => {
		if (Array.isArray(doc)) {
			if (!(isNumericKey(firstPart) && +firstPart < doc.length)) {
				return [];
			}

			arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
		}

		const firstLevel = doc[firstPart as keyof typeof doc];

		if (!lookupRest) {
			return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
		}

		if (!isIndexable(firstLevel)) {
			if (Array.isArray(doc)) {
				return [];
			}

			return buildResult(arrayIndices, false, undefined);
		}

		const result: any = [];
		const appendToResult = (more: any) => {
			result.push(...more);
		};

		appendToResult(lookupRest(firstLevel, arrayIndices));

		if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {
			firstLevel.forEach((branch, arrayIndex) => {
				if (_isPlainObject(branch)) {
					appendToResult(lookupRest(branch, arrayIndices ? arrayIndices.concat(arrayIndex) : [arrayIndex]));
				}
			});
		}

		return result;
	};
}

export function nothingMatcher(_docOrBranchedValues: any) {
	return { result: false };
}

function operatorBranchedMatcher(valueSelector: any, matcher: Matcher<{ _id: string }>) {
	const operatorMatchers = Object.keys(valueSelector).map((operator) => {
		const operand = valueSelector[operator];

		const simpleRange = ['$lt', '$lte', '$gt', '$gte'].includes(operator) && typeof operand === 'number';

		const simpleEquality = ['$ne', '$eq'].includes(operator) && operand !== Object(operand);

		const simpleInclusion = ['$in', '$nin'].includes(operator) && Array.isArray(operand) && !operand.some((x) => x === Object(x));

		if (!(simpleRange || simpleInclusion || simpleEquality)) {
			matcher._isSimple = false;
		}

		if (hasOwn.call(VALUE_OPERATORS, operator)) {
			return VALUE_OPERATORS[operator as keyof typeof VALUE_OPERATORS](operand, valueSelector, matcher);
		}

		if (hasOwn.call(ELEMENT_OPERATORS, operator)) {
			const options = ELEMENT_OPERATORS[operator as keyof typeof ELEMENT_OPERATORS];
			return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
		}

		throw new Error(`Unrecognized operator: ${operator}`);
	});

	return andBranchedMatchers(operatorMatchers);
}

function populateDocumentWithKeyValue(document: any, key: any, value: any) {
	if (value && Object.getPrototypeOf(value) === Object.prototype) {
		populateDocumentWithObject(document, key, value);
	} else if (!(value instanceof RegExp)) {
		insertIntoDocument(document, key, value);
	}
}

function populateDocumentWithObject(document: any, key: any, value: any) {
	const keys = Object.keys(value);
	const unprefixedKeys = keys.filter((op) => op[0] !== '$');

	if (unprefixedKeys.length > 0 || !keys.length) {
		if (keys.length !== unprefixedKeys.length) {
			throw new Error(`unknown operator: ${unprefixedKeys[0]}`);
		}

		validateObject(value, key);
		insertIntoDocument(document, key, value);
	} else {
		Object.keys(value).forEach((op) => {
			const object = value[op];

			if (op === '$eq') {
				populateDocumentWithKeyValue(document, key, object);
			} else if (op === '$all') {
				object.forEach((element: any) => populateDocumentWithKeyValue(document, key, element));
			}
		});
	}
}

export function populateDocumentWithQueryFields(query: any, document: any = {}): any {
	if (Object.getPrototypeOf(query) === Object.prototype) {
		Object.keys(query).forEach((key) => {
			const value = query[key];

			if (key === '$and') {
				value.forEach((element: any) => populateDocumentWithQueryFields(element, document));
			} else if (key === '$or') {
				if (value.length === 1) {
					populateDocumentWithQueryFields(value[0], document);
				}
			} else if (key[0] !== '$') {
				populateDocumentWithKeyValue(document, key, value);
			}
		});
	} else if (_selectorIsId(query)) {
		insertIntoDocument(document, '_id', query);
	}

	return document;
}

function regexpElementMatcher(regexp: any) {
	return (value: any) => {
		if (value instanceof RegExp) {
			return value.toString() === regexp.toString();
		}

		if (typeof value !== 'string') {
			return false;
		}

		regexp.lastIndex = 0;

		return regexp.test(value);
	};
}

function validateKeyInPath(key: string, path: string) {
	if (key.includes('.')) {
		throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
	}

	if (key[0] === '$') {
		throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
	}
}

function validateObject(object: Record<string, unknown>, path: string) {
	if (object && Object.getPrototypeOf(object) === Object.prototype) {
		Object.keys(object).forEach((key) => {
			validateKeyInPath(key, path);
			validateObject(object[key] as Record<string, unknown>, `${path}.${key}`);
		});
	}
}

export const _f = {
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

		if (v instanceof RegExp) {
			return 11;
		}

		if (typeof v === 'function') {
			return 13;
		}

		if (v instanceof Date) {
			return 9;
		}

		if (isBinary(v)) {
			return 5;
		}

		return 3;
	},

	_equal(a: unknown, b: unknown) {
		return isEqual(a, b, { keyOrderSensitive: true });
	},

	_typeorder(t: number) {
		return [-1, 1, 2, 3, 4, 5, -1, 6, 7, 8, 0, 9, -1, 100, 2, 100, 1, 8, 1][t];
	},

	// eslint-disable-next-line complexity
	_cmp(a: unknown, b: unknown): number {
		if (a === undefined) {
			return b === undefined ? 0 : -1;
		}

		if (b === undefined) {
			return 1;
		}

		let ta = _f._type(a);
		let tb = _f._type(b);

		const oa = _f._typeorder(ta);
		const ob = _f._typeorder(tb);

		if (oa !== ob) {
			return oa < ob ? -1 : 1;
		}

		if (ta !== tb) {
			throw new MinimongoError('Missing type coercion logic in _cmp');
		}

		if (ta === 7) {
			ta = 2;
			tb = 2;
			a = (a as { toHexString(): string }).toHexString();
			b = (b as { toHexString(): string }).toHexString();
		}

		if (ta === 9) {
			ta = 1;
			tb = 1;
			a = isNaN(a as number) ? 0 : (a as Date).getTime();
			b = isNaN(b as number) ? 0 : (b as Date).getTime();
		}

		if (ta === 1) {
			return (a as number) - (b as number);
		}

		if (tb === 2) {
			if (a === b) {
				return 0;
			}

			return (a as string) < (b as string) ? -1 : 1;
		}

		if (ta === 3) {
			const toArray = (object: any) => {
				const result: any[] = [];

				Object.keys(object).forEach((key) => {
					result.push(key, object[key]);
				});

				return result;
			};

			return _f._cmp(toArray(a), toArray(b));
		}

		if (ta === 4) {
			for (let i = 0; ; i++) {
				if (i === (a as unknown[]).length) {
					return i === (b as unknown[]).length ? 0 : -1;
				}

				if (i === (b as unknown[]).length) {
					return 1;
				}

				const s = _f._cmp((a as unknown[])[i], (b as unknown[])[i]);
				if (s !== 0) {
					return s;
				}
			}
		}

		if (ta === 5) {
			if ((a as Uint8Array).length !== (b as Uint8Array).length) {
				return (a as Uint8Array).length - (b as Uint8Array).length;
			}

			for (let i = 0; i < (a as Uint8Array).length; i++) {
				if ((a as Uint8Array)[i] < (b as Uint8Array)[i]) {
					return -1;
				}

				if ((a as Uint8Array)[i] > (b as Uint8Array)[i]) {
					return 1;
				}
			}

			return 0;
		}

		if (ta === 8) {
			if (a) {
				return b ? 0 : 1;
			}

			return b ? -1 : 0;
		}

		if (ta === 10) return 0;

		if (ta === 11) throw new MinimongoError('Sorting not supported on regular expression');

		if (ta === 13) throw new MinimongoError('Sorting not supported on Javascript code');

		throw new MinimongoError('Unknown type to sort');
	},
};

export function _isPlainObject(x: any): x is Record<string, any> {
	return x && _f._type(x) === 3;
}

export function _selectorIsId(selector: unknown): selector is string | number {
	return typeof selector === 'number' || typeof selector === 'string';
}
