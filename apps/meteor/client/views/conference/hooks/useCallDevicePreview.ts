import { useEffect, useMemo, useState } from 'react';

import type { CallDevices, CallPreferences } from './useCallPreferences';

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
 * A live look at the devices the user is about to arrive on, for a provider that can actually be told which
 * ones to use.
 *
 * The point is that this screen stops guessing. Before, it could only say *that* the camera would be on, because
 * a URL-based provider takes no device — so a self-view would have promised a choice the screen couldn't make.
 * A provider running the call in here takes both, so the honest thing is to show what will be sent.
 *
 * Enumeration is deliberately separate from the preview: a device can be *chosen* while it is switched off — a
 * user who arrives muted may still care which microphone gets unmuted later — so the lists do not depend on
 * anything being open. Opening the preview is what earns the permission that puts *names* on those entries;
 * until then the browser returns them unnamed, which is why the list can populate twice.
 *
 * Everything is released when this unmounts, so the call gets the devices back rather than finding them busy.
 */
export const useCallDevicePreview = (enabled: boolean, { mic, cam }: CallPreferences, { micId, camId }: CallDevices): CallDevicePreview => {
	const [stream, setStream] = useState<MediaStream | null>(null);
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const [error, setError] = useState(false);

	// Nothing is asked of the browser unless the microphone is actually on. The camera is not this hook's concern any
	// more, but `cam` still matters to the *labels*: permission for either is what puts names on the device lists.
	const wanted = enabled && (mic || cam);

	// The lists, kept current on their own. `devicechange` covers a headset arriving or leaving mid-decision.
	useEffect(() => {
		if (!enabled || !navigator.mediaDevices?.enumerateDevices) {
			return;
		}

		let cancelled = false;
		const refresh = () => {
			void navigator.mediaDevices.enumerateDevices().then((list) => {
				if (!cancelled) {
					setDevices(list);
				}
			});
		};

		refresh();
		navigator.mediaDevices.addEventListener?.('devicechange', refresh);

		return () => {
			cancelled = true;
			navigator.mediaDevices.removeEventListener?.('devicechange', refresh);
		};
	}, [enabled]);

	useEffect(() => {
		if (!wanted || !navigator.mediaDevices?.getUserMedia) {
			setStream(null);
			return;
		}

		let cancelled = false;
		let opened: MediaStream | undefined;

		// A chosen device is asked for exactly; with none chosen, whatever the browser prefers.
		const wantDevice = (on: boolean, deviceId?: string): boolean | MediaTrackConstraints => {
			if (!on) {
				return false;
			}
			return deviceId ? { deviceId: { exact: deviceId } } : true;
		};

		// Audio only. The camera is opened by `usePreviewVideoTrack` as a LiveKit track, because a track is what a blur
		// processor can attach to — opening it here as well would light the camera twice for one preview.
		const constraints: MediaStreamConstraints = { audio: wantDevice(mic, micId), video: false };

		navigator.mediaDevices
			.getUserMedia(constraints)
			.then(async (next) => {
				opened = next;
				if (cancelled) {
					next.getTracks().forEach((track) => track.stop());
					return;
				}
				setError(false);
				setStream(next);
				// Only now are the labels populated, so this waits for the permission rather than racing it.
				setDevices(await navigator.mediaDevices.enumerateDevices());
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
	}, [wanted, mic, cam, micId, camId]);

	const videoInputs = useMemo(() => devices.filter(({ kind }) => kind === 'videoinput'), [devices]);
	const audioInputs = useMemo(() => devices.filter(({ kind }) => kind === 'audioinput'), [devices]);
	const audioOutputs = useMemo(() => devices.filter(({ kind }) => kind === 'audiooutput'), [devices]);

	return { stream, videoInputs, audioInputs, audioOutputs, error };
};
