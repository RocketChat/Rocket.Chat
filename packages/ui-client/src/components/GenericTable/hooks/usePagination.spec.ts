import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useQuery } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePagination } from './usePagination';

it('should step by the count the server returns when it is lower than requested', async () => {
	const { result } = renderHook(
		() => {
			const pagination = usePagination({ query: {}, getQueryKey: (query) => ['items', query] });
			useQuery({ queryKey: pagination.queryKey, queryFn: async () => ({ count: 10, total: 50 }) });
			return pagination;
		},
		{ wrapper: mockAppRoot().build() },
	);

	await waitFor(() => expect(result.current.count / result.current.itemsPerPage).toBe(5));

	act(() => result.current.setCurrent(result.current.itemsPerPage));

	expect(result.current.paginatedQuery).toEqual({ offset: 10, count: 10 });
});
