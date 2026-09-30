import { act, renderHook } from '@testing-library/react';

import { useStreamHasLiveVideo } from './useStreamHasLiveVideo';

class FakeTrack extends EventTarget {
	kind = 'video';

	enabled = true;

	muted = false;

	readyState: MediaStreamTrackState = 'live';

	getSettings() {
		return { deviceId: 'facetime' };
	}

	set(change: 'mute' | 'unmute' | 'ended') {
		if (change === 'ended') {
			this.readyState = 'ended';
		} else {
			this.muted = change === 'mute';
		}
		this.dispatchEvent(new Event(change));
	}
}

class FakeStream extends EventTarget {
	tracks: FakeTrack[] = [];

	getVideoTracks() {
		return this.tracks;
	}

	add(track: FakeTrack) {
		this.tracks.push(track);
		this.dispatchEvent(Object.assign(new Event('addtrack'), { track }));
	}
}

const render = (stream: FakeStream) => renderHook(() => useStreamHasLiveVideo(stream as unknown as MediaStream));

it('follows the camera pausing and resuming', () => {
	const track = new FakeTrack();
	const stream = new FakeStream();
	stream.tracks.push(track);

	const { result } = render(stream);
	expect(result.current).toBe(true);

	act(() => track.set('mute'));
	expect(result.current).toBe(false);

	act(() => track.set('unmute'));
	expect(result.current).toBe(true);
});

it('stops showing a camera that ended', () => {
	const track = new FakeTrack();
	const stream = new FakeStream();
	stream.tracks.push(track);

	const { result } = render(stream);

	act(() => track.set('ended'));
	expect(result.current).toBe(false);
});

// The stream stays the same object when a camera is added to it, so the hook has to hear it from the stream.
it('shows a camera added to the stream, and follows it from then on', () => {
	const stream = new FakeStream();
	const { result } = render(stream);
	expect(result.current).toBe(false);

	const track = new FakeTrack();
	act(() => stream.add(track));
	expect(result.current).toBe(true);

	act(() => track.set('mute'));
	expect(result.current).toBe(false);
});

it('has no video without a stream', () => {
	const { result } = renderHook(() => useStreamHasLiveVideo(null));

	expect(result.current).toBe(false);
});
