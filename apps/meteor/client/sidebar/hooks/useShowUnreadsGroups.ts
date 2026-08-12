import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Controls the "Show unreads" behavior of the system/standard sidebar groups (Teams, Channels, …).
 * Custom categories keep this flag on their own preference object instead.
 *
 * Defaults to ON for every group (matching custom categories, whose `showUnreads` defaults to true).
 * localStorage stores only the group keys whose toggle has been turned OFF.
 */
export const useShowUnreadsGroups = () => {
	const [hiddenUnreadGroups, setHiddenUnreadGroups] = useLocalStorage<string[]>('sidebarHiddenUnreadGroups', []);

	const isShowUnreads = useCallback((group: string) => !hiddenUnreadGroups.includes(group), [hiddenUnreadGroups]);

	const toggleShowUnreads = useCallback(
		(group: string) => {
			if (hiddenUnreadGroups.includes(group)) {
				setHiddenUnreadGroups(hiddenUnreadGroups.filter((item) => item !== group));
			} else {
				setHiddenUnreadGroups([...hiddenUnreadGroups, group]);
			}
		},
		[hiddenUnreadGroups, setHiddenUnreadGroups],
	);

	return { isShowUnreads, toggleShowUnreads };
};
