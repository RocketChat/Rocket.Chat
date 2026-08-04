import { useEffect, useRef, useState } from 'react';

/**
 * A self-view for the preflight screen: the camera, shown before the call has it.
 *
 * The stream is this window's, and the provider will ask for the same device the moment it loads, so every track
 * is stopped when the preview goes away — turning the camera off, or joining, which unmounts the screen. A camera
 * left running here would be a light the user can't explain and a device the call may not get.
 *
 * Failure is not an error state worth a screen of its own: no permission, no camera, or a browser that doesn't
 * offer one all end the same way, with the placeholder the camera-off case already shows.
 */
export const useCameraPreview = (enabled: boolean) => {
	const videoRef = useRef<HTMLVideoElement>(null);
	const [live, setLive] = useState(false);

	useEffect(() => {
		if (!enabled || !navigator.mediaDevices?.getUserMedia) {
			return;
		}

		let stream: MediaStream | undefined;
		let cancelled = false;

		const stop = () => {
			stream?.getTracks().forEach((track) => track.stop());
			stream = undefined;
		};

		void navigator.mediaDevices
			.getUserMedia({ video: true })
			.then((opened) => {
				stream = opened;

				// The toggle flipped, or the screen went away, while the browser was asking the user.
				if (cancelled) {
					stop();
					return;
				}

				if (videoRef.current) {
					videoRef.current.srcObject = opened;
				}
				setLive(true);
			})
			.catch(() => undefined);

		return () => {
			cancelled = true;
			setLive(false);
			stop();
		};
	}, [enabled]);

	return { videoRef, live };
};
