import { mockAppRoot } from '@rocket.chat/mock-providers';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

import { usePaginatedQueryKey } from './usePaginatedQueryKey';

const renderPaginatedQueryKey = () => {
	const queryClient = new QueryClient();
	queryClient.setQueryData(['items', { offset: 0, count: 25 }], { offset: 0, count: 10, total: 50 });

	return renderHook(() => usePaginatedQueryKey({ query: {}, getQueryKey: (query) => ['items', query] as const }), {
		wrapper: mockAppRoot()
			.withQueryClient(queryClient)
			.withTranslations('en', 'core', { Showing_results_of: '{{from}} to {{to}} of {{total}}' })
			.build(),
	});
};

it('should step by the page size the server returns', () => {
	const { result } = renderPaginatedQueryKey();

	expect(result.current.paginationProps.count / 25).toBe(5);

	act(() => result.current.paginationProps.onSetCurrent(25));

	expect(result.current.paginatedQuery).toEqual({ offset: 10, count: 10 });
});

it('should label the range the server returned', () => {
	const { result } = renderPaginatedQueryKey();

	expect(result.current.paginationProps.showingResultsLabel()).toBe('1 to 10 of 50');
});
