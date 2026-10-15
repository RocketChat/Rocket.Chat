import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePagination } from './usePagination';

const renderPagination = (initialQuery: { text: string }) =>
	renderHook(
		({ query }) => {
			const pagination = usePagination({ query, getQueryKey: (query) => ['items', query] });
			useQuery({ queryKey: pagination.queryKey, queryFn: async () => ({ count: 10, total: 50 }) });
			return pagination;
		},
		{ wrapper: mockAppRoot().build(), initialProps: { query: initialQuery } },
	);

it('should step by the count the server returns when it is lower than requested', async () => {
	const { result } = renderPagination({ text: '' });

	await waitFor(() => expect(result.current.pageCount).toBe(5));

	act(() => result.current.setPage(2));

	expect(result.current.paginatedQuery).toEqual({ text: '', offset: 10, count: 10 });
});

it('should go back to the first page when the query changes', async () => {
	const { result, rerender } = renderPagination({ text: '' });

	await waitFor(() => expect(result.current.pageCount).toBe(5));

	act(() => result.current.setPage(3));
	rerender({ query: { text: 'filter' } });

	expect(result.current.page).toBe(1);
	expect(result.current.paginatedQuery.offset).toBe(0);
});
