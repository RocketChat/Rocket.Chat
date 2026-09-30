import { SYSTEM_DEFAULT_DEVICE_ID, deviceName, orderDevices } from '../call/lib/deviceLabels';

export type DeviceRow = { id: string; name: string; systemDefault: boolean };

/**
 * The devices as a menu offers them, ordered and named the way the in-call pickers do, so a device reads the same
 * before a call and inside one.
 */
export const deviceMenuRows = (devices: MediaDeviceInfo[]): DeviceRow[] =>
	orderDevices(devices).map((device) => ({
		id: device.deviceId,
		name: deviceName(device.label),
		systemDefault: device.deviceId === SYSTEM_DEFAULT_DEVICE_ID,
	}));

/** The device in use: the one chosen, or with nothing chosen, the first on offer. */
export const selectedDevice = (rows: DeviceRow[], chosenId: string | undefined): DeviceRow | undefined => {
	const id = chosenId ?? rows[0]?.id;
	return rows.find((row) => row.id === id);
};
