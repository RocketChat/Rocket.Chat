const NO_DEVICES: MediaDeviceInfo[] = [];

let devices = NO_DEVICES;
const listeners = new Set<() => void>();
// Bumped by every read and by the last reader leaving, so only the newest read of the current readers publishes.
let generation = 0;

const sameDevices = (a: MediaDeviceInfo[], b: MediaDeviceInfo[]): boolean =>
	a.length === b.length &&
	a.every(
		(device, i) =>
			device.deviceId === b[i].deviceId && device.kind === b[i].kind && device.label === b[i].label && device.groupId === b[i].groupId,
	);

/**
 * Reads the browser's device list again. Labels need permission and the browser does not announce the grant, so
 * whoever obtains it calls this.
 */
export const refreshMediaDevices = (): void => {
	if (!navigator.mediaDevices?.enumerateDevices) {
		return;
	}
	const read = ++generation;
	navigator.mediaDevices
		.enumerateDevices()
		.then((list) => {
			// Overtaken by a newer read, or read for readers who have all left since.
			if (read !== generation) {
				return;
			}
			// The same list again keeps the same snapshot, so readers are not rendered for nothing.
			if (sameDevices(devices, list)) {
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
			generation++;
		}
	};
};

export const getMediaDevices = (): MediaDeviceInfo[] => devices;

export const getServerMediaDevices = (): MediaDeviceInfo[] => NO_DEVICES;
