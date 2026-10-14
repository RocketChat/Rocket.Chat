import { beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

import { createFakeRoom } from '../../../tests/mocks/data';

const startCall = fn<FunctionLike>();
const dispatchOutgoing = fn<FunctionLike>();
const loadCapabilities = fn<FunctionLike>(() => Promise.resolve());
const dispatchWarning = fn<FunctionLike>();

const fakeRoom = createFakeRoom({ t: 'c' });

const { useVideoCallRoomAction } = proxyquire.noCallThru().load<typeof import('./useVideoCallRoomAction')>('./useVideoCallRoomAction', {
	'@rocket.chat/ui-video-conf': {
		...require('@rocket.chat/ui-video-conf'),
		useVideoConfStartCall: () => startCall,
		useVideoConfDispatchOutgoing: () => dispatchOutgoing,
		useVideoConfLoadCapabilities: () => loadCapabilities,
		useVideoConfIsCalling: () => false,
		useVideoConfIsRinging: () => false,
	},
	'../../views/room/contexts/RoomContext': {
		useRoom: () => fakeRoom,
	},
	'../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning': {
		useVideoConfWarning: () => dispatchWarning,
	},
});

const renderAction = (conferenceWindowEnabled: boolean) =>
	renderHook(() => useVideoCallRoomAction(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withPermission('call-management')
			.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled)
			.build(),
	});

describe('useVideoCallRoomAction', () => {
	beforeEach(() => {
		startCall.mockClear();
		dispatchOutgoing.mockClear();
		dispatchWarning.mockClear();
		loadCapabilities.mockReset();
		loadCapabilities.mockImplementation(() => Promise.resolve());
	});

	// The call window asks how to arrive before it starts anything, so a popup asking the same thing first is one
	// confirmation too many.
	it('opens the call window straight away when it will ask for itself', async () => {
		const { result } = renderAction(true);

		await act(() => result.current?.action?.());

		expect(startCall).toHaveBeenCalledWith(fakeRoom._id);
		expect(dispatchOutgoing).not.toHaveBeenCalled();
	});

	// Without a preflight, the popup is still where mic and camera are chosen.
	it('asks in the room when there is no call window to ask', async () => {
		const { result } = renderAction(false);

		await act(() => result.current?.action?.());

		expect(dispatchOutgoing).toHaveBeenCalledWith({ rid: fakeRoom._id });
		expect(startCall).not.toHaveBeenCalled();
	});

	// Whatever opens, the provider being unavailable has to surface before a window does.
	it('checks the provider first either way', async () => {
		const { result } = renderAction(true);

		await act(() => result.current?.action?.());

		expect(loadCapabilities).toHaveBeenCalled();
	});

	[true, false].forEach((windowEnabled) => {
		it(`says so and opens nothing when the provider is unavailable (call window: ${windowEnabled})`, async () => {
			loadCapabilities.mockRejectedValueOnce({ error: 'error-videoconf-provider-not-configured' });

			const { result } = renderAction(windowEnabled);

			await act(() => result.current?.action?.());

			expect(dispatchWarning).toHaveBeenCalledWith('error-videoconf-provider-not-configured');
			expect(startCall).not.toHaveBeenCalled();
			expect(dispatchOutgoing).not.toHaveBeenCalled();
		});
	});
});
