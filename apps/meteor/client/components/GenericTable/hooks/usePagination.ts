import { useSearchParameter } from '@rocket.chat/ui-contexts';
import { useSetSearchParameters } from '@rocket.chat/ui-contexts/dist/hooks/useSetSearchParameters';
import { useCallback, useMemo } from 'react';

import { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

type ItemsPerPage = ReturnType<typeof useItemsPerPage>[0];
type Current = ReturnType<typeof useCurrent>[0];

export const usePagination = (): {
	current: Current;
	setCurrent: (current: Current) => void;
	itemsPerPage: ItemsPerPage;
	setItemsPerPage: (itemsPerPage: ItemsPerPage) => void;
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
} => {
	const perPage = (Number(useSearchParameter('per_page')) as ItemsPerPage) || undefined;
	const lastItem = (Number(useSearchParameter('current')) as Current) || undefined;
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage(perPage);
	const [current, setCurrent] = useCurrent(lastItem);
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();
	const setURLParams = useSetSearchParameters();

	const handleSetItemsPerPage = useCallback(
		(itemsPerPage: ItemsPerPage) => {
			setItemsPerPage(itemsPerPage);
			// Reset to first page when itemsPerPage changes
			setCurrent(0);
			setURLParams({ per_page: itemsPerPage, current: null });
		},
		[setCurrent, setItemsPerPage, setURLParams],
	);

	const handleSetCurrent = useCallback(
		(current: Current) => {
			setCurrent(current);
			setURLParams({ current });
		},
		[setCurrent, setURLParams],
	);

	return useMemo(
		() => ({
			itemsPerPage,
			setItemsPerPage: handleSetItemsPerPage,
			current,
			setCurrent: handleSetCurrent,
			itemsPerPageLabel,
			showingResultsLabel,
		}),
		[itemsPerPage, handleSetItemsPerPage, current, handleSetCurrent, itemsPerPageLabel, showingResultsLabel],
	);
};
