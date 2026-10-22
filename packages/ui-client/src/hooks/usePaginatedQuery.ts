import type { UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

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

type PaginatedData = { count: number; total: number };

type Combine<TData, TCombined> = (results: UseQueryResult<TData>[]) => TCombined;

type PaginatedQueryOptions<TData> = NoInfer<Omit<UseQueryOptions<TData & PaginatedData>, 'queryKey' | 'queryFn' | 'select'>> & {
	queryKey: readonly unknown[];
	queryFn: (pagination: QueryPagination) => Promise<TData & PaginatedData>;
};

type UsePaginatedQueryOptions<TData, TKey, TCombined> = QueryPagination & {
	query: PaginatedQueryOptions<TData>;
	itemsKey?: TKey & keyof TData;
	combine?: Combine<TData, TCombined>;
};

const mergeItems =
	<TData extends PaginatedData>(itemsKey: keyof TData) =>
	(acc: TData, current: TData): TData => {
		const items = [...(acc[itemsKey] as unknown[]), ...(current[itemsKey] as unknown[])];
		return Object.assign({}, acc, { [itemsKey]: items, count: items.length });
	};

const createCombine =
	<TData extends PaginatedData>(itemsKey: keyof TData): Combine<TData, PaginatedQueryResult<TData>> =>
	(results) => {
		const pages = results.flatMap((result) => (result.data ? [result.data] : []));
		const data = pages.length === results.length ? pages.reduce(mergeItems(itemsKey)) : undefined;
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

export const usePaginatedQuery = <
	TData,
	TKey extends PropertyKey = never,
	TCombined = [TKey] extends [never] ? UseQueryResult<TData>[] : PaginatedQueryResult<TData>,
>({
\	query: { queryKey, queryFn, ...queryOptions },
	itemsKey,
	combine,
	offset: start,
	count: itemsPerPage,
}: UsePaginatedQueryOptions<TData, TKey, TCombined>): TCombined => {
	const queryClient = useQueryClient();

	const firstData = queryClient.getQueryData<TData & PaginatedData>([...queryKey, { offset: start, count: itemsPerPage }]);
	const offsets = getOffsets(start, itemsPerPage, firstData?.count, firstData?.total ?? 0);

	const combineFn = useMemo<Combine<TData & PaginatedData, unknown> | undefined>(() => {
		if (combine) {
			return combine;
		}

		if (itemsKey !== undefined) {
			return createCombine<TData & PaginatedData>(itemsKey);
		}

		return undefined;
	}, [combine, itemsKey]);

	return useQueries({
		queries: offsets.map((offset) => {
		const pagination = { offset, count: firstData?.count ?? itemsPerPage };

			return {
				...queryOptions,
				queryKey: [...queryKey, pagination],
				queryFn: () => queryFn(pagination),
			};
		}),
		combine: combineFn,
	}) as TCombined;
};
