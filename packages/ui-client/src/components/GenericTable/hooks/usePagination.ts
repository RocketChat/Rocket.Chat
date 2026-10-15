import type { Pagination } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { hashKey } from '@tanstack/react-query';
import type { ComponentProps, SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

export type QueryPagination = { offset: number; count: number };

export type UsePaginationOptions<TQuery> = {
	query: TQuery;
	getQueryKey: (query: TQuery & QueryPagination) => readonly unknown[];
};

type UsePaginationResult = {
	current: ReturnType<typeof useCurrent>[0];
	setCurrent: ReturnType<typeof useCurrent>[1];
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	setItemsPerPage: ReturnType<typeof useItemsPerPage>[1];
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
};

export type PaginationProps = Required<
	Pick<
		ComponentProps<typeof Pagination>,
		'count' | 'current' | 'itemsPerPage' | 'itemsPerPageLabel' | 'showingResultsLabel' | 'onSetCurrent' | 'onSetItemsPerPage'
	>
>;

type UsePagesResult = {
	page: number;
	setPage: (page: number) => void;
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	getPaginationProps: (total: number) => PaginationProps;
};

/**
 * TODO: Move `usePagination` outside from `GenericTable` folder
 */
export function usePagination<TQuery>(options: UsePaginationOptions<TQuery>): UsePagesResult;
export function usePagination(): UsePaginationResult;
export function usePagination<TQuery>(options?: UsePaginationOptions<TQuery>): UsePagesResult | UsePaginationResult {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const [current, setCurrent] = useCurrent();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();
	const queryHash = options ? hashKey(options.getQueryKey({ ...options.query, offset: 0, count: 0 })) : '';
	const [pageState, setPageState] = useState({ page: 1, queryHash, itemsPerPage });

	// Reset to first page when itemsPerPage changes
	useEffect(() => {
		setCurrent(0);
	}, [itemsPerPage, setCurrent]);

	const page = pageState.queryHash === queryHash && pageState.itemsPerPage === itemsPerPage ? pageState.page : 1;

	const setPage = useStableCallback((nextPage: number) => {
		setPageState({ page: nextPage, queryHash, itemsPerPage });
	});

	const onSetCurrent = useStableCallback((action: SetStateAction<number>) => {
		const nextCurrent = typeof action === 'function' ? action((page - 1) * itemsPerPage) : action;
		setPage(Math.floor(nextCurrent / itemsPerPage) + 1);
	});

	const basePagination = useMemo(
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

	if (!options) {
		return basePagination;
	}

	return {
		page,
		setPage,
		itemsPerPage,
		getPaginationProps: (total) => ({
			// TODO: Rename count to total in Fuselage Pagination component
			count: total,
			current: (page - 1) * itemsPerPage,
			itemsPerPage,
			itemsPerPageLabel,
			showingResultsLabel,
			onSetCurrent,
			onSetItemsPerPage: setItemsPerPage,
		}),
	};
}
