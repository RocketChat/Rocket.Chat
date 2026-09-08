import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useCloseOnTrackMessageDeleted } from './useCloseOnTrackMessageDeleted';

const buildTrack = (overrides: Partial<PersistentAudioTrack> = {}): PersistentAudioTrack => ({
	id: 'mid1:url',
	url: 'https://example.com/audio.mp3',
	title: 'audio.mp3',
	rid: 'room1',
	mid: 'mid1',
	username: 'john.doe',
	ts: new Date('2024-01-01T00:00:00.000Z'),
	pinned: false,
	...overrides,
});

describe('useCloseOnTrackMessageDeleted', () => {
	it('closes the player when deleteMessage matches the track message id', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: track.mid! }]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('does not close the player when deleteMessage targets another message id', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'other-mid' }]);

		expect(close).not.toHaveBeenCalled();
	});

	it('closes the player when room-messages delivers a soft-deleted (t: rm) update for the track message', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		roomMessagesRef.controller?.emit(track.rid!, [{ _id: track.mid!, t: 'rm' } as any]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('does not close the player when room-messages delivers an update for the track message without t: rm', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		roomMessagesRef.controller?.emit(track.rid!, [{ _id: track.mid! } as any]);

		expect(close).not.toHaveBeenCalled();
	});

	it('closes the player when deleteMessageBulk targets the track message id', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
			{
				rid: track.rid!,
				excludePinned: false,
				ignoreDiscussion: false,
				ts: { $gt: new Date(0) },
				users: [],
				ids: [track.mid!],
			},
		]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('does not close the player when deleteMessageBulk ids do not include the track message', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
			{
				rid: track.rid!,
				excludePinned: false,
				ignoreDiscussion: false,
				ts: { $gt: new Date(0) },
				users: [],
				ids: ['other-mid'],
			},
		]);

		expect(close).not.toHaveBeenCalled();
	});

	it('closes the player when deleteMessageBulk matches by ts range and user, without ids', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
			{
				rid: track.rid!,
				excludePinned: false,
				ignoreDiscussion: false,
				ts: { $gt: new Date(0) },
				users: [track.username!],
			},
		]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('does not close the player when deleteMessageBulk targets a different user, without ids', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
			{
				rid: track.rid!,
				excludePinned: false,
				ignoreDiscussion: false,
				ts: { $gt: new Date(0) },
				users: ['someone-else'],
			},
		]);

		expect(close).not.toHaveBeenCalled();
	});

	it('does not close the player when deleteMessageBulk ignores discussions and the track belongs to one, but closes when it does not', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const closeDiscussion = jest.fn();
		const closeNonDiscussion = jest.fn();
		const discussionTrack = buildTrack({ drid: 'disc1' });
		const nonDiscussionTrack = buildTrack({ drid: undefined });

		const { rerender } = renderHook(({ track, close }) => useCloseOnTrackMessageDeleted(track, close), {
			initialProps: { track: discussionTrack as PersistentAudioTrack | null, close: closeDiscussion },
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		const bulkParams = {
			rid: discussionTrack.rid!,
			excludePinned: false,
			ignoreDiscussion: true,
			ts: { $gt: new Date(0) },
			users: [],
		};

		notifyRef.controller?.emit(`${discussionTrack.rid}/deleteMessageBulk`, [bulkParams]);

		expect(closeDiscussion).not.toHaveBeenCalled();

		rerender({ track: nonDiscussionTrack, close: closeNonDiscussion });

		notifyRef.controller?.emit(`${nonDiscussionTrack.rid}/deleteMessageBulk`, [bulkParams]);

		expect(closeNonDiscussion).toHaveBeenCalledTimes(1);
	});

	it('does not subscribe to streams when track is null', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();

		renderHook(() => useCloseOnTrackMessageDeleted(null, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		expect(notifyRef.controller?.has(`room1/deleteMessage`)).toBe(false);
		expect(close).not.toHaveBeenCalled();
	});

	it('unsubscribes from the previous track when the track changes, so old events no longer trigger close', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const firstTrack = buildTrack();
		const secondTrack = buildTrack({ id: 'mid2:url', mid: 'mid2' });

		const { rerender } = renderHook(({ track }) => useCloseOnTrackMessageDeleted(track, close), {
			initialProps: { track: firstTrack as PersistentAudioTrack | null },
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		rerender({ track: secondTrack });

		notifyRef.controller?.emit(`${firstTrack.rid}/deleteMessage`, [{ _id: firstTrack.mid! }]);

		expect(close).not.toHaveBeenCalled();
	});
});
