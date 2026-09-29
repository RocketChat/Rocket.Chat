import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Every camera, microphone and speaker the browser lists, kept current as devices come and go.
 *
 * Ids and groups need no permission; labels do, so a list read before permission was granted comes back unnamed.
 * `refresh` is for reading it again once permission has been granted, which the browser does not announce.
 */
export const useMediaDevices = (): { devices: MediaDeviceInfo[]; refresh: () => void } => {
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
	const mounted = useRef(false);

	const refresh = useCallback(() => {
		if (!navigator.mediaDevices?.enumerateDevices) {
			return;
		}
		navigator.mediaDevices
			.enumerateDevices()
			.then((list) => {
				if (mounted.current) {
					setDevices(list);
				}
			})
			.catch(() => undefined);
	}, []);

	useEffect(() => {
		mounted.current = true;
		refresh();
		// Hot-plug, disconnect, or the system default moving.
		navigator.mediaDevices?.addEventListener?.('devicechange', refresh);

		return () => {
			mounted.current = false;
			navigator.mediaDevices?.removeEventListener?.('devicechange', refresh);
		};
	}, [refresh]);

	return { devices, refresh };
};
