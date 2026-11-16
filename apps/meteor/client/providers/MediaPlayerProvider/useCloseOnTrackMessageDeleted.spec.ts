import type { IMessage } from '@rocket.chat/core-typings';
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
	...overrides,
});

const bulkDelete = (ids: string[]) => ({
	rid: 'room1',
	excludePinned: true,
	ignoreDiscussion: true,
	ts: { $gt: new Date() },
	users: [],
	ids,
});

const streamedMessage = (fields: Pick<IMessage, '_id'> & Partial<IMessage>) => fields as IMessage;

const renderWithStreams = (initialTrack: PersistentAudioTrack) => {
	const notifyRoom: StreamControllerRef<'notify-room'> = {};
	const roomMessages: StreamControllerRef<'room-messages'> = {};
	const close = jest.fn();

	const { rerender } = renderHook(({ track }) => useCloseOnTrackMessageDeleted(track, close), {
		initialProps: { track: initialTrack },
		wrapper: mockAppRoot().withStream('notify-room', notifyRoom).withStream('room-messages', roomMessages).build(),
	});

	return { notifyRoom, roomMessages, close, rerender };
};

describe('useCloseOnTrackMessageDeleted', () => {
	it('closes the player when the track message is deleted', () => {
		const { notifyRoom, close } = renderWithStreams(buildTrack());

		notifyRoom.controller?.emit('room1/deleteMessage', [{ _id: 'mid1' }]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('closes the player when a bulk delete lists the track message, whatever its filters say', () => {
		const { notifyRoom, close } = renderWithStreams(buildTrack());

		notifyRoom.controller?.emit('room1/deleteMessageBulk', [bulkDelete(['other', 'mid1'])]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('closes the player when the track message is soft deleted', () => {
		const { roomMessages, close } = renderWithStreams(buildTrack());

		roomMessages.controller?.emit('room1', [streamedMessage({ _id: 'mid1', t: 'rm' })]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('closes the player when the quoted original is deleted in the same room', () => {
		const { notifyRoom, close } = renderWithStreams(buildTrack({ originMid: 'origin1' }));

		notifyRoom.controller?.emit('room1/deleteMessage', [{ _id: 'origin1' }]);

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('keeps playing when other messages are deleted or the track message is only updated', () => {
		const { notifyRoom, roomMessages, close } = renderWithStreams(buildTrack());

		notifyRoom.controller?.emit('room1/deleteMessage', [{ _id: 'other' }]);
		notifyRoom.controller?.emit('room1/deleteMessageBulk', [bulkDelete(['other'])]);
		roomMessages.controller?.emit('room1', [streamedMessage({ _id: 'mid1' })]);

		expect(close).not.toHaveBeenCalled();
	});

	it('stops watching the previous track once the track changes', () => {
		const { notifyRoom, close, rerender } = renderWithStreams(buildTrack());

		rerender({ track: buildTrack({ id: 'mid2:url', rid: 'room2', mid: 'mid2' }) });
		notifyRoom.controller?.emit('room1/deleteMessage', [{ _id: 'mid1' }]);

		expect(close).not.toHaveBeenCalled();
	});
});
