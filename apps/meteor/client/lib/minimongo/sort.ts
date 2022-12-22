import { compareBSONValues } from './bson';
import { isEmptyArray } from './comparisons';
import { createLookupFunction } from './lookups';
import type { Sort } from './types';

const createSortSpecParts = <T>(
	spec: Sort,
): {
	lookup: (doc: T) => unknown[];
	ascending: boolean;
}[] => {
	if (Array.isArray(spec)) {
		return spec.map((value) => {
			if (typeof value === 'string') {
				return {
					lookup: createLookupFunction<T>(value),
					ascending: true,
				};
			}

			return {
				lookup: createLookupFunction<T>(value[0]),
				ascending: value[1] !== 'desc',
			};
		});
	}

	return Object.entries(spec).map(([key, value]) => ({
		lookup: createLookupFunction<T>(key),
		ascending: value >= 0,
	}));
};

const reduceValue = (branchValues: unknown[], ascending: boolean): unknown =>
	([] as unknown[])
		.concat(
			...branchValues.map<unknown[]>((branchValue) => {
				if (!Array.isArray(branchValue)) {
					return [branchValue];
				}

				if (isEmptyArray(branchValue)) {
					return [undefined];
				}

				return branchValue;
			}),
		)
		.reduce((reduced, value) => {
			const cmp = compareBSONValues(reduced, value);
			if ((ascending && cmp > 0) || (!ascending && cmp < 0)) {
				return value;
			}

			return reduced;
		});

export const compileSort = (spec: Sort): ((a: unknown, b: unknown) => number) => {
	const sortSpecParts = createSortSpecParts(spec);

	if (sortSpecParts.length === 0) {
		return (): number => 0;
	}

	return (a: unknown, b: unknown): number => {
		for (let i = 0; i < sortSpecParts.length; ++i) {
			const specPart = sortSpecParts[i];
			const aValue = reduceValue(specPart.lookup(a), specPart.ascending);
			const bValue = reduceValue(specPart.lookup(b), specPart.ascending);
			const compare = compareBSONValues(aValue, bValue);

			if (compare !== 0) {
				return specPart.ascending ? compare : -compare;
			}
		}

		return 0;
	};
};
