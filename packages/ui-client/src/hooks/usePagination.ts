import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { hashKey } from '@tanstack/react-query';
import type { SetStateAction } from 'react';
import { useMemo, useState } from 'react';

import type { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

type UsePaginationOptions = {
	resetKey?: readonly unknown[];
};

export const usePagination = ({ resetKey = [] }: UsePaginationOptions = {}): {
	current: ReturnType<typeof useCurrent>[0];
	setCurrent: ReturnType<typeof useCurrent>[1];
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	setItemsPerPage: ReturnType<typeof useItemsPerPage>[1];
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
} => {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();

	const resetHash = hashKey([resetKey, itemsPerPage]);
	const [state, setState] = useState({ current: 0, resetHash });

	if (state.resetHash !== resetHash) {
		setState({ current: 0, resetHash });
	}

	const current = state.resetHash === resetHash ? state.current : 0;

	const setCurrent = useStableCallback((action: SetStateAction<number>) => {
		setState({ current: typeof action === 'function' ? action(current) : action, resetHash });
	});

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
