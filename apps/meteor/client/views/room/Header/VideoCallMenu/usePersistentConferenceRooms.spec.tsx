import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePersistentConferenceRooms } from './usePersistentConferenceRooms';

let mockConnected = true;

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useConnectionStatus: () => ({ connected: mockConnected, status: mockConnected ? 'connected' : 'waiting' }),
}));

const room = (_id: string, title: string, ongoingCallId?: string) => ({
	_id,
	rid: 'room-id',
	title,
	url: title.toLowerCase().replace(/ /g, '-'),
	providerName: 'livekit',
	createdAt: '2026-11-25T10:00:00.000Z',
	_updatedAt: '2026-11-25T10:00:00.000Z',
	createdBy: { _id: 'creator', username: 'creator', name: 'Creator' },
	...(ongoingCallId && { ongoingCallId }),
});

const renderRooms = ({
	list = jest.fn(async () => ({ rooms: [room('retro', 'Retro'), room('standup', 'Daily standup', 'call-1')] })),
} = {}) => {
	const notifyRoom: StreamControllerRef<'notify-room'> = {};
	const dispatchToast = jest.fn();

	const view = renderHook(() => usePersistentConferenceRooms('room-id'), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withStream('notify-room', notifyRoom)
			.withToastMessageDispatch(dispatchToast)
			.withEndpoint('GET', '/v1/video-conference.rooms.list', list as any)
			.build(),
	});

	return { ...view, list, notifyRoom, dispatchToast };
};

beforeEach(() => {
	mockConnected = true;
});

it('maps the rooms to links, ongoing from ongoingCallId', async () => {
	const { result } = renderRooms();

	await waitFor(() => expect(result.current.data).toBeDefined());

	expect(result.current.data).toEqual([
		{ _id: 'retro', title: 'Retro', url: 'retro', ongoing: false },
		{ _id: 'standup', title: 'Daily standup', url: 'daily-standup', ongoing: true },
	]);
});

it('keeps the order of the answer', async () => {
	const list = jest.fn(async () => ({ rooms: [room('z', 'Zulu'), room('a', 'Alpha'), room('m', 'Mike')] }));
	const { result } = renderRooms({ list });

	await waitFor(() => expect(result.current.data).toBeDefined());

	expect(result.current.data?.map(({ _id }) => _id)).toEqual(['z', 'a', 'm']);
});

it('asks for the room it was given once', async () => {
	const { result, list } = renderRooms();

	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	expect(list).toHaveBeenCalledTimes(1);
	expect(list).toHaveBeenCalledWith({ roomId: 'room-id' });
});

// The event carries a call id that says nothing about which link it belongs to, so any announcement is a reason to
// read the links again.
it('reads the list again when its room announces a conference', async () => {
	const { result, list, notifyRoom } = renderRooms();
	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	act(() => notifyRoom.controller?.emit('room-id/videoconf', ['some-call']));

	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
});

it('ignores another room', async () => {
	const { result, list, notifyRoom } = renderRooms();
	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	act(() => notifyRoom.controller?.emit('other-room/videoconf', ['some-call']));

	await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
	expect(list).toHaveBeenCalledTimes(1);
});

it('stops listening when unmounted', async () => {
	const { result, notifyRoom, unmount } = renderRooms();
	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	expect(notifyRoom.controller?.has('room-id/videoconf')).toBe(true);

	unmount();

	expect(notifyRoom.controller?.has('room-id/videoconf')).toBe(false);
});

// A link that started or ended while the socket was down was announced to nobody here.
it('reads the list once more when the connection returns', async () => {
	const { result, list, rerender } = renderRooms();
	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	mockConnected = false;
	rerender();
	mockConnected = true;
	rerender();

	await waitFor(() => expect(list).toHaveBeenCalledTimes(2));
	await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
	expect(list).toHaveBeenCalledTimes(2);
});

it('does not read twice on mount', async () => {
	const { result, list } = renderRooms();
	await waitFor(() => expect(result.current.isSuccess).toBe(true));

	await act(() => new Promise((resolve) => setTimeout(resolve, 50)));
	expect(list).toHaveBeenCalledTimes(1);
});

it('gives no links and no toast when the list cannot be read', async () => {
	const list = jest.fn(() => Promise.reject({ success: false, error: 'error-not-allowed' }));
	const { result, dispatchToast } = renderRooms({ list: list as any });

	await waitFor(() => expect(result.current.isError).toBe(true));

	expect(result.current.data).toBeUndefined();
	expect(dispatchToast).not.toHaveBeenCalled();
});
