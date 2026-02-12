/* eslint-disable @typescript-eslint/naming-convention */
import { DiffSequence } from './diff-sequence.ts';
import { EJSON } from './ejson.ts';
import { GeoJSON } from './geojson-utils.ts';
import { IdMap } from './id-map.ts';
import { Meteor, SynchronousQueue } from './meteor.ts';
import { ObjectID } from './mongo-id.ts';
import { OrderedDict } from './ordered-dict.ts';
import { Package } from './package-registry.ts';
import { Random } from './random.ts';
import { Tracker } from './tracker.ts';
import { hasOwn } from './utils/hasOwn.ts';
import { isKey } from './utils/isKey.ts';
import { isSafeInteger } from './utils/isSafeInteger.ts';
import { keys } from './utils/keys.ts';

class ObserveHandle {}

interface TypeCheckerInterface {
	_type(v: unknown): number;
	_equal(a: unknown, b: unknown): boolean;
	_typeorder(t: number): number;
	_cmp(a: unknown, b: unknown): number;
}

const TypeChecker: TypeCheckerInterface = {
	_type(v: unknown): number {
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

		if (EJSON.isBinary(v)) {
			return 5;
		}

		if (v instanceof ObjectID) {
			return 7;
		}

		// if (v instanceof Decimal) {
		// 	return 1;
		// }

		return 3;
	},

	_equal(a: unknown, b: unknown): boolean {
		return EJSON.equals(a, b, { keyOrderSensitive: true });
	},

	_typeorder(t: number): number {
		return [-1, 1, 2, 3, 4, 5, -1, 6, 7, 8, 0, 9, -1, 100, 2, 100, 1, 8, 1][t];
	},

	_cmp(a: unknown, b: unknown): number {
		if (a === undefined) {
			return b === undefined ? 0 : -1;
		}

		if (b === undefined) {
			return 1;
		}

		let ta = TypeChecker._type(a);
		let tb = TypeChecker._type(b);
		const oa = TypeChecker._typeorder(ta);
		const ob = TypeChecker._typeorder(tb);

		if (oa !== ob) {
			return oa < ob ? -1 : 1;
		}

		if (ta !== tb) {
			throw Error('Missing type coercion logic in _cmp');
		}

		if (ta === 7) {
			ta = tb = 2;
			a = a.toHexString();
			b = b.toHexString();
		}

		if (ta === 9) {
			ta = tb = 1;
			a = isNaN(a) ? 0 : a.getTime();
			b = isNaN(b) ? 0 : b.getTime();
		}

		if (ta === 1) {
			if (a instanceof Decimal) {
				return a.minus(b).toNumber();
			}
			return a - b;
		}

		if (tb === 2) return a < b ? -1 : a === b ? 0 : 1;

		if (ta === 3) {
			const toArray = (object) => {
				const result = [];

				Object.keys(object).forEach((key) => {
					result.push(key, object[key]);
				});

				return result;
			};

			return TypeChecker._cmp(toArray(a), toArray(b));
		}

		if (ta === 4) {
			for (let i = 0; ; i++) {
				if (i === a.length) {
					return i === b.length ? 0 : -1;
				}

				if (i === b.length) {
					return 1;
				}

				const s = TypeChecker._cmp(a[i], b[i]);

				if (s !== 0) {
					return s;
				}
			}
		}

		if (ta === 5) {
			if (a.length !== b.length) {
				return a.length - b.length;
			}

			for (let i = 0; i < a.length; i++) {
				if (a[i] < b[i]) {
					return -1;
				}

				if (a[i] > b[i]) {
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
		if (ta === 11) throw Error('Sorting not supported on regular expression');
		if (ta === 13) throw Error('Sorting not supported on Javascript code');

		throw Error('Unknown type to sort');
	},
};

interface ElementSelector {
	dontExpandLeafArrays?: boolean;
	dontIncludeLeafArrays?: boolean;
	compileElementSelector(
		operand: unknown,
		valueSelector?: Record<string, unknown>,
		matcher?: Matcher,
	): (value: unknown) => boolean | number;
}

function makeInequality(cmpValueComparator: (cmpValue: number) => boolean): ElementSelector {
	return {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			if (Array.isArray(operand)) {
				return (): boolean => false;
			}

			const normalizedOperand = operand === undefined ? null : operand;
			const operandType = TypeChecker._type(normalizedOperand);

			return (value: unknown): boolean => {
				const normalizedValue = value === undefined ? null : value;

				if (TypeChecker._type(normalizedValue) !== operandType) {
					return false;
				}

				return cmpValueComparator(TypeChecker._cmp(normalizedValue, normalizedOperand));
			};
		},
	};
}

class MiniMongoQueryError extends Error {}

interface ElementOperators {
	[key: string]: ElementSelector;
}

const ELEMENT_OPERATORS: ElementOperators = {
	$lt: makeInequality((cmpValue) => cmpValue < 0),
	$gt: makeInequality((cmpValue) => cmpValue > 0),
	$lte: makeInequality((cmpValue) => cmpValue <= 0),
	$gte: makeInequality((cmpValue) => cmpValue >= 0),
	$mod: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
				throw new MiniMongoQueryError('argument to $mod must be an array of two numbers');
			}

			const divisor = (operand as number[])[0];
			const remainder = (operand as number[])[1];

			return (value: unknown): boolean => typeof value === 'number' && value % divisor === remainder;
		},
	},
	$in: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			if (!Array.isArray(operand)) {
				throw new MiniMongoQueryError('$in needs an array');
			}

			const elementMatchers = (operand as unknown[]).map((option: unknown): ((value: unknown) => boolean) => {
				if (option instanceof RegExp) {
					return regexpElementMatcher(option);
				}

				if (isOperatorObject(option)) {
					throw new MiniMongoQueryError('cannot nest $ under $in');
				}

				return equalityElementMatcher(option);
			});

			return (value: unknown): boolean => {
				const normalizedValue = value === undefined ? null : value;
				return elementMatchers.some((matcher): boolean => matcher(normalizedValue));
			};
		},
	},
	$size: {
		dontExpandLeafArrays: true,
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			const normalizedOperand: number =
				typeof operand === 'string'
					? 0
					: typeof operand === 'number'
						? operand
						: (() => {
								throw new MiniMongoQueryError('$size needs a number');
							})();

			return (value: unknown): boolean => Array.isArray(value) && value.length === normalizedOperand;
		},
	},
	$type: {
		dontIncludeLeafArrays: true,
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			let normalizedOperand = 0;
			if (typeof operand === 'string') {
				const operandAliasMap: Record<string, number> = {
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

				if (!hasOwn(operandAliasMap, operand)) {
					throw new MiniMongoQueryError('unknown string alias for $type: '.concat(operand));
				}

				normalizedOperand = operandAliasMap[operand];
			} else if (typeof operand === 'number') {
				if (operand === 0 || operand < -1 || (operand > 19 && operand !== 127)) {
					throw new MiniMongoQueryError('Invalid numerical $type code: '.concat(operand));
				}
				normalizedOperand = operand;
			} else {
				throw new MiniMongoQueryError('argument to $type is not a number or a string');
			}

			return (value: unknown): boolean => value !== undefined && TypeChecker._type(value) === normalizedOperand;
		},
	},
	$bitsAllSet: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			const mask = getOperandBitmask(operand, '$bitsAllSet');

			return (value: unknown): boolean => {
				const bitmask = getValueBitmask(value, mask.length);

				return !!(bitmask && mask.every((byte: number, i: number) => (bitmask[i] & byte) === byte));
			};
		},
	},
	$bitsAnySet: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			const mask = getOperandBitmask(operand, '$bitsAnySet');

			return (value: unknown): boolean => {
				const bitmask = getValueBitmask(value, mask.length);

				return !!(bitmask && mask.some((byte: number, i: number) => (~bitmask[i] & byte) !== byte));
			};
		},
	},
	$bitsAllClear: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			const mask = getOperandBitmask(operand, '$bitsAllClear');

			return (value: unknown): boolean => {
				const bitmask = getValueBitmask(value, mask.length);

				return !!(bitmask && mask.every((byte: number, i: number) => !(bitmask[i] & byte)));
			};
		},
	},
	$bitsAnyClear: {
		compileElementSelector(operand: unknown): (value: unknown) => boolean {
			const mask = getOperandBitmask(operand, '$bitsAnyClear');

			return (value: unknown): boolean => {
				const bitmask = getValueBitmask(value, mask.length);

				return !!(bitmask && mask.some((byte: number, i: number) => (bitmask[i] & byte) !== byte));
			};
		},
	},
	$regex: {
		compileElementSelector(operand: unknown, valueSelector?: Record<string, unknown>): (value: unknown) => boolean {
			if (!(typeof operand === 'string' || operand instanceof RegExp)) {
				throw new MiniMongoQueryError('$regex has to be a string or RegExp');
			}

			let regexp: RegExp;

			if (valueSelector?.$options !== undefined) {
				if (!/[gim]*$/.test(String(valueSelector.$options))) {
					throw new MiniMongoQueryError('Only the i, m, and g regexp options are supported');
				}

				const source = operand instanceof RegExp ? operand.source : String(operand);
				regexp = new RegExp(source, String(valueSelector.$options));
			} else if (operand instanceof RegExp) {
				regexp = operand;
			} else {
				regexp = new RegExp(String(operand));
			}

			return regexpElementMatcher(regexp);
		},
	},
	$elemMatch: {
		dontExpandLeafArrays: true,
		compileElementSelector(
			operand: unknown,
			_valueSelector?: Record<string, unknown>,
			matcher?: Matcher,
		): (value: unknown) => boolean | number {
			if (!_isPlainObject(operand)) {
				throw new MiniMongoQueryError('$elemMatch need an object');
			}

			const operandObj = operand as Record<string, unknown>;
			const isDocMatcher = !isOperatorObject(
				keys(operandObj)
					.filter((key) => !isKey(LOGICAL_OPERATORS, key))
					.reduce((a: Record<string, unknown>, b: string) => Object.assign(a, { [b]: operandObj[b] }), {}),
				true,
			);
			let subMatcher: (arg: unknown) => { result: boolean; arrayIndices?: number[] };

			if (isDocMatcher) {
				subMatcher = compileDocumentSelector(operandObj, matcher, { inElemMatch: true });
			} else {
				subMatcher = compileValueSelector(operandObj, matcher);
			}

			return (value: unknown): boolean | number => {
				if (!Array.isArray(value)) {
					return false;
				}

				for (let i = 0; i < value.length; ++i) {
					const arrayElement = value[i];
					let arg: unknown;

					if (isDocMatcher) {
						if (!isIndexable(arrayElement)) {
							return false;
						}

						arg = arrayElement;
					} else {
						arg = [{ value: arrayElement, dontIterate: true }];
					}

					const matchResult = subMatcher(arg);
					if (matchResult.result) {
						return i;
					}
				}

				return false;
			};
		},
	},
};

interface LogicalOperator {
	(subSelector: unknown, matcher: Matcher, inElemMatch?: boolean): (doc: unknown) => { result: boolean };
}

interface LogicalOperators {
	$and: LogicalOperator;
	$or: LogicalOperator;
	$nor: LogicalOperator;
	$where: (selectorValue: unknown, matcher: Matcher) => (doc: unknown) => { result: boolean };
	$comment: () => (doc: unknown) => { result: boolean };
}

const LOGICAL_OPERATORS: LogicalOperators = {
	$and(subSelector: unknown, matcher: Matcher, inElemMatch?: boolean): (doc: unknown) => { result: boolean } {
		return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
	},

	$or(subSelector: unknown, matcher: Matcher, inElemMatch?: boolean): (doc: unknown) => { result: boolean } {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);

		if (matchers.length === 1) {
			return matchers[0];
		}

		return (doc: unknown): { result: boolean } => {
			const result = matchers.some((fn): boolean => fn(doc).result);

			return { result };
		};
	},

	$nor(subSelector: unknown, matcher: Matcher, inElemMatch?: boolean): (doc: unknown) => { result: boolean } {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);

		return (doc: unknown): { result: boolean } => {
			const result = matchers.every((fn): boolean => !fn(doc).result);

			return { result };
		};
	},

	$comment(): (doc: unknown) => { result: boolean } {
		return (): { result: boolean } => ({ result: true });
	},
};

interface ValueOperator {
	(operand: unknown, valueSelector?: Record<string, unknown>, matcher?: Matcher, isRoot?: boolean): BranchedMatcher;
}

interface ValueOperators {
	[key: string]: ValueOperator;
}

const VALUE_OPERATORS: ValueOperators = {
	$eq(operand: unknown): BranchedMatcher {
		return convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand));
	},

	$not(operand: unknown, valueSelector?: Record<string, unknown>, matcher?: Matcher): BranchedMatcher {
		return invertBranchedMatcher(compileValueSelector(operand, matcher));
	},

	$ne(operand: unknown): BranchedMatcher {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)));
	},

	$nin(operand: unknown): BranchedMatcher {
		return invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand)));
	},

	$exists(operand: unknown): BranchedMatcher {
		const exists = convertElementMatcherToBranchedMatcher((value) => value !== undefined);

		return operand ? exists : invertBranchedMatcher(exists);
	},

	$options(operand: unknown, valueSelector?: Record<string, unknown>): BranchedMatcher {
		if (!hasOwn(valueSelector, '$regex')) {
			throw new MiniMongoQueryError('$options needs a $regex');
		}

		return everythingMatcher;
	},

	$maxDistance(operand: unknown, valueSelector?: Record<string, unknown>): BranchedMatcher {
		if (!valueSelector.$near) {
			throw new MiniMongoQueryError('$maxDistance needs a $near');
		}

		return everythingMatcher;
	},

	$all(operand: unknown, valueSelector?: Record<string, unknown>, matcher?: Matcher): BranchedMatcher {
		if (!Array.isArray(operand)) {
			throw new MiniMongoQueryError('$all requires array');
		}

		if (operand.length === 0) {
			return nothingMatcher;
		}

		const branchedMatchers = (operand as unknown[]).map((criterion: unknown): BranchedMatcher => {
			if (isOperatorObject(criterion)) {
				throw new MiniMongoQueryError('no $ expressions in $all');
			}

			return compileValueSelector(criterion, matcher);
		});

		return andBranchedMatchers(branchedMatchers);
	},

	$near(operand: unknown, valueSelector?: Record<string, unknown>, matcher?: Matcher, isRoot?: boolean): BranchedMatcher {
		if (!isRoot) {
			throw new MiniMongoQueryError("$near can't be inside another $ operator");
		}

		matcher._hasGeoQuery = true;

		let maxDistance: number | undefined;
		let point: number[] | undefined;
		let distance: ((value: unknown) => number | null) | undefined;

		if (_isPlainObject(operand) && hasOwn(operand as Record<string, unknown>, '$geometry')) {
			const operandObj = operand as Record<string, unknown>;
			maxDistance = operandObj.$maxDistance as number | undefined;
			point = operandObj.$geometry as unknown;

			distance = (value: unknown): number | null => {
				if (!value) {
					return null;
				}

				if (!value.type) {
					return GeoJSON.pointDistance(point, { type: 'Point', coordinates: pointToArray(value) });
				}

				if (value.type === 'Point') {
					return GeoJSON.pointDistance(point, value);
				}

				return GeoJSON.geometryWithinRadius(value, point, maxDistance) ? 0 : maxDistance + 1;
			};
		} else {
			maxDistance = (valueSelector as Record<string, unknown>)?.$maxDistance as number | undefined;

			if (!isIndexable(operand)) {
				throw new MiniMongoQueryError('$near argument must be coordinate pair or GeoJSON');
			}

			point = pointToArray(operand);

			distance = (value: unknown): number | null => {
				if (!isIndexable(value)) {
					return null;
				}

				return distanceCoordinatePairs(point as number[], value);
			};
		}

		return (branchedValues: unknown): { result: boolean; distance?: number; arrayIndices?: number[] } => {
			const result: { result: boolean; distance?: number; arrayIndices?: number[] } = { result: false };

			expandArraysInBranches(branchedValues as BranchValue[]).every((branch: BranchValue): boolean => {
				let curDistance: number | null | undefined;

				if (!matcher._isUpdate) {
					if (!(typeof branch.value === 'object')) {
						return true;
					}

					curDistance = distance(branch.value);

					if (curDistance === null || curDistance > maxDistance) {
						return true;
					}

					if (result.distance !== undefined && result.distance <= curDistance) {
						return true;
					}
				}

				result.result = true;
				result.distance = curDistance;

				if (branch.arrayIndices) {
					result.arrayIndices = branch.arrayIndices;
				} else {
					delete result.arrayIndices;
				}

				return !matcher._isUpdate;
			});

			return result;
		};
	},
};

interface BranchValue {
	arrayIndices?: number[];
	value?: unknown;
	dontIterate?: boolean;
}

interface MatchResult {
	result: boolean;
	distance?: number;
	arrayIndices?: number[];
}

type BranchedMatcher = (docOrBranches: unknown) => MatchResult;

function everythingMatcher(docOrBranchedValues: unknown): MatchResult {
	return { result: true };
}

function andSomeMatchers(subMatchers: BranchedMatcher[]): BranchedMatcher {
	if (subMatchers.length === 0) {
		return everythingMatcher;
	}

	if (subMatchers.length === 1) {
		return subMatchers[0];
	}

	return (docOrBranches: unknown): MatchResult => {
		const match: MatchResult = { result: false };

		match.result = subMatchers.every((fn: BranchedMatcher): boolean => {
			const subResult = fn(docOrBranches);

			if (subResult.result && subResult.distance !== undefined && match.distance === undefined) {
				match.distance = subResult.distance;
			}

			if (subResult.result && subResult.arrayIndices) {
				match.arrayIndices = subResult.arrayIndices;
			}

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

function compileArrayOfDocumentSelectors(selectors: unknown, matcher: Matcher, inElemMatch?: boolean): ((doc: unknown) => MatchResult)[] {
	if (!Array.isArray(selectors) || selectors.length === 0) {
		throw new MiniMongoQueryError('$and/$or/$nor must be nonempty array');
	}

	return selectors.map((subSelector) => {
		if (!_isPlainObject(subSelector)) {
			throw new MiniMongoQueryError('$or/$and/$nor entries need to be full objects');
		}

		return compileDocumentSelector(subSelector, matcher, { inElemMatch });
	});
}

interface CompileOptions {
	inElemMatch?: boolean | undefined;
	isRoot?: boolean;
}

function compileDocumentSelector(docSelector: unknown, matcher: Matcher, options: CompileOptions = {}): (doc: unknown) => MatchResult {
	const docMatchers = Object.keys(docSelector as Record<string, unknown>)
		.map((key: string): ((doc: unknown) => MatchResult) | undefined => {
			const subSelector = docSelector[key];

			if (key.substr(0, 1) === '$') {
				if (!hasOwn(LOGICAL_OPERATORS, key)) {
					throw new MiniMongoQueryError('Unrecognized logical operator: '.concat(key));
				}

				matcher._isSimple = false;

				return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);
			}

			if (!options.inElemMatch) {
				matcher._recordPathUsed(key);
			}

			if (typeof subSelector === 'function') {
				return undefined;
			}

			const lookUpByIndex = makeLookupFunction(key);
			const valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);

			return (doc) => valueMatcher(lookUpByIndex(doc));
		})
		.filter(Boolean);

	return andDocumentMatchers(docMatchers);
}

function compileValueSelector(valueSelector: unknown, matcher: Matcher, isRoot?: boolean): BranchedMatcher {
	if (valueSelector instanceof RegExp) {
		matcher._isSimple = false;

		return convertElementMatcherToBranchedMatcher((value: unknown): boolean => regexpElementMatcher(valueSelector)(value));
	}

	if (isOperatorObject(valueSelector)) {
		return operatorBranchedMatcher(valueSelector, matcher, isRoot);
	}

	return convertElementMatcherToBranchedMatcher((value: unknown): boolean => equalityElementMatcher(valueSelector)(value));
}

interface ElementMatcherOptions {
	dontExpandLeafArrays?: boolean;
	dontIncludeLeafArrays?: boolean;
}

function convertElementMatcherToBranchedMatcher(
	elementMatcher: (value: unknown) => boolean | number,
	options?: ElementMatcherOptions,
): BranchedMatcher {
	const opts = options || {};

	return (branches: unknown): MatchResult => {
		const expanded = opts.dontExpandLeafArrays
			? (branches as BranchValue[])
			: expandArraysInBranches(branches as BranchValue[], opts.dontIncludeLeafArrays);

		const match: MatchResult = { result: false };

		match.result = expanded.some((element: BranchValue): boolean => {
			let matched: boolean | number = elementMatcher(element.value);

			if (typeof matched === 'number') {
				if (!element.arrayIndices) {
					element.arrayIndices = [matched];
				}

				matched = true;
			}

			if (matched && element.arrayIndices) {
				match.arrayIndices = element.arrayIndices;
			}

			return !!matched;
		});

		return match;
	};
}

function distanceCoordinatePairs(a: unknown, b: unknown): number {
	const pointA = pointToArray(a);
	const pointB = pointToArray(b);

	return Math.hypot(pointA[0] - pointB[0], pointA[1] - pointB[1]);
}

function nothingMatcher(docOrBranchedValues: unknown): MatchResult {
	return { result: false };
}

interface ProjectionRuleTree {
	[key: string]: boolean | ProjectionRuleTree;
}

interface ProjectionDetailsResult {
	including: boolean | null;
	tree: ProjectionRuleTree;
}

interface ObserveCallbacks {
	added?: (doc: Document) => void;
	addedAt?: (doc: Document, atIndex: number, before: string | null) => void;
	changed?: (newDoc: Document, oldDoc: Document) => void;
	changedAt?: (newDoc: Document, oldDoc: Document, atIndex: number) => void;
	removed?: (oldDoc: Document) => void;
	removedAt?: (oldDoc: Document, atIndex: number) => void;
	movedTo?: (doc: Document, fromIndex: number, toIndex: number, before: string | null) => void;
	_suppress_initial?: boolean;
	_no_indices?: boolean;
}

interface ObserveChangesCallbacks {
	added?: (id: unknown, fields: Record<string, unknown>) => void | Promise<void>;
	addedBefore?: (id: unknown, fields: Record<string, unknown>, before: unknown) => void | Promise<void>;
	changed?: (id: unknown, fields: Record<string, unknown>) => void | Promise<void>;
	removed?: (id: unknown) => void | Promise<void>;
	movedBefore?: (id: unknown, before: unknown) => void | Promise<void>;
	_fromObserve?: boolean;
}

interface Document {
	_id?: unknown;
	[key: string]: unknown;
}

interface Query {
	ordered: boolean;
	results: Document[] | IdMap<unknown, Document>;
	sorter?: Sorter | null;
	distances?: IdMap<unknown, number>;
	projectionFn: (doc: Document) => Document;
	added: (id: unknown, fields: Document) => void | Promise<void>;
	addedBefore?: (id: unknown, fields: Document, before: unknown) => void | Promise<void>;
	changed: (id: unknown, fields: Record<string, unknown>) => void | Promise<void>;
	removed: (id: unknown) => void | Promise<void>;
	movedBefore?: (id: unknown, before: unknown) => void | Promise<void>;
}

function projectionDetails(fields: unknown): ProjectionDetailsResult {
	let fieldsKeys = Object.keys(fields as Record<string, unknown>).sort();

	if (!(fieldsKeys.length === 1 && fieldsKeys[0] === '_id') && !(fieldsKeys.includes('_id') && fields._id)) {
		fieldsKeys = fieldsKeys.filter((key) => key !== '_id');
	}

	let including: boolean | null = null;

	fieldsKeys.forEach((keyPath: string): void => {
		const rule = !!(fields as Record<string, unknown>)[keyPath];

		if (including === null) {
			including = rule;
		}

		if (including !== rule) {
			throw MinimongoError('You cannot currently mix including and excluding fields.');
		}
	});

	const projectionRulesTree = pathsToTree(
		fieldsKeys,
		(_path: string): boolean | null => including,
		(_node: unknown, path: string, fullPath: string): ProjectionRuleTree => {
			const currentPath = fullPath;
			const anotherPath = path;

			throw MinimongoError(
				`${'both '
					.concat(currentPath, ' and ')
					.concat(anotherPath, ' found in fields option, ')}using both of them may trigger unexpected behavior. Did you mean to ` +
					`use only one of them?`,
			);
		},
	);

	return { including, tree: projectionRulesTree };
}

function pathsToTree(
	paths: string[],
	newLeafFn: (path: string) => boolean | null,
	conflictFn: (node: unknown, path: string, fullPath: string) => ProjectionRuleTree,
	root?: ProjectionRuleTree,
): ProjectionRuleTree {
	const finalRoot: ProjectionRuleTree = root || {};

	paths.forEach((path: string): void => {
		const pathArray = path.split('.');
		let tree: ProjectionRuleTree | unknown = finalRoot;

		const success = pathArray.slice(0, -1).every((key: string, i: number): boolean => {
			const treeObj = tree as Record<string, unknown>;
			if (!isKey(treeObj, key)) {
				treeObj[key] = {};
			} else if (treeObj[key] !== Object(treeObj[key])) {
				treeObj[key] = conflictFn(treeObj[key], pathArray.slice(0, i + 1).join('.'), path);

				if (treeObj[key] !== Object(treeObj[key])) {
					return false;
				}
			}

			tree = treeObj[key];

			return true;
		});

		if (success) {
			const lastKey = pathArray[pathArray.length - 1];
			const treeObj = tree as Record<string, unknown>;

			if (isKey(treeObj, lastKey)) {
				treeObj[lastKey] = conflictFn(treeObj[lastKey], path, path);
			} else {
				treeObj[lastKey] = newLeafFn(path);
			}
		}
	});

	return finalRoot;
}

function equalityElementMatcher(elementSelector: unknown): (value: unknown) => boolean {
	if (isOperatorObject(elementSelector)) {
		throw new MiniMongoQueryError("Can't create equalityValueSelector for operator object");
	}

	if (elementSelector == null) {
		return (value: unknown): boolean => value == null;
	}

	return (value: unknown): boolean => TypeChecker._equal(elementSelector, value);
}

const _isPlainObject = (x: unknown): x is Record<string, unknown> => {
	return typeof x === 'object' && x !== null;
};

const _selectorIsId = (selector: unknown): selector is string | number =>
	typeof selector === 'number' || typeof selector === 'string' || selector instanceof ObjectID;

export const _selectorIsIdPerhapsAsObject = (selector: unknown): boolean =>
	_selectorIsId(selector) ||
	(_selectorIsId((selector as Record<string, unknown>)?._id) && Object.keys(selector as Record<string, unknown>).length === 1);

interface MinimongoErrorOptions {
	field?: string;
}

const MinimongoError = function (message: string, options?: MinimongoErrorOptions): Error {
	if (typeof message === 'string' && options.field) {
		message += " for field '".concat(options.field, "'");
	}

	const error = new Error(message);

	error.name = 'MinimongoError';

	return error;
};

function assertHasValidFieldNames(doc: unknown): void {
	if (doc && typeof doc === 'object') {
		JSON.stringify(doc, (key: string, value: unknown): unknown => {
			assertIsValidFieldName(key);

			return value;
		});
	}
}

function assertIsValidFieldName(key: unknown): void {
	if (typeof key === 'string') {
		const match = key.match(/^\$|\.|\0/);
		if (match) {
			throw MinimongoError('Key '.concat(key, ' must not ').concat(invalidCharMsg[match[0] as '$' | '.' | '\0']));
		}
	}
}

class MongoIdMap extends IdMap<ObjectID | string | undefined, Document> {
	constructor() {
		super(ObjectID.stringify, ObjectID.parse);
	}
}

class LocalCollection {
	name?: string | undefined;

	_docs: MongoIdMap;

	_observeQueue: SynchronousQueue;

	next_qid: number;

	queries: Record<string, any>;

	_savedOriginals: any;

	paused: boolean;

	constructor(name?: string) {
		this.name = name;
		this._docs = new MongoIdMap();

		this._observeQueue = new SynchronousQueue();

		this.next_qid = 1;
		this.queries = Object.create(null);
		this._savedOriginals = null;
		this.paused = false;
	}

	countDocuments(selector, options) {
		return this.find(selector !== null && selector !== void 0 ? selector : {}, options).countAsync();
	}

	estimatedDocumentCount(options) {
		return this.find({}, options).countAsync();
	}

	find(selector, options) {
		if (arguments.length === 0) {
			selector = {};
		}

		return new Cursor(this, selector, options);
	}

	findOne(selector) {
		const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (arguments.length === 0) {
			selector = {};
		}

		options.limit = 1;

		return this.find(selector, options).fetch()[0];
	}

	async findOneAsync(selector) {
		const options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

		if (arguments.length === 0) {
			selector = {};
		}

		options.limit = 1;

		return (await this.find(selector, options).fetchAsync())[0];
	}

	prepareInsert(doc) {
		assertHasValidFieldNames(doc);

		if (!isKey(doc, '_id')) {
			doc._id = _useOID ? new ObjectID() : Random.id();
		}

		const id = doc._id;

		if (this._docs.has(id)) {
			throw MinimongoError("Duplicate _id '".concat(id, "'"));
		}

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

			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.distances && matchResult.distance !== undefined) {
					query.distances.set(id, matchResult.distance);
				}

				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.push(qid);
				} else {
					_insertInResultsSync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) {
				this._recomputeResults(this.queries[qid]);
			}
		});

		this._observeQueue.drain();

		if (callback) {
			Meteor.defer(() => {
				callback(null, id);
			});
		}

		return id;
	}

	async insertAsync(doc, callback) {
		doc = EJSON.clone(doc);

		const id = this.prepareInsert(doc);
		const queriesToRecompute = [];

		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const matchResult = query.matcher.documentMatches(doc);

			if (matchResult.result) {
				if (query.distances && matchResult.distance !== undefined) {
					query.distances.set(id, matchResult.distance);
				}

				if (query.cursor.skip || query.cursor.limit) {
					queriesToRecompute.push(qid);
				} else {
					await _insertInResultsAsync(query, doc);
				}
			}
		}

		queriesToRecompute.forEach((qid) => {
			if (this.queries[qid]) {
				this._recomputeResults(this.queries[qid]);
			}
		});

		await this._observeQueue.drain();

		if (callback) {
			Meteor.defer(() => {
				callback(null, id);
			});
		}

		return id;
	}

	pauseObservers() {
		if (this.paused) {
			return;
		}

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

			if (query.ordered) {
				query.results = [];
			} else {
				query.results.clear();
			}
		});

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	prepareRemove(selector) {
		const matcher = new Matcher(selector);
		const remove = [];

		this._eachPossiblyMatchingDocSync(selector, (doc, id) => {
			if (matcher.documentMatches(doc).result) {
				remove.push(id);
			}
		});

		const queriesToRecompute = [];
		const queryRemove = [];

		for (let i = 0; i < remove.length; i++) {
			const removeId = remove[i];
			const removeDoc = this._docs.get(removeId);

			Object.keys(this.queries).forEach((qid) => {
				const query = this.queries[qid];

				if (query.dirty) {
					return;
				}

				if (query.matcher.documentMatches(removeDoc).result) {
					if (query.cursor.skip || query.cursor.limit) {
						queriesToRecompute.push(qid);
					} else {
						queryRemove.push({ qid, doc: removeDoc });
					}
				}
			});

			this._saveOriginal(removeId, removeDoc);
			this._docs.remove(removeId);
		}

		return { queriesToRecompute, queryRemove, remove };
	}

	remove(selector, callback) {
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);

		queryRemove.forEach((remove) => {
			const query = this.queries[remove.qid];

			if (query) {
				query.distances && query.distances.remove(remove.doc._id);
				LocalCollection._removeFromResultsSync(query, remove.doc);
			}
		});

		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query);
			}
		});

		this._observeQueue.drain();

		const result = remove.length;

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	async removeAsync(selector, callback) {
		if (this.paused && !this._savedOriginals && EJSON.equals(selector, {})) {
			return this.clearResultQueries(callback);
		}

		const { queriesToRecompute, queryRemove, remove } = this.prepareRemove(selector);

		for (const remove of queryRemove) {
			const query = this.queries[remove.qid];

			if (query) {
				query.distances && query.distances.remove(remove.doc._id);
				await LocalCollection._removeFromResultsAsync(query, remove.doc);
			}
		}

		queriesToRecompute.forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query);
			}
		});

		await this._observeQueue.drain();

		const result = remove.length;

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	_resumeObservers() {
		if (!this.paused) {
			return;
		}

		this.paused = false;

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if (query.dirty) {
				query.dirty = false;
				this._recomputeResults(query, query.resultsSnapshot);
			} else {
				DiffSequence.diffQueryChanges(query.ordered, query.resultsSnapshot, query.results, query, {
					projectionFn: query.projectionFn,
				});
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
		if (!this._savedOriginals) {
			throw new Error('Called retrieveOriginals without saveOriginals');
		}

		const originals = this._savedOriginals;

		this._savedOriginals = null;

		return originals;
	}

	saveOriginals() {
		if (this._savedOriginals) {
			throw new Error('Called saveOriginals twice without retrieveOriginals');
		}

		this._savedOriginals = new MongoIdMap();
	}

	prepareUpdate(selector) {
		const qidToOriginalResults = {};
		const docMap = new MongoIdMap();
		const idsMatched = _idsMatchedBySelector(selector);

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if ((query.cursor.skip || query.cursor.limit) && !this.paused) {
				if (query.results instanceof MongoIdMap) {
					qidToOriginalResults[qid] = query.results.clone();

					return;
				}

				if (!(query.results instanceof Array)) {
					throw new Error('Assertion failed: query.results not an array');
				}

				const memoizedCloneIfNeeded = (doc) => {
					if (docMap.has(doc._id)) {
						return docMap.get(doc._id);
					}

					const docToMemoize = idsMatched && !idsMatched.some((id) => EJSON.equals(id, doc._id)) ? doc : EJSON.clone(doc);

					docMap.set(doc._id, docToMemoize);

					return docToMemoize;
				};

				qidToOriginalResults[qid] = query.results.map(memoizedCloneIfNeeded);
			}
		});

		return qidToOriginalResults;
	}

	finishUpdate(_ref) {
		const { options, updateCount, callback, insertedId } = _ref;
		let result;

		if (options._returnObject) {
			result = { numberAffected: updateCount };

			if (insertedId !== undefined) {
				result.insertedId = insertedId;
			}
		} else {
			result = updateCount;
		}

		if (callback) {
			Meteor.defer(() => {
				callback(null, result);
			});
		}

		return result;
	}

	// async updateAsync(selector, mod, options, callback) {
	// 	if (!callback && options instanceof Function) {
	// 		callback = options;
	// 		options = null;
	// 	}

	// 	if (!options) {
	// 		options = {};
	// 	}

	// 	const matcher = new Matcher(selector, true);
	// 	const qidToOriginalResults = this.prepareUpdate(selector);
	// 	let recomputeQids = {};
	// 	let updateCount = 0;

	// 	await this._eachPossiblyMatchingDocAsync(selector, async (doc, id) => {
	// 		const queryResult = matcher.documentMatches(doc);

	// 		if (queryResult.result) {
	// 			this._saveOriginal(id, doc);
	// 			recomputeQids = await this._modifyAndNotifyAsync(doc, mod, queryResult.arrayIndices);
	// 			++updateCount;

	// 			if (!options.multi) {
	// 				return false;
	// 			}
	// 		}

	// 		return true;
	// 	});

	// 	Object.keys(recomputeQids).forEach((qid) => {
	// 		const query = this.queries[qid];

	// 		if (query) {
	// 			this._recomputeResults(query, qidToOriginalResults[qid]);
	// 		}
	// 	});

	// 	await this._observeQueue.drain();

	// 	let insertedId;

	// 	if (updateCount === 0 && options.upsert) {
	// 		const doc = LocalCollection._createUpsertDocument(selector, mod);

	// 		if (!doc._id && options.insertedId) {
	// 			doc._id = options.insertedId;
	// 		}

	// 		insertedId = await this.insertAsync(doc);
	// 		updateCount = 1;
	// 	}

	// 	return this.finishUpdate({ options, insertedId, updateCount, callback });
	// }

	update(selector, mod, options, callback) {
		if (!callback && options instanceof Function) {
			callback = options;
			options = null;
		}

		if (!options) {
			options = {};
		}

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

				if (!options.multi) {
					return false;
				}
			}

			return true;
		});

		Object.keys(recomputeQids).forEach((qid) => {
			const query = this.queries[qid];

			if (query) {
				this._recomputeResults(query, qidToOriginalResults[qid]);
			}
		});

		this._observeQueue.drain();

		let insertedId;

		if (updateCount === 0 && options.upsert) {
			const doc = LocalCollection._createUpsertDocument(selector, mod);

			if (!doc._id && options.insertedId) {
				doc._id = options.insertedId;
			}

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

				if (doc && !(await fn(doc, id))) {
					break;
				}
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

				if (doc && !fn(doc, id)) {
					break;
				}
			}
		} else {
			this._docs.forEach(fn);
		}
	}

	_getMatchedDocAndModify(doc, mod, arrayIndices) {
		const matched_before = {};

		Object.keys(this.queries).forEach((qid) => {
			const query = this.queries[qid];

			if (query.dirty) {
				return;
			}

			if (query.ordered) {
				matched_before[qid] = query.matcher.documentMatches(doc).result;
			} else {
				matched_before[qid] = query.results.has(doc._id);
			}
		});

		return matched_before;
	}

	_modifyAndNotifySync(doc, mod, arrayIndices) {
		const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
		const old_doc = EJSON.clone(doc);

		LocalCollection._modify(doc, mod, { arrayIndices });

		const recomputeQids = {};

		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matched_before[qid];

			if (after && query.distances && afterMatch.distance !== undefined) {
				query.distances.set(doc._id, afterMatch.distance);
			}

			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) {
					recomputeQids[qid] = true;
				}
			} else if (before && !after) {
				LocalCollection._removeFromResultsSync(query, doc);
			} else if (!before && after) {
				LocalCollection._insertInResultsSync(query, doc);
			} else if (before && after) {
				LocalCollection._updateInResultsSync(query, doc, old_doc);
			}
		}

		return recomputeQids;
	}

	async _modifyAndNotifyAsync(doc, mod, arrayIndices) {
		const matched_before = this._getMatchedDocAndModify(doc, mod, arrayIndices);
		const old_doc = EJSON.clone(doc);

		LocalCollection._modify(doc, mod, { arrayIndices });

		const recomputeQids = {};

		for (const qid of Object.keys(this.queries)) {
			const query = this.queries[qid];

			if (query.dirty) {
				continue;
			}

			const afterMatch = query.matcher.documentMatches(doc);
			const after = afterMatch.result;
			const before = matched_before[qid];

			if (after && query.distances && afterMatch.distance !== undefined) {
				query.distances.set(doc._id, afterMatch.distance);
			}

			if (query.cursor.skip || query.cursor.limit) {
				if (before || after) {
					recomputeQids[qid] = true;
				}
			} else if (before && !after) {
				await LocalCollection._removeFromResultsAsync(query, doc);
			} else if (!before && after) {
				await LocalCollection._insertInResultsAsync(query, doc);
			} else if (before && after) {
				await LocalCollection._updateInResultsAsync(query, doc, old_doc);
			}
		}

		return recomputeQids;
	}

	_recomputeResults(
		query: { dirty?: boolean; results?: any; distances?: Map<string, any>; cursor?: any; ordered?: boolean; projectionFn?: any },
		oldResults?: any,
	) {
		if (this.paused) {
			query.dirty = true;

			return;
		}

		if (!this.paused && !oldResults) {
			oldResults = query.results;
		}

		if (query.distances) {
			query.distances.clear();
		}

		query.results = query.cursor._getRawObjects({ distances: query.distances, ordered: query.ordered });

		if (!this.paused) {
			DiffSequence.diffQueryChanges(query.ordered, oldResults, query.results, query, {
				projectionFn: query.projectionFn,
			});
		}
	}

	_saveOriginal(id, doc) {
		if (!this._savedOriginals) {
			return;
		}

		if (this._savedOriginals.has(id)) {
			return;
		}

		this._savedOriginals.set(id, EJSON.clone(doc));
	}
}

class Sorter {
	_sortSpecParts: { ascending: boolean; lookup: (doc: Document) => unknown; path: string }[];

	_sortFunction: ((doc1: Document, doc2: Document) => number) | null;

	_selectorForAffectedByModifier?: Matcher;

	_keyComparator?: (key1: unknown[], key2: unknown[]) => number;

	constructor(spec) {
		this._sortSpecParts = [];
		this._sortFunction = null;

		const addSpecPart = (path, ascending) => {
			if (!path) {
				throw Error('sort keys must be non-empty');
			}

			if (path.charAt(0) === '$') {
				throw Error('unsupported sort key: '.concat(path));
			}

			this._sortSpecParts.push({
				ascending,
				lookup: makeLookupFunction(path, { forSort: true }),
				path,
			});
		};

		if (spec instanceof Array) {
			spec.forEach((element) => {
				if (typeof element === 'string') {
					addSpecPart(element, true);
				} else {
					addSpecPart(element[0], element[1] !== 'desc');
				}
			});
		} else if (typeof spec === 'object') {
			Object.keys(spec).forEach((key) => {
				addSpecPart(key, spec[key] >= 0);
			});
		} else if (typeof spec === 'function') {
			this._sortFunction = spec;
		} else {
			throw Error('Bad sort specification: '.concat(JSON.stringify(spec)));
		}

		if (this._sortFunction) {
			return;
		}

		if (this.affectedByModifier) {
			const selector = {};

			this._sortSpecParts.forEach((spec) => {
				selector[spec.path] = 1;
			});

			this._selectorForAffectedByModifier = new Matcher(selector);
		}

		this._keyComparator = composeComparators(this._sortSpecParts.map((spec, i) => this._keyFieldComparator(i)));
	}

	getComparator(options) {
		if (this._sortSpecParts.length || !options || !options.distances) {
			return this._getBaseComparator();
		}

		const { distances } = options;

		return (a, b) => {
			if (!distances.has(a._id)) {
				throw Error('Missing distance for '.concat(a._id));
			}

			if (!distances.has(b._id)) {
				throw Error('Missing distance for '.concat(b._id));
			}

			return distances.get(a._id) - distances.get(b._id);
		};
	}

	_compareKeys(key1, key2) {
		if (key1.length !== this._sortSpecParts.length || key2.length !== this._sortSpecParts.length) {
			throw Error('Key has wrong length');
		}

		return this._keyComparator(key1, key2);
	}

	_generateKeysFromDoc(doc, cb) {
		if (this._sortSpecParts.length === 0) {
			throw new Error("can't generate keys without a spec");
		}

		const pathFromIndices = (indices) => ''.concat(indices.join(','), ',');
		let knownPaths = null;

		const valuesByIndexAndPath = this._sortSpecParts.map((spec) => {
			let branches = expandArraysInBranches(spec.lookup(doc), true);

			if (!branches.length) {
				branches = [{ value: void 0 }];
			}

			const element = Object.create(null);
			let usedPaths = false;

			branches.forEach((branch) => {
				if (!branch.arrayIndices) {
					if (branches.length > 1) {
						throw Error('multiple branches but no array used?');
					}

					element[''] = branch.value;

					return;
				}

				usedPaths = true;

				const path = pathFromIndices(branch.arrayIndices);

				if (hasOwn(element, path)) {
					throw Error('duplicate path: '.concat(path));
				}

				element[path] = branch.value;

				if (knownPaths && !hasOwn(knownPaths, path)) {
					throw Error('cannot index parallel arrays');
				}
			});

			if (knownPaths) {
				if (!hasOwn(element, '') && Object.keys(knownPaths).length !== Object.keys(element).length) {
					throw Error('cannot index parallel arrays!');
				}
			} else if (usedPaths) {
				knownPaths = {};

				Object.keys(element).forEach((path) => {
					knownPaths[path] = true;
				});
			}

			return element;
		});

		if (!knownPaths) {
			const soleKey = valuesByIndexAndPath.map((values) => {
				if (!hasOwn(values, '')) {
					throw Error('no value in sole key case?');
				}

				return values[''];
			});

			cb(soleKey);

			return;
		}

		Object.keys(knownPaths).forEach((path) => {
			const key = valuesByIndexAndPath.map((values) => {
				if (hasOwn(values, '')) {
					return values[''];
				}

				if (!hasOwn(values, path)) {
					throw Error('missing path?');
				}

				return values[path];
			});

			cb(key);
		});
	}

	_getBaseComparator() {
		if (this._sortFunction) {
			return this._sortFunction;
		}

		if (!this._sortSpecParts.length) {
			return (doc1, doc2) => 0;
		}

		return (doc1, doc2) => {
			const key1 = this._getMinKeyFromDoc(doc1);
			const key2 = this._getMinKeyFromDoc(doc2);

			return this._compareKeys(key1, key2);
		};
	}

	_getMinKeyFromDoc(doc) {
		let minKey = null;

		this._generateKeysFromDoc(doc, (key) => {
			if (minKey === null) {
				minKey = key;

				return;
			}

			if (this._compareKeys(key, minKey) < 0) {
				minKey = key;
			}
		});

		return minKey;
	}

	_getPaths() {
		return this._sortSpecParts.map((part) => part.path);
	}

	_keyFieldComparator(i) {
		const invert = !this._sortSpecParts[i].ascending;

		return (key1, key2) => {
			const compare = TypeChecker._cmp(key1[i], key2[i]);

			return invert ? -compare : compare;
		};
	}
}

function composeComparators(comparatorArray) {
	return (a, b) => {
		for (let i = 0; i < comparatorArray.length; ++i) {
			const compare = comparatorArray[i](a, b);

			if (compare !== 0) {
				return compare;
			}
		}

		return 0;
	};
}

class Matcher {
	_paths: Record<string, boolean>;

	_hasGeoQuery: boolean;

	_hasWhere: boolean;

	_isSimple: boolean;

	_matchingDocument: Record<string, unknown> | undefined;

	_selector: unknown;

	_docMatcher: (doc: Record<string, unknown>) => { result: boolean; distance?: number };

	_isUpdate: boolean;

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
		if (doc !== Object(doc)) {
			throw Error('documentMatches needs a document');
		}

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

		if (!selector || (hasOwn(selector, '_id') && !selector._id)) {
			this._isSimple = false;

			return nothingMatcher;
		}

		if (Array.isArray(selector) || EJSON.isBinary(selector) || typeof selector === 'boolean') {
			throw new Error('Invalid selector: '.concat(selector));
		}

		this._selector = EJSON.clone(selector);

		return compileDocumentSelector(selector, this, { isRoot: true });
	}

	_getPaths() {
		return Object.keys(this._paths);
	}

	_recordPathUsed(path: string) {
		this._paths[path] = true;
	}
}

// function getAsyncMethodName(method: string): string {
// 	return ''.concat(method.replace('_', ''), 'Async');
// }

// const ASYNC_COLLECTION_METHODS = [
// 	'_createCappedCollection',
// 	'dropCollection',
// 	'dropIndex',
// 	'createIndex',
// 	'findOne',
// 	'insert',
// 	'remove',
// 	'update',
// 	'upsert',
// ];

// const ASYNC_CURSOR_METHODS = ['count', 'fetch', 'forEach', 'map'];
// const CLIENT_ONLY_METHODS = ['findOne', 'insert', 'remove', 'update', 'upsert'];
export const wrapTransform = (transform: ((doc: any) => any) | null) => {
	return transform;
};
export class Cursor {
	matcher: Matcher;

	collection: LocalCollection;

	sorter: Sorter | null;

	skip: number;

	limit: number | undefined;

	fields: Record<string, unknown> | undefined;

	_projectionFn: (doc: Record<string, unknown>) => Record<string, unknown>;

	_transform: ((doc: Record<string, unknown>) => unknown) | null;

	_selectorId: unknown;

	reactive: boolean;

	constructor(collection: LocalCollection, selector) {
		const options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

		this.collection = collection;
		this.sorter = null;
		this.matcher = new Matcher(selector);

		if (_selectorIsIdPerhapsAsObject(selector)) {
			this._selectorId = hasOwn(selector, '_id') ? selector._id : selector;
		} else {
			this._selectorId = undefined;

			if (this.matcher.hasGeoQuery() || options.sort) {
				this.sorter = new Minimongo.Sorter(options.sort || []);
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

	async fetchAsync() {
		const result = [];

		this.forEach((doc) => {
			result.push(doc);
		});

		return result;
	}

	count() {
		if (this.reactive) {
			this._depend({ added: true, removed: true }, true);
		}

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

	forEach(callback, thisArg) {
		if (this.reactive) {
			this._depend({
				addedBefore: true,
				removed: true,
				changed: true,
				movedBefore: true,
			});
		}

		this._getRawObjects({ ordered: true }).forEach((element, i) => {
			element = this._projectionFn(element);

			if (this._transform) {
				element = this._transform(element);
			}

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

	observe(options) {
		return LocalCollection._observeFromObserveChanges(this, options);
	}

	observeAsync(options) {
		return new Promise((resolve) => resolve(this.observe(options)));
	}

	observeChanges(options: ObserveChangesCallbacks & { _allow_unordered?: boolean; _suppress_initial?: boolean }) {
		const ordered = _observeChangesCallbacksAreOrdered(options);

		if (!options._allow_unordered && !ordered && (this.skip || this.limit)) {
			throw new Error(
				"Must use an ordered observe with skip or limit (i.e. 'addedBefore' " +
					"for observeChanges or 'addedAt' for observe, instead of 'added').",
			);
		}

		if (this.fields && (this.fields._id === 0 || this.fields._id === false)) {
			throw Error('You may not observe a cursor with {fields: {_id: 0}}');
		}

		const distances = this.matcher.hasGeoQuery() && ordered && new MongoIdMap();

		const query = {
			cursor: this,
			dirty: false,
			distances,
			matcher: this.matcher,
			ordered,
			projectionFn: this._projectionFn,
			resultsSnapshot: null,
			sorter: ordered && this.sorter,
		};

		let qid;

		if (this.reactive) {
			qid = this.collection.next_qid++;
			this.collection.queries[qid] = query;
		}

		query.results = this._getRawObjects({ ordered, distances: query.distances });

		if (this.collection.paused) {
			query.resultsSnapshot = ordered ? [] : new MongoIdMap();
		}

		const wrapCallback = (fn) => {
			if (!fn) {
				return () => {};
			}

			const self = this;

			return function () {
				if (self.collection.paused) {
					return;
				}

				const args = arguments;

				self.collection._observeQueue.queueTask(() => {
					fn.apply(this, args);
				});
			};
		};

		query.added = wrapCallback(options.added);
		query.changed = wrapCallback(options.changed);
		query.removed = wrapCallback(options.removed);

		if (ordered) {
			query.addedBefore = wrapCallback(options.addedBefore);
			query.movedBefore = wrapCallback(options.movedBefore);
		}

		if (!options._suppress_initial && !this.collection.paused) {
			let _query$results;
			let _query$results$size;

			const handler = (doc) => {
				const fields = EJSON.clone(doc);

				delete fields._id;

				if (ordered) {
					query.addedBefore(doc._id, this._projectionFn(fields), null);
				}

				query.added(doc._id, this._projectionFn(fields));
			};

			if (query.results.length) {
				for (const doc of query.results) {
					handler(doc);
				}
			}

			if (
				(_query$results = query.results) !== null &&
				_query$results !== void 0 &&
				(_query$results$size = _query$results.size) !== null &&
				_query$results$size !== void 0 &&
				_query$results$size.call(_query$results)
			) {
				query.results.forEach(handler);
			}
		}

		const handle = Object.assign(new LocalCollection.ObserveHandle(), {
			collection: this.collection,
			stop: () => {
				if (this.reactive) {
					delete this.collection.queries[qid];
				}
			},
			isReady: false,
			isReadyPromise: null,
		});

		if (this.reactive && Tracker.active) {
			Tracker.onInvalidate(() => {
				handle.stop();
			});
		}

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

	_depend(changers, _allow_unordered = false) {
		if (Tracker.active) {
			const dependency = new Tracker.Dependency();
			const notify = dependency.changed.bind(dependency);

			dependency.depend();

			const options = { _allow_unordered, _suppress_initial: true };

			['added', 'addedBefore', 'changed', 'movedBefore', 'removed'].forEach((fn) => {
				if (changers[fn]) {
					options[fn] = notify;
				}
			});

			this.observeChanges(options);
		}
	}

	_getCollectionName() {
		return this.collection.name;
	}

	_getRawObjects(options: { ordered?: boolean; distances?: MongoIdMap; applySkipLimit?: boolean } = {}) {
		const applySkipLimit = options.applySkipLimit !== false;
		const results = options.ordered ? [] : new MongoIdMap();

		if (this._selectorId !== undefined) {
			if (applySkipLimit && this.skip) {
				return results;
			}

			const selectedDoc = this.collection._docs.get(this._selectorId);

			if (selectedDoc) {
				if (options.ordered) {
					results.push(selectedDoc);
				} else {
					results.set(this._selectorId, selectedDoc);
				}
			}

			return results;
		}

		let distances;

		if (this.matcher.hasGeoQuery() && options.ordered) {
			if (options.distances) {
				distances = options.distances;
				distances.clear();
			} else {
				distances = new MongoIdMap();
			}
		}

		Meteor._runFresh(() => {
			this.collection._docs.forEach((doc, id) => {
				const matchResult = this.matcher.documentMatches(doc);

				if (matchResult.result) {
					if (options.ordered) {
						results.push(doc);

						if (distances && matchResult.distance !== undefined) {
							distances.set(id, matchResult.distance);
						}
					} else {
						results.set(id, doc);
					}
				}

				if (!applySkipLimit) {
					return true;
				}

				return !this.limit || this.skip || this.sorter || results.length !== this.limit;
			});
		});

		if (!options.ordered) {
			return results;
		}

		if (this.sorter) {
			results.sort(this.sorter.getComparator({ distances }));
		}

		if (!applySkipLimit || (!this.limit && !this.skip)) {
			return results;
		}

		return results.slice(this.skip, this.limit ? this.limit + this.skip : results.length);
	}

	_publishCursor(subscription) {
		if (!Package.mongo) {
			throw new Error("Can't publish from Minimongo without the `mongo` package.");
		}

		if (!this.collection.name) {
			throw new Error("Can't publish a cursor from a collection without a name.");
		}

		return Package.mongo.Mongo.Collection._publishCursor(this, subscription, this.collection.name);
	}
}

LocalCollection.Cursor = Cursor;
LocalCollection.ObserveHandle = ObserveHandle;

class CachingChangeObserver {
	constructor() {
		const options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
		const orderedFromCallbacks = options.callbacks && _observeChangesCallbacksAreOrdered(options.callbacks);

		if (hasOwn(options, 'ordered')) {
			this.ordered = options.ordered;

			if (options.callbacks && options.ordered !== orderedFromCallbacks) {
				throw Error("ordered option doesn't match callbacks");
			}
		} else if (options.callbacks) {
			this.ordered = orderedFromCallbacks;
		} else {
			throw Error('must provide ordered or callbacks');
		}

		const callbacks = options.callbacks || {};

		if (this.ordered) {
			this.docs = new OrderedDict(MongoID.idStringify);

			this.applyChange = {
				addedBefore: (id, fields, before) => {
					const doc = { ...fields };

					doc._id = id;

					if (callbacks.addedBefore) {
						callbacks.addedBefore.call(this, id, EJSON.clone(fields), before);
					}

					if (callbacks.added) {
						callbacks.added.call(this, id, EJSON.clone(fields));
					}

					this.docs.putBefore(id, doc, before || null);
				},

				movedBefore: (id, before) => {
					if (callbacks.movedBefore) {
						callbacks.movedBefore.call(this, id, before);
					}

					this.docs.moveBefore(id, before || null);
				},
			};
		} else {
			this.docs = new MongoIdMap();

			this.applyChange = {
				added: (id, fields) => {
					const doc = _objectSpread({}, fields);

					if (callbacks.added) {
						callbacks.added.call(this, id, EJSON.clone(fields));
					}

					doc._id = id;
					this.docs.set(id, doc);
				},
			};
		}

		this.applyChange.changed = (id, fields) => {
			const doc = this.docs.get(id);

			if (!doc) {
				throw new Error('Unknown id for changed: '.concat(id));
			}

			if (callbacks.changed) {
				callbacks.changed.call(this, id, EJSON.clone(fields));
			}

			DiffSequence.applyChanges(doc, fields);
		};

		this.applyChange.removed = (id) => {
			if (callbacks.removed) {
				callbacks.removed.call(this, id);
			}

			this.docs.remove(id);
		};
	}
}

type Comparator<T> = (a: T, b: T) => number;

const _binarySearch = <T>(cmp: Comparator<T>, array: T[], value: T): number => {
	let first = 0;
	let range = array.length;

	while (range > 0) {
		const halfRange = Math.floor(range / 2);

		if (cmp(value, array[first + halfRange]) >= 0) {
			first += halfRange + 1;
			range -= halfRange + 1;
		} else {
			range = halfRange;
		}
	}

	return first;
};

LocalCollection._binarySearch = _binarySearch;

const _checkSupportedProjection = (fields) => {
	if (fields !== Object(fields) || Array.isArray(fields)) {
		throw MinimongoError('fields option must be an object');
	}

	Object.keys(fields).forEach((keyPath) => {
		if (keyPath.split('.').includes('$')) {
			throw MinimongoError("Minimongo doesn't support $ operator in projections yet.");
		}

		const value = fields[keyPath];

		if (typeof value === 'object' && ['$elemMatch', '$meta', '$slice'].some((key) => hasOwn(value, key))) {
			throw MinimongoError("Minimongo doesn't support operators in projections yet.");
		}

		if (![1, 0, true, false].includes(value)) {
			throw MinimongoError('Projection values should be one of 1, 0, true, or false');
		}
	});
};

const _compileProjection = (fields) => {
	_checkSupportedProjection(fields);

	const _idProjection = fields._id === undefined ? true : fields._id;
	const details = projectionDetails(fields);

	const transform = (doc, ruleTree) => {
		if (Array.isArray(doc)) {
			return doc.map((subdoc) => transform(subdoc, ruleTree));
		}

		const result = details.including ? {} : EJSON.clone(doc);

		Object.keys(ruleTree).forEach((key) => {
			if (doc == null || !hasOwn(doc, key)) {
				return;
			}

			const rule = ruleTree[key];

			if (rule === Object(rule)) {
				if (doc[key] === Object(doc[key])) {
					result[key] = transform(doc[key], rule);
				}
			} else if (details.including) {
				result[key] = EJSON.clone(doc[key]);
			} else {
				delete result[key];
			}
		});

		return doc != null ? result : doc;
	};

	return (doc) => {
		const result = transform(doc, details.tree);

		if (_idProjection && hasOwn(doc, '_id')) {
			result._id = doc._id;
		}

		if (!_idProjection && hasOwn(result, '_id')) {
			delete result._id;
		}

		return result;
	};
};

// LocalCollection._createUpsertDocument = (selector, modifier) => {
// 	const selectorDocument = populateDocumentWithQueryFields(selector);
// 	const isModify = _isModificationMod(modifier);
// 	const newDoc = {};

// 	if (selectorDocument._id) {
// 		newDoc._id = selectorDocument._id;
// 		delete selectorDocument._id;
// 	}

// 	LocalCollection._modify(newDoc, { $set: selectorDocument });
// 	LocalCollection._modify(newDoc, modifier, { isInsert: true });

// 	if (isModify) {
// 		return newDoc;
// 	}

// 	const replacement = Object.assign({}, modifier);

// 	if (newDoc._id) {
// 		replacement._id = newDoc._id;
// 	}

// 	return replacement;
// };

// LocalCollection._diffObjects = (left, right, callbacks) => {
// 	return DiffSequence.diffObjects(left, right, callbacks);
// };

// LocalCollection._diffQueryChanges = (ordered, oldResults, newResults, observer, options) =>
// 	DiffSequence.diffQueryChanges(ordered, oldResults, newResults, observer, options);
// LocalCollection._diffQueryOrderedChanges = (oldResults, newResults, observer, options) =>
// 	DiffSequence.diffQueryOrderedChanges(oldResults, newResults, observer, options);
// LocalCollection._diffQueryUnorderedChanges = (oldResults, newResults, observer, options) =>
// 	DiffSequence.diffQueryUnorderedChanges(oldResults, newResults, observer, options);

const _findInOrderedResults = (query: Query, doc: Document): number => {
	if (!query.ordered) {
		throw new Error("Can't call _findInOrderedResults on unordered query");
	}

	const results = query.results as Document[];
	for (let i = 0; i < results.length; i++) {
		if (results[i] === doc) {
			return i;
		}
	}

	throw new Error('object missing from query');
};

const _idsMatchedBySelector = (selector): (string | number)[] | null => {
	if (_selectorIsId(selector)) {
		return [selector];
	}

	if (!selector) {
		return null;
	}

	if (hasOwn(selector, '_id')) {
		if (_selectorIsId(selector._id)) {
			return [selector._id];
		}

		if (selector._id && Array.isArray(selector._id.$in) && selector._id.$in.length && selector._id.$in.every(_selectorIsId)) {
			return selector._id.$in;
		}

		return null;
	}

	if (Array.isArray(selector.$and)) {
		for (let i = 0; i < selector.$and.length; ++i) {
			const subIds = _idsMatchedBySelector(selector.$and[i]);

			if (subIds) {
				return subIds;
			}
		}
	}

	return null;
};

const _insertInResultsSync = (query: Query, doc: Document): void => {
	const fields = EJSON.clone(doc);

	delete fields._id;

	if (query.ordered) {
		if (!query.sorter) {
			query.addedBefore?.(doc._id, query.projectionFn(fields), null);
			(query.results as Document[]).push(doc);
		} else {
			const i = _insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results as Document[], doc);
			let next: unknown = (query.results as Document[])[i + 1];

			if (next) {
				next = (next as Document)._id;
			} else {
				next = null;
			}

			query.addedBefore?.(doc._id, query.projectionFn(fields), next);
		}

		query.added(doc._id, query.projectionFn(fields));
	} else {
		query.added(doc._id, query.projectionFn(fields));
		(query.results as IdMap<unknown, Document>).set(doc._id, doc);
	}
};

// LocalCollection._insertInResultsSync = _insertInResultsSync;

const _insertInResultsAsync = async (query: Query, doc: Document): Promise<void> => {
	const fields = EJSON.clone(doc);

	delete fields._id;

	if (query.ordered) {
		if (!query.sorter) {
			await query.addedBefore?.(doc._id, query.projectionFn(fields), null);
			(query.results as Document[]).push(doc);
		} else {
			const i = _insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results as Document[], doc);
			let next: unknown = (query.results as Document[])[i + 1];

			if (next) {
				next = (next as Document)._id;
			} else {
				next = null;
			}

			await query.addedBefore?.(doc._id, query.projectionFn(fields), next);
		}

		await query.added(doc._id, query.projectionFn(fields));
	} else {
		await query.added(doc._id, query.projectionFn(fields));
		(query.results as IdMap<unknown, Document>).set(doc._id, doc);
	}
};

// LocalCollection._insertInResultsAsync = _insertInResultsAsync;

const _insertInSortedList = <T>(cmp: Comparator<T>, array: T[], value: T): number => {
	if (array.length === 0) {
		array.push(value);

		return 0;
	}

	const i = _binarySearch(cmp, array, value);

	array.splice(i, 0, value);

	return i;
};

// LocalCollection._insertInSortedList = _insertInSortedList;

// const _isModificationMod = (mod) => {
// 	let isModify = false;
// 	let isReplace = false;

// 	Object.keys(mod).forEach((key) => {
// 		if (key.substr(0, 1) === '$') {
// 			isModify = true;
// 		} else {
// 			isReplace = true;
// 		}
// 	});

// 	if (isModify && isReplace) {
// 		throw new Error('Update parameter cannot have both modifier and non-modifier fields.');
// 	}

// 	return isModify;
// };

// LocalCollection._modify = function (doc, modifier) {
// 	const options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

// 	if (!_isPlainObject(modifier)) {
// 		throw MinimongoError('Modifier must be an object');
// 	}

// 	modifier = EJSON.clone(modifier);

// 	const isModifier = isOperatorObject(modifier);
// 	const newDoc = isModifier ? EJSON.clone(doc) : modifier;

// 	if (isModifier) {
// 		keys(modifier).forEach((operator) => {
// 			const setOnInsert = options.isInsert && operator === '$setOnInsert';
// 			const modFunc = MODIFIERS[setOnInsert ? '$set' : operator];
// 			const operand = modifier[operator];

// 			if (!modFunc) {
// 				throw MinimongoError('Invalid modifier specified '.concat(operator));
// 			}

// 			Object.keys(operand).forEach((keypath) => {
// 				const arg = operand[keypath];

// 				if (keypath === '') {
// 					throw MinimongoError('An empty update path is not valid.');
// 				}

// 				const keyparts = keypath.split('.');

// 				if (!keyparts.every(Boolean)) {
// 					throw MinimongoError(`${"The update path '".concat(keypath, "' contains an empty field name, ")}which is not allowed.`);
// 				}

// 				const target = findModTarget(newDoc, keyparts, {
// 					arrayIndices: options.arrayIndices,
// 					forbidArray: operator === '$rename',
// 					noCreate: NO_CREATE_MODIFIERS[operator],
// 				});

// 				modFunc(target, keyparts.pop(), arg, keypath, newDoc);
// 			});
// 		});

// 		if (doc._id && !EJSON.equals(doc._id, newDoc._id)) {
// 			throw MinimongoError(
// 				`${'After applying the update to the document {_id: "'.concat(
// 					doc._id,
// 					'", ...},',
// 				)} the (immutable) field '_id' was found to have been altered to ${'_id: "'.concat(newDoc._id, '"')}`,
// 			);
// 		}
// 	} else {
// 		if (doc._id && modifier._id && !EJSON.equals(doc._id, modifier._id)) {
// 			throw MinimongoError('The _id field cannot be changed from {_id: "'.concat(doc._id, '"} to ') + '{_id: "'.concat(modifier._id, '"}'));
// 		}

// 		assertHasValidFieldNames(modifier);
// 	}

// 	Object.keys(doc).forEach((key) => {
// 		if (key !== '_id') {
// 			delete doc[key];
// 		}
// 	});

// 	Object.keys(newDoc).forEach((key) => {
// 		doc[key] = newDoc[key];
// 	});
// };

LocalCollection._observeFromObserveChanges = (cursor, observeCallbacks) => {
	const transform = cursor.getTransform() || ((doc) => doc);
	let suppressed = !!observeCallbacks._suppress_initial;
	let observeChangesCallbacks;

	if (_observeCallbacksAreOrdered(observeCallbacks)) {
		const indices = !observeCallbacks._no_indices;

		observeChangesCallbacks = {
			addedBefore(id, fields, before) {
				const check = suppressed || !(observeCallbacks.addedAt || observeCallbacks.added);

				if (check) {
					return;
				}

				const doc = transform(Object.assign(fields, { _id: id }));

				if (observeCallbacks.addedAt) {
					observeCallbacks.addedAt(doc, indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1, before);
				} else {
					observeCallbacks.added(doc);
				}
			},

			changed(id, fields) {
				if (!(observeCallbacks.changedAt || observeCallbacks.changed)) {
					return;
				}

				const doc = EJSON.clone(this.docs.get(id));

				if (!doc) {
					throw new Error('Unknown id for changed: '.concat(id));
				}

				const oldDoc = transform(EJSON.clone(doc));

				DiffSequence.applyChanges(doc, fields);

				if (observeCallbacks.changedAt) {
					observeCallbacks.changedAt(transform(doc), oldDoc, indices ? this.docs.indexOf(id) : -1);
				} else {
					observeCallbacks.changed(transform(doc), oldDoc);
				}
			},

			movedBefore(id, before) {
				if (!observeCallbacks.movedTo) {
					return;
				}

				const from = indices ? this.docs.indexOf(id) : -1;

				let to = indices ? (before ? this.docs.indexOf(before) : this.docs.size()) : -1;

				if (to > from) {
					--to;
				}

				observeCallbacks.movedTo(transform(EJSON.clone(this.docs.get(id))), from, to, before || null);
			},

			removed(id) {
				if (!(observeCallbacks.removedAt || observeCallbacks.removed)) {
					return;
				}

				const doc = transform(this.docs.get(id));

				if (observeCallbacks.removedAt) {
					observeCallbacks.removedAt(doc, indices ? this.docs.indexOf(id) : -1);
				} else {
					observeCallbacks.removed(doc);
				}
			},
		};
	} else {
		observeChangesCallbacks = {
			added(id, fields) {
				if (!suppressed && observeCallbacks.added) {
					observeCallbacks.added(transform(Object.assign(fields, { _id: id })));
				}
			},

			changed(id, fields) {
				if (observeCallbacks.changed) {
					const oldDoc = this.docs.get(id);
					const doc = EJSON.clone(oldDoc);

					DiffSequence.applyChanges(doc, fields);
					observeCallbacks.changed(transform(doc), transform(EJSON.clone(oldDoc)));
				}
			},

			removed(id) {
				if (observeCallbacks.removed) {
					observeCallbacks.removed(transform(this.docs.get(id)));
				}
			},
		};
	}

	const changeObserver = new CachingChangeObserver({ callbacks: observeChangesCallbacks });

	changeObserver.applyChange._fromObserve = true;

	const handle = cursor.observeChanges(changeObserver.applyChange, { nonMutatingCallbacks: true });

	const setSuppressed = (h) => {
		let _h$isReadyPromise;

		if (h.isReady) suppressed = false;
		else
			(_h$isReadyPromise = h.isReadyPromise) === null || _h$isReadyPromise === void 0
				? void 0
				: _h$isReadyPromise.then(() => (suppressed = false));
	};

	if (Meteor._isPromise(handle)) {
		handle.then(setSuppressed);
	} else {
		setSuppressed(handle);
	}

	return handle;
};

const _observeCallbacksAreOrdered = (callbacks: ObserveCallbacks): boolean => {
	if (callbacks.added && callbacks.addedAt) {
		throw new Error('Please specify only one of added() and addedAt()');
	}

	if (callbacks.changed && callbacks.changedAt) {
		throw new Error('Please specify only one of changed() and changedAt()');
	}

	if (callbacks.removed && callbacks.removedAt) {
		throw new Error('Please specify only one of removed() and removedAt()');
	}

	return !!(callbacks.addedAt || callbacks.changedAt || callbacks.movedTo || callbacks.removedAt);
};

const _observeChangesCallbacksAreOrdered = (callbacks: ObserveChangesCallbacks): boolean => {
	if (callbacks.added && callbacks.addedBefore) {
		throw new Error('Please specify only one of added() and addedBefore()');
	}

	return !!(callbacks.addedBefore || callbacks.movedBefore);
};

LocalCollection._observeCallbacksAreOrdered = _observeCallbacksAreOrdered;
LocalCollection._observeChangesCallbacksAreOrdered = _observeChangesCallbacksAreOrdered;

const _removeFromResultsSync = (query: Query, doc: Document): void => {
	if (query.ordered) {
		const i = _findInOrderedResults(query, doc);

		query.removed(doc._id);
		(query.results as Document[]).splice(i, 1);
	} else {
		const id = doc._id;

		query.removed(doc._id);
		(query.results as IdMap<unknown, Document>).remove(id);
	}
};

LocalCollection._removeFromResultsSync = _removeFromResultsSync;

const _removeFromResultsAsync = async (query: Query, doc: Document): Promise<void> => {
	if (query.ordered) {
		const i = _findInOrderedResults(query, doc);

		await query.removed(doc._id);
		(query.results as Document[]).splice(i, 1);
	} else {
		const id = doc._id;

		await query.removed(doc._id);
		(query.results as IdMap<unknown, Document>).remove(id);
	}
};

LocalCollection._removeFromResultsAsync = _removeFromResultsAsync;

const _updateInResultsSync = (query: Query, doc: Document, old_doc: Document): void => {
	if (!EJSON.equals(doc._id, old_doc._id)) {
		throw new Error("Can't change a doc's _id while updating");
	}

	const { projectionFn } = query;
	const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));

	if (!query.ordered) {
		if (Object.keys(changedFields).length) {
			query.changed(doc._id, changedFields);
			(query.results as IdMap<unknown, Document>).set(doc._id, doc);
		}

		return;
	}

	const old_idx = _findInOrderedResults(query, doc);

	if (Object.keys(changedFields).length) {
		query.changed(doc._id, changedFields);
	}

	if (!query.sorter) {
		return;
	}

	(query.results as Document[]).splice(old_idx, 1);

	const new_idx = _insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results as Document[], doc);

	if (old_idx !== new_idx) {
		let next: unknown = (query.results as Document[])[new_idx + 1];

		if (next) {
			next = (next as Document)._id;
		} else {
			next = null;
		}

		query.movedBefore?.(doc._id, next);
	}
};

// LocalCollection._updateInResultsSync = _updateInResultsSync;

const _updateInResultsAsync = async (query: Query, doc: Document, old_doc: Document): Promise<void> => {
	if (!EJSON.equals(doc._id, old_doc._id)) {
		throw new Error("Can't change a doc's _id while updating");
	}

	const { projectionFn } = query;
	const changedFields = DiffSequence.makeChangedFields(projectionFn(doc), projectionFn(old_doc));

	if (!query.ordered) {
		if (Object.keys(changedFields).length) {
			await query.changed(doc._id, changedFields);
			(query.results as IdMap<unknown, Document>).set(doc._id, doc);
		}

		return;
	}

	const old_idx = _findInOrderedResults(query, doc);

	if (Object.keys(changedFields).length) {
		await query.changed(doc._id, changedFields);
	}

	if (!query.sorter) {
		return;
	}

	(query.results as Document[]).splice(old_idx, 1);

	const new_idx = _insertInSortedList(query.sorter.getComparator({ distances: query.distances }), query.results as Document[], doc);

	if (old_idx !== new_idx) {
		let next: unknown = (query.results as Document[])[new_idx + 1];

		if (next) {
			next = (next as Document)._id;
		} else {
			next = null;
		}

		await query.movedBefore?.(doc._id, next);
	}
};

LocalCollection._updateInResultsAsync = _updateInResultsAsync;

const MODIFIERS = {
	$currentDate(target, field, arg: unknown) {
		if (typeof arg === 'object' && arg && hasOwn(arg, '$type')) {
			if (arg.$type !== 'date') {
				throw MinimongoError('Minimongo does currently only support the date type in ' + '$currentDate modifiers', { field });
			}
		} else if (arg !== true) {
			throw MinimongoError('Invalid $currentDate modifier', { field });
		}

		target[field] = new Date();
	},

	$inc(target, field, arg) {
		if (typeof arg !== 'number') {
			throw MinimongoError('Modifier $inc allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw MinimongoError('Cannot apply $inc modifier to non-number', { field });
			}

			target[field] += arg;
		} else {
			target[field] = arg;
		}
	},

	$min(target, field, arg) {
		if (typeof arg !== 'number') {
			throw MinimongoError('Modifier $min allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw MinimongoError('Cannot apply $min modifier to non-number', { field });
			}

			if (target[field] > arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},

	$max(target, field, arg) {
		if (typeof arg !== 'number') {
			throw MinimongoError('Modifier $max allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw MinimongoError('Cannot apply $max modifier to non-number', { field });
			}

			if (target[field] < arg) {
				target[field] = arg;
			}
		} else {
			target[field] = arg;
		}
	},

	$mul(target, field, arg) {
		if (typeof arg !== 'number') {
			throw MinimongoError('Modifier $mul allowed for numbers only', { field });
		}

		if (field in target) {
			if (typeof target[field] !== 'number') {
				throw MinimongoError('Cannot apply $mul modifier to non-number', { field });
			}

			target[field] *= arg;
		} else {
			target[field] = 0;
		}
	},

	$rename(target, field, arg, keypath, doc) {
		if (keypath === arg) {
			throw MinimongoError('$rename source must differ from target', { field });
		}

		if (target === null) {
			throw MinimongoError('$rename source field invalid', { field });
		}

		if (typeof arg !== 'string') {
			throw MinimongoError('$rename target must be a string', { field });
		}

		if (arg.includes('\0')) {
			throw MinimongoError("The 'to' field for $rename cannot contain an embedded null byte", { field });
		}

		if (target === undefined) {
			return;
		}

		const object = target[field];

		delete target[field];

		const keyparts = arg.split('.');
		const target2 = findModTarget(doc, keyparts, { forbidArray: true });

		if (target2 === null) {
			throw MinimongoError('$rename target field invalid', { field });
		}

		target2[keyparts.pop()] = object;
	},

	$set(target, field, arg) {
		if (target !== Object(target)) {
			const error = MinimongoError('Cannot set property on non-object field', { field });

			error.setPropertyError = true;

			throw error;
		}

		if (target === null) {
			const error = MinimongoError('Cannot set property on null', { field });

			error.setPropertyError = true;

			throw error;
		}

		assertHasValidFieldNames(arg);
		target[field] = arg;
	},
	$setOnInsert(_target, _field, _arg) {},
	$unset(target, field, arg) {
		if (target !== undefined) {
			if (target instanceof Array) {
				if (field in target) {
					target[field] = null;
				}
			} else {
				delete target[field];
			}
		}
	},

	$push(target, field, arg) {
		if (target[field] === undefined) {
			target[field] = [];
		}

		if (!(target[field] instanceof Array)) {
			throw MinimongoError('Cannot apply $push modifier to non-array', { field });
		}

		if (!(arg && arg.$each)) {
			assertHasValidFieldNames(arg);
			target[field].push(arg);

			return;
		}

		const toPush = arg.$each;

		if (!(toPush instanceof Array)) {
			throw MinimongoError('$each must be an array', { field });
		}

		assertHasValidFieldNames(toPush);

		let position = undefined;

		if ('$position' in arg) {
			if (typeof arg.$position !== 'number') {
				throw MinimongoError('$position must be a numeric value', { field });
			}

			if (arg.$position < 0) {
				throw MinimongoError('$position in $push must be zero or positive', { field });
			}

			position = arg.$position;
		}

		let slice = undefined;

		if ('$slice' in arg) {
			if (typeof arg.$slice !== 'number') {
				throw MinimongoError('$slice must be a numeric value', { field });
			}

			slice = arg.$slice;
		}

		let sortFunction = undefined;

		if (arg.$sort) {
			if (slice === undefined) {
				throw MinimongoError('$sort requires $slice to be present', { field });
			}

			sortFunction = new Minimongo.Sorter(arg.$sort).getComparator();

			toPush.forEach((element) => {
				if (TypeChecker._type(element) !== 3) {
					throw MinimongoError('$push like modifiers using $sort require all elements to be ' + 'objects', { field });
				}
			});
		}

		if (position === undefined) {
			toPush.forEach((element) => {
				target[field].push(element);
			});
		} else {
			const spliceArguments = [position, 0];

			toPush.forEach((element) => {
				spliceArguments.push(element);
			});

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

	$pushAll(target, field, arg) {
		if (!(typeof arg === 'object' && arg instanceof Array)) {
			throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only');
		}

		assertHasValidFieldNames(arg);

		const toPush = target[field];

		if (toPush === undefined) {
			target[field] = arg;
		} else if (!(toPush instanceof Array)) {
			throw MinimongoError('Cannot apply $pushAll modifier to non-array', { field });
		} else {
			toPush.push(...arg);
		}
	},

	$addToSet(target, field, arg) {
		let isEach = false;

		if (typeof arg === 'object') {
			const keys = Object.keys(arg);

			if (keys[0] === '$each') {
				isEach = true;
			}
		}

		const values = isEach ? arg.$each : [arg];

		assertHasValidFieldNames(values);

		const toAdd = target[field];

		if (toAdd === undefined) {
			target[field] = values;
		} else if (!(toAdd instanceof Array)) {
			throw MinimongoError('Cannot apply $addToSet modifier to non-array', { field });
		} else {
			values.forEach((value) => {
				if (toAdd.some((element) => TypeChecker._equal(value, element))) {
					return;
				}

				toAdd.push(value);
			});
		}
	},

	$pop(target, field, arg) {
		if (target === undefined) {
			return;
		}

		const toPop = target[field];

		if (toPop === undefined) {
			return;
		}

		if (!(toPop instanceof Array)) {
			throw MinimongoError('Cannot apply $pop modifier to non-array', { field });
		}

		if (typeof arg === 'number' && arg < 0) {
			toPop.splice(0, 1);
		} else {
			toPop.pop();
		}
	},

	$pull(target, field, arg) {
		if (target === undefined) {
			return;
		}

		const toPull = target[field];

		if (toPull === undefined) {
			return;
		}

		if (!(toPull instanceof Array)) {
			throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		let out;

		if (arg != null && typeof arg === 'object' && !(arg instanceof Array)) {
			const matcher = new Matcher(arg);

			out = toPull.filter((element) => !matcher.documentMatches(element).result);
		} else {
			out = toPull.filter((element) => !TypeChecker._equal(element, arg));
		}

		target[field] = out;
	},

	$pullAll(target, field, arg) {
		if (!(typeof arg === 'object' && arg instanceof Array)) {
			throw MinimongoError('Modifier $pushAll/pullAll allowed for arrays only', { field });
		}

		if (target === undefined) {
			return;
		}

		const toPull = target[field];

		if (toPull === undefined) {
			return;
		}

		if (!(toPull instanceof Array)) {
			throw MinimongoError('Cannot apply $pull/pullAll modifier to non-array', { field });
		}

		target[field] = toPull.filter((object) => !arg.some((element) => TypeChecker._equal(object, element)));
	},

	$bit(target, field, arg) {
		throw MinimongoError('$bit is not supported', { field });
	},
	$v() {},
};

const NO_CREATE_MODIFIERS = {
	$pop: true,
	$pull: true,
	$pullAll: true,
	$rename: true,
	$unset: true,
};

const invalidCharMsg = {
	'$': "start with '$'",
	'.': "contain '.'",
	'\0': 'contain null bytes',
};

function findModTarget(doc, keyparts) {
	const options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
	let usedArrayIndex = false;

	for (let i = 0; i < keyparts.length; i++) {
		const last = i === keyparts.length - 1;
		let keypart = keyparts[i];

		if (!isIndexable(doc)) {
			if (options.noCreate) {
				return undefined;
			}

			const error = MinimongoError("cannot use the part '".concat(keypart, "' to traverse ").concat(doc));

			error.setPropertyError = true;

			throw error;
		}

		if (doc instanceof Array) {
			if (options.forbidArray) {
				return null;
			}

			if (keypart === '$') {
				if (usedArrayIndex) {
					throw MinimongoError("Too many positional (i.e. '$') elements");
				}

				if (!options.arrayIndices || !options.arrayIndices.length) {
					throw MinimongoError('The positional operator did not find the match needed from the ' + 'query');
				}

				keypart = options.arrayIndices[0];
				usedArrayIndex = true;
			} else if (isNumericKey(keypart)) {
				keypart = parseInt(keypart);
			} else {
				if (options.noCreate) {
					return undefined;
				}

				throw MinimongoError("can't append to array using string field name [".concat(keypart, ']'));
			}

			if (last) {
				keyparts[i] = keypart;
			}

			if (options.noCreate && keypart >= doc.length) {
				return undefined;
			}

			while (doc.length < keypart) {
				doc.push(null);
			}

			if (!last) {
				if (doc.length === keypart) {
					doc.push({});
				} else if (typeof doc[keypart] !== 'object') {
					throw MinimongoError("can't modify field '".concat(keyparts[i + 1], "' of list value ") + JSON.stringify(doc[keypart]));
				}
			}
		} else {
			assertIsValidFieldName(keypart);

			if (!(keypart in doc)) {
				if (options.noCreate) {
					return undefined;
				}

				if (!last) {
					doc[keypart] = {};
				}
			}
		}

		if (last) {
			return doc;
		}

		doc = doc[keypart];
	}
}

// ASYNC_CURSOR_METHODS.forEach((method) => {
// 	const asyncName = getAsyncMethodName(method);

// 	Cursor.prototype[asyncName] = function () {
// 		try {
// 			for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
// 				args[_key] = arguments[_key];
// 			}

// 			return Promise.resolve(this[method].apply(this, args));
// 		} catch (error) {
// 			return Promise.reject(error);
// 		}
// 	};
// });

function expandArraysInBranches(branches, skipTheArrays) {
	const branchesOut = [];

	branches.forEach((branch) => {
		const thisIsArray = Array.isArray(branch.value);

		if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {
			branchesOut.push({ arrayIndices: branch.arrayIndices, value: branch.value });
		}

		if (thisIsArray && !branch.dontIterate) {
			branch.value.forEach((value, i) => {
				branchesOut.push({ arrayIndices: (branch.arrayIndices || []).concat(i), value });
			});
		}
	});

	return branchesOut;
}

function getOperandBitmask(operand, selector) {
	if (Number.isInteger(operand) && operand >= 0) {
		return new Uint8Array(new Int32Array([operand]).buffer);
	}

	if (EJSON.isBinary(operand)) {
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

	throw new MiniMongoQueryError(
		`${'operand to '.concat(
			selector,
			' must be a numeric bitmask (representable as a ',
		)}non-negative 32-bit signed integer), a bindata bitmask or an array with ` + `bit positions (non-negative integers)`,
	);
}

function getValueBitmask(value: unknown, length: number) {
	if (isSafeInteger(value)) {
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

	if (EJSON.isBinary(value)) {
		return new Uint8Array(value.buffer);
	}

	return false;
}

// function insertIntoDocument(document, key, value) {
// 	Object.keys(document).forEach((existingKey) => {
// 		if (
// 			(existingKey.length > key.length && existingKey.indexOf(''.concat(key, '.')) === 0) ||
// 			(key.length > existingKey.length && key.indexOf(''.concat(existingKey, '.')) === 0)
// 		) {
// 			throw new MiniMongoQueryError(
// 				"cannot infer query fields to set, both paths '".concat(existingKey, "' and '").concat(key, "' are matched"),
// 			);
// 		} else if (existingKey === key) {
// 			throw new MiniMongoQueryError("cannot infer query fields to set, path '".concat(key, "' is matched twice"));
// 		}
// 	});

// 	document[key] = value;
// }

function invertBranchedMatcher(branchedMatcher: BranchedMatcher) {
	return (branchValues: unknown) => {
		return { result: !branchedMatcher(branchValues).result };
	};
}

function isIndexable(obj: unknown): obj is Record<string, unknown> | unknown[] {
	return Array.isArray(obj) || _isPlainObject(obj);
}

function isNumericKey(s: string): s is `${number}` {
	return /^[0-9]+$/.test(s);
}

function isOperatorObject(valueSelector: unknown, inconsistentOK?: boolean) {
	if (!_isPlainObject(valueSelector)) {
		return false;
	}

	let theseAreOperators: boolean | undefined = undefined;

	keys(valueSelector).forEach((selKey) => {
		const thisIsOperator = selKey.substr(0, 1) === '$' || selKey === 'diff';

		if (theseAreOperators === undefined) {
			theseAreOperators = thisIsOperator;
		} else if (theseAreOperators !== thisIsOperator) {
			if (!inconsistentOK) {
				throw new MiniMongoQueryError('Inconsistent operator: '.concat(JSON.stringify(valueSelector)));
			}

			theseAreOperators = false;
		}
	});

	return !!theseAreOperators;
}

function makeLookupFunction(key: string, options = {}): BranchedMatcher {
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
			if (!(isNumericKey(firstPart) && Number.parseInt(firstPart, 10) < doc.length)) {
				return [];
			}

			arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
		}

		const firstLevel = doc[firstPart];

		if (!lookupRest) {
			return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
		}

		if (!isIndexable(firstLevel)) {
			if (Array.isArray(doc)) {
				return [];
			}

			return buildResult(arrayIndices, false, undefined);
		}

		const result = [];

		const appendToResult = (more) => {
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

function operatorBranchedMatcher(valueSelector, matcher, isRoot) {
	const operatorMatchers = Object.keys(valueSelector).map((operator) => {
		const operand = valueSelector[operator];
		const simpleRange = ['$lt', '$lte', '$gt', '$gte'].includes(operator) && typeof operand === 'number';
		const simpleEquality = ['$ne', '$eq'].includes(operator) && operand !== Object(operand);
		const simpleInclusion = ['$in', '$nin'].includes(operator) && Array.isArray(operand) && !operand.some((x) => x === Object(x));

		if (!(simpleRange || simpleInclusion || simpleEquality)) {
			matcher._isSimple = false;
		}

		if (hasOwn(VALUE_OPERATORS, operator)) {
			return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);
		}

		if (hasOwn(ELEMENT_OPERATORS, operator)) {
			const options = ELEMENT_OPERATORS[operator];

			return convertElementMatcherToBranchedMatcher(options.compileElementSelector(operand, valueSelector, matcher), options);
		}

		throw new MiniMongoQueryError('Unrecognized operator: '.concat(operator));
	});

	return andBranchedMatchers(operatorMatchers);
}

function pointToArray(point) {
	return Array.isArray(point) ? point.slice() : [point.x, point.y];
}

// function populateDocumentWithKeyValue(document, key, value) {
// 	if (value && Object.getPrototypeOf(value) === Object.prototype) {
// 		populateDocumentWithObject(document, key, value);
// 	} else if (!(value instanceof RegExp)) {
// 		insertIntoDocument(document, key, value);
// 	}
// }

// function populateDocumentWithObject(document, key, value) {
// 	const keys = Object.keys(value);
// 	const unprefixedKeys = keys.filter((op) => op[0] !== '$');

// 	if (unprefixedKeys.length > 0 || !keys.length) {
// 		if (keys.length !== unprefixedKeys.length) {
// 			throw new MiniMongoQueryError('unknown operator: '.concat(unprefixedKeys[0]));
// 		}

// 		validateObject(value, key);
// 		insertIntoDocument(document, key, value);
// 	} else {
// 		Object.keys(value).forEach((op) => {
// 			const object = value[op];

// 			if (op === '$eq') {
// 				populateDocumentWithKeyValue(document, key, object);
// 			} else if (op === '$all') {
// 				object.forEach((element) => populateDocumentWithKeyValue(document, key, element));
// 			}
// 		});
// 	}
// }

// function populateDocumentWithQueryFields(query) {
// 	const document = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

// 	if (Object.getPrototypeOf(query) === Object.prototype) {
// 		Object.keys(query).forEach((key) => {
// 			const value = query[key];

// 			if (key === '$and') {
// 				value.forEach((element) => populateDocumentWithQueryFields(element, document));
// 			} else if (key === '$or') {
// 				if (value.length === 1) {
// 					populateDocumentWithQueryFields(value[0], document);
// 				}
// 			} else if (key[0] !== '$') {
// 				populateDocumentWithKeyValue(document, key, value);
// 			}
// 		});
// 	} else if (_selectorIsId(query)) {
// 		insertIntoDocument(document, '_id', query);
// 	}

// 	return document;
// }

function regexpElementMatcher(regexp) {
	return (value) => {
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

// function validateKeyInPath(key, path) {
// 	if (key.includes('.')) {
// 		throw new Error("The dotted field '".concat(key, "' in '").concat(path, '.').concat(key, ' is not valid for storage.'));
// 	}

// 	if (key[0] === '$') {
// 		throw new Error("The dollar ($) prefixed field  '".concat(path, '.').concat(key, ' is not valid for storage.'));
// 	}
// }

// function validateObject(object: unknown, path: string): void {
// 	throw new Error('The object at path "'.concat(path, '" is not valid for storage.'));
// 	if (isObject(object)) {
// 		keys(object).forEach((key) => {
// 			validateKeyInPath(key, path);
// 			validateObject(object[key], `${path}.${key}`);
// 		});
// 	}
// }

const Minimongo = { LocalCollection, Matcher, Sorter };

export { Minimongo, MinimongoError, LocalCollection };

Package.minimongo = { Minimongo, MinimongoError, LocalCollection };
