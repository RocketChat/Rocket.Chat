import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';

import type { PaginationProps, QueryPagination, UsePaginationOptions } from './usePagination';
import { usePagination } from './usePagination';

type UsePaginatedQueryOptions<TQuery, TData extends { total: number }> = UsePaginationOptions<TQuery> &
	Omit<UseQueryOptions<TData>, 'queryKey' | 'queryFn' | 'select'> & {
		queryFn: (query: TQuery & QueryPagination) => Promise<TData>;
		itemsKey: keyof TData;
	};

type UsePaginatedQueryResult<TQuery, TData> = UseQueryResult<TData> & {
	page: number;
	setPage: (page: number) => void;
	paginatedQuery: TQuery & QueryPagination;
	paginationProps: PaginationProps;
};

const getItems = <TData>(data: TData, itemsKey: keyof TData) => data[itemsKey] as unknown[];

const getLimit = (limit: number | undefined, length: number, offset: number, count: number, total: number) => {
	if (length >= count) {
		return undefined;
	}

	if (length > 0 && offset + length < total) {
		return length;
	}

	return limit;
};

export const usePaginatedQuery = <TQuery, TData extends { total: number }>({
	query,
	getQueryKey,
	queryFn,
	itemsKey,
	...queryOptions
}: UsePaginatedQueryOptions<TQuery, TData>): UsePaginatedQueryResult<TQuery, TData> => {
	const { page, setPage, itemsPerPage, getPaginationProps } = usePagination({ query, getQueryKey });
	const queryClient = useQueryClient();
	const [limit, setLimit] = useState<number>();

	const start = (page - 1) * itemsPerPage;
	const paginatedQuery = { ...query, offset: start, count: itemsPerPage };
	const firstData = queryClient.getQueryData<TData>(getQueryKey(paginatedQuery));
	const nextLimit = firstData ? getLimit(limit, getItems(firstData, itemsKey).length, start, itemsPerPage, firstData.total) : limit;

	if (nextLimit !== limit) {
		setLimit(nextLimit);
	}

	const step = nextLimit ?? itemsPerPage;
	const end = Math.min(start + itemsPerPage, firstData?.total ?? Infinity);

	const offsets = [start];
	for (let offset = start + step; offset < end; offset += step) {
		offsets.push(offset);
	}

	const combine = useCallback(
		(results: UseQueryResult<TData>[]) => {
			const [first] = results;
			const isError = results.some((result) => result.isError);
			const isSuccess = results.every((result) => result.isSuccess);
			const pages = results.flatMap((result) => (result.data ? [result.data] : []));
			const items = pages.flatMap((page) => getItems(page, itemsKey));
			const data = pages.length === results.length ? Object.assign({}, first.data, { [itemsKey]: items, count: items.length }) : undefined;

			return {
				...first,
				data,
				error: results.find((result) => result.error)?.error ?? null,
				status: (isError && 'error') || (isSuccess && 'success') || 'pending',
				isError,
				isSuccess,
				isPending: !isError && !isSuccess,
				isLoading: results.some((result) => result.isLoading),
				isFetching: results.some((result) => result.isFetching),
				isPlaceholderData: results.some((result) => result.isPlaceholderData),
				refetch: async () => {
					const [firstResult] = await Promise.all(results.map((result) => result.refetch()));
					return firstResult;
				},
			} as UseQueryResult<TData>;
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
		paginationProps: getPaginationProps(result.data?.total ?? firstData?.total ?? 0),
	};
};
