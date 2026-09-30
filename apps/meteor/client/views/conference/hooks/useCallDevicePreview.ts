import type { CallDevices, CallPreferences } from '@rocket.chat/ui-conference';
import { useMediaDevices } from '@rocket.chat/ui-conference';
import { useEffect, useMemo, useState } from 'react';

type CallDevicePreview = {
	/** The local stream to show the user, while the camera is on. Null whenever there is nothing to show. */
	stream: MediaStream | null;
	videoInputs: MediaDeviceInfo[];
	audioInputs: MediaDeviceInfo[];
	audioOutputs: MediaDeviceInfo[];
	/** Set when the browser refused — no permission, or no device. The screen says so rather than showing nothing. */
	error: boolean;
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
	const [error, setError] = useState(false);

	useEffect(() => {
		// Only the microphone is opened here: asking for no track at all is a rejection, not an empty stream.
		if (!mic || !navigator.mediaDevices?.getUserMedia) {
			setStream(null);
			return;
		}

		let cancelled = false;
		let opened: MediaStream | undefined;

		// A chosen device is asked for exactly; with none chosen, whatever the browser prefers. Audio only: the
		// preview's camera is a separate track, and opening it here too would light it twice.
		const constraints: MediaStreamConstraints = { audio: micId ? { deviceId: { exact: micId } } : true, video: false };

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then((next) => {
				opened = next;
				if (cancelled) {
					next.getTracks().forEach((track) => track.stop());
					return;
				}
				setError(false);
				setStream(next);
				// Only now are the labels populated, so this waits for the permission rather than racing it.
				refresh();
			})
			.catch(() => {
				if (!cancelled) {
					setError(true);
					setStream(null);
				}
			});

		return () => {
			cancelled = true;
			opened?.getTracks().forEach((track) => track.stop());
		};
	}, [mic, micId, refresh]);

	const videoInputs = useMemo(() => devices.filter(({ kind }) => kind === 'videoinput'), [devices]);
	const audioInputs = useMemo(() => devices.filter(({ kind }) => kind === 'audioinput'), [devices]);
	const audioOutputs = useMemo(() => devices.filter(({ kind }) => kind === 'audiooutput'), [devices]);

	return { stream, videoInputs, audioInputs, audioOutputs, error };
};
