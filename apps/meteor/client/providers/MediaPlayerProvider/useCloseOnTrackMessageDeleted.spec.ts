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

	it('closes when deleteMessageBulk lists the track id even though excludePinned/ignoreDiscussion would exclude it', () => {
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
				excludePinned: true,
				ignoreDiscussion: true,
				ts: { $gt: new Date() },
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

	it('does not close the player for a prune that excludes pinned messages, since the tracked pin state is a snapshot', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const close = jest.fn();
		const track = buildTrack();

		renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
			{ rid: track.rid!, excludePinned: true, ignoreDiscussion: false, ts: { $gt: new Date(0) }, users: [] },
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

	describe('when the audio was played from a quote', () => {
		const originTs = new Date('2023-12-31T00:00:00.000Z');
		const buildQuotedTrack = (overrides: Partial<PersistentAudioTrack> = {}) =>
			buildTrack({ id: 'mid2:url', mid: 'mid2', originMid: 'mid1', originTs, ...overrides });

		it('closes the player when deleteMessage targets the original quoted message', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'mid1' }]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('still closes the player when deleteMessage targets the quoting message', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'mid2' }]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('does not close the player when deleteMessage targets an unrelated message', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'other-mid' }]);

			expect(close).not.toHaveBeenCalled();
		});

		it('closes the player when the original quoted message is soft-deleted (t: rm)', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			roomMessagesRef.controller?.emit(track.rid!, [{ _id: 'mid1', t: 'rm' } as any]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes the player when deleteMessageBulk ids include the original quoted message', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

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
					ids: ['mid1'],
				},
			]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes the player when a prune by ts range covers the original but not the quoting message', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
				{
					rid: track.rid!,
					excludePinned: false,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('does not evaluate the original against a prune filtered by users, since its author is unknown', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
				{
					rid: track.rid!,
					excludePinned: false,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: ['someone-else'],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('does not evaluate the original against a prune that excludes pinned messages, since its pinned state is unknown', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
				{
					rid: track.rid!,
					excludePinned: true,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('does not evaluate the original against a prune that ignores discussions, since its discussion is unknown', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
				{
					rid: track.rid!,
					excludePinned: false,
					ignoreDiscussion: true,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('still closes for an explicit id even when the prune excludes pinned and ignores discussions', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildQuotedTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessageBulk`, [
				{
					rid: track.rid!,
					excludePinned: true,
					ignoreDiscussion: true,
					ts: { $gt: new Date(0) },
					users: [],
					ids: ['mid1'],
				},
			]);

			expect(close).toHaveBeenCalledTimes(1);
		});
	});

	describe('when the quoted original lives in another room', () => {
		const originTs = new Date('2023-12-31T00:00:00.000Z');
		const buildCrossRoomTrack = (overrides: Partial<PersistentAudioTrack> = {}) =>
			buildTrack({ id: 'mid2:url', mid: 'mid2', originMid: 'mid1', originTs, originRid: 'room2', ...overrides });

		it('closes the player when the original is deleted in its own room', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessage', [{ _id: 'mid1' }]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes the player when the original is soft-deleted (t: rm) in its own room', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			roomMessagesRef.controller?.emit('room2', [{ _id: 'mid1', t: 'rm' } as any]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('closes the player when a bulk delete in the origin room lists the original', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessageBulk', [
				{ rid: 'room2', excludePinned: false, ignoreDiscussion: false, ts: { $gt: new Date(0) }, users: [], ids: ['mid1'] },
			]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('still closes the player when the quoting message itself is deleted in its own room', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'mid2' }]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('does not close the player when the origin id is announced in the quoting room instead', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit(`${track.rid}/deleteMessage`, [{ _id: 'mid1' }]);

			expect(close).not.toHaveBeenCalled();
		});

		it('closes the player when an unfiltered ts prune in the origin room covers the original', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessageBulk', [
				{
					rid: 'room2',
					excludePinned: false,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).toHaveBeenCalledTimes(1);
		});

		it('does not evaluate the original against a prune that excludes pinned messages, since a stored quote never learns it was pinned', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessageBulk', [
				{
					rid: 'room2',
					excludePinned: true,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('does not evaluate the original against a prune that ignores discussions, since a stored quote never learns it became one', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessageBulk', [
				{
					rid: 'room2',
					excludePinned: false,
					ignoreDiscussion: true,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: [],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('does not evaluate the original against a prune filtered by users, since its author is still unknown', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();
			const track = buildCrossRoomTrack();

			renderHook(() => useCloseOnTrackMessageDeleted(track, close), {
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			notifyRef.controller?.emit('room2/deleteMessageBulk', [
				{
					rid: 'room2',
					excludePinned: false,
					ignoreDiscussion: false,
					ts: { $gt: new Date('2023-12-30T00:00:00.000Z'), $lt: new Date('2023-12-31T12:00:00.000Z') },
					users: ['someone-else'],
				},
			]);

			expect(close).not.toHaveBeenCalled();
		});

		it('unsubscribes from the origin room when the track changes', () => {
			const notifyRef: StreamControllerRef<'notify-room'> = {};
			const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
			const close = jest.fn();

			const { rerender } = renderHook(({ track }) => useCloseOnTrackMessageDeleted(track, close), {
				initialProps: { track: buildCrossRoomTrack() as PersistentAudioTrack | null },
				wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
			});

			rerender({ track: buildTrack() });

			notifyRef.controller?.emit('room2/deleteMessage', [{ _id: 'mid1' }]);

			expect(close).not.toHaveBeenCalled();
		});
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
