import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';

import type { PersistentAudioTrack } from './MediaPlayerContext';
import { useMediaPlayer } from './MediaPlayerContext';
import MediaPlayerProvider from './MediaPlayerProvider';

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

const wrapper = ({ children }: { children: ReactNode }) => {
	const AppRoot = mockAppRoot().build();
	return (
		<AppRoot>
			<MediaPlayerProvider>{children}</MediaPlayerProvider>
		</AppRoot>
	);
};

// jsdom does not implement media playback.
beforeAll(() => {
	Object.defineProperty(HTMLMediaElement.prototype, 'play', { configurable: true, value: jest.fn().mockResolvedValue(undefined) });
	Object.defineProperty(HTMLMediaElement.prototype, 'load', { configurable: true, value: jest.fn() });
});

describe('MediaPlayerProvider updateTrack', () => {
	it('adopts new mutable state for the active track', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.play(buildTrack({ pinned: false })));

		expect(result.current.track?.pinned).toBe(false);

		act(() => result.current.updateTrack(buildTrack({ pinned: true })));

		expect(result.current.track?.pinned).toBe(true);
	});

	// A message is not expected to gain a discussion id after it exists, so this is defensive:
	// should the descriptors ever disagree, the player takes the one the message currently renders
	// rather than keeping a value it can no longer justify.
	it('refreshes the discussion id when the supplied descriptor differs', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.play(buildTrack()));

		expect(result.current.track?.drid).toBeUndefined();

		act(() => result.current.updateTrack(buildTrack({ drid: 'disc1' })));

		expect(result.current.track?.drid).toBe('disc1');
	});

	it('ignores an update describing a different track', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.play(buildTrack({ pinned: false })));
		act(() => result.current.updateTrack(buildTrack({ id: 'mid2:url', mid: 'mid2', pinned: true })));

		expect(result.current.track?.id).toBe('mid1:url');
		expect(result.current.track?.pinned).toBe(false);
	});

	it('ignores an update when no track is active', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.updateTrack(buildTrack({ pinned: true })));

		expect(result.current.track).toBeNull();
	});

	it('keeps the same track object when nothing mutable changed, so the player does not re-render', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.play(buildTrack()));

		const before = result.current.track;

		act(() => result.current.updateTrack(buildTrack()));

		expect(result.current.track).toBe(before);
	});

	it('does not disturb the url or identity of the active track', () => {
		const { result } = renderHook(() => useMediaPlayer(), { wrapper });

		act(() => result.current.play(buildTrack()));
		act(() => result.current.updateTrack(buildTrack({ pinned: true })));

		expect(result.current.track?.url).toBe('https://example.com/audio.mp3');
		expect(result.current.track?.mid).toBe('mid1');
	});
});
