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

		void createLocalVideoTrack({ ...(deviceId && { deviceId: { exact: deviceId } }) })
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
		};
	}, [enabled, deviceId, onOpened]);

	// The last track stays in state after the camera goes off, stopped; turning it back on must not show it again.
	const shownTrack = enabled && track?.mediaStreamTrack.readyState !== 'ended' ? track : undefined;
	const shownError = enabled && error;

	return useMemo(() => ({ track: shownTrack, error: shownError }), [shownTrack, shownError]);
};
