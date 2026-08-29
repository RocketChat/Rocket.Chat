/**
 * Browsers dress a device's name up twice over: the USB vendor:product pair identifies the hardware to the machine
 * rather than to the person choosing it — "Display Audio (05ac:1107)" — and the one the system prefers is prefixed
 * "Default - ". Both are dropped from the name; a menu that shows the prefix says it properly instead, on a line of
 * its own where it reads as a fact about the device rather than as part of what it is called.
 *
 * A parenthetical like "(Built-in)" stays: that is part of the name.
 */
export const deviceName = (label: string): string =>
	label
		.replace(/\s*\([0-9a-f]{4}:[0-9a-f]{4}\)\s*$/i, '')
		.replace(/^Default\s+-\s+/i, '')
		.trim();

/** The id browsers give the "whatever the system prefers" alias. */
export const SYSTEM_DEFAULT_DEVICE_ID = 'default';

/**
 * The devices in the order a menu should offer them: the system default first, and its duplicate removed.
 *
 * Browsers list the system default *twice* — once as the `default` alias, and again under its own id. Both name the
 * same hardware, so offering both is offering the same choice twice, and picking the second one silently opts out of
 * following the system later. The alias is the one kept, and its twin is found by `groupId`, which the two share.
 * Matching on the name instead would collapse genuinely different devices that happen to be called the same thing,
 * which two displays generally are.
 *
 * The default goes first because it is the one that will be used if nothing is picked, so it is the one that should
 * already be under the cursor.
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
 * The same for the audio devices the app hands around, which carry `id` and a label and nothing else.
 *
 * `groupIds` is how the duplicate gets found here: a label cannot tell a duplicate from a coincidence, since two
 * microphones of the same model are listed twice for a completely different reason than the system default is. Pass
 * the browser's own `deviceId → groupId` map — see `useDeviceGroups` — and the alias's twin goes, exactly as it does
 * for a `MediaDeviceInfo`. Without the map, ordering still applies and nothing is collapsed: better a duplicate than
 * a device silently missing from the list.
 */
export const orderAudioDevices = <T extends { id: string }>(devices: readonly T[], groupIds?: Map<string, string>): T[] =>
	order(
		devices,
		({ id }) => id,
		({ id }) => groupIds?.get(id),
	);

/**
 * Whether two device ids mean the same hardware.
 *
 * Not the same question as whether they are equal. The system default is listed twice — as the `default` alias and
 * under its own id — and different parts of the app hold different halves of that pair: a menu that has deduped the
 * list keeps the alias, while the app's own idea of the selected device is whichever came first out of
 * `enumerateDevices`, which is usually the concrete one. Comparing ids alone then finds no match and the menu shows
 * nothing selected at all, for a device that is very much in use.
 *
 * With no groups to go on this is plain equality, which is the safe answer: two ids that share nothing knowable are
 * two devices.
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
