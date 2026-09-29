import { useEffect, useState } from 'react';

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

/**
 * Whether the stream has a video track producing frames — what decides between its `<video>` and the avatar. Kept
 * current as tracks pause, end or come and go, since the stream itself stays the same object throughout.
 */
export const useStreamHasLiveVideo = (stream?: MediaStream | null): boolean => {
	const [hasLive, setHasLive] = useState(false);

	useEffect(() => {
		if (!stream) {
			setHasLive(false);
			return;
		}

		const update = () => {
			const live = stream.getVideoTracks().some(isProducingFrames);
			setHasLive(live);
		};

		update();

		const trackOffs: Array<() => void> = [];
		const attachTrackListeners = (t: MediaStreamTrack) => {
			t.addEventListener('mute', update);
			t.addEventListener('unmute', update);
			t.addEventListener('ended', update);
			trackOffs.push(() => {
				t.removeEventListener('mute', update);
				t.removeEventListener('unmute', update);
				t.removeEventListener('ended', update);
			});
		};
		stream.getVideoTracks().forEach(attachTrackListeners);

		const onAddTrack = (e: MediaStreamTrackEvent) => {
			if (e.track.kind === 'video') attachTrackListeners(e.track);
			update();
		};
		const onRemoveTrack = () => update();
		stream.addEventListener('addtrack', onAddTrack);
		stream.addEventListener('removetrack', onRemoveTrack);

		return () => {
			trackOffs.forEach((off) => off());
			stream.removeEventListener('addtrack', onAddTrack);
			stream.removeEventListener('removetrack', onRemoveTrack);
		};
	}, [stream]);

	return hasLive;
};
