import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { getCombineFn, usePaginatedQuery } from './usePaginatedQuery';

type Pagination = { offset: number; count: number };

const createGetSounds = ({ total, limit }: { total: number; limit: number }) =>
	jest.fn(async ({ offset, count }: Pagination) => {
		const sounds = Array.from({ length: Math.max(0, Math.min(count, limit, total - offset)) }, (_, index) => offset + index);
		return { sounds, count: sounds.length, offset, total };
	});

const range = (start: number, length: number) => Array.from({ length }, (_, index) => start + index);

it.each([
	{
		name: 'fills the first page under the server limit',
		offset: 0,
		total: 50,
		limit: 10,
		requests: [0, 10, 20],
		rows: range(0, 25),
	},
	{
		name: 'fills a later page under the server limit',
		offset: 25,
		total: 100,
		limit: 10,
		requests: [25, 35, 45],
		rows: range(25, 25),
	},
	{
		name: 'makes one request on a short last page',
		offset: 50,
		total: 53,
		limit: 10,
		requests: [50],
		rows: range(50, 3),
	},
	{
		name: 'makes one request when the server returns no rows',
		offset: 0,
		total: 50,
		limit: 0,
		requests: [0],
		rows: [],
	},
])('$name', async ({ offset, total, limit, requests, rows }) => {
	const getSounds = createGetSounds({ total, limit });

	const { result } = renderHook(
		() =>
			usePaginatedQuery({ query: {}, queryKey: ['sounds'], queryFn: getSounds, combineData: getCombineFn('sounds'), offset, count: 25 }),
		{ wrapper: mockAppRoot().build() },
	);

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	expect(getSounds.mock.calls.map(([pagination]) => pagination.offset)).toEqual(requests);
	expect(result.current.data?.sounds).toEqual(rows);
	expect(result.current.data?.total).toBe(total);
});

it('should report an error when one of the requests fails', async () => {
	const server = createGetSounds({ total: 50, limit: 10 });
	const getSounds = jest.fn(async (pagination: Pagination) => {
		if (pagination.offset === 10) {
			throw new Error('request failed');
		}
		return server(pagination);
	});

	const { result } = renderHook(
		() =>
			usePaginatedQuery({
				query: {},
				queryKey: ['sounds'],
				queryFn: getSounds,
				combineData: getCombineFn('sounds'),
				offset: 0,
				count: 25,
			}),
		{ wrapper: mockAppRoot().build() },
	);

	await waitFor(() => expect(result.current.isError).toBe(true));

	expect(result.current.error?.message).toBe('request failed');
});

it('should use the provided combineData reducer', async () => {
	const { result } = renderHook(
		() =>
			usePaginatedQuery({
				query: {},
				queryKey: ['sounds'],
				queryFn: createGetSounds({ total: 50, limit: 10 }),
				combineData: (_acc, current) => current,
				offset: 0,
				count: 25,
			}),
		{ wrapper: mockAppRoot().build() },
	);

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	expect(result.current.data?.sounds).toEqual(range(20, 5));
});
