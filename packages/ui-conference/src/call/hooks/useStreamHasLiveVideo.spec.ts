import { act, renderHook } from '@testing-library/react';

import { useStreamHasLiveVideo } from './useStreamHasLiveVideo';

class FakeTrack extends EventTarget {
	kind = 'video';

	enabled = true;

	muted = false;

	readyState: MediaStreamTrackState = 'live';

	deviceId: string;

	/** A camera names its device; a processor's output has none. */
	constructor(deviceId = 'facetime') {
		super();
		this.deviceId = deviceId;
	}

	getSettings() {
		return { deviceId: this.deviceId };
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

	remove(track: FakeTrack) {
		this.tracks = this.tracks.filter((t) => t !== track);
		this.dispatchEvent(Object.assign(new Event('removetrack'), { track }));
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

it('stops showing a camera taken out of the stream, and stops listening to it', () => {
	const track = new FakeTrack();
	const stream = new FakeStream();
	stream.tracks.push(track);
	const removeEventListener = jest.spyOn(track, 'removeEventListener');

	const { result } = render(stream);
	expect(result.current).toBe(true);

	act(() => stream.remove(track));
	expect(result.current).toBe(false);
	expect(removeEventListener).toHaveBeenCalledWith('mute', expect.any(Function));
});

// A processed track reports `muted` until its first frame and may never announce the unmute, so it is not trusted.
it('shows a muted track with no device behind it', () => {
	const track = new FakeTrack('');
	track.muted = true;
	const stream = new FakeStream();
	stream.tracks.push(track);

	expect(render(stream).result.current).toBe(true);
});

it('does not show a disabled track, device or not', () => {
	const track = new FakeTrack('');
	track.enabled = false;
	const stream = new FakeStream();
	stream.tracks.push(track);

	expect(render(stream).result.current).toBe(false);
});

it('has no video without a stream', () => {
	const { result } = renderHook(() => useStreamHasLiveVideo(null));

	expect(result.current).toBe(false);
});
