import { compareBSONValues, getBSONType } from './bson';
import { equals, isTruthy } from './comparisons';
import { createLookupFunction } from './lookups';
import { BSONType } from './types';
import type { ArrayIndices, FieldExpression, Filter, LookupBranch } from './types';

type Match = {
	readonly result: boolean;
	arrayIndices?: ArrayIndices;
};

const isIndexable = (obj: any): obj is { [index: string | number]: any } => Array.isArray(obj) || isPlainObject(obj);

const isBinary = (x: unknown): x is Uint8Array => typeof x === 'object' && x !== null && x instanceof Uint8Array;

const everyMatches = <T>(arr: T[], fn: (item: T) => Match): Match =>
	arr.reduce((acc: Match, item) => (acc.result ? fn(item) : acc), { result: true });

const someMatches = <T>(arr: T[], fn: (item: T) => Match): Match =>
	arr.reduce((acc: Match, item) => (acc.result ? acc : fn(item)), { result: false });

const regexpElementMatcher =
	(regexp: RegExp) =>
	(value: unknown): boolean => {
		if (value instanceof RegExp) {
			return value.toString() === regexp.toString();
		}

		if (typeof value !== 'string') {
			return false;
		}

		regexp.lastIndex = 0;

		return regexp.test(value);
	};

const equalityElementMatcher = (elementSelector: unknown) => {
	if (isOperatorObject(elementSelector)) {
		throw new Error("Can't create equalityValueSelector for operator object");
	}

	if (elementSelector === null || elementSelector === undefined) {
		return (value: unknown): boolean => value === null || value === undefined;
	}

	return (value: unknown): boolean => equals(elementSelector, value);
};

const invertBranchedMatcher =
	(branchedMatcher: (branches: LookupBranch[]) => Match) =>
	(branches: LookupBranch[]): Match => ({
		result: !branchedMatcher(branches).result,
	});

const getValueBitmask = (value: unknown, length: number): Uint8Array | false => {
	if (typeof value === 'number' && Number.isSafeInteger(value)) {
		const buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));

		let view: Uint32Array | Uint8Array = new Uint32Array(buffer, 0, 2);
		view[0] = value % ((1 << 16) * (1 << 16)) | 0;
		view[1] = (value / ((1 << 16) * (1 << 16))) | 0;

		if (value < 0) {
			view = new Uint8Array(buffer, 2);
			view.forEach((_byte, i) => {
				view[i] = 0xff;
			});
		}

		return new Uint8Array(buffer);
	}

	if (isBinary(value)) {
		return new Uint8Array(value.buffer);
	}

	return false;
};

const getOperandBitmask = (operand: unknown, selector: string) => {
	if (typeof operand === 'number' && Number.isInteger(operand) && operand >= 0) {
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

	throw new Error(
		`operand to ${selector} must be a numeric bitmask (representable as a ` +
			'non-negative 32-bit signed integer), a bindata bitmask or an array with ' +
			'bit positions (non-negative integers)',
	);
};

const expandArraysInBranches = (branches: LookupBranch[], skipTheArrays?: boolean) => {
	const branchesOut: LookupBranch[] = [];

	for (const branch of branches) {
		if (!(skipTheArrays && Array.isArray(branch.value) && !branch.dontIterate)) {
			branchesOut.push({ arrayIndices: branch.arrayIndices, value: branch.value });
		}

		if (Array.isArray(branch.value) && !branch.dontIterate) {
			branch.value.forEach((value: unknown, i) => {
				branchesOut.push({
					arrayIndices: (branch.arrayIndices || []).concat(i),
					value,
				});
			});
		}
	}

	return branchesOut;
};

const convertElementMatcherToBranchedMatcher = (
	elementMatcher: (value: unknown) => boolean | number,
	options: { dontExpandLeafArrays?: boolean; dontIncludeLeafArrays?: boolean } = {},
) => {
	return (branches: LookupBranch[]) => {
		const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);

		return someMatches(expanded, (element) => {
			const matched = elementMatcher(element.value);

			if (typeof matched === 'number') {
				return {
					result: true,
					arrayIndices: [matched],
				};
			}

			return {
				result: matched,
				arrayIndices: element.arrayIndices,
			};
		});
	};
};

const operatorBranchedMatcher = <T>(valueSelector: FieldExpression<T>) => {
	const operatorMatchers = Object.entries(valueSelector).map(([operator, operand]): ((branches: LookupBranch[]) => Match) => {
		if (isValueOperator(operator)) {
			return valueOperators[operator](operand, valueSelector);
		}

		if (isElementOperator(operator)) {
			const compileElementSelector = elementOperators[operator];
			return convertElementMatcherToBranchedMatcher(compileElementSelector(operand, valueSelector), {
				dontExpandLeafArrays: operator === '$size' || operator === '$elemMatch',
				dontIncludeLeafArrays: operator === '$type',
			});
		}

		throw new Error(`Unrecognized operator: ${operator}`);
	});

	return (branches: LookupBranch[]) => everyMatches(operatorMatchers, (fn) => fn(branches));
};

const $in = (operand: unknown): ((value: unknown) => boolean) => {
	if (!Array.isArray(operand)) {
		throw new Error('$in needs an array');
	}

	const elementMatchers = operand.map((option) => {
		if (option instanceof RegExp) {
			return regexpElementMatcher(option);
		}

		if (isOperatorObject(option)) {
			throw new Error('cannot nest $ under $in');
		}

		return equalityElementMatcher(option);
	});

	return (value: unknown) => {
		if (value === undefined) {
			value = null;
		}

		return elementMatchers.some((matcher) => matcher(value));
	};
};

const $eq = (operand: unknown) => convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));

const $not = <T>(operand: unknown, _valueSelector: FieldExpression<T>) => {
	return invertBranchedMatcher(compileValueSelector(operand as FieldExpression<T>));
};

const $ne = (operand: unknown) => invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));

const $nin = (operand: unknown) => invertBranchedMatcher(convertElementMatcherToBranchedMatcher($in(operand)));

const $exists = (operand: unknown) => {
	const exists = convertElementMatcherToBranchedMatcher((value) => value !== undefined);
	return operand ? exists : invertBranchedMatcher(exists);
};

const $options = <T>(_operand: unknown, valueSelector: FieldExpression<T>) => {
	if (!('$regex' in valueSelector)) {
		throw new Error('$options needs a $regex');
	}

	return () => ({ result: true });
};

const $all = <T>(operand: unknown, _valueSelector: FieldExpression<T>) => {
	if (!Array.isArray(operand)) {
		throw new Error('$all requires array');
	}

	if (operand.length === 0) {
		return () => ({ result: false });
	}

	const branchedMatchers = operand.map((criterion) => {
		if (isOperatorObject(criterion)) {
			throw new Error('no $ expressions in $all');
		}

		return compileValueSelector(criterion);
	});

	return (branches: LookupBranch[]) => everyMatches(branchedMatchers, (fn) => fn(branches));
};

const valueOperators = {
	$eq,
	$not,
	$ne,
	$nin,
	$exists,
	$options,
	$all,
} as const;

const isValueOperator = (operator: string): operator is keyof typeof valueOperators => operator in valueOperators;

function createInequalityOperator(selector: (compValue: number) => boolean) {
	return (operand: unknown) => {
		if (Array.isArray(operand)) {
			return () => false;
		}

		operand ??= null;

		const operandType = getBSONType(operand);

		return (value: unknown) => {
			value ??= null;

			if (getBSONType(value) !== operandType) {
				return false;
			}

			return selector(compareBSONValues(value, operand));
		};
	};
}

const $lt = createInequalityOperator((cmpValue: number) => cmpValue < 0);

const $gt = createInequalityOperator((cmpValue: number) => cmpValue > 0);

const $lte = createInequalityOperator((cmpValue: number) => cmpValue <= 0);

const $gte = createInequalityOperator((cmpValue: number) => cmpValue >= 0);

const $mod = (operand: unknown) => {
	if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
		throw new Error('argument to $mod must be an array of two numbers');
	}

	const [divisor, remainder] = operand;
	return (value: unknown) => typeof value === 'number' && value % divisor === remainder;
};

const $size = (operand: unknown) => {
	if (typeof operand === 'string') {
		operand = 0;
	} else if (typeof operand !== 'number') {
		throw new Error('$size needs a number');
	}

	return (value: unknown) => Array.isArray(value) && value.length === operand;
};

const $type = (operand: unknown) => {
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
		if (!(operand in operandAliasMap)) {
			throw new Error(`unknown string alias for $type: ${operand}`);
		}
		operand = operandAliasMap[operand as keyof typeof operandAliasMap];
	} else if (typeof operand === 'number') {
		if (operand === 0 || operand < -1 || (operand > 19 && operand !== 127)) {
			throw new Error(`Invalid numerical $type code: ${operand}`);
		}
	} else {
		throw new Error('argument to $type is not a number or a string');
	}

	return (value: unknown) => value !== undefined && getBSONType(value) === operand;
};

const $bitsAllSet = (operand: unknown) => {
	const mask = getOperandBitmask(operand, '$bitsAllSet');
	return (value: unknown) => {
		const bitmask = getValueBitmask(value, mask.length);
		return bitmask && mask.every((byte, i) => (bitmask[i] & byte) === byte);
	};
};

const $bitsAnySet = (operand: unknown) => {
	const mask = getOperandBitmask(operand, '$bitsAnySet');
	return (value: unknown) => {
		const bitmask = getValueBitmask(value, mask.length);
		return bitmask && mask.some((byte, i) => (~bitmask[i] & byte) !== byte);
	};
};

const $bitsAllClear = (operand: unknown) => {
	const mask = getOperandBitmask(operand, '$bitsAllClear');
	return (value: unknown) => {
		const bitmask = getValueBitmask(value, mask.length);
		return bitmask && mask.every((byte, i) => !(bitmask[i] & byte));
	};
};

const $bitsAnyClear = (operand: unknown) => {
	const mask = getOperandBitmask(operand, '$bitsAnyClear');
	return (value: unknown) => {
		const bitmask = getValueBitmask(value, mask.length);
		return bitmask && mask.some((byte, i) => (bitmask[i] & byte) !== byte);
	};
};

const $regex = <T>(operand: unknown, valueSelector: FieldExpression<T>) => {
	if (!(typeof operand === 'string' || operand instanceof RegExp)) {
		throw new Error('$regex has to be a string or RegExp');
	}

	if (valueSelector.$options !== undefined) {
		if (/[^gim]/.test(valueSelector.$options)) {
			throw new Error('Only the i, m, and g regexp options are supported');
		}

		const source = operand instanceof RegExp ? operand.source : operand;
		return regexpElementMatcher(new RegExp(source, valueSelector.$options));
	}

	if (operand instanceof RegExp) {
		return regexpElementMatcher(operand);
	}

	return regexpElementMatcher(new RegExp(operand));
};

const $elemMatch = <T>(operand: unknown, _valueSelector: FieldExpression<T>) => {
	if (!isPlainObject(operand)) {
		throw new Error('$elemMatch need an object');
	}

	const isDocMatcher = !isOperatorObject(
		Object.entries(operand)
			.filter(([key]) => !isLogicalOperator(key))
			.reduce((a, [key, value]) => Object.assign(a, { [key]: value }), {}),
		true,
	);

	if (isDocMatcher) {
		const subMatcher = createDocumentMatcherFromFilter(operand);

		return (value: any) => {
			if (!Array.isArray(value)) {
				return false;
			}

			for (let i = 0; i < value.length; ++i) {
				const arrayElement = value[i];
				if (!isIndexable(arrayElement)) {
					return false;
				}

				if (subMatcher(arrayElement as T).result) {
					return i;
				}
			}

			return false;
		};
	}

	const subMatcher = compileValueSelector(operand);

	return (value: unknown) => {
		if (!Array.isArray(value)) {
			return false;
		}

		for (let i = 0; i < value.length; ++i) {
			const arrayElement = value[i];
			if (subMatcher([{ value: arrayElement, dontIterate: true }]).result) {
				return i;
			}
		}

		return false;
	};
};

const elementOperators = {
	$lt,
	$gt,
	$lte,
	$gte,
	$mod,
	$in,
	$size,
	$type,
	$bitsAllSet,
	$bitsAnySet,
	$bitsAllClear,
	$bitsAnyClear,
	$regex,
	$elemMatch,
} as const;

const isElementOperator = (operator: string): operator is keyof typeof elementOperators => operator in elementOperators;

const $and = <T>(subSelector: Filter<T>[]) => {
	const matchers = compileArrayOfDocumentSelectors(subSelector);
	return (doc: T) => everyMatches(matchers, (fn) => fn(doc));
};

const $or = <T>(subSelector: Filter<T>[]) => {
	const matchers = compileArrayOfDocumentSelectors(subSelector);
	return (doc: T) => ({ result: matchers.some((fn) => fn(doc).result) });
};

const $nor = <T>(subSelector: Filter<T>[]) => {
	const matchers = compileArrayOfDocumentSelectors(subSelector);
	return (doc: T) => ({ result: matchers.every((fn) => !fn(doc).result) });
};

const $where = <T>(selectorValue: string | ((this: T, doc: T) => boolean)) => {
	if (!(selectorValue instanceof Function)) {
		selectorValue = Function('obj', `return ${selectorValue}`) as (this: T, doc: T) => boolean;
	}

	return (doc: T) => ({ result: selectorValue.call(doc, doc) });
};

const logicalOperators = {
	$and,
	$or,
	$nor,
	$where,
} as const;

const isLogicalOperator = (operator: string): operator is keyof typeof logicalOperators => operator in logicalOperators;

const isPlainObject = (x: any): x is Record<string, any> => x && getBSONType(x) === BSONType.Object;

const isOperatorObject = <TOperator extends `$${string}`>(
	valueSelector: unknown,
	inconsistentOK = false,
): valueSelector is Record<TOperator, any> => {
	if (!isPlainObject(valueSelector)) {
		return false;
	}

	let theseAreOperators: boolean | undefined = undefined;
	for (const selKey of Object.keys(valueSelector)) {
		const thisIsOperator = selKey.slice(0, 1) === '$' || selKey === 'diff';

		if (theseAreOperators === undefined) {
			theseAreOperators = thisIsOperator;
		} else if (theseAreOperators !== thisIsOperator) {
			if (!inconsistentOK) {
				throw new Error(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
			}

			theseAreOperators = false;
		}
	}

	return theseAreOperators ?? true;
};

const compileValueSelector = <T>(valueSelector: FieldExpression<T>) => {
	if (valueSelector instanceof RegExp) {
		return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
	}

	if (isOperatorObject(valueSelector)) {
		return operatorBranchedMatcher(valueSelector);
	}

	return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
};

const compileArrayOfDocumentSelectors = <T>(selectors: Filter<T>[]) => {
	return selectors.map((subSelector) => createDocumentMatcherFromFilter(subSelector));
};

export const createDocumentMatcherFromFilter = <T>(filter: Filter<T>) => {
	const docMatchers = Object.entries(filter)
		.map(([key, subSelector]): ((doc: T) => Match) | undefined => {
			if (isLogicalOperator(key)) {
				return logicalOperators[key](subSelector);
			}

			if (key.slice(0, 1) === '$') {
				throw new Error(`Unrecognized logical operator: ${key}`);
			}

			if (typeof subSelector === 'function') {
				return undefined;
			}

			const lookUpByIndex = createLookupFunction(key);
			const valueMatcher = compileValueSelector(subSelector);

			return (doc: T) => valueMatcher(lookUpByIndex(doc));
		})
		.filter(isTruthy);

	return (doc: T) => everyMatches(docMatchers, (fn) => fn(doc));
};

export const createPredicateFromFilter = <T>(filter: Filter<T>): ((doc: T) => boolean) => {
	const docMatcher = createDocumentMatcherFromFilter(filter);
	return (doc: T) => docMatcher(doc).result;
};
