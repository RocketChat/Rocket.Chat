import type { Sort, SortDirection } from 'mongodb';

import { compareBSONValues } from './bson';
import { isEmptyArray } from './common';
import { createLookupFunction } from './lookups';
import type { LookupBranch } from './types';

const isSortDirection = (value: unknown): value is SortDirection =>
	value === 1 ||
	value === -1 ||
	value === 'asc' ||
	value === 'ascending' ||
	value === 'desc' ||
	value === 'descending' ||
	(typeof value === 'object' && value !== null && '$meta' in value);

const createSortSpecParts = <T>(spec: Sort): { lookup: (doc: T) => LookupBranch[]; ascending: boolean }[] => {
	const part = (key: string, direction: SortDirection = 1) => {
		if (typeof direction === 'object') {
			throw new Error('MongoDB $meta sort is not supported in the adapter');
		}
		return {
			lookup: createLookupFunction(key, { forSort: true }),
			ascending: direction === 1 || direction === 'asc' || direction === 'ascending',
		};
	};
	if (typeof spec === 'string') return [part(spec)];
	if (typeof spec === 'number') throw new Error('MongoDB numeric sort is not supported in the adapter');
	if (spec instanceof Map) return Array.from(spec, ([key, direction]) => part(key, direction));
	if (Array.isArray(spec)) {
		if (spec.length === 2 && typeof spec[0] === 'string' && isSortDirection(spec[1])) {
			return [part(spec[0], spec[1])];
		}
		return spec.map((value) => {
			if (typeof value === 'string') return part(value);
			if (Array.isArray(value)) return part(value[0], value[1]);
			if (typeof value === 'object' && value !== null && '$meta' in value) {
				throw new Error('MongoDB $meta sort is not supported in the adapter');
			}
			throw new Error('MongoDB numeric sort is not supported in the adapter');
		});
	}
	return Object.entries(spec).map(([key, direction]) => part(key, direction));
};

const reduceValue = (branchValues: LookupBranch[], ascending: boolean): unknown =>
	(branchValues.length ? branchValues : [{ value: undefined }])
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
