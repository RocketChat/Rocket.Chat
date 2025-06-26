import { createLookupFunction } from '@rocket.chat/mongo-adapter';
import type { LookupBranch, FieldExpression, Filter, ArrayIndices } from '@rocket.chat/mongo-adapter';

import { MinimongoError } from './MinimongoError';
import { _f, _isPlainObject, isBinary, isEqual, isIndexable, isOperatorObject } from './common';
import { isTruthy } from '../../../lib/isTruthy';

type Result =
	| {
			readonly result: true;
			arrayIndices?: ArrayIndices;
	  }
	| {
			readonly result: false;
			arrayIndices?: undefined;
	  };

type DocumentMatcher<T extends { _id: string }> = (doc: T) => Result;

type BranchedMatcher = (branches: LookupBranch[]) => Result;

type ElementMatcher = (value: unknown) => boolean | number;

export class Matcher<T extends { _id: string }> {
	private readonly _docMatcher: DocumentMatcher<T>;

	constructor(selector: Filter<T> | T['_id'] | ((this: T) => boolean)) {
		this._docMatcher = this._compileSelector(selector);
	}

	documentMatches(doc: T) {
		if (doc !== Object(doc)) {
			throw Error('documentMatches needs a document');
		}

		return this._docMatcher(doc);
	}

	private _compileSelector(selector: Filter<T> | T['_id'] | ((this: T) => boolean)): DocumentMatcher<T> {
		if (typeof selector === 'function') {
			return (doc) => ({ result: !!selector.call(doc) });
		}

		if (typeof selector === 'string') {
			return (doc) => ({ result: isEqual(doc._id, selector) });
		}

		if (!selector || ('_id' in selector && !selector._id)) {
			return () => ({ result: false });
		}

		if (Array.isArray(selector) || isBinary(selector) || typeof selector === 'boolean') {
			throw new Error(`Invalid selector: ${selector}`);
		}

		return this.compileDocumentSelector(selector);
	}

	private compileDocumentSelector(
		docSelector: Filter<T>,
		options: {
			inElemMatch?: boolean;
		} = {},
	) {
		const docMatchers = Object.entries(docSelector)
			.map(([key, subSelector]): DocumentMatcher<T> | undefined => {
				if (key.slice(0, 1) === '$') {
					if (!(key in Matcher.LOGICAL_OPERATORS)) {
						throw new Error(`Unrecognized logical operator: ${key}`);
					}

					return Matcher.LOGICAL_OPERATORS[key as keyof typeof Matcher.LOGICAL_OPERATORS](
						subSelector as Filter<T>[] & (string | ((this: T, doc: T) => boolean)),
						this,
						options.inElemMatch,
					);
				}

				if (typeof subSelector === 'function') {
					return undefined;
				}

				const lookUpByIndex = createLookupFunction(key);
				const valueMatcher = this.compileValueSelector(subSelector as FieldExpression<T>);

				return (doc: T) => valueMatcher(lookUpByIndex(doc));
			})
			.filter(isTruthy);

		return this.andSomeMatchers(docMatchers);
	}

	private andSomeMatchers(subMatchers: DocumentMatcher<T>[]): DocumentMatcher<T>;

	private andSomeMatchers(subMatchers: BranchedMatcher[]): BranchedMatcher;

	private andSomeMatchers(subMatchers: ((docOrBranches: T | LookupBranch[]) => Result)[]) {
		if (subMatchers.length === 0) {
			return () => ({ result: true });
		}

		if (subMatchers.length === 1) {
			return subMatchers[0];
		}

		return (docOrBranches: T | LookupBranch[]) => {
			const match: Result = {
				result: subMatchers.every((fn) => {
					const subResult = fn(docOrBranches);

					if (subResult.result && subResult.arrayIndices) {
						match.arrayIndices = subResult.arrayIndices;
					}

					return subResult.result;
				}),
			};

			if (!match.result) {
				delete match.arrayIndices;
			}

			return match;
		};
	}

	private compileValueSelector(valueSelector: FieldExpression<T>) {
		if (valueSelector instanceof RegExp) {
			return this.convertElementMatcherToBranchedMatcher(this.regexpElementMatcher(valueSelector));
		}

		if (isOperatorObject(valueSelector)) {
			return this.operatorBranchedMatcher(valueSelector);
		}

		return this.convertElementMatcherToBranchedMatcher(this.equalityElementMatcher(valueSelector));
	}

	private operatorBranchedMatcher(valueSelector: FieldExpression<T>) {
		const operatorMatchers = Object.entries(valueSelector).map(([operator, operand]): BranchedMatcher => {
			if (operator in Matcher.VALUE_OPERATORS) {
				return Matcher.VALUE_OPERATORS[operator as keyof typeof Matcher.VALUE_OPERATORS](operand, valueSelector, this);
			}

			if (operator in Matcher.ELEMENT_OPERATORS) {
				const { compileElementSelector, ...options } = Matcher.ELEMENT_OPERATORS[operator as keyof typeof Matcher.ELEMENT_OPERATORS];
				return this.convertElementMatcherToBranchedMatcher(compileElementSelector(operand, valueSelector, this), options);
			}

			throw new Error(`Unrecognized operator: ${operator}`);
		});

		return this.andSomeMatchers(operatorMatchers);
	}

	private convertElementMatcherToBranchedMatcher(
		elementMatcher: ElementMatcher,
		options: { dontExpandLeafArrays?: boolean; dontIncludeLeafArrays?: boolean } = {},
	) {
		return (branches: LookupBranch[]) => {
			const expanded = options.dontExpandLeafArrays ? branches : this.expandArraysInBranches(branches, options.dontIncludeLeafArrays);

			const match: Result = {
				result: expanded.some((element) => {
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
				}),
				arrayIndices: undefined,
			};

			return match;
		};
	}

	private equalityElementMatcher(elementSelector: unknown): ElementMatcher {
		if (isOperatorObject(elementSelector)) {
			throw new MinimongoError("Can't create equalityValueSelector for operator object");
		}

		if (elementSelector == null) {
			return (value) => value == null;
		}

		return (value) => _f._equal(elementSelector, value);
	}

	private expandArraysInBranches(branches: LookupBranch[], skipTheArrays?: boolean) {
		const branchesOut: LookupBranch[] = [];

		branches.forEach((branch) => {
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
		});

		return branchesOut;
	}

	private getOperandBitmask(operand: unknown, selector: string) {
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

		throw new MinimongoError(
			`operand to ${selector} must be a numeric bitmask (representable as a ` +
				'non-negative 32-bit signed integer), a bindata bitmask or an array with ' +
				'bit positions (non-negative integers)',
		);
	}

	private getValueBitmask(value: number, length: number) {
		if (Number.isSafeInteger(value)) {
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
	}

	private invertBranchedMatcher(branchedMatcher: (branches: LookupBranch[]) => Result) {
		return (branches: LookupBranch[]): Result => {
			return { result: !branchedMatcher(branches).result };
		};
	}

	private regexpElementMatcher(regexp: RegExp): ElementMatcher {
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

	private compileArrayOfDocumentSelectors(selectors: Filter<T>[], inElemMatch?: boolean) {
		if (!Array.isArray(selectors) || selectors.length === 0) {
			throw new MinimongoError('$and/$or/$nor must be nonempty array');
		}

		return selectors.map((subSelector) => {
			if (!_isPlainObject(subSelector)) {
				throw new MinimongoError('$or/$and/$nor entries need to be full objects');
			}

			return this.compileDocumentSelector(subSelector, { inElemMatch });
		});
	}

	private static readonly VALUE_OPERATORS = {
		$eq<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			return matcher.convertElementMatcherToBranchedMatcher(matcher.equalityElementMatcher(operand));
		},
		$not<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			return matcher.invertBranchedMatcher(matcher.compileValueSelector(operand as FieldExpression<T>));
		},
		$ne<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			return matcher.invertBranchedMatcher(matcher.convertElementMatcherToBranchedMatcher(matcher.equalityElementMatcher(operand)));
		},
		$nin<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			return matcher.invertBranchedMatcher(
				matcher.convertElementMatcherToBranchedMatcher(Matcher.ELEMENT_OPERATORS.$in.compileElementSelector(operand, null as any, matcher)),
			);
		},
		$exists<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			const exists = matcher.convertElementMatcherToBranchedMatcher((value) => value !== undefined);
			return operand ? exists : matcher.invertBranchedMatcher(exists);
		},
		$options<T extends { _id: string }>(_operand: unknown, valueSelector: FieldExpression<T>, _matcher: Matcher<T>) {
			if (!('$regex' in valueSelector)) {
				throw new MinimongoError('$options needs a $regex');
			}

			return () => ({ result: true });
		},
		$all<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
			if (!Array.isArray(operand)) {
				throw new MinimongoError('$all requires array');
			}

			if (operand.length === 0) {
				return () => ({ result: false });
			}

			const branchedMatchers = operand.map((criterion) => {
				if (isOperatorObject(criterion)) {
					throw new MinimongoError('no $ expressions in $all');
				}

				return matcher.compileValueSelector(criterion);
			});

			return matcher.andSomeMatchers(branchedMatchers);
		},
	} as const;

	private static makeInequality(cmpValueComparator: (compValue: number) => boolean) {
		return {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, _matcher: Matcher<T>) {
				if (Array.isArray(operand)) {
					return () => false;
				}

				if (operand === undefined) {
					operand = null;
				}

				const operandType = _f._type(operand);

				return (value: unknown) => {
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

	private static readonly ELEMENT_OPERATORS = {
		$lt: Matcher.makeInequality((cmpValue: number) => cmpValue < 0),
		$gt: Matcher.makeInequality((cmpValue: number) => cmpValue > 0),
		$lte: Matcher.makeInequality((cmpValue: number) => cmpValue <= 0),
		$gte: Matcher.makeInequality((cmpValue: number) => cmpValue >= 0),
		$mod: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, _matcher: Matcher<T>) {
				if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
					throw new MinimongoError('argument to $mod must be an array of two numbers');
				}

				const divisor = operand[0];
				const remainder = operand[1];
				return (value: unknown) => typeof value === 'number' && value % divisor === remainder;
			},
		},
		$in: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				if (!Array.isArray(operand)) {
					throw new MinimongoError('$in needs an array');
				}

				const elementMatchers = operand.map((option) => {
					if (option instanceof RegExp) {
						return matcher.regexpElementMatcher(option);
					}

					if (isOperatorObject(option)) {
						throw new MinimongoError('cannot nest $ under $in');
					}

					return matcher.equalityElementMatcher(option);
				});

				return (value: unknown) => {
					if (value === undefined) {
						value = null;
					}

					return elementMatchers.some((matcher) => matcher(value));
				};
			},
		},
		$size: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, _matcher: Matcher<T>) {
				if (typeof operand === 'string') {
					operand = 0;
				} else if (typeof operand !== 'number') {
					throw new MinimongoError('$size needs a number');
				}

				return (value: any) => Array.isArray(value) && value.length === operand;
			},
			dontExpandLeafArrays: true,
		},
		$type: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, _matcher: Matcher<T>) {
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
			dontIncludeLeafArrays: true,
		},
		$bitsAllSet: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				const mask = matcher.getOperandBitmask(operand, '$bitsAllSet');
				return (value: any) => {
					const bitmask = matcher.getValueBitmask(value, mask.length);
					return bitmask && mask.every((byte, i) => (bitmask[i] & byte) === byte);
				};
			},
		},
		$bitsAnySet: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				const mask = matcher.getOperandBitmask(operand, '$bitsAnySet');
				return (value: any) => {
					const bitmask = matcher.getValueBitmask(value, mask.length);
					return bitmask && mask.some((byte, i) => (~bitmask[i] & byte) !== byte);
				};
			},
		},
		$bitsAllClear: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				const mask = matcher.getOperandBitmask(operand, '$bitsAllClear');
				return (value: any) => {
					const bitmask = matcher.getValueBitmask(value, mask.length);
					return bitmask && mask.every((byte, i) => !(bitmask[i] & byte));
				};
			},
		},
		$bitsAnyClear: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				const mask = matcher.getOperandBitmask(operand, '$bitsAnyClear');
				return (value: any) => {
					const bitmask = matcher.getValueBitmask(value, mask.length);
					return bitmask && mask.some((byte, i) => (bitmask[i] & byte) !== byte);
				};
			},
		},
		$regex: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
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

				return matcher.regexpElementMatcher(regexp);
			},
		},
		$elemMatch: {
			compileElementSelector<T extends { _id: string }>(operand: unknown, _valueSelector: FieldExpression<T>, matcher: Matcher<T>) {
				if (!_isPlainObject(operand)) {
					throw new MinimongoError('$elemMatch need an object');
				}

				const isDocMatcher = !isOperatorObject(
					Object.entries(operand)
						.filter(([key]) => !(key in Matcher.LOGICAL_OPERATORS))
						.reduce((a, [key, value]) => Object.assign(a, { [key]: value }), {}),
					true,
				);

				if (isDocMatcher) {
					const subMatcher = matcher.compileDocumentSelector(operand, { inElemMatch: true });

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

				const subMatcher = matcher.compileValueSelector(operand);

				return (value: any) => {
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
			},
			dontExpandLeafArrays: true,
		},
	} as const;

	private static readonly LOGICAL_OPERATORS = {
		$and<T extends { _id: string }>(subSelector: Filter<T>[], matcher: Matcher<T>, inElemMatch?: boolean) {
			return matcher.andSomeMatchers(matcher.compileArrayOfDocumentSelectors(subSelector, inElemMatch));
		},

		$or<T extends { _id: string }>(subSelector: Filter<T>[], matcher: Matcher<T>, inElemMatch?: boolean) {
			const matchers = matcher.compileArrayOfDocumentSelectors(subSelector, inElemMatch);

			if (matchers.length === 1) {
				return matchers[0];
			}

			return (doc: T) => {
				const result = matchers.some((fn) => fn(doc).result);
				return { result };
			};
		},

		$nor<T extends { _id: string }>(subSelector: Filter<T>[], matcher: Matcher<T>, inElemMatch?: boolean) {
			const matchers = matcher.compileArrayOfDocumentSelectors(subSelector, inElemMatch);
			return (doc: T) => {
				const result = matchers.every((fn) => !fn(doc).result);
				return { result };
			};
		},

		$where<T extends { _id: string }>(selectorValue: string | ((this: T, doc: T) => boolean)) {
			if (!(selectorValue instanceof Function)) {
				selectorValue = Function('obj', `return ${selectorValue}`) as (this: T, doc: T) => boolean;
			}

			return (doc: T) => ({ result: selectorValue.call(doc, doc) });
		},
	} as const;
}
