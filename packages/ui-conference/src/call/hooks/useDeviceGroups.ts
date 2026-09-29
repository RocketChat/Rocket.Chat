import { useEffect, useState } from 'react';

/**
 * Which hardware each device id belongs to, as `deviceId → groupId`.
 *
 * The audio devices the app hands around carry an id and a label and nothing else, and a label is not enough to tell
 * a duplicate from a coincidence: the system default is listed twice, once as the `default` alias and once under its
 * own id, and two microphones of the same model are also listed twice. Only `groupId` separates those two cases, and
 * only the browser knows it — so it is asked.
 *
 * Enumeration needs no permission for ids and groups (only labels are withheld), and the menus that use this are
 * open during a call, where permission has been granted anyway.
 */
export const useDeviceGroups = (): Map<string, string> => {
	const [groups, setGroups] = useState<Map<string, string>>(new Map());

	useEffect(() => {
		if (!navigator.mediaDevices?.enumerateDevices) {
			return undefined;
		}

		let cancelled = false;

		const refresh = () => {
			navigator.mediaDevices
				.enumerateDevices()
				.then((devices) => {
					if (cancelled) {
						return;
					}

					setGroups(new Map(devices.filter(({ groupId }) => groupId).map(({ deviceId, groupId }) => [deviceId, groupId])));
				})
				.catch(() => undefined);
		};

		refresh();
		// Hot-plug, disconnect, or the system default moving: the groups move with them.
		navigator.mediaDevices.addEventListener?.('devicechange', refresh);

		return () => {
			cancelled = true;
			navigator.mediaDevices.removeEventListener?.('devicechange', refresh);
		};
	}, []);

	return groups;
};
