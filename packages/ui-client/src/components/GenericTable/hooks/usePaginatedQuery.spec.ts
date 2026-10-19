import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { usePaginatedQuery } from './usePaginatedQuery';

const total = 50;
const limit = 10;

const getSounds = jest.fn(async ({ offset, count }: { offset: number; count: number }) => {
	const sounds = Array.from({ length: Math.min(count, limit, total - offset) }, (_, index) => offset + index);
	return { sounds, count: sounds.length, offset, total };
});

it('should fill the page with several requests when the server returns fewer items than requested', async () => {
	const { result } = renderHook(
		() => usePaginatedQuery({ query: {}, queryKey: ['sounds'], queryFn: getSounds, itemsKey: 'sounds', offset: 0, count: 25 }),
		{ wrapper: mockAppRoot().build() },
	);

	await waitFor(() => expect(result.current.data?.sounds).toHaveLength(25));

	expect(getSounds.mock.calls.map(([{ offset }]) => offset)).toEqual([0, 10, 20]);
	expect(result.current.data?.sounds).toEqual(Array.from({ length: 25 }, (_, index) => index));
	expect(result.current.data?.total).toBe(total);
});
