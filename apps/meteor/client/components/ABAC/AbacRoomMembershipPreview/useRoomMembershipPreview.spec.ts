import type { AbacRoomPreviewMember, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useRoomMembershipPreview } from './useRoomMembershipPreview';

const attributes = { dept: ['eng'] };

const membersFrom = (start: number, length: number): AbacRoomPreviewMember[] =>
	Array.from({ length }, (_, index) => ({ _id: `u${start + index}`, username: `user${start + index}`, verdict: 'nonCompliant' }));

const pagesOf = (size: number, { pages = Infinity, total = 1000, failing = 0 } = {}) => {
	let served = 0;
	return jest.fn(async (_body: unknown): Promise<IAbacRoomMembershipPreview> => {
		served += 1;
		if (served === failing) {
			throw new Error('error-too-many-requests');
		}
		const members = membersFrom(served * 100, size);
		return {
			members,
			count: members.length,
			checked: 20,
			...(served === 1 && { total }),
			...(served < pages && { next: { _id: `c${served}`, username: `c${served}` } }),
		};
	});
};

const renderPreview = (endpoint: ReturnType<typeof pagesOf>, filter = '') =>
	renderHook(() => useRoomMembershipPreview('rid', attributes, filter, 'loses'), {
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/abac/rooms.evaluateMembership', endpoint).build(),
	});

describe('useRoomMembershipPreview', () => {
	it('should stop after one request when the first page fills the list', async () => {
		const endpoint = pagesOf(25);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isPartial).toBe(true));

		expect(endpoint).toHaveBeenCalledTimes(1);
		expect(result.current.isChecking).toBe(false);
	});

	it('should keep fetching short pages up to a few, then wait for Load more', async () => {
		const endpoint = pagesOf(2);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isPartial).toBe(true));

		expect(endpoint).toHaveBeenCalledTimes(3);
		expect(result.current.members).toHaveLength(6);
		expect(result.current.isChecking).toBe(false);

		act(() => result.current.loadMore());

		await waitFor(() => expect(result.current.members).toHaveLength(8));
		expect(endpoint).toHaveBeenCalledTimes(4);
	});

	it('should load the next page when a scrollable list reaches its end, but not a short one', async () => {
		const endpoint = pagesOf(25);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isPartial).toBe(true));
		act(() => result.current.onEndReached());
		await waitFor(() => expect(result.current.members).toHaveLength(50));

		const short = pagesOf(2);
		const { result: shortResult } = renderPreview(short);
		await waitFor(() => expect(shortResult.current.isPartial).toBe(true));
		act(() => shortResult.current.onEndReached());

		expect(short).toHaveBeenCalledTimes(3);
	});

	it('should sum checked across pages and take total from the first page', async () => {
		const endpoint = pagesOf(2, { pages: 3, total: 60 });
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(result.current.checked).toBe(60);
		expect(result.current.total).toBe(60);
		expect(result.current.isPartial).toBe(false);
	});

	it('should retry only the page that failed', async () => {
		const endpoint = pagesOf(25, { failing: 2 });
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.members).toHaveLength(25));
		act(() => result.current.loadMore());
		await waitFor(() => expect(result.current.isError).toBe(true));
		act(() => result.current.retry());
		await waitFor(() => expect(result.current.members).toHaveLength(50));

		expect(endpoint).toHaveBeenCalledTimes(3);
		expect(endpoint).toHaveBeenNthCalledWith(3, expect.objectContaining({ after: { _id: 'c1', username: 'c1' } }));
		expect(result.current.isError).toBe(false);
	});

	it('should report an exhausted empty list once the server has no next page', async () => {
		const endpoint = pagesOf(0, { pages: 1 });
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(result.current.members).toHaveLength(0);
		expect(result.current.isPartial).toBe(false);
	});

	it('should send the group, the search text and the cursor of the last page, and leave the page size to the server', async () => {
		const endpoint = pagesOf(5, { pages: 2 });
		const { result } = renderPreview(endpoint, 'ali');

		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(endpoint).toHaveBeenNthCalledWith(1, expect.objectContaining({ rid: 'rid', attributes, group: 'loses', filter: 'ali' }));
		expect(endpoint.mock.calls[0][0]).not.toHaveProperty('after');
		expect(endpoint.mock.calls[0][0]).not.toHaveProperty('count');
		expect(endpoint).toHaveBeenNthCalledWith(2, expect.objectContaining({ after: { _id: 'c1', username: 'c1' } }));
	});
});
