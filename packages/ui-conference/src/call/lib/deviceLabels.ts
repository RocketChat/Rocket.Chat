/**
 * A device's name as a person reads it: without the USB vendor:product pair ("Display Audio (05ac:1107)") or the
 * "Default - " prefix browsers add. A parenthetical like "(Built-in)" stays: that is part of the name.
 */
export const deviceName = (label: string): string =>
	label
		// Leading whitespace is left to `trim`: a `\s*` on both sides of the group is quadratic in runs of whitespace.
		.replace(/\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '')
		.replace(/^Default\s+-\s+/i, '')
		.trim();

/** The id browsers give the "whatever the system prefers" alias. */
export const SYSTEM_DEFAULT_DEVICE_ID = 'default';

/**
 * The devices in the order a menu should offer them: the system default first, and its duplicate removed.
 *
 * Browsers list the system default twice, as the `default` alias and under its own id. The alias is kept, so picking
 * it keeps following the system; its twin is found by `groupId`, since two different devices can share a name.
 */
const order = <T>(devices: readonly T[], getId: (device: T) => string, getGroupId: (device: T) => string | undefined): T[] => {
	const systemDefault = devices.find((device) => getId(device) === SYSTEM_DEFAULT_DEVICE_ID);
	const defaultGroupId = systemDefault && getGroupId(systemDefault);

	const rest = devices.filter((device) => device !== systemDefault && !(defaultGroupId && getGroupId(device) === defaultGroupId));

	return systemDefault ? [systemDefault, ...rest] : rest;
};

export const orderDevices = <T extends { deviceId: string; groupId?: string }>(devices: readonly T[]): T[] =>
	order(
		devices,
		({ deviceId }) => deviceId,
		({ groupId }) => groupId,
	);

/**
 * The same for the audio devices the app hands around, which carry only `id` and a label. Pass `groupIds` from
 * `deviceGroupsOf` to drop the alias's twin; without it nothing is collapsed, since a duplicate beats a missing device.
 */
export const orderAudioDevices = <T extends { id: string }>(devices: readonly T[], groupIds?: Map<string, string>): T[] =>
	order(
		devices,
		({ id }) => id,
		({ id }) => groupIds?.get(id),
	);

/**
 * Whether two device ids mean the same hardware: the `default` alias and its concrete twin do. With no groups to go
 * on this is plain equality.
 */
export const isSameDevice = (a: string | undefined, b: string | undefined, groupIds?: Map<string, string>): boolean => {
	if (!a || !b) {
		return false;
	}

	if (a === b) {
		return true;
	}

	const groupA = groupIds?.get(a);
	return Boolean(groupA) && groupA === groupIds?.get(b);
};

/** Which hardware each device id belongs to, as `deviceId → groupId`. */
export const deviceGroupsOf = (devices: readonly Pick<MediaDeviceInfo, 'deviceId' | 'groupId'>[]): Map<string, string> =>
	new Map(devices.filter(({ groupId }) => groupId).map(({ deviceId, groupId }) => [deviceId, groupId]));
