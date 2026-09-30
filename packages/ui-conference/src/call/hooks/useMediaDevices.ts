import { useSyncExternalStore } from 'react';

import { getMediaDevices, getServerMediaDevices, refreshMediaDevices, subscribeToMediaDevices } from '../lib/mediaDevicesStore';

/**
 * Every camera, microphone and speaker the browser lists, kept current as devices come and go.
 *
 * Ids and groups need no permission; labels do, so a list read before permission was granted comes back unnamed.
 * `refresh` is for reading it again once permission has been granted, which the browser does not announce.
 */
export const useMediaDevices = (): { devices: MediaDeviceInfo[]; refresh: () => void } => {
	const devices = useSyncExternalStore(subscribeToMediaDevices, getMediaDevices, getServerMediaDevices);

	return { devices, refresh: refreshMediaDevices };
};
