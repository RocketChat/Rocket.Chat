import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot, type StreamControllerRef } from '@rocket.chat/mock-providers';
import { renderHook } from '@testing-library/react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useCloseOnTrackMessageDeleted } from './useCloseOnTrackMessageDeleted';

// The hook reads only `_id` and `t`, so a stream event is built from those rather than a full message.
const streamedMessage = (fields: Pick<IMessage, '_id'> & Partial<IMessage>) => fields as IMessage;

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

		roomMessagesRef.controller?.emit(track.rid!, [streamedMessage({ _id: track.mid!, t: 'rm' })]);

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

		roomMessagesRef.controller?.emit(track.rid!, [streamedMessage({ _id: track.mid! })]);

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
		const track = buildTrack({ pinned: true, drid: 'disc1' });

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

	it('does not close the player when deleteMessageBulk excludes pinned messages and the track is pinned, but closes when it is not', () => {
		const notifyRef: StreamControllerRef<'notify-room'> = {};
		const roomMessagesRef: StreamControllerRef<'room-messages'> = {};
		const closePinned = jest.fn();
		const closeUnpinned = jest.fn();

		const { rerender } = renderHook(({ track, close }) => useCloseOnTrackMessageDeleted(track, close), {
			initialProps: { track: buildTrack({ pinned: true }) as PersistentAudioTrack | null, close: closePinned },
			wrapper: mockAppRoot().withStream('notify-room', notifyRef).withStream('room-messages', roomMessagesRef).build(),
		});

		const bulkParams = { rid: 'room1', excludePinned: true, ignoreDiscussion: false, ts: { $gt: new Date(0) }, users: [] };

		notifyRef.controller?.emit('room1/deleteMessageBulk', [bulkParams]);

		expect(closePinned).not.toHaveBeenCalled();

		rerender({ track: buildTrack({ pinned: false }), close: closeUnpinned });

		notifyRef.controller?.emit('room1/deleteMessageBulk', [bulkParams]);

		expect(closeUnpinned).toHaveBeenCalledTimes(1);
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

	describe('when the audio was played from a quote that does not name its origin room', () => {
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

			roomMessagesRef.controller?.emit(track.rid!, [streamedMessage({ _id: 'mid1', t: 'rm' })]);

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
