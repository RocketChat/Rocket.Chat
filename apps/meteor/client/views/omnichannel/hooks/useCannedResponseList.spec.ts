import { MockedAppRootBuilder } from '@rocket.chat/mock-providers/dist/MockedAppRootBuilder';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useCannedResponseList } from './useCannedResponseList';

const SERVER_LIMIT = 10;

const cannedResponses = Array.from({ length: 35 }, (_, index) => ({
	_id: `canned-response-${index}`,
	shortcut: `shortcut-${index}`,
	text: `text-${index}`,
	scope: 'global',
	_createdAt: new Date().toISOString(),
	_updatedAt: new Date().toISOString(),
}));

const mockGetCannedResponses = jest.fn(({ offset, count }: { offset: number; count: number }) => {
	const items = cannedResponses.slice(offset, offset + Math.min(count, SERVER_LIMIT));

	return { cannedResponses: items, count: items.length, offset, total: cannedResponses.length };
});

const appRoot = new MockedAppRootBuilder()
	.withEndpoint('GET', '/v1/canned-responses', mockGetCannedResponses as any)
	.withEndpoint('GET', '/v1/livechat/department', () => ({ departments: [], count: 0, offset: 0, total: 0 }));

it('should load every canned response when the server returns fewer items than requested', async () => {
	const { result } = renderHook(() => useCannedResponseList({ filter: '', type: 'all' }), { wrapper: appRoot.build() });

	await waitFor(() => expect(result.current.data?.cannedItems).toHaveLength(SERVER_LIMIT));

	while (result.current.hasNextPage) {
		await act(() => result.current.fetchNextPage());
	}

	expect(result.current.data?.cannedItems.map(({ _id }) => _id)).toEqual(cannedResponses.map(({ _id }) => _id));
	expect(mockGetCannedResponses.mock.calls.map(([{ offset }]) => offset)).toEqual([0, 10, 20, 30]);
});
