import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useRefreshTrackFromRoomMessages } from './useRefreshTrackFromRoomMessages';

const buildTrack = (overrides: Partial<PersistentAudioTrack> = {}): PersistentAudioTrack => ({
	id: 'mid1:url',
	url: 'https://example.com/audio.mp3',
	title: 'audio.mp3',
	rid: 'room1',
	mid: 'mid1',
	username: 'john.doe',
	ts: new Date('2024-01-01T00:00:00.000Z'),
	...overrides,
});

const renderWithStream = (track: PersistentAudioTrack | null, updateTrack: jest.Mock) => {
	const roomMessagesRef: StreamControllerRef<'room-messages'> = {};

	renderHook(() => useRefreshTrackFromRoomMessages(track, updateTrack), {
		wrapper: mockAppRoot().withStream('room-messages', roomMessagesRef).build(),
	});

	return roomMessagesRef;
};

describe('useRefreshTrackFromRoomMessages', () => {
	it('refreshes the track when the room stream reports the owning message as pinned', () => {
		const updateTrack = jest.fn();
		const track = buildTrack({ pinned: false });

		const roomMessagesRef = renderWithStream(track, updateTrack);

		roomMessagesRef.controller?.emit(track.rid!, [{ _id: track.mid!, pinned: true } as IMessage]);

		expect(updateTrack).toHaveBeenCalledTimes(1);
		expect(updateTrack).toHaveBeenCalledWith(expect.objectContaining({ id: track.id, pinned: true }));
	});

	it('refreshes the track when the owning message is unpinned', () => {
		const updateTrack = jest.fn();
		const track = buildTrack({ pinned: true });

		const roomMessagesRef = renderWithStream(track, updateTrack);

		roomMessagesRef.controller?.emit(track.rid!, [{ _id: track.mid!, pinned: false } as IMessage]);

		expect(updateTrack).toHaveBeenCalledWith(expect.objectContaining({ id: track.id, pinned: false }));
	});

	it('ignores updates for other messages in the same room', () => {
		const updateTrack = jest.fn();
		const track = buildTrack();

		const roomMessagesRef = renderWithStream(track, updateTrack);

		roomMessagesRef.controller?.emit(track.rid!, [{ _id: 'other-mid', pinned: true } as IMessage]);

		expect(updateTrack).not.toHaveBeenCalled();
	});

	// Covers the committed path only: once the swap has been committed, the resubscribed callback
	// rejects the old message on its id. The `current.id !== id` guard in the hook defends the
	// window *before* that commit, which `rerender` cannot reproduce — it tears the old
	// subscription down synchronously — so that guard is deliberately not claimed here.
	it('ignores a stale event for the previous message once the player has switched tracks', () => {
		const updateTrack = jest.fn();
		const first = buildTrack({ id: 'mid1:url', mid: 'mid1' });
		const second = buildTrack({ id: 'mid2:url', mid: 'mid2' });
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};

		const { rerender } = renderHook(({ track }) => useRefreshTrackFromRoomMessages(track, updateTrack), {
			initialProps: { track: first as PersistentAudioTrack | null },
			wrapper: mockAppRoot().withStream('room-messages', roomMessagesRef).build(),
		});

		rerender({ track: second });

		roomMessagesRef.controller?.emit(first.rid!, [{ _id: first.mid!, pinned: true } as IMessage]);

		expect(updateTrack).not.toHaveBeenCalled();
	});

	it('does nothing when there is no track', () => {
		const updateTrack = jest.fn();

		const roomMessagesRef = renderWithStream(null, updateTrack);

		roomMessagesRef.controller?.emit('room1', [{ _id: 'mid1', pinned: true } as IMessage]);

		expect(updateTrack).not.toHaveBeenCalled();
	});
});
