import type { MongoID } from "meteor/mongo-id";

export type Document = Record<string, any>;
export type MatchResult = { result: boolean; distance?: number | undefined; arrayIndices?: number[] };
export type BranchedValue = { value: any; dontIterate?: boolean; arrayIndices?: (number | string)[] | undefined };

const hasOwn = Object.prototype.hasOwnProperty;

/**
 * Deep equality check that correctly mimics MongoDB/EJSON equality.
 * Note: MongoDB object equality is strictly key-order sensitive.
 */
export const isEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (a == null || b == null) return a === b;
    if (typeof a !== 'object' || typeof b !== 'object') return false;
    if (Object.getPrototypeOf(a) !== Object.getPrototypeOf(b)) return false;

    if (a instanceof Date) return a.getTime() === b.getTime();
    if (a instanceof RegExp) return a.source === b.source && a.flags === b.flags;

    if (a instanceof Uint8Array) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i]) return false;
        }
        return true;
    }

    if (Array.isArray(a)) {
        if (a.length !== b.length) return false;
        for (let i = 0; i < a.length; i++) {
            if (!isEqual(a[i], b[i])) return false;
        }
        return true;
    }

    // Plain objects: BSON equality is key-order sensitive.
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    for (let i = 0; i < keysA.length; i++) {
        if (keysA[i] !== keysB[i]) return false; // Key order matters
        if (!isEqual(a[keysA[i]], b[keysB[i]])) return false;
    }

    return true;
};

export const isIndexable = (obj: any): boolean => Array.isArray(obj) || isPlainObject(obj);
export const isNumericKey = (s: string): boolean => /^[0-9]+$/.test(s);
export const isPlainObject = (obj: any): boolean => !!obj && typeof obj === 'object' && Object.getPrototypeOf(obj) === Object.prototype;

export const isOperatorObject = (valueSelector: any, inconsistentOK?: boolean): boolean => {
    if (!isPlainObject(valueSelector)) return false;

    let theseAreOperators: boolean | undefined = undefined;
    for (const selKey of Object.keys(valueSelector)) {
        const thisIsOperator = selKey.startsWith('$') || selKey === 'diff';
        if (theseAreOperators === undefined) {
            theseAreOperators = thisIsOperator;
        } else if (theseAreOperators !== thisIsOperator) {
            if (!inconsistentOK) {
                throw new Error(`Inconsistent operator: ${JSON.stringify(valueSelector)}`);
            }
            theseAreOperators = false;
        }
    }
    return !!theseAreOperators;
};

// Simplified BSON type ordering for comparisons
const getTypeOrder = (v: any): number => {
    if (typeof v === 'number') return 1;
    if (typeof v === 'string') return 2;
    if (isPlainObject(v)) return 3;
    if (Array.isArray(v)) return 4;
    if (v instanceof Uint8Array) return 5;
    if (typeof v === 'boolean') return 8;
    if (v instanceof Date) return 9;
    if (v === null) return 10;
    if (v instanceof RegExp) return 11;
    return -1;
};

export const compareValues = (a: any, b: any): number => {
    if (a === undefined) return b === undefined ? 0 : -1;
    if (b === undefined) return 1;

    const ta = getTypeOrder(a);
    const tb = getTypeOrder(b);

    if (ta !== tb) return ta < tb ? -1 : 1;

    if (ta === 1) return a - b;
    if (ta === 2) return a < b ? -1 : a === b ? 0 : 1;
    if (ta === 8) return a === b ? 0 : a ? 1 : -1;
    if (ta === 9) return a.getTime() - b.getTime();
    if (ta === 10) return 0;
    if (ta === 4) {
        for (let i = 0; ; i++) {
            if (i === a.length) return i === b.length ? 0 : -1;
            if (i === b.length) return 1;
            const s = compareValues(a[i], b[i]);
            if (s !== 0) return s;
        }
    }
    if (ta === 3) {
        const toArray = (obj: any) => Object.entries(obj).flat();
        return compareValues(toArray(a), toArray(b));
    }

    throw new Error('Unknown type to sort or compare');
};

const makeInequality = (cmpValueComparator: (val: number) => boolean) => ({
    compileElementSelector(operand: any) {
        if (Array.isArray(operand)) return () => false;
        if (operand === undefined) operand = null;
        const operandType = getTypeOrder(operand);

        return (value: any) => {
            if (value === undefined) value = null;
            if (getTypeOrder(value) !== operandType) return false;
            return cmpValueComparator(compareValues(value, operand));
        };
    }
});

export const equalityElementMatcher = (elementSelector: any) => {
    if (isOperatorObject(elementSelector)) {
        throw new Error("Can't create equalityValueSelector for operator object");
    }
    if (elementSelector == null) return (value: any) => value == null;
    return (value: any) => isEqual(elementSelector, value);
};

export const regexpElementMatcher = (regexp: RegExp) => {
    return (value: any) => {
        if (value instanceof RegExp) return value.toString() === regexp.toString();
        if (typeof value !== 'string') return false;
        regexp.lastIndex = 0;
        return regexp.test(value);
    };
};

export const expandArraysInBranches = (branches: BranchedValue[], skipTheArrays?: boolean): BranchedValue[] => {
    const branchesOut: BranchedValue[] = [];
    for (const branch of branches) {
        const thisIsArray = Array.isArray(branch.value);
        if (!(skipTheArrays && thisIsArray && !branch.dontIterate)) {
            branchesOut.push({ arrayIndices: branch.arrayIndices, value: branch.value });
        }
        if (thisIsArray && !branch.dontIterate) {
            branch.value.forEach((value: any, i: number) => {
                branchesOut.push({
                    arrayIndices: (branch.arrayIndices || []).concat(i),
                    value
                });
            });
        }
    }
    return branchesOut;
};

const andSomeMatchers = (subMatchers: Array<(doc: any) => MatchResult>) => {
    if (subMatchers.length === 0) return () => ({ result: true });
    if (subMatchers.length === 1) return subMatchers[0];

    return (docOrBranches: any): MatchResult => {
        const match: MatchResult = { result: false };
        match.result = subMatchers.every(fn => {
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
};

const invertBranchedMatcher = (branchedMatcher: (branches: BranchedValue[]) => MatchResult) => {
    return (branchValues: BranchedValue[]) => ({
        result: !branchedMatcher(branchValues).result
    });
};

const convertElementMatcherToBranchedMatcher = (elementMatcher: (val: any) => boolean | number, options: any = {}) => {
    return (branches: BranchedValue[]): MatchResult => {
        const expanded = options.dontExpandLeafArrays
            ? branches
            : expandArraysInBranches(branches, options.dontIncludeLeafArrays);

        const match: MatchResult = { result: false };
        match.result = expanded.some(element => {
            let matched = elementMatcher(element.value);
            if (typeof matched === 'number') {
                if (!element.arrayIndices) element.arrayIndices = [matched];
                matched = true;
            }
            if (matched && element.arrayIndices) {
                match.arrayIndices = element.arrayIndices as number[];
            }
            return matched;
        });
        return match;
    };
};

export const makeLookupFunction = (key: string, options: any = {}) => {
    const parts = key.split('.');
    const firstPart = parts.length ? parts[0] : '';
    const lookupRest = parts.length > 1 && makeLookupFunction(parts.slice(1).join('.'), options);

    const buildResult = (arrayIndices: any[], dontIterate: boolean, value: any): BranchedValue[] => {
        return arrayIndices && arrayIndices.length
            ? dontIterate ? [{ arrayIndices, dontIterate, value }] : [{ arrayIndices, value }]
            : dontIterate ? [{ dontIterate, value }] : [{ value }];
    };

    return (doc: any, arrayIndices?: any[]): BranchedValue[] => {
        if (Array.isArray(doc)) {
            if (!(isNumericKey(firstPart) && parseInt(firstPart, 10) < doc.length)) return [];
            arrayIndices = arrayIndices ? arrayIndices.concat(+firstPart, 'x') : [+firstPart, 'x'];
        }

        const firstLevel = doc[firstPart];

        if (!lookupRest) {
            return buildResult(
                arrayIndices || [],
                Array.isArray(doc) && Array.isArray(firstLevel),
                firstLevel
            );
        }

        if (!isIndexable(firstLevel)) {
            if (Array.isArray(doc)) return [];
            return buildResult(arrayIndices || [], false, undefined);
        }

        const result: BranchedValue[] = [];
        result.push(...lookupRest(firstLevel, arrayIndices));

        if (Array.isArray(firstLevel) && !(isNumericKey(parts[1]) && options.forSort)) {
            firstLevel.forEach((branch, arrayIndex) => {
                if (isPlainObject(branch)) {
                    result.push(...lookupRest(branch, arrayIndices ? arrayIndices.concat(arrayIndex) : [arrayIndex]));
                }
            });
        }

        return result;
    };
};

const compileValueSelector = (valueSelector: any, matcher: Matcher, isRoot?: boolean): (branches: BranchedValue[]) => MatchResult => {
    if (valueSelector instanceof RegExp) {
        matcher._isSimple = false;
        return convertElementMatcherToBranchedMatcher(regexpElementMatcher(valueSelector));
    }
    if (isOperatorObject(valueSelector)) {
        return operatorBranchedMatcher(valueSelector, matcher, isRoot);
    }
    return convertElementMatcherToBranchedMatcher(equalityElementMatcher(valueSelector));
};

export const compileDocumentSelector = (docSelector: any, matcher: Matcher, options: any = {}): (doc: any) => MatchResult => {
    const docMatchers = Object.keys(docSelector).map(key => {
        const subSelector = docSelector[key];

        if (key.startsWith('$')) {
            if (!hasOwn.call(LOGICAL_OPERATORS, key)) throw new Error(`Unrecognized logical operator: ${key}`);
            matcher._isSimple = false;
            return LOGICAL_OPERATORS[key](subSelector, matcher, options.inElemMatch);
        }

        if (!options.inElemMatch) matcher._recordPathUsed(key);
        if (typeof subSelector === 'function') return undefined;

        const lookUpByIndex = makeLookupFunction(key);
        const valueMatcher = compileValueSelector(subSelector, matcher, options.isRoot);

        return (doc: any) => valueMatcher(lookUpByIndex(doc));
    }).filter(Boolean) as Array<(doc: any) => MatchResult>;

    return andSomeMatchers(docMatchers);
};

const operatorBranchedMatcher = (valueSelector: any, matcher: Matcher, isRoot?: boolean) => {
    const operatorMatchers = Object.keys(valueSelector).map(operator => {
        const operand = valueSelector[operator];

        const simpleRange = ['$lt', '$lte', '$gt', '$gte'].includes(operator) && typeof operand === 'number';
        const simpleEquality = ['$ne', '$eq'].includes(operator) && !isPlainObject(operand);
        const simpleInclusion = ['$in', '$nin'].includes(operator) && Array.isArray(operand) && !operand.some(x => isPlainObject(x));

        if (!(simpleRange || simpleInclusion || simpleEquality)) matcher._isSimple = false;

        if (hasOwn.call(VALUE_OPERATORS, operator)) {
            return VALUE_OPERATORS[operator](operand, valueSelector, matcher, isRoot);
        }

        if (hasOwn.call(ELEMENT_OPERATORS, operator)) {
            const opts = ELEMENT_OPERATORS[operator as keyof typeof ELEMENT_OPERATORS];
            return convertElementMatcherToBranchedMatcher(opts.compileElementSelector(operand, valueSelector, matcher), opts);
        }

        throw new Error(`Unrecognized operator: ${operator}`);
    });

    return andSomeMatchers(operatorMatchers);
};

export const ELEMENT_OPERATORS = {
    $lt: makeInequality(cmpValue => cmpValue < 0),
    $gt: makeInequality(cmpValue => cmpValue > 0),
    $lte: makeInequality(cmpValue => cmpValue <= 0),
    $gte: makeInequality(cmpValue => cmpValue >= 0),
    $mod: {
        compileElementSelector(operand: any) {
            if (!(Array.isArray(operand) && operand.length === 2 && typeof operand[0] === 'number' && typeof operand[1] === 'number')) {
                throw new Error('argument to $mod must be an array of two numbers');
            }
            const [divisor, remainder] = operand;
            return (value: any) => typeof value === 'number' && value % divisor === remainder;
        }
    },
    $in: {
        compileElementSelector(operand: any) {
            if (!Array.isArray(operand)) throw new Error('$in needs an array');
            const elementMatchers = operand.map(option => {
                if (option instanceof RegExp) return regexpElementMatcher(option);
                if (isOperatorObject(option)) throw new Error('cannot nest $ under $in');
                return equalityElementMatcher(option);
            });
            return (value: any) => {
                if (value === undefined) value = null;
                return elementMatchers.some(matcher => matcher(value));
            };
        }
    },
    $size: {
        dontExpandLeafArrays: true,
        compileElementSelector(operand: any) {
            if (typeof operand === 'string') operand = 0;
            else if (typeof operand !== 'number') throw new Error('$size needs a number');
            return (value: any) => Array.isArray(value) && value.length === operand;
        }
    },
    $type: {
        dontIncludeLeafArrays: true,
        compileElementSelector(operand: any) {
            if (typeof operand === 'string') {
                const operandAliasMap: Record<string, number> = {
                    'double': 1, 'string': 2, 'object': 3, 'array': 4, 'binData': 5, 'undefined': 6,
                    'objectId': 7, 'bool': 8, 'date': 9, 'null': 10, 'regex': 11, 'int': 16,
                    'timestamp': 17, 'long': 18, 'decimal': 19, 'minKey': -1, 'maxKey': 127
                };
                if (!hasOwn.call(operandAliasMap, operand)) throw new Error(`unknown string alias for $type: ${operand}`);
                operand = operandAliasMap[operand];
            }
            return (value: any) => value !== undefined && getTypeOrder(value) === operand;
        }
    },
    $regex: {
        compileElementSelector(operand: any, valueSelector: any) {
            if (!(typeof operand === 'string' || operand instanceof RegExp)) throw new Error('$regex has to be a string or RegExp');
            let regexp;
            if (valueSelector.$options !== undefined) {
                if (/[^gim]/.test(valueSelector.$options)) throw new Error('Only the i, m, and g regexp options are supported');
                const source = operand instanceof RegExp ? operand.source : operand;
                regexp = new RegExp(source, valueSelector.$options);
            } else if (operand instanceof RegExp) {
                regexp = operand;
            } else {
                regexp = new RegExp(operand);
            }
            return regexpElementMatcher(regexp);
        }
    },
    $elemMatch: {
        dontExpandLeafArrays: true,
        compileElementSelector(operand: any, _valueSelector: any, matcher: Matcher) {
            if (!isPlainObject(operand)) throw new Error('$elemMatch need an object');

            const isDocMatcher = !isOperatorObject(
                Object.keys(operand).filter(key => !hasOwn.call(LOGICAL_OPERATORS, key))
                    .reduce((a, b) => Object.assign(a, { [b]: operand[b] }), {}), true
            );

            let subMatcher: any;
            if (isDocMatcher) {
                subMatcher = compileDocumentSelector(operand, matcher, { inElemMatch: true });
            } else {
                subMatcher = compileValueSelector(operand, matcher);
            }

            return (value: any) => {
                if (!Array.isArray(value)) return false;
                for (let i = 0; i < value.length; ++i) {
                    const arrayElement = value[i];
                    const arg = isDocMatcher ? arrayElement : [{ value: arrayElement, dontIterate: true }];
                    if (isDocMatcher && !isIndexable(arrayElement)) return false;
                    if (subMatcher(arg).result) return i;
                }
                return false;
            };
        }
    }
};

const LOGICAL_OPERATORS: Record<string, Function> = {
    $and: (subSelector: any, matcher: Matcher, inElemMatch?: boolean) => {
        if (!Array.isArray(subSelector) || subSelector.length === 0) throw new Error('$and must be nonempty array');
        return andSomeMatchers(subSelector.map(s => compileDocumentSelector(s, matcher, { inElemMatch })));
    },
    $or: (subSelector: any, matcher: Matcher, inElemMatch?: boolean) => {
        if (!Array.isArray(subSelector) || subSelector.length === 0) throw new Error('$or must be nonempty array');
        const matchers = subSelector.map(s => compileDocumentSelector(s, matcher, { inElemMatch }));
        if (matchers.length === 1) return matchers[0];
        return (doc: any) => ({ result: matchers.some(fn => fn(doc).result) });
    },
    $nor: (subSelector: any, matcher: Matcher, inElemMatch?: boolean) => {
        if (!Array.isArray(subSelector) || subSelector.length === 0) throw new Error('$nor must be nonempty array');
        const matchers = subSelector.map(s => compileDocumentSelector(s, matcher, { inElemMatch }));
        return (doc: any) => ({ result: matchers.every(fn => !fn(doc).result) });
    },
    $where: (selectorValue: any, matcher: Matcher) => {
        matcher._recordPathUsed('');
        matcher._hasWhere = true;
        if (!(selectorValue instanceof Function)) {
            selectorValue = new Function('obj', `return ${selectorValue}`);
        }
        return (doc: any) => ({ result: selectorValue.call(doc, doc) });
    },
    $comment: () => () => ({ result: true })
};

const VALUE_OPERATORS: Record<string, Function> = {
    $eq: (operand: any) => convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand)),
    $not: (operand: any, _valueSelector: any, matcher: Matcher) => invertBranchedMatcher(compileValueSelector(operand, matcher)),
    $ne: (operand: any) => invertBranchedMatcher(convertElementMatcherToBranchedMatcher(equalityElementMatcher(operand))),
    $nin: (operand: any) => invertBranchedMatcher(convertElementMatcherToBranchedMatcher(ELEMENT_OPERATORS.$in.compileElementSelector(operand))),
    $exists: (operand: any) => {
        const exists = convertElementMatcherToBranchedMatcher((value: any) => value !== undefined);
        return operand ? exists : invertBranchedMatcher(exists);
    },
    $options: () => { throw new Error('$options needs a $regex'); },
    $maxDistance: () => { throw new Error('$maxDistance needs a $near'); },
    $all: (operand: any, _valueSelector: any, matcher: Matcher) => {
        if (!Array.isArray(operand)) throw new Error('$all requires array');
        if (operand.length === 0) return () => ({ result: false });
        const branchedMatchers = operand.map(criterion => {
            if (isOperatorObject(criterion)) throw new Error('no $ expressions in $all');
            return compileValueSelector(criterion, matcher);
        });
        return andSomeMatchers(branchedMatchers);
    },
    $near: (operand: any, valueSelector: any, matcher: Matcher, isRoot?: boolean) => {
        if (!isRoot) throw new Error("$near can't be inside another $ operator");
        matcher._hasGeoQuery = true;
        const maxDistance = valueSelector.$maxDistance || operand.$maxDistance;
        const point = Array.isArray(operand) ? operand.slice() : (operand.$geometry ? [operand.$geometry.coordinates[0], operand.$geometry.coordinates[1]] : [operand.x, operand.y]);

        return (branchedValues: BranchedValue[]) => {
            const result: MatchResult = { result: false };
            expandArraysInBranches(branchedValues).every(branch => {
                let curDistance;
                if (!matcher._isUpdate) {
                    if (typeof branch.value !== 'object') return true;
                    const valPoint = Array.isArray(branch.value) ? branch.value : [branch.value.x, branch.value.y];
                    curDistance = Math.hypot(point[0] - valPoint[0], point[1] - valPoint[1]);
                    if (curDistance === null || (maxDistance !== undefined && curDistance > maxDistance)) return true;
                    if (result.distance !== undefined && result.distance <= curDistance) return true;
                }
                result.result = true;
                result.distance = curDistance;
                if (branch.arrayIndices) result.arrayIndices = branch.arrayIndices as number[];
                else delete result.arrayIndices;
                return !matcher._isUpdate;
            });
            return result;
        };
    }
};

export class Matcher {
    public _paths: Record<string, boolean> = {};
    public _hasGeoQuery: boolean = false;
    public _hasWhere: boolean = false;
    public _isSimple: boolean = true;
    public _matchingDocument: any = undefined;
    public _selector: any = null;
    public _docMatcher: (doc: any) => MatchResult;
    public _isUpdate: boolean;

    constructor(selector: any, isUpdate: boolean = false) {
        this._isUpdate = isUpdate;
        this._docMatcher = this._compileSelector(selector);
    }

    documentMatches(doc: any): MatchResult {
        if (!doc || typeof doc !== 'object') throw new Error('documentMatches needs a document');
        return this._docMatcher(doc);
    }

    hasGeoQuery(): boolean {
        return this._hasGeoQuery;
    }

    hasWhere(): boolean {
        return this._hasWhere;
    }

    isSimple(): boolean {
        return this._isSimple;
    }

    _recordPathUsed(path: string) {
        this._paths[path] = true;
    }

    private _compileSelector(selector: string | Function | { _id: string | MongoID.ObjectID }): (doc: { _id: string | MongoID.ObjectID }) => MatchResult {
        if (typeof selector === 'function') {
            this._isSimple = false;
            this._selector = selector;
            this._recordPathUsed('');
            return (doc) => ({ result: !!selector.call(doc) });
        }

        if (typeof selector === 'string') {
            this._selector = { _id: selector };
            this._recordPathUsed('_id');
            return (doc) => ({ result: isEqual(doc._id, selector) });
        }

        if (!selector || (hasOwn.call(selector, '_id') && !selector._id)) {
            this._isSimple = false;
            return () => ({ result: false });
        }

        if (Array.isArray(selector) || typeof selector === 'boolean') {
            throw new Error(`Invalid selector: ${selector}`);
        }

        this._selector = structuredClone(selector);
        return compileDocumentSelector(selector, this, { isRoot: true });
    }
}