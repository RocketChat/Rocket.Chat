import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { VideoQuality } from '@rocket.chat/ui-conference';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useRef, useState } from 'react';

import { captureOptionsFor } from './useVideoQuality';

export type PreviewVideoOptions = { deviceId?: string; quality?: VideoQuality; onOpen?: () => void };

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: LocalVideoTrack; error: boolean };

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

		// Not `exact`: a camera remembered from an earlier call can be gone, and the preview should still show one.
		void createLocalVideoTrack({
			...(deviceId && { deviceId }),
			...captureOptionsFor(initialQuality),
		})
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.stop();
					return;
				}
				// An unplugged or seized camera ends the track without a render; without this its last frame stays up.
				next.mediaStreamTrack.addEventListener('ended', () => {
					if (!cancelled) {
						setTrack(undefined);
						setError(true);
					}
				});
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
			// What this attempt found is not what the next one will: neither its frame nor its failure is shown again.
			setTrack(undefined);
			setError(false);
		};
	}, [enabled, deviceId, onOpened]);

	// The render that turns the camera off comes before the cleanup that forgets the track.
	const shownTrack = enabled ? track : undefined;
	const shownError = enabled && error;

	// Keeps the LocalVideoTrack identity, and so the element attached to it, stable while changing resolution.
	useEffect(() => {
		if (!shownTrack || (requestedQuality.current?.track === shownTrack && requestedQuality.current.quality === quality)) {
			return;
		}

		let cancelled = false;
		requestedQuality.current = { track: shownTrack, quality };

		void shownTrack
			// The device too: without it the restart opens the browser's default camera.
			.restartTrack({ ...captureOptionsFor(quality), deviceId: shownTrack.mediaStreamTrack.getSettings().deviceId })
			.then(() => {
				if (!cancelled) {
					setError(false);
				}
			})
			.catch((err: unknown) => {
				if (!cancelled) {
					requestedQuality.current = undefined;
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
