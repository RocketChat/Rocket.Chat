import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';

import { useVideoCallRoomAction } from './useVideoCallRoomAction';
import { createFakeRoom } from '../../../tests/mocks/data';

const startCall = jest.fn();
const dispatchOutgoing = jest.fn();
const loadCapabilities = jest.fn(() => Promise.resolve());
const dispatchWarning = jest.fn();

jest.mock('../../views/room/contextualBar/VideoConference/hooks/useVideoConfWarning', () => ({
	useVideoConfWarning: () => dispatchWarning,
}));

jest.mock('@rocket.chat/ui-video-conf', () => ({
	...jest.requireActual('@rocket.chat/ui-video-conf'),
	useVideoConfStartCall: () => startCall,
	useVideoConfDispatchOutgoing: () => dispatchOutgoing,
	useVideoConfLoadCapabilities: () => loadCapabilities,
	useVideoConfIsCalling: () => false,
	useVideoConfIsRinging: () => false,
}));

let fakeRoom = createFakeRoom({ t: 'c' });
let subscribed = true;

jest.mock('../../views/room/contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useUserIsSubscribed: () => subscribed,
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
	fakeRoom = createFakeRoom({ t: 'c' });
	subscribed = true;
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

// The point of checking first: a provider that isn't there has to be said out loud, and nothing may open on top
// of the answer — an empty call window is a worse way to learn the provider is misconfigured.
it.each([true, false])('says so and opens nothing when the provider is unavailable (call window: %s)', async (windowEnabled) => {
	loadCapabilities.mockRejectedValueOnce({ error: 'error-videoconf-provider-not-configured' });

	const { result } = renderAction(windowEnabled);

	await act(() => result.current?.action?.());

	expect(dispatchWarning).toHaveBeenCalledWith('error-videoconf-provider-not-configured');
	expect(startCall).not.toHaveBeenCalled();
	expect(dispatchOutgoing).not.toHaveBeenCalled();
});

// A channel open as a preview, before joining it, can't hold a call this user starts: the button says to join first
// rather than opening a call that fails.
it('asks the user to join first in a room they have not joined', () => {
	subscribed = false;

	const { result } = renderAction(true);

	expect(result.current?.disabled).toBe(true);
	expect(result.current?.tooltip).toBe('Join_the_room_to_start_a_call');
});

it('offers the call in a room the user has joined', () => {
	const { result } = renderAction(true);

	expect(result.current?.disabled).toBeFalsy();
	expect(result.current?.tooltip).toBeUndefined();
});

// Joining would not help in a room that can't hold a call at all, so that is what it says.
it('says the room cannot hold a call, rather than to join, when joining would not help', () => {
	subscribed = false;
	fakeRoom = createFakeRoom({ t: 'c', archived: true });

	const { result } = renderAction(true);

	expect(result.current?.disabled).toBe(true);
	expect(result.current?.tooltip).not.toBe('Join_the_room_to_start_a_call');
});

// Agents serve an omnichannel room without having joined it.
it('does not ask an agent to join an omnichannel room', () => {
	subscribed = false;
	fakeRoom = createFakeRoom({ t: 'l' });

	const { result } = renderAction(true);

	expect(result.current?.tooltip).not.toBe('Join_the_room_to_start_a_call');
});
