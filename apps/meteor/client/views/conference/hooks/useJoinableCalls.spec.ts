import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { buildJoinableCall } from '@rocket.chat/ui-conference';
import { act, renderHook, waitFor } from '@testing-library/react';

import { useJoinableCalls } from './useJoinableCalls';

const getJoinable = jest.fn(() => ({ calls: [buildJoinableCall({ callId: 'one' })], success: true }) as any);

const renderCalls = (conferenceWindowEnabled: boolean) => {
	const streamRef: StreamControllerRef<'notify-user'> = {};

	const result = renderHook(() => useJoinableCalls(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled)
			.withStream('notify-user', streamRef)
			.withEndpoint('GET', '/v1/video-conference.joinable', getJoinable)
			.build(),
	});

	return { ...result, streamRef };
};

beforeEach(() => {
	getJoinable.mockClear();
});

it('lists the calls the reader could walk into', async () => {
	const { result } = renderCalls(true);

	await waitFor(() => expect(result.current.calls).toHaveLength(1));

	expect(getJoinable).toHaveBeenCalled();
});

// Nothing reaches a call through this list without the call window, so nothing asks the server for one — no
// query for a list nobody can act on, and no subscription to keep it current.
it('asks for nothing at all without the call window', async () => {
	const { result } = renderCalls(false);

	// Long enough for a query that was going to run to have run.
	await waitFor(() => expect(result.current.isLoading).toBe(false));

	expect(getJoinable).not.toHaveBeenCalled();
	expect(result.current.calls).toEqual([]);
});

// The server's only word that a call started, filled up or ended — nothing here polls. A list that ignored it
// would go on offering a call everybody has left until something unrelated happened to ask again.
it('asks again when the server says a call changed', async () => {
	const { result, streamRef } = renderCalls(true);

	await waitFor(() => expect(result.current.calls).toHaveLength(1));

	getJoinable.mockReturnValueOnce({ calls: [], success: true } as any);

	act(() => {
		streamRef.controller?.emit('john.doe/video-conference', [
			{ action: 'end', params: { callId: 'one', rid: 'room-id', uid: 'john.doe' } },
		]);
	});

	await waitFor(() => expect(result.current.calls).toHaveLength(0));
});
