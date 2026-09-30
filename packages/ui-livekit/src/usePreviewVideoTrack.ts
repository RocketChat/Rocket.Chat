import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { VideoQuality } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

export type PreviewVideoOptions = { deviceId?: string; quality?: VideoQuality; onOpen?: () => void };

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: LocalVideoTrack; error: boolean };

/** The same presets the in-call picker uses, so a resolution means the same thing on both screens. */
const RESOLUTIONS: Record<Exclude<VideoQuality, 'auto'>, { width: number; height: number }> = {
	h1080: { width: 1920, height: 1080 },
	h720: { width: 1280, height: 720 },
	h360: { width: 640, height: 360 },
	h180: { width: 320, height: 180 },
};

const noop = () => undefined;

/**
 * The camera for the preflight, as a LiveKit track opened the way the call will open it, at the resolution the call
 * will send.
 *
 * The track is stopped when this unmounts, so the camera light goes out when the preflight does.
 */
export const usePreviewVideoTrack = (
	enabled: boolean,
	{ deviceId, quality = 'auto', onOpen = noop }: PreviewVideoOptions,
): PreviewVideo => {
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);
	const onOpened = useStableCallback(onOpen);
	const qualityRef = useRef(quality);
	qualityRef.current = quality;
	const requestedQuality = useRef<{ track: LocalVideoTrack; quality: VideoQuality } | undefined>(undefined);

	// Opens a new camera only when the device changes; a resolution change restarts this track in place below.
	useEffect(() => {
		if (!enabled) {
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
				onOpened();
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
	}, [enabled, deviceId, onOpened]);

	// The last track stays in state after the camera goes off, stopped; turning it back on must not show it again.
	const shownTrack = enabled && track?.mediaStreamTrack.readyState !== 'ended' ? track : undefined;
	const shownError = enabled && error;

	// Keeps the LocalVideoTrack identity, and so the element attached to it, stable while changing resolution.
	useEffect(() => {
		if (!shownTrack || (requestedQuality.current?.track === shownTrack && requestedQuality.current.quality === quality)) {
			return;
		}

		let cancelled = false;
		requestedQuality.current = { track: shownTrack, quality };

		void shownTrack
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
	}, [shownTrack, quality]);

	return useMemo(() => ({ track: shownTrack, error: shownError }), [shownTrack, shownError]);
};
