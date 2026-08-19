import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Generic hook for a sidebar group boolean preference stored as an inclusive list in localStorage.
 * Defaults to OFF for every group: the store holds only the group keys whose toggle is ON.
 */
export const useGroupsToggle = (storageKey: string) => {
	const [enabledGroups, setEnabledGroups] = useLocalStorage<string[]>(storageKey, []);

	const isEnabled = useCallback((group: string) => enabledGroups.includes(group), [enabledGroups]);

	const toggle = useCallback(
		(group: string) => {
			if (enabledGroups.includes(group)) {
				setEnabledGroups(enabledGroups.filter((item) => item !== group));
			} else {
				setEnabledGroups([...enabledGroups, group]);
			}
		},
		[enabledGroups, setEnabledGroups],
	);

	return { isEnabled, toggle };
};
