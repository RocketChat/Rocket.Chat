import type { DeviceSelection } from './DeviceSelectionContext';
import { SYSTEM_DEFAULT_DEVICE_ID, deviceGroupsOf, deviceName, isSameDevice, orderDevices } from '../call/lib/deviceLabels';

export type DeviceRow = { id: string; name: string; systemDefault: boolean };

/** The devices of one kind as a menu offers them, so a device reads the same before a call and inside one. */
export const deviceMenuRows = (devices: MediaDeviceInfo[], kind: MediaDeviceKind): DeviceRow[] =>
	orderDevices(devices.filter((device) => device.kind === kind)).map((device) => ({
		id: device.deviceId,
		name: deviceName(device.label),
		systemDefault: device.deviceId === SYSTEM_DEFAULT_DEVICE_ID,
	}));

/**
 * The device in use: the one chosen, or with nothing chosen, the first on offer. Matched by hardware, so the
 * `default` alias stands for its concrete twin, which the menu leaves out.
 */
export const selectedDevice = (rows: DeviceRow[], chosenId: string | undefined, groupIds?: Map<string, string>): DeviceRow | undefined => {
	if (!chosenId) {
		return rows[0];
	}
	return rows.find((row) => isSameDevice(row.id, chosenId, groupIds));
};

/**
 * One kind's rows and the one of them in use. Grouped within the kind: `default` is the id of the system's
 * microphone and of its speaker alike, and the two are different hardware.
 */
export const deviceMenuSelection = ({ devices, selectedIds }: Pick<DeviceSelection, 'devices' | 'selectedIds'>, kind: MediaDeviceKind) => {
	const rows = deviceMenuRows(devices, kind);
	const groups = deviceGroupsOf(devices.filter((device) => device.kind === kind));
	return { rows, selected: selectedDevice(rows, selectedIds[kind], groups) };
};
