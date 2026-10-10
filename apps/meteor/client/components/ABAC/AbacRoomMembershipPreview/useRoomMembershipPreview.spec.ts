import type { AbacRoomPreviewMember, IAbacRoomMembershipPreview } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { PREVIEW_AUTO_FETCH_PAGES, PREVIEW_MIN_SHOWN, useRoomMembershipPreview } from './useRoomMembershipPreview';

const attributes = { dept: ['eng'] };

const membersFrom = (start: number, length: number): AbacRoomPreviewMember[] =>
	Array.from({ length }, (_, index) => ({ _id: `u${start + index}`, username: `user${start + index}`, verdict: 'nonCompliant' }));

const pagesOf = (size: number, { pages = Infinity, total = 1000 } = {}) => {
	let served = 0;
	return jest.fn(async (_body: unknown): Promise<IAbacRoomMembershipPreview> => {
		served += 1;
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
		wrapper: mockAppRoot().withEndpoint('POST', '/v1/abac/membership-preview', endpoint).build(),
	});

describe('useRoomMembershipPreview', () => {
	it('should stop after one request when the first page fills the list', async () => {
		const endpoint = pagesOf(PREVIEW_MIN_SHOWN);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.members).toHaveLength(PREVIEW_MIN_SHOWN));

		expect(endpoint).toHaveBeenCalledTimes(1);
		expect(result.current.isPartial).toBe(false);
		expect(result.current.isExhausted).toBe(false);
	});

	it('should keep fetching short pages, then stop at the cap and mark the list partial', async () => {
		const endpoint = pagesOf(2);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isPartial).toBe(true));

		expect(endpoint).toHaveBeenCalledTimes(1 + PREVIEW_AUTO_FETCH_PAGES);
		expect(result.current.members).toHaveLength(2 * (1 + PREVIEW_AUTO_FETCH_PAGES));
		expect(result.current.isChecking).toBe(false);
	});

	it('should sum checked across pages and take total from the first page', async () => {
		const endpoint = pagesOf(2, { pages: 3, total: 60 });
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(result.current.checked).toBe(60);
		expect(result.current.total).toBe(60);
		expect(result.current.isPartial).toBe(false);
	});

	it('should keep checking past the cap after Load more, until the target is met', async () => {
		const endpoint = pagesOf(2);
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isPartial).toBe(true));
		act(() => result.current.loadMore());
		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(1 + PREVIEW_AUTO_FETCH_PAGES + Math.ceil(PREVIEW_MIN_SHOWN / 2)));
		await waitFor(() => expect(result.current.isChecking).toBe(false));

		expect(endpoint).toHaveBeenCalledTimes(1 + PREVIEW_AUTO_FETCH_PAGES + Math.ceil(PREVIEW_MIN_SHOWN / 2));
		expect(result.current.isPartial).toBe(false);
	});

	it('should keep the cap when the end of the list asks for more', async () => {
		let served = 0;
		const endpoint = jest.fn(async (_body: unknown): Promise<IAbacRoomMembershipPreview> => {
			served += 1;
			const members = served === 1 ? membersFrom(0, PREVIEW_MIN_SHOWN) : [];
			return {
				members,
				count: members.length,
				checked: 20,
				...(served === 1 && { total: 1000 }),
				next: { _id: `c${served}`, username: `c${served}` },
			};
		});
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.members).toHaveLength(PREVIEW_MIN_SHOWN));
		act(() => result.current.onEndReached());
		await waitFor(() => expect(result.current.isPartial).toBe(true));

		expect(endpoint).toHaveBeenCalledTimes(1 + PREVIEW_AUTO_FETCH_PAGES);
	});

	it('should end the loop when stopped and mark the list partial', async () => {
		let releaseSecondPage: () => void = () => undefined;
		let served = 0;
		const endpoint = jest.fn(async (_body: unknown): Promise<IAbacRoomMembershipPreview> => {
			served += 1;
			const pageNumber = served;
			if (pageNumber === 2) {
				await new Promise<void>((resolve) => {
					releaseSecondPage = () => resolve();
				});
			}
			return {
				members: [],
				count: 0,
				checked: 20,
				...(pageNumber === 1 && { total: 1000 }),
				next: { _id: `c${pageNumber}`, username: `c${pageNumber}` },
			};
		});
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(endpoint).toHaveBeenCalledTimes(2));
		act(() => result.current.stop());
		await act(async () => releaseSecondPage());
		await waitFor(() => expect(result.current.isChecking).toBe(false));

		expect(endpoint).toHaveBeenCalledTimes(2);
		expect(result.current.isPartial).toBe(true);
		expect(result.current.isExhausted).toBe(false);
	});

	it('should report an exhausted empty list once the server has no next page', async () => {
		const endpoint = pagesOf(0, { pages: 1 });
		const { result } = renderPreview(endpoint);

		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(result.current.members).toHaveLength(0);
		expect(result.current.isPartial).toBe(false);
	});

	it('should send the group, the search text and the cursor of the last page', async () => {
		const endpoint = pagesOf(PREVIEW_MIN_SHOWN, { pages: 2 });
		const { result } = renderPreview(endpoint, 'ali');

		await waitFor(() => expect(result.current.members).toHaveLength(PREVIEW_MIN_SHOWN));
		act(() => result.current.onEndReached());
		await waitFor(() => expect(result.current.isExhausted).toBe(true));

		expect(endpoint).toHaveBeenNthCalledWith(1, expect.objectContaining({ rid: 'rid', attributes, group: 'loses', filter: 'ali' }));
		expect(endpoint.mock.calls[0][0]).not.toHaveProperty('after');
		expect(endpoint).toHaveBeenNthCalledWith(2, expect.objectContaining({ after: { _id: 'c1', username: 'c1' } }));
	});
});
