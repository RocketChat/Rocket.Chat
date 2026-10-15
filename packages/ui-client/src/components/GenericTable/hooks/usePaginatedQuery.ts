import type { Pagination } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { hashKey, useQueries, useQueryClient } from '@tanstack/react-query';
import type { ComponentProps, SetStateAction } from 'react';
import { useCallback, useState } from 'react';

import { useItemsPerPage } from './useItemsPerPage';
import { useItemsPerPageLabel } from './useItemsPerPageLabel';
import { useShowingResultsLabel } from './useShowingResultsLabel';

type QueryPagination = { offset: number; count: number };

export type PaginationProps = Required<
	Pick<
		ComponentProps<typeof Pagination>,
		'count' | 'current' | 'itemsPerPage' | 'itemsPerPageLabel' | 'showingResultsLabel' | 'onSetCurrent' | 'onSetItemsPerPage'
	>
>;

type PaginatedQueryStatus<TData> =
	| { status: 'pending'; data: TData | undefined; error: null; isPending: true; isSuccess: false; isError: false }
	| { status: 'error'; data: TData | undefined; error: Error; isPending: false; isSuccess: false; isError: true }
	| { status: 'success'; data: TData; error: null; isPending: false; isSuccess: true; isError: false };

type PaginatedQueryState<TData> = PaginatedQueryStatus<TData> & {
	isLoading: boolean;
	isFetching: boolean;
	isFetched: boolean;
	refetch: () => Promise<void>;
};

export type UsePaginatedQueryResult<TData, TQuery = unknown> = PaginatedQueryState<TData> & {
	page: number;
	setPage: (page: number) => void;
	paginatedQuery: TQuery & QueryPagination;
	paginationProps: PaginationProps;
};

type UsePaginatedQueryOptions<TQuery, TData extends { total: number }> = Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn' | 'select'> & {
	query: TQuery;
	getQueryKey: (query: TQuery & QueryPagination) => readonly unknown[];
	queryFn: (query: TQuery & QueryPagination) => Promise<TData>;
	itemsKey: keyof TData;
};

const getItems = <TData>(data: TData, itemsKey: keyof TData) => data[itemsKey] as unknown[];

const getOffsets = (start: number, itemsPerPage: number, returned: number | undefined, total: number) => {
	const offsets = [start];

	if (!returned || returned >= itemsPerPage) {
		return offsets;
	}

	for (let offset = start + returned; offset < Math.min(start + itemsPerPage, total); offset += returned) {
		offsets.push(offset);
	}

	return offsets;
};

export const usePaginatedQuery = <TQuery, TData extends { total: number }>({
	query,
	getQueryKey,
	queryFn,
	itemsKey,
	...queryOptions
}: UsePaginatedQueryOptions<TQuery, TData>): UsePaginatedQueryResult<TData, TQuery> => {
	const [itemsPerPage, setItemsPerPage] = useItemsPerPage();
	const itemsPerPageLabel = useItemsPerPageLabel();
	const showingResultsLabel = useShowingResultsLabel();
	const queryClient = useQueryClient();

	const firstPageKey = hashKey(getQueryKey({ ...query, offset: 0, count: itemsPerPage }));
	const [pageState, setPageState] = useState({ page: 1, firstPageKey });
	const page = pageState.firstPageKey === firstPageKey ? pageState.page : 1;

	const setPage = useStableCallback((nextPage: number) => setPageState({ page: nextPage, firstPageKey }));

	const onSetCurrent = useStableCallback((action: SetStateAction<number>) => {
		const current = typeof action === 'function' ? action((page - 1) * itemsPerPage) : action;
		setPage(Math.floor(current / itemsPerPage) + 1);
	});

	const start = (page - 1) * itemsPerPage;
	const paginatedQuery = { ...query, offset: start, count: itemsPerPage };
	const firstData = queryClient.getQueryData<TData>(getQueryKey(paginatedQuery));
	const offsets = getOffsets(start, itemsPerPage, firstData && getItems(firstData, itemsKey).length, firstData?.total ?? 0);

	const combine = useCallback(
		(results: UseQueryResult<TData>[]): PaginatedQueryState<TData> => {
			const pages = results.flatMap((result) => (result.data ? [result.data] : []));
			const items = pages.flatMap((data) => getItems(data, itemsKey));
			const data = pages.length === results.length ? Object.assign({}, pages[0], { [itemsKey]: items, count: items.length }) : undefined;
			const error = results.find((result) => result.error)?.error;

			const state = {
				isLoading: results.some((result) => result.isLoading),
				isFetching: results.some((result) => result.isFetching),
				isFetched: results.every((result) => result.isFetched),
				refetch: async () => {
					await Promise.all(results.map((result) => result.refetch()));
				},
			};

			if (error) {
				return { ...state, status: 'error', data, error, isPending: false, isSuccess: false, isError: true };
			}

			if (data && results.every((result) => result.isSuccess)) {
				return { ...state, status: 'success', data, error: null, isPending: false, isSuccess: true, isError: false };
			}

			return { ...state, status: 'pending', data, error: null, isPending: true, isSuccess: false, isError: false };
		},
		[itemsKey],
	);

	const result = useQueries({
		queries: offsets.map((offset) => {
			const chunkQuery = { ...query, offset, count: start + itemsPerPage - offset };

			return {
				...queryOptions,
				queryKey: getQueryKey(chunkQuery),
				queryFn: () => queryFn(chunkQuery),
			};
		}),
		combine,
	});

	return {
		...result,
		page,
		setPage,
		paginatedQuery,
		paginationProps: {
			// TODO: Rename count to total in Fuselage Pagination component
			count: result.data?.total ?? firstData?.total ?? 0,
			current: start,
			itemsPerPage,
			itemsPerPageLabel,
			showingResultsLabel,
			onSetCurrent,
			onSetItemsPerPage: setItemsPerPage,
		},
	};
};
