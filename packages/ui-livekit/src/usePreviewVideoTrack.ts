import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import type { LocalVideoTrack } from 'livekit-client';
import { createLocalVideoTrack } from 'livekit-client';
import { useEffect, useMemo, useState } from 'react';

export type PreviewVideoOptions = { deviceId?: string; onOpen?: () => void };

/** The preflight's camera, once it is open, and whether opening it failed. */
export type PreviewVideo = { track?: LocalVideoTrack; error: boolean };

const noop = () => undefined;

/**
 * The camera for the preflight, as a LiveKit track opened the way the call will open it.
 *
 * The track is stopped when this unmounts, so the camera light goes out when the preflight does.
 */
export const usePreviewVideoTrack = (enabled: boolean, { deviceId, onOpen = noop }: PreviewVideoOptions): PreviewVideo => {
	const [track, setTrack] = useState<LocalVideoTrack | undefined>();
	const [error, setError] = useState(false);
	const onOpened = useStableCallback(onOpen);

	useEffect(() => {
		if (!enabled) {
			return;
		}

		let cancelled = false;
		let opened: LocalVideoTrack | undefined;

		// Not `exact`: a camera remembered from an earlier call can be gone, and the preview should still show one.
		void createLocalVideoTrack({ ...(deviceId && { deviceId }) })
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.stop();
					return;
				}
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

	return useMemo(() => ({ track: shownTrack, error: shownError }), [shownTrack, shownError]);
};
