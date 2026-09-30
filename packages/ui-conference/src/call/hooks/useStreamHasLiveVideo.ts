import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether this track is producing frames.
 *
 * A paused camera reports `muted`, but so does a synthetic track — what a processor hands back — until its first
 * frame, and it does not reliably announce the unmute. Synthetic tracks have no device behind them, so `muted` is
 * only trusted for tracks that name one.
 */
const isProducingFrames = (track: MediaStreamTrack): boolean => {
	if (!track.enabled || track.readyState !== 'live') {
		return false;
	}

	const isSynthetic = !track.getSettings().deviceId;
	return isSynthetic || !track.muted;
};

/** Calls `onChange` whenever one of the stream's video tracks pauses, resumes or ends, or a track comes or goes. */
const subscribeToVideoTracks = (stream: MediaStream, onChange: () => void): (() => void) => {
	const trackOffs: Array<() => void> = [];
	const attachTrackListeners = (t: MediaStreamTrack) => {
		t.addEventListener('mute', onChange);
		t.addEventListener('unmute', onChange);
		t.addEventListener('ended', onChange);
		trackOffs.push(() => {
			t.removeEventListener('mute', onChange);
			t.removeEventListener('unmute', onChange);
			t.removeEventListener('ended', onChange);
		});
	};
	stream.getVideoTracks().forEach(attachTrackListeners);

	const onAddTrack = (e: MediaStreamTrackEvent) => {
		if (e.track.kind === 'video') attachTrackListeners(e.track);
		onChange();
	};
	stream.addEventListener('addtrack', onAddTrack);
	stream.addEventListener('removetrack', onChange);

	return () => {
		trackOffs.forEach((off) => off());
		stream.removeEventListener('addtrack', onAddTrack);
		stream.removeEventListener('removetrack', onChange);
	};
};

const noSubscription = () => undefined;

/**
 * Whether the stream has a video track producing frames — what decides between its `<video>` and the avatar. Kept
 * current as tracks pause, end or come and go, since the stream itself stays the same object throughout.
 */
export const useStreamHasLiveVideo = (stream?: MediaStream | null): boolean => {
	const subscribe = useCallback((onChange: () => void) => (stream ? subscribeToVideoTracks(stream, onChange) : noSubscription), [stream]);

	return useSyncExternalStore(subscribe, () => stream?.getVideoTracks().some(isProducingFrames) ?? false);
};
