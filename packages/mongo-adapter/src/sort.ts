import type { Sort } from 'mongodb';

import { compareBSONValues } from './bson';
import { isEmptyArray } from './comparisons';
import { createLookupFunction } from './lookups';
import type { LookupBranch } from './types';

const createSortSpecParts = <T>(
	spec: Sort,
): {
	lookup: (doc: T) => LookupBranch[];
	ascending: boolean;
}[] => {
	if (Array.isArray(spec)) {
		return spec.map((value) => {
			if (typeof value === 'string') {
				return {
					lookup: createLookupFunction(value, { forSort: true }),
					ascending: true,
				};
			}

			if (Array.isArray(value)) {
				return {
					lookup: createLookupFunction(value[0], { forSort: true }),
					ascending: value[1] !== 'desc',
				};
			}

			if (typeof value === 'object' && value !== null && '$meta' in value) {
				throw new Error('MongoDB $meta sort is not supported in the adapter');
			}

			throw new Error('MongoDB numeric sort is not supported in the adapter');
		});
	}

	return Object.entries(spec).map(([key, value]) => ({
		lookup: createLookupFunction(key, { forSort: true }),
		ascending: value >= 0,
	}));
};

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
		.reduce((reduced, value) => {
			const cmp = compareBSONValues(reduced, value);
			if ((ascending && cmp > 0) || (!ascending && cmp < 0)) {
				return value;
			}

			return reduced;
		});

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
