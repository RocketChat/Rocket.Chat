import { renderHook } from '@testing-library/react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useCloseOnTrackRoomLeft } from './useCloseOnTrackRoomLeft';

type SubscriptionsChangedCallback = (event: string, subscription: { rid?: string }) => void;

const mockUnsubscribe = jest.fn();
const mockSubscribe = jest.fn((_eventName: string, _callback: SubscriptionsChangedCallback) => mockUnsubscribe);
const mockUserId = { current: 'john.doe' as string | null };

jest.mock('@rocket.chat/ui-contexts', () => ({
	useStream: () => mockSubscribe,
	useUserId: () => mockUserId.current,
}));

const lastCall = () => {
	const call = mockSubscribe.mock.calls.at(-1);
	if (!call) {
		throw new Error('the hook did not subscribe');
	}

	return call;
};

const lastCallback = (): SubscriptionsChangedCallback => lastCall()[1];
const lastEventName = (): string => lastCall()[0];

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

beforeEach(() => {
	mockUserId.current = 'john.doe';
	mockSubscribe.mockClear();
	mockUnsubscribe.mockClear();
});

describe('useCloseOnTrackRoomLeft', () => {
	it("subscribes to the listener's own subscriptions-changed events", () => {
		renderHook(() => useCloseOnTrackRoomLeft(buildTrack(), jest.fn()));

		expect(lastEventName()).toBe('john.doe/subscriptions-changed');
	});

	it('closes the player when the listener loses the subscription to the track room', () => {
		const close = jest.fn();

		renderHook(() => useCloseOnTrackRoomLeft(buildTrack(), close));
		lastCallback()('removed', { rid: 'room1' });

		expect(close).toHaveBeenCalledTimes(1);
	});

	it('does not close the player when another room subscription is removed', () => {
		const close = jest.fn();

		renderHook(() => useCloseOnTrackRoomLeft(buildTrack(), close));
		lastCallback()('removed', { rid: 'other-room' });

		expect(close).not.toHaveBeenCalled();
	});

	it('does not close the player for subscription changes other than removal', () => {
		const close = jest.fn();

		renderHook(() => useCloseOnTrackRoomLeft(buildTrack(), close));
		lastCallback()('updated', { rid: 'room1' });
		lastCallback()('inserted', { rid: 'room1' });

		expect(close).not.toHaveBeenCalled();
	});

	it('leaves playback alone when the origin room of a quote is left, since the quote is still visible', () => {
		const close = jest.fn();

		renderHook(() => useCloseOnTrackRoomLeft(buildTrack({ originMid: 'mid0', originRid: 'room2' }), close));
		lastCallback()('removed', { rid: 'room2' });

		expect(close).not.toHaveBeenCalled();
	});

	it('does not subscribe when no track is active', () => {
		renderHook(() => useCloseOnTrackRoomLeft(null, jest.fn()));

		expect(mockSubscribe).not.toHaveBeenCalled();
	});

	it('does not subscribe when there is no logged in user', () => {
		mockUserId.current = null;

		renderHook(() => useCloseOnTrackRoomLeft(buildTrack(), jest.fn()));

		expect(mockSubscribe).not.toHaveBeenCalled();
	});

	it('unsubscribes from the previous room once the track changes', () => {
		const close = jest.fn();

		const { rerender } = renderHook(({ track }) => useCloseOnTrackRoomLeft(track, close), {
			initialProps: { track: buildTrack() as PersistentAudioTrack | null },
		});

		rerender({ track: buildTrack({ id: 'mid2:url', mid: 'mid2', rid: 'room2' }) });

		expect(mockUnsubscribe).toHaveBeenCalledTimes(1);

		lastCallback()('removed', { rid: 'room1' });

		expect(close).not.toHaveBeenCalled();
	});
});
