import type { StreamControllerRef } from '@rocket.chat/mock-providers';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { videoConferenceInfoQueryKey } from '@rocket.chat/ui-video-conf';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';

import { usePersistentConference } from './usePersistentConference';

const link = {
	_id: 'link-id',
	type: 'videoconference',
	status: 5,
	rid: 'room-id',
	title: 'Weekly sync',
	providerName: 'test',
	createdAt: new Date('2026-11-25T10:00:00.000Z'),
	createdBy: { _id: 'creator', username: 'creator', name: 'Creator' },
	users: [],
	messages: {},
	anonymousUsers: 0,
	conferenceRoomId: 'link-id',
	customUrl: 'weekly-sync',
	capabilities: { mic: true, cam: true },
	chatAccess: { rid: 'room-id', name: 'general', type: 'c', membersWithoutAccess: [], canInvite: true },
	canStart: true,
} as any;

const renderLink = () => {
	const notifyRoom: StreamControllerRef<'notify-room'> = {};
	const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
	const invalidate = jest.spyOn(queryClient, 'invalidateQueries');
	const start = jest.fn(async () => ({ data: { type: 'videoconference', callId: 'call-id' }, success: true }) as any);
	const onStarted = jest.fn();

	const view = renderHook(() => usePersistentConference(link, 'weekly-sync', onStarted), {
		wrapper: mockAppRoot()
			.withJohnDoe()
			.withQueryClient(queryClient)
			.withStream('notify-room', notifyRoom)
			.withEndpoint('POST', '/v1/video-conference.start', start)
			.withEndpoint('POST', '/v1/video-conference.join', async () => ({ url: '', providerName: 'test' }) as any)
			.build(),
	});

	return { ...view, notifyRoom, invalidate, start, onStarted };
};

// Nothing is known about a conference started from somewhere else until the room says so; the event carries the
// call id, which this page cannot match against anything, so any announcement is a reason to read the link again.
it('reads the address again when its room announces a conference', () => {
	const { notifyRoom, invalidate } = renderLink();

	act(() => notifyRoom.controller?.emit('room-id/videoconf', ['some-call']));

	expect(invalidate).toHaveBeenCalledWith({ queryKey: videoConferenceInfoQueryKey('weekly-sync') });
});

it('ignores another room', () => {
	const { notifyRoom, invalidate } = renderLink();

	act(() => notifyRoom.controller?.emit('other-room/videoconf', ['some-call']));

	expect(invalidate).not.toHaveBeenCalled();
});

it('stops listening when unmounted', () => {
	const { notifyRoom, unmount } = renderLink();

	expect(notifyRoom.controller?.has('room-id/videoconf')).toBe(true);
	unmount();
	expect(notifyRoom.controller?.has('room-id/videoconf')).toBe(false);
});

// The conference is named after the link by the server; a title sent along would be a second name for it.
it('starts with the link address and not with a title', async () => {
	const { result, start, onStarted } = renderLink();

	act(() => result.current.start({ state: { mic: true, cam: true }, ring: true }));

	await waitFor(() => expect(onStarted).toHaveBeenCalledWith('call-id'));
	expect(start).toHaveBeenCalledWith({ roomId: 'room-id', customUrl: 'weekly-sync', allowRinging: true, title: undefined });
});
