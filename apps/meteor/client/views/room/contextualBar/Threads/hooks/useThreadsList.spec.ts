import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useThreadsList } from './useThreadsList';
import { createFakeMessage } from '../../../../../../tests/mocks/data';

const rid = 'room-1';

describe('useThreadsList', () => {
	it('should add a live thread update to the drafts list only when the thread has a draft', async () => {
		const streamRef: StreamControllerRef<'room-messages'> = {};

		const { result } = renderHook(() => useThreadsList({ rid, type: 'drafts', drafts: ['thread-with-draft'] }), {
			wrapper: mockAppRoot()
				.withJohnDoe()
				.withStream('room-messages', streamRef)
				.withEndpoint('GET', '/v1/chat.getThreadsList', () => ({ threads: [], total: 0, count: 0, offset: 0 }))
				.build(),
		});
		await waitFor(() => expect(result.current.data?.items).toEqual([]));

		act(() => {
			streamRef.controller?.emit(rid, [createFakeMessage({ _id: 'thread-with-draft', rid, tcount: 1 })]);
			streamRef.controller?.emit(rid, [createFakeMessage({ _id: 'thread-without-draft', rid, tcount: 1 })]);
		});

		await waitFor(() => expect(result.current.data?.items.map(({ _id }) => _id)).toEqual(['thread-with-draft']));
	});
});
