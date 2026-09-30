const NO_DEVICES: MediaDeviceInfo[] = [];

let devices = NO_DEVICES;
const listeners = new Set<() => void>();

/**
 * Reads the browser's device list again. Labels need permission and the browser does not announce the grant, so
 * whoever obtains it calls this.
 */
export const refreshMediaDevices = (): void => {
	if (!navigator.mediaDevices?.enumerateDevices) {
		return;
	}
	navigator.mediaDevices
		.enumerateDevices()
		.then((list) => {
			// A list read after the last reader left would be stale by the time a new one arrives.
			if (!listeners.size) {
				return;
			}
			devices = list;
			listeners.forEach((listener) => listener());
		})
		.catch(() => undefined);
};

/** Keeps one device list for every reader, listening to the browser only while someone is. */
export const subscribeToMediaDevices = (listener: () => void): (() => void) => {
	listeners.add(listener);
	if (listeners.size === 1) {
		navigator.mediaDevices?.addEventListener?.('devicechange', refreshMediaDevices);
		refreshMediaDevices();
	}

	return () => {
		listeners.delete(listener);
		if (!listeners.size) {
			navigator.mediaDevices?.removeEventListener?.('devicechange', refreshMediaDevices);
			devices = NO_DEVICES;
		}
	};
};

export const getMediaDevices = (): MediaDeviceInfo[] => devices;

export const getServerMediaDevices = (): MediaDeviceInfo[] => NO_DEVICES;
