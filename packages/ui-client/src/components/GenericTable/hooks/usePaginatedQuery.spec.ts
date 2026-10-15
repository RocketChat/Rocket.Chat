import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePaginatedQuery } from './usePaginatedQuery';

const total = 50;
const limit = 10;

const getSounds = jest.fn(async ({ offset, count }: { offset: number; count: number }) => {
	const sounds = Array.from({ length: Math.min(count, limit, total - offset) }, (_, index) => offset + index);
	return { sounds, count: sounds.length, offset, total };
});

const renderPaginatedQuery = (initialQuery: { text: string }) =>
	renderHook(
		({ query }) => usePaginatedQuery({ query, getQueryKey: (query) => ['sounds', query], queryFn: getSounds, itemsKey: 'sounds' }),
		{
			wrapper: mockAppRoot().build(),
			initialProps: { query: initialQuery },
		},
	);

beforeEach(() => {
	getSounds.mockClear();
});

it('should fill the page with several requests when the server returns fewer items than requested', async () => {
	const { result } = renderPaginatedQuery({ text: '' });

	await waitFor(() => expect(result.current.data?.sounds).toHaveLength(25));

	expect(getSounds.mock.calls.map(([{ offset }]) => offset)).toEqual([0, 10, 20]);
	expect(result.current.data?.sounds).toEqual(Array.from({ length: 25 }, (_, index) => index));
	expect(result.current.paginationProps.count).toBe(total);
});

it('should go back to the first page when the query changes', async () => {
	const { result, rerender } = renderPaginatedQuery({ text: '' });

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	act(() => result.current.setPage(2));
	rerender({ query: { text: 'filter' } });

	expect(result.current.page).toBe(1);
	expect(result.current.paginatedQuery.offset).toBe(0);
});
