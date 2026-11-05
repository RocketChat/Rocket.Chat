import type { Sort } from 'mongodb';

import { compareBSONValues } from './bson';
import { isEmptyArray } from './common';
import { createLookupFunction } from './lookups';
import type { LookupBranch } from './types';

const directions = new Map<string, boolean>([
	['1', true],
	['asc', true],
	['ascending', true],
	['-1', false],
	['desc', false],
	['descending', false],
]);

const isMetaSort = (value: unknown): boolean => typeof value === 'object' && value !== null && '$meta' in value;

const isAscending = (direction: unknown = 1): boolean => {
	if (isMetaSort(direction)) {
		throw new Error('MongoDB $meta sort is not supported in the adapter');
	}

	const ascending = directions.get(String(direction).toLowerCase());
	if (ascending === undefined) {
		throw new Error(`Invalid sort direction: ${JSON.stringify(direction)}`);
	}

	return ascending;
};

// a two-item array whose second item is a direction is a single field and direction pair, as in the MongoDB driver
const isSortPair = (spec: readonly unknown[]): spec is [string, unknown] =>
	spec.length === 2 && typeof spec[0] === 'string' && (isMetaSort(spec[1]) || directions.has(String(spec[1]).toLowerCase()));

const toSortEntries = (spec: Sort): [string, unknown][] => {
	if (typeof spec === 'string') {
		return [[spec, 1]];
	}

	if (spec instanceof Map) {
		return [...spec];
	}

	if (!Array.isArray(spec)) {
		return Object.entries(spec);
	}

	if (isSortPair(spec)) {
		return [spec];
	}

	return spec.map((value: unknown): [string, unknown] => {
		if (typeof value === 'string') {
			return [value, 1];
		}

		if (Array.isArray(value)) {
			return [value[0], value[1]];
		}

		if (isMetaSort(value)) {
			throw new Error('MongoDB $meta sort is not supported in the adapter');
		}

		throw new Error('MongoDB numeric sort is not supported in the adapter');
	});
};

const createSortSpecParts = <T>(
	spec: Sort,
): {
	lookup: (doc: T) => LookupBranch[];
	ascending: boolean;
}[] =>
	toSortEntries(spec).map(([key, direction]) => ({
		lookup: createLookupFunction(key, { forSort: true }),
		ascending: isAscending(direction),
	}));

const reduceValue = (branchValues: LookupBranch[], ascending: boolean): unknown =>
	branchValues
		.flatMap(({ value }) => {
			if (!Array.isArray(value)) {
				return [value];
			}

			if (isEmptyArray(value)) {
				return [undefined];
			}

			return value;
		})
		.reduce<unknown>((reduced, value, index) => {
			if (index === 0) {
				return value;
			}

			const cmp = compareBSONValues(reduced, value);
			if ((ascending && cmp > 0) || (!ascending && cmp < 0)) {
				return value;
			}

			return reduced;
		}, undefined);

export const createComparatorFromSort = (spec: Sort): ((a: unknown, b: unknown) => number) => {
	const sortSpecParts = createSortSpecParts(spec);

	if (sortSpecParts.length === 0) {
		return () => 0;
	}

	return (a, b) => {
		for (let i = 0; i < sortSpecParts.length; ++i) {
			const { lookup, ascending } = sortSpecParts[i];
			const aValue = reduceValue(lookup(a), ascending);
			const bValue = reduceValue(lookup(b), ascending);
			const compare = compareBSONValues(aValue, bValue);

			if (compare !== 0) {
				return ascending ? compare : -compare;
			}
		}

		return 0;
	};
};
