import { useEffect, useMemo } from 'react';

import { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

export const createMockedPagination = (results = 0, total = 0) => ({
	current: 0,
	setCurrent: () => undefined,
	itemsPerPage: 25 as const,
	setItemsPerPage: () => undefined,
	itemsPerPageLabel: () => 'Items per page:',
	showingResultsLabel: () => `Showing results 1 - ${results} of ${total}`,
});

/**
 * TODO: Move `usePagination` outside from `GenericTable` folder
 */
export const usePagination = (): {
	current: ReturnType<typeof useCurrent>[0];
	setCurrent: ReturnType<typeof useCurrent>[1];
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	setItemsPerPage: ReturnType<typeof useItemsPerPage>[1];
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
} => {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const [current, setCurrent] = useCurrent();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();

	// Reset to first page when itemsPerPage changes
	useEffect(() => {
		setCurrent(0);
	}, [itemsPerPage, setCurrent]);

	return useMemo(
		() => ({
			itemsPerPage,
			setItemsPerPage,
			current,
			setCurrent,
			itemsPerPageLabel,
			showingResultsLabel,
		}),
		[itemsPerPage, setItemsPerPage, current, setCurrent, itemsPerPageLabel, showingResultsLabel],
	);
};
