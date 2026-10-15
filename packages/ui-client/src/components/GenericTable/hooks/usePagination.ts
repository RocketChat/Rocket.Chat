import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { QueryState } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { SetStateAction } from 'react';
import { useEffect, useMemo, useState } from 'react';

import { useCurrent } from './useCurrent';
import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

type QueryPagination = { offset: number; count: number };

type PageData = { count: number; total: number };

type UsePaginationOptions<TQuery> = {
	query: TQuery;
	getQueryKey: (query: TQuery & QueryPagination) => readonly unknown[];
};

type UsePaginationResult = {
	current: ReturnType<typeof useCurrent>[0];
	setCurrent: ReturnType<typeof useCurrent>[1];
	itemsPerPage: ReturnType<typeof useItemsPerPage>[0];
	setItemsPerPage: ReturnType<typeof useItemsPerPage>[1];
	itemsPerPageLabel: ReturnType<typeof useItemsPerPageLabel>;
	showingResultsLabel: () => string;
};

type UsePaginatedQueryResult<TQuery> = UsePaginationResult & {
	paginatedQuery: TQuery & QueryPagination;
	queryKey: readonly unknown[];
	count: number;
};

const getPageData = (queryState: QueryState<unknown> | undefined): PageData | undefined => {
	if (queryState?.status !== 'success' || !queryState.data || typeof queryState.data !== 'object') {
		return undefined;
	}

	const { count, total } = queryState.data as Partial<PageData>;

	if (typeof count !== 'number' || typeof total !== 'number') {
		return undefined;
	}

	return { count, total };
};

const getPageSize = (pageSize: number, offset: number, data: PageData | undefined): number => {
	if (!data || data.count <= 0 || data.count >= pageSize || offset + data.count >= data.total) {
		return pageSize;
	}

	return data.count;
};

/**
 * TODO: Move `usePagination` outside from `GenericTable` folder
 */
export function usePagination<TQuery>(options: UsePaginationOptions<TQuery>): UsePaginatedQueryResult<TQuery>;
export function usePagination(): Omit<UsePaginationResult, 'showingResultsLabel'> & {
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
};
export function usePagination<TQuery>(options?: UsePaginationOptions<TQuery>) {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const [current, setCurrent] = useCurrent();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();
	const queryClient = useQueryClient();
	const [learned, setLearned] = useState<{ itemsPerPage: number; pageSize: number; total: number }>({
		itemsPerPage,
		pageSize: itemsPerPage,
		total: 0,
	});

	// Reset to first page when itemsPerPage changes
	useEffect(() => {
		setCurrent(0);
	}, [itemsPerPage, setCurrent]);

	const learnedPageSize = learned.itemsPerPage === itemsPerPage ? learned.pageSize : itemsPerPage;
	const offset = Math.floor(current / itemsPerPage) * learnedPageSize;
	const paginatedQuery = options && { ...options.query, offset, count: learnedPageSize };
	const queryKey = options && paginatedQuery && options.getQueryKey(paginatedQuery);
	const data = queryKey && getPageData(queryClient.getQueryState(queryKey));
	const pageSize = getPageSize(learnedPageSize, offset, data);
	const total = data?.total ?? (learned.itemsPerPage === itemsPerPage ? learned.total : 0);

	const setCurrentPage = useStableCallback((action: SetStateAction<number>) => {
		const next = typeof action === 'function' ? action(current) : action;

		if (data) {
			setLearned({ itemsPerPage, pageSize, total });
		}

		setCurrent(next);
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
		...basePagination,
		setCurrent: setCurrentPage,
		paginatedQuery,
		queryKey,
		count: Math.ceil(total / pageSize) * itemsPerPage,
		showingResultsLabel: () => showingResultsLabel({ count: total, current: offset, itemsPerPage: data?.count ?? pageSize }),
	};
}
