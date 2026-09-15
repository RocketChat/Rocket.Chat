import { useEffect, useState } from 'react';

/**
 * Returns true while the given stream has at least one video track that is
 * actually producing frames — `enabled`, not `muted`, and `live`. This is the
 * signal a UI should use to decide whether to render the `<video>` element or
 * fall back to an avatar.
 *
 * A MediaStream object can outlive its useful video state: LiveKit (and the
 * MediaStreamTrack API in general) flips `track.muted`/`track.enabled` when
 * the camera is paused, but the stream reference doesn't change. Subscribers
 * to mute/unmute/ended events on each track + addtrack/removetrack on the
 * stream keep this hook accurate.
 */
/**
 * Whether this particular track is producing frames.
 *
 * `muted` is the awkward one. A camera reports it while paused, which is exactly what this hook is for — but a
 * *synthetic* track, the kind a processor hands back after transforming each frame, reports `muted` until its first
 * frame arrives and does not reliably announce when that happens. Waiting for an unmute that never comes is how a
 * blurred self-view ends up as an empty tile.
 *
 * Synthetic tracks are told apart by having no device behind them: a real camera track always names one, so a paused
 * camera still correctly falls back to the avatar.
 */
const isProducingFrames = (track: MediaStreamTrack): boolean => {
	if (!track.enabled || track.readyState !== 'live') {
		return false;
	}

	const isSynthetic = !track.getSettings().deviceId;
	return isSynthetic || !track.muted;
};

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
