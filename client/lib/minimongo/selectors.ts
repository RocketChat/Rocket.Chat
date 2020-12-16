import type { Mongo } from 'meteor/mongo';

import { equals, flatSome, isObject, some } from './comparisons';
import { createLookupFunction, Document } from './lookups';
import { hasOperators, isLogicalOperator, isValueOperator, logicalOperators, valueOperators } from './operators';

const compileUndefinedOrNullSelector = <T>(): ((value: T) => boolean) =>
	(value: T): boolean => flatSome(value, (x) => x === undefined || x === null);

const compilePrimitiveSelector = <T>(primitive: T) =>
	(value: T): boolean => flatSome(value, (x) => x === primitive);

const compileRegexSelector = <T>(regex: RegExp) =>
	(value: T): boolean => {
		if (value === undefined) {
			return false;
		}

		return flatSome(value, (x) => regex.test(String(x)));
	};

const compileArraySelector = <T>(expected: T) =>
	(value: T): boolean => {
		if (!Array.isArray(value)) {
			return false;
		}

		return some(value, (x) => equals(expected, x));
	};

const compileValueOperatorsSelector = <T>(expression: Mongo.FieldExpression<T>): ((value: T) => boolean) => {
	const operatorFunctions: ((value: T) => boolean)[] = [];
	for (const operator of Object.keys(expression) as (keyof Mongo.FieldExpression<T>)[]) {
		if (!isValueOperator(operator)) {
			continue;
		}

		const operand = expression[operator];
		const operation = valueOperators[operator] as unknown as ((operand: unknown, options: unknown) => (value: T) => boolean);
		operatorFunctions.push(operation(operand, expression.$options));
	}
	return (value: T): boolean => operatorFunctions.every((f) => f(value));
};

export const compileValueSelector = <T>(valueSelector: Mongo.Query<T>[string]): ((value: T) => boolean) => {
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

	if (hasOperators<T>(valueSelector)) {
		return compileValueOperatorsSelector(valueSelector);
	}

	return (value: T): boolean => flatSome(value, (x) => equals(valueSelector, x as unknown as object));
};

export const compileDocumentSelector = <T extends Document>(docSelector: T extends {} ? Mongo.Query<T> : Mongo.FieldExpression<T>): ((doc: T) => boolean) => {
	const perKeySelectors = Object.entries(docSelector).map(([key, subSelector]) => {
		if (isLogicalOperator(key)) {
			const operation = logicalOperators[key] as unknown as (docSelector: T) => (doc: T) => boolean;
			return operation(subSelector);
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
