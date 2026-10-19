import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

type QueryPagination = { offset: number; count: number };

type PaginatedQueryStatus<TData> =
	| { status: 'pending'; data: TData | undefined; error: null; isPending: true; isSuccess: false; isError: false }
	| { status: 'error'; data: TData | undefined; error: Error; isPending: false; isSuccess: false; isError: true }
	| { status: 'success'; data: TData; error: null; isPending: false; isSuccess: true; isError: false };

export type PaginatedQueryResult<TData> = PaginatedQueryStatus<TData> & {
	isLoading: boolean;
	isFetching: boolean;
	isFetched: boolean;
	refetch: () => Promise<void>;
};

type UsePaginatedQueryOptions<TQuery, TData extends { count: number; total: number }> = Omit<
	UseQueryOptions<TData>,
	'queryKey' | 'queryFn' | 'select'
> &
	QueryPagination & {
		query: TQuery;
		queryKey: readonly unknown[];
		queryFn: (query: TQuery & QueryPagination) => Promise<TData>;
		combineData: (acc: TData, current: TData) => TData;
	};

const combineFns = new Map<PropertyKey, unknown>();

const createCombineFn =
	<TKey extends PropertyKey>(itemsKey: TKey) =>
	<TData extends { [key in TKey]: unknown[] }>(acc: TData, current: TData): TData => {
		const items = [...acc[itemsKey], ...current[itemsKey]];
		return Object.assign({}, acc, { [itemsKey]: items, count: items.length });
	};

export const getCombineFn = <TKey extends PropertyKey>(itemsKey: TKey): ReturnType<typeof createCombineFn<TKey>> => {
	if (!combineFns.has(itemsKey)) {
		combineFns.set(itemsKey, createCombineFn(itemsKey));
	}

	return combineFns.get(itemsKey) as ReturnType<typeof createCombineFn<TKey>>;
};

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

export const usePaginatedQuery = <TQuery, TData extends { count: number; total: number }>({
	query,
	queryKey,
	queryFn,
	combineData,
	offset: start,
	count: itemsPerPage,
	...queryOptions
}: UsePaginatedQueryOptions<TQuery, TData>): PaginatedQueryResult<TData> => {
	const queryClient = useQueryClient();

	const firstData = queryClient.getQueryData<TData>([...queryKey, { offset: start, count: itemsPerPage }]);
	const offsets = getOffsets(start, itemsPerPage, firstData?.count, firstData?.total ?? 0);

	const combine = useCallback(
		(results: UseQueryResult<TData>[]): PaginatedQueryResult<TData> => {
			const pages = results.flatMap((result) => (result.data ? [result.data] : []));
			const data = pages.length === results.length ? pages.reduce(combineData) : undefined;
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
		[combineData],
	);

	return useQueries({
		queries: offsets.map((offset) => {
			const pagination = { offset, count: start + itemsPerPage - offset };

			return {
				...queryOptions,
				queryKey: [...queryKey, pagination],
				queryFn: () => queryFn({ ...query, ...pagination }),
			};
		}),
		combine,
	});
};
