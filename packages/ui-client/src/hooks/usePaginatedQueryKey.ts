import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { QueryState } from '@tanstack/react-query';
import { useQueryClient } from '@tanstack/react-query';
import type { SetStateAction } from 'react';
import { useState } from 'react';

import { usePagination } from '../components/GenericTable/hooks/usePagination';
import type { PageInfo } from '../helpers/pagination';
import { getPageSize } from '../helpers/pagination';

type QueryPagination = { offset: number; count: number };

type UsePaginatedQueryKeyOptions<TQuery, TQueryKey extends readonly unknown[]> = {
	query: TQuery;
	getQueryKey: (query: TQuery & QueryPagination) => TQueryKey;
};

const isPageInfo = (data: unknown): data is PageInfo =>
	typeof data === 'object' &&
	data !== null &&
	'offset' in data &&
	typeof data.offset === 'number' &&
	'count' in data &&
	typeof data.count === 'number' &&
	'total' in data &&
	typeof data.total === 'number';

const getPageInfo = (queryState: QueryState | undefined): PageInfo | undefined =>
	queryState?.status === 'success' && isPageInfo(queryState.data) ? queryState.data : undefined;

export const usePaginatedQueryKey = <TQuery, TQueryKey extends readonly unknown[]>({
	query,
	getQueryKey,
}: UsePaginatedQueryKeyOptions<TQuery, TQueryKey>) => {
	const { current, itemsPerPage, setCurrent, setItemsPerPage, itemsPerPageLabel, showingResultsLabel } = usePagination();
	const [pageSize, setPageSize] = useState<number>(itemsPerPage);
	const [lastPage, setLastPage] = useState<PageInfo>();

	const paginatedQuery = { ...query, offset: Math.floor(current / itemsPerPage) * pageSize, count: pageSize };
	const queryKey = getQueryKey(paginatedQuery);

	const page = getPageInfo(useQueryClient().getQueryState(queryKey));

	if (page && page !== lastPage) {
		setLastPage(page);
	}

	const shownPage = page ?? lastPage;
	const shownPageSize = shownPage ? getPageSize(pageSize, shownPage) : pageSize;

	const onSetCurrent = useStableCallback((action: SetStateAction<number>) => {
		setPageSize(shownPageSize);
		setCurrent(action);
	});

	const onSetItemsPerPage = useStableCallback((action: SetStateAction<25 | 50 | 100>) => {
		const nextItemsPerPage = typeof action === 'function' ? action(itemsPerPage) : action;
		setPageSize(nextItemsPerPage);
		setItemsPerPage(nextItemsPerPage);
	});

	return {
		paginatedQuery,
		queryKey,
		paginationProps: {
			current,
			itemsPerPage,
			count: shownPage ? Math.ceil(shownPage.total / shownPageSize) * itemsPerPage : 0,
			itemsPerPageLabel,
			showingResultsLabel: () =>
				showingResultsLabel({
					count: shownPage?.total ?? 0,
					current: shownPage?.offset ?? 0,
					itemsPerPage: shownPage?.count ?? shownPageSize,
				}),
			onSetCurrent,
			onSetItemsPerPage,
		},
	};
};
