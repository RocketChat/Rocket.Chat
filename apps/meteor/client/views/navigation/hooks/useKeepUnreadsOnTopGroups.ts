import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Controls the "Keep unreads on top" behavior of the system/standard sidebar groups (Teams, Channels, …).
 * Custom categories keep this flag on their own preference object instead.
 *
 * Defaults to OFF: localStorage only stores the group keys whose toggle has been turned ON.
 */
export const useKeepUnreadsOnTopGroups = () => {
	const [keepOnTopGroups, setKeepOnTopGroups] = useLocalStorage<string[]>('sidebarKeepUnreadsOnTopGroups', []);

	const isKeepUnreadsOnTop = useCallback((group: string) => keepOnTopGroups.includes(group), [keepOnTopGroups]);

	const toggleKeepUnreadsOnTop = useCallback(
		(group: string) => {
			if (keepOnTopGroups.includes(group)) {
				setKeepOnTopGroups(keepOnTopGroups.filter((item) => item !== group));
			} else {
				setKeepOnTopGroups([...keepOnTopGroups, group]);
			}
		},
		[keepOnTopGroups, setKeepOnTopGroups],
	);

	return { isKeepUnreadsOnTop, toggleKeepUnreadsOnTop };
};
