import { useCallback, useState } from 'react';

type Direction = 'asc' | 'desc';

export const useSort = <T extends string>(
	by: T,
	initialDirection: Direction = 'asc',
): {
	sortBy: T;
	sortDirection: Direction;
	setSort: (sortBy: T, direction?: Direction | undefined) => void;
} => {
	const [sort, _setSort] = useState<[T, Direction]>(() => [by, initialDirection]);

	const setSort = useCallback((id: T, direction?: Direction | undefined) => {
		_setSort(([sortBy, sortDirection]) => {
			if (direction) {
				return [id, direction];
			}

			if (sortBy === id) {
				return [id, sortDirection === 'asc' ? 'desc' : 'asc'];
			}

			return [id, 'asc'];
		});
	}, []);

	return {
		sortBy: sort[0],
		sortDirection: sort[1],
		setSort,
	};
};
