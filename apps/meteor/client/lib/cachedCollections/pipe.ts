import type { FindOptions } from '@rocket.chat/ui-contexts/dist/UserContext';

interface IPipeReturn<D> {
	slice(skip: number, limit: number): IPipeReturn<D>;
	sortByField(fieldName: keyof D, direction?: 1 | -1): IPipeReturn<D>;
	apply(): D[];
	pipe(p: IPipeReturn<D>): IPipeReturn<D>;
}

interface IPipeReturnNoInitialData<D> {
	slice(skip: number, limit: number): IPipeReturnNoInitialData<D>;
	sortByField(fieldName: keyof D, direction?: 1 | -1): IPipeReturnNoInitialData<D>;
	apply(arg: D[]): D[];
	pipe(p: IPipeReturnNoInitialData<D>): IPipeReturnNoInitialData<D>;
}

type PipeFunction<D> = (arg: D[]) => D[];

const merge =
	<D>(fn: PipeFunction<D>, inner: PipeFunction<D>): PipeFunction<D> =>
	(args) =>
		fn(inner(args));

export function pipe<D>(): IPipeReturnNoInitialData<D>;
export function pipe<D>(initialData: D[]): IPipeReturn<D>;
export function pipe<D>(initialData: D[], acc: PipeFunction<D>): IPipeReturn<D>;

export function pipe<D>(
	initialData?: any,
	acc: PipeFunction<D> = (arg) => [...arg],
): typeof initialData extends undefined ? IPipeReturnNoInitialData<D> : IPipeReturn<D> {
	return {
		slice(skip = 0, limit: number) {
			return pipe<D>(
				initialData,
				merge<D>((arr: D[]) => arr.slice(skip, skip + limit), acc),
			);
		},

		sortByField(fieldName: keyof D, direction: 1 | -1 = 1) {
			return pipe<D>(
				initialData,
				merge(
					(arr: D[]) =>
						[...arr].sort((a, b) => {
							const aValue = a[fieldName];
							const bValue = b[fieldName];

							if (aValue instanceof Date && bValue instanceof Date) {
								return direction * (aValue.getTime() - bValue.getTime());
							}

							if (typeof aValue === 'string' && typeof bValue === 'string') {
								return direction * aValue.localeCompare(bValue);
							}
							if (typeof aValue === 'number' && typeof bValue === 'number') {
								return direction * (aValue - bValue);
							}
							return 0;
						}),
					acc,
				),
			);
		},

		apply: (arg: D[]) => {
			return acc(initialData ?? arg);
		},
		pipe(p: IPipeReturn<D>) {
			return pipe<D>(initialData, merge(p.apply, acc));
		},
	};
}

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
