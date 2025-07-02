import type { FindOptions } from '@rocket.chat/ui-contexts';

import { pipe } from './pipe';

type OriginalStructure = FindOptions['sort'];

type SortField = 'lm' | 'lowerCaseFName' | 'lowerCaseName';
type SortDirection = -1 | 1;

type SortObject = {
	field: SortField;
	direction: SortDirection;
}[];

/**
 * Converts a MongoDB-style sort structure to a sort object.
 */
export const convertSort = (original: OriginalStructure): SortObject => {
	const convertedSort: SortObject = [];

	if (!original) {
		return convertedSort;
	}
	Object.keys(original as Record<string, any>).forEach((key) => {
		const direction = original[key as keyof OriginalStructure];

		if (direction === -1 || direction === 1) {
			convertedSort.push({
				field: key as SortField,
				direction,
			});
		}
	});
	return convertedSort;
};

export const applyQueryOptions = <T extends Record<string, any>>(records: T[], options: FindOptions): T[] => {
	let currentPipeline = pipe(records);
	if (options.sort) {
		const sortObj = convertSort(options.sort);
		for (let i = sortObj.sort.length - 1; i >= 0; i--) {
			const { field, direction } = sortObj[i];
			currentPipeline = currentPipeline.sortByField(field, direction);
		}
	}
	if (options.skip) {
		currentPipeline = currentPipeline.slice(options.skip, records.length);
	}
	if (options.limit !== undefined) {
		// If skip was applied, limit will be applied on the already skipped array
		// If no skip, it will be applied from the beginning.
		currentPipeline = currentPipeline.slice(0, options.limit);
	}
	return currentPipeline.apply();
};
