import { EJSON } from 'meteor/ejson';

import type { Matcher } from './Matcher';

export const hasOwn = Object.prototype.hasOwnProperty;

// Each element selector contains:
//  - compileElementSelector, a function with args:
//    - operand - the "right hand side" of the operator
//    - valueSelector - the "context" for the operator (so that $regex can find
//      $options)
//    - matcher - the Matcher this is going into (so that $elemMatch can compile
//      more things)
//    returning a function mapping a single value to bool.
//  - dontExpandLeafArrays, a bool which prevents expandArraysInBranches from
//    being called
//  - dontIncludeLeafArrays, a bool which causes an argument to be passed to
//    expandArraysInBranches if it is called
const ELEMENT_OPERATORS = {
	$lt: makeInequality((cmpValue: number) => cmpValue < 0),
	$gt: makeInequality((cmpValue: number) => cmpValue > 0),
	$lte: makeInequality((cmpValue: number) => cmpValue <= 0),
	$gte: makeInequality((cmpValue: number) => cmpValue >= 0),
	$mod: {
		compileElementSelector(operand) {
			if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
				throw Error('argument to $mod must be an array of two numbers');
			}

			// XXX could require to be ints or round or something
			const divisor = operand[0];
			const remainder = operand[1];
			return (value: number) => typeof value === 'number' && value % divisor === remainder;
		},
	},
	$in: {
		compileElementSelector(operand) {
			if (!Array.isArray(operand)) {
				throw Error('$in needs an array');
			}

			const elementMatchers = operand.map((option) => {
				if (option instanceof RegExp) {
					return regexpElementMatcher(option);
				}

				if (isOperatorObject(option)) {
					throw Error('cannot nest $ under $in');
				}

				return equalityElementMatcher(option);
			});

			return (value: any) => {
				// Allow {a: {$in: [null]}} to match when 'a' does not exist.
				if (value === undefined) {
					value = null;
				}

				return elementMatchers.some((matcher) => matcher(value));
			};
		},
	},
	$size: {
		// {a: [[5, 5]]} must match {a: {$size: 1}} but not {a: {$size: 2}}, so we
		// don't want to consider the element [5,5] in the leaf array [[5,5]] as a
		// possible value.
		dontExpandLeafArrays: true,
		compileElementSelector(operand) {
			if (typeof operand === 'string') {
				// Don't ask me why, but by experimentation, this seems to be what Mongo
				// does.
				operand = 0;
			} else if (typeof operand !== 'number') {
				throw Error('$size needs a number');
			}

			return (value: any) => Array.isArray(value) && value.length === operand;
		},
	},
	$type: {
		// {a: [5]} must not match {a: {$type: 4}} (4 means array), but it should
		// match {a: {$type: 1}} (1 means number), and {a: [[5]]} must match {$a:
		// {$type: 4}}. Thus, when we see a leaf array, we *should* expand it but
		// should *not* include it itself.
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
					throw Error(`unknown string alias for $type: ${operand}`);
				}
				operand = operandAliasMap[operand as keyof typeof operandAliasMap];
			} else if (typeof operand === 'number') {
				if (operand === 0 || operand < -1 || (operand > 19 && operand !== 127)) {
					throw Error(`Invalid numerical $type code: ${operand}`);
				}
			} else {
				throw Error('argument to $type is not a number or a string');
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
				throw Error('$regex has to be a string or RegExp');
			}

			let regexp;
			if (valueSelector.$options !== undefined) {
				// Options passed in $options (even the empty string) always overrides
				// options in the RegExp object itself.

				// Be clear that we only support the JS-supported options, not extended
				// ones (eg, Mongo supports x and s). Ideally we would implement x and s
				// by transforming the regexp, but not today...
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
				throw Error('$elemMatch need an object');
			}

			const isDocMatcher = !isOperatorObject(
				Object.keys(operand)
					.filter((key) => !hasOwn.call(LOGICAL_OPERATORS, key))
					.reduce((a, b) => Object.assign(a, { [b]: operand[b] }), {}),
				true,
			);

			let subMatcher;
			if (isDocMatcher) {
				// This is NOT the same as compileValueSelector(operand), and not just
				// because of the slightly different calling convention.
				// {$elemMatch: {x: 3}} means "an element has a field x:3", not
				// "consists only of a field x:3". Also, regexps and sub-$ are allowed.
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
						// We can only match {$elemMatch: {b: 3}} against objects.
						// (We can also match against arrays, if there's numeric indices,
						// eg {$elemMatch: {'0.b': 3}} or {$elemMatch: {0: 3}}.)
						if (!isIndexable(arrayElement)) {
							return false;
						}

						arg = arrayElement;
					} else {
						// dontIterate ensures that {a: {$elemMatch: {$gt: 5}}} matches
						// {a: [8]} but not {a: [[8]]}
						arg = [{ value: arrayElement, dontIterate: true }];
					}

					if (subMatcher(arg).result) {
						return i; // specially understood to mean "use as arrayIndices"
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

// Operators that appear at the top level of a document selector.
const LOGICAL_OPERATORS = {
	$and(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		return andDocumentMatchers(compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch));
	},

	$or(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);

		// Special case: if there is only one matcher, use it directly, *preserving*
		// any arrayIndices it returns.
		if (matchers.length === 1) {
			return matchers[0];
		}

		return (doc: any) => {
			const result = matchers.some((fn: any) => fn(doc).result);
			// $or does NOT set arrayIndices when it has multiple
			// sub-expressions. (Tested against MongoDB.)
			return { result };
		};
	},

	$nor(subSelector: any, matcher: Matcher<{ _id: string }>, inElemMatch: any): any {
		const matchers = compileArrayOfDocumentSelectors(subSelector, matcher, inElemMatch);
		return (doc: any): any => {
			const result = matchers.every((fn) => !fn(doc).result);
			// Never set arrayIndices, because we only match if nothing in particular
			// 'matched' (and because this is consistent with MongoDB).
			return { result };
		};
	},

	$where(selectorValue: any, matcher: Matcher<{ _id: string }>): any {
		// Record that *any* path may be used.
		matcher._recordPathUsed('');
		matcher._hasWhere = true;

		if (!(selectorValue instanceof Function)) {
			// XXX MongoDB seems to have more complex logic to decide where or or not
			// to add 'return'; not sure exactly what it is.
			selectorValue = Function('obj', `return ${selectorValue}`);
		}

		// We make the document available as both `this` and `obj`.
		// // XXX not sure what we should do if this throws
		return (doc: any) => ({ result: selectorValue.call(doc, doc) });
	},

	// This is just used as a comment in the query (in MongoDB, it also ends up in
	// query logs); it has no effect on the actual selection.
	$comment(): any {
		return () => ({ result: true });
	},
} as const;

// Operators that (unlike LOGICAL_OPERATORS) pertain to individual paths in a
// document, but (unlike ELEMENT_OPERATORS) do not have a simple definition as
// "match each branched value independently and combine with
// convertElementMatcherToBranchedMatcher".
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
	// $options just provides options for $regex; its logic is inside $regex
	$options(_operand: any, valueSelector: any) {
		if (!hasOwn.call(valueSelector, '$regex')) {
			throw Error('$options needs a $regex');
		}

		return everythingMatcher;
	},
	$maxDistance(_operand: any, valueSelector: any) {
		if (!valueSelector.$near) {
			throw Error('$maxDistance needs a $near');
		}

		return everythingMatcher;
	},
	$all(operand: any, _valueSelector: any, matcher: Matcher<{ _id: string }>): any {
		if (!Array.isArray(operand)) {
			throw Error('$all requires array');
		}

		// Not sure why, but this seems to be what MongoDB does.
		if (operand.length === 0) {
			return nothingMatcher;
		}

		const branchedMatchers = operand.map((criterion) => {
			// XXX handle $all/$elemMatch combination
			if (isOperatorObject(criterion)) {
				throw Error('no $ expressions in $all');
			}

			// This is always a regexp or equality selector.
			return compileValueSelector(criterion, matcher);
		});

		// andBranchedMatchers does NOT require all selectors to return true on the
		// SAME branch.
		return andBranchedMatchers(branchedMatchers);
	},
	$near() {
		throw new Error('$near is not supported in this context');
	},
} as const;

// NB: We are cheating and using this function to implement 'AND' for both
// 'document matchers' and 'branched matchers'. They both return result objects
// but the argument is different: for the former it's a whole doc, whereas for
// the latter it's an array of 'branched values'.
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

			// Similarly, propagate arrayIndices from sub-matchers... but to match
			// MongoDB behavior, this time the *last* sub-matcher with arrayIndices
			// wins.
			if (subResult.result && subResult.arrayIndices) {
				match.arrayIndices = subResult.arrayIndices;
			}

			return subResult.result;
		});

		// If we didn't actually match, forget any extra metadata we came up with.
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
		throw Error('$and/$or/$nor must be nonempty array');
	}

	return selectors.map((subSelector) => {
		if (!_isPlainObject(subSelector)) {
			throw Error('$or/$and/$nor entries need to be full objects');
		}

		return compileDocumentSelector(subSelector, matcher, { inElemMatch });
	});
}

// Takes in a selector that could match a full document (eg, the original
// selector). Returns a function mapping document->result object.
//
// matcher is the Matcher object we are compiling.
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
				// Outer operators are either logical operators (they recurse back into
				// this function), or $where.
				if (!hasOwn.call(LOGICAL_OPERATORS, key)) {
					throw new Error(`Unrecognized logical operator: ${key}`);
				}

				matcher._isSimple = false;
				return LOGICAL_OPERATORS[key as keyof typeof LOGICAL_OPERATORS](subSelector, matcher, options.inElemMatch);
			}

			// Record this path, but only if we aren't in an elemMatcher, since in an
			// elemMatch this is a path inside an object in an array, not in the doc
			// root.
			if (!options.inElemMatch) {
				matcher._recordPathUsed(key);
			}

			// Don't add a matcher if subSelector is a function -- this is to match
			// the behavior of Meteor on the server (inherited from the node mongodb
			// driver), which is to ignore any part of a selector which is a function.
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

// Takes in a selector that could match a key-indexed value in a document; eg,
// {$gt: 5, $lt: 9}, or a regular expression, or any non-expression object (to
// indicate equality).  Returns a branched matcher: a function mapping
// [branched value]->result object.
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

// Given an element matcher (which evaluates a single value), returns a branched
// value (which evaluates the element matcher on all the branches and returns a
// more structured return value possibly including arrayIndices).
function convertElementMatcherToBranchedMatcher(elementMatcher: any, options: any = {}) {
	return (branches: any) => {
		const expanded = options.dontExpandLeafArrays ? branches : expandArraysInBranches(branches, options.dontIncludeLeafArrays);

		const match: any = {};
		match.result = expanded.some((element: any) => {
			let matched = elementMatcher(element.value);

			// Special case for $elemMatch: it means "true, and use this as an array
			// index if I didn't already have one".
			if (typeof matched === 'number') {
				// XXX This code dates from when we only stored a single array index
				// (for the outermost array). Should we be also including deeper array
				// indices from the $elemMatch match?
				if (!element.arrayIndices) {
					element.arrayIndices = [matched];
				}

				matched = true;
			}

			// If some element matched, and it's tagged with array indices, include
			// those indices in our result object.
			if (matched && element.arrayIndices) {
				match.arrayIndices = element.arrayIndices;
			}

			return matched;
		});

		return match;
	};
}

// Takes something that is not an operator object and returns an element matcher
// for equality with that thing.
function equalityElementMatcher(elementSelector: any) {
	if (isOperatorObject(elementSelector)) {
		throw Error("Can't create equalityValueSelector for operator object");
	}

	// Special-case: null and undefined are equal (if you got undefined in there
	// somewhere, or if you got it due to some branch being non-existent in the
	// weird special case), even though they aren't with EJSON.equals.
	// undefined or null
	if (elementSelector == null) {
		return (value: any) => value == null;
	}

	return (value: any) => _f._equal(elementSelector, value);
}

function everythingMatcher(_docOrBranchedValues: any) {
	return { result: true };
}

export function expandArraysInBranches<T>(
	branches: { value: T | T[]; dontIterate?: boolean; arrayIndices?: (number | 'x')[] }[],
	skipTheArrays?: boolean,
) {
	const branchesOut: { value: T | T[]; dontIterate?: boolean; arrayIndices?: (number | 'x')[] }[] = [];

	branches.forEach((branch) => {
		// We include the branch itself, *UNLESS* we it's an array that we're going
		// to iterate and we're told to skip arrays.  (That's right, we include some
		// arrays even skipTheArrays is true: these are arrays that were found via
		// explicit numerical indices.)
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

// Helpers for $bitsAllSet/$bitsAnySet/$bitsAllClear/$bitsAnyClear.
function getOperandBitmask(operand: any, selector: any) {
	// numeric bitmask
	// You can provide a numeric bitmask to be matched against the operand field.
	// It must be representable as a non-negative 32-bit signed integer.
	// Otherwise, $bitsAllSet will return an error.
	if (Number.isInteger(operand) && operand >= 0) {
		return new Uint8Array(new Int32Array([operand]).buffer);
	}

	// bindata bitmask
	// You can also use an arbitrarily large BinData instance as a bitmask.
	if (isBinary(operand)) {
		return new Uint8Array(operand.buffer);
	}

	// position list
	// If querying a list of bit positions, each <position> must be a non-negative
	// integer. Bit positions start at 0 from the least significant bit.
	if (Array.isArray(operand) && operand.every((x) => Number.isInteger(x) && x >= 0)) {
		const buffer = new ArrayBuffer((Math.max(...operand) >> 3) + 1);
		const view = new Uint8Array(buffer);

		operand.forEach((x) => {
			view[x >> 3] |= 1 << (x & 0x7);
		});

		return view;
	}

	// bad operand
	throw Error(
		`operand to ${selector} must be a numeric bitmask (representable as a ` +
			'non-negative 32-bit signed integer), a bindata bitmask or an array with ' +
			'bit positions (non-negative integers)',
	);
}

function getValueBitmask(value: any, length: any) {
	// The field value must be either numerical or a BinData instance. Otherwise,
	// $bits... will not match the current document.

	// numerical
	if (Number.isSafeInteger(value)) {
		// $bits... will not match numerical values that cannot be represented as a
		// signed 64-bit integer. This can be the case if a value is either too
		// large or small to fit in a signed 64-bit integer, or if it has a
		// fractional component.
		const buffer = new ArrayBuffer(Math.max(length, 2 * Uint32Array.BYTES_PER_ELEMENT));

		let view: any = new Uint32Array(buffer, 0, 2);
		view[0] = value % ((1 << 16) * (1 << 16)) | 0;
		view[1] = (value / ((1 << 16) * (1 << 16))) | 0;

		// sign extension
		if (value < 0) {
			view = new Uint8Array(buffer, 2);
			view.forEach((_byte: any, i: any) => {
				view[i] = 0xff;
			});
		}

		return new Uint8Array(buffer);
	}

	// bindata
	if (isBinary(value)) {
		return new Uint8Array(value.buffer);
	}

	// no match
	return false;
}

// Actually inserts a key value into the selector document
// However, this checks there is no ambiguity in setting
// the value for the given key, throws otherwise
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

// Returns a branched matcher that matches iff the given matcher does not.
// Note that this implicitly "deMorganizes" the wrapped function.  ie, it
// means that ALL branch values need to fail to match innerBranchedMatcher.
function invertBranchedMatcher(branchedMatcher: any) {
	return (branchValues: any) => {
		// We explicitly choose to strip arrayIndices here: it doesn't make sense to
		// say "update the array element that does not match something", at least
		// in mongo-land.
		return { result: !branchedMatcher(branchValues).result };
	};
}

export function isIndexable(obj: any): obj is { [index: string | number]: any } {
	return Array.isArray(obj) || _isPlainObject(obj);
}

export function isNumericKey(s: string) {
	return /^[0-9]+$/.test(s);
}

// Returns true if this is an object with at least one key and all keys begin
// with $.  Unless inconsistentOK is set, throws if some keys begin with $ and
// others don't.
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

	return !!theseAreOperators; // {} has no operators
}

// Helper for $lt/$gt/$lte/$gte.
function makeInequality(cmpValueComparator: any) {
	return {
		compileElementSelector(operand: any) {
			// Arrays never compare false with non-arrays for any inequality.
			// XXX This was behavior we observed in pre-release MongoDB 2.5, but
			//     it seems to have been reverted.
			//     See https://jira.mongodb.org/browse/SERVER-11444
			if (Array.isArray(operand)) {
				return () => false;
			}

			// Special case: consider undefined and null the same (so true with
			// $gte/$lte).
			if (operand === undefined) {
				operand = null;
			}

			const operandType = _f._type(operand);

			return (value: any) => {
				if (value === undefined) {
					value = null;
				}

				// Comparisons are never true among things of different type (except
				// null vs undefined).
				if (_f._type(value) !== operandType) {
					return false;
				}

				return cmpValueComparator(_f._cmp(value, operand));
			};
		},
	};
}

// makeLookupFunction(key) returns a lookup function.
//
// A lookup function takes in a document and returns an array of matching
// branches.  If no arrays are found while looking up the key, this array will
// have exactly one branches (possibly 'undefined', if some segment of the key
// was not found).
//
// If arrays are found in the middle, this can have more than one element, since
// we 'branch'. When we 'branch', if there are more key segments to look up,
// then we only pursue branches that are plain objects (not arrays or scalars).
// This means we can actually end up with no branches!
//
// We do *NOT* branch on arrays that are found at the end (ie, at the last
// dotted member of the key). We just return that array; if you want to
// effectively 'branch' over the array's values, post-process the lookup
// function with expandArraysInBranches.
//
// Each branch is an object with keys:
//  - value: the value at the branch
//  - dontIterate: an optional bool; if true, it means that 'value' is an array
//    that expandArraysInBranches should NOT expand. This specifically happens
//    when there is a numeric index in the key, and ensures the
//    perhaps-surprising MongoDB behavior where {'a.0': 5} does NOT
//    match {a: [[5]]}.
//  - arrayIndices: if any array indexing was done during lookup (either due to
//    explicit numeric indices or implicit branching), this will be an array of
//    the array indices used, from outermost to innermost; it is falsey or
//    absent if no array index is used. If an explicit numeric index is used,
//    the index will be followed in arrayIndices by the string 'x'.
//
//    Note: arrayIndices is used for two purposes. First, it is used to
//    implement the '$' modifier feature, which only ever looks at its first
//    element.
//
//    Second, it is used for sort key generation, which needs to be able to tell
//    the difference between different paths. Moreover, it needs to
//    differentiate between explicit and implicit branching, which is why
//    there's the somewhat hacky 'x' entry: this means that explicit and
//    implicit array lookups will have different full arrayIndices paths. (That
//    code only requires that different paths have different arrayIndices; it
//    doesn't actually 'parse' arrayIndices. As an alternative, arrayIndices
//    could contain objects with flags like 'implicit', but I think that only
//    makes the code surrounding them more complex.)
//
//    (By the way, this field ends up getting passed around a lot without
//    cloning, so never mutate any arrayIndices field/var in this package!)
//
//
// At the top level, you may only pass in a plain object or array.
//
// See the test 'minimongo - lookup' for some examples of what lookup functions
// return.
export function makeLookupFunction<T>(key: string, options: any = {}) {
	const parts = key.split('.');
	const firstPart = parts.length ? parts[0] : '';
	const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'), options);

	function buildResult(arrayIndices: any, dontIterate: any, value: any) {
		// eslint-disable-next-line no-nested-ternary
		return arrayIndices?.length
			? dontIterate
				? [{ arrayIndices, dontIterate, value }]
				: [{ arrayIndices, value }]
			: dontIterate
				? [{ dontIterate, value }]
				: [{ value }];
	}

	// Doc will always be a plain object or an array.
	// apply an explicit numeric index, an array.
	return (doc: T, arrayIndices?: (number | 'x')[]) => {
		if (Array.isArray(doc)) {
			// If we're being asked to do an invalid lookup into an array (non-integer
			// or out-of-bounds), return no results (which is different from returning
			// a single undefined result, in that `null` equality checks won't match).
			if (!(isNumericKey(firstPart) && +firstPart < doc.length)) {
				return [];
			}

			// Remember that we used this array index. Include an 'x' to indicate that
			// the previous index came from being considered as an explicit array
			// index (not branching).
			arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
		}

		// Do our first lookup.
		const firstLevel = doc[firstPart as keyof typeof doc];

		// If there is no deeper to dig, return what we found.
		//
		// If what we found is an array, most value selectors will choose to treat
		// the elements of the array as matchable values in their own right, but
		// that's done outside of the lookup function. (Exceptions to this are $size
		// and stuff relating to $elemMatch.  eg, {a: {$size: 2}} does not match {a:
		// [[1, 2]]}.)
		//
		// That said, if we just did an *explicit* array lookup (on doc) to find
		// firstLevel, and firstLevel is an array too, we do NOT want value
		// selectors to iterate over it.  eg, {'a.0': 5} does not match {a: [[5]]}.
		// So in that case, we mark the return value as 'don't iterate'.
		if (!lookupRest) {
			return buildResult(arrayIndices, Array.isArray(doc) && Array.isArray(firstLevel), firstLevel);
		}

		// We need to dig deeper.  But if we can't, because what we've found is not
		// an array or plain object, we're done. If we just did a numeric index into
		// an array, we return nothing here (this is a change in Mongo 2.5 from
		// Mongo 2.4, where {'a.0.b': null} stopped matching {a: [5]}). Otherwise,
		// return a single `undefined` (which can, for example, match via equality
		// with `null`).
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

		// Dig deeper: look up the rest of the parts on whatever we've found.
		// (lookupRest is smart enough to not try to do invalid lookups into
		// firstLevel if it's an array.)
		appendToResult(lookupRest(firstLevel, arrayIndices));

		// If we found an array, then in *addition* to potentially treating the next
		// part as a literal integer lookup, we should also 'branch': try to look up
		// the rest of the parts on each array element in parallel.
		//
		// In this case, we *only* dig deeper into array elements that are plain
		// objects. (Recall that we only got this far if we have further to dig.)
		// This makes sense: we certainly don't dig deeper into non-indexable
		// objects. And it would be weird to dig into an array: it's simpler to have
		// a rule that explicit integer indexes only apply to an outer array, not to
		// an array you find after a branching search.
		//
		// In the special case of a numeric part in a *sort selector* (not a query
		// selector), we skip the branching: we ONLY allow the numeric part to mean
		// 'look up this index' in that case, not 'also look up this index in all
		// the elements of the array'.
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

export const createMinimongoError = (message: any, options: any = {}) => {
	if (typeof message === 'string' && options.field) {
		message += ` for field '${options.field}'`;
	}

	const error = new Error(message);
	error.name = 'MinimongoError';
	return error;
};

export function nothingMatcher(_docOrBranchedValues: any) {
	return { result: false };
}

// Takes an operator object (an object with $ keys) and returns a branched
// matcher for it.
function operatorBranchedMatcher(valueSelector: any, matcher: Matcher<{ _id: string }>) {
	// Each valueSelector works separately on the various branches.  So one
	// operator can match one branch and another can match another branch.  This
	// is OK.
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

// Creating a document from an upsert is quite tricky.
// E.g. this selector: {"$or": [{"b.foo": {"$all": ["bar"]}}]}, should result
// in: {"b.foo": "bar"}
// But this selector: {"$or": [{"b": {"foo": {"$all": ["bar"]}}}]} should throw
// an error

// Some rules (found mainly with trial & error, so there might be more):
// - handle all childs of $and (or implicit $and)
// - handle $or nodes with exactly 1 child
// - ignore $or nodes with more than 1 child
// - ignore $nor and $not nodes
// - throw when a value can not be set unambiguously
// - every value for $all should be dealt with as separate $eq-s
// - threat all children of $all as $eq setters (=> set if $all.length === 1,
//   otherwise throw error)
// - you can not mix '$'-prefixed keys and non-'$'-prefixed keys
// - you can only have dotted keys on a root-level
// - you can not have '$'-prefixed keys more than one-level deep in an object

// Handles one key/value pair to put in the selector document
function populateDocumentWithKeyValue(document: any, key: any, value: any) {
	if (value && Object.getPrototypeOf(value) === Object.prototype) {
		populateDocumentWithObject(document, key, value);
	} else if (!(value instanceof RegExp)) {
		insertIntoDocument(document, key, value);
	}
}

// Handles a key, value pair to put in the selector document
// if the value is an object
function populateDocumentWithObject(document: any, key: any, value: any) {
	const keys = Object.keys(value);
	const unprefixedKeys = keys.filter((op) => op[0] !== '$');

	if (unprefixedKeys.length > 0 || !keys.length) {
		// Literal (possibly empty) object ( or empty object )
		// Don't allow mixing '$'-prefixed with non-'$'-prefixed fields
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
				// every value for $all should be dealt with as separate $eq-s
				object.forEach((element: any) => populateDocumentWithKeyValue(document, key, element));
			}
		});
	}
}

// Fills a document with certain fields from an upsert selector
export function populateDocumentWithQueryFields(query: any, document: any = {}): any {
	if (Object.getPrototypeOf(query) === Object.prototype) {
		// handle implicit $and
		Object.keys(query).forEach((key) => {
			const value = query[key];

			if (key === '$and') {
				// handle explicit $and
				value.forEach((element: any) => populateDocumentWithQueryFields(element, document));
			} else if (key === '$or') {
				// handle $or nodes with exactly 1 child
				if (value.length === 1) {
					populateDocumentWithQueryFields(value[0], document);
				}
			} else if (key[0] !== '$') {
				// Ignore other '$'-prefixed logical selectors
				populateDocumentWithKeyValue(document, key, value);
			}
		});
	} else {
		// Handle meteor-specific shortcut for selecting _id
		// eslint-disable-next-line no-lonely-if
		if (_selectorIsId(query)) {
			insertIntoDocument(document, '_id', query);
		}
	}

	return document;
}

// Takes a RegExp object and returns an element matcher.
function regexpElementMatcher(regexp: any) {
	return (value: any) => {
		if (value instanceof RegExp) {
			return value.toString() === regexp.toString();
		}

		// Regexps only work against strings.
		if (typeof value !== 'string') {
			return false;
		}

		// Reset regexp's state to avoid inconsistent matching for objects with the
		// same value on consecutive calls of regexp.test. This happens only if the
		// regexp has the 'g' flag. Also note that ES6 introduces a new flag 'y' for
		// which we should *not* change the lastIndex but MongoDB doesn't support
		// either of these flags.
		regexp.lastIndex = 0;

		return regexp.test(value);
	};
}

// Validates the key in a path.
// Objects that are nested more then 1 level cannot have dotted fields
// or fields starting with '$'
function validateKeyInPath(key: string, path: string) {
	if (key.includes('.')) {
		throw new Error(`The dotted field '${key}' in '${path}.${key} is not valid for storage.`);
	}

	if (key[0] === '$') {
		throw new Error(`The dollar ($) prefixed field  '${path}.${key} is not valid for storage.`);
	}
}

// Recursively validates an object that is nested more than one level deep
function validateObject(object: Record<string, unknown>, path: string) {
	if (object && Object.getPrototypeOf(object) === Object.prototype) {
		Object.keys(object).forEach((key) => {
			validateKeyInPath(key, path);
			validateObject(object[key] as Record<string, unknown>, `${path}.${key}`);
		});
	}
}

// helpers used by compiled selector code
export const _f = {
	// XXX for _all and _in, consider building 'inquery' at compile time..
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

		// note that typeof(/x/) === "object"
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

		// object
		return 3;

		// XXX support some/all of these:
		// 14, symbol
		// 15, javascript code with scope
		// 16, 18: 32-bit/64-bit integer
		// 17, timestamp
		// 255, minkey
		// 127, maxkey
	},

	// deep equality test: use for literal document and array matches
	_equal(a: unknown, b: unknown) {
		return isEqual(a, b, { keyOrderSensitive: true });
	},

	// maps a type code to a value that can be used to sort values of different
	// types
	_typeorder(t: number) {
		// http://www.mongodb.org/display/DOCS/What+is+the+Compare+Order+for+BSON+Types
		// XXX what is the correct sort position for Javascript code?
		// ('100' in the matrix below)
		// XXX minkey/maxkey
		return [
			-1, // (not a type)
			1, // number
			2, // string
			3, // object
			4, // array
			5, // binary
			-1, // deprecated
			6, // ObjectID
			7, // bool
			8, // Date
			0, // null
			9, // RegExp
			-1, // deprecated
			100, // JS code
			2, // deprecated (symbol)
			100, // JS code
			1, // 32-bit int
			8, // Mongo timestamp
			1, // 64-bit int
		][t];
	},

	// compare two values of unknown type according to BSON ordering
	// semantics. (as an extension, consider 'undefined' to be less than
	// any other value.) return negative if a is less, positive if b is
	// less, or 0 if equal
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

		// XXX need to implement this if we implement Symbol or integers, or
		// Timestamp
		if (ta !== tb) {
			throw Error('Missing type coercion logic in _cmp');
		}

		if (ta === 7) {
			// ObjectID
			// Convert to string.
			// eslint-disable-next-line no-multi-assign
			ta = tb = 2;
			a = (a as { toHexString(): string }).toHexString();
			b = (b as { toHexString(): string }).toHexString();
		}

		if (ta === 9) {
			// Date
			// Convert to millis.
			// eslint-disable-next-line no-multi-assign
			ta = tb = 1;
			a = isNaN(a as number) ? 0 : (a as Date).getTime();
			b = isNaN(b as number) ? 0 : (b as Date).getTime();
		}

		if (ta === 1) {
			// double
			return (a as number) - (b as number);
		}

		if (tb === 2)
			// string
			// eslint-disable-next-line no-nested-ternary
			return (a as string) < (b as string) ? -1 : a === b ? 0 : 1;

		if (ta === 3) {
			// Object
			// this could be much more efficient in the expected case ...
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
			// Array
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
			// binary
			// Surprisingly, a small binary blob is always less than a large one in
			// Mongo.
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
			// boolean
			if (a) {
				return b ? 0 : 1;
			}

			return b ? -1 : 0;
		}

		if (ta === 10)
			// null
			return 0;

		if (ta === 11)
			// regexp
			throw Error('Sorting not supported on regular expression'); // XXX

		// 13: javascript code
		// 14: symbol
		// 15: javascript code with scope
		// 16: 32-bit integer
		// 17: timestamp
		// 18: 64-bit integer
		// 255: minkey
		// 127: maxkey
		if (ta === 13)
			// javascript code
			throw Error('Sorting not supported on Javascript code'); // XXX

		throw Error('Unknown type to sort');
	},
};

// XXX maybe this should be EJSON.isObject, though EJSON doesn't know about
// RegExp
// XXX note that _type(undefined) === 3!!!!
export function _isPlainObject(x: any): x is Record<string, any> {
	return x && _f._type(x) === 3;
}

// Is this selector just shorthand for lookup by _id?
export function _selectorIsId(selector: unknown): selector is string | number {
	return typeof selector === 'number' || typeof selector === 'string';
}
