import type { ISubscription, IUser } from '@rocket.chat/core-typings';
import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useCloseOnTrackRoomLeft } from './useCloseOnTrackRoomLeft';

const buildTrack = (overrides: Partial<PersistentAudioTrack> = {}): PersistentAudioTrack => ({
	id: 'mid1:url',
	url: 'https://example.com/audio.mp3',
	title: 'audio.mp3',
	rid: 'room1',
	mid: 'mid1',
	...overrides,
});

const subscription = (rid: string) => ({ rid }) as ISubscription;

const renderWithStream = (initialTrack: PersistentAudioTrack) => {
	const notifyUser: StreamControllerRef<'notify-user'> = {};
	const close = jest.fn();

	const { rerender } = renderHook(({ track }) => useCloseOnTrackRoomLeft(track, close), {
		initialProps: { track: initialTrack },
		wrapper: mockAppRoot()
			.withUser({ _id: 'user1' } as IUser)
			.withStream('notify-user', notifyUser)
			.build(),
	});

	return { notifyUser, close, rerender };
};

describe('useCloseOnTrackRoomLeft', () => {
	it('closes the player when the user loses the track room', () => {
		const { notifyUser, close } = renderWithStream(buildTrack());

		notifyUser.controller?.emit('user1/subscriptions-changed', ['removed', subscription('room1')]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('keeps playing when another room is removed or the track room subscription only changes', () => {
		const { notifyUser, close } = renderWithStream(buildTrack());

		notifyUser.controller?.emit('user1/subscriptions-changed', ['removed', subscription('other-room')]);
		notifyUser.controller?.emit('user1/subscriptions-changed', ['updated', subscription('room1')]);

		expect(close).not.toHaveBeenCalled();
	});

	it('stops watching the previous room once the track changes', () => {
		const { notifyUser, close, rerender } = renderWithStream(buildTrack());

		rerender({ track: buildTrack({ id: 'mid2:url', rid: 'room2', mid: 'mid2' }) });
		notifyUser.controller?.emit('user1/subscriptions-changed', ['removed', subscription('room1')]);

		expect(close).not.toHaveBeenCalled();
	});
});
