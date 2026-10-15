import type { Pagination } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { QueryState } from '@tanstack/react-query';
import { hashKey, useQueryClient } from '@tanstack/react-query';
import type { ComponentProps, SetStateAction } from 'react';
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
	showingResultsLabel: ReturnType<typeof useShowingResultsLabel>;
};

type UsePaginatedQueryResult<TQuery> = {
	page: number;
	setPage: (page: number) => void;
	pageCount: number;
	paginatedQuery: TQuery & QueryPagination;
	queryKey: readonly unknown[];
	paginationProps: Required<
		Pick<
			ComponentProps<typeof Pagination>,
			'count' | 'current' | 'itemsPerPage' | 'itemsPerPageLabel' | 'showingResultsLabel' | 'onSetCurrent' | 'onSetItemsPerPage'
		>
	>;
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
export function usePagination(): UsePaginationResult;
export function usePagination<TQuery>(options?: UsePaginationOptions<TQuery>): UsePaginatedQueryResult<TQuery> | UsePaginationResult {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const [current, setCurrent] = useCurrent();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();
	const queryClient = useQueryClient();
	const queryHash = options ? hashKey(options.getQueryKey({ ...options.query, offset: 0, count: 0 })) : '';
	const [pageState, setPageState] = useState({ page: 1, queryHash, itemsPerPage });
	const [learned, setLearned] = useState<{ itemsPerPage: number; pageSize: number; total: number }>({
		itemsPerPage,
		pageSize: itemsPerPage,
		total: 0,
	});

	// Reset to first page when itemsPerPage changes
	useEffect(() => {
		setCurrent(0);
	}, [itemsPerPage, setCurrent]);

	const page = pageState.queryHash === queryHash && pageState.itemsPerPage === itemsPerPage ? pageState.page : 1;
	const learnedPageSize = learned.itemsPerPage === itemsPerPage ? learned.pageSize : itemsPerPage;
	const offset = (page - 1) * learnedPageSize;
	const paginatedQuery = options && { ...options.query, offset, count: learnedPageSize };
	const queryKey = options && paginatedQuery && options.getQueryKey(paginatedQuery);
	const data = queryKey && getPageData(queryClient.getQueryState(queryKey));
	const pageSize = getPageSize(learnedPageSize, offset, data);
	const total = data?.total ?? (learned.itemsPerPage === itemsPerPage ? learned.total : 0);
	const pageCount = Math.ceil(total / pageSize);

	const setPage = useStableCallback((nextPage: number) => {
		if (data) {
			setLearned({ itemsPerPage, pageSize, total });
		}

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

	if (!paginatedQuery || !queryKey) {
		return basePagination;
	}

	return {
		page,
		setPage,
		pageCount,
		paginatedQuery,
		queryKey,
		paginationProps: {
			// TODO: Rename count to total in Fuselage Pagination component
			count: total,
			current: (page - 1) * itemsPerPage,
			itemsPerPage,
			itemsPerPageLabel,
			showingResultsLabel: () => showingResultsLabel({ count: total, current: offset, itemsPerPage: data?.count ?? pageSize }),
			onSetCurrent,
			onSetItemsPerPage: setItemsPerPage,
		},
	};
}
