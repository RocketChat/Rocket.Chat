import { useCallback, useMemo, useState } from 'react';

import { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

type UsePaginationOptions = {
	resetOn?: readonly unknown[];
};

const haveValuesChanged = (previous: readonly unknown[], next: readonly unknown[]) =>
	previous.length !== next.length || next.some((value, index) => !Object.is(value, previous[index]));

/**
 * TODO: Move `usePagination` outside from `GenericTable` folder
 */
export const usePagination = ({ resetOn = [] }: UsePaginationOptions = {}): {
	current: ReturnType<typeof useCurrent>[0];
	setCurrent: ReturnType<typeof useCurrent>[1];
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	setItemsPerPage: ReturnType<typeof useItemsPerPage>[1];
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
} => {
	const [itemsPerPage, setItemsPerPageState] = useItemsPerPage();
	const [current, setCurrent] = useCurrent();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();

	const [previousResetOn, setPreviousResetOn] = useState(resetOn);

	if (haveValuesChanged(previousResetOn, resetOn)) {
		setPreviousResetOn(resetOn);
		setCurrent(0);
	}

	const setItemsPerPage = useCallback<ReturnType<typeof useItemsPerPage>[1]>(
		(value) => {
			setItemsPerPageState(value);
			setCurrent(0);
		},
		[setItemsPerPageState, setCurrent],
	);

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
