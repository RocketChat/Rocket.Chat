import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useVideoCallRoomAction } from './useVideoCallRoomAction';
import { createFakeRoom } from '../../../tests/mocks/data';

const startCall = jest.fn();
const dispatchOutgoing = jest.fn();
const loadCapabilities = jest.fn(() => Promise.resolve());

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfStartCall: () => startCall,
	useVideoConfDispatchOutgoing: () => dispatchOutgoing,
	useVideoConfLoadCapabilities: () => loadCapabilities,
	useVideoConfIsCalling: () => false,
	useVideoConfIsRinging: () => false,
}));

const fakeRoom = createFakeRoom({ t: 'c' });

jest.mock('../../views/room/contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
}));

const renderAction = (conferenceWindowEnabled: boolean) =>
	renderHook(() => useVideoCallRoomAction(), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withPermission('call-management')
			.withSetting('VideoConf_Conference_Window_Enabled', conferenceWindowEnabled)
			.build(),
	});

beforeEach(() => {
	startCall.mockClear();
	dispatchOutgoing.mockClear();
	loadCapabilities.mockClear();
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
