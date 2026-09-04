import { mockAppRoot } from '@rocket.chat/mock-providers';
import { renderHook, waitFor } from '@testing-library/react';

import { useJoinableCalls } from './useJoinableCalls';
import { buildJoinableCall } from '../testFixtures';

const getJoinable = jest.fn(() => ({ calls: [buildJoinableCall({ callId: 'one' })], success: true }) as any);

const renderCalls = (conferenceWindowEnabled: boolean) =>
	renderHook(() => useJoinableCalls(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled)
			.withEndpoint('GET', '/v1/video-conference.joinable', getJoinable)
			.build(),
	});

beforeEach(() => {
	getJoinable.mockClear();
});

it('lists the calls the reader could walk into', async () => {
	const { result } = renderCalls(true);

	await waitFor(() => expect(result.current.calls).toHaveLength(1));

	expect(getJoinable).toHaveBeenCalled();
});

// Nothing reaches a call through this list without the call window, so nothing asks the server for one. The
// query is what would otherwise poll `video-conference.joinable` every twenty seconds, for every logged-in user
// of every workspace, for a list none of them can act on.
it('asks for nothing at all without the call window', async () => {
	const { result } = renderCalls(false);

	// Long enough for a query that was going to run to have run.
	await waitFor(() => expect(result.current.isLoading).toBe(false));

	expect(getJoinable).not.toHaveBeenCalled();
	expect(result.current.calls).toEqual([]);
});
