import type { Mongo } from 'meteor/mongo';

import { compareBSONValues, getBSONType } from './bson';
import { equals, flatSome, some } from './comparisons';
import { compileDocumentSelector, compileValueSelector } from './selectors';

export const hasOperators = <T>(valueSelector: object): valueSelector is Mongo.FieldExpression<T> =>
	Object.keys(valueSelector).every((key) => key.slice(0, 1) === '$');

const isStringArray = (values: unknown[]): values is string[] =>
	values.every((value) => typeof value === 'string');

type Operand<T, K extends keyof Mongo.FieldExpression<T>> = Required<Mongo.FieldExpression<T>>[K];

export const $in = <T>(operand: Mongo.FieldExpression<T>['$in']): ((value: T) => boolean) => {
	if (!Array.isArray(operand)) {
		throw new Error('Argument to $in must be array');
	}

	const index: Record<string, unknown> = {};
	if (isStringArray(operand)) {
		for (const operandElement of operand) {
			index[operandElement] = operandElement;
		}
	}

	return (value: T): boolean => some(value, (x) => {
		if (typeof x === 'string' && index !== null) {
			return !!index[x];
		}

		return operand.some((operandElement) => equals(operandElement, x));
	});
};

export const $nin = <T>(operand: Operand<T, '$nin'>): ((value: T) => boolean) => {
	if (!Array.isArray(operand)) {
		throw new Error('Argument to $nin must be array');
	}

	const isIn = $in(operand);

	return (value: T): boolean => {
		if (value === undefined) {
			return true;
		}

		return !isIn(value);
	};
};

export const $all = <T>(operand: Operand<T, '$all'>): ((value: T) => boolean) => {
	if (!Array.isArray(operand)) {
		throw new Error('Argument to $all must be array');
	}

	return (value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return operand.every((operandElement) => value.some((valueElement) => equals(operandElement, valueElement)));
	};
};

export const $lt = <T>(operand: Operand<T, '$lt'>): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => compareBSONValues(x, operand) < 0);

export const $lte = <T>(operand: Operand<T, '$lte'>): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => compareBSONValues(x, operand) <= 0);

export const $gt = <T>(operand: Operand<T, '$gt'>): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => compareBSONValues(x, operand) > 0);

export const $gte = <T>(operand: Operand<T, '$gte'>): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => compareBSONValues(x, operand) >= 0);

export const $ne = <T>(operand: Operand<T, '$ne'>): ((value: T) => boolean) =>
	(value: T): boolean => !some(value, (x) => equals(x, operand));

export const $exists = <T>(operand: Operand<T, '$exists'>): ((value: T) => boolean) =>
	(value: T): boolean => operand === (value !== undefined);

export const $mod = <T extends number>([divisor, remainder]: Operand<T, '$mod'>): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => x % divisor === remainder);

export const $size = <T>(operand: Operand<T, '$size'>): ((value: T) => boolean) =>
	(value: T): boolean => Array.isArray(value) && operand === value.length;

export const $type = <T>(operand: Operand<T, '$type'>): ((value: T) => boolean) =>
	(value: T): boolean => {
		if (value === undefined) {
			return false;
		}

		return flatSome(value, (x) => getBSONType(x) === operand);
	};

export const $regex = <T>(
	operand: Operand<T, '$regex'>,
	options: Operand<T, '$options'>,
): ((value: T) => boolean) => {
	let regex: RegExp;

	if (options !== undefined) {
		if (/[^gim]/.test(options)) {
			throw new Error('Only the i, m, and g regexp options are supported');
		}

		const regexSource = operand instanceof RegExp ? operand.source : operand;
		regex = new RegExp(regexSource, options);
	} else if (!(operand instanceof RegExp)) {
		regex = new RegExp(operand);
	}

	return (value: T): boolean => {
		if (value === undefined) {
			return false;
		}

		return flatSome(value, (x) => regex.test(String(x)));
	};
};

export const $elemMatch = <T>(operand: Operand<T, '$elemMatch'>): ((value: T) => boolean) => {
	const matcher = compileDocumentSelector(operand);
	return (value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return value.some((x) => matcher(x));
	};
};

export const $not = <T>(operand: Operand<T, '$not'>): ((value: T) => boolean) => {
	const matcher = compileValueSelector(operand);
	return (value: T): boolean => !matcher(value);
};

const dummyOperator = <T>(_operand: unknown): ((value: T) => boolean) => (_value: T): boolean => true;

export const $options = dummyOperator;
export const $near = dummyOperator;
export const $geoIntersects = dummyOperator;

export const valueOperators = {
	$in,
	$nin,
	$all,
	$lt,
	$lte,
	$gt,
	$gte,
	$ne,
	$exists,
	$mod,
	$size,
	$type,
	$regex,
	$elemMatch,
	$not,
	$options,
	$near,
	$geoIntersects,
} as const;

type LogicalOperand<T, K extends keyof Mongo.Query<T> = never, L extends keyof Mongo.FieldExpression<T> = never> =
	Required<Mongo.Query<T>>[K] | Required<Mongo.FieldExpression<T>>[L];

export const $and = <T>(subSelector: LogicalOperand<T, '$and'>): ((doc: T) => boolean) => {
	if (!Array.isArray(subSelector) || subSelector.length === 0) {
		throw Error('$and/$or/$nor must be nonempty array');
	}

	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.every((f) => f(doc));
};

export const $or = <T>(subSelector: LogicalOperand<T, '$or'>): ((doc: T) => boolean) => {
	if (!Array.isArray(subSelector) || subSelector.length === 0) {
		throw Error('$and/$or/$nor must be nonempty array');
	}

	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.some((f) => f(doc));
};

export const $nor = <T>(subSelector: LogicalOperand<T, '$nor'>): ((doc: T) => boolean) => {
	if (!Array.isArray(subSelector) || subSelector.length === 0) {
		throw Error('$and/$or/$nor must be nonempty array');
	}

	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.every((f) => !f(doc));
};

export const $where = <T>(selectorValue: LogicalOperand<T, never, '$where'>): ((doc: T) => boolean) => {
	const fn = selectorValue instanceof Function ? selectorValue : Function(`return ${ selectorValue }`);
	return (doc: T): boolean => fn.call(doc);
};

export const logicalOperators = {
	$and,
	$or,
	$nor,
	$where,
} as const;

export const isValueOperator = (operator: string): operator is keyof typeof valueOperators =>
	operator in valueOperators;

export const isLogicalOperator = (operator: string): operator is keyof typeof logicalOperators =>
	operator in logicalOperators;
