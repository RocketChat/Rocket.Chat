import { useLocalStorage } from '@rocket.chat/fuselage-hooks';
import { useCallback } from 'react';

/**
 * Controls the "Show unreads" behavior of the system/standard sidebar groups (Teams, Channels, …).
 * Custom categories keep this flag on their own preference object instead.
 *
 * Defaults to OFF (preserving the classic collapsed-group behavior): localStorage only stores
 * the group keys whose toggle has been turned ON.
 */
export const useShowUnreadsGroups = () => {
	const [shownUnreadGroups, setShownUnreadGroups] = useLocalStorage<string[]>('sidebarShownUnreadGroups', []);

	const isShowUnreads = useCallback((group: string) => shownUnreadGroups.includes(group), [shownUnreadGroups]);

	const toggleShowUnreads = useCallback(
		(group: string) => {
			if (shownUnreadGroups.includes(group)) {
				setShownUnreadGroups(shownUnreadGroups.filter((item) => item !== group));
			} else {
				setShownUnreadGroups([...shownUnreadGroups, group]);
			}
		},
		[shownUnreadGroups, setShownUnreadGroups],
	);

	return { isShowUnreads, toggleShowUnreads };
};
