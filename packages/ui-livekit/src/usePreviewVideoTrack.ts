import type { VideoQuality } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

export type PreviewVideoOptions = { deviceId?: string; quality: VideoQuality };

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: LocalVideoTrack; error: boolean };

/** The same presets the in-call picker uses, so a resolution means the same thing on both screens. */
const RESOLUTIONS: Record<Exclude<VideoQuality, 'auto'>, { width: number; height: number }> = {
	h1080: { width: 1920, height: 1080 },
	h720: { width: 1280, height: 720 },
	h360: { width: 640, height: 360 },
	h180: { width: 320, height: 180 },
};

/**
 * The camera for the preflight, as a LiveKit track at the resolution the call will send.
 *
 * The track is stopped when this unmounts, so the camera light goes out when the preflight does.
 */
export const usePreviewVideoTrack = (enabled: boolean, { deviceId, quality }: PreviewVideoOptions): PreviewVideo => {
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);
	const qualityRef = useRef(quality);
	qualityRef.current = quality;
	const requestedQuality = useRef<{ track: LocalVideoTrack; quality: VideoQuality } | undefined>(undefined);

	// Open a new camera only when the device changes. Resolution changes restart this track in place below.
	useEffect(() => {
		if (!enabled) {
			requestedQuality.current = undefined;
			setTrack(undefined);
			return;
		}

		let cancelled = false;
		let opened: LocalVideoTrack | undefined;
		const initialQuality = qualityRef.current;

		void createLocalVideoTrack({
			...(deviceId && { deviceId: { exact: deviceId } }),
			...(initialQuality !== 'auto' && { resolution: RESOLUTIONS[initialQuality] }),
		})
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.stop();
					return;
				}
				requestedQuality.current = { track: next, quality: initialQuality };
				setError(false);
				setTrack(next);
			})
			.catch(() => {
				if (!cancelled) {
					setError(true);
					setTrack(undefined);
				}
			});

		return () => {
			cancelled = true;
			// Stopped rather than left running: a preview nobody is looking at should not keep the camera light on.
			opened?.stop();
		};
	}, [enabled, deviceId]);

	// Keeps the LocalVideoTrack identity, and so the element attached to it, stable while changing resolution.
	useEffect(() => {
		if (!track || (requestedQuality.current?.track === track && requestedQuality.current.quality === quality)) {
			return;
		}

		let cancelled = false;
		requestedQuality.current = { track, quality };

		void track
			.restartTrack(quality === 'auto' ? {} : { resolution: RESOLUTIONS[quality] })
			.then(() => {
				if (!cancelled) {
					setError(false);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					setError(true);
					console.warn('the preview camera would not change resolution', err);
				}
			});

		return () => {
			cancelled = true;
		};
	}, [track, quality]);

	return useMemo(() => ({ track, error }), [track, error]);
};
