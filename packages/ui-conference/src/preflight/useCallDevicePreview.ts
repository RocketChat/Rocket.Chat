import { useMediaDevices } from '@rocket.chat/ui-media';
import { useEffect, useState } from 'react';

import type { CallDevices, CallPreferences } from '../hooks/useCallDevicesInitialState';

type CallDevicePreview = {
	/** The local stream to show the user, while the camera is on. Null whenever there is nothing to show. */
	stream: MediaStream | null;
	/** Every camera, microphone and speaker the browser lists. */
	devices: MediaDeviceInfo[];
};

/**
 * The microphone the user is about to arrive on, and every device they could choose, for a provider that can be
 * told which ones to use. Released on unmount, so the call finds the devices free.
 *
 * The lists do not depend on anything being open — a device can be chosen while it is off — but the browser only
 * names them once permission is granted, so they can populate twice.
 */
export const useCallDevicePreview = ({ mic }: CallPreferences, { micId }: CallDevices): CallDevicePreview => {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const { devices, refresh } = useMediaDevices();

	useEffect(() => {
		// Only the microphone is opened here: asking for no track at all is a rejection, not an empty stream.
		if (!mic || !navigator.mediaDevices?.getUserMedia) {
			return;
		}

		let cancelled = false;
		let opened: MediaStream | undefined;

		// A chosen device is preferred rather than required: one remembered from an earlier call can be gone, and the
		// browser's choice beats no microphone. Audio only: the preview's camera is a separate track, and opening it
		// here too would light it twice.
		const constraints: MediaStreamConstraints = { audio: micId ? { deviceId: micId } : true, video: false };

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.getTracks().forEach((track) => track.stop());
					return;
				}
				setStream(next);
				// Only now are the labels populated, so this waits for the permission rather than racing it.
				refresh();
			})
			.catch(() => {
				if (!cancelled) {
					setStream(null);
				}
			});

		return () => {
			cancelled = true;
			opened?.getTracks().forEach((track) => track.stop());
		};
	}, [mic, micId, refresh]);

	// The last stream stays in state after the mic goes off, stopped; turning it back on must not show it again.
	const shownStream = mic && stream?.active ? stream : null;

	return { stream: shownStream, devices };
};
