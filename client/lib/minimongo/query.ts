/* eslint-disable @typescript-eslint/no-use-before-define */
import { compareBSONValues, getBSONType } from './bson';
import { equals, flatSome, isObject, some } from './comparisons';
import { createLookupFunction } from './lookups';
import { BSONType, FieldExpression, Query } from './types';

const isArrayOfFields = <T>(values: unknown[]): values is T[] =>
	values.every((value) => ['number', 'string', 'symbol'].includes(typeof value));

const $in = <T extends string>(operand: T[], _options: undefined): ((value: T) => boolean) => {
	let index: Record<T, T> | null = null;
	if (isArrayOfFields<T>(operand)) {
		index = {} as Record<T, T>;
		for (const operandElement of operand) {
			index[operandElement] = operandElement;
		}
	}

	return (value: T): boolean =>
		some(value, (x) => {
			if (typeof x === 'string' && index !== null) {
				return !!index[x];
			}

			return operand.some((operandElement) => equals(operandElement, x));
		});
};

const $nin = <T extends string>(operand: T[], _options: undefined): ((value: T) => boolean) => {
	const isIn = $in(operand, undefined);

	return (value: T): boolean => {
		if (value === undefined) {
			return true;
		}

		return !isIn(value);
	};
};

const $all =
	<T>(operand: T[], _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return operand.every((operandElement) =>
			value.some((valueElement) => equals(operandElement, valueElement)),
		);
	};

const $lt =
	<T>(operand: T, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => compareBSONValues(x, operand) < 0);

const $lte =
	<T>(operand: T, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => compareBSONValues(x, operand) <= 0);

const $gt =
	<T>(operand: T, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => compareBSONValues(x, operand) > 0);

const $gte =
	<T>(operand: T, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => compareBSONValues(x, operand) >= 0);

const $ne =
	<T>(operand: T, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		!some(value, (x) => equals(x, operand));

const $exists =
	<T>(operand: boolean, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		operand === (value !== undefined);

const $mod =
	<T>([divisor, remainder]: [number, number], _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => Number(x) % divisor === remainder);

const $size =
	<T>(operand: number, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean =>
		Array.isArray(value) && operand === value.length;

const $type =
	<T>(operand: BSONType, _options: undefined): ((value: T) => boolean) =>
	(value: T): boolean => {
		if (value === undefined) {
			return false;
		}

		return flatSome(value, (x) => getBSONType(x) === operand);
	};

const $regex = <T>(operand: string | RegExp, options: string): ((value: T) => boolean) => {
	let regex: RegExp;

	if (options !== undefined) {
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

const $elemMatch = <T>(operand: Query<T>, _options: undefined): ((value: T) => boolean) => {
	const matcher = compileDocumentSelector(operand);

	return (value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return value.some((x) => matcher(x));
	};
};

const $not = <T>(operand: FieldExpression<T>, _options: undefined): ((value: T) => boolean) => {
	const matcher = compileValueSelector(operand);
	return (value: T): boolean => !matcher(value);
};

const dummyOperator =
	<T>(_operand: unknown, _options: undefined): ((value: T) => boolean) =>
	(_value: T): boolean =>
		true;

const $options = dummyOperator;
const $near = dummyOperator;
const $geoIntersects = dummyOperator;

const valueOperators = {
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

const $and = <T>(subSelector: Query<T>[]): ((doc: T) => boolean) => {
	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.every((f) => f(doc));
};

const $or = <T>(subSelector: Query<T>[]): ((doc: T) => boolean) => {
	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.some((f) => f(doc));
};

const $nor = <T>(subSelector: Query<T>[]): ((doc: T) => boolean) => {
	const subSelectorFunctions = subSelector.map(compileDocumentSelector);
	return (doc: T): boolean => subSelectorFunctions.every((f) => !f(doc));
};

const $where = <T>(selectorValue: string | Function): ((doc: T) => boolean) => {
	const fn =
		selectorValue instanceof Function ? selectorValue : Function(`return ${selectorValue}`);
	return (doc: T): boolean => !!fn.call(doc);
};

const logicalOperators = {
	$and,
	$or,
	$nor,
	$where,
} as const;

const isValueOperator = (operator: string): operator is keyof typeof valueOperators =>
	operator in valueOperators;

const isLogicalOperator = (operator: string): operator is keyof typeof logicalOperators =>
	operator in logicalOperators;

const hasValueOperators = <T>(valueSelector: FieldExpression<T>): boolean =>
	Object.keys(valueSelector).every((key) => key.slice(0, 1) === '$');

const compileUndefinedOrNullSelector =
	<T>(): ((value: T) => boolean) =>
	(value: T): boolean =>
		flatSome(value, (x) => x === undefined || x === null);

const compilePrimitiveSelector =
	<T>(primitive: T) =>
	(value: T): boolean =>
		flatSome(value, (x) => x === primitive);

const compileRegexSelector =
	<T>(regex: RegExp) =>
	(value: T): boolean => {
		if (value === undefined) {
			return false;
		}

		return flatSome(value, (x) => regex.test(String(x)));
	};

const compileArraySelector =
	<T>(expected: T) =>
	(value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return some(value, (x) => equals(expected, x));
	};

const compileValueOperatorsSelector = <T>(
	expression: FieldExpression<T>,
): ((value: T) => boolean) => {
	const operatorFunctions: ((value: T) => boolean)[] = [];
	for (const operator of Object.keys(expression) as (keyof FieldExpression<T>)[]) {
		if (!isValueOperator(operator)) {
			continue;
		}

		const operand = expression[operator];
		const operation = valueOperators[operator] as unknown as (
			operand: unknown,
			options: unknown,
		) => (value: T) => boolean;
		operatorFunctions.push(operation(operand, expression.$options));
	}
	return (value: T): boolean => operatorFunctions.every((f) => f(value));
};

const compileValueSelector = <T>(
	valueSelector: FieldExpression<T>[keyof FieldExpression<T>],
): ((value: T) => boolean) => {
	if (valueSelector === undefined || valueSelector === null) {
		return compileUndefinedOrNullSelector();
	}

	if (!isObject(valueSelector)) {
		return compilePrimitiveSelector(valueSelector as T);
	}

	if (valueSelector instanceof RegExp) {
		return compileRegexSelector(valueSelector);
	}

	if (Array.isArray(valueSelector)) {
		return compileArraySelector(valueSelector as unknown as T);
	}

	if (hasValueOperators<T>(valueSelector)) {
		return compileValueOperatorsSelector(valueSelector);
	}

	return (value: T): boolean =>
		flatSome(value, (x) => equals(valueSelector, x as unknown as object));
};

export const compileDocumentSelector = <T>(
	docSelector: Query<T> | FieldExpression<T>['$where'][],
): ((doc: T) => boolean) => {
	const perKeySelectors = Object.entries(docSelector).map(([key, subSelector]) => {
		if (subSelector === undefined) {
			return (): boolean => true;
		}

		if (isLogicalOperator(key)) {
			switch (key) {
				case '$and':
					return $and(subSelector);

				case '$or':
					return $or(subSelector);

				case '$nor':
					return $nor(subSelector);

				case '$where':
					return $where(subSelector);
			}
		}

		const lookUpByIndex = createLookupFunction(key);
		const valueSelectorFunc = compileValueSelector(subSelector);
		return (doc: T): boolean => {
			const branchValues = lookUpByIndex(doc);
			return branchValues.some(valueSelectorFunc);
		};
	});

	return (doc: T): boolean => perKeySelectors.every((f) => f(doc));
};
